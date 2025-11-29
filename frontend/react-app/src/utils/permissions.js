/**
 * Permission Utilities - Helper functions for permission checking
 */

/**
 * Check if user has a specific permission
 * @param {Object} user - User object with role/permissions
 * @param {string} permission - Permission key to check
 * @returns {boolean} - True if user has permission
 */
export const hasPermission = (user, permission) => {
  if (!user || !permission) return false;

  // Admin role (ID 1) has all permissions
  const roleId = user.roleId || user.role;
  if (roleId === 1 || roleId === '1' || user.role === 1 || user.role === 'admin') {
    return true;
  }

  // If user has permissions object, check it
  if (user.permissions) {
    const permissions = typeof user.permissions === 'string' 
      ? JSON.parse(user.permissions) 
      : user.permissions;
    
    // Check for wildcard permission
    if (permissions['*']) return true;
    
    // Check exact permission
    if (permissions[permission]) return true;
    
    // Check wildcard permissions (e.g., 'repairs.*' matches 'repairs.view')
    const permissionParts = permission.split('.');
    for (let i = permissionParts.length; i > 0; i--) {
      const wildcard = permissionParts.slice(0, i).join('.') + '.*';
      if (permissions[wildcard]) return true;
    }
  }

  return false;
};

/**
 * Check if user has any of the provided permissions
 * @param {Object} user - User object
 * @param {string[]} permissions - Array of permission keys
 * @returns {boolean} - True if user has at least one permission
 */
export const hasAnyPermission = (user, permissions) => {
  if (!permissions || !Array.isArray(permissions)) return false;
  return permissions.some(permission => hasPermission(user, permission));
};

/**
 * Check if user has all of the provided permissions
 * @param {Object} user - User object
 * @param {string[]} permissions - Array of permission keys
 * @returns {boolean} - True if user has all permissions
 */
export const hasAllPermissions = (user, permissions) => {
  if (!permissions || !Array.isArray(permissions)) return false;
  return permissions.every(permission => hasPermission(user, permission));
};

/**
 * Check if user is admin
 * @param {Object} user - User object
 * @returns {boolean} - True if user is admin
 */
export const isAdmin = (user) => {
  if (!user) return false;
  const roleId = user.roleId || user.role;
  return roleId === 1 || roleId === '1' || user.role === 1 || user.role === 'admin';
};

/**
 * Check if user has a specific role
 * @param {Object} user - User object
 * @param {number|string} roleId - Role ID to check
 * @returns {boolean} - True if user has the role
 */
export const hasRole = (user, roleId) => {
  if (!user || !roleId) return false;
  const userRoleId = user.roleId || user.role;
  return userRoleId === roleId || userRoleId === String(roleId);
};

/**
 * Filter items based on user permissions
 * @param {Array} items - Array of items with permission property
 * @param {Object} user - User object
 * @returns {Array} - Filtered items
 */
export const filterByPermissions = (items, user) => {
  if (!items || !Array.isArray(items)) return [];
  
  return items
    .filter(item => {
      // If item has no permission requirement, include it
      if (!item.permission) return true;
      // Check if user has permission
      return hasPermission(user, item.permission);
    })
    .map(item => {
      // Recursively filter subItems
      if (item.subItems && item.subItems.length > 0) {
        return {
          ...item,
          subItems: filterByPermissions(item.subItems, user)
        };
      }
      return item;
    })
    .filter(item => {
      // Remove items with empty subItems
      if (item.subItems && item.subItems.length === 0) return false;
      return true;
    });
};

/**
 * Data Masking - Mask sensitive data based on permissions
 * @param {Object} data - Data object to mask
 * @param {Object} user - User object
 * @param {string} field - Field to check permission for
 * @param {string} maskValue - Value to show if no permission (default: '***')
 * @returns {*} - Original value or masked value
 */
export const maskData = (data, user, field, maskValue = '***') => {
  if (!data || !field) return data;
  
  // Check permission (assuming permission key format: 'module.field.view')
  const permission = `${field}.view`;
  if (hasPermission(user, permission)) {
    return data;
  }
  
  // Mask the field
  if (typeof data === 'object' && data !== null) {
    return {
      ...data,
      [field]: maskValue
    };
  }
  
  return maskValue;
};

export default {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAdmin,
  hasRole,
  filterByPermissions,
  maskData
};

