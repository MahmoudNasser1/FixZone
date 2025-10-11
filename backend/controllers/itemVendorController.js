const db = require('../db');

class ItemVendorController {
  // جلب موردي صنف معين
  async getItemVendors(req, res) {
    try {
      const { itemId } = req.params;

      const [vendors] = await db.execute(
        `SELECT 
          iv.*,
          v.name as vendorName,
          v.phone as vendorPhone,
          v.email as vendorEmail,
          v.status as vendorStatus
        FROM InventoryItemVendor iv
        LEFT JOIN Vendor v ON iv.vendorId = v.id
        WHERE iv.inventoryItemId = ?
        ORDER BY iv.isPrimary DESC, v.name`,
        [itemId]
      );

      res.json({
        success: true,
        data: vendors
      });

    } catch (error) {
      console.error('Error getting item vendors:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب الموردين',
        error: error.message
      });
    }
  }

  // إضافة مورد لصنف
  async addItemVendor(req, res) {
    try {
      const { itemId } = req.params;
      const { vendorId, isPrimary = false, price, leadTime = 7 } = req.body;

      // التحقق من وجود الصنف
      const [itemResult] = await db.execute(
        'SELECT id, name FROM InventoryItem WHERE id = ? AND deletedAt IS NULL',
        [itemId]
      );

      if (itemResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'الصنف غير موجود'
        });
      }

      // التحقق من وجود المورد
      const [vendorResult] = await db.execute(
        'SELECT id, name FROM Vendor WHERE id = ?',
        [vendorId]
      );

      if (vendorResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'المورد غير موجود'
        });
      }

      // إذا كان المورد الجديد رئيسي، إلغاء الرئيسي القديم
      if (isPrimary) {
        await db.execute(
          'UPDATE InventoryItemVendor SET isPrimary = 0 WHERE inventoryItemId = ?',
          [itemId]
        );
      }

      // إضافة المورد
      const [result] = await db.execute(
        `INSERT INTO InventoryItemVendor (
          inventoryItemId, vendorId, isPrimary, price, leadTime
        ) VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          isPrimary = VALUES(isPrimary),
          price = VALUES(price),
          leadTime = VALUES(leadTime),
          updatedAt = CURRENT_TIMESTAMP`,
        [itemId, vendorId, isPrimary ? 1 : 0, price, leadTime]
      );

      res.status(201).json({
        success: true,
        message: 'تم إضافة المورد بنجاح',
        data: {
          id: result.insertId || result.affectedRows,
          inventoryItemId: itemId,
          vendorId,
          isPrimary,
          price,
          leadTime
        }
      });

    } catch (error) {
      console.error('Error adding item vendor:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في إضافة المورد',
        error: error.message
      });
    }
  }

  // حذف مورد من صنف
  async removeItemVendor(req, res) {
    try {
      const { itemId, vendorId } = req.params;

      const [result] = await db.execute(
        'DELETE FROM InventoryItemVendor WHERE inventoryItemId = ? AND vendorId = ?',
        [itemId, vendorId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'العلاقة غير موجودة'
        });
      }

      res.json({
        success: true,
        message: 'تم حذف المورد بنجاح'
      });

    } catch (error) {
      console.error('Error removing item vendor:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في حذف المورد',
        error: error.message
      });
    }
  }

  // تعيين مورد رئيسي
  async setPrimaryVendor(req, res) {
    try {
      const { itemId, vendorId } = req.params;

      // إلغاء الرئيسي القديم
      await db.execute(
        'UPDATE InventoryItemVendor SET isPrimary = 0 WHERE inventoryItemId = ?',
        [itemId]
      );

      // تعيين الرئيسي الجديد
      const [result] = await db.execute(
        'UPDATE InventoryItemVendor SET isPrimary = 1, updatedAt = CURRENT_TIMESTAMP WHERE inventoryItemId = ? AND vendorId = ?',
        [itemId, vendorId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'العلاقة غير موجودة'
        });
      }

      res.json({
        success: true,
        message: 'تم تعيين المورد الرئيسي بنجاح'
      });

    } catch (error) {
      console.error('Error setting primary vendor:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تعيين المورد الرئيسي',
        error: error.message
      });
    }
  }

  // تحديث معلومات مورد
  async updateItemVendor(req, res) {
    try {
      const { itemId, vendorId } = req.params;
      const { price, leadTime, isPrimary } = req.body;

      const updateFields = [];
      const updateValues = [];

      if (price !== undefined) {
        updateFields.push('price = ?');
        updateValues.push(price);
      }

      if (leadTime !== undefined) {
        updateFields.push('leadTime = ?');
        updateValues.push(leadTime);
      }

      if (isPrimary !== undefined) {
        if (isPrimary) {
          // إلغاء الرئيسي القديم
          await db.execute(
            'UPDATE InventoryItemVendor SET isPrimary = 0 WHERE inventoryItemId = ?',
            [itemId]
          );
        }
        updateFields.push('isPrimary = ?');
        updateValues.push(isPrimary ? 1 : 0);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'لا توجد حقول للتحديث'
        });
      }

      updateFields.push('updatedAt = CURRENT_TIMESTAMP');

      const [result] = await db.execute(
        `UPDATE InventoryItemVendor SET ${updateFields.join(', ')} WHERE inventoryItemId = ? AND vendorId = ?`,
        [...updateValues, itemId, vendorId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'العلاقة غير موجودة'
        });
      }

      res.json({
        success: true,
        message: 'تم تحديث معلومات المورد بنجاح'
      });

    } catch (error) {
      console.error('Error updating item vendor:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تحديث معلومات المورد',
        error: error.message
      });
    }
  }
}

module.exports = new ItemVendorController();
