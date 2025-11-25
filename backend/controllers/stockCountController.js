const db = require('../db');

class StockCountController {
  // إنشاء جرد جديد
  async createStockCount(req, res) {
    try {
      const {
        warehouseId,
        countDate,
        type = 'full',
        notes,
        countedBy
      } = req.body;

      // التحقق من وجود المخزن
      const [warehouseResult] = await db.execute(
        'SELECT id, name FROM Warehouse WHERE id = ?',
        [warehouseId]
      );

      if (warehouseResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'المخزن غير موجود'
        });
      }

      // إنشاء رقم مرجعي
      const countNumber = `SC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      // إنشاء الجرد
      const [result] = await db.execute(
        `INSERT INTO StockCount (
          countNumber, warehouseId, countDate, type, notes, countedBy, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'scheduled')`,
        [countNumber, warehouseId, countDate, type, notes, countedBy]
      );

      const stockCountId = result.insertId;

      // جلب الجرد المُنشأ
      const [stockCountResult] = await db.execute(
        `SELECT 
          sc.*,
          w.name as warehouseName
        FROM StockCount sc
        LEFT JOIN Warehouse w ON sc.warehouseId = w.id
        WHERE sc.id = ?`,
        [stockCountId]
      );

      res.status(201).json({
        success: true,
        message: 'تم إنشاء الجرد بنجاح',
        data: stockCountResult[0]
      });

    } catch (error) {
      console.error('Error creating stock count:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في إنشاء الجرد',
        error: error.message
      });
    }
  }

  // جلب جميع الجردات
  async getStockCounts(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        warehouseId,
        status,
        startDate,
        endDate
      } = req.query;

      let whereClause = '1=1';
      let queryParams = [];

      if (warehouseId) {
        whereClause += ' AND sc.warehouseId = ?';
        queryParams.push(warehouseId);
      }

      if (status) {
        whereClause += ' AND sc.status = ?';
        queryParams.push(status);
      }

      if (startDate) {
        whereClause += ' AND sc.countDate >= ?';
        queryParams.push(startDate);
      }

      if (endDate) {
        whereClause += ' AND sc.countDate <= ?';
        queryParams.push(endDate);
      }

      const offset = (page - 1) * limit;

      // جلب الجردات
      // CRITICAL: Use db.query instead of db.execute for queries with LIMIT/OFFSET
      // db.execute uses prepared statements which cause issues with LIMIT/OFFSET in MariaDB strict mode
      // db.query interpolates values directly and works perfectly with LIMIT/OFFSET
      const [stockCounts] = await db.query(
        `SELECT 
          sc.*,
          w.name as warehouseName,
          COUNT(sci.id) as itemsCount
        FROM StockCount sc
        LEFT JOIN Warehouse w ON sc.warehouseId = w.id
        LEFT JOIN StockCountItem sci ON sc.id = sci.stockCountId
        WHERE ${whereClause}
        GROUP BY sc.id
        ORDER BY sc.createdAt DESC
        LIMIT ? OFFSET ?`,
        [...queryParams, parseInt(limit), offset]
      );

      // جلب العدد الإجمالي
      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM StockCount sc WHERE ${whereClause}`,
        queryParams
      );

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          stockCounts,
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
      console.error('Error getting stock counts:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب الجردات',
        error: error.message
      });
    }
  }

  // جلب جرد واحد
  async getStockCount(req, res) {
    try {
      const { id } = req.params;

      // جلب الجرد
      const [stockCountResult] = await db.execute(
        `SELECT 
          sc.*,
          w.name as warehouseName
        FROM StockCount sc
        LEFT JOIN Warehouse w ON sc.warehouseId = w.id
        WHERE sc.id = ?`,
        [id]
      );

      if (stockCountResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'الجرد غير موجود'
        });
      }

      const stockCount = stockCountResult[0];

      // جلب عناصر الجرد
      const [itemsResult] = await db.execute(
        `SELECT 
          sci.*,
          ii.name as itemName,
          ii.sku,
          ii.purchasePrice,
          ii.sellingPrice,
          ii.type as unit
        FROM StockCountItem sci
        LEFT JOIN InventoryItem ii ON sci.inventoryItemId = ii.id
        WHERE sci.stockCountId = ?
        ORDER BY ii.name`,
        [id]
      );

      stockCount.items = itemsResult;

      res.json({
        success: true,
        data: stockCount
      });

    } catch (error) {
      console.error('Error getting stock count:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب الجرد',
        error: error.message
      });
    }
  }

  // إضافة عنصر للجرد
  async addStockCountItem(req, res) {
    try {
      const { id } = req.params;
      const {
        inventoryItemId,
        countedQuantity,
        notes
      } = req.body;

      // التحقق من وجود الجرد
      const [stockCountResult] = await db.execute(
        'SELECT id, status FROM StockCount WHERE id = ?',
        [id]
      );

      if (stockCountResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'الجرد غير موجود'
        });
      }

      const stockCount = stockCountResult[0];

      if (stockCount.status !== 'scheduled' && stockCount.status !== 'in_progress') {
        return res.status(400).json({
          success: false,
          message: 'لا يمكن تعديل جرد في حالة ' + stockCount.status
        });
      }

      // التحقق من وجود الصنف
      const [itemResult] = await db.execute(
        'SELECT id, name, sku FROM InventoryItem WHERE id = ? AND deletedAt IS NULL',
        [inventoryItemId]
      );

      if (itemResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'الصنف غير موجود'
        });
      }

      // جلب الكمية في النظام
      const [stockLevelResult] = await db.execute(
        `SELECT COALESCE(SUM(currentQuantity), 0) as systemQuantity
         FROM StockLevel 
         WHERE inventoryItemId = ? AND warehouseId = (SELECT warehouseId FROM StockCount WHERE id = ?)`,
        [inventoryItemId, id]
      );

      const systemQuantity = stockLevelResult[0].systemQuantity;
      const variance = countedQuantity - systemQuantity;

      // إضافة أو تحديث عنصر الجرد
      const [result] = await db.execute(
        `INSERT INTO StockCountItem (
          stockCountId, inventoryItemId, systemQuantity, countedQuantity, variance, notes
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          countedQuantity = VALUES(countedQuantity),
          variance = VALUES(variance),
          notes = VALUES(notes),
          updatedAt = CURRENT_TIMESTAMP`,
        [id, inventoryItemId, systemQuantity, countedQuantity, variance, notes]
      );

      // تحديث إحصائيات الجرد
      await this.updateStockCountStats(id);

      res.json({
        success: true,
        message: 'تم إضافة العنصر للجرد بنجاح',
        data: {
          id: result.insertId || result.affectedRows,
          inventoryItemId,
          systemQuantity,
          countedQuantity,
          variance
        }
      });

    } catch (error) {
      console.error('Error adding stock count item:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في إضافة العنصر للجرد',
        error: error.message
      });
    }
  }

  // تحديث حالة الجرد
  async updateStockCountStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reviewedBy, approvedBy, adjustedBy } = req.body;

      const validStatuses = ['scheduled', 'in_progress', 'pending_review', 'approved', 'completed', 'cancelled'];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'حالة غير صحيحة'
        });
      }

      // التحقق من وجود الجرد
      const [stockCountResult] = await db.execute(
        'SELECT id, status FROM StockCount WHERE id = ?',
        [id]
      );

      if (stockCountResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'الجرد غير موجود'
        });
      }

      // تحديث الحالة
      const updateFields = ['status = ?'];
      const updateValues = [status];

      if (status === 'in_progress' && !stockCountResult[0].actualStartTime) {
        updateFields.push('actualStartTime = CURRENT_TIMESTAMP');
      }

      if (status === 'pending_review' && reviewedBy) {
        updateFields.push('reviewedBy = ?');
        updateValues.push(reviewedBy);
      }

      if (status === 'approved' && approvedBy) {
        updateFields.push('approvedBy = ?');
        updateValues.push(approvedBy);
      }

      if (status === 'completed') {
        updateFields.push('completedAt = CURRENT_TIMESTAMP');
        if (adjustedBy) {
          updateFields.push('adjustedBy = ?');
          updateValues.push(adjustedBy);
        }
        
        // تحديث StockLevel تلقائياً عند completion
        const connection = await db.getConnection();
        try {
          await connection.beginTransaction();
          
          // جلب بيانات الجرد (warehouseId)
          const [stockCountData] = await connection.execute(
            'SELECT warehouseId FROM StockCount WHERE id = ?',
            [id]
          );
          
          if (stockCountData.length > 0) {
            const warehouseId = stockCountData[0].warehouseId;
            
            // جلب جميع StockCountItems التي تم تسجيلها
            const [items] = await connection.execute(
              `SELECT 
                sci.inventoryItemId,
                sci.systemQuantity,
                sci.countedQuantity,
                sci.actualQuantity,
                sci.variance,
                sci.status
              FROM StockCountItem sci
              WHERE sci.stockCountId = ? AND sci.status = 'adjusted'`,
              [id]
            );
            
            // تحديث StockLevel لكل عنصر
            for (const item of items) {
              if (item.actualQuantity !== null && item.actualQuantity !== undefined) {
                const actualQty = parseInt(item.actualQuantity);
                const systemQty = parseInt(item.systemQuantity || 0);
                const difference = actualQty - systemQty;
                
                if (difference !== 0) {
                  // تحديث StockLevel
                  const [existingStock] = await connection.execute(
                    'SELECT id, quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
                    [item.inventoryItemId, warehouseId]
                  );
                  
                  if (existingStock.length > 0) {
                    const newQuantity = actualQty;
                    const minLevel = existingStock[0].minLevel || 0;
                    const isLowStock = newQuantity <= minLevel;
                    
                    await connection.execute(
                      `UPDATE StockLevel 
                       SET quantity = ?, isLowStock = ?, updatedAt = NOW() 
                       WHERE id = ?`,
                      [newQuantity, isLowStock ? 1 : 0, existingStock[0].id]
                    );
                    
                    // إنشاء StockMovement (ADJUSTMENT)
                    await connection.execute(`
                      INSERT INTO StockMovement 
                      (inventoryItemId, warehouseId, type, quantity, userId, referenceType, referenceId, createdAt)
                      VALUES (?, ?, 'ADJUSTMENT', ?, ?, 'stock_count', ?, NOW())
                    `, [
                      item.inventoryItemId,
                      warehouseId,
                      Math.abs(difference),
                      adjustedBy || req.user?.id,
                      id
                    ]);
                    
                    // تحديث StockAlert تلقائياً
                    if (newQuantity <= minLevel) {
                      const alertType = newQuantity <= 0 ? 'out_of_stock' : 'low_stock';
                      const severity = newQuantity <= 0 ? 'critical' : 'warning';
                      const message = newQuantity <= 0 
                        ? `الصنف منتهٍ تماماً (0 قطعة)`
                        : `المخزون منخفض: ${newQuantity} / ${minLevel}`;
                      
                      // Check if alert exists
                      const [existingAlert] = await connection.execute(
                        'SELECT id FROM StockAlert WHERE inventoryItemId = ? AND warehouseId = ? AND status = "active"',
                        [item.inventoryItemId, warehouseId]
                      );
                      
                      if (existingAlert.length > 0) {
                        await connection.execute(`
                          UPDATE StockAlert 
                          SET alertType = ?, currentQuantity = ?, threshold = ?, severity = ?, message = ?, createdAt = NOW()
                          WHERE id = ?
                        `, [alertType, newQuantity, minLevel, severity, message, existingAlert[0].id]);
                      } else {
                        await connection.execute(`
                          INSERT INTO StockAlert 
                          (inventoryItemId, warehouseId, alertType, currentQuantity, threshold, severity, status, message, createdAt)
                          VALUES (?, ?, ?, ?, ?, ?, 'active', ?, NOW())
                        `, [item.inventoryItemId, warehouseId, alertType, newQuantity, minLevel, severity, message]);
                      }
                    } else {
                      // حل التنبيه إذا كان موجوداً
                      await connection.execute(`
                        UPDATE StockAlert 
                        SET status = 'resolved', resolvedAt = NOW()
                        WHERE inventoryItemId = ? AND warehouseId = ? AND status = 'active'
                      `, [item.inventoryItemId, warehouseId]);
                    }
                  }
                }
              }
            }
          }
          
          await connection.commit();
          connection.release();
        } catch (error) {
          await connection.rollback();
          connection.release();
          console.error('Error updating stock levels from stock count:', error);
          // لا نوقف العملية إذا فشل تحديث StockLevel
        }
      }

      await db.execute(
        `UPDATE StockCount SET ${updateFields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        [...updateValues, id]
      );

      // تحديث إحصائيات الجرد
      await this.updateStockCountStats(id);

      res.json({
        success: true,
        message: `تم تحديث حالة الجرد إلى ${status} بنجاح`
      });

    } catch (error) {
      console.error('Error updating stock count status:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تحديث حالة الجرد',
        error: error.message
      });
    }
  }

  // تحديث إحصائيات الجرد
  async updateStockCountStats(stockCountId) {
    try {
      const [statsResult] = await db.execute(
        `SELECT 
          COUNT(*) as totalItems,
          COUNT(*) as itemsCounted,
          SUM(CASE WHEN variance != 0 THEN 1 ELSE 0 END) as discrepancies,
          SUM(varianceValue) as totalValueDifference
        FROM StockCountItem 
        WHERE stockCountId = ?`,
        [stockCountId]
      );

      const stats = statsResult[0];

      await db.execute(
        `UPDATE StockCount SET 
          totalItems = ?,
          itemsCounted = ?,
          discrepancies = ?,
          totalValueDifference = ?,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [stats.totalItems, stats.itemsCounted, stats.discrepancies, stats.totalValueDifference || 0, stockCountId]
      );

    } catch (error) {
      console.error('Error updating stock count stats:', error);
    }
  }

  // حذف الجرد
  async deleteStockCount(req, res) {
    try {
      const { id } = req.params;

      // التحقق من وجود الجرد
      const [stockCountResult] = await db.execute(
        'SELECT id, status FROM StockCount WHERE id = ?',
        [id]
      );

      if (stockCountResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'الجرد غير موجود'
        });
      }

      const stockCount = stockCountResult[0];

      if (stockCount.status === 'approved' || stockCount.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'لا يمكن حذف جرد معتمد أو مكتمل'
        });
      }

      // Soft delete - update status to cancelled and deletedAt
      await db.execute(
        'UPDATE StockCount SET status = ?, deletedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        ['cancelled', id]
      );

      res.json({
        success: true,
        message: 'تم حذف الجرد بنجاح'
      });

    } catch (error) {
      console.error('Error deleting stock count:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في حذف الجرد',
        error: error.message
      });
    }
  }

  // إحصائيات الجرد
  async getStockCountStats(req, res) {
    try {
      const [statsResult] = await db.execute(
        `SELECT 
          COUNT(*) as totalCounts,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedCounts,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgressCounts,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approvedCounts,
          SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduledCounts,
          SUM(CASE WHEN status = 'pending_review' THEN 1 ELSE 0 END) as pendingReviewCounts,
          SUM(discrepancies) as totalDiscrepancies,
          SUM(totalValueDifference) as totalValueDifference
        FROM StockCount`
      );

      res.json({
        success: true,
        data: statsResult[0]
      });

    } catch (error) {
      console.error('Error getting stock count stats:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب إحصائيات الجرد',
        error: error.message
      });
    }
  }
}

module.exports = new StockCountController();

