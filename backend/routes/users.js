const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeMiddleware = require('../middleware/authorizeMiddleware');

// User Management Routes (Admin Only)
// Get all users - requires authentication and Admin role (RoleID 1)
router.get('/', authMiddleware, authorizeMiddleware([1]), userController.getAllUsers);

// Create new user - requires authentication and Admin role
router.post('/', authMiddleware, authorizeMiddleware([1]), userController.createUser);

// Get user by ID - requires authentication and Admin role
router.get('/:id', authMiddleware, authorizeMiddleware([1]), userController.getUserById);

// Update user - requires authentication and Admin role
router.put('/:id', authMiddleware, authorizeMiddleware([1]), userController.updateUser);

// Delete user (soft delete) - requires authentication and Admin role
router.delete('/:id', authMiddleware, authorizeMiddleware([1]), userController.deleteUser);

module.exports = router;
