const express = require('express');
const router = express.Router();
const customerDevicesController = require('../controllers/customerDevicesController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware
router.use(authMiddleware);

// GET /api/customer/devices - Get customer devices
router.get('/devices', customerDevicesController.getCustomerDevices);

module.exports = router;
