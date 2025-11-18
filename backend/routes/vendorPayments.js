const express = require('express');
const router = express.Router();
const vendorPaymentsController = require('../controllers/vendorPaymentsController');
const authMiddleware = require('../middleware/authMiddleware');

// جميع مسارات مدفوعات الموردين تتطلب تسجيل الدخول
// لكن يجب التأكد من عدم تطبيق authMiddleware على routes أخرى
// لذلك سنطبق authMiddleware على كل route بشكل فردي بدلاً من router.use

// Get vendor payment stats (must be before /:id route)
router.get('/vendors/:vendorId/payments/stats', authMiddleware, vendorPaymentsController.getVendorPaymentStats);

// Get vendor balance
router.get('/vendors/:vendorId/payments/balance', authMiddleware, vendorPaymentsController.getVendorBalance);

// Get all payments for a vendor
router.get('/vendors/:vendorId/payments', authMiddleware, vendorPaymentsController.getVendorPayments);

// Get single payment
router.get('/vendors/:vendorId/payments/:id', authMiddleware, vendorPaymentsController.getVendorPaymentById);

// Create new payment
router.post('/vendors/:vendorId/payments', authMiddleware, vendorPaymentsController.createVendorPayment);

// Update payment
router.put('/vendors/:vendorId/payments/:id', authMiddleware, vendorPaymentsController.updateVendorPayment);

// Update payment status
router.patch('/vendors/:vendorId/payments/:id/status', authMiddleware, vendorPaymentsController.updatePaymentStatus);

// Delete payment
router.delete('/vendors/:vendorId/payments/:id', authMiddleware, vendorPaymentsController.deleteVendorPayment);

module.exports = router;

