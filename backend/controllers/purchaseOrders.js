const db = require('../db');

// إدارة طلبات الشراء
const purchaseOrderController = {
  // الحصول على جميع طلبات الشراء مع البحث والفلترة والترقيم
  async getAllPurchaseOrders(req, res) {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = '',
      vendorId = '',
      approvalStatus = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;
    
    const offset = (page - 1) * limit;

    try {
      let query = `
        SELECT 
          po.*,
          v.name as vendorName,
          v.email as vendorEmail,
          v.phone as vendorPhone,
          u.name as approvedByName,
          COUNT(poi.id) as itemCount,
          COALESCE(SUM(poi.totalPrice), 0) as totalAmount
        FROM PurchaseOrder po
        LEFT JOIN Vendor v ON po.vendorId = v.id AND v.deletedAt IS NULL
        LEFT JOIN User u ON po.approvedById = u.id
        LEFT JOIN PurchaseOrderItem poi ON po.id = poi.purchaseOrderId
        WHERE po.deletedAt IS NULL
      `;

      const params = [];
      
      if (search) {
        query += ` AND (
          po.status LIKE ? OR
          v.name LIKE ? OR
          v.email LIKE ? OR
          v.phone LIKE ?
        )`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }
      
      if (status) {
        query += ` AND po.status = ?`;
        params.push(status);
      }

      if (vendorId) {
        query += ` AND po.vendorId = ?`;
        params.push(vendorId);
      }

      if (approvalStatus) {
        query += ` AND po.approvalStatus = ?`;
        params.push(approvalStatus);
      }

      query += ` GROUP BY po.id`;
      
      // إضافة الترتيب
      const allowedSortFields = ['createdAt', 'updatedAt', 'approvalDate', 'totalAmount', 'vendorName'];
      const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
      
      query += ` ORDER BY ${validSortBy} ${validSortOrder}`;
      query += ` LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      // CRITICAL: Use db.query instead of db.execute for queries with LIMIT/OFFSET
      // db.execute uses prepared statements which cause issues with LIMIT/OFFSET in MariaDB strict mode
      // db.query interpolates values directly and works perfectly with LIMIT/OFFSET
      const [purchaseOrders] = await db.query(query, params);

      // عد الإجمالي
      let countQuery = `
        SELECT COUNT(DISTINCT po.id) as total
        FROM PurchaseOrder po
        LEFT JOIN Vendor v ON po.vendorId = v.id AND v.deletedAt IS NULL
        WHERE po.deletedAt IS NULL
      `;
      
      const countParams = [];
      if (search) {
        countQuery += ` AND (
          po.status LIKE ? OR
          v.name LIKE ? OR
          v.email LIKE ? OR
          v.phone LIKE ?
        )`;
        const searchPattern = `%${search}%`;
        countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }
      
      if (status) {
        countQuery += ` AND po.status = ?`;
        countParams.push(status);
      }

      if (vendorId) {
        countQuery += ` AND po.vendorId = ?`;
        countParams.push(vendorId);
      }

      if (approvalStatus) {
        countQuery += ` AND po.approvalStatus = ?`;
        countParams.push(approvalStatus);
      }

      const [countResult] = await db.execute(countQuery, countParams);
      const totalItems = countResult[0].total;

      res.json({
        success: true,
        data: {
          purchaseOrders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalItems,
            totalPages: Math.ceil(totalItems / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get purchase orders error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'خطأ في جلب طلبات الشراء',
        error: error.message 
      });
    }
  },

  // الحصول على طلب شراء واحد بالتفاصيل
  async getPurchaseOrderById(req, res) {
    const { id } = req.params;

    try {
      const [purchaseOrder] = await db.execute(
        `SELECT 
          po.*,
          v.name as vendorName,
          v.email as vendorEmail,
          v.phone as vendorPhone,
          v.address as vendorAddress,
          v.contactPerson as vendorContactPerson,
          u.name as approvedByName,
          creator.name as createdByName
        FROM PurchaseOrder po
        LEFT JOIN Vendor v ON po.vendorId = v.id AND v.deletedAt IS NULL
        LEFT JOIN User u ON po.approvedById = u.id
        LEFT JOIN User creator ON po.createdBy = creator.id
        WHERE po.id = ? AND po.deletedAt IS NULL`,
        [id]
      );

      if (!purchaseOrder.length) {
        return res.status(404).json({ 
          success: false, 
          message: 'طلب الشراء غير موجود' 
        });
      }

      // جلب عناصر طلب الشراء
      const [items] = await db.execute(
        `SELECT 
          poi.*,
          ii.name as itemName,
          ii.description as itemDescription,
          ii.sku as itemSku,
          ii.unit as itemUnit
        FROM PurchaseOrderItem poi
        LEFT JOIN InventoryItem ii ON poi.inventoryItemId = ii.id
        WHERE poi.purchaseOrderId = ?
        ORDER BY poi.id`,
        [id]
      );

      res.json({
        success: true,
        data: {
          purchaseOrder: purchaseOrder[0],
          items
        }
      });

    } catch (error) {
      console.error('Get purchase order by ID error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'خطأ في جلب بيانات طلب الشراء',
        error: error.message 
      });
    }
  },

  // إنشاء طلب شراء جديد
  async createPurchaseOrder(req, res) {
    const {
      status = 'draft',
      vendorId,
      orderNumber,
      orderDate,
      expectedDeliveryDate,
      notes,
      approvalStatus = 'PENDING',
      items = []
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!vendorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'معرف المورد مطلوب' 
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'يجب إضافة عنصر واحد على الأقل' 
      });
    }

    try {
      // التحقق من وجود المورد
      const [vendor] = await db.execute(
        'SELECT id FROM Vendor WHERE id = ? AND deletedAt IS NULL',
        [vendorId]
      );

      if (!vendor.length) {
        return res.status(400).json({ 
          success: false, 
          message: 'المورد غير موجود' 
        });
      }

      // بدء المعاملة
      await db.execute('START TRANSACTION');

      try {
        // إنشاء طلب الشراء
        const [result] = await db.execute(
          `INSERT INTO PurchaseOrder (
            status, vendorId, orderNumber, orderDate, expectedDeliveryDate, notes, 
            approvalStatus, createdBy, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [status, vendorId, orderNumber, orderDate, expectedDeliveryDate || null, notes, approvalStatus, req.user?.id]
        );

        const purchaseOrderId = result.insertId;

        // إضافة عناصر طلب الشراء
        for (const item of items) {
          const { inventoryItemId, quantity, unitPrice } = item;
          
          if (!inventoryItemId || !quantity || !unitPrice) {
            // حذف طلب الشراء إذا فشل إضافة العناصر
            await db.execute('DELETE FROM PurchaseOrder WHERE id = ?', [purchaseOrderId]);
            await db.execute('ROLLBACK');
            return res.status(400).json({ 
              success: false, 
              message: 'جميع حقول العنصر مطلوبة (معرف الصنف، الكمية، السعر)' 
            });
          }

          const totalPrice = quantity * unitPrice;

          await db.execute(
            `INSERT INTO PurchaseOrderItem (
              quantity, unitPrice, totalPrice, purchaseOrderId, inventoryItemId, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [quantity, unitPrice, totalPrice, purchaseOrderId, inventoryItemId]
          );
        }

        await db.execute('COMMIT');

        res.status(201).json({
          success: true,
          message: 'تم إنشاء طلب الشراء بنجاح',
          data: { id: purchaseOrderId }
        });
      } catch (transactionError) {
        await db.execute('ROLLBACK');
        throw transactionError;
      }

    } catch (error) {
      console.error('Create purchase order error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'خطأ في إنشاء طلب الشراء',
        error: error.message 
      });
    }
  },

  // تحديث طلب شراء
  async updatePurchaseOrder(req, res) {
    const { id } = req.params;
    const {
      status,
      vendorId,
      orderNumber,
      orderDate,
      expectedDeliveryDate,
      notes,
      approvalStatus,
      approvedById,
      approvalDate,
      items
    } = req.body;

    try {
      // التحقق من وجود طلب الشراء
      const [purchaseOrder] = await db.execute(
        'SELECT id FROM PurchaseOrder WHERE id = ? AND deletedAt IS NULL',
        [id]
      );

      if (!purchaseOrder.length) {
        return res.status(404).json({ 
          success: false, 
          message: 'طلب الشراء غير موجود' 
        });
      }

      // بدء المعاملة
      await db.execute('START TRANSACTION');

      // تحديث طلب الشراء
      const [result] = await db.execute(
        `UPDATE PurchaseOrder SET 
          status = COALESCE(?, status),
          vendorId = COALESCE(?, vendorId),
          orderNumber = COALESCE(?, orderNumber),
          orderDate = COALESCE(?, orderDate),
          expectedDeliveryDate = COALESCE(?, expectedDeliveryDate),
          notes = COALESCE(?, notes),
          approvalStatus = COALESCE(?, approvalStatus),
          approvedById = COALESCE(?, approvedById),
          approvalDate = COALESCE(?, approvalDate),
          updatedAt = NOW()
        WHERE id = ? AND deletedAt IS NULL`,
        [status, vendorId, orderNumber, orderDate, expectedDeliveryDate, notes, approvalStatus, approvedById, approvalDate, id]
      );

      // تحديث العناصر إذا تم توفيرها
      if (items && items.length > 0) {
        // حذف العناصر القديمة
        await db.execute(
          'DELETE FROM PurchaseOrderItem WHERE purchaseOrderId = ?',
          [id]
        );

        // إضافة العناصر الجديدة
        for (const item of items) {
          const { inventoryItemId, quantity, unitPrice } = item;
          const totalPrice = quantity * unitPrice;

          await db.execute(
            `INSERT INTO PurchaseOrderItem (
              quantity, unitPrice, totalPrice, purchaseOrderId, inventoryItemId, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [quantity, unitPrice, totalPrice, id, inventoryItemId]
          );
        }
      }

      await db.execute('COMMIT');

      res.json({
        success: true,
        message: 'تم تحديث طلب الشراء بنجاح'
      });

    } catch (error) {
      await db.execute('ROLLBACK');
      console.error('Update purchase order error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'خطأ في تحديث طلب الشراء',
        error: error.message 
      });
    }
  },

  // موافقة على طلب شراء
  async approvePurchaseOrder(req, res) {
    const { id } = req.params;
    const { approvedById, approvalDate } = req.body;

    try {
      // استخدام المستخدم الحالي إذا لم يتم إرسال approvedById
      // req.user يأتي من authMiddleware ويحتوي على decoded JWT مع id
      const userId = approvedById || req.user?.id;
      const approvalDateTime = approvalDate ? new Date(approvalDate) : new Date();

      if (!userId) {
        console.error('Approve purchase order - No user ID found:', { 
          approvedById, 
          reqUser: req.user,
          userId 
        });
        return res.status(400).json({ 
          success: false, 
          message: 'معرف المستخدم مطلوب' 
        });
      }

      const [result] = await db.execute(
        `UPDATE PurchaseOrder SET 
          approvalStatus = 'APPROVED',
          approvedById = ?,
          approvalDate = ?,
          updatedAt = NOW()
        WHERE id = ? AND deletedAt IS NULL`,
        [userId, approvalDateTime, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'طلب الشراء غير موجود' 
        });
      }

      res.json({
        success: true,
        message: 'تم الموافقة على طلب الشراء بنجاح'
      });

    } catch (error) {
      console.error('Approve purchase order error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'خطأ في الموافقة على طلب الشراء',
        error: error.message 
      });
    }
  },

  // رفض طلب شراء
  async rejectPurchaseOrder(req, res) {
    const { id } = req.params;
    const { approvedById, approvalDate } = req.body;

    try {
      // استخدام المستخدم الحالي إذا لم يتم إرسال approvedById
      // req.user يأتي من authMiddleware ويحتوي على decoded JWT
      const userId = approvedById || req.user?.id || req.user?.userId || req.user?.user?.id;
      const approvalDateTime = approvalDate ? new Date(approvalDate) : new Date();

      if (!userId) {
        console.error('Reject purchase order - No user ID found:', { 
          approvedById, 
          reqUser: req.user,
          userId 
        });
        return res.status(400).json({ 
          success: false, 
          message: 'معرف المستخدم مطلوب' 
        });
      }

      const [result] = await db.execute(
        `UPDATE PurchaseOrder SET 
          approvalStatus = 'REJECTED',
          approvedById = ?,
          approvalDate = ?,
          updatedAt = NOW()
        WHERE id = ? AND deletedAt IS NULL`,
        [userId, approvalDateTime, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'طلب الشراء غير موجود' 
        });
      }

      res.json({
        success: true,
        message: 'تم رفض طلب الشراء بنجاح'
      });

    } catch (error) {
      console.error('Reject purchase order error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'خطأ في رفض طلب الشراء',
        error: error.message 
      });
    }
  },

  // حذف طلب شراء (soft delete)
  async deletePurchaseOrder(req, res) {
    const { id } = req.params;

    try {
      const [result] = await db.execute(
        'UPDATE PurchaseOrder SET deletedAt = NOW() WHERE id = ? AND deletedAt IS NULL',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'طلب الشراء غير موجود' 
        });
      }

      res.json({
        success: true,
        message: 'تم حذف طلب الشراء بنجاح'
      });

    } catch (error) {
      console.error('Delete purchase order error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'خطأ في حذف طلب الشراء',
        error: error.message 
      });
    }
  },

  // الحصول على إحصائيات طلبات الشراء
  async getPurchaseOrderStats(req, res) {
    try {
      // إحصائيات عامة
      const [stats] = await db.execute(`
        SELECT 
          COUNT(*) as totalOrders,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) as draftOrders,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingOrders,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approvedOrders,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedOrders,
          COUNT(CASE WHEN approvalStatus = 'PENDING' THEN 1 END) as pendingApproval,
          COUNT(CASE WHEN approvalStatus = 'APPROVED' THEN 1 END) as approved,
          COUNT(CASE WHEN approvalStatus = 'REJECTED' THEN 1 END) as rejected,
          COALESCE(SUM(
            (SELECT SUM(poi.totalPrice) FROM PurchaseOrderItem poi WHERE poi.purchaseOrderId = po.id)
          ), 0) as totalValue
        FROM PurchaseOrder po
        WHERE po.deletedAt IS NULL
      `);

      // أفضل الموردين حسب قيمة الطلبات
      const [topVendors] = await db.execute(`
        SELECT 
          v.id,
          v.name,
          COUNT(po.id) as totalOrders,
          COALESCE(SUM(
            (SELECT SUM(poi.totalPrice) FROM PurchaseOrderItem poi WHERE poi.purchaseOrderId = po.id)
          ), 0) as totalValue
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
      console.error('Get purchase order stats error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'خطأ في جلب إحصائيات طلبات الشراء',
        error: error.message 
      });
    }
  }
};

module.exports = purchaseOrderController;
