const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeMiddleware = require('../middleware/authorizeMiddleware');

// Authentication routes
router.post('/login', authController.login);
router.post('/register', authController.register);

// Protected route example

// Protected route accessible by any authenticated user
router.get('/protected', authMiddleware, (req, res) => {
    res.json({ message: 'This is a protected route accessible by any authenticated user!', user: req.user });
});

// Protected route accessible only by Admin (assuming RoleID 1 is Admin)
router.get('/admin-only', authMiddleware, authorizeMiddleware([1]), (req, res) => {
    res.json({ message: 'This is an admin-only route!', user: req.user });
});

// Protected route accessible by User or Admin (assuming RoleID 1 is Admin, 2 is User)
router.get('/user-and-admin', authMiddleware, authorizeMiddleware([1, 2]), (req, res) => {
    res.json({ message: 'This route is accessible by users and admins!', user: req.user });
});

module.exports = router;
