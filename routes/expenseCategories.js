const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all expense categories (excluding soft-deleted ones)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM ExpenseCategory WHERE deletedAt IS NULL');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching expense categories:', err);
    res.status(500).send('Server Error');
  }
});

// Get expense category by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM ExpenseCategory WHERE id = ? AND deletedAt IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Expense category not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching expense category with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new expense category
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).send('Name is required');
  }
  try {
    const [result] = await db.query('INSERT INTO ExpenseCategory (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    console.error('Error creating expense category:', err);
    res.status(500).send('Server Error');
  }
});

// Update an expense category
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    return res.status(400).send('Name is required');
  }
  try {
    const [result] = await db.query('UPDATE ExpenseCategory SET name = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [name, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Expense category not found or already deleted');
    }
    res.json({ message: 'Expense category updated successfully' });
  } catch (err) {
    console.error(`Error updating expense category with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Soft delete an expense category
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('UPDATE ExpenseCategory SET deletedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Expense category not found or already deleted');
    }
    res.json({ message: 'Expense category deleted successfully (soft delete)' });
  } catch (err) {
    console.error(`Error soft deleting expense category with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
