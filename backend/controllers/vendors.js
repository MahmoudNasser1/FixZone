const db = require('../db');

exports.getAllVendors = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Vendor WHERE deletedAt IS NULL');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getVendorById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Vendor WHERE id = ? AND deletedAt IS NULL', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createVendor = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const [result] = await db.query(
      'INSERT INTO Vendor (name, email, phone, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())',
      [name, email, phone]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateVendor = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const [result] = await db.query(
      'UPDATE Vendor SET name=?, email=?, phone=?, updatedAt=NOW() WHERE id=? AND deletedAt IS NULL',
      [name, email, phone, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteVendor = async (req, res) => {
  try {
    const [result] = await db.query('UPDATE Vendor SET deletedAt=NOW() WHERE id=? AND deletedAt IS NULL', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 