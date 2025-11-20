const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, repairRequestServiceSchemas } = require('../middleware/validation');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all repair request services
router.get('/', validate(repairRequestServiceSchemas.getRepairRequestServices, 'query'), async (req, res) => {
  try {
    const { repairRequestId } = req.query;
    
    let query = `
      SELECT 
        rrs.*,
        s.name as serviceName,
        u.name as technicianName,
        ii.id as invoiceItemId,
        ii.invoiceId as linkedInvoiceId
      FROM RepairRequestService rrs
      LEFT JOIN Service s ON rrs.serviceId = s.id
      LEFT JOIN User u ON rrs.technicianId = u.id
      LEFT JOIN InvoiceItem ii ON ii.serviceId = rrs.serviceId AND ii.invoiceId IN (
        SELECT id FROM Invoice WHERE repairRequestId = rrs.repairRequestId
      )
      WHERE 1=1
    `;
    
    const params = [];
    // Check if RepairRequestService has deletedAt column and add filter
    try {
      const [checkResult] = await db.execute(
        "SELECT COUNT(*) as count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'RepairRequestService' AND COLUMN_NAME = 'deletedAt'"
      );
      if (checkResult[0].count > 0) {
        query += ' AND (rrs.deletedAt IS NULL OR rrs.deletedAt = "")';
      }
    } catch (e) {
      // Ignore if check fails
    }
    
    if (repairRequestId) {
      query += ' AND rrs.repairRequestId = ?';
      params.push(parseInt(repairRequestId));
    }
    
    query += ' ORDER BY rrs.createdAt DESC';
    
    const [rows] = await db.execute(query, params);
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
router.get('/:id', validate(repairRequestServiceSchemas.getRepairRequestServiceById, 'params'), async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute('SELECT * FROM RepairRequestService WHERE id = ? AND (deletedAt IS NULL OR deletedAt = "")', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Repair request service not found or deleted' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching repair request service with ID ${id}:`, err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

// Create a new repair request service
router.post('/', validate(repairRequestServiceSchemas.createRepairRequestService), async (req, res) => {
  const { repairRequestId, serviceId, technicianId, price, notes } = req.body;
  try {
    const [result] = await db.execute(
      'INSERT INTO RepairRequestService (repairRequestId, serviceId, technicianId, price, notes) VALUES (?, ?, ?, ?, ?)',
      [repairRequestId, serviceId, technicianId, price, notes]
    );
    res.status(201).json({ success: true, id: result.insertId, repairRequestId, serviceId, technicianId, price, notes });
  } catch (err) {
    console.error('Error creating repair request service:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Update a repair request service
router.put('/:id', validate(repairRequestServiceSchemas.getRepairRequestServiceById, 'params'), validate(repairRequestServiceSchemas.updateRepairRequestService), async (req, res) => {
  const { id } = req.params;
  const { repairRequestId, serviceId, technicianId, price, notes } = req.body;
  
  // Get existing service to use current values if not provided
  try {
    const [existing] = await db.execute('SELECT * FROM RepairRequestService WHERE id = ? AND (deletedAt IS NULL OR deletedAt = "")', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Repair request service not found or deleted' });
    }
    
    const current = existing[0];
    const updateRepairRequestId = repairRequestId !== undefined ? repairRequestId : current.repairRequestId;
    const updateServiceId = serviceId !== undefined ? serviceId : current.serviceId;
    const updateTechnicianId = technicianId !== undefined ? technicianId : current.technicianId;
    const updatePrice = price !== undefined ? price : current.price;
    const updateNotes = notes !== undefined ? notes : current.notes;
    
    if (!updateRepairRequestId || !updateServiceId || !updateTechnicianId || updatePrice === undefined) {
      return res.status(400).json({ 
        success: false,
        error: 'repairRequestId, serviceId, technicianId, and price are required' 
      });
    }
    
    const [result] = await db.execute(
      'UPDATE RepairRequestService SET repairRequestId = ?, serviceId = ?, technicianId = ?, price = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND (deletedAt IS NULL OR deletedAt = "")',
      [updateRepairRequestId, updateServiceId, updateTechnicianId, updatePrice, updateNotes, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Repair request service not found or deleted' });
    }
    res.json({ success: true, message: 'Repair request service updated successfully' });
  } catch (err) {
    console.error(`Error updating repair request service with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Soft delete a repair request service
router.delete('/:id', validate(repairRequestServiceSchemas.deleteRepairRequestService, 'params'), async (req, res) => {
  const { id } = req.params;
  try {
    // Check if RepairRequestService table has deletedAt column
    // If not, we'll use hard delete for now (can be migrated later)
    // For now, check if it exists first
    const [checkResult] = await db.execute(
      "SELECT COUNT(*) as count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'RepairRequestService' AND COLUMN_NAME = 'deletedAt'"
    );
    
    if (checkResult[0].count > 0) {
      // Use soft delete
      const [result] = await db.execute(
        'UPDATE RepairRequestService SET deletedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL',
        [id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Repair request service not found or already deleted' });
      }
    } else {
      // Hard delete (table doesn't have deletedAt column yet)
      const [result] = await db.execute('DELETE FROM RepairRequestService WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Repair request service not found' });
      }
    }
    
    res.json({ success: true, message: 'Repair request service deleted successfully' });
  } catch (err) {
    console.error(`Error deleting repair request service with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

module.exports = router;
