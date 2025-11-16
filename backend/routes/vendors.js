const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendors');
const authMiddleware = require('../middleware/authMiddleware');

// جميع مسارات الموردين تتطلب تسجيل الدخول
router.use(authMiddleware);

// Get vendor statistics (must be before /:id route)
router.get('/stats', vendorController.getVendorStats);

// Get all vendors with advanced filtering, pagination, and search
router.get('/', vendorController.getAllVendors);

// Get vendor by ID with detailed information
router.get('/:id', vendorController.getVendorById);

// Create a new vendor
router.post('/', vendorController.createVendor);

// Update a vendor
router.put('/:id', vendorController.updateVendor);

// Update vendor status
router.patch('/:id/status', vendorController.updateVendorStatus);

// Soft delete a vendor
router.delete('/:id', vendorController.deleteVendor);

module.exports = router;
