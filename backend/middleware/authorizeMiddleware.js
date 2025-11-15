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
                return res.status(403).json({ 
                    success: false,
                    message: 'User role not found' 
                });
            }

            // Check if the user's role is included in the allowedRoles
            if (!allowedRoles.includes(userRole)) {
                // Check role name if roleId doesn't match
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

                // Check if role name is in allowed roles (for backward compatibility)
                if (!allowedRoles.includes(role.name) && !allowedRoles.includes(role.id)) {
                    return res.status(403).json({ 
                        success: false,
                        message: 'Access denied: Insufficient permissions',
                        userRole: role.name,
                        roleId: role.id,
                        allowedRoles: allowedRoles
                    });
                }
            } else {
                // Verify role is active
                const [roles] = await db.execute(
                    'SELECT isActive FROM Role WHERE id = ? AND deletedAt IS NULL',
                    [userRole]
                );

                if (roles.length && !roles[0].isActive) {
                    return res.status(403).json({ 
                        success: false,
                        message: 'User role is inactive' 
                    });
                }
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
