const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all status update logs
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM StatusUpdateLog');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching status update logs:', err);
    res.status(500).send('Server Error');
  }
});

// Get status update log by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM StatusUpdateLog WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Status update log not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching status update log with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new status update log
router.post('/', async (req, res) => {
  const { repairRequestId, fromStatus, toStatus, notes, changedById } = req.body;
  if (!repairRequestId || !fromStatus || !toStatus || !changedById) {
    return res.status(400).send('Repair Request ID, From Status, To Status, and Changed By ID are required');
  }
  try {
    const [result] = await db.query('INSERT INTO StatusUpdateLog (repairRequestId, fromStatus, toStatus, notes, changedById) VALUES (?, ?, ?, ?, ?)', [repairRequestId, fromStatus, toStatus, notes, changedById]);
    res.status(201).json({ id: result.insertId, repairRequestId, fromStatus, toStatus, notes, changedById });
  } catch (err) {
    console.error('Error creating status update log:', err);
    res.status(500).send('Server Error');
  }
});

// Update a status update log
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { repairRequestId, fromStatus, toStatus, notes, changedById } = req.body;
  if (!repairRequestId || !fromStatus || !toStatus || !changedById) {
    return res.status(400).send('Repair Request ID, From Status, To Status, and Changed By ID are required');
  }
  try {
    const [result] = await db.query('UPDATE StatusUpdateLog SET repairRequestId = ?, fromStatus = ?, toStatus = ?, notes = ?, changedById = ? WHERE id = ?', [repairRequestId, fromStatus, toStatus, notes, changedById, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Status update log not found');
    }
    res.json({ message: 'Status update log updated successfully' });
  } catch (err) {
    console.error(`Error updating status update log with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Delete a status update log
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM StatusUpdateLog WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Status update log not found');
    }
    res.json({ message: 'Status update log deleted successfully' });
  } catch (err) {
    console.error(`Error deleting status update log with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
