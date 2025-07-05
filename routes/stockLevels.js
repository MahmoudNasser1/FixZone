const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all stock levels
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM StockLevel');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching stock levels:', err);
    res.status(500).send('Server Error');
  }
});

// Get stock level by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM StockLevel WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Stock level not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching stock level with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new stock level
router.post('/', async (req, res) => {
  const { inventoryItemId, warehouseId, quantity, minLevel, isLowStock } = req.body;
  if (!inventoryItemId || !warehouseId || quantity === undefined) {
    return res.status(400).send('Inventory item ID, warehouse ID, and quantity are required');
  }
  try {
    const [result] = await db.query('INSERT INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel, isLowStock) VALUES (?, ?, ?, ?, ?)', [inventoryItemId, warehouseId, quantity, minLevel, isLowStock]);
    res.status(201).json({ id: result.insertId, inventoryItemId, warehouseId, quantity, minLevel, isLowStock });
  } catch (err) {
    console.error('Error creating stock level:', err);
    res.status(500).send('Server Error');
  }
});

// Update a stock level
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { inventoryItemId, warehouseId, quantity, minLevel, isLowStock } = req.body;
  if (!inventoryItemId || !warehouseId || quantity === undefined) {
    return res.status(400).send('Inventory item ID, warehouse ID, and quantity are required');
  }
  try {
    const [result] = await db.query('UPDATE StockLevel SET inventoryItemId = ?, warehouseId = ?, quantity = ?, minLevel = ?, isLowStock = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [inventoryItemId, warehouseId, quantity, minLevel, isLowStock, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Stock level not found');
    }
    res.json({ message: 'Stock level updated successfully' });
  } catch (err) {
    console.error(`Error updating stock level with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Delete a stock level
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM StockLevel WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Stock level not found');
    }
    res.json({ message: 'Stock level deleted successfully' });
  } catch (err) {
    console.error(`Error deleting stock level with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
