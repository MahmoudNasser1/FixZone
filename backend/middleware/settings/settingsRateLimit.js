// backend/middleware/settings/settingsRateLimit.js
const rateLimit = require('express-rate-limit');

/**
 * Rate limiting for settings read operations
 * 100 requests per minute
 */
const settingsReadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    message: 'Too many read requests, please try again later',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin users in development
    if (process.env.NODE_ENV !== 'production' && req.user && req.user.role === 1) {
      return true;
    }
    return false;
  }
});

/**
 * Rate limiting for settings write operations
 * 20 requests per minute
 */
const settingsWriteRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: {
    success: false,
    message: 'Too many write requests, please try again later',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin users in development
    if (process.env.NODE_ENV !== 'production' && req.user && req.user.role === 1) {
      return true;
    }
    return false;
  }
});

/**
 * Rate limiting for settings admin operations
 * 10 requests per minute
 */
const settingsAdminRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    success: false,
    message: 'Too many admin requests, please try again later',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiting for settings import/export operations
 * 5 requests per 5 minutes
 */
const settingsImportExportRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 requests per 5 minutes
  message: {
    success: false,
    message: 'Too many import/export requests, please try again later',
    retryAfter: 300
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  settingsReadRateLimit,
  settingsWriteRateLimit,
  settingsAdminRateLimit,
  settingsImportExportRateLimit
};

