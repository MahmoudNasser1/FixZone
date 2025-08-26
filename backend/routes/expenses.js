const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all expenses (excluding soft-deleted ones)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Expense WHERE deletedAt IS NULL');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).send('Server Error');
  }
});

// Get expense by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM Expense WHERE id = ? AND deletedAt IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Expense not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching expense with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new expense
router.post('/', async (req, res) => {
  const { description, amount, expenseDate, categoryId, userId, currency } = req.body;
  if (!description || !amount || !expenseDate || !categoryId || !userId || !currency) {
    return res.status(400).send('Description, amount, expenseDate, categoryId, userId, and currency are required');
  }
  try {
    const [result] = await db.query(
      'INSERT INTO Expense (description, amount, expenseDate, categoryId, userId, currency) VALUES (?, ?, ?, ?, ?, ?)',
      [description, amount, expenseDate, categoryId, userId, currency]
    );
    res.status(201).json({ id: result.insertId, description, amount, expenseDate, categoryId, userId, currency });
  } catch (err) {
    console.error('Error creating expense:', err);
    res.status(500).send('Server Error');
  }
});

// Update an expense
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { description, amount, expenseDate, categoryId, userId, currency } = req.body;
  if (!description || !amount || !expenseDate || !categoryId || !userId || !currency) {
    return res.status(400).send('Description, amount, expenseDate, categoryId, userId, and currency are required');
  }
  try {
    const [result] = await db.query(
      'UPDATE Expense SET description = ?, amount = ?, expenseDate = ?, categoryId = ?, userId = ?, currency = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL',
      [description, amount, expenseDate, categoryId, userId, currency, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).send('Expense not found or already deleted');
    }
    res.json({ message: 'Expense updated successfully' });
  } catch (err) {
    console.error(`Error updating expense with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Soft delete an expense
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM Expense WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Expense not found');
    }
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    console.error(`Error deleting expense with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
