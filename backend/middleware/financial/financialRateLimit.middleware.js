// Financial Rate Limit Middleware
// Rate limiting for financial operations

const rateLimit = require('express-rate-limit');

/**
 * Rate limit for financial operations
 * 100 requests per 15 minutes
 */
const financialRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many financial requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admins
    return req.user && req.user.role === 'admin';
  }
});

/**
 * Rate limit for financial creation operations
 * 50 requests per 15 minutes
 */
const financialCreateRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: 'Too many creation requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.user && req.user.role === 'admin';
  }
});

/**
 * Rate limit for financial reports
 * 20 requests per hour
 */
const financialReportsRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    success: false,
    message: 'Too many report requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.user && req.user.role === 'admin';
  }
});

module.exports = {
  financialRateLimit,
  financialCreateRateLimit,
  financialReportsRateLimit
};


