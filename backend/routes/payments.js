const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all payments with detailed information
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, dateFrom, dateTo, paymentMethod, customerId, invoiceId } = req.query;
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    let queryParams = [];
    
    if (dateFrom) {
      whereConditions.push('DATE(p.paymentDate) >= ?');
      queryParams.push(dateFrom);
    }
    if (dateTo) {
      whereConditions.push('DATE(p.paymentDate) <= ?');
      queryParams.push(dateTo);
    }
    if (paymentMethod) {
      whereConditions.push('p.paymentMethod = ?');
      queryParams.push(paymentMethod);
    }
    if (customerId) {
      whereConditions.push('i.customerId = ?');
      queryParams.push(customerId);
    }
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
        i.invoiceNumber,
        i.totalAmount as invoiceTotal,
        i.finalAmount as invoiceFinal,
        c.firstName as customerFirstName,
        c.lastName as customerLastName,
        c.phone as customerPhone,
        u.firstName as createdByFirstName,
        u.lastName as createdByLastName,
        (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE invoiceId = p.invoiceId) as totalPaid,
        (i.finalAmount - (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE invoiceId = p.invoiceId)) as remainingAmount
      FROM Payment p
      LEFT JOIN Invoice i ON p.invoiceId = i.id
      LEFT JOIN Customer c ON i.customerId = c.id
      LEFT JOIN User u ON p.createdBy = u.id
      ${whereClause}
      ORDER BY p.paymentDate DESC, p.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    
    queryParams.push(parseInt(limit), offset);
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
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching payments:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      success: false,
      error: 'Server Error', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Get payment by ID with detailed information
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT 
        p.*,
        i.invoiceNumber,
        i.totalAmount as invoiceTotal,
        i.finalAmount as invoiceFinal,
        i.issueDate as invoiceDate,
        i.dueDate as invoiceDueDate,
        c.firstName as customerFirstName,
        c.lastName as customerLastName,
        c.phone as customerPhone,
        c.email as customerEmail,
        u.firstName as createdByFirstName,
        u.lastName as createdByLastName,
        (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE invoiceId = p.invoiceId) as totalPaid,
        (i.finalAmount - (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE invoiceId = p.invoiceId)) as remainingAmount
      FROM Payment p
      LEFT JOIN Invoice i ON p.invoiceId = i.id
      LEFT JOIN Customer c ON i.customerId = c.id
      LEFT JOIN User u ON p.createdBy = u.id
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
        u.firstName as createdByFirstName,
        u.lastName as createdByLastName,
        i.invoiceNumber,
        i.finalAmount as invoiceFinal
      FROM Payment p 
      LEFT JOIN User u ON p.createdBy = u.id 
      LEFT JOIN Invoice i ON p.invoiceId = i.id
      WHERE p.invoiceId = ? 
      ORDER BY p.paymentDate DESC, p.createdAt DESC
    `, [invoiceId]);
    
    // Get invoice summary
    const [invoiceSummary] = await db.query(`
      SELECT 
        i.finalAmount,
        COALESCE(SUM(p.amount), 0) as totalPaid,
        (i.finalAmount - COALESCE(SUM(p.amount), 0)) as remainingAmount
      FROM Invoice i
      LEFT JOIN Payment p ON i.id = p.invoiceId
      WHERE i.id = ?
      GROUP BY i.id, i.finalAmount
    `, [invoiceId]);
    
    res.json({
      payments: rows,
      summary: invoiceSummary[0] || { finalAmount: 0, totalPaid: 0, remainingAmount: 0 }
    });
  } catch (err) {
    console.error(`Error fetching payments for invoice ${invoiceId}:`, err);
    res.status(500).json({ error: 'Server Error', details: err.message });
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
  
  if (!amount || !paymentMethod || !invoiceId || !createdBy) {
    return res.status(400).json({ 
      error: 'Amount, payment method, invoice ID, and createdBy are required' 
    });
  }
  
  try {
    // Validate invoice exists and get its details
    const [invoiceRows] = await db.query(`
      SELECT finalAmount, status 
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
    const [result] = await db.query(`
      INSERT INTO Payment (
        invoiceId, amount, currency, paymentMethod, 
        paymentDate, referenceNumber, notes, createdBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoiceId, 
      amount, 
      currency, 
      paymentMethod,
      paymentDate || new Date().toISOString().split('T')[0],
      referenceNumber,
      notes,
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
        SET status = ?, paidDate = ? 
        WHERE id = ?
      `, [newStatus, new Date().toISOString().split('T')[0], invoiceId]);
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
        i.invoiceNumber,
        c.firstName as customerFirstName,
        c.lastName as customerLastName,
        u.firstName as createdByFirstName,
        u.lastName as createdByLastName
      FROM Payment p
      LEFT JOIN Invoice i ON p.invoiceId = i.id
      LEFT JOIN Customer c ON i.customerId = c.id
      LEFT JOIN User u ON p.createdBy = u.id
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
    res.status(500).json({ error: 'Server Error', details: err.message });
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
  
  if (!amount || !paymentMethod) {
    return res.status(400).json({ 
      error: 'Amount and payment method are required' 
    });
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
      SET amount = ?, paymentMethod = ?, paymentDate = ?, referenceNumber = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [amount, paymentMethod, paymentDate, referenceNumber, notes, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Update invoice status if amount changed
    if (amountDifference !== 0) {
      const [invoiceRows] = await db.query(`
        SELECT finalAmount 
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
            SET status = ?, paidDate = ? 
            WHERE id = ?
          `, [newStatus, new Date().toISOString().split('T')[0], payment.invoiceId]);
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
    res.status(500).json({ error: 'Server Error', details: err.message });
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
      SELECT finalAmount 
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
        SET status = ?, paidDate = NULL 
        WHERE id = ?
      `, [newStatus, payment.invoiceId]);
    }
    
    res.json({ 
      success: true,
      message: 'Payment deleted successfully' 
    });
  } catch (err) {
    console.error(`Error deleting payment with ID ${id}:`, err);
    res.status(500).json({ error: 'Server Error', details: err.message });
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
    }
    
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as totalPayments,
        COALESCE(SUM(p.amount), 0) as totalAmount,
        COALESCE(AVG(p.amount), 0) as averageAmount,
        COUNT(CASE WHEN p.paymentMethod = 'cash' THEN 1 END) as cashPayments,
        COUNT(CASE WHEN p.paymentMethod = 'card' THEN 1 END) as cardPayments,
        COUNT(CASE WHEN p.paymentMethod = 'bank_transfer' THEN 1 END) as bankTransferPayments,
        COALESCE(SUM(CASE WHEN p.paymentMethod = 'cash' THEN p.amount ELSE 0 END), 0) as cashAmount,
        COALESCE(SUM(CASE WHEN p.paymentMethod = 'card' THEN p.amount ELSE 0 END), 0) as cardAmount,
        COALESCE(SUM(CASE WHEN p.paymentMethod = 'bank_transfer' THEN p.amount ELSE 0 END), 0) as bankTransferAmount
      FROM Payment p
      ${whereClause}
    `, queryParams);
    
    res.json(stats[0]);
  } catch (err) {
    console.error('Error fetching payment statistics:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

// Get overdue payments
router.get('/overdue/list', async (req, res) => {
  try {
    const [overduePayments] = await db.query(`
      SELECT 
        i.id as invoiceId,
        i.invoiceNumber,
        i.finalAmount,
        i.dueDate,
        c.firstName as customerFirstName,
        c.lastName as customerLastName,
        c.phone as customerPhone,
        COALESCE(SUM(p.amount), 0) as totalPaid,
        (i.finalAmount - COALESCE(SUM(p.amount), 0)) as remainingAmount,
        DATEDIFF(CURDATE(), i.dueDate) as daysOverdue
      FROM Invoice i
      LEFT JOIN Customer c ON i.customerId = c.id
      LEFT JOIN Payment p ON i.id = p.invoiceId
      WHERE i.dueDate < CURDATE() 
        AND i.status IN ('sent', 'partially_paid')
        AND i.deletedAt IS NULL
      GROUP BY i.id, i.invoiceNumber, i.finalAmount, i.dueDate, c.firstName, c.lastName, c.phone
      HAVING remainingAmount > 0
      ORDER BY daysOverdue DESC
    `);
    
    res.json(overduePayments);
  } catch (err) {
    console.error('Error fetching overdue payments:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

module.exports = router;
