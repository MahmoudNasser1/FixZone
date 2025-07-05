const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all parts used entries
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM PartsUsed');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching parts used entries:', err);
    res.status(500).send('Server Error');
  }
});

// Get parts used entry by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM PartsUsed WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Parts used entry not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching parts used entry with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new parts used entry
router.post('/', async (req, res) => {
  const { quantity, repairRequestId, inventoryItemId, invoiceItemId } = req.body;
  if (!quantity || !repairRequestId || !inventoryItemId) {
    return res.status(400).send('Quantity, repair request ID, and inventory item ID are required');
  }
  try {
    const [result] = await db.query('INSERT INTO PartsUsed (quantity, repairRequestId, inventoryItemId, invoiceItemId) VALUES (?, ?, ?, ?)', [quantity, repairRequestId, inventoryItemId, invoiceItemId]);
    res.status(201).json({ id: result.insertId, quantity, repairRequestId, inventoryItemId, invoiceItemId });
  } catch (err) {
    console.error('Error creating parts used entry:', err);
    res.status(500).send('Server Error');
  }
});

// Update a parts used entry
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { quantity, repairRequestId, inventoryItemId, invoiceItemId } = req.body;
  if (!quantity || !repairRequestId || !inventoryItemId) {
    return res.status(400).send('Quantity, repair request ID, and inventory item ID are required');
  }
  try {
    const [result] = await db.query('UPDATE PartsUsed SET quantity = ?, repairRequestId = ?, inventoryItemId = ?, invoiceItemId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [quantity, repairRequestId, inventoryItemId, invoiceItemId, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Parts used entry not found');
    }
    res.json({ message: 'Parts used entry updated successfully' });
  } catch (err) {
    console.error(`Error updating parts used entry with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Delete a parts used entry
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM PartsUsed WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Parts used entry not found');
    }
    res.json({ message: 'Parts used entry deleted successfully' });
  } catch (err) {
    console.error(`Error deleting parts used entry with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
