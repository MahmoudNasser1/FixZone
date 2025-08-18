const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// Get all inventory items with advanced filtering and pagination
router.get('/', inventoryController.getAllInventoryItems);

// Get inventory statistics
router.get('/stats', inventoryController.getInventoryStatistics);

// Get low stock alerts
router.get('/alerts/low-stock', inventoryController.getLowStockAlerts);

// Get inventory item by ID with stock levels
router.get('/:id', inventoryController.getInventoryItemById);

// Create a new inventory item
router.post('/', inventoryController.createInventoryItem);

// Update an inventory item
router.put('/:id', inventoryController.updateInventoryItem);

// Soft delete an inventory item
router.delete('/:id', inventoryController.deleteInventoryItem);

// Adjust stock levels
router.post('/:id/adjust-stock', inventoryController.adjustStock);

// Bulk actions for inventory items
router.post('/bulk-action', inventoryController.bulkAction);

module.exports = router;
