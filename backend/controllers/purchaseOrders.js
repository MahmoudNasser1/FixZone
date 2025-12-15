const db = require('../db');

// Helper function to update isLowStock and StockAlert
async function updateStockAlert(connection, inventoryItemId, warehouseId, quantity, minLevel, userId) {
  const isLowStock = quantity <= minLevel;
  
  // Update isLowStock
  await connection.execute(
    'UPDATE StockLevel SET isLowStock = ? WHERE inventoryItemId = ? AND warehouseId = ?',
    [isLowStock ? 1 : 0, inventoryItemId, warehouseId]
  );
  
  // Update or create StockAlert
  if (quantity <= minLevel) {
    const alertType = quantity <= 0 ? 'out_of_stock' : 'low_stock';
    const severity = quantity <= 0 ? 'critical' : 'warning';
    const message = quantity <= 0 
      ? `الصنف منتهٍ تماماً (0 قطعة)`
      : `المخزون منخفض: ${quantity} / ${minLevel}`;
    
    // Check if alert exists
    const [existingAlert] = await connection.execute(
      'SELECT id FROM StockAlert WHERE inventoryItemId = ? AND warehouseId = ? AND status = "active"',
      [inventoryItemId, warehouseId]
    );
    
    if (existingAlert.length > 0) {
      // Update existing alert
      await connection.execute(`
        UPDATE StockAlert 
        SET alertType = ?, currentQuantity = ?, threshold = ?, severity = ?, message = ?, createdAt = NOW()
        WHERE id = ?
      `, [alertType, quantity, minLevel, severity, message, existingAlert[0].id]);
    } else {
      // Create new alert
      await connection.execute(`
        INSERT INTO StockAlert 
        (inventoryItemId, warehouseId, alertType, currentQuantity, threshold, severity, status, message, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?, NOW())
      `, [inventoryItemId, warehouseId, alertType, quantity, minLevel, severity, message]);
    }
  } else {
    // Resolve active alerts if stock is now above minLevel
    await connection.execute(`
      UPDATE StockAlert 
      SET status = 'resolved', resolvedAt = NOW()
      WHERE inventoryItemId = ? AND warehouseId = ? AND status = 'active'
    `, [inventoryItemId, warehouseId]);
  }
}

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
      items,
      warehouseId,
      receivedItems
    } = req.body;

    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // التحقق من وجود طلب الشراء
      const [purchaseOrder] = await connection.execute(
        'SELECT id, status as currentStatus FROM PurchaseOrder WHERE id = ? AND deletedAt IS NULL',
        [id]
      );

      if (!purchaseOrder.length) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ 
          success: false, 
          message: 'طلب الشراء غير موجود' 
        });
      }

      const currentStatus = purchaseOrder[0].currentStatus;
      const isStatusChangedToReceived = status === 'received' && currentStatus !== 'received';

      // تحديث طلب الشراء
      const [result] = await connection.execute(
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
        await connection.execute(
          'DELETE FROM PurchaseOrderItem WHERE purchaseOrderId = ?',
          [id]
        );

        // إضافة العناصر الجديدة
        for (const item of items) {
          const { inventoryItemId, quantity, unitPrice } = item;
          const totalPrice = quantity * unitPrice;

          await connection.execute(
            `INSERT INTO PurchaseOrderItem (
              quantity, unitPrice, totalPrice, purchaseOrderId, inventoryItemId, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [quantity, unitPrice, totalPrice, id, inventoryItemId]
          );
        }
      }

      // إذا تم تغيير الحالة إلى 'received'، تحديث المخزون
      if (isStatusChangedToReceived) {
        // الحصول على warehouseId - إما من body أو من PO أو افتراضي
        let targetWarehouseId = warehouseId;
        
        if (!targetWarehouseId) {
          // محاولة الحصول على warehouseId من PO أو استخدام المخزن الافتراضي
          const [defaultWarehouse] = await connection.execute(
            'SELECT id FROM Warehouse WHERE deletedAt IS NULL ORDER BY id LIMIT 1'
          );
          targetWarehouseId = defaultWarehouse.length > 0 ? defaultWarehouse[0].id : null;
        }

        if (!targetWarehouseId) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ 
            success: false, 
            message: 'يجب تحديد المخزن لاستلام الطلب' 
          });
        }

        // الحصول على عناصر PO
        const [poItems] = await connection.execute(
          'SELECT * FROM PurchaseOrderItem WHERE purchaseOrderId = ?',
          [id]
        );

        if (poItems.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ 
            success: false, 
            message: 'لا توجد عناصر في طلب الشراء' 
          });
        }

        const userId = req.user?.id;

        // معالجة كل عنصر
        for (const poItem of poItems) {
          const receivedQuantity = receivedItems && receivedItems.find(ri => ri.purchaseOrderItemId === poItem.id)
            ? receivedItems.find(ri => ri.purchaseOrderItemId === poItem.id).receivedQuantity
            : poItem.quantity; // إذا لم يتم تحديد receivedQuantity، استخدم الكمية المطلوبة

          // تحديث receivedQuantity في PurchaseOrderItem
          await connection.execute(
            'UPDATE PurchaseOrderItem SET receivedQuantity = ? WHERE id = ?',
            [receivedQuantity, poItem.id]
          );

          // تحديث StockLevel
          await connection.execute(
            `INSERT INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel, createdAt, updatedAt)
             VALUES (?, ?, ?, 0, NOW(), NOW())
             ON DUPLICATE KEY UPDATE
             quantity = quantity + VALUES(quantity),
             updatedAt = NOW()`,
            [poItem.inventoryItemId, targetWarehouseId, receivedQuantity]
          );

          // إنشاء StockMovement
          await connection.execute(
            `INSERT INTO StockMovement (type, quantity, inventoryItemId, toWarehouseId, userId, notes, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            ['IN', receivedQuantity, poItem.inventoryItemId, targetWarehouseId, userId, `استلام من أمر شراء #${id}`]
          );

          // الحصول على minLevel الحالي
          const [currentStock] = await connection.execute(
            'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
            [poItem.inventoryItemId, targetWarehouseId]
          );
          
          if (currentStock.length > 0) {
            // تحديث StockAlert
            await updateStockAlert(
              connection,
              poItem.inventoryItemId,
              targetWarehouseId,
              currentStock[0].quantity,
              currentStock[0].minLevel,
              userId
            );
          }
        }
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: isStatusChangedToReceived ? 'تم تحديث طلب الشراء واستلام المخزون بنجاح' : 'تم تحديث طلب الشراء بنجاح'
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
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
