const express = require('express');
const router = express.Router();
const db = require('../db');

// Get low stock alerts
router.get('/low', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        ii.id,
        ii.name,
        ii.category,
        ii.unitPrice,
        sl.quantity,
        ii.minimumStockLevel,
        (sl.quantity - ii.minimumStockLevel) as stockDeficit,
        CASE 
          WHEN sl.quantity <= 0 THEN 'out_of_stock'
          WHEN sl.quantity <= ii.minimumStockLevel THEN 'low_stock'
          ELSE 'normal'
        END as alertLevel
      FROM InventoryItem ii
      JOIN StockLevel sl ON ii.id = sl.inventoryItemId
      WHERE sl.quantity <= ii.minimumStockLevel
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
        ii.category,
        ii.minimumStockLevel,
        ii.maximumStockLevel,
        ii.reorderPoint,
        ii.reorderQuantity
      FROM InventoryItem ii
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
    const { minimumStockLevel, maximumStockLevel, reorderPoint, reorderQuantity } = req.body;
    
    if (minimumStockLevel === undefined && maximumStockLevel === undefined && 
        reorderPoint === undefined && reorderQuantity === undefined) {
      return res.status(400).send('At least one setting must be provided');
    }
    
    let updateFields = [];
    let params = [];
    
    if (minimumStockLevel !== undefined) {
      updateFields.push('minimumStockLevel = ?');
      params.push(minimumStockLevel);
    }
    
    if (maximumStockLevel !== undefined) {
      updateFields.push('maximumStockLevel = ?');
      params.push(maximumStockLevel);
    }
    
    if (reorderPoint !== undefined) {
      updateFields.push('reorderPoint = ?');
      params.push(reorderPoint);
    }
    
    if (reorderQuantity !== undefined) {
      updateFields.push('reorderQuantity = ?');
      params.push(reorderQuantity);
    }
    
    params.push(itemId);
    
    const [result] = await db.query(`
      UPDATE InventoryItem 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).send('Inventory item not found');
    }
    
    res.json({ message: 'Stock alert settings updated successfully' });
  } catch (err) {
    console.error('Error updating stock alert settings:', err);
    res.status(500).send('Server Error');
  }
});

// Update stock alert settings for multiple items
router.put('/settings/batch', async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!Array.isArray(settings)) {
      return res.status(400).send('Settings must be an array');
    }
    
    const updatePromises = settings.map(async (setting) => {
      const { itemId, minimumStockLevel, maximumStockLevel, reorderPoint, reorderQuantity } = setting;
      
      let updateFields = [];
      let params = [];
      
      if (minimumStockLevel !== undefined) {
        updateFields.push('minimumStockLevel = ?');
        params.push(minimumStockLevel);
      }
      
      if (maximumStockLevel !== undefined) {
        updateFields.push('maximumStockLevel = ?');
        params.push(maximumStockLevel);
      }
      
      if (reorderPoint !== undefined) {
        updateFields.push('reorderPoint = ?');
        params.push(reorderPoint);
      }
      
      if (reorderQuantity !== undefined) {
        updateFields.push('reorderQuantity = ?');
        params.push(reorderQuantity);
      }
      
      if (updateFields.length === 0) return null;
      
      params.push(itemId);
      
      return db.query(`
        UPDATE InventoryItem 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `, params);
    });
    
    await Promise.all(updatePromises.filter(p => p !== null));
    
    res.json({ message: 'Stock alert settings updated successfully for all items' });
  } catch (err) {
    console.error('Error updating batch stock alert settings:', err);
    res.status(500).send('Server Error');
  }
});

// Get stock movement alerts (items with unusual movement patterns)
router.get('/movement-alerts', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const [rows] = await db.query(`
      SELECT 
        ii.id,
        ii.name,
        ii.category,
        sl.quantity,
        COUNT(sm.id) as movementCount,
        SUM(CASE WHEN sm.type = 'in' THEN sm.quantity ELSE 0 END) as totalIn,
        SUM(CASE WHEN sm.type = 'out' THEN sm.quantity ELSE 0 END) as totalOut,
        (SUM(CASE WHEN sm.type = 'in' THEN sm.quantity ELSE 0 END) - 
         SUM(CASE WHEN sm.type = 'out' THEN sm.quantity ELSE 0 END)) as netMovement
      FROM InventoryItem ii
      JOIN StockLevel sl ON ii.id = sl.inventoryItemId
      LEFT JOIN StockMovement sm ON ii.id = sm.inventoryItemId 
        AND sm.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY ii.id
      HAVING movementCount > 0
      ORDER BY ABS(netMovement) DESC
      LIMIT 20
    `, [days]);
    
    res.json({
      days: parseInt(days),
      movementAlerts: rows
    });
  } catch (err) {
    console.error('Error fetching movement alerts:', err);
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
        ii.category,
        ii.unitPrice,
        sl.quantity,
        ii.minimumStockLevel,
        ii.reorderPoint,
        ii.reorderQuantity,
        COALESCE(ii.reorderQuantity, ii.minimumStockLevel * 2) as suggestedQuantity,
        (COALESCE(ii.reorderQuantity, ii.minimumStockLevel * 2) * ii.unitPrice) as estimatedCost
      FROM InventoryItem ii
      JOIN StockLevel sl ON ii.id = sl.inventoryItemId
      WHERE sl.quantity <= ii.reorderPoint
      ORDER BY (sl.quantity - ii.reorderPoint) ASC
    `);
    
    const totalEstimatedCost = rows.reduce((sum, row) => sum + row.estimatedCost, 0);
    
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

