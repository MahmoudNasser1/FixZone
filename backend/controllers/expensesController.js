const db = require('../../db');
const { validationResult } = require('express-validator');

/**
 * Expenses Controller - إدارة المصروفات مع التكامل المحاسبي
 * يدعم: إنشاء قيود محاسبية تلقائية عند إضافة المصروفات
 */
class ExpensesController {

  // Get all expenses with filtering and pagination
  async getAllExpenses(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        category = '',
        status = '',
        dateFrom = '',
        dateTo = '',
        vendorId = '',
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE e.deletedAt IS NULL';
      const queryParams = [];

      // Search functionality
      if (search) {
        whereClause += ` AND (e.description LIKE ? OR e.referenceNumber LIKE ? OR v.name LIKE ?)`;
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      // Category filter
      if (category) {
        whereClause += ` AND e.category = ?`;
        queryParams.push(category);
      }

      // Status filter
      if (status) {
        whereClause += ` AND e.status = ?`;
        queryParams.push(status);
      }

      // Vendor filter
      if (vendorId) {
        whereClause += ` AND e.vendorId = ?`;
        queryParams.push(vendorId);
      }

      // Date range filter
      if (dateFrom) {
        whereClause += ` AND DATE(e.expenseDate) >= ?`;
        queryParams.push(dateFrom);
      }
      if (dateTo) {
        whereClause += ` AND DATE(e.expenseDate) <= ?`;
        queryParams.push(dateTo);
      }

      // Validate sort parameters
      const allowedSortFields = ['createdAt', 'expenseDate', 'amount', 'status'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Main query
      const query = `
        SELECT 
          e.*,
          v.name as vendorName,
          v.phone as vendorPhone,
          cc.name as costCenterName,
          je.entryNumber as journalEntryNumber
        FROM Expense e
        LEFT JOIN Vendor v ON e.vendorId = v.id
        LEFT JOIN CostCenter cc ON e.costCenterId = cc.id
        LEFT JOIN JournalEntry je ON e.journalEntryId = je.id
        ${whereClause}
        ORDER BY e.${sortField} ${order}
        LIMIT ? OFFSET ?
      `;

      queryParams.push(parseInt(limit), parseInt(offset));
      const [expenses] = await db.query(query, queryParams);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM Expense e
        LEFT JOIN Vendor v ON e.vendorId = v.id
        ${whereClause}
      `;
      
      const [countResult] = await db.query(countQuery, queryParams.slice(0, -2));
      const total = countResult[0].total;

      res.json({
        success: true,
        data: {
          expenses,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching expenses:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Error fetching expenses' }
      });
    }
  }

  // Create new expense with accounting integration
  async createExpense(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const {
        description,
        amount,
        category,
        expenseDate,
        vendorId,
        costCenterId,
        paymentMethod,
        referenceNumber,
        notes,
        currency = 'EGP'
      } = req.body;

      // بدء المعاملة
      await db.query('START TRANSACTION');

      try {
        // إنشاء المصروف
        const [expenseResult] = await db.query(`
          INSERT INTO Expense (
            description, amount, category, expenseDate, vendorId, costCenterId,
            paymentMethod, referenceNumber, notes, currency, status, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', NOW(), NOW())
        `, [description, amount, category, expenseDate, vendorId, costCenterId, paymentMethod, referenceNumber, notes, currency]);

        const expenseId = expenseResult.insertId;

        // إنشاء قيد محاسبي للمصروف
        const entryNumber = `EXP-${new Date().getFullYear()}-${String(expenseId).padStart(6, '0')}`;
        
        const [journalResult] = await db.query(`
          INSERT INTO JournalEntry (entryNumber, entryDate, description, reference, totalDebit, totalCredit, status, createdBy)
          VALUES (?, ?, ?, ?, ?, ?, 'posted', ?)
        `, [entryNumber, expenseDate, `مصروف ${category} رقم ${expenseId}`, `EXP-${expenseId}`, amount, amount, req.user?.id || 1]);

        const journalEntryId = journalResult.insertId;

        // تحديد حساب المصروف حسب الفئة
        let expenseAccountId;
        switch (category) {
          case 'office_supplies':
            expenseAccountId = 36; // مصروفات مكتبية
            break;
          case 'utilities':
            expenseAccountId = 37; // مصروفات خدمات
            break;
          case 'maintenance':
            expenseAccountId = 38; // مصروفات صيانة
            break;
          case 'marketing':
            expenseAccountId = 39; // مصروفات تسويق
            break;
          case 'travel':
            expenseAccountId = 40; // مصروفات سفر
            break;
          case 'rent':
            expenseAccountId = 41; // مصروفات إيجار
            break;
          case 'salaries':
            expenseAccountId = 42; // مصروفات رواتب
            break;
          default:
            expenseAccountId = 43; // مصروفات عمومية
        }

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
          case 'check':
            paymentAccountId = 2; // البنك
            break;
          default:
            paymentAccountId = 1; // الصندوق (افتراضي)
        }

        // سطر مدين - حساب المصروف
        await db.query(`
          INSERT INTO JournalEntryLine (journalEntryId, lineNumber, accountId, description, debitAmount, creditAmount, costCenterId)
          VALUES (?, 1, ?, ?, ?, 0.00, ?)
        `, [journalEntryId, expenseAccountId, `${category} - ${description}`, amount, costCenterId]);

        // سطر دائن - الصندوق/البنك
        await db.query(`
          INSERT INTO JournalEntryLine (journalEntryId, lineNumber, accountId, description, debitAmount, creditAmount)
          VALUES (?, 2, ?, ?, 0.00, ?)
        `, [journalEntryId, paymentAccountId, `دفع ${paymentMethod} للمصروف رقم ${expenseId}`, amount]);

        // ربط المصروف بالقيد المحاسبي
        await db.query(`
          UPDATE Expense SET journalEntryId = ? WHERE id = ?
        `, [journalEntryId, expenseId]);

        await db.query('COMMIT');

        res.status(201).json({
          success: true,
          data: { 
            expenseId, 
            journalEntryId, 
            message: 'Expense created successfully with accounting entry' 
          }
        });

      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('Error creating expense:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Error creating expense' }
      });
    }
  }

  // Get expense by ID
  async getExpenseById(req, res) {
    try {
      const { id } = req.params;

      const [expenses] = await db.query(`
        SELECT 
          e.*,
          v.name as vendorName,
          v.phone as vendorPhone,
          v.email as vendorEmail,
          cc.name as costCenterName,
          je.entryNumber as journalEntryNumber,
          je.status as journalEntryStatus
        FROM Expense e
        LEFT JOIN Vendor v ON e.vendorId = v.id
        LEFT JOIN CostCenter cc ON e.costCenterId = cc.id
        LEFT JOIN JournalEntry je ON e.journalEntryId = je.id
        WHERE e.id = ? AND e.deletedAt IS NULL
      `, [id]);

      if (expenses.length === 0) {
        return res.status(404).json({
          success: false,
          error: { message: 'Expense not found' }
        });
      }

      res.json({
        success: true,
        data: expenses[0]
      });

    } catch (error) {
      console.error('Error fetching expense:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Error fetching expense' }
      });
    }
  }

  // Update expense
  async updateExpense(req, res) {
    try {
      const { id } = req.params;
      const { 
        description, amount, category, expenseDate, vendorId, costCenterId,
        paymentMethod, referenceNumber, notes, status 
      } = req.body;

      // Check if expense exists
      const [existing] = await db.query(`
        SELECT id, journalEntryId FROM Expense WHERE id = ? AND deletedAt IS NULL
      `, [id]);

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: { message: 'Expense not found' }
        });
      }

      // Build update query
      const updates = [];
      const values = [];

      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
      }
      if (amount !== undefined) {
        updates.push('amount = ?');
        values.push(amount);
      }
      if (category !== undefined) {
        updates.push('category = ?');
        values.push(category);
      }
      if (expenseDate !== undefined) {
        updates.push('expenseDate = ?');
        values.push(expenseDate);
      }
      if (vendorId !== undefined) {
        updates.push('vendorId = ?');
        values.push(vendorId);
      }
      if (costCenterId !== undefined) {
        updates.push('costCenterId = ?');
        values.push(costCenterId);
      }
      if (paymentMethod !== undefined) {
        updates.push('paymentMethod = ?');
        values.push(paymentMethod);
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
        UPDATE Expense SET ${updates.join(', ')} WHERE id = ? AND deletedAt IS NULL
      `, values);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: { message: 'Expense not found or no changes made' }
        });
      }

      res.json({
        success: true,
        message: 'Expense updated successfully'
      });

    } catch (error) {
      console.error('Error updating expense:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Error updating expense' }
      });
    }
  }

  // Delete expense (soft delete)
  async deleteExpense(req, res) {
    try {
      const { id } = req.params;

      const [result] = await db.query(`
        UPDATE Expense SET deletedAt = NOW() WHERE id = ? AND deletedAt IS NULL
      `, [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: { message: 'Expense not found' }
        });
      }

      res.json({
        success: true,
        message: 'Expense deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting expense:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Error deleting expense' }
      });
    }
  }

  // Get expense statistics
  async getExpenseStats(req, res) {
    try {
      const { dateFrom, dateTo, category, costCenterId } = req.query;
      
      let whereClause = 'WHERE e.deletedAt IS NULL';
      const queryParams = [];

      if (dateFrom) {
        whereClause += ` AND DATE(e.expenseDate) >= ?`;
        queryParams.push(dateFrom);
      }
      if (dateTo) {
        whereClause += ` AND DATE(e.expenseDate) <= ?`;
        queryParams.push(dateTo);
      }
      if (category) {
        whereClause += ` AND e.category = ?`;
        queryParams.push(category);
      }
      if (costCenterId) {
        whereClause += ` AND e.costCenterId = ?`;
        queryParams.push(costCenterId);
      }

      const [stats] = await db.query(`
        SELECT 
          COUNT(*) as totalExpenses,
          COALESCE(SUM(amount), 0) as totalAmount,
          COALESCE(AVG(amount), 0) as averageAmount,
          category,
          COUNT(*) as categoryCount,
          COALESCE(SUM(amount), 0) as categoryAmount
        FROM Expense e
        ${whereClause}
        GROUP BY category
        ORDER BY categoryAmount DESC
      `, queryParams);

      // Get overall stats
      const [overallStats] = await db.query(`
        SELECT 
          COUNT(*) as totalExpenses,
          COALESCE(SUM(amount), 0) as totalAmount,
          COALESCE(AVG(amount), 0) as averageAmount
        FROM Expense e
        ${whereClause}
      `, queryParams);

      res.json({
        success: true,
        data: {
          overall: overallStats[0],
          byCategory: stats
        }
      });

    } catch (error) {
      console.error('Error fetching expense statistics:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Error fetching expense statistics' }
      });
    }
  }

  // Get expense categories
  async getExpenseCategories(req, res) {
    try {
      const categories = [
        { value: 'office_supplies', label: 'مصروفات مكتبية', accountId: 36 },
        { value: 'utilities', label: 'مصروفات خدمات', accountId: 37 },
        { value: 'maintenance', label: 'مصروفات صيانة', accountId: 38 },
        { value: 'marketing', label: 'مصروفات تسويق', accountId: 39 },
        { value: 'travel', label: 'مصروفات سفر', accountId: 40 },
        { value: 'rent', label: 'مصروفات إيجار', accountId: 41 },
        { value: 'salaries', label: 'مصروفات رواتب', accountId: 42 },
        { value: 'other', label: 'مصروفات عمومية', accountId: 43 }
      ];

      res.json({
        success: true,
        data: categories
      });

    } catch (error) {
      console.error('Error fetching expense categories:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Error fetching expense categories' }
      });
    }
  }
}

module.exports = new ExpensesController();
