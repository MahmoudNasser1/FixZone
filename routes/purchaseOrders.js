const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all purchase orders
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM PurchaseOrder');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching purchase orders:', err);
    res.status(500).send('Server Error');
  }
});

// Get purchase order by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM PurchaseOrder WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Purchase order not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching purchase order with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new purchase order
router.post('/', async (req, res) => {
  const { status, vendorId, approvalStatus, approvedById, approvalDate } = req.body;
  if (!status || !vendorId) {
    return res.status(400).send('Status and Vendor ID are required');
  }
  try {
    const [result] = await db.query('INSERT INTO PurchaseOrder (status, vendorId, approvalStatus, approvedById, approvalDate) VALUES (?, ?, ?, ?, ?)', [status, vendorId, approvalStatus, approvedById, approvalDate]);
    res.status(201).json({ id: result.insertId, status, vendorId, approvalStatus, approvedById, approvalDate });
  } catch (err) {
    console.error('Error creating purchase order:', err);
    res.status(500).send('Server Error');
  }
});

// Update a purchase order
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, vendorId, approvalStatus, approvedById, approvalDate } = req.body;
  if (!status || !vendorId) {
    return res.status(400).send('Status and Vendor ID are required');
  }
  try {
    const [result] = await db.query('UPDATE PurchaseOrder SET status = ?, vendorId = ?, approvalStatus = ?, approvedById = ?, approvalDate = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [status, vendorId, approvalStatus, approvedById, approvalDate, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Purchase order not found');
    }
    res.json({ message: 'Purchase order updated successfully' });
  } catch (err) {
    console.error(`Error updating purchase order with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Delete a purchase order
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM PurchaseOrder WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Purchase order not found');
    }
    res.json({ message: 'Purchase order deleted successfully' });
  } catch (err) {
    console.error(`Error deleting purchase order with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
