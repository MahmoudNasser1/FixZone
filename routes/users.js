const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all users
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, phone, isActive, roleId, createdAt, updatedAt FROM User WHERE deletedAt IS NULL');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send('Server Error');
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT id, name, email, phone, isActive, roleId, createdAt, updatedAt FROM User WHERE id = ? AND deletedAt IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).send('User not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching user with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new user
router.post('/', async (req, res) => {
  const { name, email, password, phone, isActive, roleId } = req.body;
  if (!name || !email || !password || !roleId) {
    return res.status(400).send('Name, email, password, and roleId are required');
  }
  try {
    const [result] = await db.query('INSERT INTO User (name, email, password, phone, isActive, roleId) VALUES (?, ?, ?, ?, ?, ?)', [name, email, password, phone, isActive, roleId]);
    res.status(201).json({ id: result.insertId, name, email, phone, isActive, roleId });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).send('Server Error');
  }
});

// Update a user
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, password, phone, isActive, roleId } = req.body;
  if (!name || !email || !roleId) {
    return res.status(400).send('Name, email, and roleId are required');
  }
  try {
    const [result] = await db.query('UPDATE User SET name = ?, email = ?, password = ?, phone = ?, isActive = ?, roleId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [name, email, password, phone, isActive, roleId, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('User not found or already deleted');
    }
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error(`Error updating user with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Soft delete a user
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM User WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('User not found');
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(`Error deleting user with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Get all login logs for a user
router.get('/:userId/login-logs', async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM UserLoginLog WHERE userId = ?', [userId]);
    res.json(rows);
  } catch (err) {
    console.error(`Error fetching login logs for user ${userId}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new login log
router.post('/:userId/login-logs', async (req, res) => {
  const { userId } = req.params;
  const { ipAddress, deviceInfo } = req.body;
  try {
    const [result] = await db.query('INSERT INTO UserLoginLog (userId, ipAddress, deviceInfo) VALUES (?, ?, ?)', [userId, ipAddress, deviceInfo]);
    res.status(201).json({ id: result.insertId, userId, ipAddress, deviceInfo });
  } catch (err) {
    console.error(`Error creating login log for user ${userId}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
