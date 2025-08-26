const express = require('express');
const router = express.Router();
const invoicesController = require('../controllers/invoicesController');

// Get all invoices with advanced filtering and pagination
router.get('/', invoicesController.getAllInvoices);

// Get invoice statistics (place before dynamic :id route)
router.get('/stats', invoicesController.getStatistics);

// Bulk actions for invoices
router.post('/bulk-action', invoicesController.bulkAction);

// Create a new invoice
router.post('/', invoicesController.createInvoice);

// Generate invoice PDF
router.get('/:id/pdf', invoicesController.generatePDF);

// Update an invoice
router.put('/:id', invoicesController.updateInvoice);

// Soft delete an invoice
router.delete('/:id', invoicesController.deleteInvoice);

// Get invoice by ID with full details
router.get('/:id', invoicesController.getInvoiceById);

// Invoice items operations
router.post('/:id/items', invoicesController.addInvoiceItem);
router.delete('/:id/items/:itemId', invoicesController.removeInvoiceItem);


module.exports = router;
