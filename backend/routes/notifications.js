const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all notifications
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Notification');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).send('Server Error');
  }
});

// Get notification by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM Notification WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Notification not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching notification with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new notification
router.post('/', async (req, res) => {
  const { type, message, isRead, userId, repairRequestId, channel } = req.body;
  if (!type || !message) {
    return res.status(400).send('Type and message are required');
  }
  try {
    const [result] = await db.query(
      'INSERT INTO Notification (type, message, isRead, userId, repairRequestId, channel) VALUES (?, ?, ?, ?, ?, ?)',
      [type, message, isRead, userId, repairRequestId, channel]
    );
    res.status(201).json({ id: result.insertId, type, message, isRead, userId, repairRequestId, channel });
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).send('Server Error');
  }
});

// Update a notification
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { type, message, isRead, userId, repairRequestId, channel } = req.body;
  if (!type || !message) {
    return res.status(400).send('Type and message are required');
  }
  try {
    const [result] = await db.query(
      'UPDATE Notification SET type = ?, message = ?, isRead = ?, userId = ?, repairRequestId = ?, channel = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [type, message, isRead, userId, repairRequestId, channel, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).send('Notification not found');
    }
    res.json({ message: 'Notification updated successfully' });
  } catch (err) {
    console.error(`Error updating notification with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Hard delete a notification
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM Notification WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Notification not found');
    }
    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    console.error(`Error deleting notification with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
