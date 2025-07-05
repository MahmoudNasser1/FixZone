const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all services (excluding soft-deleted ones)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Service WHERE deletedAt IS NULL');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).send('Server Error');
  }
});

// Get service by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM Service WHERE id = ? AND deletedAt IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Service not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching service with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new service
router.post('/', async (req, res) => {
  const { name, description, basePrice, isActive } = req.body;
  if (!name || !basePrice) {
    return res.status(400).send('Name and basePrice are required');
  }
  try {
    const [result] = await db.query(
      'INSERT INTO Service (name, description, basePrice, isActive) VALUES (?, ?, ?, ?)',
      [name, description, basePrice, isActive]
    );
    res.status(201).json({ id: result.insertId, name, description, basePrice, isActive });
  } catch (err) {
    console.error('Error creating service:', err);
    res.status(500).send('Server Error');
  }
});

// Update a service
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, basePrice, isActive } = req.body;
  if (!name || !basePrice) {
    return res.status(400).send('Name and basePrice are required');
  }
  try {
    const [result] = await db.query(
      'UPDATE Service SET name = ?, description = ?, basePrice = ?, isActive = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL',
      [name, description, basePrice, isActive, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).send('Service not found or already deleted');
    }
    res.json({ message: 'Service updated successfully' });
  } catch (err) {
    console.error(`Error updating service with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Soft delete a service
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM Service WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Service not found');
    }
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    console.error(`Error deleting service with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
