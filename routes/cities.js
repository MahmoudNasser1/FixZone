const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all cities
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM City WHERE deletedAt IS NULL');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching cities:', err);
    res.status(500).send('Server Error');
  }
});

// Get city by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM City WHERE id = ? AND deletedAt IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).send('City not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching city with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new city
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).send('City name is required');
  }
  try {
    const [result] = await db.query('INSERT INTO City (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    console.error('Error creating city:', err);
    res.status(500).send('Server Error');
  }
});

// Update a city
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    return res.status(400).send('City name is required');
  }
  try {
    const [result] = await db.query('UPDATE City SET name = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [name, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('City not found or already deleted');
    }
    res.json({ message: 'City updated successfully' });
  } catch (err) {
    console.error(`Error updating city with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Soft delete a city
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM City WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('City not found');
    }
    res.json({ message: 'City deleted successfully' });
  } catch (err) {
    console.error(`Error deleting city with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
