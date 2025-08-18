const express = require('express');
const router = express.Router();
const db = require('../db');

// Get stock levels (optionally filter by inventoryItemId and/or warehouseId)
router.get('/', async (req, res) => {
  try {
    const { inventoryItemId, warehouseId } = req.query;
    if (inventoryItemId || warehouseId) {
      const where = [];
      const params = [];
      if (inventoryItemId) { where.push('inventoryItemId = ?'); params.push(inventoryItemId); }
      if (warehouseId) { where.push('warehouseId = ?'); params.push(warehouseId); }
      const sql = `SELECT * FROM StockLevel ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`;
      const [rows] = await db.query(sql, params);
      return res.json(rows);
    }
    const [rows] = await db.query('SELECT * FROM StockLevel');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching stock levels:', err);
    res.status(500).send('Server Error');
  }
});

// Get low stock items (by minLevel threshold or explicit isLowStock flag)
router.get('/low-stock', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        sl.id AS stockLevelId,
        ii.id AS inventoryItemId,
        ii.sku,
        ii.name,
        ii.type,
        sl.quantity,
        sl.minLevel,
        sl.isLowStock,
        w.id AS warehouseId,
        w.name AS warehouseName,
        (sl.quantity <= COALESCE(sl.minLevel, 0) OR sl.isLowStock = 1) AS isLow
      FROM StockLevel sl
      INNER JOIN InventoryItem ii ON ii.id = sl.inventoryItemId
      INNER JOIN Warehouse w ON w.id = sl.warehouseId
      WHERE (sl.quantity <= COALESCE(sl.minLevel, 0) OR sl.isLowStock = 1)
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching low stock items:', err);
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
