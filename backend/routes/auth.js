const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const authController = require('../controllers/authController');
const customerAuthController = require('../controllers/customerAuthController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeMiddleware = require('../middleware/authorizeMiddleware');

// Rate limiting for login endpoint (5 attempts per 15 minutes)
// TEMPORARILY DISABLED FOR DEVELOPMENT AND TESTING - RE-ENABLE AFTER COMPLETION
const loginLimiter = (req, res, next) => {
  // Rate limiting disabled during development
  next();
};
// const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // 5 attempts
//   message: {
//     message: 'Too many login attempts from this IP, please try again after 15 minutes.'
//   },
//   standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//   legacyHeaders: false, // Disable the `X-RateLimit-*` headers
//   skipSuccessfulRequests: false, // Count successful requests too
//   skipFailedRequests: false // Count failed requests
// });

// Validation schemas using Joi
const loginSchema = Joi.object({
  loginIdentifier: Joi.string().required().messages({
    'string.empty': 'Login identifier is required',
    'any.required': 'Login identifier is required'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required'
  })
});

const registerSchema = Joi.object({
  name: Joi.string().required().min(2).max(100).messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must be at most 100 characters long',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'string.empty': 'Email is required',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().min(8).messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required'
  }),
  roleId: Joi.number().integer().min(1).optional()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required',
    'any.required': 'Current password is required'
  }),
  newPassword: Joi.string().required().min(8).messages({
    'string.empty': 'New password is required',
    'string.min': 'New password must be at least 8 characters long',
    'any.required': 'New password is required'
  })
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must be at most 100 characters long',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().optional().messages({
    'string.email': 'Invalid email format'
  }),
  phone: Joi.string().max(30).allow(null, '').optional()
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({ message: errors.join(', ') });
    }
    req.body = value; // Use validated value
    next();
  };
};

// Authentication routes
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/register', validate(registerSchema), authController.register);

// Customer authentication routes
router.post('/customer/login', loginLimiter, validate(loginSchema), customerAuthController.customerLogin);
router.get('/customer/profile', authMiddleware, customerAuthController.getCustomerProfile);
router.put('/customer/profile', authMiddleware, customerAuthController.updateCustomerProfile);
router.post('/customer/change-password', authMiddleware, validate(changePasswordSchema), customerAuthController.changeCustomerPassword);

// Current user (restore session)
router.get('/me', authMiddleware, (req, res) => {
    // Ensure roleId is included (from JWT payload)
    const roleId = req.user.roleId || req.user.role;
    const role = req.user.role || req.user.roleId;
    
    res.json({ 
        id: req.user.id, 
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: role,
        roleId: roleId  // Add roleId explicitly for frontend
    });
});

// Logout (clear cookie)
router.post('/logout', (req, res) => {
    res.clearCookie('token', { 
        httpOnly: true, 
        sameSite: 'strict', 
        secure: process.env.NODE_ENV === 'production',
        path: '/'
    });
    res.json({ success: true });
});

// Profile management routes (require authentication)
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, validate(updateProfileSchema), authController.updateProfile);
router.post('/change-password', authMiddleware, validate(changePasswordSchema), authController.changePassword);

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
