const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all inspection reports
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM InspectionReport');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching inspection reports:', err);
    res.status(500).send('Server Error');
  }
});

// Get inspection report by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM InspectionReport WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Inspection report not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching inspection report with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new inspection report
router.post('/', async (req, res) => {
  const { repairRequestId, inspectionTypeId, technicianId, summary, result, recommendations, notes, reportDate, branchId, invoiceLink, qrCode, attachments } = req.body;
  if (!repairRequestId || !inspectionTypeId || !technicianId || !reportDate) {
    return res.status(400).send('repairRequestId, inspectionTypeId, technicianId, and reportDate are required');
  }
  try {
    const [resultQuery] = await db.query(
      'INSERT INTO InspectionReport (repairRequestId, inspectionTypeId, technicianId, summary, result, recommendations, notes, reportDate, branchId, invoiceLink, qrCode, attachments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [repairRequestId, inspectionTypeId, technicianId, summary, result, recommendations, notes, reportDate, branchId, invoiceLink, qrCode, attachments]
    );
    res.status(201).json({ id: resultQuery.insertId, repairRequestId, inspectionTypeId, technicianId, summary, result, recommendations, notes, reportDate, branchId, invoiceLink, qrCode, attachments });
  } catch (err) {
    console.error('Error creating inspection report:', err);
    res.status(500).send('Server Error');
  }
});

// Update an inspection report
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { repairRequestId, inspectionTypeId, technicianId, summary, result, recommendations, notes, reportDate, branchId, invoiceLink, qrCode, attachments } = req.body;
  if (!repairRequestId || !inspectionTypeId || !technicianId || !reportDate) {
    return res.status(400).send('repairRequestId, inspectionTypeId, technicianId, and reportDate are required');
  }
  try {
    const [resultQuery] = await db.query(
      'UPDATE InspectionReport SET repairRequestId = ?, inspectionTypeId = ?, technicianId = ?, summary = ?, result = ?, recommendations = ?, notes = ?, reportDate = ?, branchId = ?, invoiceLink = ?, qrCode = ?, attachments = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [repairRequestId, inspectionTypeId, technicianId, summary, result, recommendations, notes, reportDate, branchId, invoiceLink, qrCode, attachments, id]
    );
    if (resultQuery.affectedRows === 0) {
      return res.status(404).send('Inspection report not found');
    }
    res.json({ message: 'Inspection report updated successfully' });
  } catch (err) {
    console.error(`Error updating inspection report with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Hard delete an inspection report
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM InspectionReport WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Inspection report not found');
    }
    res.json({ message: 'Inspection report deleted successfully' });
  } catch (err) {
    console.error(`Error deleting inspection report with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
