const db = require('../../db');

// إدارة الموردين
const vendorController = {
  // الحصول على جميع الموردين مع البحث والفلترة والترقيم
  async getAllVendors(req, res) {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = '',
      sortBy = 'name',
      sortOrder = 'ASC'
    } = req.query;
    
    const offset = (page - 1) * limit;

    try {
      let query = `
        SELECT 
          v.*,
          COUNT(po.id) as totalOrders,
          COALESCE(SUM(CASE WHEN po.status = 'pending' THEN 1 ELSE 0 END), 0) as pendingOrders,
          COALESCE(SUM(po.totalAmount), 0) as totalOrderValue
        FROM Vendor v
        LEFT JOIN PurchaseOrder po ON v.id = po.vendorId AND po.deletedAt IS NULL
        WHERE v.deletedAt IS NULL
      `;

      const params = [];
      
      if (search) {
        query += ` AND (
          v.name LIKE ? OR
          v.email LIKE ? OR
          v.phone LIKE ? OR
          v.contactPerson LIKE ?
        )`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }
      
      if (status) {
        query += ` AND v.status = ?`;
        params.push(status);
      }

      query += ` GROUP BY v.id`;
      
      // إضافة الترتيب
      const allowedSortFields = ['name', 'email', 'createdAt', 'totalOrders', 'totalOrderValue'];
      const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
      const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';
      
      query += ` ORDER BY ${validSortBy} ${validSortOrder}`;
      query += ` LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      const [vendors] = await db.promise().execute(query, params);

      // عد الإجمالي
      let countQuery = `
        SELECT COUNT(DISTINCT v.id) as total
        FROM Vendor v
        WHERE v.deletedAt IS NULL
      `;
      
      const countParams = [];
      if (search) {
        countQuery += ` AND (
          v.name LIKE ? OR
          v.email LIKE ? OR
          v.phone LIKE ? OR
          v.contactPerson LIKE ?
        )`;
        const searchPattern = `%${search}%`;
        countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }
      
      if (status) {
        countQuery += ` AND v.status = ?`;
        countParams.push(status);
      }

      const [countResult] = await db.promise().execute(countQuery, countParams);
      const totalItems = countResult[0].total;

      res.json({
        success: true,
        data: {
          vendors,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalItems,
            totalPages: Math.ceil(totalItems / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get vendors error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'خطأ في جلب الموردين',
        error: error.message 
      });
    }
  },

  // الحصول على مورد واحد بالتفاصيل
  async getVendorById(req, res) {
    const { id } = req.params;

    try {
      const [vendor] = await db.promise().execute(
        `SELECT 
          v.*,
          COUNT(po.id) as totalOrders,
          COALESCE(SUM(po.totalAmount), 0) as totalOrderValue,
          COALESCE(AVG(po.totalAmount), 0) as avgOrderValue
        FROM Vendor v
        LEFT JOIN PurchaseOrder po ON v.id = po.vendorId AND po.deletedAt IS NULL
        WHERE v.id = ? AND v.deletedAt IS NULL
        GROUP BY v.id`,
        [id]
      );

      if (!vendor.length) {
        return res.status(404).json({ 
          success: false, 
          message: 'المورد غير موجود' 
        });
      }

      // جلب آخر 5 طلبات شراء
      const [recentOrders] = await db.promise().execute(
        `SELECT 
          id,
          orderNumber,
          orderDate,
          expectedDeliveryDate,
          totalAmount,
          status
        FROM PurchaseOrder 
        WHERE vendorId = ? AND deletedAt IS NULL
        ORDER BY orderDate DESC 
        LIMIT 5`,
        [id]
      );

      res.json({
        success: true,
        data: {
          vendor: vendor[0],
          recentOrders
        }
      });

    } catch (error) {
      console.error('Get vendor by ID error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'خطأ في جلب بيانات المورد',
        error: error.message 
      });
    }
  },

  // إنشاء مورد جديد
  async createVendor(req, res) {
    const {
      name,
      email,
      phone,
      contactPerson,
      address,
      taxNumber,
      paymentTerms = 'net30',
      creditLimit = 0,
      notes,
      status = 'active'
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!name || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'اسم المورد والهاتف مطلوبان' 
      });
    }

    try {
      // التحقق من عدم تكرار البريد الإلكتروني أو الهاتف
      const [existing] = await db.promise().execute(
        'SELECT id FROM Vendor WHERE (email = ? OR phone = ?) AND deletedAt IS NULL',
        [email, phone]
      );

      if (existing.length) {
        return res.status(400).json({ 
          success: false, 
          message: 'البريد الإلكتروني أو الهاتف موجود مسبقاً' 
        });
      }

      const [result] = await db.promise().execute(
        `INSERT INTO Vendor (
          name, email, phone, contactPerson, address, 
          taxNumber, paymentTerms, creditLimit, notes, 
          status, createdBy, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          name, email, phone, contactPerson, address,
          taxNumber, paymentTerms, creditLimit, notes,
          status, req.user?.id
        ]
      );

      res.status(201).json({
        success: true,
        message: 'تم إنشاء المورد بنجاح',
        data: { id: result.insertId }
      });

    } catch (error) {
      console.error('Create vendor error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'خطأ في إنشاء المورد',
        error: error.message 
      });
    }
  },

  // تحديث مورد
  async updateVendor(req, res) {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      contactPerson,
      address,
      taxNumber,
      paymentTerms,
      creditLimit,
      notes,
      status
    } = req.body;

    try {
      // التحقق من وجود المورد
      const [vendor] = await db.promise().execute(
        'SELECT id FROM Vendor WHERE id = ? AND deletedAt IS NULL',
        [id]
      );

      if (!vendor.length) {
        return res.status(404).json({ 
          success: false, 
          message: 'المورد غير موجود' 
        });
      }

      // التحقق من عدم تكرار البريد الإلكتروني أو الهاتف مع موردين آخرين
      if (email || phone) {
        const [existing] = await db.promise().execute(
          'SELECT id FROM Vendor WHERE (email = ? OR phone = ?) AND id != ? AND deletedAt IS NULL',
          [email, phone, id]
        );

        if (existing.length) {
          return res.status(400).json({ 
            success: false, 
            message: 'البريد الإلكتروني أو الهاتف موجود مع مورد آخر' 
          });
        }
      }

      const [result] = await db.promise().execute(
        `UPDATE Vendor SET 
          name = COALESCE(?, name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          contactPerson = COALESCE(?, contactPerson),
          address = COALESCE(?, address),
          taxNumber = COALESCE(?, taxNumber),
          paymentTerms = COALESCE(?, paymentTerms),
          creditLimit = COALESCE(?, creditLimit),
          notes = COALESCE(?, notes),
          status = COALESCE(?, status),
          updatedAt = NOW()
        WHERE id = ? AND deletedAt IS NULL`,
        [
          name, email, phone, contactPerson, address,
          taxNumber, paymentTerms, creditLimit, notes,
          status, id
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'المورد غير موجود' 
        });
      }

      res.json({
        success: true,
        message: 'تم تحديث المورد بنجاح'
      });

    } catch (error) {
      console.error('Update vendor error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'خطأ في تحديث المورد',
        error: error.message 
      });
    }
  },

  // حذف مورد (soft delete)
  async deleteVendor(req, res) {
    const { id } = req.params;

    try {
      // التحقق من وجود طلبات شراء مفتوحة
      const [openOrders] = await db.promise().execute(
        'SELECT COUNT(*) as count FROM PurchaseOrder WHERE vendorId = ? AND status IN ("pending", "approved") AND deletedAt IS NULL',
        [id]
      );

      if (openOrders[0].count > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'لا يمكن حذف المورد لوجود طلبات شراء مفتوحة' 
        });
      }

      const [result] = await db.promise().execute(
        'UPDATE Vendor SET deletedAt = NOW() WHERE id = ? AND deletedAt IS NULL',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'المورد غير موجود' 
        });
      }

      res.json({
        success: true,
        message: 'تم حذف المورد بنجاح'
      });

    } catch (error) {
      console.error('Delete vendor error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'خطأ في حذف المورد',
        error: error.message 
      });
    }
  },

  // الحصول على إحصائيات الموردين
  async getVendorStats(req, res) {
    try {
      // إحصائيات عامة
      const [stats] = await db.promise().execute(`
        SELECT 
          COUNT(*) as totalVendors,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as activeVendors,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactiveVendors,
          COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as newVendorsThisMonth
        FROM Vendor 
        WHERE deletedAt IS NULL
      `);

      // أفضل الموردين حسب قيمة الطلبات
      const [topVendors] = await db.promise().execute(`
        SELECT 
          v.id,
          v.name,
          COUNT(po.id) as totalOrders,
          COALESCE(SUM(po.totalAmount), 0) as totalValue
        FROM Vendor v
        LEFT JOIN PurchaseOrder po ON v.id = po.vendorId AND po.deletedAt IS NULL
        WHERE v.deletedAt IS NULL
        GROUP BY v.id
        ORDER BY totalValue DESC
        LIMIT 5
      `);

      res.json({
        success: true,
        data: {
          overview: stats[0],
          topVendors
        }
      });

    } catch (error) {
      console.error('Get vendor stats error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'خطأ في جلب إحصائيات الموردين',
        error: error.message 
      });
    }
  },

  // تغيير حالة المورد
  async updateVendorStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'حالة غير صالحة' 
      });
    }

    try {
      const [result] = await db.promise().execute(
        'UPDATE Vendor SET status = ?, updatedAt = NOW() WHERE id = ? AND deletedAt IS NULL',
        [status, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'المورد غير موجود' 
        });
      }

      res.json({
        success: true,
        message: `تم ${status === 'active' ? 'تفعيل' : 'إلغاء تفعيل'} المورد بنجاح`
      });

    } catch (error) {
      console.error('Update vendor status error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'خطأ في تحديث حالة المورد',
        error: error.message 
      });
    }
  }
};

module.exports = vendorController;