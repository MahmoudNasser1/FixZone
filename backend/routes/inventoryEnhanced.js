// backend/routes/inventoryEnhanced.js
// Enhanced Inventory Routes with Validation

const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryEnhanced');
const { validate, inventorySchemas, commonSchemas } = require('../middleware/validation');

/**
 * GET /api/inventory-enhanced/stats
 * Get inventory statistics
 */
router.get('/stats', inventoryController.getStats);

/**
 * GET /api/inventory-enhanced/ (root)
 * Get all inventory items with filters and pagination (alias)
 */
router.get('/', 
  inventoryController.getAllItems
);

/**
 * GET /api/inventory-enhanced/items
 * Get all inventory items with filters and pagination
 */
router.get('/items', 
  inventoryController.getAllItems
);

/**
 * GET /api/inventory-enhanced/:id
 * Get single inventory item by ID (root level)
 */
router.get('/:id(\\d+)',
  inventoryController.getItemById
);

/**
 * GET /api/inventory-enhanced/items/:id
 * Get single inventory item by ID
 */
router.get('/items/:id',
  inventoryController.getItemById
);

/**
 * POST /api/inventory-enhanced/items
 * Create new inventory item
 */
router.post('/items',
  inventoryController.createItem
);

/**
 * PUT /api/inventory-enhanced/items/:id
 * Update inventory item
 */
router.put('/items/:id',
  inventoryController.updateItem
);

/**
 * DELETE /api/inventory-enhanced/items/:id
 * Delete inventory item (soft delete)
 */
router.delete('/items/:id',
  inventoryController.deleteItem
);

/**
 * GET /api/inventory-enhanced/movements
 * Get stock movements
 */
router.get('/movements',
  inventoryController.getMovements
);

/**
 * POST /api/inventory-enhanced/movements
 * Create stock movement
 */
router.post('/movements',
  inventoryController.createMovement
);

/**
 * GET /api/inventory-enhanced/categories
 * Get all categories
 */
router.get('/categories', async (req, res) => {
  try {
    const db = require('../db');
    const [categories] = await db.execute('SELECT * FROM InventoryItemCategory ORDER BY name');
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;