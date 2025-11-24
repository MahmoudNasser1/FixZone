const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, paymentSchemas, commonSchemas } = require('../middleware/validation');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all payments with detailed information (must be before /stats/summary and /:id)
router.get('/', validate(paymentSchemas.getPayments, 'query'), async (req, res) => {
  try {
    const { page = 1, limit = 10, dateFrom, dateTo, paymentMethod, customerId, invoiceId } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset = Math.max(0, (pageNum - 1) * limitNum);
    
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
    const [paymentCount] = await db.execute('SELECT COUNT(*) as count FROM Payment');
    
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
        i.status as invoiceStatus,
        c.name as customerName,
        c.phone as customerPhone,
        u.name as createdByName,
        (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE invoiceId = p.invoiceId) as totalPaid,
        (i.totalAmount - (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE invoiceId = p.invoiceId)) as remainingAmount
      FROM Payment p
      LEFT JOIN Invoice i ON p.invoiceId = i.id
      LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN User u ON p.userId = u.id
      ${whereClause}
      ORDER BY p.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    
    // Ensure limit and offset are integers (safeguard against NaN)
    const finalLimit = Math.floor(Number(limitNum)) || 10;
    const finalOffset = Math.floor(Number(offset)) || 0;
    queryParams.push(finalLimit, finalOffset);
    const [rows] = await db.execute(query, queryParams);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM Payment p
      LEFT JOIN Invoice i ON p.invoiceId = i.id
      LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN User u ON p.userId = u.id
      ${whereClause}
    `;
    const [countResult] = await db.execute(countQuery, queryParams.slice(0, -2));
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

// Get payment statistics summary (must be before /:id route)
router.get('/stats/summary', validate(paymentSchemas.getPaymentStats, 'query'), async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    let whereClause = '';
    let queryParams = [];
    if (dateFrom && dateTo) {
      whereClause = 'WHERE DATE(p.createdAt) BETWEEN ? AND ?';
      queryParams = [dateFrom, dateTo];
    } else if (dateFrom) {
      whereClause = 'WHERE DATE(p.createdAt) >= ?';
      queryParams = [dateFrom];
    } else if (dateTo) {
      whereClause = 'WHERE DATE(p.createdAt) <= ?';
      queryParams = [dateTo];
    }
    
    const [stats] = await db.execute(`
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
      success: false,
      error: 'Server Error', 
      details: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage
    });
  }
});

// Get payment statistics (legacy endpoint)
router.get('/stats', validate(paymentSchemas.getPaymentStats, 'query'), async (req, res) => {
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
    
    const [stats] = await db.execute(`
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
      success: false,
      error: 'Server Error', 
      details: error.message 
    });
  }
});

// Get payments by invoice ID (must be before /:id route)
router.get('/invoice/:invoiceId', validate(paymentSchemas.getPaymentsByInvoice, 'params'), async (req, res) => {
  // invoiceId is already converted to number by validation
  const invoiceId = req.params.invoiceId; // validation will convert string to number
  try {
    const [rows] = await db.execute(`
      SELECT 
        p.*,
        u.name as createdByName,
        i.id as invoiceId,
        i.totalAmount as invoiceFinal,
        i.status as invoiceStatus,
        c.name as customerName
      FROM Payment p 
      LEFT JOIN Invoice i ON p.invoiceId = i.id
      LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN User u ON p.userId = u.id
      WHERE p.invoiceId = ? 
      ORDER BY p.createdAt DESC
    `, [invoiceId]);
    
    // Get invoice summary
    const [invoiceSummary] = await db.execute(`
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
      success: true,
      payments: rows,
      summary: invoiceSummary[0] || { finalAmount: 0, totalPaid: 0, remainingAmount: 0 }
    });
  } catch (err) {
    console.error(`Error fetching payments for invoice ${invoiceId}:`, err);
    res.status(500).json({ 
      success: false,
      error: 'Server Error', 
      details: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage
    });
  }
});

// Get overdue payments (must be before /:id route)
router.get('/overdue/list', async (req, res) => {
  // المخطط الحالي لا يحتوي على dueDate، نعيد قائمة فارغة مؤقتاً
  return res.json({
    success: true,
    payments: []
  });
});

// Get payment by ID with detailed information
router.get('/:id', validate(paymentSchemas.getPaymentById, 'params'), async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute(`
      SELECT 
        p.*,
        i.id as invoiceId,
        i.totalAmount as invoiceTotal,
        i.totalAmount as invoiceFinal,
        i.status as invoiceStatus,
        i.createdAt as invoiceDate,
        c.name as customerName,
        c.phone as customerPhone,
        c.email as customerEmail,
        u.name as createdByName,
        (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE invoiceId = p.invoiceId) as totalPaid,
        (i.totalAmount - (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE invoiceId = p.invoiceId)) as remainingAmount
      FROM Payment p
      LEFT JOIN Invoice i ON p.invoiceId = i.id
      LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN User u ON p.userId = u.id
      WHERE p.id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Payment not found' 
      });
    }
    res.json({
      success: true,
      payment: rows[0]
    });
  } catch (err) {
    console.error(`Error fetching payment with ID ${id}:`, err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      success: false,
      error: 'Server Error', 
      details: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage
    });
  }
});

// Create a new payment
router.post('/', validate(paymentSchemas.createPayment, 'body'), async (req, res) => {
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
  
  // Use req.user.id as fallback for createdBy
  const userId = createdBy || req.user?.id || req.user?.userId;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required',
      message: 'خطأ في البيانات المدخلة - createdBy: معرف المستخدم مطلوب',
      details: {
        provided: { createdBy, 'req.user': req.user },
        suggestion: 'يرجى إرسال createdBy في body أو التأكد من تسجيل الدخول'
      }
    });
  }
  
  const connection = await db.getConnection();
  try {
    // Start transaction using connection (not prepared statement)
    await connection.beginTransaction();
    
    // Validate invoice exists and get its details with repairRequestId
    const [invoiceRows] = await connection.execute(`
      SELECT i.repairRequestId, i.totalAmount as finalAmount, i.status 
      FROM Invoice i
      WHERE i.id = ? AND i.deletedAt IS NULL
    `, [invoiceId]);
    
    if (invoiceRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ 
        success: false,
        error: 'Invoice not found' 
      });
    }
    
    const invoice = invoiceRows[0];
    
    // Check if payment amount exceeds remaining balance
    const [paymentSum] = await connection.execute(`
      SELECT COALESCE(SUM(amount), 0) as totalPaid 
      FROM Payment 
      WHERE invoiceId = ?
    `, [invoiceId]);
    
    const totalPaid = paymentSum[0].totalPaid;
    const remainingAmount = invoice.finalAmount - totalPaid;
    
    if (remainingAmount <= 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        success: false,
        error: 'Invoice is already fully paid',
        invoiceAmount: invoice.finalAmount,
        totalPaid: totalPaid,
        remaining: remainingAmount
      });
    }
    
    if (parseFloat(amount) > remainingAmount) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        success: false,
        error: `Payment amount (${amount}) exceeds remaining balance (${remainingAmount})`,
        invoiceAmount: invoice.finalAmount,
        totalPaid: totalPaid,
        remaining: remainingAmount
      });
    }
    
    // Create payment
    // Note: Payment table doesn't have referenceNumber or notes columns
    const [result] = await connection.execute(`
      INSERT INTO Payment (
        invoiceId, amount, currency, paymentDate, paymentMethod, userId
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      invoiceId,
      amount,
      currency,
      paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod,
      userId
    ]);
    
    const paymentId = result.insertId;
    
    // Update invoice status and amountPaid based on payment
    const newTotalPaid = totalPaid + parseFloat(amount);
    let newStatus = 'partially_paid';
    
    if (newTotalPaid >= invoice.finalAmount) {
      newStatus = 'paid';
    }
    
    await connection.execute(`
      UPDATE Invoice 
      SET status = ?, amountPaid = ? 
      WHERE id = ?
    `, [newStatus, newTotalPaid, invoiceId]);
    
    // If fully paid, update RepairRequest status to ready_for_delivery
    if (newStatus === 'paid' && invoice.repairRequestId) {
      await connection.execute(`
        UPDATE RepairRequest 
        SET status = 'ready_for_delivery'
        WHERE id = ?
      `, [invoice.repairRequestId]);
      
      // Create status update log if StatusUpdateLog table exists
      try {
        await connection.execute(`
          INSERT INTO StatusUpdateLog (repairRequestId, status, updatedBy, notes, createdAt)
          VALUES (?, 'ready_for_delivery', ?, 'تم الدفع بالكامل - جاهز للتسليم', NOW())
        `, [invoice.repairRequestId, userId]);
      } catch (logError) {
        // Ignore if StatusUpdateLog table doesn't exist
        console.warn('Could not create status update log:', logError.message);
      }
    }
    
    // Commit transaction
    await connection.commit();
    
    // Get the created payment with details (using a new connection for read)
    const [newPayment] = await db.execute(`
      SELECT 
        p.*,
        i.id as invoiceId,
        i.status as invoiceStatus,
        c.name as customerName,
        c.phone as customerPhone,
        u.name as createdByName
      FROM Payment p
      LEFT JOIN Invoice i ON p.invoiceId = i.id
      LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN User u ON p.userId = u.id
      WHERE p.id = ?
    `, [paymentId]);
    
    connection.release();
    
    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      messageAr: 'تم إضافة الدفعة بنجاح',
      payment: newPayment[0],
      invoiceStatus: newStatus,
      totalPaid: newTotalPaid,
      remainingAmount: invoice.finalAmount - newTotalPaid
    });
  } catch (err) {
    // Rollback transaction on error
    try {
      if (connection) {
        await connection.rollback();
        connection.release();
      }
    } catch (rollbackErr) {
      console.error('Error rolling back transaction:', rollbackErr);
    }
    
    console.error('Error creating payment:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      success: false,
      error: 'Server Error',
      message: 'خطأ في إضافة الدفعة',
      details: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Update a payment
router.put('/:id', validate(paymentSchemas.updatePayment, 'body'), async (req, res) => {
  const { id } = req.params;
  const { 
    amount, 
    paymentMethod, 
    paymentDate,
    referenceNumber,
    notes
  } = req.body;
  
  // Validate required fields for update
  if (amount === undefined && !paymentMethod) {
    return res.status(400).json({ 
      success: false,
      error: 'At least amount or payment method is required' 
    });
  }
  
  const connection = await db.getConnection();
  try {
    // Start transaction using connection
    await connection.beginTransaction();
    
    // Get current payment details with invoice info
    const [currentPayment] = await connection.execute(`
      SELECT p.invoiceId, p.amount as oldAmount, i.repairRequestId
      FROM Payment p
      LEFT JOIN Invoice i ON p.invoiceId = i.id
      WHERE p.id = ?
    `, [id]);
    
    if (currentPayment.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ 
        success: false,
        error: 'Payment not found' 
      });
    }
    
    const payment = currentPayment[0];
    const oldAmount = payment.oldAmount;
    
    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    
    if (amount !== undefined && amount !== null) {
      updateFields.push('amount = ?');
      updateValues.push(amount);
    }
    if (paymentMethod) {
      updateFields.push('paymentMethod = ?');
      updateValues.push(paymentMethod);
    }
    if (paymentDate) {
      updateFields.push('paymentDate = ?');
      updateValues.push(paymentDate);
    }
    // Note: Payment table doesn't have referenceNumber or notes columns
    // Skip these fields if they're sent
    
    if (updateFields.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        success: false,
        error: 'No fields to update' 
      });
    }
    
    updateFields.push('updatedAt = CURRENT_TIMESTAMP');
    updateValues.push(id);
    
    const [result] = await connection.execute(`
      UPDATE Payment 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ 
        success: false,
        error: 'Payment not found' 
      });
    }
    
    // Update invoice status if amount changed
    if (amount !== undefined && amount !== null) {
      const amountDifference = parseFloat(amount) - parseFloat(oldAmount);
      
      if (amountDifference !== 0) {
        const [invoiceRows] = await connection.execute(`
          SELECT totalAmount as finalAmount 
          FROM Invoice 
          WHERE id = ?
        `, [payment.invoiceId]);
        
        if (invoiceRows.length > 0) {
          const [paymentSum] = await connection.execute(`
            SELECT COALESCE(SUM(amount), 0) as totalPaid 
            FROM Payment 
            WHERE invoiceId = ?
          `, [payment.invoiceId]);
          
          const totalPaid = paymentSum[0].totalPaid;
          const invoiceFinal = invoiceRows[0].finalAmount;
          let newStatus = 'partially_paid';
          
          if (totalPaid >= invoiceFinal) {
            newStatus = 'paid';
          }
          
          await connection.execute(`
            UPDATE Invoice 
            SET status = ?, amountPaid = ?
            WHERE id = ?
          `, [newStatus, totalPaid, payment.invoiceId]);
          
          // If fully paid, update RepairRequest status to ready_for_delivery
          if (newStatus === 'paid' && payment.repairRequestId) {
            await connection.execute(`
              UPDATE RepairRequest 
              SET status = 'ready_for_delivery'
              WHERE id = ?
            `, [payment.repairRequestId]);
            
            // Create status update log if StatusUpdateLog table exists
            try {
              await connection.execute(`
                INSERT INTO StatusUpdateLog (repairRequestId, status, updatedBy, notes, createdAt)
                VALUES (?, 'ready_for_delivery', ?, 'تم الدفع بالكامل - جاهز للتسليم', NOW())
              `, [payment.repairRequestId, req.user?.id || null]);
            } catch (logError) {
              // Ignore if StatusUpdateLog table doesn't exist
              console.warn('Could not create status update log:', logError.message);
            }
          }
        }
      }
    }
    
    // Commit transaction
    await connection.commit();
    connection.release();
    
    res.json({ 
      success: true,
      message: 'Payment updated successfully' 
    });
  } catch (err) {
    // Rollback transaction on error
    try {
      if (connection) {
        await connection.rollback();
        connection.release();
      }
    } catch (rollbackErr) {
      console.error('Rollback error:', rollbackErr);
    }
    
    console.error(`Error updating payment with ID ${id}:`, err);
    res.status(500).json({ 
      success: false,
      error: 'Server Error',
      message: 'خطأ في تحديث الدفعة',
      details: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Delete a payment
router.delete('/:id', validate(paymentSchemas.deletePayment, 'params'), async (req, res) => {
  const { id } = req.params;
  try {
    // Start transaction
    await db.execute('START TRANSACTION');
    
    // Get payment details before deletion with invoice info
    const [paymentRows] = await db.execute(`
      SELECT p.invoiceId, p.amount, i.repairRequestId
      FROM Payment p
      LEFT JOIN Invoice i ON p.invoiceId = i.id
      WHERE p.id = ?
    `, [id]);
    
    if (paymentRows.length === 0) {
      await db.execute('ROLLBACK');
      return res.status(404).json({ 
        success: false,
        error: 'Payment not found' 
      });
    }
    
    const payment = paymentRows[0];
    
    // Delete payment
    const [result] = await db.execute('DELETE FROM Payment WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      await db.execute('ROLLBACK');
      return res.status(404).json({ 
        success: false,
        error: 'Payment not found' 
      });
    }
    
    // Update invoice status after payment deletion
    const [paymentSum] = await db.execute(`
      SELECT COALESCE(SUM(amount), 0) as totalPaid 
      FROM Payment 
      WHERE invoiceId = ?
    `, [payment.invoiceId]);
    
    const totalPaid = paymentSum[0].totalPaid;
    const [invoiceRows] = await db.execute(`
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
      
      await db.execute(`
        UPDATE Invoice 
        SET status = ?, amountPaid = ?
        WHERE id = ?
      `, [newStatus, totalPaid, payment.invoiceId]);
      
      // Update RepairRequest status if no longer fully paid
      if (newStatus !== 'paid' && payment.repairRequestId) {
        // Revert RepairRequest status if it was ready_for_delivery
        const [repairRequest] = await db.execute(`
          SELECT status FROM RepairRequest WHERE id = ?
        `, [payment.repairRequestId]);
        
        if (repairRequest.length > 0 && repairRequest[0].status === 'ready_for_delivery') {
          await db.execute(`
            UPDATE RepairRequest 
            SET status = 'completed'
            WHERE id = ?
          `, [payment.repairRequestId]);
        }
      }
    }
    
    // Commit transaction
    await db.execute('COMMIT');
    
    res.json({ 
      success: true,
      message: 'Payment deleted successfully' 
    });
  } catch (err) {
    // Rollback transaction on error
    await db.execute('ROLLBACK').catch(rollbackErr => {
      console.error('Rollback error:', rollbackErr);
    });
    
    console.error(`Error deleting payment with ID ${id}:`, err);
    res.status(500).json({ 
      success: false,
      error: 'Server Error', 
      details: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage
    });
  }
});

module.exports = router;
