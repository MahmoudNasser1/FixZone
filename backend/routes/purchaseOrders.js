const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrders');

// Get purchase order statistics (must be before /:id route)
router.get('/stats', purchaseOrderController.getPurchaseOrderStats);

// Get all purchase orders with advanced filtering, pagination, and search
router.get('/', purchaseOrderController.getAllPurchaseOrders);

// Get purchase order by ID with detailed information
router.get('/:id', purchaseOrderController.getPurchaseOrderById);

// Create a new purchase order
router.post('/', purchaseOrderController.createPurchaseOrder);

// Update a purchase order
router.put('/:id', purchaseOrderController.updatePurchaseOrder);

// Approve a purchase order
router.patch('/:id/approve', purchaseOrderController.approvePurchaseOrder);

// Reject a purchase order
router.patch('/:id/reject', purchaseOrderController.rejectPurchaseOrder);

// Soft delete a purchase order
router.delete('/:id', purchaseOrderController.deletePurchaseOrder);

module.exports = router;
