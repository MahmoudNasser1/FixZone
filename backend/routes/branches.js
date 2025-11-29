const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const branchesFinancialService = require('../services/financial/branches.service');

// Get all branches
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Branch WHERE deletedAt IS NULL');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching branches:', err);
    res.status(500).send('Server Error');
  }
});

// Get branch by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM Branch WHERE id = ? AND deletedAt IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Branch not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching branch with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new branch
router.post('/', async (req, res) => {
  const { name, address, phone, cityId } = req.body;
  if (!name || !cityId) {
    return res.status(400).send('Name and cityId are required');
  }
  try {
    const [result] = await db.query('INSERT INTO Branch (name, address, phone, cityId) VALUES (?, ?, ?, ?)', [name, address, phone, cityId]);
    res.status(201).json({ id: result.insertId, name, address, phone, cityId });
  } catch (err) {
    console.error('Error creating branch:', err);
    res.status(500).send('Server Error');
  }
});

// Update a branch
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, address, phone, cityId } = req.body;
  if (!name || !cityId) {
    return res.status(400).send('Name and cityId are required');
  }
  try {
    const [result] = await db.query('UPDATE Branch SET name = ?, address = ?, phone = ?, cityId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [name, address, phone, cityId, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Branch not found or already deleted');
    }
    res.json({ message: 'Branch updated successfully' });
  } catch (err) {
    console.error(`Error updating branch with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Soft delete a branch
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM Branch WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Branch not found');
    }
    res.json({ message: 'Branch deleted successfully' });
  } catch (err) {
    console.error(`Error deleting branch with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Branch Financial APIs
// GET /api/branches/:id/financial-summary
router.get('/:id/financial-summary', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };
    const summary = await branchesFinancialService.getFinancialSummary(parseInt(id), filters);
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting branch financial summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting branch financial summary',
      error: error.message
    });
  }
});

// GET /api/branches/:id/invoices
router.get('/:id/invoices', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const filters = {
      status: req.query.status,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };
    const invoices = await branchesFinancialService.getInvoices(parseInt(id), filters);
    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error getting branch invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting branch invoices',
      error: error.message
    });
  }
});

// GET /api/branches/:id/expenses
router.get('/:id/expenses', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const filters = {
      categoryId: req.query.categoryId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };
    const expenses = await branchesFinancialService.getExpenses(parseInt(id), filters);
    res.json({
      success: true,
      data: expenses
    });
  } catch (error) {
    console.error('Error getting branch expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting branch expenses',
      error: error.message
    });
  }
});

module.exports = router;
