const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Validation schemas
const updateSettingsSchema = Joi.object({
  minimumStockLevel: Joi.number().integer().min(0).required()
    .messages({
      'number.base': 'مستوى المخزون الأدنى يجب أن يكون رقم',
      'number.min': 'مستوى المخزون الأدنى يجب أن يكون موجب',
      'any.required': 'مستوى المخزون الأدنى مطلوب'
    })
});

// Get all alerts (default route)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        ii.id,
        ii.name,
        ii.type as category,
        ii.purchasePrice as unitPrice,
        sl.warehouseId,
        w.name as warehouseName,
        sl.quantity,
        sl.minLevel as minimumStockLevel,
        (sl.quantity - sl.minLevel) as stockDeficit,
        CASE 
          WHEN sl.quantity <= 0 THEN 'out_of_stock'
          WHEN sl.quantity <= sl.minLevel THEN 'low_stock'
          ELSE 'normal'
        END as alertLevel
      FROM InventoryItem ii
      JOIN StockLevel sl ON ii.id = sl.inventoryItemId
      LEFT JOIN Warehouse w ON sl.warehouseId = w.id
      WHERE ii.deletedAt IS NULL 
        AND sl.deletedAt IS NULL
        AND sl.quantity <= sl.minLevel
      ORDER BY alertLevel DESC, stockDeficit ASC
    `);
    
    res.json({
      success: true,
      data: rows,
      total: rows.length
    });
  } catch (err) {
    console.error('Error fetching stock alerts:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      details: err.message
    });
  }
});

// Get low stock alerts
router.get('/low', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        ii.id,
        ii.name,
        ii.type as category,
        ii.purchasePrice as unitPrice,
        sl.warehouseId,
        w.name as warehouseName,
        sl.quantity,
        sl.minLevel as minimumStockLevel,
        (sl.quantity - sl.minLevel) as stockDeficit,
        CASE 
          WHEN sl.quantity <= 0 THEN 'out_of_stock'
          WHEN sl.quantity <= sl.minLevel THEN 'low_stock'
          ELSE 'normal'
        END as alertLevel
      FROM InventoryItem ii
      JOIN StockLevel sl ON ii.id = sl.inventoryItemId
      LEFT JOIN Warehouse w ON sl.warehouseId = w.id
      WHERE ii.deletedAt IS NULL 
        AND sl.deletedAt IS NULL
        AND sl.quantity <= sl.minLevel
      ORDER BY alertLevel DESC, stockDeficit ASC
    `);
    
    res.json({
      success: true,
      data: {
        alerts: rows,
        totalAlerts: rows.length,
        outOfStock: rows.filter(item => item.alertLevel === 'out_of_stock').length,
        lowStock: rows.filter(item => item.alertLevel === 'low_stock').length
      }
    });
  } catch (err) {
    console.error('Error fetching low stock alerts:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      details: err.message
    });
  }
});

// Get stock alerts settings
router.get('/settings', async (req, res) => {
  try {
    const [rows] = await db.execute(`
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
      success: true,
      data: {
        settings: rows
      }
    });
  } catch (err) {
    console.error('Error fetching stock alert settings:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      details: err.message
    });
  }
});

// Update stock alert settings for a specific item
router.put('/settings/:itemId', validate(updateSettingsSchema, 'body'), async (req, res) => {
  try {
    const { itemId } = req.params;
    const { minimumStockLevel } = req.body;
    
    // Validate itemId
    const itemIdNum = parseInt(itemId);
    if (isNaN(itemIdNum) || itemIdNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'معرف الصنف غير صحيح'
      });
    }
    
    // Check if item exists
    const [itemResult] = await db.execute(
      'SELECT id, name FROM InventoryItem WHERE id = ? AND deletedAt IS NULL',
      [itemIdNum]
    );
    
    if (itemResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الصنف غير موجود'
      });
    }
    
    // Check if StockLevel exists
    const [stockLevelResult] = await db.execute(
      'SELECT id FROM StockLevel WHERE inventoryItemId = ?',
      [itemIdNum]
    );
    
    if (stockLevelResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'مستوى المخزون غير موجود للصنف'
      });
    }
    
    const [result] = await db.execute(
      'UPDATE StockLevel SET minLevel = ?, updatedAt = NOW() WHERE inventoryItemId = ?',
      [minimumStockLevel, itemIdNum]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على مستوى المخزون'
      });
    }
    
    // Get updated settings
    const [updated] = await db.execute(
      'SELECT * FROM StockLevel WHERE inventoryItemId = ?',
      [itemIdNum]
    );
    
    res.json({
      success: true,
      data: updated[0],
      message: 'تم تحديث إعدادات التنبيه بنجاح'
    });
  } catch (err) {
    console.error('Error updating stock alert settings:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      details: err.message
    });
  }
});

// Generate reorder suggestions
router.get('/reorder-suggestions', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        ii.id,
        ii.name,
        ii.type as category,
        ii.purchasePrice as unitPrice,
        sl.warehouseId,
        w.name as warehouseName,
        sl.quantity,
        sl.minLevel as reorderPoint,
        (sl.minLevel * 2) as suggestedQuantity,
        ((sl.minLevel * 2) * ii.purchasePrice) as estimatedCost
      FROM InventoryItem ii
      JOIN StockLevel sl ON ii.id = sl.inventoryItemId
      LEFT JOIN Warehouse w ON sl.warehouseId = w.id
      WHERE ii.deletedAt IS NULL 
        AND sl.deletedAt IS NULL
        AND sl.quantity <= sl.minLevel
      ORDER BY (sl.quantity - sl.minLevel) ASC
    `);
    
    const totalEstimatedCost = rows.reduce((sum, row) => sum + parseFloat(row.estimatedCost || 0), 0);
    
    res.json({
      success: true,
      data: {
        suggestions: rows,
        totalItems: rows.length,
        totalEstimatedCost
      }
    });
  } catch (err) {
    console.error('Error generating reorder suggestions:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      details: err.message
    });
  }
});

module.exports = router;
