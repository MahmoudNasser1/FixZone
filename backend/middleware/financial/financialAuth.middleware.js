// Financial Auth Middleware
// Handles authorization for financial operations

const { checkPermission } = require('../permissions.middleware');

/**
 * Check if user has permission for financial operations
 */
const financialAuth = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Define financial permissions based on role
    const financialPermissions = {
      admin: ['*'], // All permissions
      accountant: ['read', 'create', 'update'],
      manager: ['read', 'create', 'update', 'delete'],
      user: ['read']
    };

    const userRole = req.user.role || 'user';
    const userPermissions = financialPermissions[userRole] || ['read'];

    // Get action from request method
    let action = 'read';
    if (req.method === 'POST') action = 'create';
    else if (req.method === 'PUT' || req.method === 'PATCH') action = 'update';
    else if (req.method === 'DELETE') action = 'delete';

    // Check if user has permission
    if (userPermissions.includes('*') || userPermissions.includes(action)) {
      return next();
    }

    // Permission denied
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions for financial operations'
    });
  } catch (error) {
    console.error('Error in financialAuth middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization error',
      error: error.message
    });
  }
};

module.exports = { financialAuth };


