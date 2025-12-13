const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all inspection types (excluding soft-deleted ones)
router.get('/', async (req, res) => {
  try {
    // Get all non-deleted types, ordered by name
    // Note: We don't filter by isActive here to show all available types
    const [rows] = await db.query(`
      SELECT * FROM InspectionType 
      WHERE deletedAt IS NULL 
      ORDER BY name ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching inspection types:', err);
    res.status(500).send('Server Error');
  }
});

// Get inspection type by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM InspectionType WHERE id = ? AND deletedAt IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Inspection type not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching inspection type with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new inspection type
router.post('/', async (req, res) => {
  const { name, description, isActive } = req.body;
  if (!name) {
    return res.status(400).send('Name is required');
  }
  try {
    const [result] = await db.query(
      'INSERT INTO InspectionType (name, description, isActive) VALUES (?, ?, ?)',
      [name, description, isActive]
    );
    res.status(201).json({ id: result.insertId, name, description, isActive });
  } catch (err) {
    console.error('Error creating inspection type:', err);
    res.status(500).send('Server Error');
  }
});

// Update an inspection type
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, isActive } = req.body;
  if (!name) {
    return res.status(400).send('Name is required');
  }
  try {
    const [result] = await db.query(
      'UPDATE InspectionType SET name = ?, description = ?, isActive = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL',
      [name, description, isActive, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).send('Inspection type not found or already deleted');
    }
    res.json({ message: 'Inspection type updated successfully' });
  } catch (err) {
    console.error(`Error updating inspection type with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Soft delete an inspection type
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM InspectionType WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Inspection type not found');
    }
    res.json({ message: 'Inspection type deleted successfully' });
  } catch (err) {
    console.error(`Error deleting inspection type with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
