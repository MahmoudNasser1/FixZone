const express = require('express');
const router = express.Router();
const vendorPaymentsController = require('../controllers/vendorPaymentsController');
const authMiddleware = require('../middleware/authMiddleware');

// جميع مسارات مدفوعات الموردين تتطلب تسجيل الدخول
router.use(authMiddleware);

// Get vendor payment stats (must be before /:id route)
router.get('/vendors/:vendorId/payments/stats', vendorPaymentsController.getVendorPaymentStats);

// Get vendor balance
router.get('/vendors/:vendorId/payments/balance', vendorPaymentsController.getVendorBalance);

// Get all payments for a vendor
router.get('/vendors/:vendorId/payments', vendorPaymentsController.getVendorPayments);

// Get single payment
router.get('/vendors/:vendorId/payments/:id', vendorPaymentsController.getVendorPaymentById);

// Create new payment
router.post('/vendors/:vendorId/payments', vendorPaymentsController.createVendorPayment);

// Update payment
router.put('/vendors/:vendorId/payments/:id', vendorPaymentsController.updateVendorPayment);

// Update payment status
router.patch('/vendors/:vendorId/payments/:id/status', vendorPaymentsController.updatePaymentStatus);

// Delete payment
router.delete('/vendors/:vendorId/payments/:id', vendorPaymentsController.deleteVendorPayment);

module.exports = router;

