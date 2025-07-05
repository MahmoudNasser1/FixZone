const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all invoice items
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM InvoiceItem');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching invoice items:', err);
    res.status(500).send('Server Error');
  }
});

// Get invoice item by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM InvoiceItem WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Invoice item not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching invoice item with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new invoice item
router.post('/', async (req, res) => {
  const { quantity, unitPrice, totalPrice, invoiceId, partsUsedId } = req.body;
  if (!quantity || !unitPrice || !totalPrice || !invoiceId) {
    return res.status(400).send('Quantity, unit price, total price, and invoice ID are required');
  }
  try {
    const [result] = await db.query('INSERT INTO InvoiceItem (quantity, unitPrice, totalPrice, invoiceId, partsUsedId) VALUES (?, ?, ?, ?, ?)', [quantity, unitPrice, totalPrice, invoiceId, partsUsedId]);
    res.status(201).json({ id: result.insertId, quantity, unitPrice, totalPrice, invoiceId, partsUsedId });
  } catch (err) {
    console.error('Error creating invoice item:', err);
    res.status(500).send('Server Error');
  }
});

// Update an invoice item
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { quantity, unitPrice, totalPrice, invoiceId, partsUsedId } = req.body;
  if (!quantity || !unitPrice || !totalPrice || !invoiceId) {
    return res.status(400).send('Quantity, unit price, total price, and invoice ID are required');
  }
  try {
    const [result] = await db.query('UPDATE InvoiceItem SET quantity = ?, unitPrice = ?, totalPrice = ?, invoiceId = ?, partsUsedId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [quantity, unitPrice, totalPrice, invoiceId, partsUsedId, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Invoice item not found');
    }
    res.json({ message: 'Invoice item updated successfully' });
  } catch (err) {
    console.error(`Error updating invoice item with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Delete an invoice item (hard delete)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM InvoiceItem WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Invoice item not found');
    }
    res.json({ message: 'Invoice item deleted successfully' });
  } catch (err) {
    console.error(`Error deleting invoice item with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
