const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all quotations
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Quotation');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching quotations:', err);
    res.status(500).send('Server Error');
  }
});

// Get quotation by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM Quotation WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Quotation not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching quotation with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new quotation
router.post('/', async (req, res) => {
  const { status, totalAmount, taxAmount, notes, sentAt, responseAt, repairRequestId, currency } = req.body;
  if (!status || !totalAmount || !repairRequestId) {
    return res.status(400).send('Status, total amount, and repair request ID are required');
  }
  try {
    const [result] = await db.query('INSERT INTO Quotation (status, totalAmount, taxAmount, notes, sentAt, responseAt, repairRequestId, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [status, totalAmount, taxAmount, notes, sentAt, responseAt, repairRequestId, currency]);
    res.status(201).json({ id: result.insertId, status, totalAmount, taxAmount, notes, sentAt, responseAt, repairRequestId, currency });
  } catch (err) {
    console.error('Error creating quotation:', err);
    res.status(500).send('Server Error');
  }
});

// Update a quotation
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, totalAmount, taxAmount, notes, sentAt, responseAt, repairRequestId, currency } = req.body;
  if (!status || !totalAmount || !repairRequestId) {
    return res.status(400).send('Status, total amount, and repair request ID are required');
  }
  try {
    const [result] = await db.query('UPDATE Quotation SET status = ?, totalAmount = ?, taxAmount = ?, notes = ?, sentAt = ?, responseAt = ?, repairRequestId = ?, currency = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [status, totalAmount, taxAmount, notes, sentAt, responseAt, repairRequestId, currency, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Quotation not found');
    }
    res.json({ message: 'Quotation updated successfully' });
  } catch (err) {
    console.error(`Error updating quotation with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Delete a quotation
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM Quotation WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Quotation not found');
    }
    res.json({ message: 'Quotation deleted successfully' });
  } catch (err) {
    console.error(`Error deleting quotation with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
