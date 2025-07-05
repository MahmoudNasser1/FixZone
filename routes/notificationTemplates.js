const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all notification templates
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM NotificationTemplate');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching notification templates:', err);
    res.status(500).send('Server Error');
  }
});

// Get notification template by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM NotificationTemplate WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Notification template not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching notification template with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new notification template
router.post('/', async (req, res) => {
  const { type, template } = req.body;
  if (!type || !template) {
    return res.status(400).send('Type and template are required');
  }
  try {
    const [result] = await db.query(
      'INSERT INTO NotificationTemplate (type, template) VALUES (?, ?)',
      [type, template]
    );
    res.status(201).json({ id: result.insertId, type, template });
  } catch (err) {
    console.error('Error creating notification template:', err);
    res.status(500).send('Server Error');
  }
});

// Update a notification template
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { type, template } = req.body;
  if (!type || !template) {
    return res.status(400).send('Type and template are required');
  }
  try {
    const [result] = await db.query(
      'UPDATE NotificationTemplate SET type = ?, template = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [type, template, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).send('Notification template not found');
    }
    res.json({ message: 'Notification template updated successfully' });
  } catch (err) {
    console.error(`Error updating notification template with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Hard delete a notification template
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM NotificationTemplate WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Notification template not found');
    }
    res.json({ message: 'Notification template deleted successfully' });
  } catch (err) {
    console.error(`Error deleting notification template with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
