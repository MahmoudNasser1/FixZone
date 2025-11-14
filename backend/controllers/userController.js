const db = require('../db');
const bcrypt = require('bcryptjs');
const Joi = require('joi');

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

// Get all users with optional filtering, sorting, and pagination
exports.getAllUsers = async (req, res) => {
    try {
        const {
            q,
            roleId,
            includeInactive,
            sortBy = 'createdAt',
            sortDir = 'DESC',
            page,
            pageSize
        } = req.query;

        const conditions = ['deletedAt IS NULL'];
        const params = [];

        if (q) {
            conditions.push('(name LIKE ? OR email LIKE ?)');
            params.push(`%${q}%`, `%${q}%`);
        }
        if (roleId) {
            conditions.push('roleId = ?');
            params.push(Number(roleId));
        }
        if (!includeInactive || includeInactive === 'false' || includeInactive === '0') {
            conditions.push('isActive = 1');
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        // Whitelist sortable columns
        const sortable = new Set(['id', 'name', 'email', 'roleId', 'isActive', 'createdAt', 'updatedAt']);
        const orderBy = sortable.has(sortBy) ? sortBy : 'createdAt';
        const direction = String(sortDir).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // If pagination requested
        const hasPagination = page !== undefined || pageSize !== undefined;
        if (hasPagination) {
            const pg = Math.max(1, parseInt(page || '1', 10));
            const ps = Math.max(1, Math.min(100, parseInt(pageSize || '20', 10)));
            const offset = (pg - 1) * ps;

            const [countRows] = await db.execute(`SELECT COUNT(*) AS cnt FROM User ${whereClause}`, params);
            const total = countRows[0]?.cnt || 0;

        const [rows] = await db.execute(
            `SELECT 
              id, 
              name,
              email, 
              roleId, 
              isActive, 
              createdAt, 
              updatedAt 
            FROM User ${whereClause} ORDER BY ${orderBy} ${direction} LIMIT ? OFFSET ?`,
            [...params, ps, offset]
        );
            return res.json({ 
                success: true, 
                data: { items: rows, total, page: pg, pageSize: ps }
            });
        }

        // Without pagination: maintain backward compatible array response
        const [users] = await db.execute(
            `SELECT 
              id, 
              name,
              email, 
              roleId, 
              isActive, 
              createdAt, 
              updatedAt 
            FROM User ${whereClause} ORDER BY ${orderBy} ${direction}`,
            params
        );
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error: Failed to fetch users',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const [user] = await db.execute(
            'SELECT id, name, email, phone, roleId, isActive, createdAt, updatedAt FROM User WHERE id = ? AND deletedAt IS NULL',
            [id]
        );
        if (!user.length) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }
        res.json({ 
            success: true, 
            data: user[0] 
        });
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error: Failed to fetch user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, password, roleId, isActive } = req.body;
    
    // Validation schema
    const updateSchema = Joi.object({
        name: Joi.string().min(2).max(100).optional(),
        email: Joi.string().email().max(255).optional(),
        phone: Joi.string().max(20).optional().allow('', null),
        password: Joi.string().min(6).optional(),
        roleId: Joi.number().integer().min(1).optional(),
        isActive: Joi.boolean().optional()
    });

    const { error: validationError } = updateSchema.validate(req.body, { allowUnknown: false });
    if (validationError) {
        return res.status(400).json({ 
            success: false,
            message: 'Validation error',
            errors: validationError.details.map(d => d.message)
        });
    }

    // Validate roleId exists if provided
    if (roleId !== undefined) {
        try {
            const [roleCheck] = await db.execute('SELECT id FROM Role WHERE id = ?', [roleId]);
            if (roleCheck.length === 0) {
                return res.status(400).json({ 
                    success: false,
                    message: `Invalid roleId: ${roleId}` 
                });
            }
        } catch (error) {
            console.error('Error checking role:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Server Error: Failed to validate role' 
            });
        }
    }

    let updateFields = [];
    let updateValues = [];

    if (name) { updateFields.push('name = ?'); updateValues.push(name); }
    if (email) { updateFields.push('email = ?'); updateValues.push(email); }
    if (phone !== undefined) { updateFields.push('phone = ?'); updateValues.push(phone || null); }
    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.push('password = ?'); updateValues.push(hashedPassword);
    }
    if (roleId !== undefined) { updateFields.push('roleId = ?'); updateValues.push(roleId); }
    if (isActive !== undefined) { updateFields.push('isActive = ?'); updateValues.push(isActive); }

    if (updateFields.length === 0) {
        return res.status(400).json({ 
            success: false,
            message: 'No fields to update' 
        });
    }

    updateValues.push(id);

    try {
        const [result] = await db.execute(
            `UPDATE User SET ${updateFields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL`,
            updateValues
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found or no changes made' 
            });
        }

        // Fetch updated user
        const [updatedUser] = await db.execute(
            'SELECT id, name, email, phone, roleId, isActive, createdAt, updatedAt FROM User WHERE id = ?',
            [id]
        );

        res.json({ 
            success: true, 
            message: 'User updated successfully',
            data: updatedUser[0]
        });
        
        // Log activity safely
        if (req.user && req.user.id) {
            await logActivity(req.user.id, 'User Updated', { 
                targetUserId: id, 
                updatedFields: updateFields.map(field => field.split(' ')[0]) 
            });
        }
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error: Failed to update user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Delete user (soft delete)
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    
    // Prevent self-deletion
    if (req.user && req.user.id && parseInt(req.user.id) === parseInt(id)) {
        return res.status(400).json({ 
            success: false,
            message: 'You cannot delete your own account' 
        });
    }

    try {
        const [result] = await db.execute(
            'UPDATE User SET deletedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', 
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }
        res.json({ 
            success: true, 
            message: 'User deleted successfully' 
        });
        
        // Log activity safely
        if (req.user && req.user.id) {
            await logActivity(req.user.id, 'User Deleted (Soft)', { targetUserId: id });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error: Failed to delete user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get all roles
exports.getAllRoles = async (req, res) => {
    try {
        const [roles] = await db.execute('SELECT * FROM Role ORDER BY id');
        res.json(roles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error: Failed to fetch roles',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
