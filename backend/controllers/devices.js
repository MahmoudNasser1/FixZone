const db = require('../db');

exports.getAllDevices = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Device WHERE deletedAt IS NULL');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDeviceById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Device WHERE id = ? AND deletedAt IS NULL', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Device not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createDevice = async (req, res) => {
  try {
    const { customerId, deviceType, brand, model, serialNumber, customFields, deviceBatchId } = req.body;
    const [result] = await db.query(
      'INSERT INTO Device (customerId, deviceType, brand, model, serialNumber, customFields, deviceBatchId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [customerId, deviceType, brand, model, serialNumber, JSON.stringify(customFields || {}), deviceBatchId]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateDevice = async (req, res) => {
  try {
    const { customerId, deviceType, brand, model, serialNumber, customFields, deviceBatchId } = req.body;
    const [result] = await db.query(
      'UPDATE Device SET customerId=?, deviceType=?, brand=?, model=?, serialNumber=?, customFields=?, deviceBatchId=?, updatedAt=NOW() WHERE id=? AND deletedAt IS NULL',
      [customerId, deviceType, brand, model, serialNumber, JSON.stringify(customFields || {}), deviceBatchId, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Device not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteDevice = async (req, res) => {
  try {
    const [result] = await db.query(
      'UPDATE Device SET deletedAt=NOW() WHERE id=? AND deletedAt IS NULL',
      [req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Device not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 