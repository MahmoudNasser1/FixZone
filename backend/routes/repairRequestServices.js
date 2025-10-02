const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all repair request services
router.get('/', async (req, res) => {
  try {
    const { repairRequestId } = req.query;
    
    // Validate repairRequestId is numeric if provided
    if (repairRequestId && isNaN(parseInt(repairRequestId))) {
      return res.status(400).json({ 
        error: 'Invalid repairRequestId - must be numeric' 
      });
    }
    
    let query = `
      SELECT 
        rrs.*,
        s.serviceName,
        CONCAT(u.firstName, ' ', u.lastName) as technicianName
      FROM RepairRequestService rrs
      LEFT JOIN Service s ON rrs.serviceId = s.id
      LEFT JOIN User u ON rrs.technicianId = u.id
    `;
    
    const params = [];
    if (repairRequestId) {
      query += ' WHERE rrs.repairRequestId = ?';
      params.push(parseInt(repairRequestId));
    }
    
    query += ' ORDER BY rrs.createdAt DESC';
    
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching repair request services:', err);
    res.status(500).json({ 
      error: 'Server Error',
      details: err.message 
    });
  }
});

// Get repair request service by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM RepairRequestService WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Repair request service not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching repair request service with ID ${id}:`, err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

// Create a new repair request service
router.post('/', async (req, res) => {
  const { repairRequestId, serviceId, technicianId, price, notes } = req.body;
  if (!repairRequestId || !serviceId || !technicianId || !price) {
    return res.status(400).json({ error: 'repairRequestId, serviceId, technicianId, and price are required' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO RepairRequestService (repairRequestId, serviceId, technicianId, price, notes) VALUES (?, ?, ?, ?, ?)',
      [repairRequestId, serviceId, technicianId, price, notes]
    );
    res.status(201).json({ id: result.insertId, repairRequestId, serviceId, technicianId, price, notes });
  } catch (err) {
    console.error('Error creating repair request service:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

// Update a repair request service
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { repairRequestId, serviceId, technicianId, price, notes } = req.body;
  if (!repairRequestId || !serviceId || !technicianId || !price) {
    return res.status(400).json({ error: 'repairRequestId, serviceId, technicianId, and price are required' });
  }
  try {
    const [result] = await db.query(
      'UPDATE RepairRequestService SET repairRequestId = ?, serviceId = ?, technicianId = ?, price = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [repairRequestId, serviceId, technicianId, price, notes, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Repair request service not found' });
    }
    res.json({ message: 'Repair request service updated successfully' });
  } catch (err) {
    console.error(`Error updating repair request service with ID ${id}:`, err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

// Hard delete a repair request service
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM RepairRequestService WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Repair request service not found' });
    }
    res.json({ message: 'Repair request service deleted successfully' });
  } catch (err) {
    console.error(`Error deleting repair request service with ID ${id}:`, err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

module.exports = router;
