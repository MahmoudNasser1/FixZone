const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all device batches
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM DeviceBatch');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching device batches:', err);
    res.status(500).send('Server Error');
  }
});

// Get device batch by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM DeviceBatch WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Device batch not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching device batch with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new device batch
router.post('/', async (req, res) => {
  const { clientId, receivedById, batchDate, notes, status, importLog } = req.body;
  if (!clientId || !receivedById || !batchDate) {
    return res.status(400).send('Client ID, Received By ID, and Batch Date are required');
  }
  try {
    const [result] = await db.query('INSERT INTO DeviceBatch (clientId, receivedById, batchDate, notes, status, importLog) VALUES (?, ?, ?, ?, ?, ?)', [clientId, receivedById, batchDate, notes, status, importLog]);
    res.status(201).json({ id: result.insertId, clientId, receivedById, batchDate, notes, status, importLog });
  } catch (err) {
    console.error('Error creating device batch:', err);
    res.status(500).send('Server Error');
  }
});

// Update a device batch
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { clientId, receivedById, batchDate, notes, status, importLog } = req.body;
  if (!clientId || !receivedById || !batchDate) {
    return res.status(400).send('Client ID, Received By ID, and Batch Date are required');
  }
  try {
    const [result] = await db.query('UPDATE DeviceBatch SET clientId = ?, receivedById = ?, batchDate = ?, notes = ?, status = ?, importLog = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [clientId, receivedById, batchDate, notes, status, importLog, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Device batch not found');
    }
    res.json({ message: 'Device batch updated successfully' });
  } catch (err) {
    console.error(`Error updating device batch with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Delete a device batch (hard delete, as no deletedAt column)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM DeviceBatch WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Device batch not found');
    }
    res.json({ message: 'Device batch deleted successfully' });
  } catch (err) {
    console.error(`Error deleting device batch with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
