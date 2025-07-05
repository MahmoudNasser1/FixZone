const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all repair requests
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM RepairRequest WHERE deletedAt IS NULL');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching repair requests:', err);
    res.status(500).send('Server Error');
  }
});

// Get repair request by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM RepairRequest WHERE id = ? AND deletedAt IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Repair request not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching repair request with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new repair request
router.post('/', async (req, res) => {
  const { deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, attachments, customFields } = req.body;
  if (!deviceId || !reportedProblem || !customerId || !branchId) {
    return res.status(400).send('Device ID, reported problem, customer ID, and branch ID are required');
  }
  try {
    const [result] = await db.query('INSERT INTO RepairRequest (deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, attachments, customFields) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, JSON.stringify(attachments), JSON.stringify(customFields)]);
    res.status(201).json({ id: result.insertId, deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, attachments, customFields });
  } catch (err) {
    console.error('Error creating repair request:', err);
    res.status(500).send('Server Error');
  }
});

// Update a repair request
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, attachments, customFields } = req.body;
  if (!deviceId || !reportedProblem || !customerId || !branchId) {
    return res.status(400).send('Device ID, reported problem, customer ID, and branch ID are required');
  }
  try {
    const [result] = await db.query('UPDATE RepairRequest SET deviceId = ?, reportedProblem = ?, technicianReport = ?, status = ?, customerId = ?, branchId = ?, technicianId = ?, quotationId = ?, invoiceId = ?, deviceBatchId = ?, attachments = ?, customFields = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, JSON.stringify(attachments), JSON.stringify(customFields), id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Repair request not found or already deleted');
    }
    res.json({ message: 'Repair request updated successfully' });
  } catch (err) {
    console.error(`Error updating repair request with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Soft delete a repair request
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM RepairRequest WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Repair request not found');
    }
    res.json({ message: 'Repair request deleted successfully' });
  } catch (err) {
    console.error(`Error deleting repair request with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
