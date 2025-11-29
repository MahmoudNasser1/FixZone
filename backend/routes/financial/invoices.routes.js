// Invoices Routes
// Financial Module - Invoices API Endpoints

const express = require('express');
const router = express.Router();
const invoicesController = require('../../controllers/financial/invoices.controller');
const { validate } = require('../../middleware/validation');
const authMiddleware = require('../../middleware/authMiddleware');
const { financialRateLimit, financialCreateRateLimit, financialReportsRateLimit } = require('../../middleware/financial/financialRateLimit.middleware');
const { invoiceSchemas, commonSchemas } = require('../../middleware/validation');

// Apply authentication and rate limiting to all routes
router.use(authMiddleware);
router.use(financialRateLimit);

/**
 * @route   GET /api/financial/invoices
 * @desc    Get all invoices with filters and pagination
 * @access  Private
 */
router.get(
  '/',
  validate(invoiceSchemas?.getInvoices || {}, 'query'),
  invoicesController.getAll.bind(invoicesController)
);

/**
 * @route   GET /api/financial/invoices/stats
 * @desc    Get invoice statistics
 * @access  Private
 */
router.get(
  '/stats',
  financialReportsRateLimit,
  validate(invoiceSchemas?.getInvoiceStats || {}, 'query'),
  invoicesController.getStats.bind(invoicesController)
);

/**
 * @route   GET /api/financial/invoices/overdue
 * @desc    Get overdue invoices
 * @access  Private
 */
router.get(
  '/overdue',
  invoicesController.getOverdue.bind(invoicesController)
);

/**
 * @route   GET /api/financial/invoices/by-repair/:repairId
 * @desc    Get invoice by repair request ID
 * @access  Private
 */
router.get(
  '/by-repair/:repairId',
  validate(commonSchemas?.idParam || {}, 'params'),
  invoicesController.getByRepair.bind(invoicesController)
);

/**
 * @route   GET /api/financial/invoices/:id
 * @desc    Get invoice by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(commonSchemas?.idParam || {}, 'params'),
  invoicesController.getById.bind(invoicesController)
);

/**
 * @route   POST /api/financial/invoices
 * @desc    Create new invoice
 * @access  Private
 */
router.post(
  '/',
  financialCreateRateLimit,
  validate(invoiceSchemas?.createInvoice || {}, 'body'),
  invoicesController.create.bind(invoicesController)
);

/**
 * @route   POST /api/financial/invoices/create-from-repair/:repairId
 * @desc    Create invoice from repair request
 * @access  Private
 */
router.post(
  '/create-from-repair/:repairId',
  financialCreateRateLimit,
  validate(commonSchemas?.idParam || {}, 'params'),
  validate(invoiceSchemas?.createFromRepair || {}, 'body'),
  invoicesController.createFromRepair.bind(invoicesController)
);

module.exports = router;

