const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { logActivity } = require('./activityLogController');

// Placeholder for a secret key. In a real application, this should be in environment variables.
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'; 

exports.login = async (req, res) => {
    const { loginIdentifier, password } = req.body;

    if (!loginIdentifier || !password) {
        return res.status(400).json({ message: 'Please provide login identifier and password' });
    }

    try {
        // Check if user exists by email or phone (table name and casing per schema: User)
        const query = 'SELECT * FROM User WHERE (email = ? OR phone = ?) AND deletedAt IS NULL';
        const [rows] = await db.query(query, [loginIdentifier, loginIdentifier]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
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
            secure: false, // dev on http
            sameSite: 'lax',
            path: '/',
            maxAge: 8 * 60 * 60 * 1000 // 8 hours
        });

        // Send user info back to the client (without the password)
        res.json({
            id: user.id,
            name: user.name,
            role: user.roleId
        });

        // Log the successful login activity (temporarily disabled)
        // await logActivity(user.id, 'User Login', { ipAddress: req.ip, userAgent: req.headers['user-agent'] });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.register = async (req, res) => {
    const { name, email, password, roleId } = req.body;

    try {
        // Check if user already exists
        const [existingUsers] = await db.query('SELECT id FROM User WHERE name = ? OR email = ?', [name, email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User with that username or email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds

        // Insert new user into database (schema uses roleId lowercase per SQL)
        const [result] = await db.query(
            'INSERT INTO User (name, email, password, roleId) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, roleId || 2]
        );

        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// You can add more functions here like logout, etc.
