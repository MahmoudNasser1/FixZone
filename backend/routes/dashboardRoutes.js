const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeMiddleware = require('../middleware/authorizeMiddleware');

// Get dashboard statistics (requires authentication and admin/technician role)
router.get('/stats', authMiddleware, authorizeMiddleware(['admin', 'technician']), dashboardController.getDashboardStats);

module.exports = router;
