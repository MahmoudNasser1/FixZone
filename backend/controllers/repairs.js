const db = require('../db');

exports.getAllRepairs = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM RepairRequest WHERE deletedAt IS NULL');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRepairById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM RepairRequest WHERE id = ? AND deletedAt IS NULL', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Repair request not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createRepair = async (req, res) => {
  try {
    const { deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, attachments, customFields } = req.body;
    const [result] = await db.query(
      'INSERT INTO RepairRequest (deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, attachments, customFields, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, JSON.stringify(attachments || []), JSON.stringify(customFields || {})]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRepair = async (req, res) => {
  try {
    const { deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, attachments, customFields } = req.body;
    const [result] = await db.query(
      'UPDATE RepairRequest SET deviceId=?, reportedProblem=?, technicianReport=?, status=?, customerId=?, branchId=?, technicianId=?, quotationId=?, invoiceId=?, deviceBatchId=?, attachments=?, customFields=?, updatedAt=NOW() WHERE id=? AND deletedAt IS NULL',
      [deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, JSON.stringify(attachments || []), JSON.stringify(customFields || {}), req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Repair request not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRepair = async (req, res) => {
  try {
    const [result] = await db.query('UPDATE RepairRequest SET deletedAt=NOW() WHERE id=? AND deletedAt IS NULL', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Repair request not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRepairStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const [result] = await db.query('UPDATE RepairRequest SET status=?, updatedAt=NOW() WHERE id=? AND deletedAt IS NULL', [status, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Repair request not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 