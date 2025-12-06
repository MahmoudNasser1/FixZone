const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, expenseSchemas } = require('../middleware/validation');

// Apply authentication to all routes
router.use(authMiddleware);

// Get all expenses (excluding soft-deleted ones) with filters and pagination
router.get('/', validate(expenseSchemas.getExpenses, 'query'), async (req, res) => {
  try {
    const { 
      categoryId, 
      vendorId, 
      invoiceId,
      repairId,
      branchId,
      dateFrom, 
      dateTo,
      q, // search query
      page = 1,
      limit = 50
    } = req.query;
    
    // First, check which columns exist in the Expense table
    let hasVendorId = false;
    let hasInvoiceId = false;
    let hasRepairId = false;
    let hasBranchId = false;
    let userColumnName = 'createdBy'; // default
    try {
      const [colCheck] = await db.query(`
        SELECT COUNT(*) as exists FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'Expense' 
        AND COLUMN_NAME = 'vendorId'
      `);
      hasVendorId = colCheck[0].exists > 0;
      
      const [invoiceColCheck] = await db.query(`
        SELECT COUNT(*) as exists FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'Expense' 
        AND COLUMN_NAME = 'invoiceId'
      `);
      hasInvoiceId = invoiceColCheck[0].exists > 0;
      
      const [repairColCheck] = await db.query(`
        SELECT COUNT(*) as exists FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'Expense' 
        AND COLUMN_NAME = 'repairId'
      `);
      hasRepairId = repairColCheck[0].exists > 0;
      
      const [branchColCheck] = await db.query(`
        SELECT COUNT(*) as exists FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'Expense' 
        AND COLUMN_NAME = 'branchId'
      `);
      hasBranchId = branchColCheck[0].exists > 0;
      
      // Check which user column exists (prefer createdBy, fallback to userId)
      const [createdByCheck] = await db.query(`
        SELECT COUNT(*) as exists FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'Expense' 
        AND COLUMN_NAME = 'createdBy'
      `);
      if (createdByCheck[0].exists > 0) {
        userColumnName = 'createdBy';
      } else {
        const [userColCheck] = await db.query(`
          SELECT COUNT(*) as exists FROM information_schema.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'Expense' 
          AND COLUMN_NAME = 'userId'
        `);
        if (userColCheck[0].exists > 0) {
          userColumnName = 'userId';
        }
      }
    } catch (err) {
      console.warn('Could not check Expense table columns:', err.message);
    }
    
    // Build where clause and params based on available columns
    let whereClause = 'WHERE e.deletedAt IS NULL';
    const queryParams = [];
    const countParams = [];
    
    if (categoryId) {
      whereClause += ' AND e.categoryId = ?';
      queryParams.push(categoryId);
      countParams.push(categoryId);
    }
    
    // Only add vendorId filter if column exists
    if (vendorId && hasVendorId) {
      whereClause += ' AND e.vendorId = ?';
      queryParams.push(vendorId);
      countParams.push(vendorId);
    }
    
    // Only add invoiceId filter if column exists
    if (invoiceId && hasInvoiceId) {
      whereClause += ' AND e.invoiceId = ?';
      queryParams.push(invoiceId);
      countParams.push(invoiceId);
    }
    
    // Only add repairId filter if column exists
    if (repairId && hasRepairId) {
      whereClause += ' AND e.repairId = ?';
      queryParams.push(repairId);
      countParams.push(repairId);
    }
    
    // Only add branchId filter if column exists
    if (branchId && hasBranchId) {
      whereClause += ' AND e.branchId = ?';
      queryParams.push(branchId);
      countParams.push(branchId);
    }
    
    // Search query (description, notes)
    if (q && q.trim()) {
      whereClause += ' AND (e.description LIKE ? OR e.notes LIKE ?)';
      const searchTerm = `%${q.trim()}%`;
      queryParams.push(searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm);
    }
    
    if (dateFrom) {
      whereClause += ' AND e.expenseDate >= ?';
      queryParams.push(dateFrom);
      countParams.push(dateFrom);
    }
    
    if (dateTo) {
      whereClause += ' AND e.expenseDate <= ?';
      queryParams.push(dateTo);
      countParams.push(dateTo);
    }
    
    const offset = (page - 1) * limit;
    
    // Build query based on available columns
    let query;
    // Determine which joins we need
    const joins = ['LEFT JOIN ExpenseCategory ec ON e.categoryId = ec.id'];
    
    if (hasVendorId) {
      joins.push('LEFT JOIN Vendor v ON e.vendorId = v.id AND v.deletedAt IS NULL');
    }
    if (hasInvoiceId) {
      joins.push('LEFT JOIN Invoice i ON e.invoiceId = i.id AND i.deletedAt IS NULL');
    }
    if (hasRepairId) {
      joins.push('LEFT JOIN RepairRequest rr ON e.repairId = rr.id AND rr.deletedAt IS NULL');
    }
    if (hasBranchId) {
      joins.push('LEFT JOIN Branch b ON e.branchId = b.id AND b.deletedAt IS NULL');
    }
    joins.push(`LEFT JOIN User u ON e.${userColumnName} = u.id`);
    
    // Build SELECT fields
    let selectFields = 'e.*, ec.name as categoryName';
    if (hasVendorId) {
      selectFields += ', v.name as vendorName';
    } else {
      selectFields += ', NULL as vendorName';
    }
    if (hasInvoiceId) {
      selectFields += ', i.id as invoiceNumber';
    } else {
      selectFields += ', NULL as invoiceNumber';
    }
    if (hasRepairId) {
      selectFields += ', rr.id as repairRequestId, rr.trackingToken as repairTrackingToken';
    }
    if (hasBranchId) {
      selectFields += ', b.name as branchName';
    }
    selectFields += ', u.name as createdByName';
    
    query = `
      SELECT 
        ${selectFields}
      FROM Expense e
      ${joins.join('\n')}
      ${whereClause}
      ORDER BY e.expenseDate DESC, e.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const [rows] = await db.query(query, queryParams);
    
    // Get total count (use countParams which doesn't include limit/offset)
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM Expense e ${whereClause}`,
      countParams
    );
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Get expense by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Check which columns exist
    let userColumnName = 'createdBy';
    let hasVendorId = false;
    let hasInvoiceId = false;
    let hasRepairId = false;
    let hasBranchId = false;
    try {
      const [createdByCheck] = await db.query(`
        SELECT COUNT(*) as exists FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'Expense' 
        AND COLUMN_NAME = 'createdBy'
      `);
      if (createdByCheck[0].exists === 0) {
        const [userColCheck] = await db.query(`
          SELECT COUNT(*) as exists FROM information_schema.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'Expense' 
          AND COLUMN_NAME = 'userId'
        `);
        if (userColCheck[0].exists > 0) {
          userColumnName = 'userId';
        }
      }
      
      // Check other columns
      const [vendorCheck] = await db.query(`SELECT COUNT(*) as exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND COLUMN_NAME = 'vendorId'`);
      hasVendorId = vendorCheck[0].exists > 0;
      const [invoiceCheck] = await db.query(`SELECT COUNT(*) as exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND COLUMN_NAME = 'invoiceId'`);
      hasInvoiceId = invoiceCheck[0].exists > 0;
      const [repairCheck] = await db.query(`SELECT COUNT(*) as exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND COLUMN_NAME = 'repairId'`);
      hasRepairId = repairCheck[0].exists > 0;
      const [branchCheck] = await db.query(`SELECT COUNT(*) as exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND COLUMN_NAME = 'branchId'`);
      hasBranchId = branchCheck[0].exists > 0;
    } catch (err) {
      console.warn('Could not check columns:', err.message);
    }
    
    const joins = ['LEFT JOIN ExpenseCategory ec ON e.categoryId = ec.id'];
    let selectFields = 'e.*, ec.name as categoryName';
    
    if (hasVendorId) {
      joins.push('LEFT JOIN Vendor v ON e.vendorId = v.id AND v.deletedAt IS NULL');
      selectFields += ', v.name as vendorName';
    } else {
      selectFields += ', NULL as vendorName';
    }
    if (hasInvoiceId) {
      joins.push('LEFT JOIN Invoice i ON e.invoiceId = i.id AND i.deletedAt IS NULL');
      selectFields += ', i.id as invoiceNumber';
    } else {
      selectFields += ', NULL as invoiceNumber';
    }
    if (hasRepairId) {
      joins.push('LEFT JOIN RepairRequest rr ON e.repairId = rr.id AND rr.deletedAt IS NULL');
      selectFields += ', rr.id as repairRequestId, rr.trackingToken as repairTrackingToken';
    }
    if (hasBranchId) {
      joins.push('LEFT JOIN Branch b ON e.branchId = b.id AND b.deletedAt IS NULL');
      selectFields += ', b.name as branchName';
    }
    joins.push(`LEFT JOIN User u ON e.${userColumnName} = u.id`);
    selectFields += ', u.name as createdByName';
    
    const [rows] = await db.query(`
      SELECT ${selectFields}
      FROM Expense e
      ${joins.join('\n')}
      WHERE e.id = ? AND e.deletedAt IS NULL
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(`Error fetching expense with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Create a new expense
router.post('/', validate(expenseSchemas.createExpense, 'body'), async (req, res) => {
  try {
    const { 
      categoryId, 
      vendorId, 
      amount, 
      description, 
      expenseDate, 
      invoiceId, 
      receiptUrl, 
      notes,
      repairId,
      branchId
    } = req.body;
    
    // Validation
    if (!categoryId || !amount || !expenseDate) {
      return res.status(400).json({
        success: false,
        error: 'categoryId, amount, and expenseDate are required'
      });
    }
    
    // Check if category exists
    const [category] = await db.query(
      'SELECT id FROM ExpenseCategory WHERE id = ?',
      [categoryId]
    );
    if (category.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Expense category not found'
      });
    }
    
    // Check vendor if provided
    if (vendorId) {
      const [vendor] = await db.query(
        'SELECT id FROM Vendor WHERE id = ? AND deletedAt IS NULL',
        [vendorId]
      );
      if (vendor.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Vendor not found'
        });
      }
    }
    
    // Check invoice if provided
    if (invoiceId) {
      const [invoice] = await db.query(
        'SELECT id FROM Invoice WHERE id = ? AND deletedAt IS NULL',
        [invoiceId]
      );
      if (invoice.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invoice not found'
        });
      }
    }
    
    // Check repair if provided
    if (repairId) {
      const [repair] = await db.query(
        'SELECT id FROM RepairRequest WHERE id = ? AND deletedAt IS NULL',
        [repairId]
      );
      if (repair.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Repair request not found'
        });
      }
    }
    
    // Check branch if provided
    if (branchId) {
      const [branch] = await db.query(
        'SELECT id FROM Branch WHERE id = ? AND deletedAt IS NULL',
        [branchId]
      );
      if (branch.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Branch not found'
        });
      }
    }
    
    // Check which columns exist before INSERT
    let hasRepairIdCol = false;
    let hasBranchIdCol = false;
    if (repairId || branchId) {
      try {
        if (repairId) {
          const [repairCheck] = await db.query(`SELECT COUNT(*) as exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND COLUMN_NAME = 'repairId'`);
          hasRepairIdCol = repairCheck[0].exists > 0;
        }
        if (branchId) {
          const [branchCheck] = await db.query(`SELECT COUNT(*) as exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND COLUMN_NAME = 'branchId'`);
          hasBranchIdCol = branchCheck[0].exists > 0;
        }
      } catch (err) {
        console.warn('Could not check columns:', err.message);
      }
    }
    
    // Build INSERT query dynamically
    const insertFields = ['categoryId', 'vendorId', 'amount', 'description', 'expenseDate', 'invoiceId', 'receiptUrl', 'notes', 'createdBy'];
    const insertValues = [categoryId, vendorId || null, amount, description || null, expenseDate, invoiceId || null, receiptUrl || null, notes || null, req.user.id];
    const placeholders = Array(insertFields.length).fill('?').join(', ');
    
    if (hasRepairIdCol && repairId) {
      insertFields.push('repairId');
      insertValues.push(repairId);
    }
    if (hasBranchIdCol && branchId) {
      insertFields.push('branchId');
      insertValues.push(branchId);
    }
    
    const [result] = await db.execute(
      `INSERT INTO Expense (${insertFields.join(', ')}) VALUES (${Array(insertFields.length).fill('?').join(', ')})`,
      insertValues
    );
    
    // Build SELECT query for created expense with all joins
    // Reuse hasRepairIdCol and hasBranchIdCol from above, check for vendorId and invoiceId
    let hasVendorId = false;
    let hasInvoiceId = false;
    try {
      const [vendorCheck] = await db.query(`SELECT COUNT(*) as exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND COLUMN_NAME = 'vendorId'`);
      hasVendorId = vendorCheck[0].exists > 0;
      const [invoiceCheck] = await db.query(`SELECT COUNT(*) as exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND COLUMN_NAME = 'invoiceId'`);
      hasInvoiceId = invoiceCheck[0].exists > 0;
    } catch (err) {
      console.warn('Could not check columns:', err.message);
    }
    
    const joins = [
      'LEFT JOIN ExpenseCategory ec ON e.categoryId = ec.id',
      `LEFT JOIN User u ON e.createdBy = u.id`
    ];
    let selectFields = 'e.*, ec.name as categoryName, u.name as createdByName';
    
    if (hasVendorId) {
      joins.push('LEFT JOIN Vendor v ON e.vendorId = v.id');
      selectFields += ', v.name as vendorName';
    } else {
      selectFields += ', NULL as vendorName';
    }
    if (hasInvoiceId) {
      joins.push('LEFT JOIN Invoice i ON e.invoiceId = i.id');
      selectFields += ', i.id as invoiceNumber';
    }
    if (hasRepairIdCol) {
      joins.push('LEFT JOIN RepairRequest rr ON e.repairId = rr.id');
      selectFields += ', rr.id as repairRequestId, rr.trackingToken as repairTrackingToken';
    }
    if (hasBranchIdCol) {
      joins.push('LEFT JOIN Branch b ON e.branchId = b.id');
      selectFields += ', b.name as branchName';
    }
    
    const [expense] = await db.query(`
      SELECT ${selectFields}
      FROM Expense e
      ${joins.join('\n')}
      WHERE e.id = ?
    `, [result.insertId]);
    
    res.status(201).json({ success: true, data: expense[0] });
  } catch (err) {
    console.error('Error creating expense:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Update an expense
router.put('/:id', validate(expenseSchemas.updateExpense, 'body'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      categoryId, 
      vendorId, 
      amount, 
      description, 
      expenseDate, 
      invoiceId, 
      receiptUrl, 
      notes,
      repairId,
      branchId
    } = req.body;
    
    // Check if expense exists
    const [existing] = await db.query(
      'SELECT id FROM Expense WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    
    if (categoryId !== undefined) {
      updates.push('categoryId = ?');
      values.push(categoryId);
    }
    if (vendorId !== undefined) {
      updates.push('vendorId = ?');
      values.push(vendorId || null);
    }
    if (amount !== undefined) {
      updates.push('amount = ?');
      values.push(amount);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description || null);
    }
    if (expenseDate !== undefined) {
      updates.push('expenseDate = ?');
      values.push(expenseDate);
    }
    if (invoiceId !== undefined) {
      updates.push('invoiceId = ?');
      values.push(invoiceId || null);
    }
    if (receiptUrl !== undefined) {
      updates.push('receiptUrl = ?');
      values.push(receiptUrl || null);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes || null);
    }
    
    // Check if repairId and branchId columns exist before updating
    let hasRepairId = false;
    let hasBranchId = false;
    try {
      const [repairCheck] = await db.query(`SELECT COUNT(*) as exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND COLUMN_NAME = 'repairId'`);
      hasRepairId = repairCheck[0].exists > 0;
      const [branchCheck] = await db.query(`SELECT COUNT(*) as exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND COLUMN_NAME = 'branchId'`);
      hasBranchId = branchCheck[0].exists > 0;
    } catch (err) {
      console.warn('Could not check columns:', err.message);
    }
    
    if (repairId !== undefined && hasRepairId) {
      // Validate repair if provided
      if (repairId !== null) {
        const [repair] = await db.query(
          'SELECT id FROM RepairRequest WHERE id = ? AND deletedAt IS NULL',
          [repairId]
        );
        if (repair.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Repair request not found'
          });
        }
      }
      updates.push('repairId = ?');
      values.push(repairId || null);
    }
    
    if (branchId !== undefined && hasBranchId) {
      // Validate branch if provided
      if (branchId !== null) {
        const [branch] = await db.query(
          'SELECT id FROM Branch WHERE id = ? AND deletedAt IS NULL',
          [branchId]
        );
        if (branch.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Branch not found'
          });
        }
      }
      updates.push('branchId = ?');
      values.push(branchId || null);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    
    updates.push('updatedAt = NOW()');
    values.push(id);
    
    await db.execute(
      `UPDATE Expense SET ${updates.join(', ')} WHERE id = ? AND deletedAt IS NULL`,
      values
    );
    
    // Build SELECT query with all joins
    // Reuse hasRepairId and hasBranchId from above, check for vendorId and invoiceId
    let hasVendorId = false;
    let hasInvoiceId = false;
    try {
      const [vendorCheck] = await db.query(`SELECT COUNT(*) as exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND COLUMN_NAME = 'vendorId'`);
      hasVendorId = vendorCheck[0].exists > 0;
      const [invoiceCheck] = await db.query(`SELECT COUNT(*) as exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND COLUMN_NAME = 'invoiceId'`);
      hasInvoiceId = invoiceCheck[0].exists > 0;
    } catch (err) {
      console.warn('Could not check columns:', err.message);
    }
    
    const joins = [
      'LEFT JOIN ExpenseCategory ec ON e.categoryId = ec.id',
      'LEFT JOIN User u ON e.createdBy = u.id'
    ];
    let selectFields = 'e.*, ec.name as categoryName, u.name as createdByName';
    
    if (hasVendorId) {
      joins.push('LEFT JOIN Vendor v ON e.vendorId = v.id');
      selectFields += ', v.name as vendorName';
    } else {
      selectFields += ', NULL as vendorName';
    }
    if (hasInvoiceId) {
      joins.push('LEFT JOIN Invoice i ON e.invoiceId = i.id');
      selectFields += ', i.id as invoiceNumber';
    }
    if (hasRepairId) {
      joins.push('LEFT JOIN RepairRequest rr ON e.repairId = rr.id');
      selectFields += ', rr.id as repairRequestId, rr.trackingToken as repairTrackingToken';
    }
    if (hasBranchId) {
      joins.push('LEFT JOIN Branch b ON e.branchId = b.id');
      selectFields += ', b.name as branchName';
    }
    
    const [expense] = await db.query(`
      SELECT ${selectFields}
      FROM Expense e
      ${joins.join('\n')}
      WHERE e.id = ?
    `, [id]);
    
    res.json({ success: true, data: expense[0] });
  } catch (err) {
    console.error(`Error updating expense with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Get expenses by repair ID
router.get('/by-repair/:repairId', async (req, res) => {
  try {
    const { repairId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Check if repairId column exists
    let hasRepairId = false;
    let hasVendorId = false;
    try {
      const [repairCheck] = await db.query(`SELECT COUNT(*) as exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND COLUMN_NAME = 'repairId'`);
      hasRepairId = repairCheck[0].exists > 0;
      const [vendorCheck] = await db.query(`SELECT COUNT(*) as exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND COLUMN_NAME = 'vendorId'`);
      hasVendorId = vendorCheck[0].exists > 0;
    } catch (err) {
      console.warn('Could not check columns:', err.message);
    }
    
    if (!hasRepairId) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: parseInt(limit), totalPages: 0 },
        message: 'repairId column not available'
      });
    }
    
    const offset = (page - 1) * limit;
    const whereClause = 'WHERE e.deletedAt IS NULL AND e.repairId = ?';
    
    let userColumnName = 'createdBy';
    try {
      const [createdByCheck] = await db.query(`SELECT COUNT(*) as exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND COLUMN_NAME = 'createdBy'`);
      if (createdByCheck[0].exists === 0) {
        const [userColCheck] = await db.query(`SELECT COUNT(*) as exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND COLUMN_NAME = 'userId'`);
        if (userColCheck[0].exists > 0) {
          userColumnName = 'userId';
        }
      }
    } catch (err) {
      console.warn('Could not check user column:', err.message);
    }
    
    const joins = ['LEFT JOIN ExpenseCategory ec ON e.categoryId = ec.id'];
    let selectFields = 'e.*, ec.name as categoryName';
    
    if (hasVendorId) {
      joins.push('LEFT JOIN Vendor v ON e.vendorId = v.id AND v.deletedAt IS NULL');
      selectFields += ', v.name as vendorName';
    } else {
      selectFields += ', NULL as vendorName';
    }
    
    joins.push(`LEFT JOIN User u ON e.${userColumnName} = u.id`);
    selectFields += ', u.name as createdByName';
    
    // CRITICAL: Interpolate LIMIT/OFFSET directly - db.query with LIMIT ? OFFSET ? as parameters can cause issues in MariaDB strict mode
    const [rows] = await db.query(`
      SELECT ${selectFields}
      FROM Expense e
      ${joins.join('\n')}
      ${whereClause}
      ORDER BY e.expenseDate DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `, [repairId]);
    
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM Expense e ${whereClause}`,
      [repairId]
    );
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching expenses by repair:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Soft delete an expense
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.execute(
      'UPDATE Expense SET deletedAt = NOW() WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }
    
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    console.error(`Error deleting expense with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Get expense statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { dateFrom, dateTo, categoryId, repairId, branchId } = req.query;
    
    let whereClause = 'WHERE e.deletedAt IS NULL';
    const queryParams = [];
    
    if (dateFrom) {
      whereClause += ' AND e.expenseDate >= ?';
      queryParams.push(dateFrom);
    }
    
    if (dateTo) {
      whereClause += ' AND e.expenseDate <= ?';
      queryParams.push(dateTo);
    }
    
    if (categoryId) {
      whereClause += ' AND e.categoryId = ?';
      queryParams.push(categoryId);
    }
    
    // Check if repairId and branchId columns exist
    let hasRepairId = false;
    let hasBranchId = false;
    try {
      const [repairCheck] = await db.query(`SELECT COUNT(*) as exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND COLUMN_NAME = 'repairId'`);
      hasRepairId = repairCheck[0].exists > 0;
      const [branchCheck] = await db.query(`SELECT COUNT(*) as exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND COLUMN_NAME = 'branchId'`);
      hasBranchId = branchCheck[0].exists > 0;
    } catch (err) {
      console.warn('Could not check columns:', err.message);
    }
    
    if (repairId && hasRepairId) {
      whereClause += ' AND e.repairId = ?';
      queryParams.push(repairId);
    }
    if (branchId && hasBranchId) {
      whereClause += ' AND e.branchId = ?';
      queryParams.push(branchId);
    }
    
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as totalExpenses,
        COALESCE(SUM(e.amount), 0) as totalAmount,
        COALESCE(AVG(e.amount), 0) as averageAmount,
        MIN(e.expenseDate) as firstExpenseDate,
        MAX(e.expenseDate) as lastExpenseDate,
        IFNULL(SUM(CASE WHEN DATE(e.expenseDate) = CURDATE() THEN 1 ELSE 0 END), 0) as todayExpenses,
        IFNULL(SUM(CASE WHEN DATE(e.expenseDate) = CURDATE() THEN e.amount ELSE 0 END), 0) as todayAmount,
        IFNULL(SUM(CASE WHEN DATE(e.expenseDate) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END), 0) as weekExpenses,
        IFNULL(SUM(CASE WHEN DATE(e.expenseDate) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN e.amount ELSE 0 END), 0) as weekAmount,
        IFNULL(SUM(CASE WHEN DATE(e.expenseDate) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END), 0) as monthExpenses,
        IFNULL(SUM(CASE WHEN DATE(e.expenseDate) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN e.amount ELSE 0 END), 0) as monthAmount
      FROM Expense e
      ${whereClause}
    `, queryParams);
    
    // Ensure all count fields are numbers, not null
    const rawStats = stats[0] || {};
    
    // Helper to safely convert to number with explicit null handling
    const toInt = (val) => {
      if (val === null || val === undefined) return 0;
      const parsed = parseInt(val);
      return isNaN(parsed) ? 0 : parsed;
    };
    
    const toFloat = (val) => {
      if (val === null || val === undefined) return 0;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    };
    
    // Create formatted stats object
    const formattedStats = {
      totalExpenses: toInt(rawStats.totalExpenses),
      totalAmount: toFloat(rawStats.totalAmount),
      averageAmount: toFloat(rawStats.averageAmount),
      firstExpenseDate: rawStats.firstExpenseDate || null,
      lastExpenseDate: rawStats.lastExpenseDate || null,
      todayExpenses: toInt(rawStats.todayExpenses),
      todayAmount: toFloat(rawStats.todayAmount),
      weekExpenses: toInt(rawStats.weekExpenses),
      weekAmount: toFloat(rawStats.weekAmount),
      monthExpenses: toInt(rawStats.monthExpenses),
      monthAmount: toFloat(rawStats.monthAmount)
    };
    
    // Final safety check: replace any remaining null/undefined with 0
    Object.keys(formattedStats).forEach(key => {
      if (key !== 'firstExpenseDate' && key !== 'lastExpenseDate') {
        if (formattedStats[key] === null || formattedStats[key] === undefined || isNaN(formattedStats[key])) {
          formattedStats[key] = 0;
        }
      }
    });
    
    // Stats by category
    const [categoryStats] = await db.query(`
      SELECT 
        ec.id,
        ec.name as categoryName,
        COUNT(e.id) as count,
        COALESCE(SUM(e.amount), 0) as totalAmount
      FROM ExpenseCategory ec
      LEFT JOIN Expense e ON ec.id = e.categoryId AND e.deletedAt IS NULL
      ${categoryId ? 'WHERE ec.id = ?' : ''}
      GROUP BY ec.id, ec.name
      HAVING count > 0 OR ? = 1
      ORDER BY totalAmount DESC
    `, categoryId ? [categoryId, 0] : [1]);
    
    // Create final stats object - simple null handling
    const finalStats = {
      totalExpenses: Number(formattedStats.totalExpenses) || 0,
      totalAmount: Number(formattedStats.totalAmount) || 0,
      averageAmount: Number(formattedStats.averageAmount) || 0,
      firstExpenseDate: formattedStats.firstExpenseDate || null,
      lastExpenseDate: formattedStats.lastExpenseDate || null,
      todayExpenses: Number(formattedStats.todayExpenses) || 0,
      todayAmount: Number(formattedStats.todayAmount) || 0,
      weekExpenses: Number(formattedStats.weekExpenses) || 0,
      weekAmount: Number(formattedStats.weekAmount) || 0,
      monthExpenses: Number(formattedStats.monthExpenses) || 0,
      monthAmount: Number(formattedStats.monthAmount) || 0
    };
    
    res.json({
      success: true,
      data: {
        summary: finalStats,
        byCategory: categoryStats
      }
    });
  } catch (err) {
    console.error('Error fetching expense stats:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

module.exports = router;
