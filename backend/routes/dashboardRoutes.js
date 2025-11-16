const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeMiddleware = require('../middleware/authorizeMiddleware');

// Get dashboard statistics (requires authentication and admin/technician/manager role)
// نسمح للأدمن + الفني + المانجر (roleId 2) بالوصول
router.get('/stats', authMiddleware, authorizeMiddleware([1, 2, 'admin', 'technician', 'manager']), dashboardController.getDashboardStats);

// Get recent repairs (requires authentication)
router.get('/recent-repairs', authMiddleware, dashboardController.getRecentRepairs);

// Get alerts (overdue repairs and low stock items) (requires authentication)
router.get('/alerts', authMiddleware, dashboardController.getAlerts);

module.exports = router;
