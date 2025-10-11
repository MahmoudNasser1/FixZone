const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/stock-levels - Get all stock levels
router.get('/', async (req, res) => {
  try {
    const [levels] = await db.execute(`
      SELECT 
        sl.*,
        i.name as itemName,
        i.sku,
        w.name as warehouseName
      FROM StockLevel sl
      LEFT JOIN InventoryItem i ON sl.inventoryItemId = i.id
      LEFT JOIN Warehouse w ON sl.warehouseId = w.id
      WHERE i.deletedAt IS NULL
      ORDER BY sl.updatedAt DESC
    `);
    
    res.json({
      success: true,
      data: levels
    });
  } catch (error) {
    console.error('Error fetching stock levels:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/stock-levels/item/:itemId - Get stock levels for specific item
router.get('/item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const [levels] = await db.execute(`
      SELECT 
        sl.*,
        w.name as warehouseName
      FROM StockLevel sl
      LEFT JOIN Warehouse w ON sl.warehouseId = w.id
      WHERE sl.inventoryItemId = ?
      ORDER BY w.name
    `, [itemId]);
    
    res.json({
      success: true,
      data: levels
    });
  } catch (error) {
    console.error('Error fetching item stock levels:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/stock-levels/:id - Get single stock level
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [levels] = await db.execute(`
      SELECT 
        sl.*,
        i.name as itemName,
        i.sku,
        w.name as warehouseName
      FROM StockLevel sl
      LEFT JOIN InventoryItem i ON sl.inventoryItemId = i.id
      LEFT JOIN Warehouse w ON sl.warehouseId = w.id
      WHERE sl.id = ?
    `, [id]);
    
    if (levels.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stock level not found'
      });
    }
    
    res.json({
      success: true,
      data: levels[0]
    });
  } catch (error) {
    console.error('Error fetching stock level:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/stock-levels/:id - Update stock level
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, minLevel } = req.body;
    
    let updates = [];
    let params = [];
    
    if (quantity !== undefined) {
      updates.push('quantity = ?');
      params.push(quantity);
    }
    
    if (minLevel !== undefined) {
      updates.push('minLevel = ?');
      params.push(minLevel);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    params.push(id);
    
    const [result] = await db.execute(`
      UPDATE StockLevel 
      SET ${updates.join(', ')}, updatedAt = NOW()
      WHERE id = ?
    `, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stock level not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Stock level updated successfully'
    });
  } catch (error) {
    console.error('Error updating stock level:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
