const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all invoices (excluding soft-deleted ones)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Invoice WHERE deletedAt IS NULL');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).send('Server Error');
  }
});

// Get invoice by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM Invoice WHERE id = ? AND deletedAt IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Invoice not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching invoice with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new invoice
router.post('/', async (req, res) => {
  const { totalAmount, amountPaid, status, repairRequestId, currency, taxAmount } = req.body;
  if (!totalAmount || !amountPaid || !status || !repairRequestId || !currency || !taxAmount) {
    return res.status(400).send('Total amount, amount paid, status, repair request ID, currency, and tax amount are required');
  }
  try {
    const [result] = await db.query('INSERT INTO Invoice (totalAmount, amountPaid, status, repairRequestId, currency, taxAmount) VALUES (?, ?, ?, ?, ?, ?)', [totalAmount, amountPaid, status, repairRequestId, currency, taxAmount]);
    res.status(201).json({ id: result.insertId, totalAmount, amountPaid, status, repairRequestId, currency, taxAmount });
  } catch (err) {
    console.error('Error creating invoice:', err);
    res.status(500).send('Server Error');
  }
});

// Update an invoice
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { totalAmount, amountPaid, status, repairRequestId, currency, taxAmount } = req.body;
  if (!totalAmount || !amountPaid || !status || !repairRequestId || !currency || !taxAmount) {
    return res.status(400).send('Total amount, amount paid, status, repair request ID, currency, and tax amount are required');
  }
  try {
    const [result] = await db.query('UPDATE Invoice SET totalAmount = ?, amountPaid = ?, status = ?, repairRequestId = ?, currency = ?, taxAmount = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [totalAmount, amountPaid, status, repairRequestId, currency, taxAmount, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Invoice not found or already deleted');
    }
    res.json({ message: 'Invoice updated successfully' });
  } catch (err) {
    console.error(`Error updating invoice with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Soft delete an invoice
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('UPDATE Invoice SET deletedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Invoice not found or already deleted');
    }
    res.json({ message: 'Invoice deleted successfully (soft delete)' });
  } catch (err) {
    console.error(`Error soft deleting invoice with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
