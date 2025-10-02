const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all payments with detailed information
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, dateFrom, dateTo, paymentMethod, customerId, invoiceId } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;
    
    let whereConditions = [];
    let queryParams = [];
    // Always exclude soft-deleted invoices
    whereConditions.push('i.deletedAt IS NULL');
    
    if (dateFrom) {
      whereConditions.push('DATE(p.createdAt) >= ?');
      queryParams.push(dateFrom);
    }
    if (dateTo) {
      whereConditions.push('DATE(p.createdAt) <= ?');
      queryParams.push(dateTo);
    }
    if (paymentMethod) {
      whereConditions.push('p.paymentMethod = ?');
      queryParams.push(paymentMethod);
    }
    // ملاحظة: عمود customerId غير موجود مباشرة في Invoice وفق المخطط الحالي
    // يمكن لاحقاً ربطه عبر RepairRequest -> customerId
    if (invoiceId) {
      whereConditions.push('p.invoiceId = ?');
      queryParams.push(invoiceId);
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    // First, let's check if we have any payments at all
    const [paymentCount] = await db.query('SELECT COUNT(*) as count FROM Payment');
    console.log('Total payments in database:', paymentCount[0].count);
    
    if (paymentCount[0].count === 0) {
      return res.json({
        payments: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0
        }
      });
    }

    const query = `
      SELECT 
        p.*,
        i.id as invoiceId,
        i.totalAmount as invoiceTotal,
        i.totalAmount as invoiceFinal,
        'عميل غير محدد' as customerFirstName,
        '' as customerLastName,
        '' as customerPhone,
        'مستخدم' as createdByFirstName,
        'غير محدد' as createdByLastName,
        (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE invoiceId = p.invoiceId) as totalPaid,
        (i.totalAmount - (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE invoiceId = p.invoiceId)) as remainingAmount
      FROM Payment p
      LEFT JOIN Invoice i ON p.invoiceId = i.id
      ${whereClause}
      ORDER BY p.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    
    queryParams.push(limitNum, offset);
    const [rows] = await db.query(query, queryParams);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM Payment p
      LEFT JOIN Invoice i ON p.invoiceId = i.id
      ${whereClause}
    `;
    const [countResult] = await db.query(countQuery, queryParams.slice(0, -2));
    const total = countResult[0].total;
    
    res.json({
      payments: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error('Error fetching payments:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      success: false,
      error: 'Server Error', 
      details: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage,
      sql: err.sql,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Get payment statistics
router.get('/stats', async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    let whereClause = 'WHERE i.deletedAt IS NULL';
    const params = [];
    
    if (dateFrom) {
      whereClause += ' AND DATE(p.createdAt) >= ?';
      params.push(dateFrom);
    }
    if (dateTo) {
      whereClause += ' AND DATE(p.createdAt) <= ?';
      params.push(dateTo);
    }
    
    const [stats] = await db.query(`
      SELECT 
        COUNT(p.id) as totalPayments,
        COALESCE(SUM(p.amount), 0) as totalAmount,
        COUNT(DISTINCT p.invoiceId) as invoicesWithPayments,
        COALESCE(AVG(p.amount), 0) as averagePayment
      FROM Payment p
      LEFT JOIN Invoice i ON p.invoiceId = i.id
      ${whereClause}
    `, params);
    
    res.json(stats[0]);
  } catch (error) {
    console.error('Error getting payment stats:', error);
    res.status(500).json({ 
      error: 'Server Error', 
      details: error.message 
    });
  }
});

// Get payment by ID with detailed information
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  // Allow only numeric IDs here; otherwise let other routes like /overdue/list, /stats pass
  if (!/^\d+$/.test(String(id))) {
    return next();
  }
  try {
    const [rows] = await db.query(`
      SELECT 
        p.*,
        i.id as invoiceId,
        i.totalAmount as invoiceTotal,
        i.totalAmount as invoiceFinal,
        i.createdAt as invoiceDate,
        'عميل غير محدد' as customerFirstName,
        '' as customerLastName,
        '' as customerPhone,
        '' as customerEmail,
        'مستخدم' as createdByFirstName,
        'غير محدد' as createdByLastName,
        (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE invoiceId = p.invoiceId) as totalPaid,
        (i.totalAmount - (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE invoiceId = p.invoiceId)) as remainingAmount
      FROM Payment p
      LEFT JOIN Invoice i ON p.invoiceId = i.id
      WHERE p.id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching payment with ID ${id}:`, err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      success: false,
      error: 'Server Error', 
      details: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage,
      sql: err.sql,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Get payments by invoice ID
router.get('/invoice/:invoiceId', async (req, res) => {
  const { invoiceId } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT 
        p.*,
        'مستخدم' as createdByFirstName,
        'غير محدد' as createdByLastName,
        i.id as invoiceId,
        i.totalAmount as invoiceFinal
      FROM Payment p 
      LEFT JOIN Invoice i ON p.invoiceId = i.id
      WHERE p.invoiceId = ? 
      ORDER BY p.paymentDate DESC, p.createdAt DESC
    `, [invoiceId]);
    
    // Get invoice summary
    const [invoiceSummary] = await db.query(`
      SELECT 
        i.totalAmount as finalAmount,
        COALESCE(SUM(p.amount), 0) as totalPaid,
        (i.totalAmount - COALESCE(SUM(p.amount), 0)) as remainingAmount
      FROM Invoice i
      LEFT JOIN Payment p ON i.id = p.invoiceId
      WHERE i.id = ?
      GROUP BY i.id, i.totalAmount
    `, [invoiceId]);
    
    res.json({
      payments: rows,
      summary: invoiceSummary[0] || { finalAmount: 0, totalPaid: 0, remainingAmount: 0 }
    });
  } catch (err) {
    console.error(`Error fetching payments for invoice ${invoiceId}:`, err);
    res.status(500).json({ 
      error: 'Server Error', 
      details: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage,
      sql: err.sql
    });
  }
});

// Create a new payment
router.post('/', async (req, res) => {
  const { 
    amount, 
    paymentMethod, 
    invoiceId, 
    createdBy, 
    currency = 'EGP',
    paymentDate,
    referenceNumber,
    notes
  } = req.body;
  
  if (amount === undefined || amount === null || !paymentMethod || !invoiceId || !createdBy) {
    return res.status(400).json({ 
      error: 'Amount, payment method, invoice ID, and userId are required' 
    });
  }
  if (isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }
  
  try {
    // Validate invoice exists and get its details
    const [invoiceRows] = await db.query(`
      SELECT totalAmount as finalAmount, status 
      FROM Invoice 
      WHERE id = ? AND deletedAt IS NULL
    `, [invoiceId]);
    
    if (invoiceRows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const invoice = invoiceRows[0];
    
    // Check if payment amount exceeds remaining balance
    const [paymentSum] = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as totalPaid 
      FROM Payment 
      WHERE invoiceId = ?
    `, [invoiceId]);
    
    const totalPaid = paymentSum[0].totalPaid;
    const remainingAmount = invoice.finalAmount - totalPaid;
    
    if (parseFloat(amount) > remainingAmount) {
      return res.status(400).json({ 
        error: `Payment amount (${amount}) exceeds remaining balance (${remainingAmount})` 
      });
    }
    
    // Create payment
    const paymentDate = new Date().toISOString().split('T')[0];
    const [result] = await db.query(`
      INSERT INTO Payment (
        invoiceId, amount, currency, paymentMethod, paymentDate, createdBy
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      invoiceId,
      amount,
      currency,
      paymentMethod,
      paymentDate,
      createdBy
    ]);
    
    const paymentId = result.insertId;
    
    // Update invoice status based on payment
    const newTotalPaid = totalPaid + parseFloat(amount);
    let newStatus = 'partially_paid';
    
    if (newTotalPaid >= invoice.finalAmount) {
      newStatus = 'paid';
      await db.query(`
        UPDATE Invoice 
        SET status = ? 
        WHERE id = ?
      `, [newStatus, invoiceId]);
    } else {
      await db.query(`
        UPDATE Invoice 
        SET status = ? 
        WHERE id = ?
      `, [newStatus, invoiceId]);
    }
    
    // Get the created payment with details
    const [newPayment] = await db.query(`
      SELECT 
        p.*,
        i.id as invoiceId,
        'عميل غير محدد' as customerFirstName,
        '' as customerLastName,
        'مستخدم' as createdByFirstName,
        'غير محدد' as createdByLastName
      FROM Payment p
      LEFT JOIN Invoice i ON p.invoiceId = i.id
      WHERE p.id = ?
    `, [paymentId]);
    
    res.status(201).json({
      success: true,
      payment: newPayment[0],
      invoiceStatus: newStatus,
      totalPaid: newTotalPaid,
      remainingAmount: invoice.finalAmount - newTotalPaid
    });
  } catch (err) {
    console.error('Error creating payment:', err);
    res.status(500).json({ 
      error: 'Server Error', 
      details: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage,
      sql: err.sql
    });
  }
});

// Update a payment
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    amount, 
    paymentMethod, 
    paymentDate,
    referenceNumber,
    notes
  } = req.body;
  
  if (amount === undefined || amount === null || !paymentMethod) {
    return res.status(400).json({ 
      error: 'Amount and payment method are required' 
    });
  }
  if (isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }
  
  try {
    // Get current payment details
    const [currentPayment] = await db.query(`
      SELECT invoiceId, amount as oldAmount 
      FROM Payment 
      WHERE id = ?
    `, [id]);
    
    if (currentPayment.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    const payment = currentPayment[0];
    const oldAmount = payment.oldAmount;
    const amountDifference = parseFloat(amount) - parseFloat(oldAmount);
    
    // Update payment
    const [result] = await db.query(`
      UPDATE Payment 
      SET amount = ?, paymentMethod = ?, updatedAt = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [amount, paymentMethod, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Update invoice status if amount changed
    if (amountDifference !== 0) {
      const [invoiceRows] = await db.query(`
        SELECT totalAmount as finalAmount 
        FROM Invoice 
        WHERE id = ?
      `, [payment.invoiceId]);
      
      if (invoiceRows.length > 0) {
        const [paymentSum] = await db.query(`
          SELECT COALESCE(SUM(amount), 0) as totalPaid 
          FROM Payment 
          WHERE invoiceId = ?
        `, [payment.invoiceId]);
        
        const totalPaid = paymentSum[0].totalPaid;
        const invoiceFinal = invoiceRows[0].finalAmount;
        let newStatus = 'partially_paid';
        
        if (totalPaid >= invoiceFinal) {
          newStatus = 'paid';
          await db.query(`
            UPDATE Invoice 
            SET status = ? 
            WHERE id = ?
          `, [newStatus, payment.invoiceId]);
        } else {
          await db.query(`
            UPDATE Invoice 
            SET status = ? 
            WHERE id = ?
          `, [newStatus, payment.invoiceId]);
        }
      }
    }
    
    res.json({ 
      success: true,
      message: 'Payment updated successfully' 
    });
  } catch (err) {
    console.error(`Error updating payment with ID ${id}:`, err);
    res.status(500).json({ 
      error: 'Server Error', 
      details: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage,
      sql: err.sql
    });
  }
});

// Delete a payment
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Get payment details before deletion
    const [paymentRows] = await db.query(`
      SELECT invoiceId, amount 
      FROM Payment 
      WHERE id = ?
    `, [id]);
    
    if (paymentRows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    const payment = paymentRows[0];
    
    // Delete payment
    const [result] = await db.query('DELETE FROM Payment WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Update invoice status after payment deletion
    const [paymentSum] = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as totalPaid 
      FROM Payment 
      WHERE invoiceId = ?
    `, [payment.invoiceId]);
    
    const totalPaid = paymentSum[0].totalPaid;
    const [invoiceRows] = await db.query(`
      SELECT totalAmount as finalAmount 
      FROM Invoice 
      WHERE id = ?
    `, [payment.invoiceId]);
    
    if (invoiceRows.length > 0) {
      const invoiceFinal = invoiceRows[0].finalAmount;
      let newStatus = 'draft';
      
      if (totalPaid > 0) {
        newStatus = 'partially_paid';
      }
      
      await db.query(`
        UPDATE Invoice 
        SET status = ? 
        WHERE id = ?
      `, [newStatus, payment.invoiceId]);
    }
    
    res.json({ 
      success: true,
      message: 'Payment deleted successfully' 
    });
  } catch (err) {
    console.error(`Error deleting payment with ID ${id}:`, err);
    res.status(500).json({ 
      error: 'Server Error', 
      details: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage,
      sql: err.sql
    });
  }
});

// Get payment statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    let whereClause = '';
    let queryParams = [];
    if (dateFrom && dateTo) {
      whereClause = 'WHERE DATE(p.paymentDate) BETWEEN ? AND ?';
      queryParams = [dateFrom, dateTo];
    } else if (dateFrom) {
      whereClause = 'WHERE DATE(p.paymentDate) >= ?';
      queryParams = [dateFrom];
    } else if (dateTo) {
      whereClause = 'WHERE DATE(p.paymentDate) <= ?';
      queryParams = [dateTo];
    }
    
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as totalPayments,
        COALESCE(SUM(p.amount), 0) as totalAmount,
        COALESCE(AVG(p.amount), 0) as averageAmount,
        COUNT(CASE WHEN p.paymentMethod = 'cash' THEN 1 END) as cashPayments,
        COUNT(CASE WHEN p.paymentMethod = 'card' THEN 1 END) as cardPayments,
        COUNT(CASE WHEN p.paymentMethod = 'bank_transfer' THEN 1 END) as bankTransferPayments,
        COUNT(CASE WHEN p.paymentMethod = 'check' THEN 1 END) as checkPayments,
        COUNT(CASE WHEN p.paymentMethod = 'other' THEN 1 END) as otherPayments,
        COALESCE(SUM(CASE WHEN p.paymentMethod = 'cash' THEN p.amount ELSE 0 END), 0) as cashAmount,
        COALESCE(SUM(CASE WHEN p.paymentMethod = 'card' THEN p.amount ELSE 0 END), 0) as cardAmount,
        COALESCE(SUM(CASE WHEN p.paymentMethod = 'bank_transfer' THEN p.amount ELSE 0 END), 0) as bankTransferAmount,
        COALESCE(SUM(CASE WHEN p.paymentMethod = 'check' THEN p.amount ELSE 0 END), 0) as checkAmount,
        COALESCE(SUM(CASE WHEN p.paymentMethod = 'other' THEN p.amount ELSE 0 END), 0) as otherAmount
      FROM Payment p
      ${whereClause}
    `, queryParams);
    
    res.json(stats[0]);
  } catch (err) {
    console.error('Error fetching payment statistics:', err);
    res.status(500).json({ 
      error: 'Server Error', 
      details: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage,
      sql: err.sql
    });
  }
});

// Get overdue payments
router.get('/overdue/list', async (req, res) => {
  // المخطط الحالي لا يحتوي على dueDate، نعيد قائمة فارغة مؤقتاً
  return res.json([]);
});

module.exports = router;
