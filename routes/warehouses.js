const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all warehouses (excluding soft-deleted ones)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Warehouse WHERE deletedAt IS NULL');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching warehouses:', err);
    res.status(500).send('Server Error');
  }
});

// Get warehouse by ID (only if not soft-deleted)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM Warehouse WHERE id = ? AND deletedAt IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Warehouse not found or already deleted');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching warehouse with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new warehouse
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).send('Warehouse name is required');
  }
  try {
    const [result] = await db.query('INSERT INTO Warehouse (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    console.error('Error creating warehouse:', err);
    res.status(500).send('Server Error');
  }
});

// Update a warehouse
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    return res.status(400).send('Warehouse name is required');
  }
  try {
    const [result] = await db.query('UPDATE Warehouse SET name = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [name, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Warehouse not found or already deleted');
    }
    res.json({ message: 'Warehouse updated successfully' });
  } catch (err) {
    console.error(`Error updating warehouse with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Soft delete a warehouse
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM Warehouse WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Warehouse not found');
    }
    res.json({ message: 'Warehouse deleted successfully' });
  } catch (err) {
    console.error(`Error deleting warehouse with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
