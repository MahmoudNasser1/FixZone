const db = require('../db');

/**
 * Advanced Permission Middleware
 * Checks user permissions from Role.permissions JSON field
 * Supports permission inheritance through parentRoleId
 */

/**
 * Check if user has a specific permission
 * @param {string} requiredPermission - Permission string in format "module.action" or "module.action_own"
 * @param {object} options - Additional options
 * @returns {Function} Express middleware
 */
const checkPermission = (requiredPermission, options = {}) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const userId = req.user.id || req.user.userId;
      const roleId = req.user.roleId || req.user.role;

      if (!roleId) {
        return res.status(403).json({ 
          success: false, 
          message: 'User role not found' 
        });
      }

      // Admin (roleId = 1) has all permissions
      if (roleId === 1) {
        return next();
      }

      // Get role and permissions
      const [roles] = await db.execute(
        'SELECT id, name, permissions, parentRoleId FROM Role WHERE id = ? AND deletedAt IS NULL AND isActive = 1',
        [roleId]
      );

      if (!roles.length) {
        return res.status(403).json({ 
          success: false, 
          message: 'Role not found or inactive' 
        });
      }

      const role = roles[0];
      let permissions = {};

      // Parse permissions JSON
      try {
        permissions = role.permissions 
          ? (typeof role.permissions === 'string' 
              ? JSON.parse(role.permissions) 
              : role.permissions)
          : {};
      } catch (e) {
        console.error('Error parsing permissions JSON:', e);
        return res.status(500).json({ 
          success: false, 
          message: 'Error parsing role permissions' 
        });
      }

      // Check for "all" permission
      if (permissions.all === true) {
        return next();
      }

      // Check direct permission
      if (permissions[requiredPermission] === true) {
        return next();
      }

      // Check permission inheritance from parent role
      if (role.parentRoleId) {
        const hasParentPermission = await checkParentPermission(
          role.parentRoleId, 
          requiredPermission
        );
        if (hasParentPermission) {
          return next();
        }
      }

      // Check for wildcard permissions (e.g., "repairs.*" if permission is "repairs.view")
      const module = requiredPermission.split('.')[0];
      const wildcardPermission = `${module}.*`;
      if (permissions[wildcardPermission] === true) {
        return next();
      }

      // Check if it's an "own" permission and user is accessing their own resource
      if (options.allowOwn && requiredPermission.endsWith('_own')) {
        const resourceOwnerId = options.getOwnerId ? options.getOwnerId(req) : null;
        if (resourceOwnerId && (resourceOwnerId === userId || resourceOwnerId === parseInt(userId))) {
          return next();
        }
      }

      // Permission denied
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: Insufficient permissions',
        required: requiredPermission,
        userRole: role.name,
        roleId: roleId
      });

    } catch (error) {
      console.error('Error in permission middleware:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking permissions',
        error: error.message 
      });
    }
  };
};

/**
 * Recursively check parent role permissions
 * @param {number} parentRoleId 
 * @param {string} permission 
 * @returns {Promise<boolean>}
 */
async function checkParentPermission(parentRoleId, permission) {
  try {
    const [parents] = await db.execute(
      'SELECT id, permissions, parentRoleId FROM Role WHERE id = ? AND deletedAt IS NULL AND isActive = 1',
      [parentRoleId]
    );

    if (!parents.length) {
      return false;
    }

    const parent = parents[0];
    let permissions = {};

    try {
      permissions = parent.permissions 
        ? (typeof parent.permissions === 'string' 
            ? JSON.parse(parent.permissions) 
            : parent.permissions)
        : {};
    } catch (e) {
      return false;
    }

    // Check if parent has permission
    if (permissions.all === true || permissions[permission] === true) {
      return true;
    }

    // Check parent's parent (recursive)
    if (parent.parentRoleId) {
      return await checkParentPermission(parent.parentRoleId, permission);
    }

    return false;
  } catch (error) {
    console.error('Error checking parent permission:', error);
    return false;
  }
}

/**
 * Check multiple permissions (user needs at least one)
 * @param {string[]} requiredPermissions 
 * @returns {Function} Express middleware
 */
const checkAnyPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const roleId = req.user.roleId || req.user.role;

      if (roleId === 1) {
        return next(); // Admin has all permissions
      }

      // Get role permissions
      const [roles] = await db.execute(
        'SELECT permissions, parentRoleId FROM Role WHERE id = ? AND deletedAt IS NULL AND isActive = 1',
        [roleId]
      );

      if (!roles.length) {
        return res.status(403).json({ 
          success: false, 
          message: 'Role not found or inactive' 
        });
      }

      const role = roles[0];
      let permissions = {};

      try {
        permissions = role.permissions 
          ? (typeof role.permissions === 'string' 
              ? JSON.parse(role.permissions) 
              : role.permissions)
          : {};
      } catch (e) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error parsing role permissions' 
        });
      }

      if (permissions.all === true) {
        return next();
      }

      // Check if user has any of the required permissions
      for (const permission of requiredPermissions) {
        if (permissions[permission] === true) {
          return next();
        }
      }

      // Check parent roles
      if (role.parentRoleId) {
        for (const permission of requiredPermissions) {
          const hasParent = await checkParentPermission(role.parentRoleId, permission);
          if (hasParent) {
            return next();
          }
        }
      }

      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: Insufficient permissions',
        required: requiredPermissions
      });

    } catch (error) {
      console.error('Error in checkAnyPermission:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking permissions',
        error: error.message 
      });
    }
  };
};

/**
 * Check all permissions (user needs all)
 * @param {string[]} requiredPermissions 
 * @returns {Function} Express middleware
 */
const checkAllPermissions = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const roleId = req.user.roleId || req.user.role;

      if (roleId === 1) {
        return next(); // Admin has all permissions
      }

      // Get role permissions
      const [roles] = await db.execute(
        'SELECT permissions, parentRoleId FROM Role WHERE id = ? AND deletedAt IS NULL AND isActive = 1',
        [roleId]
      );

      if (!roles.length) {
        return res.status(403).json({ 
          success: false, 
          message: 'Role not found or inactive' 
        });
      }

      const role = roles[0];
      let permissions = {};

      try {
        permissions = role.permissions 
          ? (typeof role.permissions === 'string' 
              ? JSON.parse(role.permissions) 
              : role.permissions)
          : {};
      } catch (e) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error parsing role permissions' 
        });
      }

      if (permissions.all === true) {
        return next();
      }

      // Check if user has all required permissions
      for (const permission of requiredPermissions) {
        const hasPermission = permissions[permission] === true;
        if (!hasPermission) {
          // Check parent role
          if (role.parentRoleId) {
            const hasParent = await checkParentPermission(role.parentRoleId, permission);
            if (!hasParent) {
              return res.status(403).json({ 
                success: false, 
                message: 'Access denied: Insufficient permissions',
                required: requiredPermissions,
                missing: permission
              });
            }
          } else {
            return res.status(403).json({ 
              success: false, 
              message: 'Access denied: Insufficient permissions',
              required: requiredPermissions,
              missing: permission
            });
          }
        }
      }

      return next();

    } catch (error) {
      console.error('Error in checkAllPermissions:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking permissions',
        error: error.message 
      });
    }
  };
};

/**
 * Helper function to check permission for a user (for use in controllers)
 * @param {number} roleId 
 * @param {string} permission 
 * @returns {Promise<boolean>}
 */
const hasPermission = async (roleId, permission) => {
  try {
    if (roleId === 1) return true; // Admin

    const [roles] = await db.execute(
      'SELECT permissions, parentRoleId FROM Role WHERE id = ? AND deletedAt IS NULL AND isActive = 1',
      [roleId]
    );

    if (!roles.length) return false;

    const role = roles[0];
    let permissions = {};

    try {
      permissions = role.permissions 
        ? (typeof role.permissions === 'string' 
            ? JSON.parse(role.permissions) 
            : role.permissions)
        : {};
    } catch (e) {
      return false;
    }

    if (permissions.all === true || permissions[permission] === true) {
      return true;
    }

    if (role.parentRoleId) {
      return await checkParentPermission(role.parentRoleId, permission);
    }

    return false;
  } catch (error) {
    console.error('Error in hasPermission:', error);
    return false;
  }
};

module.exports = {
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
  hasPermission
};

