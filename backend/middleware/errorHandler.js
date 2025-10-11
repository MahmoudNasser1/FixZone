// backend/middleware/errorHandler.js
// Centralized Error Handling Middleware

/**
 * Custom Error Class
 */
class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?.id
  });

  // MySQL Duplicate Entry Error
  if (err.code === 'ER_DUP_ENTRY') {
    const field = err.message.match(/for key '(.+?)'/)?.[1] || 'unknown';
    error = new AppError(
      `القيمة موجودة مسبقاً في حقل ${field}`,
      409
    );
  }

  // MySQL Foreign Key Constraint Error
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    error = new AppError(
      'المعرف المرجعي غير موجود',
      400
    );
  }

  // MySQL Data Too Long Error
  if (err.code === 'ER_DATA_TOO_LONG') {
    error = new AppError(
      'البيانات المدخلة أطول من المسموح',
      400
    );
  }

  // Validation Error (from Joi)
  if (err.name === 'ValidationError') {
    const errors = err.details?.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    })) || [];
    
    error = new AppError(
      'خطأ في البيانات المدخلة',
      400,
      errors
    );
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('رمز المصادقة غير صحيح', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('انتهت صلاحية رمز المصادقة', 401);
  }

  // Cast Error (Invalid ObjectId, etc)
  if (err.name === 'CastError') {
    error = new AppError('معرف غير صحيح', 400);
  }

  // Default Error Response
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || err.message || 'حدث خطأ في الخادم';

  res.status(statusCode).json({
    success: false,
    message,
    ...(error.errors && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      details: err 
    })
  });
};

/**
 * Not Found Handler
 */
const notFound = (req, res, next) => {
  const error = new AppError(
    `المسار ${req.originalUrl} غير موجود`,
    404
  );
  next(error);
};

/**
 * Async Handler - Wrapper for async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = errorHandler;
module.exports.AppError = AppError;
module.exports.errorHandler = errorHandler;
module.exports.notFound = notFound;
module.exports.asyncHandler = asyncHandler;

