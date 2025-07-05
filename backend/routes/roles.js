const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeMiddleware = require('../middleware/authorizeMiddleware');

// Role Management Routes (Admin Only)
// Get all roles - requires authentication and Admin role (RoleID 1)
router.get('/', authMiddleware, authorizeMiddleware([1]), userController.getAllRoles);

module.exports = router;
