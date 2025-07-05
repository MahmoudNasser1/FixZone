const db = require('../db');

exports.getAllInventoryItems = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM InventoryItem WHERE deletedAt IS NULL');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getInventoryItemById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM InventoryItem WHERE id = ? AND deletedAt IS NULL', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Inventory item not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createInventoryItem = async (req, res) => {
  try {
    const { sku, name, type, purchasePrice, sellingPrice, serialNumber, customFields } = req.body;
    const [result] = await db.query(
      'INSERT INTO InventoryItem (sku, name, type, purchasePrice, sellingPrice, serialNumber, customFields, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [sku, name, type, purchasePrice, sellingPrice, serialNumber, JSON.stringify(customFields || {})]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateInventoryItem = async (req, res) => {
  try {
    const { sku, name, type, purchasePrice, sellingPrice, serialNumber, customFields } = req.body;
    const [result] = await db.query(
      'UPDATE InventoryItem SET sku=?, name=?, type=?, purchasePrice=?, sellingPrice=?, serialNumber=?, customFields=?, updatedAt=NOW() WHERE id=? AND deletedAt IS NULL',
      [sku, name, type, purchasePrice, sellingPrice, serialNumber, JSON.stringify(customFields || {}), req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Inventory item not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteInventoryItem = async (req, res) => {
  try {
    const [result] = await db.query('UPDATE InventoryItem SET deletedAt=NOW() WHERE id=? AND deletedAt IS NULL', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Inventory item not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.moveInventoryItem = async (req, res) => {
  try {
    const { warehouseId, quantity } = req.body;
    // This is a simplified example. In a real app, you would update StockLevel and log StockMovement.
    const [result] = await db.query('UPDATE StockLevel SET quantity=? WHERE inventoryItemId=? AND warehouseId=?', [quantity, req.params.id, warehouseId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Stock level not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 