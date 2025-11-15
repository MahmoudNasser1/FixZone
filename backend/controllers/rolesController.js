const db = require('../db');

// Helper function for logging activities (with error handling)
const logActivity = async (userId, action, details = null) => {
  try {
    const query = 'INSERT INTO activity_log (userId, action, details) VALUES (?, ?, ?)';
    await db.execute(query, [userId, action, details ? JSON.stringify(details) : null]);
    console.log(`Activity logged for user ${userId}: ${action}`);
  } catch (error) {
    console.error('Error logging activity:', error);
    // Continue execution even if logging fails
  }
};

// Helper function to validate permissions format
const validatePermissions = (permissions) => {
  if (!permissions) return null;
  if (typeof permissions === 'string') {
    try {
      permissions = JSON.parse(permissions);
    } catch (e) {
      throw new Error('Invalid JSON format for permissions');
    }
  }
  if (typeof permissions !== 'object' || Array.isArray(permissions)) {
    throw new Error('Permissions must be an object');
  }
  return JSON.stringify(permissions);
};

// List roles (with optional simple search)
exports.listRoles = async (req, res) => {
  try {
    const { q, isActive, includeInactive } = req.query;
    let sql = `
      SELECT id, name, description, permissions, parentRoleId, isSystem, isActive, createdAt, updatedAt 
      FROM Role 
      WHERE deletedAt IS NULL
    `;
    const params = [];
    
    if (q) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm);
    }
    
    if (isActive !== undefined && !includeInactive) {
      sql += ' AND isActive = ?';
      params.push(isActive === 'true' || isActive === true ? 1 : 0);
    }
    
    sql += ' ORDER BY isSystem DESC, name ASC';
    
    const [rows] = await db.execute(sql, params);
    
    // Parse permissions JSON
    const roles = rows.map(role => ({
      ...role,
      permissions: role.permissions ? (typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions) : {},
      isSystem: Boolean(role.isSystem),
      isActive: Boolean(role.isActive)
    }));
    
    res.json({ success: true, data: roles });
  } catch (err) {
    console.error('Error listing roles:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Get role by id
exports.getRole = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute(
      'SELECT id, name, description, permissions, parentRoleId, isSystem, isActive, createdAt, updatedAt FROM Role WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }
    
    const role = rows[0];
    role.permissions = role.permissions ? (typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions) : {};
    role.isSystem = Boolean(role.isSystem);
    role.isActive = Boolean(role.isActive);
    
    res.json({ success: true, data: role });
  } catch (err) {
    console.error('Error fetching role:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Create role
exports.createRole = async (req, res) => {
  const { name, description, permissions, parentRoleId, isSystem, isActive } = req.body;
  
  // Validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Name is required and must be a non-empty string' });
  }
  
  if (name.length > 50) {
    return res.status(400).json({ success: false, message: 'Name must be 50 characters or less' });
  }
  
  try {
    // Validate permissions format
    let permissionsJson = null;
    if (permissions !== undefined && permissions !== null) {
      permissionsJson = validatePermissions(permissions);
    }
    
    // Check if role name already exists
    const [existing] = await db.execute(
      'SELECT id FROM Role WHERE name = ? AND deletedAt IS NULL',
      [name.trim()]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Role name already exists' });
    }
    
    // Validate parentRoleId if provided
    if (parentRoleId) {
      const [parent] = await db.execute(
        'SELECT id FROM Role WHERE id = ? AND deletedAt IS NULL',
        [parentRoleId]
      );
      if (parent.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid parentRoleId' });
      }
    }
    
    const [result] = await db.execute(
      'INSERT INTO Role (name, description, permissions, parentRoleId, isSystem, isActive) VALUES (?, ?, ?, ?, ?, ?)',
      [
        name.trim(),
        description && typeof description === 'string' ? description.trim() : null,
        permissionsJson,
        parentRoleId || null,
        isSystem === true ? 1 : 0,
        isActive !== false ? 1 : 0
      ]
    );
    
    const created = {
      id: result.insertId,
      name: name.trim(),
      description: description || null,
      permissions: permissionsJson ? JSON.parse(permissionsJson) : {},
      parentRoleId: parentRoleId || null,
      isSystem: isSystem === true,
      isActive: isActive !== false
    };
    
    res.status(201).json({ success: true, data: created });
    if (req.user?.id) await logActivity(req.user.id, 'Role Created', created);
  } catch (err) {
    console.error('Error creating role:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Role name already exists' });
    }
    if (err.message.includes('Invalid')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Update role
exports.updateRole = async (req, res) => {
  const { id } = req.params;
  const { name, description, permissions, parentRoleId, isSystem, isActive } = req.body;
  
  const fields = [];
  const values = [];
  
  // Validate and add fields
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Name must be a non-empty string' });
    }
    if (name.length > 50) {
      return res.status(400).json({ success: false, message: 'Name must be 50 characters or less' });
    }
    fields.push('name = ?');
    values.push(name.trim());
  }
  
  if (description !== undefined) {
    fields.push('description = ?');
    values.push(description && typeof description === 'string' ? description.trim() : null);
  }
  
  if (permissions !== undefined) {
    try {
      const permissionsJson = validatePermissions(permissions);
      fields.push('permissions = ?');
      values.push(permissionsJson);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
  
  if (parentRoleId !== undefined) {
    if (parentRoleId && parentRoleId === parseInt(id)) {
      return res.status(400).json({ success: false, message: 'Role cannot be its own parent' });
    }
    fields.push('parentRoleId = ?');
    values.push(parentRoleId || null);
    
    // Validate parentRoleId if provided
    if (parentRoleId) {
      const [parent] = await db.execute(
        'SELECT id FROM Role WHERE id = ? AND deletedAt IS NULL',
        [parentRoleId]
      );
      if (parent.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid parentRoleId' });
      }
    }
  }
  
  if (isSystem !== undefined) {
    // Prevent modifying isSystem for system roles (unless admin override)
    const [existing] = await db.execute(
      'SELECT isSystem FROM Role WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    if (existing.length > 0 && existing[0].isSystem && isSystem === false) {
      return res.status(403).json({ success: false, message: 'Cannot modify isSystem for system roles' });
    }
    fields.push('isSystem = ?');
    values.push(isSystem === true ? 1 : 0);
  }
  
  if (isActive !== undefined) {
    fields.push('isActive = ?');
    values.push(isActive !== false ? 1 : 0);
  }
  
  if (!fields.length) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }
  
  try {
    // Check if role name already exists (if name is being updated)
    if (name !== undefined) {
      const [existing] = await db.execute(
        'SELECT id FROM Role WHERE name = ? AND id != ? AND deletedAt IS NULL',
        [name.trim(), id]
      );
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'Role name already exists' });
      }
    }
    
    values.push(id);
    const [result] = await db.execute(
      `UPDATE Role SET ${fields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }
    
    // Fetch updated role
    const [updated] = await db.execute(
      'SELECT id, name, description, permissions, parentRoleId, isSystem, isActive FROM Role WHERE id = ?',
      [id]
    );
    
    const updatedRole = updated[0];
    updatedRole.permissions = updatedRole.permissions ? (typeof updatedRole.permissions === 'string' ? JSON.parse(updatedRole.permissions) : updatedRole.permissions) : {};
    updatedRole.isSystem = Boolean(updatedRole.isSystem);
    updatedRole.isActive = Boolean(updatedRole.isActive);
    
    res.json({ success: true, message: 'Role updated successfully', data: updatedRole });
    if (req.user?.id) await logActivity(req.user.id, 'Role Updated', { id, updatedFields: fields });
  } catch (err) {
    console.error('Error updating role:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Role name already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Soft delete role
exports.deleteRole = async (req, res) => {
  const { id } = req.params;
  try {
    // Check if role exists and is a system role
    const [role] = await db.execute(
      'SELECT id, name, isSystem FROM Role WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (role.length === 0) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }
    
    // Prevent deleting system roles
    if (role[0].isSystem) {
      return res.status(403).json({ success: false, message: 'Cannot delete system roles' });
    }
    
    // Check if any users are using this role
    const [users] = await db.execute(
      'SELECT COUNT(*) as count FROM User WHERE roleId = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (users[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete role: ${users[0].count} user(s) are assigned to this role`,
        usersCount: users[0].count
      });
    }
    
    // Check if any roles have this role as parent
    const [children] = await db.execute(
      'SELECT COUNT(*) as count FROM Role WHERE parentRoleId = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (children[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete role: ${children[0].count} role(s) have this role as parent`,
        childrenCount: children[0].count
      });
    }
    
    const [result] = await db.execute(
      'UPDATE Role SET deletedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    
    res.json({ success: true, message: 'Role deleted successfully' });
    if (req.user?.id) await logActivity(req.user.id, 'Role Deleted (Soft)', { id, name: role[0].name });
  } catch (err) {
    console.error('Error deleting role:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
