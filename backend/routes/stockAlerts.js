const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all alerts (default route)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        ii.id,
        ii.name,
        ii.type as category,
        ii.purchasePrice as unitPrice,
        SUM(sl.quantity) as quantity,
        sl.minLevel as minimumStockLevel,
        (SUM(sl.quantity) - sl.minLevel) as stockDeficit,
        CASE 
          WHEN SUM(sl.quantity) <= 0 THEN 'out_of_stock'
          WHEN SUM(sl.quantity) <= sl.minLevel THEN 'low_stock'
          ELSE 'normal'
        END as alertLevel
      FROM InventoryItem ii
      JOIN StockLevel sl ON ii.id = sl.inventoryItemId
      WHERE ii.deletedAt IS NULL
      GROUP BY ii.id, sl.minLevel
      HAVING SUM(sl.quantity) <= sl.minLevel
      ORDER BY alertLevel DESC, stockDeficit ASC
    `);
    
    res.json(rows);
  } catch (err) {
    console.error('Error fetching stock alerts:', err);
    res.status(500).send('Server Error');
  }
});

// Get low stock alerts
router.get('/low', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        ii.id,
        ii.name,
        ii.type as category,
        ii.purchasePrice as unitPrice,
        SUM(sl.quantity) as quantity,
        sl.minLevel as minimumStockLevel,
        (SUM(sl.quantity) - sl.minLevel) as stockDeficit,
        CASE 
          WHEN SUM(sl.quantity) <= 0 THEN 'out_of_stock'
          WHEN SUM(sl.quantity) <= sl.minLevel THEN 'low_stock'
          ELSE 'normal'
        END as alertLevel
      FROM InventoryItem ii
      JOIN StockLevel sl ON ii.id = sl.inventoryItemId
      WHERE ii.deletedAt IS NULL
      GROUP BY ii.id, sl.minLevel
      HAVING SUM(sl.quantity) <= sl.minLevel
      ORDER BY alertLevel DESC, stockDeficit ASC
    `);
    
    res.json({
      alerts: rows,
      totalAlerts: rows.length,
      outOfStock: rows.filter(item => item.alertLevel === 'out_of_stock').length,
      lowStock: rows.filter(item => item.alertLevel === 'low_stock').length
    });
  } catch (err) {
    console.error('Error fetching low stock alerts:', err);
    res.status(500).send('Server Error');
  }
});

// Get stock alerts settings
router.get('/settings', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        ii.id,
        ii.name,
        ii.type as category,
        sl.minLevel as minimumStockLevel,
        sl.minLevel as reorderPoint
      FROM InventoryItem ii
      JOIN StockLevel sl ON ii.id = sl.inventoryItemId
      WHERE ii.deletedAt IS NULL
      ORDER BY ii.name
    `);
    
    res.json({
      settings: rows
    });
  } catch (err) {
    console.error('Error fetching stock alert settings:', err);
    res.status(500).send('Server Error');
  }
});

// Update stock alert settings for a specific item
router.put('/settings/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { minimumStockLevel } = req.body;
    
    if (minimumStockLevel === undefined) {
      return res.status(400).send('minimumStockLevel is required');
    }
    
    const [result] = await db.query(`
      UPDATE StockLevel 
      SET minLevel = ?
      WHERE inventoryItemId = ?
    `, [minimumStockLevel, itemId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).send('Inventory item not found');
    }
    
    res.json({ message: 'Stock alert settings updated successfully' });
  } catch (err) {
    console.error('Error updating stock alert settings:', err);
    res.status(500).send('Server Error');
  }
});

// Generate reorder suggestions
router.get('/reorder-suggestions', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        ii.id,
        ii.name,
        ii.type as category,
        ii.purchasePrice as unitPrice,
        SUM(sl.quantity) as quantity,
        sl.minLevel as reorderPoint,
        (sl.minLevel * 2) as suggestedQuantity,
        ((sl.minLevel * 2) * ii.purchasePrice) as estimatedCost
      FROM InventoryItem ii
      JOIN StockLevel sl ON ii.id = sl.inventoryItemId
      WHERE ii.deletedAt IS NULL
      GROUP BY ii.id, sl.minLevel
      HAVING SUM(sl.quantity) <= sl.minLevel
      ORDER BY (SUM(sl.quantity) - sl.minLevel) ASC
    `);
    
    const totalEstimatedCost = rows.reduce((sum, row) => sum + parseFloat(row.estimatedCost || 0), 0);
    
    res.json({
      suggestions: rows,
      totalItems: rows.length,
      totalEstimatedCost
    });
  } catch (err) {
    console.error('Error generating reorder suggestions:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
