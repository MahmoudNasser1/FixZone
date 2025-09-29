const express = require('express');
const router = express.Router();
const db = require('../db');

// Deduct inventory items when used in repair
router.post('/inventory/deduct-items', async (req, res) => {
  try {
    const { items, repairId, userId, reason = 'استخدام في إصلاح' } = req.body;
    
    const results = [];
    
    for (const item of items) {
      // Check current stock level
      const [stockRows] = await db.query(
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
      await db.query(
        'UPDATE StockLevel SET quantity = quantity - ? WHERE inventoryItemId = ?',
        [item.quantity, item.inventoryItemId]
      );
      
      // Create stock movement record
      await db.query(
        'INSERT INTO StockMovement (type, quantity, inventoryItemId, userId, reason) VALUES (?, ?, ?, ?, ?)',
        ['out', item.quantity, item.inventoryItemId, userId, reason]
      );
      
      // Record parts used in repair
      await db.query(
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
      message: 'تم خصم القطع من المخزون بنجاح',
      items: results
    });
  } catch (error) {
    console.error('Error deducting inventory items:', error);
    res.status(500).json({ message: 'خطأ في خصم القطع من المخزون' });
  }
});

// Add inventory items when purchasing
router.post('/inventory/add-items', async (req, res) => {
  try {
    const { items, purchaseOrderId, userId, reason = 'شراء جديد' } = req.body;
    
    const results = [];
    
    for (const item of items) {
      // Check if item exists in inventory
      const [inventoryRows] = await db.query(
        'SELECT id FROM InventoryItem WHERE id = ?',
        [item.inventoryItemId]
      );
      
      if (inventoryRows.length === 0) {
        return res.status(400).json({ 
          message: `القطعة ${item.name} غير موجودة في قاعدة البيانات` 
        });
      }
      
      // Check if stock level exists
      const [stockRows] = await db.query(
        'SELECT quantity FROM StockLevel WHERE inventoryItemId = ?',
        [item.inventoryItemId]
      );
      
      let newStockLevel;
      
      if (stockRows.length === 0) {
        // Create new stock level record
        await db.query(
          'INSERT INTO StockLevel (inventoryItemId, quantity, warehouseId) VALUES (?, ?, ?)',
          [item.inventoryItemId, item.quantity, item.warehouseId || 1]
        );
        newStockLevel = item.quantity;
      } else {
        // Update existing stock level
        await db.query(
          'UPDATE StockLevel SET quantity = quantity + ? WHERE inventoryItemId = ?',
          [item.quantity, item.inventoryItemId]
        );
        newStockLevel = stockRows[0].quantity + item.quantity;
      }
      
      // Create stock movement record
      await db.query(
        'INSERT INTO StockMovement (type, quantity, inventoryItemId, userId, reason) VALUES (?, ?, ?, ?, ?)',
        ['in', item.quantity, item.inventoryItemId, userId, reason]
      );
      
      // Update item cost if provided
      if (item.unitCost) {
        await db.query(
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
      message: 'تم إضافة القطع للمخزون بنجاح',
      items: results
    });
  } catch (error) {
    console.error('Error adding inventory items:', error);
    res.status(500).json({ message: 'خطأ في إضافة القطع للمخزون' });
  }
});

// Transfer inventory between warehouses
router.post('/inventory/transfer', async (req, res) => {
  try {
    const { items, fromWarehouseId, toWarehouseId, userId, reason = 'نقل بين المخازن' } = req.body;
    
    const results = [];
    
    for (const item of items) {
      // Check source warehouse stock
      const [sourceStockRows] = await db.query(
        'SELECT quantity FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [item.inventoryItemId, fromWarehouseId]
      );
      
      if (sourceStockRows.length === 0 || sourceStockRows[0].quantity < item.quantity) {
        return res.status(400).json({ 
          message: `الكمية غير متاحة في المخزن المصدر للقطعة ${item.name}` 
        });
      }
      
      // Deduct from source warehouse
      await db.query(
        'UPDATE StockLevel SET quantity = quantity - ? WHERE inventoryItemId = ? AND warehouseId = ?',
        [item.quantity, item.inventoryItemId, fromWarehouseId]
      );
      
      // Add to destination warehouse
      const [destStockRows] = await db.query(
        'SELECT quantity FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [item.inventoryItemId, toWarehouseId]
      );
      
      if (destStockRows.length === 0) {
        // Create new stock level for destination warehouse
        await db.query(
          'INSERT INTO StockLevel (inventoryItemId, quantity, warehouseId) VALUES (?, ?, ?)',
          [item.inventoryItemId, item.quantity, toWarehouseId]
        );
      } else {
        // Update existing stock level
        await db.query(
          'UPDATE StockLevel SET quantity = quantity + ? WHERE inventoryItemId = ? AND warehouseId = ?',
          [item.quantity, item.inventoryItemId, toWarehouseId]
        );
      }
      
      // Create stock movement record
      await db.query(
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
      message: 'تم نقل القطع بين المخازن بنجاح',
      items: results
    });
  } catch (error) {
    console.error('Error transferring inventory:', error);
    res.status(500).json({ message: 'خطأ في نقل القطع بين المخازن' });
  }
});

// Get inventory alerts and suggestions
router.get('/inventory/alerts', async (req, res) => {
  try {
    // Get low stock items
    const [lowStockRows] = await db.query(`
      SELECT 
        ii.id,
        ii.name,
        ii.category,
        sl.quantity,
        ii.minimumStockLevel,
        (sl.quantity - ii.minimumStockLevel) as stockDeficit
      FROM InventoryItem ii
      JOIN StockLevel sl ON ii.id = sl.inventoryItemId
      WHERE sl.quantity <= ii.minimumStockLevel
      ORDER BY stockDeficit ASC
    `);
    
    // Get high-value items
    const [highValueRows] = await db.query(`
      SELECT 
        ii.id,
        ii.name,
        ii.category,
        sl.quantity,
        ii.unitPrice,
        (sl.quantity * ii.unitPrice) as totalValue
      FROM InventoryItem ii
      JOIN StockLevel sl ON ii.id = sl.inventoryItemId
      WHERE sl.quantity > 0
      ORDER BY totalValue DESC
      LIMIT 10
    `);
    
    // Get movement alerts (unusual movements)
    const [movementRows] = await db.query(`
      SELECT 
        ii.name,
        COUNT(sm.id) as movementCount,
        SUM(CASE WHEN sm.type = 'in' THEN sm.quantity ELSE 0 END) as totalIn,
        SUM(CASE WHEN sm.type = 'out' THEN sm.quantity ELSE 0 END) as totalOut
      FROM InventoryItem ii
      JOIN StockMovement sm ON ii.id = sm.inventoryItemId
      WHERE sm.createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY ii.id
      HAVING movementCount > 5
      ORDER BY movementCount DESC
    `);
    
    res.json({
      lowStockItems: lowStockRows,
      highValueItems: highValueRows,
      unusualMovements: movementRows,
      alertsCount: lowStockRows.length
    });
  } catch (error) {
    console.error('Error getting inventory alerts:', error);
    res.status(500).json({ message: 'خطأ في جلب تنبيهات المخزون' });
  }
});

// Update inventory costs automatically
router.post('/inventory/update-costs', async (req, res) => {
  try {
    const { items } = req.body;
    
    const results = [];
    
    for (const item of items) {
      // Update unit price
      await db.query(
        'UPDATE InventoryItem SET unitPrice = ? WHERE id = ?',
        [item.newUnitPrice, item.inventoryItemId]
      );
      
      // Create stock movement for cost adjustment
      await db.query(
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
      message: 'تم تحديث أسعار القطع بنجاح',
      items: results
    });
  } catch (error) {
    console.error('Error updating inventory costs:', error);
    res.status(500).json({ message: 'خطأ في تحديث أسعار القطع' });
  }
});

module.exports = router;
