const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');

// Get all system settings
router.get('/', auth, authorize([1]), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM SystemSetting');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching system settings:', err);
    res.status(500).send('Server Error');
  }
});

// Get system setting by ID (or by key, if preferred)
router.get('/:key', auth, authorize([1]), async (req, res) => {
  const { key } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM SystemSetting WHERE `key` = ?', [key]);
    if (rows.length === 0) {
      return res.status(404).send('System setting not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching system setting with key ${key}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new system setting
router.post('/', auth, authorize([1]), async (req, res) => {
  const { key, value, type, description } = req.body;
  if (!key || !value) {
    return res.status(400).send('Key and value are required');
  }
  try {
    const [result] = await db.query(
      'INSERT INTO SystemSetting (`key`, value, type, description) VALUES (?, ?, ?, ?)',
      [key, value, type, description]
    );
    res.status(201).json({ id: result.insertId, key, value, type, description });
  } catch (err) {
    console.error('Error creating system setting:', err);
    res.status(500).send('Server Error');
  }
});

// Update a system setting
router.put('/:key', auth, authorize([1]), async (req, res) => {
  const { key } = req.params;
  const { value, type, description } = req.body;
  if (!value) {
    return res.status(400).send('Value is required');
  }
  try {
    const [result] = await db.query(
      'UPDATE SystemSetting SET value = ?, type = ?, description = ?, updatedAt = CURRENT_TIMESTAMP WHERE `key` = ?',
      [value, type, description, key]
    );
    if (result.affectedRows === 0) {
      return res.status(404).send('System setting not found');
    }
    res.json({ message: 'System setting updated successfully' });
  } catch (err) {
    console.error(`Error updating system setting with key ${key}:`, err);
    res.status(500).send('Server Error');
  }
});

// Hard delete a system setting
router.delete('/:key', auth, authorize([1]), async (req, res) => {
  const { key } = req.params;
  try {
    const [result] = await db.query('DELETE FROM SystemSetting WHERE `key` = ?', [key]);
    if (result.affectedRows === 0) {
      return res.status(404).send('System setting not found');
    }
    res.json({ message: 'System setting deleted successfully' });
  } catch (err) {
    console.error(`Error deleting system setting with key ${key}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
