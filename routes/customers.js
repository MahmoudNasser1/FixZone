const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all customers
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Customer WHERE deletedAt IS NULL');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).send('Server Error');
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM Customer WHERE id = ? AND deletedAt IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Customer not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching customer with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new customer
router.post('/', async (req, res) => {
  const { name, phone, email, address, customFields } = req.body;
  if (!name) {
    return res.status(400).send('Customer name is required');
  }
  try {
    const [result] = await db.query('INSERT INTO Customer (name, phone, email, address, customFields) VALUES (?, ?, ?, ?, ?)', [name, phone, email, address, JSON.stringify(customFields)]);
    res.status(201).json({ id: result.insertId, name, phone, email, address, customFields });
  } catch (err) {
    console.error('Error creating customer:', err);
    res.status(500).send('Server Error');
  }
});

// Update a customer
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, address, customFields } = req.body;
  if (!name) {
    return res.status(400).send('Customer name is required');
  }
  try {
    const [result] = await db.query('UPDATE Customer SET name = ?, phone = ?, email = ?, address = ?, customFields = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [name, phone, email, address, JSON.stringify(customFields), id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Customer not found or already deleted');
    }
    res.json({ message: 'Customer updated successfully' });
  } catch (err) {
    console.error(`Error updating customer with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Soft delete a customer
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('UPDATE Customer SET deletedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Customer not found or already deleted');
    }
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.error(`Error deleting customer with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
