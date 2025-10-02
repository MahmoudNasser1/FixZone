const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all stock movements with details
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        sm.*,
        sm.movementType as type,
        i.name as itemName,
        w.name as warehouseName,
        CONCAT(u.firstName, ' ', u.lastName) as userName,
        sm.notes as reason
      FROM StockMovement sm
      LEFT JOIN InventoryItem i ON sm.inventoryItemId = i.id
      LEFT JOIN Warehouse w ON sm.warehouseId = w.id
      LEFT JOIN User u ON sm.createdBy = u.id
      ORDER BY sm.createdAt DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching stock movements:', err);
    res.status(500).send('Server Error');
  }
});

// Get stock movement by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM StockMovement WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Stock movement not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching stock movement with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new stock movement
router.post('/', async (req, res) => {
  const { type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, userId } = req.body;
  if (!type || quantity === undefined || !inventoryItemId || !userId) {
    return res.status(400).send('Type, quantity, inventory item ID, and user ID are required');
  }
  try {
    const [result] = await db.query('INSERT INTO StockMovement (type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, userId) VALUES (?, ?, ?, ?, ?, ?)', [type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, userId]);
    res.status(201).json({ id: result.insertId, type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, userId });
  } catch (err) {
    console.error('Error creating stock movement:', err);
    res.status(500).send('Server Error');
  }
});

// Update a stock movement
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, userId } = req.body;
  if (!type || quantity === undefined || !inventoryItemId || !userId) {
    return res.status(400).send('Type, quantity, inventory item ID, and user ID are required');
  }
  try {
    const [result] = await db.query('UPDATE StockMovement SET type = ?, quantity = ?, inventoryItemId = ?, fromWarehouseId = ?, toWarehouseId = ?, userId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, userId, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Stock movement not found');
    }
    res.json({ message: 'Stock movement updated successfully' });
  } catch (err) {
    console.error(`Error updating stock movement with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Delete a stock movement
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM StockMovement WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Stock movement not found');
    }
    res.json({ message: 'Stock movement deleted successfully' });
  } catch (err) {
    console.error(`Error deleting stock movement with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
