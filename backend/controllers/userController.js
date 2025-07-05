const db = require('../db');
const bcrypt = require('bcryptjs');
const { logActivity } = require('./activityLogController');

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, name, email, roleId, isActive, createdAt, updatedAt FROM user');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const [user] = await db.query('SELECT id, name, email, roleId, isActive, createdAt, updatedAt FROM user WHERE id = ?', [id]);
        if (!user.length) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user[0]);
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, password, roleId, isActive } = req.body;
    let updateFields = [];
    let updateValues = [];

    if (name) { updateFields.push('name = ?'); updateValues.push(name); }
    if (email) { updateFields.push('email = ?'); updateValues.push(email); }
    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.push('password = ?'); updateValues.push(hashedPassword);
    }
    if (roleId !== undefined) { updateFields.push('roleId = ?'); updateValues.push(roleId); }
    if (isActive !== undefined) { updateFields.push('isActive = ?'); updateValues.push(isActive); }

    if (updateFields.length === 0) {
        return res.status(400).json({ message: 'No fields to update' });
    }

    updateValues.push(id);

    try {
        const [result] = await db.query(
            `UPDATE user SET ${updateFields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
            updateValues
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found or no changes made' });
        }
        res.json({ message: 'User updated successfully' });
        await logActivity(req.user.id, 'User Updated', { targetUserId: id, updatedFields: updateFields.map(field => field.split(' ')[0]) });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete user (soft delete)
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('UPDATE user SET deletedAt = CURRENT_TIMESTAMP WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
        await logActivity(req.user.id, 'User Deleted (Soft)', { targetUserId: id });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all roles
exports.getAllRoles = async (req, res) => {
    try {
        const [roles] = await db.query('SELECT * FROM role');
        res.json(roles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
