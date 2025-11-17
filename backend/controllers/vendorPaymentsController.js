const db = require('../db');

// Helper function: تحويل undefined إلى null
const cleanUndefined = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === undefined ? null : v])
  );
};

// Helper function: إنشاء رقم دفعة فريد
const generatePaymentNumber = async () => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // البحث عن آخر رقم دفعة في نفس الشهر
  const [lastPayment] = await db.execute(
    `SELECT paymentNumber FROM VendorPayment 
     WHERE paymentNumber LIKE ? 
     ORDER BY id DESC LIMIT 1`,
    [`VP-${year}${month}-%`]
  );
  
  let sequence = 1;
  if (lastPayment.length > 0) {
    const lastNumber = lastPayment[0].paymentNumber;
    const lastSequence = parseInt(lastNumber.split('-')[2] || '0');
    sequence = lastSequence + 1;
  }
  
  return `VP-${year}${month}-${String(sequence).padStart(4, '0')}`;
};

// إدارة مدفوعات الموردين
const vendorPaymentsController = {
  // جلب جميع مدفوعات مورد معين
  async getVendorPayments(req, res) {
    const { vendorId } = req.params;
    const {
      page = 1,
      limit = 10,
      status = '',
      paymentMethod = '',
      dateFrom = '',
      dateTo = ''
    } = req.query;

    const offset = (page - 1) * limit;

    try {
      // التحقق من وجود المورد
      const [vendor] = await db.execute(
        'SELECT id FROM Vendor WHERE id = ? AND deletedAt IS NULL',
        [vendorId]
      );

      if (!vendor.length) {
        return res.status(404).json({
          success: false,
          message: 'المورد غير موجود'
        });
      }

      let query = `
        SELECT 
          vp.*,
          u.name as createdByName,
          po.orderNumber as purchaseOrderNumber
        FROM VendorPayment vp
        LEFT JOIN User u ON vp.createdBy = u.id
        LEFT JOIN PurchaseOrder po ON vp.purchaseOrderId = po.id
        WHERE vp.vendorId = ?
      `;

      const params = [vendorId];

      if (status) {
        query += ` AND vp.status = ?`;
        params.push(status);
      }

      if (paymentMethod) {
        query += ` AND vp.paymentMethod = ?`;
        params.push(paymentMethod);
      }

      if (dateFrom) {
        query += ` AND vp.paymentDate >= ?`;
        params.push(dateFrom);
      }

      if (dateTo) {
        query += ` AND vp.paymentDate <= ?`;
        params.push(dateTo);
      }

      query += ` ORDER BY vp.paymentDate DESC, vp.createdAt DESC`;
      query += ` LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      const [payments] = await db.execute(query, params);

      // عد الإجمالي
      let countQuery = `
        SELECT COUNT(*) as total
        FROM VendorPayment
        WHERE vendorId = ?
      `;

      const countParams = [vendorId];

      if (status) {
        countQuery += ` AND status = ?`;
        countParams.push(status);
      }

      if (paymentMethod) {
        countQuery += ` AND paymentMethod = ?`;
        countParams.push(paymentMethod);
      }

      if (dateFrom) {
        countQuery += ` AND paymentDate >= ?`;
        countParams.push(dateFrom);
      }

      if (dateTo) {
        countQuery += ` AND paymentDate <= ?`;
        countParams.push(dateTo);
      }

      const [countResult] = await db.execute(countQuery, countParams);
      const totalItems = countResult[0].total;

      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalItems,
            totalPages: Math.ceil(totalItems / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get vendor payments error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب مدفوعات المورد',
        error: error.message
      });
    }
  },

  // جلب دفعة واحدة
  async getVendorPaymentById(req, res) {
    const { vendorId, id } = req.params;

    try {
      const [payment] = await db.execute(
        `SELECT 
          vp.*,
          u.name as createdByName,
          po.orderNumber as purchaseOrderNumber,
          po.totalAmount as purchaseOrderAmount
        FROM VendorPayment vp
        LEFT JOIN User u ON vp.createdBy = u.id
        LEFT JOIN PurchaseOrder po ON vp.purchaseOrderId = po.id
        WHERE vp.id = ? AND vp.vendorId = ?`,
        [id, vendorId]
      );

      if (!payment.length) {
        return res.status(404).json({
          success: false,
          message: 'الدفعة غير موجودة'
        });
      }

      res.json({
        success: true,
        data: {
          payment: payment[0]
        }
      });

    } catch (error) {
      console.error('Get vendor payment by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب بيانات الدفعة',
        error: error.message
      });
    }
  },

  // تسجيل دفعة جديدة
  async createVendorPayment(req, res) {
    const { vendorId } = req.params;
    const {
      purchaseOrderId,
      amount,
      paymentMethod = 'cash',
      paymentDate,
      referenceNumber,
      bankName,
      checkNumber,
      notes,
      status = 'pending'
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!amount || !paymentDate) {
      return res.status(400).json({
        success: false,
        message: 'المبلغ وتاريخ الدفع مطلوبان'
      });
    }

    // التحقق من طريقة الدفع
    const validPaymentMethods = ['cash', 'bank_transfer', 'check', 'credit_card'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'طريقة الدفع غير صالحة'
      });
    }

    // التحقق من الحالة
    const validStatuses = ['pending', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'حالة الدفع غير صالحة'
      });
    }

    try {
      // التحقق من وجود المورد
      const [vendor] = await db.execute(
        'SELECT id FROM Vendor WHERE id = ? AND deletedAt IS NULL',
        [vendorId]
      );

      if (!vendor.length) {
        return res.status(404).json({
          success: false,
          message: 'المورد غير موجود'
        });
      }

      // التحقق من وجود طلب الشراء (إن وُجد)
      if (purchaseOrderId) {
        const [purchaseOrder] = await db.execute(
          'SELECT id FROM PurchaseOrder WHERE id = ? AND vendorId = ? AND deletedAt IS NULL',
          [purchaseOrderId, vendorId]
        );

        if (!purchaseOrder.length) {
          return res.status(400).json({
            success: false,
            message: 'طلب الشراء غير موجود أو لا ينتمي لهذا المورد'
          });
        }
      }

      // إنشاء رقم دفعة فريد
      const paymentNumber = await generatePaymentNumber();

      // تنظيف البيانات
      const cleanData = cleanUndefined({
        vendorId,
        purchaseOrderId: purchaseOrderId || null,
        paymentNumber,
        amount: parseFloat(amount),
        paymentMethod,
        paymentDate,
        referenceNumber: referenceNumber || null,
        bankName: bankName || null,
        checkNumber: checkNumber || null,
        notes: notes || null,
        status,
        createdBy: req.user?.id || null
      });

      const [result] = await db.execute(
        `INSERT INTO VendorPayment (
          vendorId, purchaseOrderId, paymentNumber, amount, paymentMethod,
          paymentDate, referenceNumber, bankName, checkNumber, notes,
          status, createdBy, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          cleanData.vendorId,
          cleanData.purchaseOrderId,
          cleanData.paymentNumber,
          cleanData.amount,
          cleanData.paymentMethod,
          cleanData.paymentDate,
          cleanData.referenceNumber,
          cleanData.bankName,
          cleanData.checkNumber,
          cleanData.notes,
          cleanData.status,
          cleanData.createdBy
        ]
      );

      // جلب الدفعة بعد الإنشاء
      const [newPayment] = await db.execute(
        `SELECT 
          vp.*,
          u.name as createdByName,
          po.orderNumber as purchaseOrderNumber
        FROM VendorPayment vp
        LEFT JOIN User u ON vp.createdBy = u.id
        LEFT JOIN PurchaseOrder po ON vp.purchaseOrderId = po.id
        WHERE vp.id = ?`,
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        message: 'تم تسجيل الدفعة بنجاح',
        data: {
          payment: newPayment[0]
        }
      });

    } catch (error) {
      console.error('Create vendor payment error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تسجيل الدفعة',
        error: error.message
      });
    }
  },

  // تحديث دفعة
  async updateVendorPayment(req, res) {
    const { vendorId, id } = req.params;
    const {
      amount,
      paymentMethod,
      paymentDate,
      referenceNumber,
      bankName,
      checkNumber,
      notes,
      status
    } = req.body;

    try {
      // التحقق من وجود الدفعة
      const [payment] = await db.execute(
        'SELECT id, status FROM VendorPayment WHERE id = ? AND vendorId = ?',
        [id, vendorId]
      );

      if (!payment.length) {
        return res.status(404).json({
          success: false,
          message: 'الدفعة غير موجودة'
        });
      }

      // التحقق من طريقة الدفع (إن وُجدت)
      if (paymentMethod) {
        const validPaymentMethods = ['cash', 'bank_transfer', 'check', 'credit_card'];
        if (!validPaymentMethods.includes(paymentMethod)) {
          return res.status(400).json({
            success: false,
            message: 'طريقة الدفع غير صالحة'
          });
        }
      }

      // التحقق من الحالة (إن وُجدت)
      if (status) {
        const validStatuses = ['pending', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            message: 'حالة الدفع غير صالحة'
          });
        }
      }

      // تنظيف البيانات
      const cleanData = cleanUndefined({
        amount: amount ? parseFloat(amount) : null,
        paymentMethod: paymentMethod || null,
        paymentDate: paymentDate || null,
        referenceNumber: referenceNumber || null,
        bankName: bankName || null,
        checkNumber: checkNumber || null,
        notes: notes || null,
        status: status || null
      });

      // بناء الاستعلام التحديث
      const updateFields = [];
      const updateParams = [];

      if (cleanData.amount !== null) {
        updateFields.push('amount = ?');
        updateParams.push(cleanData.amount);
      }

      if (cleanData.paymentMethod !== null) {
        updateFields.push('paymentMethod = ?');
        updateParams.push(cleanData.paymentMethod);
      }

      if (cleanData.paymentDate !== null) {
        updateFields.push('paymentDate = ?');
        updateParams.push(cleanData.paymentDate);
      }

      if (cleanData.referenceNumber !== null) {
        updateFields.push('referenceNumber = ?');
        updateParams.push(cleanData.referenceNumber);
      }

      if (cleanData.bankName !== null) {
        updateFields.push('bankName = ?');
        updateParams.push(cleanData.bankName);
      }

      if (cleanData.checkNumber !== null) {
        updateFields.push('checkNumber = ?');
        updateParams.push(cleanData.checkNumber);
      }

      if (cleanData.notes !== null) {
        updateFields.push('notes = ?');
        updateParams.push(cleanData.notes);
      }

      if (cleanData.status !== null) {
        updateFields.push('status = ?');
        updateParams.push(cleanData.status);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'لا توجد بيانات للتحديث'
        });
      }

      updateParams.push(id, vendorId);

      const [result] = await db.execute(
        `UPDATE VendorPayment SET 
          ${updateFields.join(', ')}
        WHERE id = ? AND vendorId = ?`,
        updateParams
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'الدفعة غير موجودة'
        });
      }

      // جلب الدفعة بعد التحديث
      const [updatedPayment] = await db.execute(
        `SELECT 
          vp.*,
          u.name as createdByName,
          po.orderNumber as purchaseOrderNumber
        FROM VendorPayment vp
        LEFT JOIN User u ON vp.createdBy = u.id
        LEFT JOIN PurchaseOrder po ON vp.purchaseOrderId = po.id
        WHERE vp.id = ?`,
        [id]
      );

      res.json({
        success: true,
        message: 'تم تحديث الدفعة بنجاح',
        data: {
          payment: updatedPayment[0]
        }
      });

    } catch (error) {
      console.error('Update vendor payment error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تحديث الدفعة',
        error: error.message
      });
    }
  },

  // حذف دفعة
  async deleteVendorPayment(req, res) {
    const { vendorId, id } = req.params;

    try {
      const [result] = await db.execute(
        'DELETE FROM VendorPayment WHERE id = ? AND vendorId = ?',
        [id, vendorId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'الدفعة غير موجودة'
        });
      }

      res.json({
        success: true,
        message: 'تم حذف الدفعة بنجاح'
      });

    } catch (error) {
      console.error('Delete vendor payment error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في حذف الدفعة',
        error: error.message
      });
    }
  },

  // حساب الرصيد المستحق
  async getVendorBalance(req, res) {
    const { vendorId } = req.params;

    try {
      // التحقق من وجود المورد
      const [vendor] = await db.execute(
        'SELECT id, creditLimit FROM Vendor WHERE id = ? AND deletedAt IS NULL',
        [vendorId]
      );

      if (!vendor.length) {
        return res.status(404).json({
          success: false,
          message: 'المورد غير موجود'
        });
      }

      // حساب إجمالي طلبات الشراء المستحقة
      const [totalPurchases] = await db.execute(
        `SELECT 
          COALESCE(SUM(poi.totalPrice), 0) as totalAmount
        FROM PurchaseOrder po
        LEFT JOIN PurchaseOrderItem poi ON po.id = poi.purchaseOrderId
        WHERE po.vendorId = ? 
        AND po.status IN ('approved', 'received', 'pending')
        AND po.deletedAt IS NULL`,
        [vendorId]
      );

      // حساب إجمالي المدفوعات المكتملة
      const [totalPayments] = await db.execute(
        `SELECT 
          COALESCE(SUM(amount), 0) as totalAmount
        FROM VendorPayment
        WHERE vendorId = ? 
        AND status = 'completed'`,
        [vendorId]
      );

      const totalPurchasesAmount = parseFloat(totalPurchases[0].totalAmount || 0);
      const totalPaymentsAmount = parseFloat(totalPayments[0].totalAmount || 0);
      const balance = totalPurchasesAmount - totalPaymentsAmount;
      const creditLimit = parseFloat(vendor[0].creditLimit || 0);
      const creditUtilization = creditLimit > 0 ? (balance / creditLimit) * 100 : 0;

      res.json({
        success: true,
        data: {
          totalPurchases: totalPurchasesAmount,
          totalPayments: totalPaymentsAmount,
          balance: balance,
          creditLimit: creditLimit,
          creditUtilization: creditUtilization,
          isOverLimit: balance > creditLimit && creditLimit > 0
        }
      });

    } catch (error) {
      console.error('Get vendor balance error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في حساب الرصيد المستحق',
        error: error.message
      });
    }
  },

  // جلب إحصائيات المدفوعات
  async getVendorPaymentStats(req, res) {
    const { vendorId } = req.params;
    const { year, month } = req.query;

    try {
      // التحقق من وجود المورد
      const [vendor] = await db.execute(
        'SELECT id FROM Vendor WHERE id = ? AND deletedAt IS NULL',
        [vendorId]
      );

      if (!vendor.length) {
        return res.status(404).json({
          success: false,
          message: 'المورد غير موجود'
        });
      }

      let dateFilter = '';
      const params = [vendorId];

      if (year && month) {
        dateFilter = ' AND YEAR(paymentDate) = ? AND MONTH(paymentDate) = ?';
        params.push(year, month);
      } else if (year) {
        dateFilter = ' AND YEAR(paymentDate) = ?';
        params.push(year);
      }

      // إجمالي المدفوعات
      const [totalStats] = await db.execute(
        `SELECT 
          COUNT(*) as totalPayments,
          COALESCE(SUM(amount), 0) as totalAmount,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedPayments,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingPayments,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelledPayments,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as completedAmount
        FROM VendorPayment
        WHERE vendorId = ? ${dateFilter}`,
        params
      );

      // إحصائيات حسب طريقة الدفع
      const [methodStats] = await db.execute(
        `SELECT 
          paymentMethod,
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as totalAmount
        FROM VendorPayment
        WHERE vendorId = ? AND status = 'completed' ${dateFilter}
        GROUP BY paymentMethod`,
        params
      );

      // إحصائيات الشهر الحالي
      const [monthlyStats] = await db.execute(
        `SELECT 
          COUNT(*) as totalPayments,
          COALESCE(SUM(amount), 0) as totalAmount
        FROM VendorPayment
        WHERE vendorId = ? 
        AND status = 'completed'
        AND YEAR(paymentDate) = YEAR(CURDATE())
        AND MONTH(paymentDate) = MONTH(CURDATE())`,
        [vendorId]
      );

      res.json({
        success: true,
        data: {
          overview: totalStats[0],
          byMethod: methodStats,
          thisMonth: monthlyStats[0]
        }
      });

    } catch (error) {
      console.error('Get vendor payment stats error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب إحصائيات المدفوعات',
        error: error.message
      });
    }
  },

  // تحديث حالة الدفعة
  async updatePaymentStatus(req, res) {
    const { vendorId, id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'حالة الدفع غير صالحة'
      });
    }

    try {
      const [result] = await db.execute(
        'UPDATE VendorPayment SET status = ? WHERE id = ? AND vendorId = ?',
        [status, id, vendorId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'الدفعة غير موجودة'
        });
      }

      res.json({
        success: true,
        message: `تم ${status === 'completed' ? 'إكمال' : status === 'cancelled' ? 'إلغاء' : 'تحديث حالة'} الدفعة بنجاح`
      });

    } catch (error) {
      console.error('Update payment status error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تحديث حالة الدفعة',
        error: error.message
      });
    }
  }
};

module.exports = vendorPaymentsController;

