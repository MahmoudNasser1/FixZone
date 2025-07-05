const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all inventory items (excluding soft-deleted ones)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM InventoryItem WHERE deletedAt IS NULL');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching inventory items:', err);
    res.status(500).send('Server Error');
  }
});

// Get inventory item by ID (only if not soft-deleted)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM InventoryItem WHERE id = ? AND deletedAt IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Inventory item not found or already deleted');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching inventory item with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new inventory item
router.post('/', async (req, res) => {
  const { sku, name, type, purchasePrice, sellingPrice, serialNumber, customFields } = req.body;
  if (!sku || !name) {
    return res.status(400).send('SKU and name are required');
  }
  try {
    const [result] = await db.query('INSERT INTO InventoryItem (sku, name, type, purchasePrice, sellingPrice, serialNumber, customFields) VALUES (?, ?, ?, ?, ?, ?, ?)', [sku, name, type, purchasePrice, sellingPrice, serialNumber, JSON.stringify(customFields)]);
    res.status(201).json({ id: result.insertId, sku, name, type, purchasePrice, sellingPrice, serialNumber, customFields });
  } catch (err) {
    console.error('Error creating inventory item:', err);
    res.status(500).send('Server Error');
  }
});

// Update an inventory item
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { sku, name, type, purchasePrice, sellingPrice, serialNumber, customFields } = req.body;
  if (!sku || !name) {
    return res.status(400).send('SKU and name are required');
  }
  try {
    const [result] = await db.query('UPDATE InventoryItem SET sku = ?, name = ?, type = ?, purchasePrice = ?, sellingPrice = ?, serialNumber = ?, customFields = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [sku, name, type, purchasePrice, sellingPrice, serialNumber, JSON.stringify(customFields), id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Inventory item not found or already deleted');
    }
    res.json({ message: 'Inventory item updated successfully' });
  } catch (err) {
    console.error(`Error updating inventory item with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Soft delete an inventory item
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('UPDATE InventoryItem SET deletedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Inventory item not found or already deleted');
    }
    res.json({ message: 'Inventory item soft-deleted successfully' });
  } catch (err) {
    console.error(`Error soft-deleting inventory item with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
