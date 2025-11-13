const express = require('express');
const router = express.Router();
const invoicesController = require('../controllers/invoicesControllerSimple');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// GET /api/invoices - Get all invoices
router.get('/', invoicesController.getAllInvoices);

// GET /api/invoices/stats - Get invoice statistics
router.get('/stats', invoicesController.getInvoiceStats);

// Repair-related invoice routes (MUST come before /:id routes)
router.get('/by-repair/:repairId', invoicesController.getInvoiceByRepairId);
router.post('/create-from-repair/:repairId', invoicesController.createInvoiceFromRepair);

// GET /api/invoices/:id - Get single invoice by ID
router.get('/:id', invoicesController.getInvoiceById);

// POST /api/invoices - Create new invoice
router.post('/', invoicesController.createInvoice);

// PUT /api/invoices/:id - Update invoice
router.put('/:id', invoicesController.updateInvoice);

// DELETE /api/invoices/:id - Delete invoice
router.delete('/:id', invoicesController.deleteInvoice);

// Invoice Items routes
router.get('/:id/items', invoicesController.getInvoiceItems);
router.post('/:id/items', invoicesController.addInvoiceItem);
router.put('/:id/items/:itemId', invoicesController.updateInvoiceItem);
router.delete('/:id/items/:itemId', invoicesController.removeInvoiceItem);

module.exports = router;
