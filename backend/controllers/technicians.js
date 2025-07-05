const db = require('../db');

// Assume roleId for technician is known (e.g., 2)
const TECHNICIAN_ROLE_ID = 2;

exports.getAllTechnicians = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM User WHERE roleId = ? AND deletedAt IS NULL', [TECHNICIAN_ROLE_ID]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTechnicianById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM User WHERE id = ? AND roleId = ? AND deletedAt IS NULL', [req.params.id, TECHNICIAN_ROLE_ID]);
    if (rows.length === 0) return res.status(404).json({ error: 'Technician not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createTechnician = async (req, res) => {
  try {
    const { name, email, password, phone, isActive } = req.body;
    const [result] = await db.query(
      'INSERT INTO User (name, email, password, phone, isActive, roleId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [name, email, password, phone, isActive !== undefined ? isActive : true, TECHNICIAN_ROLE_ID]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTechnician = async (req, res) => {
  try {
    const { name, email, password, phone, isActive } = req.body;
    const [result] = await db.query(
      'UPDATE User SET name=?, email=?, password=?, phone=?, isActive=?, updatedAt=NOW() WHERE id=? AND roleId=? AND deletedAt IS NULL',
      [name, email, password, phone, isActive !== undefined ? isActive : true, req.params.id, TECHNICIAN_ROLE_ID]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Technician not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTechnician = async (req, res) => {
  try {
    const [result] = await db.query('UPDATE User SET deletedAt=NOW() WHERE id=? AND roleId=? AND deletedAt IS NULL', [req.params.id, TECHNICIAN_ROLE_ID]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Technician not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 