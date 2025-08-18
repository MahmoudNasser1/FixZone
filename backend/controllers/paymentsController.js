const db = require('../../db');
const { validationResult } = require('express-validator');

/**
 * Payments Controller - إدارة المدفوعات مع التكامل المحاسبي
 * يدعم: إنشاء قيود محاسبية تلقائية عند إضافة المدفوعات
 */
class PaymentsController {

  // Get all payments with filtering and pagination
  async getAllPayments(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        paymentMethod = '',
        status = '',
        dateFrom = '',
        dateTo = '',
        customerId = '',
        invoiceId = '',
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE p.deletedAt IS NULL';
      const queryParams = [];

      // Search functionality
      if (search) {
        whereClause += ` AND (c.name LIKE ? OR p.referenceNumber LIKE ? OR p.notes LIKE ?)`;
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      // Payment method filter
      if (paymentMethod) {
        whereClause += ` AND p.paymentMethod = ?`;
        queryParams.push(paymentMethod);
      }

      // Status filter
      if (status) {
        whereClause += ` AND p.status = ?`;
        queryParams.push(status);
      }

      // Customer filter
      if (customerId) {
        whereClause += ` AND p.customerId = ?`;
        queryParams.push(customerId);
      }

      // Invoice filter
      if (invoiceId) {
        whereClause += ` AND p.invoiceId = ?`;
        queryParams.push(invoiceId);
      }

      // Date range filter
      if (dateFrom) {
        whereClause += ` AND DATE(p.paymentDate) >= ?`;
        queryParams.push(dateFrom);
      }
      if (dateTo) {
        whereClause += ` AND DATE(p.paymentDate) <= ?`;
        queryParams.push(dateTo);
      }

      // Validate sort parameters
      const allowedSortFields = ['createdAt', 'paymentDate', 'amount', 'status'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Main query
      const query = `
        SELECT 
          p.*,
          c.name as customerName,
          c.phone as customerPhone,
          i.id as invoiceNumber,
          i.total as invoiceTotal,
          je.entryNumber as journalEntryNumber
        FROM Payment p
        LEFT JOIN Customer c ON p.customerId = c.id
        LEFT JOIN Invoice i ON p.invoiceId = i.id
        LEFT JOIN JournalEntry je ON p.journalEntryId = je.id
        ${whereClause}
        ORDER BY p.${sortField} ${order}
        LIMIT ? OFFSET ?
      `;

      queryParams.push(parseInt(limit), parseInt(offset));
      const [payments] = await db.query(query, queryParams);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM Payment p
        LEFT JOIN Customer c ON p.customerId = c.id
        LEFT JOIN Invoice i ON p.invoiceId = i.id
        ${whereClause}
      `;
      
      const [countResult] = await db.query(countQuery, queryParams.slice(0, -2));
      const total = countResult[0].total;

      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Error fetching payments' }
      });
    }
  }

  // Create new payment with accounting integration
  async createPayment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const {
        customerId,
        invoiceId,
        amount,
        paymentMethod,
        paymentDate,
        referenceNumber,
        notes,
        currency = 'EGP'
      } = req.body;

      // بدء المعاملة
      await db.query('START TRANSACTION');

      try {
        // إنشاء المدفوعة
        const [paymentResult] = await db.query(`
          INSERT INTO Payment (
            customerId, invoiceId, amount, paymentMethod, paymentDate, 
            referenceNumber, notes, currency, status, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', NOW(), NOW())
        `, [customerId, invoiceId, amount, paymentMethod, paymentDate, referenceNumber, notes, currency]);

        const paymentId = paymentResult.insertId;

        // إنشاء قيد محاسبي للمدفوعة
        const entryNumber = `PAY-${new Date().getFullYear()}-${String(paymentId).padStart(6, '0')}`;
        
        const [journalResult] = await db.query(`
          INSERT INTO JournalEntry (entryNumber, entryDate, description, reference, totalDebit, totalCredit, status, createdBy)
          VALUES (?, ?, ?, ?, ?, ?, 'posted', ?)
        `, [entryNumber, paymentDate, `مدفوعة من العميل رقم ${paymentId}`, `PAY-${paymentId}`, amount, amount, req.user?.id || 1]);

        const journalEntryId = journalResult.insertId;

        // تحديد حساب الدفع حسب طريقة الدفع
        let paymentAccountId;
        switch (paymentMethod) {
          case 'cash':
            paymentAccountId = 1; // الصندوق
            break;
          case 'bank_transfer':
            paymentAccountId = 2; // البنك
            break;
          case 'credit_card':
            paymentAccountId = 2; // البنك
            break;
          default:
            paymentAccountId = 1; // الصندوق (افتراضي)
        }

        // سطر مدين - الصندوق/البنك
        await db.query(`
          INSERT INTO JournalEntryLine (journalEntryId, lineNumber, accountId, description, debitAmount, creditAmount)
          VALUES (?, 1, ?, ?, ?, 0.00)
        `, [journalEntryId, paymentAccountId, `مدفوعة ${paymentMethod} رقم ${paymentId}`, amount]);

        // سطر دائن - العملاء
        await db.query(`
          INSERT INTO JournalEntryLine (journalEntryId, lineNumber, accountId, description, debitAmount, creditAmount)
          VALUES (?, 2, 3, ?, 0.00, ?)
        `, [journalEntryId, `تحصيل من العميل رقم ${paymentId}`, amount]);

        // ربط المدفوعة بالقيد المحاسبي
        await db.query(`
          UPDATE Payment SET journalEntryId = ? WHERE id = ?
        `, [journalEntryId, paymentId]);

        // تحديث حالة الفاتورة إذا كانت موجودة
        if (invoiceId) {
          await db.query(`
            UPDATE Invoice 
            SET amountPaid = COALESCE(amountPaid, 0) + ?, 
                status = CASE 
                  WHEN (COALESCE(amountPaid, 0) + ?) >= total THEN 'paid'
                  WHEN (COALESCE(amountPaid, 0) + ?) > 0 THEN 'partially_paid'
                  ELSE status 
                END,
                updatedAt = NOW()
            WHERE id = ?
          `, [amount, amount, amount, invoiceId]);
        }

        await db.query('COMMIT');

        res.status(201).json({
          success: true,
          data: { 
            paymentId, 
            journalEntryId, 
            message: 'Payment created successfully with accounting entry' 
          }
        });

      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Error creating payment' }
      });
    }
  }

  // Get payment by ID
  async getPaymentById(req, res) {
    try {
      const { id } = req.params;

      const [payments] = await db.query(`
        SELECT 
          p.*,
          c.name as customerName,
          c.phone as customerPhone,
          c.email as customerEmail,
          i.id as invoiceNumber,
          i.total as invoiceTotal,
          i.status as invoiceStatus,
          je.entryNumber as journalEntryNumber,
          je.status as journalEntryStatus
        FROM Payment p
        LEFT JOIN Customer c ON p.customerId = c.id
        LEFT JOIN Invoice i ON p.invoiceId = i.id
        LEFT JOIN JournalEntry je ON p.journalEntryId = je.id
        WHERE p.id = ? AND p.deletedAt IS NULL
      `, [id]);

      if (payments.length === 0) {
        return res.status(404).json({
          success: false,
          error: { message: 'Payment not found' }
        });
      }

      res.json({
        success: true,
        data: payments[0]
      });

    } catch (error) {
      console.error('Error fetching payment:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Error fetching payment' }
      });
    }
  }

  // Update payment
  async updatePayment(req, res) {
    try {
      const { id } = req.params;
      const { amount, paymentMethod, paymentDate, referenceNumber, notes, status } = req.body;

      // Check if payment exists
      const [existing] = await db.query(`
        SELECT id, journalEntryId FROM Payment WHERE id = ? AND deletedAt IS NULL
      `, [id]);

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: { message: 'Payment not found' }
        });
      }

      // Build update query
      const updates = [];
      const values = [];

      if (amount !== undefined) {
        updates.push('amount = ?');
        values.push(amount);
      }
      if (paymentMethod !== undefined) {
        updates.push('paymentMethod = ?');
        values.push(paymentMethod);
      }
      if (paymentDate !== undefined) {
        updates.push('paymentDate = ?');
        values.push(paymentDate);
      }
      if (referenceNumber !== undefined) {
        updates.push('referenceNumber = ?');
        values.push(referenceNumber);
      }
      if (notes !== undefined) {
        updates.push('notes = ?');
        values.push(notes);
      }
      if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'No fields to update' }
        });
      }

      updates.push('updatedAt = NOW()');
      values.push(id);

      const [result] = await db.query(`
        UPDATE Payment SET ${updates.join(', ')} WHERE id = ? AND deletedAt IS NULL
      `, values);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: { message: 'Payment not found or no changes made' }
        });
      }

      res.json({
        success: true,
        message: 'Payment updated successfully'
      });

    } catch (error) {
      console.error('Error updating payment:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Error updating payment' }
      });
    }
  }

  // Delete payment (soft delete)
  async deletePayment(req, res) {
    try {
      const { id } = req.params;

      const [result] = await db.query(`
        UPDATE Payment SET deletedAt = NOW() WHERE id = ? AND deletedAt IS NULL
      `, [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: { message: 'Payment not found' }
        });
      }

      res.json({
        success: true,
        message: 'Payment deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting payment:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Error deleting payment' }
      });
    }
  }

  // Get payment statistics
  async getPaymentStats(req, res) {
    try {
      const { dateFrom, dateTo, customerId } = req.query;
      
      let whereClause = 'WHERE p.deletedAt IS NULL';
      const queryParams = [];

      if (dateFrom) {
        whereClause += ` AND DATE(p.paymentDate) >= ?`;
        queryParams.push(dateFrom);
      }
      if (dateTo) {
        whereClause += ` AND DATE(p.paymentDate) <= ?`;
        queryParams.push(dateTo);
      }
      if (customerId) {
        whereClause += ` AND p.customerId = ?`;
        queryParams.push(customerId);
      }

      const [stats] = await db.query(`
        SELECT 
          COUNT(*) as totalPayments,
          COALESCE(SUM(amount), 0) as totalAmount,
          COALESCE(AVG(amount), 0) as averageAmount,
          COUNT(CASE WHEN paymentMethod = 'cash' THEN 1 END) as cashPayments,
          COUNT(CASE WHEN paymentMethod = 'bank_transfer' THEN 1 END) as bankPayments,
          COUNT(CASE WHEN paymentMethod = 'credit_card' THEN 1 END) as cardPayments,
          COALESCE(SUM(CASE WHEN paymentMethod = 'cash' THEN amount ELSE 0 END), 0) as cashAmount,
          COALESCE(SUM(CASE WHEN paymentMethod = 'bank_transfer' THEN amount ELSE 0 END), 0) as bankAmount,
          COALESCE(SUM(CASE WHEN paymentMethod = 'credit_card' THEN amount ELSE 0 END), 0) as cardAmount
        FROM Payment p
        ${whereClause}
      `, queryParams);

      res.json({
        success: true,
        data: stats[0]
      });

    } catch (error) {
      console.error('Error fetching payment statistics:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Error fetching payment statistics' }
      });
    }
  }
}

module.exports = new PaymentsController();
