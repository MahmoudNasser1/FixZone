const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { logActivity } = require('./activityLogController');

// Placeholder for a secret key. In a real application, this should be in environment variables.
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'; 

exports.login = async (req, res) => {
    const { name, password } = req.body;

    try {
        // Check if user exists
        const [rows] = await db.query('SELECT * FROM user WHERE name = ?', [name]);
        const user = rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign({ id: user.id, role: user.roleId }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });

        // Log the successful login activity
        await logActivity(user.id, 'User Login', { ipAddress: req.ip, userAgent: req.headers['user-agent'] });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.register = async (req, res) => {
    const { name, email, password, roleId } = req.body;

    try {
        // Check if user already exists
        const [existingUsers] = await db.query('SELECT id FROM user WHERE name = ? OR email = ?', [name, email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User with that username or email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds

        // Insert new user into database
        const [result] = await db.query(
            'INSERT INTO user (name, email, password, RoleID) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, roleId || 2] // Default RoleID to 2 if not provided
        );

        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// You can add more functions here like logout, etc.
