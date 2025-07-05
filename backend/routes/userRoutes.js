const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeMiddleware = require('../middleware/authorizeMiddleware');

// User Management Routes (Admin Only)
// Get all users - requires authentication and Admin role (RoleID 1)
router.get('/users', authMiddleware, authorizeMiddleware([1]), userController.getAllUsers);

// Get user by ID - requires authentication and Admin role
router.get('/users/:id', authMiddleware, authorizeMiddleware([1]), userController.getUserById);

// Update user - requires authentication and Admin role
router.put('/users/:id', authMiddleware, authorizeMiddleware([1]), userController.updateUser);

// Delete user (soft delete) - requires authentication and Admin role
router.delete('/users/:id', authMiddleware, authorizeMiddleware([1]), userController.deleteUser);

// Role Management Routes (Admin Only)
// Get all roles - requires authentication and Admin role
router.get('/roles', authMiddleware, authorizeMiddleware([1]), userController.getAllRoles);

module.exports = router;
