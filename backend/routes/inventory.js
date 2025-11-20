const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, inventorySchemas } = require('../middleware/validation');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Helper function to update isLowStock and StockAlert (from stockLevels.js)
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

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM InventoryItem WHERE deletedAt IS NULL ORDER BY createdAt DESC');
    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    console.error('Error fetching inventory items:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      details: err.message
    });
  }
});

// Get inventory item by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute('SELECT * FROM InventoryItem WHERE id = ? AND deletedAt IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    console.error(`Error fetching inventory item with ID ${id}:`, err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      details: err.message
    });
  }
});

// Create a new inventory item
router.post('/', validate(inventorySchemas.createItem), async (req, res) => {
  const { 
    sku, 
    name, 
    description,
    type: category, 
    purchasePrice, 
    sellingPrice, 
    unit = 'قطعة'
  } = req.body;
  
  try {
    const [result] = await db.execute(
      `INSERT INTO InventoryItem (
        sku, name, type, purchasePrice, sellingPrice, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`, 
      [sku || `AUTO-${Date.now()}`, name, category, purchasePrice, sellingPrice]
    );
    
    const [item] = await db.execute('SELECT * FROM InventoryItem WHERE id = ?', [result.insertId]);
    
    res.status(201).json({ 
      success: true, 
      message: 'تم إنشاء الصنف بنجاح',
      data: item[0]
    });
  } catch (err) {
    console.error('Error creating inventory item:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        message: 'رمز الصنف (SKU) موجود مسبقاً'
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      details: err.message 
    });
  }
});

// Update an inventory item
router.put('/:id', validate(inventorySchemas.updateItem), async (req, res) => {
  const { id } = req.params;
  const { sku, name, type: category, purchasePrice, sellingPrice } = req.body;
  
  // Build dynamic update query
  const updates = [];
  const values = [];
  
  if (sku !== undefined) {
    updates.push('sku = ?');
    values.push(sku);
  }
  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (category !== undefined) {
    updates.push('type = ?');
    values.push(category);
  }
  if (purchasePrice !== undefined) {
    updates.push('purchasePrice = ?');
    values.push(purchasePrice);
  }
  if (sellingPrice !== undefined) {
    updates.push('sellingPrice = ?');
    values.push(sellingPrice);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'لا يوجد حقول للتحديث'
    });
  }
  
  updates.push('updatedAt = NOW()');
  values.push(id);
  
  try {
    // Check if item exists
    const [existing] = await db.execute(
      'SELECT id FROM InventoryItem WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'الصنف غير موجود'
      });
    }
    
    const [result] = await db.execute(
      `UPDATE InventoryItem SET ${updates.join(', ')} WHERE id = ? AND deletedAt IS NULL`,
      values
    );
    
    const [updated] = await db.execute('SELECT * FROM InventoryItem WHERE id = ?', [id]);
    
    res.json({ 
      success: true, 
      message: 'تم تحديث الصنف بنجاح',
      data: updated[0]
    });
  } catch (err) {
    console.error(`Error updating inventory item with ID ${id}:`, err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        message: 'رمز الصنف (SKU) موجود مسبقاً'
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      details: err.message 
    });
  }
});

// Adjust inventory quantity (add/subtract)
router.post('/:id/adjust', async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { warehouseId, quantity, type, reason, notes } = req.body;
    
    if (!warehouseId) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        success: false, 
        message: 'warehouseId is required' 
      });
    }
    
    if (!quantity || !type) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        success: false, 
        message: 'Quantity and type (add/subtract) are required' 
      });
    }
    
    if (!['add', 'subtract'].includes(type)) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        success: false, 
        message: 'Type must be "add" or "subtract"' 
      });
    }
    
    // Check if item exists
    const [item] = await connection.execute(
      'SELECT id, name FROM InventoryItem WHERE id = ? AND deletedAt IS NULL', 
      [id]
    );
    
    if (!item.length) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ 
        success: false, 
        message: 'Inventory item not found' 
      });
    }
    
    // Check if warehouse exists
    const [warehouse] = await connection.execute(
      'SELECT id, name FROM Warehouse WHERE id = ? AND deletedAt IS NULL',
      [warehouseId]
    );
    
    if (!warehouse.length) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ 
        success: false, 
        message: 'Warehouse not found' 
      });
    }
    
    // Check if stock level exists
    const [stockLevel] = await connection.execute(
      'SELECT id, quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ? AND deletedAt IS NULL',
      [id, warehouseId]
    );
    
    if (!stockLevel.length) {
      // Create new stock level if it doesn't exist
      if (type === 'subtract') {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot subtract from non-existent stock level' 
        });
      }
      
      // Create new stock level
      const [newStockResult] = await connection.execute(
        'INSERT INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel, isLowStock, createdAt, updatedAt) VALUES (?, ?, ?, 0, 0, NOW(), NOW())',
        [id, warehouseId, quantity]
      );
      
      const newQuantity = quantity;
      const minLevel = 0;
      
      // Create stock movement
      await connection.execute(
        'INSERT INTO StockMovement (inventoryItemId, type, quantity, toWarehouseId, userId, createdAt, notes) VALUES (?, ?, ?, ?, ?, NOW(), ?)',
        [id, 'IN', quantity, warehouseId, req.user?.id, notes || reason || `Manual adjustment: ${type}`]
      );
      
      // Update isLowStock and StockAlert
      await updateStockAlert(connection, id, warehouseId, newQuantity, minLevel, req.user?.id);
      
      await connection.commit();
      connection.release();
      
      return res.json({ 
        success: true, 
        message: `Quantity increased by ${quantity}`,
        data: {
          itemId: id,
          itemName: item[0].name,
          warehouseId,
          warehouseName: warehouse[0].name,
          oldQuantity: 0,
          newQuantity,
          adjustment: quantity,
          type
        }
      });
    }
    
    // Calculate adjustment
    const adjustment = type === 'add' ? quantity : -quantity;
    const oldQuantity = stockLevel[0].quantity;
    const newQuantity = oldQuantity + adjustment;
    
    if (newQuantity < 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient stock. Current stock: ${oldQuantity}, requested: ${quantity}` 
      });
    }
    
    // Update stock level
    await connection.execute(
      'UPDATE StockLevel SET quantity = ?, updatedAt = NOW() WHERE id = ?',
      [newQuantity, stockLevel[0].id]
    );
    
    // Create stock movement
    const movementType = type === 'add' ? 'IN' : 'OUT';
    const warehouseField = type === 'add' ? 'toWarehouseId' : 'fromWarehouseId';
    await connection.execute(
      `INSERT INTO StockMovement (inventoryItemId, type, quantity, ${warehouseField}, userId, createdAt, notes) VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
      [id, movementType, quantity, warehouseId, req.user?.id, notes || reason || `Manual adjustment: ${type}`]
    );
    
    // Update isLowStock and StockAlert
    await updateStockAlert(connection, id, warehouseId, newQuantity, stockLevel[0].minLevel, req.user?.id);
    
    await connection.commit();
    connection.release();
    
    res.json({ 
      success: true, 
      message: `Quantity ${type === 'add' ? 'increased' : 'decreased'} by ${quantity}`,
      data: {
        itemId: id,
        itemName: item[0].name,
        warehouseId,
        warehouseName: warehouse[0].name,
        oldQuantity,
        newQuantity,
        adjustment: quantity,
        type
      }
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error(`Error adjusting inventory quantity for item ${req.params.id}:`, err);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      details: err.message 
    });
  }
});

// Delete an inventory item (soft delete)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if item exists
    const [existing] = await db.execute(
      'SELECT id FROM InventoryItem WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    // Check if item has stock
    const [stock] = await db.execute(
      'SELECT SUM(quantity) as total FROM StockLevel WHERE inventoryItemId = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (stock[0].total > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete item with existing stock. Please clear stock first.' 
      });
    }
    
    // Soft delete
    await db.execute(
      'UPDATE InventoryItem SET deletedAt = NOW() WHERE id = ?',
      [id]
    );
    
    res.json({ 
      success: true,
      message: 'Inventory item deleted successfully' 
    });
  } catch (err) {
    console.error(`Error deleting inventory item with ID ${id}:`, err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      details: err.message
    });
  }
});

// Get inventory reports
router.get('/reports/overview', async (req, res) => {
  try {
    // Get total warehouses
    const [warehousesResult] = await db.execute('SELECT COUNT(*) as total FROM Warehouse WHERE deletedAt IS NULL');
    const totalWarehouses = warehousesResult[0].total;
    
    // Get total inventory items
    const [itemsResult] = await db.execute('SELECT COUNT(*) as total FROM InventoryItem WHERE deletedAt IS NULL');
    const totalItems = itemsResult[0].total;
    
    // Get low stock items count
    const [lowStockResult] = await db.execute('SELECT COUNT(*) as total FROM StockLevel WHERE (quantity <= minLevel OR isLowStock = 1) AND deletedAt IS NULL');
    const lowStockCount = lowStockResult[0].total;
    
    // Get total stock movements in date range
    const { startDate, endDate } = req.query;
    let movementsQuery = 'SELECT COUNT(*) as total FROM StockMovement WHERE 1=1';
    let movementsParams = [];
    
    if (startDate && endDate) {
      movementsQuery += ' AND DATE(createdAt) BETWEEN ? AND ?';
      movementsParams = [startDate, endDate];
    }
    
    const [movementsResult] = await db.execute(movementsQuery, movementsParams);
    const totalMovements = movementsResult[0].total;
    
    res.json({
      success: true,
      data: {
        totalWarehouses,
        totalItems,
        lowStockCount,
        totalMovements
      }
    });
  } catch (err) {
    console.error('Error generating inventory overview report:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      details: err.message
    });
  }
});

// Get low stock report
router.get('/reports/low-stock', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        sl.id AS stockLevelId,
        ii.id AS inventoryItemId,
        ii.sku,
        ii.name,
        ii.type,
        sl.quantity,
        sl.minLevel,
        sl.isLowStock,
        w.id AS warehouseId,
        w.name AS warehouseName
      FROM StockLevel sl
      INNER JOIN InventoryItem ii ON ii.id = sl.inventoryItemId AND ii.deletedAt IS NULL
      INNER JOIN Warehouse w ON w.id = sl.warehouseId AND w.deletedAt IS NULL
      WHERE (sl.quantity <= COALESCE(sl.minLevel, 0) OR sl.isLowStock = 1) AND sl.deletedAt IS NULL
      ORDER BY sl.quantity ASC
    `);
    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    console.error('Error generating low stock report:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      details: err.message
    });
  }
});

// Get high value items report
router.get('/reports/high-value', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        ii.id,
        ii.sku,
        ii.name,
        ii.type,
        ii.sellingPrice,
        SUM(sl.quantity) as totalStock,
        (SUM(sl.quantity) * ii.sellingPrice) as totalValue
      FROM InventoryItem ii
      LEFT JOIN StockLevel sl ON ii.id = sl.inventoryItemId AND sl.deletedAt IS NULL
      WHERE ii.sellingPrice > 0 AND ii.deletedAt IS NULL
      GROUP BY ii.id
      HAVING totalStock > 0
      ORDER BY totalValue DESC
      LIMIT 10
    `);
    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    console.error('Error generating high value items report:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      details: err.message
    });
  }
});

// Get stock movements report
router.get('/reports/movements', async (req, res) => {
  try {
    const { startDate, endDate, warehouseId } = req.query;
    
    let query = `
      SELECT
        sm.id,
        sm.type,
        sm.quantity,
        sm.notes,
        sm.createdAt,
        ii.name as itemName,
        ii.sku,
        w1.name as fromWarehouse,
        w2.name as toWarehouse
      FROM StockMovement sm
      INNER JOIN InventoryItem ii ON sm.inventoryItemId = ii.id AND ii.deletedAt IS NULL
      LEFT JOIN Warehouse w1 ON sm.fromWarehouseId = w1.id AND (w1.deletedAt IS NULL OR w1.deletedAt IS NOT NULL)
      LEFT JOIN Warehouse w2 ON sm.toWarehouseId = w2.id AND (w2.deletedAt IS NULL OR w2.deletedAt IS NOT NULL)
      WHERE 1=1
    `;
    
    const params = [];
    
    if (startDate && endDate) {
      query += ' AND DATE(sm.createdAt) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    if (warehouseId) {
      query += ' AND (sm.fromWarehouseId = ? OR sm.toWarehouseId = ?)';
      params.push(warehouseId, warehouseId);
    }
    
    query += ' ORDER BY sm.createdAt DESC';
    
    const [rows] = await db.execute(query, params);
    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    console.error('Error generating stock movements report:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      details: err.message
    });
  }
});

// Import inventory items from CSV
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];
    const errors = [];

    // Parse CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          let successCount = 0;
          let errorCount = 0;

          for (const row of results) {
            try {
              // Validate required fields
              if (!row.SKU || !row.Name) {
                errors.push(`Row ${results.indexOf(row) + 1}: SKU and Name are required`);
                errorCount++;
                continue;
              }

              // Check if item already exists
              const [existing] = await db.execute('SELECT id FROM InventoryItem WHERE sku = ? AND deletedAt IS NULL', [row.SKU]);
              
              if (existing.length > 0) {
                // Update existing item
                await db.execute(
                  'UPDATE InventoryItem SET name = ?, type = ?, purchasePrice = ?, sellingPrice = ?, serialNumber = ?, updatedAt = NOW() WHERE sku = ? AND deletedAt IS NULL',
                  [
                    row.Name || null,
                    row.Type || null,
                    parseFloat(row['Purchase Price']) || 0,
                    parseFloat(row['Selling Price']) || 0,
                    row['Serial Number'] || null,
                    row.SKU
                  ]
                );
              } else {
                // Insert new item
                await db.execute(
                  'INSERT INTO InventoryItem (sku, name, type, purchasePrice, sellingPrice, serialNumber, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
                  [
                    row.SKU,
                    row.Name,
                    row.Type || null,
                    parseFloat(row['Purchase Price']) || 0,
                    parseFloat(row['Selling Price']) || 0,
                    row['Serial Number'] || null
                  ]
                );
              }
              successCount++;
            } catch (error) {
              errors.push(`Row ${results.indexOf(row) + 1}: ${error.message}`);
              errorCount++;
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          res.json({
            success: true,
            message: 'Import completed',
            data: {
              successCount,
              errorCount,
              errors: errors.slice(0, 10) // Limit errors to first 10
            }
          });
        } catch (error) {
          console.error('Import processing error:', error);
          res.status(500).json({ message: 'Error processing import' });
        }
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        res.status(400).json({ message: 'Error parsing CSV file' });
      });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Server error during import' });
  }
});

module.exports = router;
