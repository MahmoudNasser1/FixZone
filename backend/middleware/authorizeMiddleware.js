const db = require('../db');

/**
 * Enhanced Authorization Middleware
 * Checks if user's role is in the allowed roles list
 * Also supports checking if role is active
 */
const authorizeMiddleware = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            // Check if user is authenticated (authMiddleware should run before this)
            if (!req.user) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Authentication required' 
                });
            }

            // Get user role
            const userRole = req.user.role || req.user.roleId;
            
            if (!userRole) {
                console.warn('⚠️ [AUTH] User role not found:', {
                    userId: req.user.id,
                    user: req.user,
                    url: req.originalUrl
                });
                return res.status(403).json({ 
                    success: false,
                    message: 'User role not found' 
                });
            }

            // Get role details from database
            const [roles] = await db.execute(
                'SELECT id, name, isActive FROM Role WHERE id = ? AND deletedAt IS NULL',
                [userRole]
            );

            if (!roles.length) {
                return res.status(403).json({ 
                    success: false,
                    message: 'Role not found' 
                });
            }

            const role = roles[0];
            
            // Check if role is active
            if (!role.isActive) {
                return res.status(403).json({ 
                    success: false,
                    message: 'User role is inactive' 
                });
            }

            // Check if user's role (by ID or name) is in allowedRoles
            const isAllowed = allowedRoles.includes(role.id) || 
                            allowedRoles.includes(role.name) || 
                            allowedRoles.includes(userRole);

            if (!isAllowed) {
                console.warn('⚠️ [AUTH] Access denied:', {
                    userId: req.user.id,
                    userRole: role.name,
                    roleId: role.id,
                    allowedRoles: allowedRoles,
                    url: req.originalUrl
                });
                return res.status(403).json({ 
                    success: false,
                    message: 'Access denied: Insufficient permissions',
                    userRole: role.name,
                    roleId: role.id,
                    allowedRoles: allowedRoles
                });
            }

            // If authorized, proceed to the next middleware/route handler
            next();
        } catch (error) {
            console.error('Error in authorizeMiddleware:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Error checking authorization',
                error: error.message 
            });
        }
    };
};

module.exports = authorizeMiddleware;
