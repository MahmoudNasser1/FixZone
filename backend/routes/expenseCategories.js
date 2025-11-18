const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, expenseCategorySchemas } = require('../middleware/validation');

// Apply authentication to all routes
router.use(authMiddleware);

// Get all expense categories (excluding soft-deleted ones)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM ExpenseCategory WHERE deletedAt IS NULL ORDER BY name ASC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching expense categories:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Get expense category by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute(
      'SELECT * FROM ExpenseCategory WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Expense category not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(`Error fetching expense category with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Create a new expense category
router.post('/', validate(expenseCategorySchemas.createExpenseCategory, 'body'), async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Name is required' });
  }
  
  try {
    // Check for duplicate category name
    const [existing] = await db.execute(
      'SELECT id FROM ExpenseCategory WHERE name = ? AND deletedAt IS NULL',
      [name.trim()]
    );
    if (existing.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'Expense category with this name already exists' 
      });
    }
    
    const [result] = await db.execute(
      'INSERT INTO ExpenseCategory (name) VALUES (?)',
      [name.trim()]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, name: name.trim() } });
  } catch (err) {
    console.error('Error creating expense category:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Update an expense category
router.put('/:id', validate(expenseCategorySchemas.updateExpenseCategory, 'body'), async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Name is required' });
  }
  
  try {
    // Check if category exists
    const [existing] = await db.execute(
      'SELECT id FROM ExpenseCategory WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Expense category not found' });
    }
    
    // Check for duplicate category name (excluding current category)
    const [duplicate] = await db.execute(
      'SELECT id FROM ExpenseCategory WHERE name = ? AND id != ? AND deletedAt IS NULL',
      [name.trim(), id]
    );
    if (duplicate.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'Expense category with this name already exists' 
      });
    }
    
    const [result] = await db.execute(
      'UPDATE ExpenseCategory SET name = ?, updatedAt = NOW() WHERE id = ? AND deletedAt IS NULL',
      [name.trim(), id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Expense category not found' });
    }
    res.json({ success: true, message: 'Expense category updated successfully' });
  } catch (err) {
    console.error(`Error updating expense category with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Soft delete an expense category
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute(
      'UPDATE ExpenseCategory SET deletedAt = NOW() WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Expense category not found' });
    }
    res.json({ success: true, message: 'Expense category deleted successfully' });
  } catch (err) {
    console.error(`Error deleting expense category with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

module.exports = router;
