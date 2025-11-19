const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrders');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, purchaseOrderSchemas } = require('../middleware/validation');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get purchase order statistics (must be before /:id route)
router.get('/stats', purchaseOrderController.getPurchaseOrderStats);

// Get all purchase orders with advanced filtering, pagination, and search
router.get('/', validate(purchaseOrderSchemas.getPurchaseOrders, 'query'), purchaseOrderController.getAllPurchaseOrders);

// Get purchase order by ID with detailed information
router.get('/:id', validate(purchaseOrderSchemas.getPurchaseOrderById, 'params'), purchaseOrderController.getPurchaseOrderById);

// Create a new purchase order
router.post('/', validate(purchaseOrderSchemas.createPurchaseOrder, 'body'), purchaseOrderController.createPurchaseOrder);

// Update a purchase order
router.put('/:id', validate(purchaseOrderSchemas.updatePurchaseOrder, 'body'), purchaseOrderController.updatePurchaseOrder);

// Approve a purchase order
router.patch('/:id/approve', validate(purchaseOrderSchemas.approvePurchaseOrder, 'body'), purchaseOrderController.approvePurchaseOrder);

// Reject a purchase order
router.patch('/:id/reject', validate(purchaseOrderSchemas.rejectPurchaseOrder, 'body'), purchaseOrderController.rejectPurchaseOrder);

// Soft delete a purchase order
router.delete('/:id', validate(purchaseOrderSchemas.deletePurchaseOrder, 'params'), purchaseOrderController.deletePurchaseOrder);

module.exports = router;
