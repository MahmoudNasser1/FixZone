const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/stock-levels - Get all stock levels
router.get('/', async (req, res) => {
  try {
    const [levels] = await db.execute(`
      SELECT 
        sl.*,
        i.name as itemName,
        i.sku,
        w.name as warehouseName
      FROM StockLevel sl
      LEFT JOIN InventoryItem i ON sl.inventoryItemId = i.id
      LEFT JOIN Warehouse w ON sl.warehouseId = w.id
      WHERE i.deletedAt IS NULL
      ORDER BY sl.updatedAt DESC
    `);
    
    res.json({
      success: true,
      data: levels
    });
  } catch (error) {
    console.error('Error fetching stock levels:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/stock-levels/item/:itemId - Get stock levels for specific item
router.get('/item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const [levels] = await db.execute(`
      SELECT 
        sl.*,
        w.name as warehouseName
      FROM StockLevel sl
      LEFT JOIN Warehouse w ON sl.warehouseId = w.id
      WHERE sl.inventoryItemId = ?
      ORDER BY w.name
    `, [itemId]);
    
    res.json({
      success: true,
      data: levels
    });
  } catch (error) {
    console.error('Error fetching item stock levels:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/stock-levels - Create or update stock level (MUST come before GET /:id)
router.post('/', async (req, res) => {
  try {
    const { inventoryItemId, warehouseId, quantity, notes } = req.body;
    const userId = req.user?.id;
    
    if (!inventoryItemId || !warehouseId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'inventoryItemId, warehouseId, and quantity are required'
      });
    }
    
    // التحقق من وجود الصنف والمخزن
    const [itemResult] = await db.execute(
      'SELECT id, name FROM InventoryItem WHERE id = ? AND deletedAt IS NULL',
      [inventoryItemId]
    );
    
    if (itemResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الصنف غير موجود'
      });
    }
    
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
    
    // البحث عن StockLevel موجود
    const [existing] = await db.execute(
      'SELECT * FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
      [inventoryItemId, warehouseId]
    );
    
    let stockLevel;
    const oldQuantity = existing.length > 0 ? existing[0].quantity : 0;
    const quantityDiff = quantity - oldQuantity;
    
    if (existing.length > 0) {
      // تحديث الكمية الموجودة
      await db.execute(
        'UPDATE StockLevel SET quantity = ?, updatedAt = NOW() WHERE id = ?',
        [quantity, existing[0].id]
      );
      
      stockLevel = existing[0];
      stockLevel.quantity = quantity;
    } else {
      // إنشاء StockLevel جديد
      const [result] = await db.execute(
        `INSERT INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel, createdAt, updatedAt)
         VALUES (?, ?, ?, 0, NOW(), NOW())`,
        [inventoryItemId, warehouseId, quantity]
      );
      
      const [newLevel] = await db.execute(
        'SELECT * FROM StockLevel WHERE id = ?',
        [result.insertId]
      );
      
      stockLevel = newLevel[0];
    }
    
    // تسجيل StockMovement إذا كان هناك تغيير في الكمية
    if (quantityDiff !== 0) {
      const movementType = quantityDiff > 0 ? 'IN' : 'OUT';
      const warehouseField = quantityDiff > 0 ? 'toWarehouseId' : 'fromWarehouseId';
      
      // تسجيل الحركة في StockMovement
      await db.execute(
        `INSERT INTO StockMovement 
         (inventoryItemId, ${warehouseField}, type, quantity, userId, createdAt)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [inventoryItemId, warehouseId, movementType, Math.abs(quantityDiff), userId]
      );
    }
    
    res.json({
      success: true,
      data: stockLevel,
      message: existing.length > 0 ? 'تم تحديث مستوى المخزون بنجاح' : 'تم إنشاء مستوى المخزون بنجاح'
    });
  } catch (error) {
    console.error('Error managing stock level:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      details: error.message
    });
  }
});

// PUT /api/stock-levels/:id - Update stock level
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, minLevel, notes } = req.body;
    const userId = req.user?.id;
    
    // جلب البيانات الحالية
    const [current] = await db.execute(
      'SELECT * FROM StockLevel WHERE id = ?',
      [id]
    );
    
    if (current.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'مستوى المخزون غير موجود'
      });
    }
    
    const currentLevel = current[0];
    const oldQuantity = currentLevel.quantity || 0;
    
    let updates = [];
    let params = [];
    
    if (quantity !== undefined) {
      updates.push('quantity = ?');
      params.push(quantity);
    }
    
    if (minLevel !== undefined) {
      updates.push('minLevel = ?');
      params.push(minLevel);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لا توجد حقول للتحديث'
      });
    }
    
    updates.push('updatedAt = NOW()');
    params.push(id);
    
    const [result] = await db.execute(
      `UPDATE StockLevel 
       SET ${updates.join(', ')}
       WHERE id = ?`,
      params
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'مستوى المخزون غير موجود'
      });
    }
    
    // تسجيل StockMovement إذا تم تغيير الكمية
    if (quantity !== undefined && quantity !== oldQuantity) {
      const quantityDiff = quantity - oldQuantity;
      const movementType = quantityDiff > 0 ? 'IN' : 'OUT';
      const warehouseField = quantityDiff > 0 ? 'toWarehouseId' : 'fromWarehouseId';
      
      try {
        await db.execute(
          `INSERT INTO StockMovement 
           (inventoryItemId, ${warehouseField}, type, quantity, userId, createdAt)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [currentLevel.inventoryItemId, currentLevel.warehouseId, movementType, Math.abs(quantityDiff), userId]
        );
      } catch (movementError) {
        console.error('Error recording stock movement:', movementError);
        // لا نوقف العملية إذا فشل تسجيل الحركة
      }
    }
    
    // جلب البيانات المحدثة
    const [updated] = await db.execute(
      'SELECT * FROM StockLevel WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      data: updated[0],
      message: 'تم تحديث مستوى المخزون بنجاح'
    });
  } catch (error) {
    console.error('Error updating stock level:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      details: error.message
    });
  }
});

// DELETE /api/stock-levels/:id - Delete stock level (soft delete not supported, hard delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.execute(
      'DELETE FROM StockLevel WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'مستوى المخزون غير موجود'
      });
    }
    
    res.json({
      success: true,
      message: 'تم حذف مستوى المخزون بنجاح'
    });
  } catch (error) {
    console.error('Error deleting stock level:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      details: error.message
    });
  }
});

module.exports = router;
