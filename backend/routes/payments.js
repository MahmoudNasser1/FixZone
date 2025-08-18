const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const paymentsController = require('../controllers/paymentsController');
const authMiddleware = require('../middleware/authMiddleware');

// Validation rules for payment creation
const createPaymentValidation = [
  body('customerId').isInt().withMessage('Customer ID must be a valid integer'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('paymentMethod').isIn(['cash', 'bank_transfer', 'credit_card', 'check']).withMessage('Invalid payment method'),
  body('paymentDate').isISO8601().withMessage('Payment date must be a valid date'),
  body('currency').optional().isIn(['EGP', 'USD', 'EUR']).withMessage('Invalid currency')
];

// Validation rules for payment update
const updatePaymentValidation = [
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('paymentMethod').optional().isIn(['cash', 'bank_transfer', 'credit_card', 'check']).withMessage('Invalid payment method'),
  body('paymentDate').optional().isISO8601().withMessage('Payment date must be a valid date'),
  body('status').optional().isIn(['pending', 'completed', 'cancelled']).withMessage('Invalid status')
];

// Get all payments with filtering and pagination
router.get('/', authMiddleware, paymentsController.getAllPayments);

// Get payment statistics
router.get('/stats', authMiddleware, paymentsController.getPaymentStats);

// Get payment by ID
router.get('/:id', authMiddleware, paymentsController.getPaymentById);

// Create new payment with accounting integration
router.post('/', authMiddleware, createPaymentValidation, paymentsController.createPayment);

// Update payment
router.put('/:id', authMiddleware, updatePaymentValidation, paymentsController.updatePayment);

// Delete payment (soft delete)
router.delete('/:id', authMiddleware, paymentsController.deletePayment);

module.exports = router;
