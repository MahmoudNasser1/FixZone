const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, quotationSchemas } = require('../middleware/validation');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all quotations
router.get('/', validate(quotationSchemas.getQuotations, 'query'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, repairRequestId, q, sort = 'createdAt', sortDir = 'DESC', dateFrom, dateTo } = req.query;
    
    // Check if deletedAt column exists
    const [columnCheck] = await db.execute(
      `SELECT COUNT(*) as col_exists FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = 'FZ' AND TABLE_NAME = 'Quotation' AND COLUMN_NAME = 'deletedAt'`
    );
    
    const hasDeletedAt = columnCheck[0].col_exists > 0;
    let whereClause = hasDeletedAt ? 'WHERE q.deletedAt IS NULL' : 'WHERE 1=1';
    const queryParams = [];
    
    if (status) {
      whereClause += ' AND q.status = ?';
      queryParams.push(status);
    }
    
    if (repairRequestId) {
      whereClause += ' AND q.repairRequestId = ?';
      queryParams.push(repairRequestId);
    }
    
    if (dateFrom) {
      whereClause += ' AND DATE(q.createdAt) >= ?';
      queryParams.push(dateFrom);
    }
    
    if (dateTo) {
      whereClause += ' AND DATE(q.createdAt) <= ?';
      queryParams.push(dateTo);
    }
    
    if (q) {
      whereClause += ' AND (q.notes LIKE ? OR c.name LIKE ?)';
      const searchTerm = `%${q}%`;
      queryParams.push(searchTerm, searchTerm);
    }
    
    const offset = (page - 1) * limit;
    const validSortFields = ['id', 'status', 'totalAmount', 'taxAmount', 'createdAt', 'updatedAt', 'sentAt', 'responseAt'];
    const sortField = validSortFields.includes(sort) ? sort : 'createdAt';
    const sortDirection = sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM Quotation q
      LEFT JOIN RepairRequest rr ON q.repairRequestId = rr.id
      ${whereClause}
    `;
    const [countResult] = await db.execute(countQuery, queryParams);
    const total = countResult[0].total;
    
    // Get quotations with pagination
    // Note: Cannot use parameterized query for ORDER BY field name, but we validate it
    const query = `
      SELECT 
        q.*,
        c.name as customerName,
        rr.trackingToken,
        d.deviceType,
        COALESCE(vo.label, d.brand) as deviceBrand,
        d.model as deviceModel
      FROM Quotation q
      LEFT JOIN RepairRequest rr ON q.repairRequestId = rr.id
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN Device d ON rr.deviceId = d.id
      LEFT JOIN VariableOption vo ON d.brandId = vo.id
      ${whereClause}
      ORDER BY q.${sortField} ${sortDirection}
      LIMIT ? OFFSET ?
    `;
    
    queryParams.push(parseInt(limit), parseInt(offset));
    // CRITICAL: Use db.query instead of db.execute for queries with LIMIT/OFFSET
    // db.execute uses prepared statements which cause issues with LIMIT/OFFSET in MariaDB strict mode
    // db.query interpolates values directly and works perfectly with LIMIT/OFFSET
    const [rows] = await db.query(query, queryParams);
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching quotations:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Get quotation by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if deletedAt column exists
    const [columnCheck] = await db.execute(
      `SELECT COUNT(*) as col_exists FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = 'FZ' AND TABLE_NAME = 'Quotation' AND COLUMN_NAME = 'deletedAt'`
    );
    
    const hasDeletedAt = columnCheck[0].col_exists > 0;
    const whereClause = hasDeletedAt 
      ? 'WHERE q.id = ? AND q.deletedAt IS NULL'
      : 'WHERE q.id = ?';
    
    const [rows] = await db.execute(
      `SELECT 
        q.*,
        c.name as customerName,
        rr.trackingToken,
        d.deviceType,
        COALESCE(vo.label, d.brand) as deviceBrand,
        d.model as deviceModel,
        rr.reportedProblem as issueDescription
      FROM Quotation q
      LEFT JOIN RepairRequest rr ON q.repairRequestId = rr.id
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN Device d ON rr.deviceId = d.id
      LEFT JOIN VariableOption vo ON d.brandId = vo.id
      ${whereClause}`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }
    
    // Get quotation items
    const [items] = await db.execute(
      'SELECT * FROM QuotationItem WHERE quotationId = ? ORDER BY id ASC',
      [id]
    );
    
    res.json({
      success: true,
      data: {
        ...rows[0],
        items: items || []
      }
    });
  } catch (err) {
    console.error(`Error fetching quotation with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Create a new quotation
router.post('/', validate(quotationSchemas.createQuotation, 'body'), async (req, res) => {
  const { status, totalAmount, taxAmount, notes, sentAt, responseAt, repairRequestId, currency } = req.body;
  
  try {
    // Check if deletedAt column exists
    const [columnCheck] = await db.execute(
      `SELECT COUNT(*) as col_exists FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = 'FZ' AND TABLE_NAME = 'Quotation' AND COLUMN_NAME = 'deletedAt'`
    );
    
    const hasDeletedAt = columnCheck[0].col_exists > 0;
    const whereClause = hasDeletedAt
      ? 'WHERE repairRequestId = ? AND deletedAt IS NULL'
      : 'WHERE repairRequestId = ?';
    
    // Check if quotation already exists for this repair request
    const [existing] = await db.execute(
      `SELECT id FROM Quotation ${whereClause}`,
      [repairRequestId]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Quotation already exists for this repair request',
        quotationId: existing[0].id
      });
    }
    
    // Verify repair request exists
    const [repairCheck] = await db.execute(
      'SELECT id FROM RepairRequest WHERE id = ?',
      [repairRequestId]
    );
    
    if (repairCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Repair request not found'
      });
    }
    
    const [result] = await db.execute(
      'INSERT INTO Quotation (status, totalAmount, taxAmount, notes, sentAt, responseAt, repairRequestId, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [status || 'PENDING', totalAmount, taxAmount || 0, notes || null, sentAt || null, responseAt || null, repairRequestId, currency || 'EGP']
    );
    
    // Get created quotation with join
    const [created] = await db.execute(
      `SELECT 
        q.*,
        c.name as customerName,
        rr.trackingToken
      FROM Quotation q
      LEFT JOIN RepairRequest rr ON q.repairRequestId = rr.id
      LEFT JOIN Customer c ON rr.customerId = c.id
      WHERE q.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      data: created[0]
    });
  } catch (err) {
    console.error('Error creating quotation:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Update a quotation
router.put('/:id', validate(quotationSchemas.updateQuotation, 'body'), async (req, res) => {
  const { id } = req.params;
  const { status, totalAmount, taxAmount, notes, sentAt, responseAt, repairRequestId, currency } = req.body;
  
  try {
    // Check if deletedAt column exists
    const [columnCheck] = await db.execute(
      `SELECT COUNT(*) as col_exists FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = 'FZ' AND TABLE_NAME = 'Quotation' AND COLUMN_NAME = 'deletedAt'`
    );
    
    const hasDeletedAt = columnCheck[0].col_exists > 0;
    const whereClause = hasDeletedAt
      ? 'WHERE id = ? AND deletedAt IS NULL'
      : 'WHERE id = ?';
    
    // Check if quotation exists
    const [existing] = await db.execute(
      `SELECT id FROM Quotation ${whereClause}`,
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
    }
    
    // Build update query dynamically
    const updates = [];
    const params = [];
    
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (totalAmount !== undefined) {
      updates.push('totalAmount = ?');
      params.push(totalAmount);
    }
    if (taxAmount !== undefined) {
      updates.push('taxAmount = ?');
      params.push(taxAmount);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }
    if (sentAt !== undefined) {
      updates.push('sentAt = ?');
      params.push(sentAt);
    }
    if (responseAt !== undefined) {
      updates.push('responseAt = ?');
      params.push(responseAt);
    }
    if (repairRequestId !== undefined) {
      // Check if repair request exists
      const [repairCheck] = await db.execute(
        'SELECT id FROM RepairRequest WHERE id = ?',
        [repairRequestId]
      );
      
      if (repairCheck.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Repair request not found'
        });
      }
      
      // Check for duplicate quotation (excluding current one)
      const duplicateWhereClause = hasDeletedAt
        ? 'WHERE repairRequestId = ? AND id != ? AND deletedAt IS NULL'
        : 'WHERE repairRequestId = ? AND id != ?';
      
      const [duplicate] = await db.execute(
        `SELECT id FROM Quotation ${duplicateWhereClause}`,
        [repairRequestId, id]
      );
      
      if (duplicate.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Quotation already exists for this repair request',
          quotationId: duplicate[0].id
        });
      }
      
      updates.push('repairRequestId = ?');
      params.push(repairRequestId);
    }
    if (currency !== undefined) {
      updates.push('currency = ?');
      params.push(currency);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }
    
    updates.push('updatedAt = CURRENT_TIMESTAMP');
    params.push(id);
    
    await db.execute(
      `UPDATE Quotation SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    // Get updated quotation
    const [updated] = await db.execute(
      `SELECT 
        q.*,
        c.name as customerName,
        rr.trackingToken
      FROM Quotation q
      LEFT JOIN RepairRequest rr ON q.repairRequestId = rr.id
      LEFT JOIN Customer c ON rr.customerId = c.id
      WHERE q.id = ?`,
      [id]
    );
    
    res.json({
      success: true,
      data: updated[0]
    });
  } catch (err) {
    console.error(`Error updating quotation with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Delete a quotation (soft delete)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if deletedAt column exists
    const [columnCheck] = await db.execute(
      `SELECT COUNT(*) as col_exists FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = 'FZ' AND TABLE_NAME = 'Quotation' AND COLUMN_NAME = 'deletedAt'`
    );
    
    const hasDeletedAt = columnCheck[0].col_exists > 0;
    
    let result;
    if (hasDeletedAt) {
      // Soft delete
      [result] = await db.execute(
        'UPDATE Quotation SET deletedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL',
        [id]
      );
    } else {
      // Hard delete (fallback if deletedAt doesn't exist)
      [result] = await db.execute(
        'DELETE FROM Quotation WHERE id = ?',
        [id]
      );
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Quotation deleted successfully'
    });
  } catch (err) {
    console.error(`Error deleting quotation with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

module.exports = router;
