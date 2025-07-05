const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory');

router.get('/', inventoryController.getAllInventoryItems);
router.get('/:id', inventoryController.getInventoryItemById);
router.post('/', inventoryController.createInventoryItem);
router.put('/:id', inventoryController.updateInventoryItem);
router.delete('/:id', inventoryController.deleteInventoryItem);
router.patch('/:id/move', inventoryController.moveInventoryItem);

module.exports = router; 