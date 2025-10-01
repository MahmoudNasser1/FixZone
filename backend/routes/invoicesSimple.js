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

module.exports = router;
