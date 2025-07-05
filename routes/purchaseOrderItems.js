const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all purchase order items
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM PurchaseOrderItem');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching purchase order items:', err);
    res.status(500).send('Server Error');
  }
});

// Get purchase order item by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM PurchaseOrderItem WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Purchase order item not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching purchase order item with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new purchase order item
router.post('/', async (req, res) => {
  const { quantity, unitPrice, totalPrice, purchaseOrderId, inventoryItemId } = req.body;
  if (!quantity || !unitPrice || !totalPrice || !purchaseOrderId || !inventoryItemId) {
    return res.status(400).send('Quantity, unit price, total price, purchase order ID, and inventory item ID are required');
  }
  try {
    const [result] = await db.query('INSERT INTO PurchaseOrderItem (quantity, unitPrice, totalPrice, purchaseOrderId, inventoryItemId) VALUES (?, ?, ?, ?, ?)', [quantity, unitPrice, totalPrice, purchaseOrderId, inventoryItemId]);
    res.status(201).json({ id: result.insertId, quantity, unitPrice, totalPrice, purchaseOrderId, inventoryItemId });
  } catch (err) {
    console.error('Error creating purchase order item:', err);
    res.status(500).send('Server Error');
  }
});

// Update a purchase order item
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { quantity, unitPrice, totalPrice, purchaseOrderId, inventoryItemId } = req.body;
  if (!quantity || !unitPrice || !totalPrice || !purchaseOrderId || !inventoryItemId) {
    return res.status(400).send('Quantity, unit price, total price, purchase order ID, and inventory item ID are required');
  }
  try {
    const [result] = await db.query('UPDATE PurchaseOrderItem SET quantity = ?, unitPrice = ?, totalPrice = ?, purchaseOrderId = ?, inventoryItemId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [quantity, unitPrice, totalPrice, purchaseOrderId, inventoryItemId, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Purchase order item not found');
    }
    res.json({ message: 'Purchase order item updated successfully' });
  } catch (err) {
    console.error(`Error updating purchase order item with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Delete a purchase order item
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM PurchaseOrderItem WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Purchase order item not found');
    }
    res.json({ message: 'Purchase order item deleted successfully' });
  } catch (err) {
    console.error(`Error deleting purchase order item with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
