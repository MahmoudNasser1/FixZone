const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(authMiddleware);

// Get all expenses (excluding soft-deleted ones) with filters and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      categoryId, 
      vendorId, 
      invoiceId,
      dateFrom, 
      dateTo,
      page = 1,
      limit = 50
    } = req.query;
    
    let whereClause = 'WHERE e.deletedAt IS NULL';
    const queryParams = [];
    
    if (categoryId) {
      whereClause += ' AND e.categoryId = ?';
      queryParams.push(categoryId);
    }
    
    if (vendorId) {
      whereClause += ' AND e.vendorId = ?';
      queryParams.push(vendorId);
    }
    
    if (invoiceId) {
      whereClause += ' AND e.invoiceId = ?';
      queryParams.push(invoiceId);
    }
    
    if (dateFrom) {
      whereClause += ' AND e.expenseDate >= ?';
      queryParams.push(dateFrom);
    }
    
    if (dateTo) {
      whereClause += ' AND e.expenseDate <= ?';
      queryParams.push(dateTo);
    }
    
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT 
        e.*,
        ec.name as categoryName,
        v.name as vendorName,
        i.id as invoiceNumber,
        u.name as createdByName
      FROM Expense e
      LEFT JOIN ExpenseCategory ec ON e.categoryId = ec.id
      LEFT JOIN Vendor v ON e.vendorId = v.id
      LEFT JOIN Invoice i ON e.invoiceId = i.id
      LEFT JOIN User u ON e.createdBy = u.id
      ${whereClause}
      ORDER BY e.expenseDate DESC, e.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const [rows] = await db.query(query, queryParams);
    
    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM Expense e ${whereClause}`,
      queryParams.slice(0, -2)
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
    const [rows] = await db.query(`
      SELECT 
        e.*,
        ec.name as categoryName,
        v.name as vendorName,
        i.id as invoiceNumber,
        u.name as createdByName
      FROM Expense e
      LEFT JOIN ExpenseCategory ec ON e.categoryId = ec.id
      LEFT JOIN Vendor v ON e.vendorId = v.id
      LEFT JOIN Invoice i ON e.invoiceId = i.id
      LEFT JOIN User u ON e.createdBy = u.id
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
router.post('/', async (req, res) => {
  try {
    const { 
      categoryId, 
      vendorId, 
      amount, 
      description, 
      expenseDate, 
      invoiceId, 
      receiptUrl, 
      notes 
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
    
    const [result] = await db.execute(
      `INSERT INTO Expense 
       (categoryId, vendorId, amount, description, expenseDate, invoiceId, receiptUrl, notes, createdBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [categoryId, vendorId || null, amount, description || null, expenseDate, invoiceId || null, receiptUrl || null, notes || null, req.user.id]
    );
    
    const [expense] = await db.query(`
      SELECT 
        e.*,
        ec.name as categoryName,
        v.name as vendorName,
        u.name as createdByName
      FROM Expense e
      LEFT JOIN ExpenseCategory ec ON e.categoryId = ec.id
      LEFT JOIN Vendor v ON e.vendorId = v.id
      LEFT JOIN User u ON e.createdBy = u.id
      WHERE e.id = ?
    `, [result.insertId]);
    
    res.status(201).json({ success: true, data: expense[0] });
  } catch (err) {
    console.error('Error creating expense:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Update an expense
router.put('/:id', async (req, res) => {
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
      notes 
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
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    
    updates.push('updatedAt = NOW()');
    values.push(id);
    
    await db.execute(
      `UPDATE Expense SET ${updates.join(', ')} WHERE id = ? AND deletedAt IS NULL`,
      values
    );
    
    const [expense] = await db.query(`
      SELECT 
        e.*,
        ec.name as categoryName,
        v.name as vendorName,
        u.name as createdByName
      FROM Expense e
      LEFT JOIN ExpenseCategory ec ON e.categoryId = ec.id
      LEFT JOIN Vendor v ON e.vendorId = v.id
      LEFT JOIN User u ON e.createdBy = u.id
      WHERE e.id = ?
    `, [id]);
    
    res.json({ success: true, data: expense[0] });
  } catch (err) {
    console.error(`Error updating expense with ID ${id}:`, err);
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
    const { dateFrom, dateTo, categoryId } = req.query;
    
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
    
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as totalExpenses,
        COALESCE(SUM(e.amount), 0) as totalAmount,
        COALESCE(AVG(e.amount), 0) as averageAmount,
        MIN(e.expenseDate) as firstExpenseDate,
        MAX(e.expenseDate) as lastExpenseDate
      FROM Expense e
      ${whereClause}
    `, queryParams);
    
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
    
    res.json({
      success: true,
      data: {
        summary: stats[0],
        byCategory: categoryStats
      }
    });
  } catch (err) {
    console.error('Error fetching expense stats:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

module.exports = router;

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
    const [rows] = await db.query(`
      SELECT 
        e.*,
        ec.name as categoryName,
        v.name as vendorName,
        i.id as invoiceNumber,
        u.name as createdByName
      FROM Expense e
      LEFT JOIN ExpenseCategory ec ON e.categoryId = ec.id
      LEFT JOIN Vendor v ON e.vendorId = v.id
      LEFT JOIN Invoice i ON e.invoiceId = i.id
      LEFT JOIN User u ON e.createdBy = u.id
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
router.post('/', async (req, res) => {
  try {
    const { 
      categoryId, 
      vendorId, 
      amount, 
      description, 
      expenseDate, 
      invoiceId, 
      receiptUrl, 
      notes 
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
    
    const [result] = await db.execute(
      `INSERT INTO Expense 
       (categoryId, vendorId, amount, description, expenseDate, invoiceId, receiptUrl, notes, createdBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [categoryId, vendorId || null, amount, description || null, expenseDate, invoiceId || null, receiptUrl || null, notes || null, req.user.id]
    );
    
    const [expense] = await db.query(`
      SELECT 
        e.*,
        ec.name as categoryName,
        v.name as vendorName,
        u.name as createdByName
      FROM Expense e
      LEFT JOIN ExpenseCategory ec ON e.categoryId = ec.id
      LEFT JOIN Vendor v ON e.vendorId = v.id
      LEFT JOIN User u ON e.createdBy = u.id
      WHERE e.id = ?
    `, [result.insertId]);
    
    res.status(201).json({ success: true, data: expense[0] });
  } catch (err) {
    console.error('Error creating expense:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Update an expense
router.put('/:id', async (req, res) => {
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
      notes 
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
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    
    updates.push('updatedAt = NOW()');
    values.push(id);
    
    await db.execute(
      `UPDATE Expense SET ${updates.join(', ')} WHERE id = ? AND deletedAt IS NULL`,
      values
    );
    
    const [expense] = await db.query(`
      SELECT 
        e.*,
        ec.name as categoryName,
        v.name as vendorName,
        u.name as createdByName
      FROM Expense e
      LEFT JOIN ExpenseCategory ec ON e.categoryId = ec.id
      LEFT JOIN Vendor v ON e.vendorId = v.id
      LEFT JOIN User u ON e.createdBy = u.id
      WHERE e.id = ?
    `, [id]);
    
    res.json({ success: true, data: expense[0] });
  } catch (err) {
    console.error(`Error updating expense with ID ${id}:`, err);
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
    const { dateFrom, dateTo, categoryId } = req.query;
    
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
    
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as totalExpenses,
        COALESCE(SUM(e.amount), 0) as totalAmount,
        COALESCE(AVG(e.amount), 0) as averageAmount,
        MIN(e.expenseDate) as firstExpenseDate,
        MAX(e.expenseDate) as lastExpenseDate
      FROM Expense e
      ${whereClause}
    `, queryParams);
    
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
    
    res.json({
      success: true,
      data: {
        summary: stats[0],
        byCategory: categoryStats
      }
    });
  } catch (err) {
    console.error('Error fetching expense stats:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

module.exports = router;

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
    const [rows] = await db.query(`
      SELECT 
        e.*,
        ec.name as categoryName,
        v.name as vendorName,
        i.id as invoiceNumber,
        u.name as createdByName
      FROM Expense e
      LEFT JOIN ExpenseCategory ec ON e.categoryId = ec.id
      LEFT JOIN Vendor v ON e.vendorId = v.id
      LEFT JOIN Invoice i ON e.invoiceId = i.id
      LEFT JOIN User u ON e.createdBy = u.id
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
router.post('/', async (req, res) => {
  try {
    const { 
      categoryId, 
      vendorId, 
      amount, 
      description, 
      expenseDate, 
      invoiceId, 
      receiptUrl, 
      notes 
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
    
    const [result] = await db.execute(
      `INSERT INTO Expense 
       (categoryId, vendorId, amount, description, expenseDate, invoiceId, receiptUrl, notes, createdBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [categoryId, vendorId || null, amount, description || null, expenseDate, invoiceId || null, receiptUrl || null, notes || null, req.user.id]
    );
    
    const [expense] = await db.query(`
      SELECT 
        e.*,
        ec.name as categoryName,
        v.name as vendorName,
        u.name as createdByName
      FROM Expense e
      LEFT JOIN ExpenseCategory ec ON e.categoryId = ec.id
      LEFT JOIN Vendor v ON e.vendorId = v.id
      LEFT JOIN User u ON e.createdBy = u.id
      WHERE e.id = ?
    `, [result.insertId]);
    
    res.status(201).json({ success: true, data: expense[0] });
  } catch (err) {
    console.error('Error creating expense:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Update an expense
router.put('/:id', async (req, res) => {
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
      notes 
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
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    
    updates.push('updatedAt = NOW()');
    values.push(id);
    
    await db.execute(
      `UPDATE Expense SET ${updates.join(', ')} WHERE id = ? AND deletedAt IS NULL`,
      values
    );
    
    const [expense] = await db.query(`
      SELECT 
        e.*,
        ec.name as categoryName,
        v.name as vendorName,
        u.name as createdByName
      FROM Expense e
      LEFT JOIN ExpenseCategory ec ON e.categoryId = ec.id
      LEFT JOIN Vendor v ON e.vendorId = v.id
      LEFT JOIN User u ON e.createdBy = u.id
      WHERE e.id = ?
    `, [id]);
    
    res.json({ success: true, data: expense[0] });
  } catch (err) {
    console.error(`Error updating expense with ID ${id}:`, err);
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
    const { dateFrom, dateTo, categoryId } = req.query;
    
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
    
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as totalExpenses,
        COALESCE(SUM(e.amount), 0) as totalAmount,
        COALESCE(AVG(e.amount), 0) as averageAmount,
        MIN(e.expenseDate) as firstExpenseDate,
        MAX(e.expenseDate) as lastExpenseDate
      FROM Expense e
      ${whereClause}
    `, queryParams);
    
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
    
    res.json({
      success: true,
      data: {
        summary: stats[0],
        byCategory: categoryStats
      }
    });
  } catch (err) {
    console.error('Error fetching expense stats:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

module.exports = router;
