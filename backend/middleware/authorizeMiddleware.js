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
            // #region agent log
            const fs = require('fs');
            const logPath = '/opt/lampp/htdocs/FixZone/.cursor/debug.log';
            try {
              fs.appendFileSync(logPath, JSON.stringify({location:'authorizeMiddleware.js:20',message:'Checking user role',data:{userId:req.user?.id,userRole,hasRole:!!req.user?.role,hasRoleId:!!req.user?.roleId,allowedRoles,url:req.originalUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n');
            } catch(e){}
            // #endregion
            
            if (!userRole) {
                // #region agent log
                try {
                  fs.appendFileSync(logPath, JSON.stringify({location:'authorizeMiddleware.js:25',message:'User role not found',data:{userId:req.user?.id,user:req.user,url:req.originalUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n');
                } catch(e){}
                // #endregion
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
            // #region agent log
            try {
              fs.appendFileSync(logPath, JSON.stringify({location:'authorizeMiddleware.js:58',message:'Checking role authorization',data:{userId:req.user?.id,roleId:role.id,roleName:role.name,userRole,allowedRoles,isAllowedByRoleId:allowedRoles.includes(role.id),isAllowedByRoleName:allowedRoles.includes(role.name),isAllowedByUserRole:allowedRoles.includes(userRole),isAllowed,url:req.originalUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n');
            } catch(e){}
            // #endregion

            if (!isAllowed) {
                // #region agent log
                try {
                  fs.appendFileSync(logPath, JSON.stringify({location:'authorizeMiddleware.js:63',message:'Access denied',data:{userId:req.user.id,userRole:role.name,roleId:role.id,allowedRoles,url:req.originalUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n');
                } catch(e){}
                // #endregion
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
