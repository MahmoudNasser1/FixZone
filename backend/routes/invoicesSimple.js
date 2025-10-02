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

// GET /api/invoices/:id - Get single invoice by ID
router.get('/:id', invoicesController.getInvoiceById);

// POST /api/invoices - Create new invoice
router.post('/', invoicesController.createInvoice);

module.exports = router;
