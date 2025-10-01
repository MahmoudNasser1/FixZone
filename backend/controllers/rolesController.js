const db = require('../db');
const { logActivity } = require('./activityLogController');

// List roles (with optional simple search)
exports.listRoles = async (req, res) => {
  try {
    const { q } = req.query;
    let sql = 'SELECT id, name, description, permissions FROM Role';
    const params = [];
    if (q) {
      sql += ' WHERE name LIKE ?';
      params.push(`%${q}%`);
    }
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error listing roles:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get role by id
exports.getRole = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT id, name, description, permissions FROM Role WHERE id = ?',
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Role not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching role:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create role
exports.createRole = async (req, res) => {
  const { name, permissions, parentRoleId } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });
  try {
    const [result] = await db.query(
      'INSERT INTO Role (name, permissions, parentRoleId) VALUES (?, ?, ?)',
      [name, permissions ? JSON.stringify(permissions) : null, parentRoleId || null]
    );
    const created = { id: result.insertId, name, permissions: permissions || null, parentRoleId: parentRoleId || null };
    res.status(201).json(created);
    if (req.user?.id) await logActivity(req.user.id, 'Role Created', created);
  } catch (err) {
    console.error('Error creating role:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Role name already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Update role
exports.updateRole = async (req, res) => {
  const { id } = req.params;
  const { name, permissions, parentRoleId } = req.body;
  const fields = [];
  const values = [];
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (permissions !== undefined) { fields.push('permissions = ?'); values.push(permissions ? JSON.stringify(permissions) : null); }
  if (parentRoleId !== undefined) { fields.push('parentRoleId = ?'); values.push(parentRoleId || null); }
  if (!fields.length) return res.status(400).json({ message: 'No fields to update' });
  try {
    values.push(id);
    const [result] = await db.query(
      `UPDATE Role SET ${fields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL`,
      values
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Role not found' });
    res.json({ message: 'Role updated successfully' });
    if (req.user?.id) await logActivity(req.user.id, 'Role Updated', { id, fields });
  } catch (err) {
    console.error('Error updating role:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Soft delete role
exports.deleteRole = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('UPDATE Role SET deletedAt = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Role not found' });
    res.json({ message: 'Role deleted successfully' });
    if (req.user?.id) await logActivity(req.user.id, 'Role Deleted (Soft)', { id });
  } catch (err) {
    console.error('Error deleting role:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
