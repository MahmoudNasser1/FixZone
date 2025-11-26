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

// Create a new user
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, roleId, phone, isActive } = req.body;

        // Validation schema
        const schema = Joi.object({
            name: Joi.string().min(2).max(100).required(),
            email: Joi.string().email().max(255).required(),
            password: Joi.string().min(6).required(),
            roleId: Joi.number().integer().min(1).required(),
            phone: Joi.string().max(20).allow('', null).optional(),
            isActive: Joi.boolean().default(true)
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        // Check if email already exists
        const [existingUser] = await db.execute('SELECT id FROM User WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.execute(
            'INSERT INTO User (name, email, password, roleId, phone, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [name, email, hashedPassword, roleId, phone || null, isActive !== undefined ? isActive : true]
        );

        const newUserId = result.insertId;

        // Get created user (excluding password)
        const [newUser] = await db.execute(
            'SELECT id, name, email, roleId, phone, isActive, createdAt, updatedAt FROM User WHERE id = ?',
            [newUserId]
        );

        // Log activity
        if (req.user && req.user.id) {
            await logActivity(req.user.id, 'User Created', { newUserId, email });
        }

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: newUser[0]
        });

    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: Failed to create user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getNewUserTemplate = async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                name: '',
                email: '',
                password: '',
                roleId: null,
                phone: '',
                isActive: true
            }
        });
    } catch (error) {
        console.error('Error returning new user template:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: Failed to prepare new user template',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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

            // CRITICAL: Use db.query instead of db.execute for queries with LIMIT/OFFSET
            // db.execute uses prepared statements which cause issues with LIMIT/OFFSET in MariaDB strict mode
            // db.query interpolates values directly and works perfectly with LIMIT/OFFSET
            const [rows] = await db.query(
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
        password: Joi.string().min(6).optional().allow('', null),
        roleId: Joi.alternatives().try(
            Joi.number().integer().min(1),
            Joi.string().pattern(/^\d+$/).messages({ 'string.pattern.base': 'roleId must be a valid number' })
        ).optional(),
        isActive: Joi.alternatives().try(
            Joi.boolean(),
            Joi.string().valid('true', 'false', '1', '0').messages({
                'any.only': 'isActive must be a boolean'
            })
        ).optional(),
        confirmPassword: Joi.string().optional().strip() // Allow but strip confirmPassword
    }); // Remove unknown(false) - we'll use stripUnknown in options

    const { error: validationError, value: validatedData } = updateSchema.validate(req.body, {
        stripUnknown: true, // Strip unknown fields instead of rejecting
        abortEarly: false,
        allowUnknown: false // Don't allow unknown fields, but strip them
    });
    if (validationError) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: validationError.details.map(d => ({
                field: d.path.join('.'),
                message: d.message
            }))
        });
    }

    // Use validated data (avoid redeclaring variables already destructured from req.body)
    const validatedName = validatedData?.name;
    const validatedEmail = validatedData?.email;
    const validatedPhone = validatedData?.phone;
    const validatedPassword = validatedData?.password;
    const validatedRoleId = validatedData?.roleId;
    const validatedIsActive = validatedData?.isActive;

    // Convert roleId to number if it's a string
    const finalRoleId = validatedRoleId !== undefined ? parseInt(validatedRoleId) : roleId;

    // Validate roleId exists if provided
    if (finalRoleId !== undefined && finalRoleId !== null) {
        try {
            const [roleCheck] = await db.execute('SELECT id FROM Role WHERE id = ?', [finalRoleId]);
            if (roleCheck.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid roleId: ${finalRoleId}`
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

    // Use validated data (it's already stripped of unknown fields)
    // Use validated variables (avoid conflict with req.body destructured variables)
    const finalName = validatedName;
    const finalEmail = validatedEmail;
    const finalPhone = validatedPhone !== undefined ? validatedPhone : undefined;
    const finalPassword = validatedPassword;
    // Ensure isActive is boolean - handle string 'true'/'false' or 1/0
    let finalIsActive = validatedIsActive;
    if (validatedIsActive !== undefined) {
        if (typeof validatedIsActive === 'string') {
            finalIsActive = validatedIsActive === 'true' || validatedIsActive === '1';
        } else if (typeof validatedIsActive === 'number') {
            finalIsActive = validatedIsActive === 1;
        } else {
            finalIsActive = Boolean(validatedIsActive);
        }
    }

    // Build update query from validated data only
    if (finalName) {
        updateFields.push('name = ?');
        updateValues.push(finalName.trim());
    }
    if (finalEmail) {
        updateFields.push('email = ?');
        updateValues.push(finalEmail.trim());
    }
    if (finalPhone !== undefined) {
        updateFields.push('phone = ?');
        updateValues.push(finalPhone && finalPhone.trim() ? finalPhone.trim() : null);
    }
    if (finalPassword && finalPassword.trim()) {
        const hashedPassword = await bcrypt.hash(finalPassword.trim(), 10);
        updateFields.push('password = ?');
        updateValues.push(hashedPassword);
    }
    if (finalRoleId !== undefined && finalRoleId !== null && !isNaN(finalRoleId)) {
        updateFields.push('roleId = ?');
        updateValues.push(parseInt(finalRoleId));
    }
    if (finalIsActive !== undefined) {
        updateFields.push('isActive = ?');
        updateValues.push(!!finalIsActive); // Ensure boolean
    }

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
