const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Helper function to update isLowStock and StockAlert
async function updateStockAlert(connection, inventoryItemId, warehouseId, quantity, minLevel, userId) {
  const isLowStock = quantity <= minLevel;
  
  // Update isLowStock
  await connection.execute(
    'UPDATE StockLevel SET isLowStock = ? WHERE inventoryItemId = ? AND warehouseId = ?',
    [isLowStock ? 1 : 0, inventoryItemId, warehouseId]
  );
  
  // Update or create StockAlert
  if (quantity <= minLevel) {
    const alertType = quantity <= 0 ? 'out_of_stock' : 'low_stock';
    const severity = quantity <= 0 ? 'critical' : 'warning';
    const message = quantity <= 0 
      ? `الصنف منتهٍ تماماً (0 قطعة)`
      : `المخزون منخفض: ${quantity} / ${minLevel}`;
    
    // Check if alert exists
    const [existingAlert] = await connection.execute(
      'SELECT id FROM StockAlert WHERE inventoryItemId = ? AND warehouseId = ? AND status = "active"',
      [inventoryItemId, warehouseId]
    );
    
    if (existingAlert.length > 0) {
      // Update existing alert
      await connection.execute(`
        UPDATE StockAlert 
        SET alertType = ?, currentQuantity = ?, threshold = ?, severity = ?, message = ?, createdAt = NOW()
        WHERE id = ?
      `, [alertType, quantity, minLevel, severity, message, existingAlert[0].id]);
    } else {
      // Create new alert
      await connection.execute(`
        INSERT INTO StockAlert 
        (inventoryItemId, warehouseId, alertType, currentQuantity, threshold, severity, status, message, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?, NOW())
      `, [inventoryItemId, warehouseId, alertType, quantity, minLevel, severity, message]);
    }
  } else {
    // Resolve active alerts if stock is now above minLevel
    await connection.execute(`
      UPDATE StockAlert 
      SET status = 'resolved', resolvedAt = NOW()
      WHERE inventoryItemId = ? AND warehouseId = ? AND status = 'active'
    `, [inventoryItemId, warehouseId]);
  }
}

// Get all invoice items
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM InvoiceItem');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching invoice items:', err);
    res.status(500).send('Server Error');
  }
});

// Get invoice item by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM InvoiceItem WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Invoice item not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching invoice item with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new invoice item
router.post('/', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { quantity, unitPrice, totalPrice, invoiceId, partsUsedId, inventoryItemId, warehouseId } = req.body;
    const userId = req.user?.id;
    
    if (!quantity || !unitPrice || !totalPrice || !invoiceId) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        success: false,
        message: 'الكمية والسعر والإجمالي ومعرف الفاتورة مطلوبة' 
      });
    }
    
    // إنشاء InvoiceItem
    const [result] = await connection.execute(
      'INSERT INTO InvoiceItem (quantity, unitPrice, totalPrice, invoiceId, partsUsedId, inventoryItemId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [quantity, unitPrice, totalPrice, invoiceId, partsUsedId || null, inventoryItemId || null]
    );
    
    // إذا كان InvoiceItem يحتوي على inventoryItemId ولم يكن مربوطاً بـ PartsUsed، تحديث المخزون
    if (inventoryItemId && !partsUsedId) {
      // الحصول على warehouseId
      let targetWarehouseId = warehouseId;
      if (!targetWarehouseId) {
        const [stockLevel] = await connection.execute(
          'SELECT warehouseId, minLevel FROM StockLevel WHERE inventoryItemId = ? AND deletedAt IS NULL LIMIT 1',
          [inventoryItemId]
        );
        targetWarehouseId = stockLevel.length > 0 ? stockLevel[0].warehouseId : null;
      }
      
      if (targetWarehouseId) {
        // التحقق من وجود كمية كافية
        const [stockLevel] = await connection.execute(
          'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ? AND deletedAt IS NULL',
          [inventoryItemId, targetWarehouseId]
        );
        
        if (stockLevel.length > 0) {
          const availableQuantity = stockLevel[0].quantity || 0;
          if (availableQuantity < quantity) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ 
              success: false,
              message: `الكمية المتاحة (${availableQuantity}) أقل من المطلوب (${quantity})` 
            });
          }
          
          // تحديث StockLevel
          await connection.execute(
            `UPDATE StockLevel 
             SET quantity = quantity - ?, updatedAt = NOW()
             WHERE inventoryItemId = ? AND warehouseId = ?`,
            [quantity, inventoryItemId, targetWarehouseId]
          );
          
          // إنشاء StockMovement
          await connection.execute(
            `INSERT INTO StockMovement (type, quantity, inventoryItemId, fromWarehouseId, userId, notes, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            ['OUT', quantity, inventoryItemId, targetWarehouseId, userId, `إضافة للفاتورة #${invoiceId}`]
          );
          
          // تحديث StockAlert
          const newQuantity = availableQuantity - quantity;
          const minLevel = stockLevel[0].minLevel || 0;
          await updateStockAlert(connection, inventoryItemId, targetWarehouseId, newQuantity, minLevel, userId);
        }
      }
    }
    
    await connection.commit();
    connection.release();
    
    res.status(201).json({ 
      success: true,
      id: result.insertId, 
      quantity, 
      unitPrice, 
      totalPrice, 
      invoiceId, 
      partsUsedId,
      inventoryItemId 
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('Error creating invoice item:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server Error',
      details: err.message 
    });
  }
});

// Update an invoice item
router.put('/:id', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { quantity, unitPrice, totalPrice, invoiceId, partsUsedId, inventoryItemId, warehouseId } = req.body;
    const userId = req.user?.id;
    
    if (!quantity || !unitPrice || !totalPrice || !invoiceId) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        success: false,
        message: 'الكمية والسعر والإجمالي ومعرف الفاتورة مطلوبة' 
      });
    }
    
    // جلب البيانات الحالية
    const [current] = await connection.execute(
      'SELECT * FROM InvoiceItem WHERE id = ?',
      [id]
    );
    
    if (current.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ 
        success: false,
        message: 'عنصر الفاتورة غير موجود' 
      });
    }
    
    const currentItem = current[0];
    const quantityDiff = quantity - currentItem.quantity;
    const newInventoryItemId = inventoryItemId || currentItem.inventoryItemId;
    
    // إذا كان InvoiceItem يحتوي على inventoryItemId ولم يكن مربوطاً بـ PartsUsed، تحديث المخزون
    if (newInventoryItemId && !partsUsedId) {
      // الحصول على warehouseId
      let targetWarehouseId = warehouseId;
      if (!targetWarehouseId) {
        const [stockLevel] = await connection.execute(
          'SELECT warehouseId, minLevel FROM StockLevel WHERE inventoryItemId = ? AND deletedAt IS NULL LIMIT 1',
          [newInventoryItemId]
        );
        targetWarehouseId = stockLevel.length > 0 ? stockLevel[0].warehouseId : null;
      }
      
      if (targetWarehouseId) {
        // إذا تغيرت الكمية، تحديث المخزون
        if (quantityDiff !== 0) {
          // التحقق من وجود كمية كافية إذا زادت الكمية
          if (quantityDiff > 0) {
            const [stockLevel] = await connection.execute(
              'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ? AND deletedAt IS NULL',
              [newInventoryItemId, targetWarehouseId]
            );
            
            if (stockLevel.length > 0) {
              const availableQuantity = stockLevel[0].quantity || 0;
              if (availableQuantity < quantityDiff) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ 
                  success: false,
                  message: `الكمية المتاحة (${availableQuantity}) أقل من المطلوب (${quantityDiff})` 
                });
              }
            }
          }
          
          // تحديث StockLevel
          await connection.execute(
            `UPDATE StockLevel 
             SET quantity = quantity - ?, updatedAt = NOW()
             WHERE inventoryItemId = ? AND warehouseId = ?`,
            [quantityDiff, newInventoryItemId, targetWarehouseId]
          );
          
          // إنشاء StockMovement
          const movementType = quantityDiff > 0 ? 'OUT' : 'IN';
          await connection.execute(
            `INSERT INTO StockMovement (type, quantity, inventoryItemId, ${quantityDiff > 0 ? 'fromWarehouseId' : 'toWarehouseId'}, userId, notes, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [movementType, Math.abs(quantityDiff), newInventoryItemId, targetWarehouseId, userId, `تحديث في الفاتورة #${invoiceId}`]
          );
          
          // تحديث StockAlert
          const [updatedStock] = await connection.execute(
            'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
            [newInventoryItemId, targetWarehouseId]
          );
          if (updatedStock.length > 0) {
            await updateStockAlert(connection, newInventoryItemId, targetWarehouseId, updatedStock[0].quantity, updatedStock[0].minLevel, userId);
          }
        }
      }
    }
    
    // تحديث InvoiceItem
    const [result] = await connection.execute(
      'UPDATE InvoiceItem SET quantity = ?, unitPrice = ?, totalPrice = ?, invoiceId = ?, partsUsedId = ?, inventoryItemId = ?, updatedAt = NOW() WHERE id = ?',
      [quantity, unitPrice, totalPrice, invoiceId, partsUsedId || null, newInventoryItemId || null, id]
    );
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ 
        success: false,
        message: 'عنصر الفاتورة غير موجود' 
      });
    }
    
    await connection.commit();
    connection.release();
    
    res.json({ 
      success: true,
      message: 'تم تحديث عنصر الفاتورة بنجاح' 
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error(`Error updating invoice item with ID ${id}:`, err);
    res.status(500).json({ 
      success: false,
      message: 'Server Error',
      details: err.message 
    });
  }
});

// Delete an invoice item (hard delete)
router.delete('/:id', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const userId = req.user?.id;
    
    // جلب البيانات الحالية
    const [current] = await connection.execute(
      'SELECT * FROM InvoiceItem WHERE id = ?',
      [id]
    );
    
    if (current.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ 
        success: false,
        message: 'عنصر الفاتورة غير موجود' 
      });
    }
    
    const currentItem = current[0];
    
    // إذا كان InvoiceItem يحتوي على inventoryItemId ولم يكن مربوطاً بـ PartsUsed، إرجاع الكمية للمخزون
    if (currentItem.inventoryItemId && !currentItem.partsUsedId) {
      // الحصول على warehouseId
      const [stockLevel] = await connection.execute(
        'SELECT warehouseId, minLevel FROM StockLevel WHERE inventoryItemId = ? AND deletedAt IS NULL LIMIT 1',
        [currentItem.inventoryItemId]
      );
      
      if (stockLevel.length > 0) {
        const targetWarehouseId = stockLevel[0].warehouseId;
        
        // إرجاع الكمية للمخزون
        await connection.execute(
          `UPDATE StockLevel 
           SET quantity = quantity + ?, updatedAt = NOW()
           WHERE inventoryItemId = ? AND warehouseId = ?`,
          [currentItem.quantity, currentItem.inventoryItemId, targetWarehouseId]
        );
        
        // إنشاء StockMovement لإرجاع الكمية
        await connection.execute(
          `INSERT INTO StockMovement (type, quantity, inventoryItemId, toWarehouseId, userId, notes, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          ['IN', currentItem.quantity, currentItem.inventoryItemId, targetWarehouseId, userId, `حذف من الفاتورة #${currentItem.invoiceId}`]
        );
        
        // تحديث StockAlert
        const [updatedStock] = await connection.execute(
          'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
          [currentItem.inventoryItemId, targetWarehouseId]
        );
        if (updatedStock.length > 0) {
          await updateStockAlert(connection, currentItem.inventoryItemId, targetWarehouseId, updatedStock[0].quantity, updatedStock[0].minLevel, userId);
        }
      }
    }
    
    // حذف InvoiceItem
    const [result] = await connection.execute('DELETE FROM InvoiceItem WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ 
        success: false,
        message: 'عنصر الفاتورة غير موجود' 
      });
    }
    
    await connection.commit();
    connection.release();
    
    res.json({ 
      success: true,
      message: 'تم حذف عنصر الفاتورة بنجاح' 
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error(`Error deleting invoice item with ID ${id}:`, err);
    res.status(500).json({ 
      success: false,
      message: 'Server Error',
      details: err.message 
    });
  }
});

module.exports = router;
