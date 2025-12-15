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

// Get parts used entries (optionally filter by repairRequestId, startDate, endDate)
router.get('/', async (req, res) => {
  try {
    const { repairRequestId, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    let whereClause = '1=1';
    let queryParams = [];
    
    if (repairRequestId) {
      whereClause += ' AND pu.repairRequestId = ?';
      queryParams.push(repairRequestId);
    }
    
    if (startDate) {
      whereClause += ' AND pu.createdAt >= ?';
      queryParams.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND pu.createdAt <= ?';
      queryParams.push(endDate + ' 23:59:59');
    }
    
    const offset = (page - 1) * limit;
    
    const [rows] = await db.query(
      `SELECT 
        pu.*,
        ii.name as itemName,
        ii.sku as itemSku,
        ii.purchasePrice,
        ii.sellingPrice
      FROM PartsUsed pu
      LEFT JOIN InventoryItem ii ON pu.inventoryItemId = ii.id
      WHERE ${whereClause}
      ORDER BY pu.createdAt DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      queryParams
    );
    
    res.json(rows);
  } catch (err) {
    console.error('Error fetching parts used entries:', err);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});

// Get parts used entry by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM PartsUsed WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Parts used entry not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching parts used entry with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new parts used entry
router.post('/', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { quantity, repairRequestId, inventoryItemId, invoiceItemId, warehouseId } = req.body;
    const userId = req.user?.id;
    
    if (!quantity || !repairRequestId || !inventoryItemId) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        success: false,
        message: 'الكمية وطلب الصيانة ومعرف الصنف مطلوبة' 
      });
    }
    
    // الحصول على warehouseId - إما من body أو من StockLevel أو افتراضي
    let targetWarehouseId = warehouseId;
    
    if (!targetWarehouseId) {
      // محاولة الحصول على warehouseId من StockLevel
      const [stockLevel] = await connection.execute(
        'SELECT warehouseId FROM StockLevel WHERE inventoryItemId = ? AND deletedAt IS NULL LIMIT 1',
        [inventoryItemId]
      );
      targetWarehouseId = stockLevel.length > 0 ? stockLevel[0].warehouseId : null;
      
      if (!targetWarehouseId) {
        // استخدام المخزن الافتراضي
        const [defaultWarehouse] = await connection.execute(
          'SELECT id FROM Warehouse WHERE deletedAt IS NULL ORDER BY id LIMIT 1'
        );
        targetWarehouseId = defaultWarehouse.length > 0 ? defaultWarehouse[0].id : null;
      }
    }
    
    if (!targetWarehouseId) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        success: false,
        message: 'يجب تحديد المخزن' 
      });
    }
    
    // التحقق من وجود كمية كافية
    const [stockLevel] = await connection.execute(
      'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ? AND deletedAt IS NULL',
      [inventoryItemId, targetWarehouseId]
    );
    
    if (stockLevel.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        success: false,
        message: 'الصنف غير موجود في المخزن المحدد' 
      });
    }
    
    const availableQuantity = stockLevel[0].quantity || 0;
    if (availableQuantity < quantity) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        success: false,
        message: `الكمية المتاحة (${availableQuantity}) أقل من المطلوب (${quantity})` 
      });
    }
    
    // إنشاء PartsUsed
    const [result] = await connection.execute(
      'INSERT INTO PartsUsed (quantity, repairRequestId, inventoryItemId, invoiceItemId, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [quantity, repairRequestId, inventoryItemId, invoiceItemId || null]
    );
    
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
      ['OUT', quantity, inventoryItemId, targetWarehouseId, userId, `استخدام في إصلاح #${repairRequestId}`]
    );
    
    // تحديث StockAlert
    const newQuantity = availableQuantity - quantity;
    const minLevel = stockLevel[0].minLevel || 0;
    await updateStockAlert(connection, inventoryItemId, targetWarehouseId, newQuantity, minLevel, userId);
    
    await connection.commit();
    connection.release();
    
    res.status(201).json({ 
      success: true,
      id: result.insertId, 
      quantity, 
      repairRequestId, 
      inventoryItemId, 
      invoiceItemId 
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('Error creating parts used entry:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server Error',
      details: err.message 
    });
  }
});

// Update a parts used entry
router.put('/:id', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { quantity, repairRequestId, inventoryItemId, invoiceItemId, warehouseId } = req.body;
    const userId = req.user?.id;
    
    if (!quantity || !repairRequestId || !inventoryItemId) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        success: false,
        message: 'الكمية وطلب الصيانة ومعرف الصنف مطلوبة' 
      });
    }
    
    // جلب البيانات الحالية
    const [current] = await connection.execute(
      'SELECT * FROM PartsUsed WHERE id = ?',
      [id]
    );
    
    if (current.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ 
        success: false,
        message: 'سجل استخدام القطعة غير موجود' 
      });
    }
    
    const currentPart = current[0];
    const quantityDiff = quantity - currentPart.quantity;
    
    // الحصول على warehouseId
    let targetWarehouseId = warehouseId;
    if (!targetWarehouseId) {
      const [stockLevel] = await connection.execute(
        'SELECT warehouseId FROM StockLevel WHERE inventoryItemId = ? AND deletedAt IS NULL LIMIT 1',
        [inventoryItemId]
      );
      targetWarehouseId = stockLevel.length > 0 ? stockLevel[0].warehouseId : null;
    }
    
    if (!targetWarehouseId) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        success: false,
        message: 'يجب تحديد المخزن' 
      });
    }
    
    // إذا تغيرت الكمية، تحديث المخزون
    if (quantityDiff !== 0) {
      // التحقق من وجود كمية كافية إذا زادت الكمية
      if (quantityDiff > 0) {
        const [stockLevel] = await connection.execute(
          'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ? AND deletedAt IS NULL',
          [inventoryItemId, targetWarehouseId]
        );
        
        if (stockLevel.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ 
            success: false,
            message: 'الصنف غير موجود في المخزن المحدد' 
          });
        }
        
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
      
      // تحديث StockLevel
      await connection.execute(
        `UPDATE StockLevel 
         SET quantity = quantity - ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [quantityDiff, inventoryItemId, targetWarehouseId]
      );
      
      // إنشاء StockMovement
      const movementType = quantityDiff > 0 ? 'OUT' : 'IN';
      await connection.execute(
        `INSERT INTO StockMovement (type, quantity, inventoryItemId, ${quantityDiff > 0 ? 'fromWarehouseId' : 'toWarehouseId'}, userId, notes, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [movementType, Math.abs(quantityDiff), inventoryItemId, targetWarehouseId, userId, `تحديث استخدام في إصلاح #${repairRequestId}`]
      );
      
      // تحديث StockAlert
      const [updatedStock] = await connection.execute(
        'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [inventoryItemId, targetWarehouseId]
      );
      if (updatedStock.length > 0) {
        await updateStockAlert(connection, inventoryItemId, targetWarehouseId, updatedStock[0].quantity, updatedStock[0].minLevel, userId);
      }
    }
    
    // تحديث PartsUsed
    const [result] = await connection.execute(
      'UPDATE PartsUsed SET quantity = ?, repairRequestId = ?, inventoryItemId = ?, invoiceItemId = ?, updatedAt = NOW() WHERE id = ?',
      [quantity, repairRequestId, inventoryItemId, invoiceItemId || null, id]
    );
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ 
        success: false,
        message: 'سجل استخدام القطعة غير موجود' 
      });
    }
    
    await connection.commit();
    connection.release();
    
    res.json({ 
      success: true,
      message: 'تم تحديث سجل استخدام القطعة بنجاح' 
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error(`Error updating parts used entry with ID ${id}:`, err);
    res.status(500).json({ 
      success: false,
      message: 'Server Error',
      details: err.message 
    });
  }
});

// Delete a parts used entry
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // First, get the parts used entry details before deleting
    const [partsRows] = await connection.execute('SELECT * FROM PartsUsed WHERE id = ?', [id]);
    
    if (partsRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Parts used entry not found' });
    }
    
    const partUsed = partsRows[0];
    const { invoiceItemId, repairRequestId, inventoryItemId } = partUsed;
    
    // Check if this part exists in any invoice items
    if (invoiceItemId) {
      // Find the invoice for this invoice item
      const [invoiceItems] = await connection.execute(`
        SELECT invoiceId FROM InvoiceItem WHERE id = ?
      `, [invoiceItemId]);
      
      // Delete the invoice item
      if (invoiceItems.length > 0) {
        const invoiceId = invoiceItems[0].invoiceId;
        
        await connection.execute(`
          DELETE FROM InvoiceItem WHERE id = ?
        `, [invoiceItemId]);
        
        // Recalculate invoice total
        const [totalResult] = await connection.execute(`
          SELECT COALESCE(SUM(quantity * unitPrice), 0) as calculatedTotal
          FROM InvoiceItem WHERE invoiceId = ?
        `, [invoiceId]);
        
        const newTotal = Number(totalResult[0].calculatedTotal);
        
        await connection.execute(`
          UPDATE Invoice SET totalAmount = ?, updatedAt = NOW() WHERE id = ?
        `, [newTotal, invoiceId]);
        
        console.log(`Deleted invoice item ${invoiceItemId} from invoice ${invoiceId} and updated total to ${newTotal}`);
      }
    }
    
    // إرجاع الكمية للمخزون قبل الحذف
    // الحصول على warehouseId
    let targetWarehouseId = null;
    const [stockLevel] = await connection.execute(
      'SELECT warehouseId, minLevel FROM StockLevel WHERE inventoryItemId = ? AND deletedAt IS NULL LIMIT 1',
      [inventoryItemId]
    );
    targetWarehouseId = stockLevel.length > 0 ? stockLevel[0].warehouseId : null;
    
    if (targetWarehouseId) {
      // إرجاع الكمية للمخزون
      await connection.execute(
        `UPDATE StockLevel 
         SET quantity = quantity + ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [partUsed.quantity, inventoryItemId, targetWarehouseId]
      );
      
      // إنشاء StockMovement لإرجاع الكمية
      const userId = req.user?.id;
      await connection.execute(
        `INSERT INTO StockMovement (type, quantity, inventoryItemId, toWarehouseId, userId, notes, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        ['IN', partUsed.quantity, inventoryItemId, targetWarehouseId, userId, `إرجاع من إصلاح #${repairRequestId}`]
      );
      
      // تحديث StockAlert
      const [updatedStock] = await connection.execute(
        'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [inventoryItemId, targetWarehouseId]
      );
      if (updatedStock.length > 0) {
        await updateStockAlert(connection, inventoryItemId, targetWarehouseId, updatedStock[0].quantity, updatedStock[0].minLevel, userId);
      }
    }
    
    // Now delete the parts used entry
    const [result] = await connection.execute('DELETE FROM PartsUsed WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'سجل استخدام القطعة غير موجود' });
    }
    
    await connection.commit();
    connection.release();
    res.json({ success: true, message: 'تم حذف سجل استخدام القطعة بنجاح' });
  } catch (err) {
    await connection.rollback();
    console.error(`Error deleting parts used entry with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  } finally {
    connection.release();
  }
});

// Get parts usage report/stats
router.get('/reports/consumption', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'item' } = req.query;
    
    let whereClause = '1=1';
    let queryParams = [];
    
    if (startDate) {
      whereClause += ' AND pu.createdAt >= ?';
      queryParams.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND pu.createdAt <= ?';
      queryParams.push(endDate + ' 23:59:59');
    }
    
    if (groupBy === 'item') {
      const [rows] = await db.query(
        `SELECT 
          pu.inventoryItemId,
          ii.name as itemName,
          ii.sku,
          COUNT(pu.id) as usageCount,
          SUM(pu.quantity) as totalQuantity,
          COUNT(DISTINCT pu.repairRequestId) as repairsCount
        FROM PartsUsed pu
        LEFT JOIN InventoryItem ii ON pu.inventoryItemId = ii.id
        WHERE ${whereClause}
        GROUP BY pu.inventoryItemId, ii.name, ii.sku
        ORDER BY totalQuantity DESC`,
        queryParams
      );
      return res.json({ success: true, data: rows });
    }
    
    res.json({ success: true, data: [] });
  } catch (err) {
    console.error('Error fetching parts consumption report:', err);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});

module.exports = router;
