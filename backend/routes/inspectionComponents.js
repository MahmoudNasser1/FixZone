const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all inspection components or by reportId
router.get('/', async (req, res) => {
  try {
    if (req.query.reportId) {
      const [rows] = await db.query('SELECT * FROM InspectionComponent WHERE inspectionReportId = ?', [req.query.reportId]);
      return res.json(rows);
    }
    const [rows] = await db.query('SELECT * FROM InspectionComponent');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching inspection components:', err);
    res.status(500).send('Server Error');
  }
});

// Get inspection component by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM InspectionComponent WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Inspection component not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching inspection component with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new inspection component
router.post('/', async (req, res) => {
  const { inspectionReportId, name, status, notes, priority, photo } = req.body;
  if (!inspectionReportId || !name || !status) {
    return res.status(400).send('inspectionReportId, name, and status are required');
  }
  try {
    const [result] = await db.query(
      'INSERT INTO InspectionComponent (inspectionReportId, name, status, notes, priority, photo) VALUES (?, ?, ?, ?, ?, ?)',
      [inspectionReportId, name, status, notes, priority, photo]
    );
    res.status(201).json({ id: result.insertId, inspectionReportId, name, status, notes, priority, photo });
  } catch (err) {
    console.error('Error creating inspection component:', err);
    res.status(500).send('Server Error');
  }
});

// Update an inspection component
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { inspectionReportId, name, status, notes, priority, photo } = req.body;
  if (!inspectionReportId || !name || !status) {
    return res.status(400).send('inspectionReportId, name, and status are required');
  }
  try {
    const [result] = await db.query(
      'UPDATE InspectionComponent SET inspectionReportId = ?, name = ?, status = ?, notes = ?, priority = ?, photo = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [inspectionReportId, name, status, notes, priority, photo, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).send('Inspection component not found');
    }
    res.json({ message: 'Inspection component updated successfully' });
  } catch (err) {
    console.error(`Error updating inspection component with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Hard delete an inspection component
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM InspectionComponent WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Inspection component not found');
    }
    res.json({ message: 'Inspection component deleted successfully' });
  } catch (err) {
    console.error(`Error deleting inspection component with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
