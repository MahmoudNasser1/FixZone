// Expenses Routes
// Financial Module - Expenses API Endpoints

const express = require('express');
const router = express.Router();
const expensesController = require('../../controllers/financial/expenses.controller');
const { validate } = require('../../middleware/validation');
const authMiddleware = require('../../middleware/authMiddleware');
const { financialRateLimit, financialCreateRateLimit } = require('../../middleware/financial/financialRateLimit.middleware');
const { expenseSchemas } = require('../../middleware/validation');

// Apply authentication and rate limiting to all routes
router.use(authMiddleware);
router.use(financialRateLimit);

/**
 * @route   GET /api/financial/expenses
 * @desc    Get all expenses with filters and pagination
 * @access  Private
 */
router.get(
  '/',
  validate(expenseSchemas?.getExpenses || {}, 'query'),
  expensesController.getAll.bind(expensesController)
);

const { financialReportsRateLimit } = require('../../middleware/financial/financialRateLimit.middleware');

/**
 * @route   GET /api/financial/expenses/stats
 * @desc    Get expense statistics
 * @access  Private
 */
router.get(
  '/stats',
  financialReportsRateLimit,
  validate(expenseSchemas?.getExpenseStats || {}, 'query'),
  expensesController.getStats.bind(expensesController)
);

/**
 * @route   GET /api/financial/expenses/:id
 * @desc    Get expense by ID
 * @access  Private
 */
router.get(
  '/:id',
  expensesController.getById.bind(expensesController)
);

/**
 * @route   POST /api/financial/expenses
 * @desc    Create new expense
 * @access  Private
 */
router.post(
  '/',
  financialCreateRateLimit,
  validate(expenseSchemas?.createExpense || {}, 'body'),
  expensesController.create.bind(expensesController)
);

/**
 * @route   PUT /api/financial/expenses/:id
 * @desc    Update expense
 * @access  Private
 */
router.put(
  '/:id',
  validate(expenseSchemas?.updateExpense || {}, 'body'),
  expensesController.update.bind(expensesController)
);

/**
 * @route   DELETE /api/financial/expenses/:id
 * @desc    Delete expense (soft delete)
 * @access  Private
 */
router.delete(
  '/:id',
  expensesController.delete.bind(expensesController)
);

module.exports = router;

