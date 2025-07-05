const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all repair request services
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM RepairRequestService');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching repair request services:', err);
    res.status(500).send('Server Error');
  }
});

// Get repair request service by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM RepairRequestService WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Repair request service not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching repair request service with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new repair request service
router.post('/', async (req, res) => {
  const { repairRequestId, serviceId, technicianId, price, notes } = req.body;
  if (!repairRequestId || !serviceId || !technicianId || !price) {
    return res.status(400).send('repairRequestId, serviceId, technicianId, and price are required');
  }
  try {
    const [result] = await db.query(
      'INSERT INTO RepairRequestService (repairRequestId, serviceId, technicianId, price, notes) VALUES (?, ?, ?, ?, ?)',
      [repairRequestId, serviceId, technicianId, price, notes]
    );
    res.status(201).json({ id: result.insertId, repairRequestId, serviceId, technicianId, price, notes });
  } catch (err) {
    console.error('Error creating repair request service:', err);
    res.status(500).send('Server Error');
  }
});

// Update a repair request service
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { repairRequestId, serviceId, technicianId, price, notes } = req.body;
  if (!repairRequestId || !serviceId || !technicianId || !price) {
    return res.status(400).send('repairRequestId, serviceId, technicianId, and price are required');
  }
  try {
    const [result] = await db.query(
      'UPDATE RepairRequestService SET repairRequestId = ?, serviceId = ?, technicianId = ?, price = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [repairRequestId, serviceId, technicianId, price, notes, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).send('Repair request service not found');
    }
    res.json({ message: 'Repair request service updated successfully' });
  } catch (err) {
    console.error(`Error updating repair request service with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Hard delete a repair request service
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM RepairRequestService WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Repair request service not found');
    }
    res.json({ message: 'Repair request service deleted successfully' });
  } catch (err) {
    console.error(`Error deleting repair request service with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
