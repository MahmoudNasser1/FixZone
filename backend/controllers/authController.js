const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Get JWT_SECRET from environment variables or use fallback (only for development)
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'your_jwt_secret_key');

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}

// Helper function to log login attempts
const logLoginAttempt = async (userId, success, ipAddress, userAgent, errorMessage = null) => {
  try {
    await db.execute(
      'INSERT INTO UserLoginLog (userId, loginAt, ipAddress, deviceInfo) VALUES (?, NOW(), ?, ?)',
      [userId, ipAddress, userAgent || 'Unknown']
    );
  } catch (error) {
    console.error('Error logging login attempt:', error);
    // Continue execution even if logging fails
  }
};

exports.login = async (req, res) => {
    const { loginIdentifier, password } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Validation
    if (!loginIdentifier || !password) {
        return res.status(400).json({ message: 'Please provide login identifier and password' });
    }

    try {
        // Check if user exists by email or phone (table name and casing per schema: User)
        // Use db.execute instead of db.query for better security
        const query = 'SELECT * FROM User WHERE (email = ? OR phone = ?) AND deletedAt IS NULL';
        const [rows] = await db.execute(query, [loginIdentifier, loginIdentifier]);
        const user = rows[0];

        // Log failed attempt if user not found
        if (!user) {
            await logLoginAttempt(null, false, ipAddress, userAgent, 'User not found');
            return res.status(404).json({ message: 'User not found' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        
        // Log failed attempt if password incorrect
        if (!isMatch) {
            await logLoginAttempt(user.id, false, ipAddress, userAgent, 'Incorrect password');
            return res.status(401).json({ message: 'Incorrect password' });
        }

        // Generate JWT
        const payload = {
            id: user.id,
            role: user.roleId,
            name: user.name
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

        // Send the token in a secure, httpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
            sameSite: 'lax',
            path: '/',
            maxAge: 8 * 60 * 60 * 1000 // 8 hours
        });

        // Log successful login attempt
        await logLoginAttempt(user.id, true, ipAddress, userAgent);

        // Send user info back to the client (without the password)
        res.json({
            id: user.id,
            name: user.name,
            role: user.roleId
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.register = async (req, res) => {
    const { name, email, password, roleId } = req.body;

    try {
        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email, and password' });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Basic password validation (at least 8 characters)
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        // Check if user already exists - use db.execute
        const [existingUsers] = await db.execute('SELECT id FROM User WHERE email = ? AND deletedAt IS NULL', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User with that email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds

        // Insert new user into database - use db.execute
        const [result] = await db.execute(
            'INSERT INTO User (name, email, password, roleId) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, roleId || 2]
        );

        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Change password functionality
exports.changePassword = async (req, res) => {
    const userId = req.user.id; // From authMiddleware
    const { currentPassword, newPassword } = req.body;

    try {
        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Please provide current password and new password' });
        }

        // Basic password validation (at least 8 characters)
        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'New password must be at least 8 characters long' });
        }

        // Get current user
        const [rows] = await db.execute('SELECT * FROM User WHERE id = ? AND deletedAt IS NULL', [userId]);
        const user = rows[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password - use db.execute
        await db.execute('UPDATE User SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update profile functionality
exports.updateProfile = async (req, res) => {
    const userId = req.user.id; // From authMiddleware
    const { name, email, phone } = req.body;

    try {
        // Validation
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        // Email validation if provided
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }

            // Check if email is already taken by another user
            const [existingUsers] = await db.execute(
                'SELECT id FROM User WHERE email = ? AND id != ? AND deletedAt IS NULL',
                [email, userId]
            );
            if (existingUsers.length > 0) {
                return res.status(400).json({ message: 'Email is already taken' });
            }
        }

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (email) {
            updates.push('email = ?');
            values.push(email);
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            values.push(phone || null);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        values.push(userId);

        // Update user profile - use db.execute
        await db.execute(
            `UPDATE User SET ${updates.join(', ')}, updatedAt = NOW() WHERE id = ? AND deletedAt IS NULL`,
            values
        );

        // Get updated user data
        const [rows] = await db.execute('SELECT id, name, email, phone, roleId FROM User WHERE id = ?', [userId]);
        const updatedUser = rows[0];

        res.json({ message: 'Profile updated successfully', user: updatedUser });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user profile
exports.getProfile = async (req, res) => {
    const userId = req.user.id; // From authMiddleware

    try {
        const [rows] = await db.execute(
            'SELECT id, name, email, phone, roleId, createdAt, updatedAt FROM User WHERE id = ? AND deletedAt IS NULL',
            [userId]
        );
        const user = rows[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
