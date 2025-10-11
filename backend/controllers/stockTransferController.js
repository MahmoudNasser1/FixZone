const db = require('../db');

class StockTransferController {
  // إنشاء نقل جديد
  async createStockTransfer(req, res) {
    try {
      const {
        fromWarehouseId,
        toWarehouseId,
        transferDate,
        reason,
        notes,
        items,
        createdBy
      } = req.body;

      // التحقق من المخازن
      if (fromWarehouseId === toWarehouseId) {
        return res.status(400).json({
          success: false,
          message: 'المخزن المرسل والمستقبل يجب أن يكونا مختلفين'
        });
      }

      const [warehousesResult] = await db.execute(
        'SELECT id, name FROM Warehouse WHERE id IN (?, ?)',
        [fromWarehouseId, toWarehouseId]
      );

      if (warehousesResult.length !== 2) {
        return res.status(404).json({
          success: false,
          message: 'واحد أو أكثر من المخازن غير موجود'
        });
      }

      // إنشاء رقم مرجعي
      const transferNumber = `ST-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      // إنشاء النقل (استخدام الحقول الموجودة في الجدول الفعلي)
      const [result] = await db.execute(
        `INSERT INTO StockTransfer (
          transferNumber, fromWarehouseId, toWarehouseId, transferDate, reason, notes, requestedBy, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [transferNumber, fromWarehouseId, toWarehouseId, transferDate, reason, notes, createdBy]
      );

      const stockTransferId = result.insertId;

      // إضافة العناصر (استخدام الحقول الموجودة في الجدول الفعلي)
      if (items && items.length > 0) {
        for (const item of items) {
          await db.execute(
            `INSERT INTO StockTransferItem (
              transferId, inventoryItemId, requestedQuantity, notes
            ) VALUES (?, ?, ?, ?)`,
            [
              stockTransferId,
              item.inventoryItemId,
              item.quantity,
              item.notes || ''
            ]
          );
        }
      }

      // جلب النقل المُنشأ
      const [transferResult] = await db.execute(
        `SELECT 
          st.*,
          w1.name as fromWarehouseName,
          w2.name as toWarehouseName
        FROM StockTransfer st
        LEFT JOIN Warehouse w1 ON st.fromWarehouseId = w1.id
        LEFT JOIN Warehouse w2 ON st.toWarehouseId = w2.id
        WHERE st.id = ?`,
        [stockTransferId]
      );

      res.status(201).json({
        success: true,
        message: 'تم إنشاء النقل بنجاح',
        data: transferResult[0]
      });

    } catch (error) {
      console.error('Error creating stock transfer:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في إنشاء النقل',
        error: error.message
      });
    }
  }

  // جلب جميع النقلات
  async getStockTransfers(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        fromWarehouseId,
        toWarehouseId,
        status,
        startDate,
        endDate
      } = req.query;

      let whereClause = '1=1';
      let queryParams = [];

      if (fromWarehouseId) {
        whereClause += ' AND st.fromWarehouseId = ?';
        queryParams.push(fromWarehouseId);
      }

      if (toWarehouseId) {
        whereClause += ' AND st.toWarehouseId = ?';
        queryParams.push(toWarehouseId);
      }

      if (status) {
        whereClause += ' AND st.status = ?';
        queryParams.push(status);
      }

      if (startDate) {
        whereClause += ' AND st.transferDate >= ?';
        queryParams.push(startDate);
      }

      if (endDate) {
        whereClause += ' AND st.transferDate <= ?';
        queryParams.push(endDate);
      }

      const offset = (page - 1) * limit;

      // جلب النقلات
      const [transfers] = await db.execute(
        `SELECT 
          st.*,
          w1.name as fromWarehouseName,
          w2.name as toWarehouseName
        FROM StockTransfer st
        LEFT JOIN Warehouse w1 ON st.fromWarehouseId = w1.id
        LEFT JOIN Warehouse w2 ON st.toWarehouseId = w2.id
        WHERE ${whereClause}
        ORDER BY st.createdAt DESC
        LIMIT ? OFFSET ?`,
        [...queryParams, parseInt(limit), offset]
      );

      // جلب العدد الإجمالي
      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM StockTransfer st WHERE ${whereClause}`,
        queryParams
      );

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          transfers,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Error getting stock transfers:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب النقلات',
        error: error.message
      });
    }
  }

  // جلب نقل واحد
  async getStockTransfer(req, res) {
    try {
      const { id } = req.params;

      // جلب النقل
      const [transferResult] = await db.execute(
        `SELECT 
          st.*,
          w1.name as fromWarehouseName,
          w2.name as toWarehouseName
        FROM StockTransfer st
        LEFT JOIN Warehouse w1 ON st.fromWarehouseId = w1.id
        LEFT JOIN Warehouse w2 ON st.toWarehouseId = w2.id
        WHERE st.id = ?`,
        [id]
      );

      if (transferResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'النقل غير موجود'
        });
      }

      const transfer = transferResult[0];

      // جلب عناصر النقل
      const [itemsResult] = await db.execute(
        `SELECT 
          sti.*,
          ii.name as itemName,
          ii.sku,
          ii.purchasePrice,
          ii.sellingPrice,
          ii.unit
        FROM StockTransferItem sti
        LEFT JOIN InventoryItem ii ON sti.inventoryItemId = ii.id
        WHERE sti.transferId = ?
        ORDER BY ii.name`,
        [id]
      );

      transfer.items = itemsResult;

      res.json({
        success: true,
        data: transfer
      });

    } catch (error) {
      console.error('Error getting stock transfer:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب النقل',
        error: error.message
      });
    }
  }

  // الموافقة على النقل
  async approveStockTransfer(req, res) {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;

      // التحقق من وجود النقل
      const [transferResult] = await db.execute(
        'SELECT id, status FROM StockTransfer WHERE id = ?',
        [id]
      );

      if (transferResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'النقل غير موجود'
        });
      }

      const transfer = transferResult[0];

      if (transfer.status !== 'draft') {
        return res.status(400).json({
          success: false,
          message: 'لا يمكن الموافقة على نقل في حالة ' + transfer.status
        });
      }

      // تحديث الحالة
      await db.execute(
        `UPDATE StockTransfer SET 
          status = 'approved',
          approvedBy = ?,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [approvedBy, id]
      );

      res.json({
        success: true,
        message: 'تم الموافقة على النقل بنجاح'
      });

    } catch (error) {
      console.error('Error approving stock transfer:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في الموافقة على النقل',
        error: error.message
      });
    }
  }

  // شحن النقل
  async shipStockTransfer(req, res) {
    try {
      const { id } = req.params;
      const { shippedBy } = req.body;

      // التحقق من وجود النقل
      const [transferResult] = await db.execute(
        'SELECT id, status FROM StockTransfer WHERE id = ?',
        [id]
      );

      if (transferResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'النقل غير موجود'
        });
      }

      const transfer = transferResult[0];

      if (transfer.status !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'لا يمكن شحن نقل في حالة ' + transfer.status
        });
      }

      // تحديث الحالة
      await db.execute(
        `UPDATE StockTransfer SET 
          status = 'shipped',
          shippedBy = ?,
          shippedAt = CURRENT_TIMESTAMP,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [shippedBy, id]
      );

      res.json({
        success: true,
        message: 'تم شحن النقل بنجاح'
      });

    } catch (error) {
      console.error('Error shipping stock transfer:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في شحن النقل',
        error: error.message
      });
    }
  }

  // استلام النقل
  async receiveStockTransfer(req, res) {
    try {
      const { id } = req.params;
      const { receivedBy } = req.body;

      // التحقق من وجود النقل
      const [transferResult] = await db.execute(
        'SELECT id, status FROM StockTransfer WHERE id = ?',
        [id]
      );

      if (transferResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'النقل غير موجود'
        });
      }

      const transfer = transferResult[0];

      if (transfer.status !== 'shipped') {
        return res.status(400).json({
          success: false,
          message: 'لا يمكن استلام نقل في حالة ' + transfer.status
        });
      }

      // تحديث الحالة
      await db.execute(
        `UPDATE StockTransfer SET 
          status = 'received',
          receivedBy = ?,
          receivedAt = CURRENT_TIMESTAMP,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [receivedBy, id]
      );

      // تحديث المخزون
      await this.updateStockLevels(id);

      res.json({
        success: true,
        message: 'تم استلام النقل بنجاح'
      });

    } catch (error) {
      console.error('Error receiving stock transfer:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في استلام النقل',
        error: error.message
      });
    }
  }

  // إكمال النقل
  async completeStockTransfer(req, res) {
    try {
      const { id } = req.params;

      // التحقق من وجود النقل
      const [transferResult] = await db.execute(
        'SELECT id, status FROM StockTransfer WHERE id = ?',
        [id]
      );

      if (transferResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'النقل غير موجود'
        });
      }

      const transfer = transferResult[0];

      if (transfer.status !== 'received') {
        return res.status(400).json({
          success: false,
          message: 'لا يمكن إكمال نقل في حالة ' + transfer.status
        });
      }

      // تحديث الحالة
      await db.execute(
        `UPDATE StockTransfer SET 
          status = 'completed',
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [id]
      );

      res.json({
        success: true,
        message: 'تم إكمال النقل بنجاح'
      });

    } catch (error) {
      console.error('Error completing stock transfer:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في إكمال النقل',
        error: error.message
      });
    }
  }

  // تحديث مستويات المخزون
  async updateStockLevels(stockTransferId) {
    try {
      // جلب بيانات النقل
      const [transferResult] = await db.execute(
        'SELECT fromWarehouseId, toWarehouseId FROM StockTransfer WHERE id = ?',
        [stockTransferId]
      );

      if (transferResult.length === 0) return;

      const { fromWarehouseId, toWarehouseId } = transferResult[0];

      // جلب عناصر النقل
      const [itemsResult] = await db.execute(
        'SELECT inventoryItemId, quantity FROM StockTransferItem WHERE stockTransferId = ?',
        [stockTransferId]
      );

      // تحديث المخزون لكل عنصر
      for (const item of itemsResult) {
        // خصم من المخزن المرسل
        await db.execute(
          `UPDATE StockLevel SET 
            currentQuantity = currentQuantity - ?,
            availableQuantity = availableQuantity - ?,
            updatedAt = CURRENT_TIMESTAMP
          WHERE inventoryItemId = ? AND warehouseId = ?`,
          [item.quantity, item.quantity, item.inventoryItemId, fromWarehouseId]
        );

        // إضافة للمخزن المستقبل
        await db.execute(
          `INSERT INTO StockLevel (
            inventoryItemId, warehouseId, currentQuantity, availableQuantity, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON DUPLICATE KEY UPDATE
            currentQuantity = currentQuantity + VALUES(currentQuantity),
            availableQuantity = availableQuantity + VALUES(availableQuantity),
            updatedAt = CURRENT_TIMESTAMP`,
          [item.inventoryItemId, toWarehouseId, item.quantity, item.quantity]
        );

        // إنشاء StockMovement للمخزن المرسل
        await db.execute(
          `INSERT INTO StockMovement (
            inventoryItemId, warehouseId, movementType, quantity, referenceType, referenceId, createdAt
          ) VALUES (?, ?, 'transfer_out', ?, 'stock_transfer', ?, CURRENT_TIMESTAMP)`,
          [item.inventoryItemId, fromWarehouseId, -item.quantity, stockTransferId]
        );

        // إنشاء StockMovement للمخزن المستقبل
        await db.execute(
          `INSERT INTO StockMovement (
            inventoryItemId, warehouseId, movementType, quantity, referenceType, referenceId, createdAt
          ) VALUES (?, ?, 'transfer_in', ?, 'stock_transfer', ?, CURRENT_TIMESTAMP)`,
          [item.inventoryItemId, toWarehouseId, item.quantity, stockTransferId]
        );
      }

    } catch (error) {
      console.error('Error updating stock levels:', error);
    }
  }

  // حذف النقل
  async deleteStockTransfer(req, res) {
    try {
      const { id } = req.params;

      // التحقق من وجود النقل
      const [transferResult] = await db.execute(
        'SELECT id, status FROM StockTransfer WHERE id = ?',
        [id]
      );

      if (transferResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'النقل غير موجود'
        });
      }

      const transfer = transferResult[0];

      if (transfer.status === 'completed' || transfer.status === 'received') {
        return res.status(400).json({
          success: false,
          message: 'لا يمكن حذف نقل مكتمل أو مستلم'
        });
      }

      // Hard delete (جدول StockTransfer لا يحتوي على deletedAt)
      await db.execute(
        'DELETE FROM StockTransfer WHERE id = ?',
        [id]
      );

      // حذف العناصر المرتبطة
      await db.execute(
        'DELETE FROM StockTransferItem WHERE transferId = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'تم حذف النقل بنجاح'
      });

    } catch (error) {
      console.error('Error deleting stock transfer:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في حذف النقل',
        error: error.message
      });
    }
  }

  // إحصائيات النقل
  async getStockTransferStats(req, res) {
    try {
      const [statsResult] = await db.execute(
        `SELECT 
          COUNT(*) as totalTransfers,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedTransfers,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approvedTransfers,
          SUM(CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END) as inTransitTransfers,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingTransfers
        FROM StockTransfer`
      );

      res.json({
        success: true,
        data: statsResult[0]
      });

    } catch (error) {
      console.error('Error getting stock transfer stats:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب إحصائيات النقل',
        error: error.message
      });
    }
  }
}

module.exports = new StockTransferController();

