const db = require('../../db');
const { validationResult } = require('express-validator');

/**
 * Accounting Controller - إدارة النظام المحاسبي الكامل
 * يشمل: دليل الحسابات، القيود المحاسبية، مراكز التكلفة، التقارير المالية
 */
class AccountingController {

  // =====================================================
  // إدارة دليل الحسابات (Chart of Accounts)
  // =====================================================

  /**
   * جلب جميع الحسابات مع إمكانية الفلترة والبحث
   */
  async getAccounts(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        search = '',
        accountType = '',
        categoryId = '',
        isActive = '',
        parentAccountId = ''
      } = req.query;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE a.deletedAt IS NULL';
      const queryParams = [];

      // البحث في الكود أو الاسم
      if (search) {
        whereClause += ` AND (a.code LIKE ? OR a.name LIKE ? OR a.nameEn LIKE ?)`;
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      // فلترة حسب نوع الحساب
      if (accountType) {
        whereClause += ` AND a.accountType = ?`;
        queryParams.push(accountType);
      }

      // فلترة حسب الفئة
      if (categoryId) {
        whereClause += ` AND a.categoryId = ?`;
        queryParams.push(categoryId);
      }

      // فلترة حسب الحالة النشطة
      if (isActive !== '') {
        whereClause += ` AND a.isActive = ?`;
        queryParams.push(isActive === 'true');
      }

      // فلترة حسب الحساب الأب
      if (parentAccountId) {
        whereClause += ` AND a.parentAccountId = ?`;
        queryParams.push(parentAccountId);
      }

      const query = `
        SELECT 
          a.*,
          ac.name as categoryName,
          pa.name as parentAccountName,
          pa.code as parentAccountCode,
          (SELECT COUNT(*) FROM Account WHERE parentAccountId = a.id AND deletedAt IS NULL) as childrenCount,
          COALESCE(
            CASE 
              WHEN a.normalBalance = 'debit' THEN SUM(jel.debitAmount) - SUM(jel.creditAmount)
              ELSE SUM(jel.creditAmount) - SUM(jel.debitAmount)
            END, 0
          ) as currentBalance
        FROM Account a
        LEFT JOIN AccountCategory ac ON a.categoryId = ac.id
        LEFT JOIN Account pa ON a.parentAccountId = pa.id
        LEFT JOIN JournalEntryLine jel ON a.id = jel.accountId
        LEFT JOIN JournalEntry je ON jel.journalEntryId = je.id AND je.status = 'posted'
        ${whereClause}
        GROUP BY a.id
        ORDER BY a.code
        LIMIT ? OFFSET ?
      `;

      queryParams.push(parseInt(limit), offset);
      const [accounts] = await db.query(query, queryParams);

      // عدد الحسابات الإجمالي
      const countQuery = `
        SELECT COUNT(DISTINCT a.id) as total
        FROM Account a
        LEFT JOIN AccountCategory ac ON a.categoryId = ac.id
        ${whereClause}
      `;
      const [countResult] = await db.query(countQuery, queryParams.slice(0, -2));

      res.json({
        success: true,
        data: {
          accounts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countResult[0].total,
            pages: Math.ceil(countResult[0].total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching accounts:', error);
      res.status(500).json({
        success: false,
        error: { message: 'خطأ في جلب الحسابات' }
      });
    }
  }

  /**
   * إنشاء حساب جديد
   */
  async createAccount(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { message: 'بيانات غير صحيحة', details: errors.array() }
        });
      }

      const {
        code,
        name,
        nameEn,
        categoryId,
        parentAccountId,
        accountType,
        normalBalance,
        description
      } = req.body;

      // التحقق من عدم تكرار الكود
      const [existingAccount] = await db.query(
        'SELECT id FROM Account WHERE code = ? AND deletedAt IS NULL',
        [code]
      );

      if (existingAccount.length > 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'كود الحساب موجود مسبقاً' }
        });
      }

      // تحديد المستوى بناءً على الحساب الأب
      let level = 1;
      if (parentAccountId) {
        const [parentAccount] = await db.query(
          'SELECT level FROM Account WHERE id = ? AND deletedAt IS NULL',
          [parentAccountId]
        );
        if (parentAccount.length > 0) {
          level = parentAccount[0].level + 1;
        }
      }

      const [result] = await db.query(`
        INSERT INTO Account (
          code, name, nameEn, categoryId, parentAccountId, 
          accountType, normalBalance, level, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [code, name, nameEn, categoryId, parentAccountId, accountType, normalBalance, level, description]);

      res.status(201).json({
        success: true,
        data: {
          id: result.insertId,
          message: 'تم إنشاء الحساب بنجاح'
        }
      });

    } catch (error) {
      console.error('Error creating account:', error);
      res.status(500).json({
        success: false,
        error: { message: 'خطأ في إنشاء الحساب' }
      });
    }
  }

  /**
   * تحديث حساب موجود
   */
  async updateAccount(req, res) {
    try {
      const { id } = req.params;
      const {
        code,
        name,
        nameEn,
        categoryId,
        parentAccountId,
        accountType,
        normalBalance,
        isActive,
        description
      } = req.body;

      // التحقق من وجود الحساب
      const [existingAccount] = await db.query(
        'SELECT id FROM Account WHERE id = ? AND deletedAt IS NULL',
        [id]
      );

      if (existingAccount.length === 0) {
        return res.status(404).json({
          success: false,
          error: { message: 'الحساب غير موجود' }
        });
      }

      // التحقق من عدم تكرار الكود (باستثناء الحساب الحالي)
      const [duplicateCode] = await db.query(
        'SELECT id FROM Account WHERE code = ? AND id != ? AND deletedAt IS NULL',
        [code, id]
      );

      if (duplicateCode.length > 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'كود الحساب موجود مسبقاً' }
        });
      }

      await db.query(`
        UPDATE Account SET 
          code = ?, name = ?, nameEn = ?, categoryId = ?, 
          parentAccountId = ?, accountType = ?, normalBalance = ?, 
          isActive = ?, description = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [code, name, nameEn, categoryId, parentAccountId, accountType, normalBalance, isActive, description, id]);

      res.json({
        success: true,
        data: { message: 'تم تحديث الحساب بنجاح' }
      });

    } catch (error) {
      console.error('Error updating account:', error);
      res.status(500).json({
        success: false,
        error: { message: 'خطأ في تحديث الحساب' }
      });
    }
  }

  // =====================================================
  // إدارة القيود المحاسبية (Journal Entries)
  // =====================================================

  /**
   * جلب جميع القيود المحاسبية
   */
  async getJournalEntries(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        status = '',
        dateFrom = '',
        dateTo = '',
        referenceType = ''
      } = req.query;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const queryParams = [];

      // البحث
      if (search) {
        whereClause += ` AND (je.entryNumber LIKE ? OR je.description LIKE ? OR je.reference LIKE ?)`;
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      // فلترة حسب الحالة
      if (status) {
        whereClause += ` AND je.status = ?`;
        queryParams.push(status);
      }

      // فلترة حسب التاريخ
      if (dateFrom) {
        whereClause += ` AND je.entryDate >= ?`;
        queryParams.push(dateFrom);
      }

      if (dateTo) {
        whereClause += ` AND je.entryDate <= ?`;
        queryParams.push(dateTo);
      }

      // فلترة حسب نوع المرجع
      if (referenceType) {
        whereClause += ` AND je.referenceType = ?`;
        queryParams.push(referenceType);
      }

      const query = `
        SELECT 
          je.*,
          u1.name as createdByName,
          u2.name as postedByName,
          COUNT(jel.id) as linesCount
        FROM JournalEntry je
        LEFT JOIN User u1 ON je.createdBy = u1.id
        LEFT JOIN User u2 ON je.postedBy = u2.id
        LEFT JOIN JournalEntryLine jel ON je.id = jel.journalEntryId
        ${whereClause}
        GROUP BY je.id
        ORDER BY je.entryDate DESC, je.entryNumber DESC
        LIMIT ? OFFSET ?
      `;

      queryParams.push(parseInt(limit), offset);
      const [entries] = await db.query(query, queryParams);

      // عدد القيود الإجمالي
      const countQuery = `SELECT COUNT(*) as total FROM JournalEntry je ${whereClause}`;
      const [countResult] = await db.query(countQuery, queryParams.slice(0, -2));

      res.json({
        success: true,
        data: {
          entries,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countResult[0].total,
            pages: Math.ceil(countResult[0].total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching journal entries:', error);
      res.status(500).json({
        success: false,
        error: { message: 'خطأ في جلب القيود المحاسبية' }
      });
    }
  }

  /**
   * إنشاء قيد محاسبي جديد
   */
  async createJournalEntry(req, res) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        entryDate,
        description,
        reference,
        referenceType,
        referenceId,
        lines
      } = req.body;

      // التحقق من توازن القيد
      const totalDebit = lines.reduce((sum, line) => sum + parseFloat(line.debitAmount || 0), 0);
      const totalCredit = lines.reduce((sum, line) => sum + parseFloat(line.creditAmount || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          error: { message: 'القيد غير متوازن - مجموع المدين يجب أن يساوي مجموع الدائن' }
        });
      }

      // إنشاء رقم القيد
      const [lastEntry] = await connection.query(
        'SELECT entryNumber FROM JournalEntry ORDER BY id DESC LIMIT 1'
      );
      
      let entryNumber = 'JE-001';
      if (lastEntry.length > 0) {
        const lastNumber = parseInt(lastEntry[0].entryNumber.split('-')[1]);
        entryNumber = `JE-${String(lastNumber + 1).padStart(3, '0')}`;
      }

      // إنشاء القيد الرئيسي
      const [entryResult] = await connection.query(`
        INSERT INTO JournalEntry (
          entryNumber, entryDate, description, reference, 
          referenceType, referenceId, totalDebit, totalCredit, 
          createdBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [entryNumber, entryDate, description, reference, referenceType, referenceId, totalDebit, totalCredit, req.user?.id || 1]);

      const journalEntryId = entryResult.insertId;

      // إنشاء سطور القيد
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        await connection.query(`
          INSERT INTO JournalEntryLine (
            journalEntryId, accountId, costCenterId, description,
            debitAmount, creditAmount, lineNumber
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          journalEntryId,
          line.accountId,
          line.costCenterId || null,
          line.description || '',
          line.debitAmount || 0,
          line.creditAmount || 0,
          i + 1
        ]);
      }

      await connection.commit();

      res.status(201).json({
        success: true,
        data: {
          id: journalEntryId,
          entryNumber,
          message: 'تم إنشاء القيد المحاسبي بنجاح'
        }
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error creating journal entry:', error);
      res.status(500).json({
        success: false,
        error: { message: 'خطأ في إنشاء القيد المحاسبي' }
      });
    } finally {
      connection.release();
    }
  }

  /**
   * ترحيل قيد محاسبي
   */
  async postJournalEntry(req, res) {
    try {
      const { id } = req.params;

      // التحقق من وجود القيد وحالته
      const [entry] = await db.query(
        'SELECT * FROM JournalEntry WHERE id = ? AND status = "draft"',
        [id]
      );

      if (entry.length === 0) {
        return res.status(404).json({
          success: false,
          error: { message: 'القيد غير موجود أو تم ترحيله مسبقاً' }
        });
      }

      // ترحيل القيد
      await db.query(`
        UPDATE JournalEntry SET 
          status = 'posted', 
          postedBy = ?, 
          postedAt = CURRENT_TIMESTAMP,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [req.user?.id || 1, id]);

      res.json({
        success: true,
        data: { message: 'تم ترحيل القيد بنجاح' }
      });

    } catch (error) {
      console.error('Error posting journal entry:', error);
      res.status(500).json({
        success: false,
        error: { message: 'خطأ في ترحيل القيد' }
      });
    }
  }

  // =====================================================
  // التقارير المالية (Financial Reports)
  // =====================================================

  /**
   * ميزان المراجعة
   */
  async getTrialBalance(req, res) {
    try {
      const { asOfDate = new Date().toISOString().split('T')[0] } = req.query;

      const [balances] = await db.query(`
        SELECT 
          a.code,
          a.name,
          a.accountType,
          a.normalBalance,
          COALESCE(SUM(jel.debitAmount), 0) as totalDebits,
          COALESCE(SUM(jel.creditAmount), 0) as totalCredits,
          CASE 
            WHEN a.normalBalance = 'debit' THEN COALESCE(SUM(jel.debitAmount), 0) - COALESCE(SUM(jel.creditAmount), 0)
            ELSE COALESCE(SUM(jel.creditAmount), 0) - COALESCE(SUM(jel.debitAmount), 0)
          END as balance
        FROM Account a
        LEFT JOIN JournalEntryLine jel ON a.id = jel.accountId
        LEFT JOIN JournalEntry je ON jel.journalEntryId = je.id
        WHERE a.isActive = TRUE AND a.deletedAt IS NULL
          AND (je.status = 'posted' OR je.id IS NULL)
          AND (je.entryDate <= ? OR je.id IS NULL)
        GROUP BY a.id, a.code, a.name, a.accountType, a.normalBalance
        HAVING ABS(balance) > 0.01
        ORDER BY a.code
      `, [asOfDate]);

      // حساب الإجماليات
      const totalDebits = balances.reduce((sum, acc) => sum + parseFloat(acc.totalDebits), 0);
      const totalCredits = balances.reduce((sum, acc) => sum + parseFloat(acc.totalCredits), 0);

      res.json({
        success: true,
        data: {
          balances,
          totals: {
            totalDebits,
            totalCredits,
            difference: Math.abs(totalDebits - totalCredits)
          },
          asOfDate
        }
      });

    } catch (error) {
      console.error('Error generating trial balance:', error);
      res.status(500).json({
        success: false,
        error: { message: 'خطأ في إنشاء ميزان المراجعة' }
      });
    }
  }

  /**
   * قائمة الدخل
   */
  async getIncomeStatement(req, res) {
    try {
      const {
        startDate = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate = new Date().toISOString().split('T')[0]
      } = req.query;

      const [results] = await db.query(`
        SELECT 
          a.accountType,
          a.code,
          a.name,
          CASE 
            WHEN a.accountType = 'revenue' THEN COALESCE(SUM(jel.creditAmount), 0) - COALESCE(SUM(jel.debitAmount), 0)
            WHEN a.accountType IN ('expense', 'cogs') THEN COALESCE(SUM(jel.debitAmount), 0) - COALESCE(SUM(jel.creditAmount), 0)
            ELSE 0
          END as amount
        FROM Account a
        LEFT JOIN JournalEntryLine jel ON a.id = jel.accountId
        LEFT JOIN JournalEntry je ON jel.journalEntryId = je.id
        WHERE a.accountType IN ('revenue', 'expense', 'cogs') 
          AND a.isActive = TRUE AND a.deletedAt IS NULL
          AND je.status = 'posted'
          AND je.entryDate BETWEEN ? AND ?
        GROUP BY a.id, a.accountType, a.code, a.name
        HAVING ABS(amount) > 0.01
        ORDER BY a.accountType, a.code
      `, [startDate, endDate]);

      // تجميع النتائج حسب النوع
      const revenues = results.filter(r => r.accountType === 'revenue');
      const cogs = results.filter(r => r.accountType === 'cogs');
      const expenses = results.filter(r => r.accountType === 'expense');

      const totalRevenue = revenues.reduce((sum, r) => sum + parseFloat(r.amount), 0);
      const totalCOGS = cogs.reduce((sum, r) => sum + parseFloat(r.amount), 0);
      const totalExpenses = expenses.reduce((sum, r) => sum + parseFloat(r.amount), 0);

      const grossProfit = totalRevenue - totalCOGS;
      const netIncome = grossProfit - totalExpenses;

      res.json({
        success: true,
        data: {
          revenues,
          cogs,
          expenses,
          summary: {
            totalRevenue,
            totalCOGS,
            grossProfit,
            totalExpenses,
            netIncome
          },
          period: { startDate, endDate }
        }
      });

    } catch (error) {
      console.error('Error generating income statement:', error);
      res.status(500).json({
        success: false,
        error: { message: 'خطأ في إنشاء قائمة الدخل' }
      });
    }
  }

  /**
   * قائمة المركز المالي
   */
  async getBalanceSheet(req, res) {
    try {
      const { asOfDate = new Date().toISOString().split('T')[0] } = req.query;

      const [results] = await db.query(`
        SELECT 
          a.accountType,
          a.code,
          a.name,
          CASE 
            WHEN a.normalBalance = 'debit' THEN COALESCE(SUM(jel.debitAmount), 0) - COALESCE(SUM(jel.creditAmount), 0)
            ELSE COALESCE(SUM(jel.creditAmount), 0) - COALESCE(SUM(jel.debitAmount), 0)
          END as balance
        FROM Account a
        LEFT JOIN JournalEntryLine jel ON a.id = jel.accountId
        LEFT JOIN JournalEntry je ON jel.journalEntryId = je.id
        WHERE a.accountType IN ('asset', 'liability', 'equity') 
          AND a.isActive = TRUE AND a.deletedAt IS NULL
          AND (je.status = 'posted' OR je.id IS NULL)
          AND (je.entryDate <= ? OR je.id IS NULL)
        GROUP BY a.id, a.accountType, a.code, a.name, a.normalBalance
        HAVING ABS(balance) > 0.01
        ORDER BY a.accountType, a.code
      `, [asOfDate]);

      // تجميع النتائج حسب النوع
      const assets = results.filter(r => r.accountType === 'asset');
      const liabilities = results.filter(r => r.accountType === 'liability');
      const equity = results.filter(r => r.accountType === 'equity');

      const totalAssets = assets.reduce((sum, r) => sum + parseFloat(r.balance), 0);
      const totalLiabilities = liabilities.reduce((sum, r) => sum + parseFloat(r.balance), 0);
      const totalEquity = equity.reduce((sum, r) => sum + parseFloat(r.balance), 0);

      res.json({
        success: true,
        data: {
          assets,
          liabilities,
          equity,
          totals: {
            totalAssets,
            totalLiabilities,
            totalEquity,
            totalLiabilitiesAndEquity: totalLiabilities + totalEquity
          },
          asOfDate
        }
      });

    } catch (error) {
      console.error('Error generating balance sheet:', error);
      res.status(500).json({
        success: false,
        error: { message: 'خطأ في إنشاء قائمة المركز المالي' }
      });
    }
  }

  // =====================================================
  // مراكز التكلفة (Cost Centers)
  // =====================================================

  /**
   * جلب جميع مراكز التكلفة
   */
  async getCostCenters(req, res) {
    try {
      const { type = '', isActive = '' } = req.query;
      
      let whereClause = 'WHERE cc.deletedAt IS NULL';
      const queryParams = [];

      if (type) {
        whereClause += ` AND cc.type = ?`;
        queryParams.push(type);
      }

      if (isActive !== '') {
        whereClause += ` AND cc.isActive = ?`;
        queryParams.push(isActive === 'true');
      }

      const [costCenters] = await db.query(`
        SELECT 
          cc.*,
          u.name as managerName,
          parent.name as parentName
        FROM CostCenter cc
        LEFT JOIN User u ON cc.managerId = u.id
        LEFT JOIN CostCenter parent ON cc.parentId = parent.id
        ${whereClause}
        ORDER BY cc.code
      `, queryParams);

      res.json({
        success: true,
        data: { costCenters }
      });

    } catch (error) {
      console.error('Error fetching cost centers:', error);
      res.status(500).json({
        success: false,
        error: { message: 'خطأ في جلب مراكز التكلفة' }
      });
    }
  }

  /**
   * إنشاء مركز تكلفة جديد
   */
  async createCostCenter(req, res) {
    try {
      const { code, name, nameEn, type, parentId, managerId, description } = req.body;

      // التحقق من عدم تكرار الكود
      const [existing] = await db.query(
        'SELECT id FROM CostCenter WHERE code = ? AND deletedAt IS NULL',
        [code]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'كود مركز التكلفة موجود مسبقاً' }
        });
      }

      const [result] = await db.query(`
        INSERT INTO CostCenter (code, name, nameEn, type, parentId, managerId, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [code, name, nameEn, type, parentId, managerId, description]);

      res.status(201).json({
        success: true,
        data: {
          id: result.insertId,
          message: 'تم إنشاء مركز التكلفة بنجاح'
        }
      });

    } catch (error) {
      console.error('Error creating cost center:', error);
      res.status(500).json({
        success: false,
        error: { message: 'خطأ في إنشاء مركز التكلفة' }
      });
    }
  }
}

module.exports = new AccountingController();
