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
    
    // Log technician information for debugging
    console.log('🔍 Repair Request Services Query Result:', {
      repairRequestId: repairRequestId || 'all',
      count: rows.length,
      services: rows.map(r => ({
        id: r.id,
        serviceId: r.serviceId,
        serviceName: r.serviceName,
        technicianId: r.technicianId,
        technicianName: r.technicianName
      }))
    });
    
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
  const { repairRequestId, serviceId, technicianId, price, notes, finalPrice } = req.body;
  
  // Get existing service to use current values if not provided
  try {
    // Check if deletedAt column exists before using it
    let existingQuery = 'SELECT * FROM RepairRequestService WHERE id = ?';
    try {
      const [checkResult] = await db.execute(
        "SELECT COUNT(*) as count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'RepairRequestService' AND COLUMN_NAME = 'deletedAt'"
      );
      if (checkResult[0].count > 0) {
        existingQuery += ' AND (deletedAt IS NULL OR deletedAt = "")';
      }
    } catch (e) {
      // Column doesn't exist, use basic query
    }
    
    const [existing] = await db.execute(existingQuery, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Repair request service not found or deleted' });
    }
    
    const current = existing[0];
    const updateRepairRequestId = repairRequestId !== undefined ? repairRequestId : current.repairRequestId;
    const updateServiceId = serviceId !== undefined ? serviceId : current.serviceId;
    const updateTechnicianId = technicianId !== undefined ? technicianId : current.technicianId;
    const updatePrice = price !== undefined ? price : current.price;
    const updateFinalPrice = finalPrice !== undefined ? finalPrice : (current.finalPrice || current.price);
    const updateNotes = notes !== undefined ? notes : current.notes;
    
    if (!updateRepairRequestId || updatePrice === undefined) {
      return res.status(400).json({ 
        success: false,
        error: 'repairRequestId and price are required' 
      });
    }
    // Note: serviceId يمكن أن يكون null للخدمات اليدوية
    
    // Build UPDATE query - include finalPrice if it exists in table
    // Always include technicianId to ensure it gets updated (even if null)
    let updateQuery = 'UPDATE RepairRequestService SET repairRequestId = ?, serviceId = ?, technicianId = ?, price = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP';
    const updateParams = [updateRepairRequestId, updateServiceId, updateTechnicianId, updatePrice, updateNotes];
    
    // Check if finalPrice column exists and add it if provided
    try {
      const [finalPriceCheck] = await db.execute(
        "SELECT COUNT(*) as count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'RepairRequestService' AND COLUMN_NAME = 'finalPrice'"
      );
      if (finalPriceCheck[0].count > 0 && updateFinalPrice !== undefined) {
        updateQuery += ', finalPrice = ?';
        updateParams.push(updateFinalPrice);
      }
    } catch (e) {
      // Column doesn't exist, skip
    }
    
    // Check if deletedAt exists for WHERE clause
    let whereClause = ' WHERE id = ?';
    try {
      const [checkResult] = await db.execute(
        "SELECT COUNT(*) as count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'RepairRequestService' AND COLUMN_NAME = 'deletedAt'"
      );
      if (checkResult[0].count > 0) {
        whereClause += ' AND (deletedAt IS NULL OR deletedAt = "")';
      }
    } catch (e) {
      // Column doesn't exist, use basic WHERE
    }
    
    updateQuery += whereClause;
    updateParams.push(id);
    
    const [result] = await db.execute(updateQuery, updateParams);
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
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // First, get the repair request service details before deleting
    let getServiceQuery = 'SELECT * FROM RepairRequestService WHERE id = ?';
    try {
      const [checkResult] = await connection.execute(
        "SELECT COUNT(*) as count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'RepairRequestService' AND COLUMN_NAME = 'deletedAt'"
      );
      if (checkResult[0].count > 0) {
        getServiceQuery += ' AND (deletedAt IS NULL OR deletedAt = "")';
      }
    } catch (e) {
      // Column doesn't exist, use basic query
    }
    
    const [serviceRows] = await connection.execute(getServiceQuery, [id]);
    
    if (serviceRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Repair request service not found or already deleted' });
    }
    
    const service = serviceRows[0];
    const { serviceId, repairRequestId } = service;
    
    // Check if this service exists in any invoice items
    // Find invoices linked to this repair request
    if (serviceId && repairRequestId) {
      const [invoices] = await connection.execute(`
        SELECT id FROM Invoice 
        WHERE repairRequestId = ? AND deletedAt IS NULL
      `, [repairRequestId]);
      
      // For each invoice, check if there are invoice items with this serviceId
      for (const invoice of invoices) {
        const [invoiceItems] = await connection.execute(`
          SELECT id FROM InvoiceItem 
          WHERE invoiceId = ? AND serviceId = ?
        `, [invoice.id, serviceId]);
        
        // Delete all invoice items with this serviceId
        if (invoiceItems.length > 0) {
          await connection.execute(`
            DELETE FROM InvoiceItem 
            WHERE invoiceId = ? AND serviceId = ?
          `, [invoice.id, serviceId]);
          
          // Recalculate invoice total
          const [totalResult] = await connection.execute(`
            SELECT COALESCE(SUM(quantity * unitPrice), 0) as calculatedTotal
            FROM InvoiceItem WHERE invoiceId = ?
          `, [invoice.id]);
          
          const newTotal = Number(totalResult[0].calculatedTotal);
          
          await connection.execute(`
            UPDATE Invoice SET totalAmount = ?, updatedAt = NOW() WHERE id = ?
          `, [newTotal, invoice.id]);
          
          console.log(`Deleted ${invoiceItems.length} invoice item(s) from invoice ${invoice.id} and updated total to ${newTotal}`);
        }
      }
    }
    
    // Now delete the repair request service
    // Check if RepairRequestService table has deletedAt column
    const [checkResult] = await connection.execute(
      "SELECT COUNT(*) as count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'RepairRequestService' AND COLUMN_NAME = 'deletedAt'"
    );
    
    if (checkResult[0].count > 0) {
      // Use soft delete
      const [result] = await connection.execute(
        'UPDATE RepairRequestService SET deletedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL',
        [id]
      );
      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Repair request service not found or already deleted' });
      }
    } else {
      // Hard delete (table doesn't have deletedAt column yet)
      const [result] = await connection.execute('DELETE FROM RepairRequestService WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Repair request service not found' });
      }
    }
    
    await connection.commit();
    res.json({ success: true, message: 'Repair request service deleted successfully' });
  } catch (err) {
    await connection.rollback();
    console.error(`Error deleting repair request service with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
