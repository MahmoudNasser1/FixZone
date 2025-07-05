const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all vendors (excluding soft-deleted ones)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Vendor WHERE deletedAt IS NULL');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching vendors:', err);
    res.status(500).send('Server Error');
  }
});

// Get vendor by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM Vendor WHERE id = ? AND deletedAt IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Vendor not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching vendor with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new vendor
router.post('/', async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name) {
    return res.status(400).send('Vendor name is required');
  }
  try {
    const [result] = await db.query('INSERT INTO Vendor (name, email, phone) VALUES (?, ?, ?)', [name, email, phone]);
    res.status(201).json({ id: result.insertId, name, email, phone });
  } catch (err) {
    console.error('Error creating vendor:', err);
    res.status(500).send('Server Error');
  }
});

// Update a vendor
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;
  if (!name) {
    return res.status(400).send('Vendor name is required');
  }
  try {
    const [result] = await db.query('UPDATE Vendor SET name = ?, email = ?, phone = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [name, email, phone, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Vendor not found or already deleted');
    }
    res.json({ message: 'Vendor updated successfully' });
  } catch (err) {
    console.error(`Error updating vendor with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Soft delete a vendor
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM Vendor WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Vendor not found');
    }
    res.json({ message: 'Vendor deleted successfully' });
  } catch (err) {
    console.error(`Error deleting vendor with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
