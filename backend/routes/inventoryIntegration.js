const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Deduct inventory items when used in repair
router.post('/inventory/deduct-items', async (req, res) => {
  try {
    const { items, repairId, userId, reason = 'استخدام في إصلاح' } = req.body;
    
    const results = [];
    
    for (const item of items) {
      // Check current stock level
    const [stockRows] = await db.execute(
      'SELECT quantity FROM StockLevel WHERE inventoryItemId = ?',
      [item.inventoryItemId]
    );
      
      if (stockRows.length === 0) {
        return res.status(400).json({ 
          message: `القطعة ${item.name} غير موجودة في المخزون` 
        });
      }
      
      const currentStock = stockRows[0].quantity;
      
      if (currentStock < item.quantity) {
        return res.status(400).json({ 
          message: `الكمية المطلوبة (${item.quantity}) أكبر من المخزون المتاح (${currentStock}) للقطعة ${item.name}` 
        });
      }
      
      // Update stock level
      await db.execute(
        'UPDATE StockLevel SET quantity = quantity - ? WHERE inventoryItemId = ?',
        [item.quantity, item.inventoryItemId]
      );
      
      // Create stock movement record
      await db.execute(
        'INSERT INTO StockMovement (type, quantity, inventoryItemId, userId, reason) VALUES (?, ?, ?, ?, ?)',
        ['out', item.quantity, item.inventoryItemId, userId, reason]
      );
      
      // Record parts used in repair
      await db.execute(
        'INSERT INTO PartsUsed (repairRequestId, inventoryItemId, quantity, unitCost, totalCost) VALUES (?, ?, ?, ?, ?)',
        [repairId, item.inventoryItemId, item.quantity, item.unitCost, item.totalCost]
      );
      
      results.push({
        inventoryItemId: item.inventoryItemId,
        name: item.name,
        quantityDeducted: item.quantity,
        newStockLevel: currentStock - item.quantity
      });
    }
    
    res.json({
      success: true,
      message: 'تم خصم القطع من المخزون بنجاح',
      data: { items: results }
    });
  } catch (error) {
    console.error('Error deducting inventory items:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في خصم القطع من المخزون',
      details: error.message
    });
  }
});

// Add inventory items when purchasing
router.post('/inventory/add-items', async (req, res) => {
  try {
    const { items, purchaseOrderId, userId, reason = 'شراء جديد' } = req.body;
    
    const results = [];
    
    for (const item of items) {
      // Check if item exists in inventory
      const [inventoryRows] = await db.execute(
        'SELECT id FROM InventoryItem WHERE id = ?',
        [item.inventoryItemId]
      );
      
      if (inventoryRows.length === 0) {
        return res.status(400).json({ 
          message: `القطعة ${item.name} غير موجودة في قاعدة البيانات` 
        });
      }
      
      // Check if stock level exists
    const [stockRows] = await db.execute(
      'SELECT quantity FROM StockLevel WHERE inventoryItemId = ?',
      [item.inventoryItemId]
    );
      
      let newStockLevel;
      
      if (stockRows.length === 0) {
        // Create new stock level record
        await db.execute(
          'INSERT INTO StockLevel (inventoryItemId, quantity, warehouseId) VALUES (?, ?, ?)',
          [item.inventoryItemId, item.quantity, item.warehouseId || 1]
        );
        newStockLevel = item.quantity;
      } else {
        // Update existing stock level
        await db.execute(
          'UPDATE StockLevel SET quantity = quantity + ? WHERE inventoryItemId = ?',
          [item.quantity, item.inventoryItemId]
        );
        newStockLevel = stockRows[0].quantity + item.quantity;
      }
      
      // Create stock movement record
      await db.execute(
        'INSERT INTO StockMovement (type, quantity, inventoryItemId, userId, reason) VALUES (?, ?, ?, ?, ?)',
        ['in', item.quantity, item.inventoryItemId, userId, reason]
      );
      
      // Update item cost if provided
      if (item.unitCost) {
        await db.execute(
          'UPDATE InventoryItem SET unitPrice = ? WHERE id = ?',
          [item.unitCost, item.inventoryItemId]
        );
      }
      
      results.push({
        inventoryItemId: item.inventoryItemId,
        name: item.name,
        quantityAdded: item.quantity,
        newStockLevel,
        unitCost: item.unitCost
      });
    }
    
    res.json({
      success: true,
      message: 'تم إضافة القطع للمخزون بنجاح',
      data: { items: results }
    });
  } catch (error) {
    console.error('Error adding inventory items:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إضافة القطع للمخزون',
      details: error.message
    });
  }
});

// Transfer inventory between warehouses
router.post('/inventory/transfer', async (req, res) => {
  try {
    const { items, fromWarehouseId, toWarehouseId, userId, reason = 'نقل بين المخازن' } = req.body;
    
    const results = [];
    
    for (const item of items) {
      // Check source warehouse stock
      const [sourceStockRows] = await db.execute(
        'SELECT quantity FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [item.inventoryItemId, fromWarehouseId]
      );
      
      if (sourceStockRows.length === 0 || sourceStockRows[0].quantity < item.quantity) {
        return res.status(400).json({ 
          message: `الكمية غير متاحة في المخزن المصدر للقطعة ${item.name}` 
        });
      }
      
      // Deduct from source warehouse
      await db.execute(
        'UPDATE StockLevel SET quantity = quantity - ? WHERE inventoryItemId = ? AND warehouseId = ?',
        [item.quantity, item.inventoryItemId, fromWarehouseId]
      );
      
      // Add to destination warehouse
      const [destStockRows] = await db.execute(
        'SELECT quantity FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [item.inventoryItemId, toWarehouseId]
      );
      
      if (destStockRows.length === 0) {
        // Create new stock level for destination warehouse
        await db.execute(
          'INSERT INTO StockLevel (inventoryItemId, quantity, warehouseId) VALUES (?, ?, ?)',
          [item.inventoryItemId, item.quantity, toWarehouseId]
        );
      } else {
        // Update existing stock level
        await db.execute(
          'UPDATE StockLevel SET quantity = quantity + ? WHERE inventoryItemId = ? AND warehouseId = ?',
          [item.quantity, item.inventoryItemId, toWarehouseId]
        );
      }
      
      // Create stock movement record
      await db.execute(
        'INSERT INTO StockMovement (type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, userId, reason) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['transfer', item.quantity, item.inventoryItemId, fromWarehouseId, toWarehouseId, userId, reason]
      );
      
      results.push({
        inventoryItemId: item.inventoryItemId,
        name: item.name,
        quantity: item.quantity,
        fromWarehouseId,
        toWarehouseId
      });
    }
    
    res.json({
      success: true,
      message: 'تم نقل القطع بين المخازن بنجاح',
      data: { items: results }
    });
  } catch (error) {
    console.error('Error transferring inventory:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في نقل القطع بين المخازن',
      details: error.message
    });
  }
});

// Get inventory alerts and suggestions
router.get('/inventory/alerts', async (req, res) => {
  try {
    // Get low stock items
    const [lowStockRows] = await db.execute(`
      SELECT 
        ii.id,
        ii.name,
        ii.category,
        sl.quantity,
        sl.minLevel as minimumStockLevel,
        (sl.quantity - sl.minLevel) as stockDeficit
      FROM InventoryItem ii
      JOIN StockLevel sl ON ii.id = sl.inventoryItemId
      WHERE sl.quantity <= sl.minLevel AND sl.deletedAt IS NULL AND ii.deletedAt IS NULL
      ORDER BY stockDeficit ASC
    `);
    
    // Get high-value items
    const [highValueRows] = await db.execute(`
      SELECT 
        ii.id,
        ii.name,
        ii.category,
        sl.quantity,
        ii.purchasePrice as unitPrice,
        (sl.quantity * ii.purchasePrice) as totalValue
      FROM InventoryItem ii
      JOIN StockLevel sl ON ii.id = sl.inventoryItemId
      WHERE sl.quantity > 0 AND sl.deletedAt IS NULL AND ii.deletedAt IS NULL
      ORDER BY totalValue DESC
      LIMIT 10
    `);
    
    // Get movement alerts (unusual movements)
    const [movementRows] = await db.execute(`
      SELECT 
        ii.name,
        COUNT(sm.id) as movementCount,
        SUM(CASE WHEN sm.type = 'IN' THEN sm.quantity ELSE 0 END) as totalIn,
        SUM(CASE WHEN sm.type = 'OUT' THEN sm.quantity ELSE 0 END) as totalOut
      FROM InventoryItem ii
      JOIN StockMovement sm ON ii.id = sm.inventoryItemId
      WHERE sm.createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND ii.deletedAt IS NULL
      GROUP BY ii.id
      HAVING movementCount > 5
      ORDER BY movementCount DESC
    `);
    
    res.json({
      success: true,
      data: {
        lowStockItems: lowStockRows,
        highValueItems: highValueRows,
        unusualMovements: movementRows,
        alertsCount: lowStockRows.length
      }
    });
  } catch (error) {
    console.error('Error getting inventory alerts:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب تنبيهات المخزون',
      details: error.message
    });
  }
});

// Update inventory costs automatically
router.post('/inventory/update-costs', async (req, res) => {
  try {
    const { items } = req.body;
    
    const results = [];
    
    for (const item of items) {
      // Update unit price
      await db.execute(
        'UPDATE InventoryItem SET unitPrice = ? WHERE id = ?',
        [item.newUnitPrice, item.inventoryItemId]
      );
      
      // Create stock movement for cost adjustment
      await db.execute(
        'INSERT INTO StockMovement (type, quantity, inventoryItemId, userId, reason) VALUES (?, ?, ?, ?, ?)',
        ['adjustment', 0, item.inventoryItemId, item.userId, 'تحديث سعر القطعة']
      );
      
      results.push({
        inventoryItemId: item.inventoryItemId,
        oldPrice: item.oldUnitPrice,
        newPrice: item.newUnitPrice
      });
    }
    
    res.json({
      success: true,
      message: 'تم تحديث أسعار القطع بنجاح',
      data: { items: results }
    });
  } catch (error) {
    console.error('Error updating inventory costs:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث أسعار القطع',
      details: error.message
    });
  }
});

module.exports = router;
