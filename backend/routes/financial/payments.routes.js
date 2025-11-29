// Payments Routes
// Financial Module - Payments API Endpoints

const express = require('express');
const router = express.Router();
const paymentsController = require('../../controllers/financial/payments.controller');
const { validate } = require('../../middleware/validation');
const authMiddleware = require('../../middleware/authMiddleware');
const { financialRateLimit, financialCreateRateLimit, financialReportsRateLimit } = require('../../middleware/financial/financialRateLimit.middleware');
const { paymentSchemas, commonSchemas } = require('../../middleware/validation');

// Apply authentication and rate limiting to all routes
router.use(authMiddleware);
router.use(financialRateLimit);

/**
 * @route   GET /api/financial/payments
 * @desc    Get all payments with filters and pagination
 * @access  Private
 */
router.get(
  '/',
  validate(paymentSchemas?.getPayments || {}, 'query'),
  paymentsController.getAll.bind(paymentsController)
);

/**
 * @route   GET /api/financial/payments/stats/summary
 * @desc    Get payment statistics summary
 * @access  Private
 */
router.get(
  '/stats/summary',
  financialReportsRateLimit,
  validate(paymentSchemas?.getPaymentStats || {}, 'query'),
  paymentsController.getStatsSummary.bind(paymentsController)
);

/**
 * @route   GET /api/financial/payments/overdue
 * @desc    Get overdue payments
 * @access  Private
 */
router.get(
  '/overdue',
  paymentsController.getOverdue.bind(paymentsController)
);

/**
 * @route   GET /api/financial/payments/invoice/:invoiceId
 * @desc    Get payments by invoice ID
 * @access  Private
 */
router.get(
  '/invoice/:invoiceId',
  validate(commonSchemas?.idParam || {}, 'params'),
  paymentsController.getByInvoice.bind(paymentsController)
);

/**
 * @route   GET /api/financial/payments/:id
 * @desc    Get payment by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(commonSchemas?.idParam || {}, 'params'),
  paymentsController.getById.bind(paymentsController)
);

/**
 * @route   POST /api/financial/payments
 * @desc    Create new payment
 * @access  Private
 */
router.post(
  '/',
  financialCreateRateLimit,
  validate(paymentSchemas?.createPayment || {}, 'body'),
  paymentsController.create.bind(paymentsController)
);

module.exports = router;

