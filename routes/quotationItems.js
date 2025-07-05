const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all quotation items
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM QuotationItem');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching quotation items:', err);
    res.status(500).send('Server Error');
  }
});

// Get quotation item by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM QuotationItem WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Quotation item not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching quotation item with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new quotation item
router.post('/', async (req, res) => {
  const { description, quantity, unitPrice, totalPrice, quotationId } = req.body;
  if (!description || !quantity || !unitPrice || !totalPrice || !quotationId) {
    return res.status(400).send('Description, quantity, unit price, total price, and quotation ID are required');
  }
  try {
    const [result] = await db.query('INSERT INTO QuotationItem (description, quantity, unitPrice, totalPrice, quotationId) VALUES (?, ?, ?, ?, ?)', [description, quantity, unitPrice, totalPrice, quotationId]);
    res.status(201).json({ id: result.insertId, description, quantity, unitPrice, totalPrice, quotationId });
  } catch (err) {
    console.error('Error creating quotation item:', err);
    res.status(500).send('Server Error');
  }
});

// Update a quotation item
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { description, quantity, unitPrice, totalPrice, quotationId } = req.body;
  if (!description || !quantity || !unitPrice || !totalPrice || !quotationId) {
    return res.status(400).send('Description, quantity, unit price, total price, and quotation ID are required');
  }
  try {
    const [result] = await db.query('UPDATE QuotationItem SET description = ?, quantity = ?, unitPrice = ?, totalPrice = ?, quotationId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [description, quantity, unitPrice, totalPrice, quotationId, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Quotation item not found');
    }
    res.json({ message: 'Quotation item updated successfully' });
  } catch (err) {
    console.error(`Error updating quotation item with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Delete a quotation item
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM QuotationItem WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Quotation item not found');
    }
    res.json({ message: 'Quotation item deleted successfully' });
  } catch (err) {
    console.error(`Error deleting quotation item with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
