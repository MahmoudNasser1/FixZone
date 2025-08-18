const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accountingController');
const { body } = require('express-validator');

// =====================================================
// مسارات دليل الحسابات (Chart of Accounts)
// =====================================================

// جلب جميع الحسابات مع الفلترة والبحث
router.get('/accounts', accountingController.getAccounts);

// إنشاء حساب جديد
router.post('/accounts', [
  body('code').notEmpty().withMessage('كود الحساب مطلوب'),
  body('name').notEmpty().withMessage('اسم الحساب مطلوب'),
  body('categoryId').isInt().withMessage('فئة الحساب مطلوبة'),
  body('accountType').isIn(['asset', 'liability', 'equity', 'revenue', 'expense', 'cogs']).withMessage('نوع الحساب غير صحيح'),
  body('normalBalance').isIn(['debit', 'credit']).withMessage('الرصيد الطبيعي غير صحيح')
], accountingController.createAccount);

// تحديث حساب موجود
router.put('/accounts/:id', [
  body('code').notEmpty().withMessage('كود الحساب مطلوب'),
  body('name').notEmpty().withMessage('اسم الحساب مطلوب'),
  body('categoryId').isInt().withMessage('فئة الحساب مطلوبة'),
  body('accountType').isIn(['asset', 'liability', 'equity', 'revenue', 'expense', 'cogs']).withMessage('نوع الحساب غير صحيح'),
  body('normalBalance').isIn(['debit', 'credit']).withMessage('الرصيد الطبيعي غير صحيح')
], accountingController.updateAccount);

// حذف حساب (soft delete)
router.delete('/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // التحقق من عدم وجود قيود محاسبية للحساب
    const db = require('../../db');
    const [entries] = await db.query(
      'SELECT COUNT(*) as count FROM JournalEntryLine WHERE accountId = ?',
      [id]
    );
    
    if (entries[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'لا يمكن حذف الحساب لوجود قيود محاسبية مرتبطة به' }
      });
    }
    
    await db.query(
      'UPDATE Account SET deletedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      data: { message: 'تم حذف الحساب بنجاح' }
    });
    
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطأ في حذف الحساب' }
    });
  }
});

// =====================================================
// مسارات القيود المحاسبية (Journal Entries)
// =====================================================

// جلب جميع القيود المحاسبية
router.get('/journal-entries', accountingController.getJournalEntries);

// جلب تفاصيل قيد محاسبي محدد
router.get('/journal-entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../../db');
    
    // جلب بيانات القيد الرئيسي
    const [entries] = await db.query(`
      SELECT 
        je.*,
        u1.name as createdByName,
        u2.name as postedByName,
        u3.name as reversedByName
      FROM JournalEntry je
      LEFT JOIN User u1 ON je.createdBy = u1.id
      LEFT JOIN User u2 ON je.postedBy = u2.id
      LEFT JOIN User u3 ON je.reversedBy = u3.id
      WHERE je.id = ?
    `, [id]);
    
    if (entries.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'القيد المحاسبي غير موجود' }
      });
    }
    
    // جلب سطور القيد
    const [lines] = await db.query(`
      SELECT 
        jel.*,
        a.code as accountCode,
        a.name as accountName,
        cc.code as costCenterCode,
        cc.name as costCenterName
      FROM JournalEntryLine jel
      LEFT JOIN Account a ON jel.accountId = a.id
      LEFT JOIN CostCenter cc ON jel.costCenterId = cc.id
      WHERE jel.journalEntryId = ?
      ORDER BY jel.lineNumber
    `, [id]);
    
    res.json({
      success: true,
      data: {
        entry: entries[0],
        lines
      }
    });
    
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب القيد المحاسبي' }
    });
  }
});

// إنشاء قيد محاسبي جديد
router.post('/journal-entries', [
  body('entryDate').isDate().withMessage('تاريخ القيد مطلوب'),
  body('description').notEmpty().withMessage('وصف القيد مطلوب'),
  body('lines').isArray({ min: 2 }).withMessage('يجب أن يحتوي القيد على سطرين على الأقل'),
  body('lines.*.accountId').isInt().withMessage('رقم الحساب مطلوب'),
  body('lines.*.debitAmount').optional().isFloat({ min: 0 }).withMessage('مبلغ المدين غير صحيح'),
  body('lines.*.creditAmount').optional().isFloat({ min: 0 }).withMessage('مبلغ الدائن غير صحيح')
], accountingController.createJournalEntry);

// ترحيل قيد محاسبي
router.patch('/journal-entries/:id/post', accountingController.postJournalEntry);

// عكس قيد محاسبي
router.patch('/journal-entries/:id/reverse', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const db = require('../../db');
    
    // التحقق من وجود القيد وحالته
    const [entry] = await db.query(
      'SELECT * FROM JournalEntry WHERE id = ? AND status = "posted"',
      [id]
    );
    
    if (entry.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'القيد غير موجود أو لم يتم ترحيله' }
      });
    }
    
    // عكس القيد
    await db.query(`
      UPDATE JournalEntry SET 
        status = 'reversed', 
        reversedBy = ?, 
        reversedAt = CURRENT_TIMESTAMP,
        description = CONCAT(description, ' - تم العكس: ', ?),
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [req.user?.id || 1, reason || 'بدون سبب محدد', id]);
    
    res.json({
      success: true,
      data: { message: 'تم عكس القيد بنجاح' }
    });
    
  } catch (error) {
    console.error('Error reversing journal entry:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطأ في عكس القيد' }
    });
  }
});

// =====================================================
// مسارات التقارير المالية (Financial Reports)
// =====================================================

// ميزان المراجعة
router.get('/reports/trial-balance', accountingController.getTrialBalance);

// قائمة الدخل
router.get('/reports/income-statement', accountingController.getIncomeStatement);

// قائمة المركز المالي
router.get('/reports/balance-sheet', accountingController.getBalanceSheet);

// تقرير حركة الحساب
router.get('/reports/account-ledger/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const db = require('../../db');
    
    let whereClause = 'WHERE jel.accountId = ? AND je.status = "posted"';
    const queryParams = [accountId];
    
    if (startDate) {
      whereClause += ' AND je.entryDate >= ?';
      queryParams.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND je.entryDate <= ?';
      queryParams.push(endDate);
    }
    
    // جلب بيانات الحساب
    const [account] = await db.query(
      'SELECT * FROM Account WHERE id = ? AND deletedAt IS NULL',
      [accountId]
    );
    
    if (account.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'الحساب غير موجود' }
      });
    }
    
    // جلب حركات الحساب
    const [movements] = await db.query(`
      SELECT 
        je.entryDate,
        je.entryNumber,
        je.description,
        je.reference,
        jel.description as lineDescription,
        jel.debitAmount,
        jel.creditAmount,
        cc.name as costCenterName
      FROM JournalEntryLine jel
      JOIN JournalEntry je ON jel.journalEntryId = je.id
      LEFT JOIN CostCenter cc ON jel.costCenterId = cc.id
      ${whereClause}
      ORDER BY je.entryDate, je.entryNumber, jel.lineNumber
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), offset]);
    
    // حساب الرصيد الجاري
    let runningBalance = 0;
    const movementsWithBalance = movements.map(movement => {
      if (account[0].normalBalance === 'debit') {
        runningBalance += parseFloat(movement.debitAmount) - parseFloat(movement.creditAmount);
      } else {
        runningBalance += parseFloat(movement.creditAmount) - parseFloat(movement.debitAmount);
      }
      
      return {
        ...movement,
        balance: runningBalance
      };
    });
    
    // عدد الحركات الإجمالي
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM JournalEntryLine jel
      JOIN JournalEntry je ON jel.journalEntryId = je.id
      ${whereClause}
    `, queryParams);
    
    res.json({
      success: true,
      data: {
        account: account[0],
        movements: movementsWithBalance,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Error generating account ledger:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطأ في إنشاء كشف حساب' }
    });
  }
});

// =====================================================
// مسارات مراكز التكلفة (Cost Centers)
// =====================================================

// جلب جميع مراكز التكلفة
router.get('/cost-centers', accountingController.getCostCenters);

// إنشاء مركز تكلفة جديد
router.post('/cost-centers', [
  body('code').notEmpty().withMessage('كود مركز التكلفة مطلوب'),
  body('name').notEmpty().withMessage('اسم مركز التكلفة مطلوب'),
  body('type').isIn(['revenue', 'service', 'support']).withMessage('نوع مركز التكلفة غير صحيح')
], accountingController.createCostCenter);

// تحديث مركز تكلفة
router.put('/cost-centers/:id', [
  body('code').notEmpty().withMessage('كود مركز التكلفة مطلوب'),
  body('name').notEmpty().withMessage('اسم مركز التكلفة مطلوب'),
  body('type').isIn(['revenue', 'service', 'support']).withMessage('نوع مركز التكلفة غير صحيح')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, nameEn, type, parentId, managerId, isActive, description } = req.body;
    const db = require('../../db');
    
    // التحقق من وجود مركز التكلفة
    const [existing] = await db.query(
      'SELECT id FROM CostCenter WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'مركز التكلفة غير موجود' }
      });
    }
    
    // التحقق من عدم تكرار الكود
    const [duplicateCode] = await db.query(
      'SELECT id FROM CostCenter WHERE code = ? AND id != ? AND deletedAt IS NULL',
      [code, id]
    );
    
    if (duplicateCode.length > 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'كود مركز التكلفة موجود مسبقاً' }
      });
    }
    
    await db.query(`
      UPDATE CostCenter SET 
        code = ?, name = ?, nameEn = ?, type = ?, 
        parentId = ?, managerId = ?, isActive = ?, 
        description = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [code, name, nameEn, type, parentId, managerId, isActive, description, id]);
    
    res.json({
      success: true,
      data: { message: 'تم تحديث مركز التكلفة بنجاح' }
    });
    
  } catch (error) {
    console.error('Error updating cost center:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطأ في تحديث مركز التكلفة' }
    });
  }
});

// حذف مركز تكلفة
router.delete('/cost-centers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../../db');
    
    // التحقق من عدم وجود قيود محاسبية لمركز التكلفة
    const [entries] = await db.query(
      'SELECT COUNT(*) as count FROM JournalEntryLine WHERE costCenterId = ?',
      [id]
    );
    
    if (entries[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'لا يمكن حذف مركز التكلفة لوجود قيود محاسبية مرتبطة به' }
      });
    }
    
    await db.query(
      'UPDATE CostCenter SET deletedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      data: { message: 'تم حذف مركز التكلفة بنجاح' }
    });
    
  } catch (error) {
    console.error('Error deleting cost center:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطأ في حذف مركز التكلفة' }
    });
  }
});

// =====================================================
// مسارات فئات الحسابات (Account Categories)
// =====================================================

// جلب جميع فئات الحسابات
router.get('/account-categories', async (req, res) => {
  try {
    const db = require('../../db');
    const [categories] = await db.query(`
      SELECT 
        ac.*,
        COUNT(a.id) as accountsCount
      FROM AccountCategory ac
      LEFT JOIN Account a ON ac.id = a.categoryId AND a.deletedAt IS NULL
      WHERE ac.deletedAt IS NULL
      GROUP BY ac.id
      ORDER BY ac.code
    `);
    
    res.json({
      success: true,
      data: { categories }
    });
    
  } catch (error) {
    console.error('Error fetching account categories:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب فئات الحسابات' }
    });
  }
});

// =====================================================
// مسارات الإحصائيات والملخصات
// =====================================================

// إحصائيات النظام المحاسبي
router.get('/dashboard-stats', async (req, res) => {
  try {
    const db = require('../../db');
    
    // إحصائيات الحسابات
    const [accountStats] = await db.query(`
      SELECT 
        accountType,
        COUNT(*) as count
      FROM Account 
      WHERE isActive = TRUE AND deletedAt IS NULL
      GROUP BY accountType
    `);
    
    // إحصائيات القيود
    const [entryStats] = await db.query(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(totalDebit) as totalAmount
      FROM JournalEntry
      WHERE YEAR(entryDate) = YEAR(CURRENT_DATE)
      GROUP BY status
    `);
    
    // إحصائيات مراكز التكلفة
    const [costCenterStats] = await db.query(`
      SELECT 
        type,
        COUNT(*) as count
      FROM CostCenter 
      WHERE isActive = TRUE AND deletedAt IS NULL
      GROUP BY type
    `);
    
    res.json({
      success: true,
      data: {
        accounts: accountStats,
        journalEntries: entryStats,
        costCenters: costCenterStats
      }
    });
    
  } catch (error) {
    console.error('Error fetching accounting dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب إحصائيات النظام المحاسبي' }
    });
  }
});

module.exports = router;
