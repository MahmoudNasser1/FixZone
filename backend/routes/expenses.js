const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const expensesController = require('../controllers/expensesController');
const authMiddleware = require('../middleware/authMiddleware');

// Validation rules for expense creation
const createExpenseValidation = [
  body('description').notEmpty().withMessage('Description is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('category').isIn(['office_supplies', 'utilities', 'maintenance', 'marketing', 'travel', 'rent', 'salaries', 'other']).withMessage('Invalid category'),
  body('expenseDate').isISO8601().withMessage('Expense date must be a valid date'),
  body('paymentMethod').isIn(['cash', 'bank_transfer', 'credit_card', 'check']).withMessage('Invalid payment method'),
  body('currency').optional().isIn(['EGP', 'USD', 'EUR']).withMessage('Invalid currency')
];

// Validation rules for expense update
const updateExpenseValidation = [
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('category').optional().isIn(['office_supplies', 'utilities', 'maintenance', 'marketing', 'travel', 'rent', 'salaries', 'other']).withMessage('Invalid category'),
  body('expenseDate').optional().isISO8601().withMessage('Expense date must be a valid date'),
  body('paymentMethod').optional().isIn(['cash', 'bank_transfer', 'credit_card', 'check']).withMessage('Invalid payment method'),
  body('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status')
];

// Get all expenses with filtering and pagination
router.get('/', authMiddleware, expensesController.getAllExpenses);

// Get expense statistics
router.get('/stats', authMiddleware, expensesController.getExpenseStats);

// Get expense categories
router.get('/categories', authMiddleware, expensesController.getExpenseCategories);

// Get expense by ID
router.get('/:id', authMiddleware, expensesController.getExpenseById);

// Create new expense with accounting integration
router.post('/', authMiddleware, createExpenseValidation, expensesController.createExpense);

// Update expense
router.put('/:id', authMiddleware, updateExpenseValidation, expensesController.updateExpense);

// Delete expense (soft delete)
router.delete('/:id', authMiddleware, expensesController.deleteExpense);

module.exports = router;
