const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all payments
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Payment');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).send('Server Error');
  }
});

// Get payment by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM Payment WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Payment not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching payment with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Get payments by invoice ID
router.get('/invoice/:invoiceId', async (req, res) => {
  const { invoiceId } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT p.*, u.name as userName 
      FROM Payment p 
      LEFT JOIN User u ON p.userId = u.id 
      WHERE p.invoiceId = ? 
      ORDER BY p.createdAt DESC
    `, [invoiceId]);
    res.json(rows);
  } catch (err) {
    console.error(`Error fetching payments for invoice ${invoiceId}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new payment
router.post('/', async (req, res) => {
  const { amount, paymentMethod, invoiceId, userId, currency } = req.body;
  if (!amount || !paymentMethod || !invoiceId || !userId || !currency) {
    return res.status(400).send('Amount, payment method, invoice ID, user ID, and currency are required');
  }
  try {
    const [result] = await db.query('INSERT INTO Payment (amount, paymentMethod, invoiceId, userId, currency) VALUES (?, ?, ?, ?, ?)', [amount, paymentMethod, invoiceId, userId, currency]);
    res.status(201).json({ id: result.insertId, amount, paymentMethod, invoiceId, userId, currency });
  } catch (err) {
    console.error('Error creating payment:', err);
    res.status(500).send('Server Error');
  }
});

// Update a payment
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { amount, paymentMethod, invoiceId, userId, currency } = req.body;
  if (!amount || !paymentMethod || !invoiceId || !userId || !currency) {
    return res.status(400).send('Amount, payment method, invoice ID, user ID, and currency are required');
  }
  try {
    const [result] = await db.query('UPDATE Payment SET amount = ?, paymentMethod = ?, invoiceId = ?, userId = ?, currency = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [amount, paymentMethod, invoiceId, userId, currency, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Payment not found');
    }
    res.json({ message: 'Payment updated successfully' });
  } catch (err) {
    console.error(`Error updating payment with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Delete a payment (hard delete)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM Payment WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Payment not found');
    }
    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    console.error(`Error deleting payment with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
