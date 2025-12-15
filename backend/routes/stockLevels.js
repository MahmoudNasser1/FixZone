const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, stockLevelSchemas } = require('../middleware/validation');

// Apply auth middleware to all routes
router.use(authMiddleware);

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

// GET /api/stock-levels/low-stock - Get low stock items
router.get('/low-stock', async (req, res) => {
  try {
    const [levels] = await db.execute(`
      SELECT 
        sl.*,
        i.name as itemName,
        i.sku,
        i.type as category,
        i.purchasePrice as unitPrice,
        w.name as warehouseName,
        CASE 
          WHEN sl.quantity <= 0 THEN 'out_of_stock'
          WHEN sl.quantity <= sl.minLevel THEN 'low_stock'
          ELSE 'normal'
        END as alertLevel
      FROM StockLevel sl
      LEFT JOIN InventoryItem i ON sl.inventoryItemId = i.id
      LEFT JOIN Warehouse w ON sl.warehouseId = w.id
      WHERE i.deletedAt IS NULL 
        AND sl.deletedAt IS NULL
        AND (sl.quantity <= sl.minLevel OR sl.isLowStock = 1)
      ORDER BY alertLevel DESC, sl.quantity ASC
    `);
    
    res.json(levels);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/stock-levels - Get all stock levels (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { warehouseId, inventoryItemId } = req.query;
    
    // Build WHERE clause based on query parameters
    let whereClause = 'WHERE i.deletedAt IS NULL AND sl.deletedAt IS NULL';
    const params = [];
    
    if (warehouseId) {
      whereClause += ' AND sl.warehouseId = ?';
      params.push(warehouseId);
    }
    
    if (inventoryItemId) {
      whereClause += ' AND sl.inventoryItemId = ?';
      params.push(inventoryItemId);
    }
    
    const [levels] = await db.execute(`
      SELECT 
        sl.*,
        i.name as itemName,
        i.sku,
        w.name as warehouseName
      FROM StockLevel sl
      LEFT JOIN InventoryItem i ON sl.inventoryItemId = i.id
      LEFT JOIN Warehouse w ON sl.warehouseId = w.id
      ${whereClause}
      ORDER BY sl.updatedAt DESC
    `, params);
    
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
      WHERE sl.inventoryItemId = ? AND sl.deletedAt IS NULL
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
router.post('/', validate(stockLevelSchemas.createOrUpdateStockLevel), async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { inventoryItemId, warehouseId, quantity, minLevel, notes } = req.body;
    const userId = req.user?.id;
    
    // التحقق من صحة البيانات
    if (quantity !== undefined && quantity < 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'الكمية يجب أن تكون أكبر من أو تساوي 0'
      });
    }
    
    if (minLevel !== undefined && minLevel < 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'الحد الأدنى للمخزون يجب أن يكون أكبر من أو يساوي 0'
      });
    }
    
    // التحقق من وجود الصنف والمخزن
    const [itemResult] = await connection.execute(
      'SELECT id, name FROM InventoryItem WHERE id = ? AND deletedAt IS NULL',
      [inventoryItemId]
    );
    
    if (itemResult.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'الصنف غير موجود'
      });
    }
    
    const [warehouseResult] = await connection.execute(
      'SELECT id, name FROM Warehouse WHERE id = ? AND deletedAt IS NULL',
      [warehouseId]
    );
    
    if (warehouseResult.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'المخزن غير موجود'
      });
    }
    
    // البحث عن StockLevel موجود
    const [existing] = await connection.execute(
      'SELECT * FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ? AND deletedAt IS NULL',
      [inventoryItemId, warehouseId]
    );
    
    let stockLevel;
    const oldQuantity = existing.length > 0 ? existing[0].quantity : 0;
    const currentMinLevel = existing.length > 0 ? existing[0].minLevel : 0;
    const newMinLevel = minLevel !== undefined ? minLevel : currentMinLevel;
    const newQuantity = quantity !== undefined ? quantity : oldQuantity;
    const quantityDiff = newQuantity - oldQuantity;
    
    if (existing.length > 0) {
      // تحديث الكمية الموجودة
      const isLowStock = newQuantity <= newMinLevel;
      await connection.execute(
        'UPDATE StockLevel SET quantity = ?, minLevel = ?, isLowStock = ?, updatedAt = NOW() WHERE id = ?',
        [newQuantity, newMinLevel, isLowStock ? 1 : 0, existing[0].id]
      );
      
      stockLevel = existing[0];
      stockLevel.quantity = newQuantity;
      stockLevel.minLevel = newMinLevel;
      stockLevel.isLowStock = isLowStock ? 1 : 0;
    } else {
      // إنشاء StockLevel جديد
      const isLowStock = newQuantity <= newMinLevel;
      const [result] = await connection.execute(
        `INSERT INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel, isLowStock, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [inventoryItemId, warehouseId, newQuantity, newMinLevel, isLowStock ? 1 : 0]
      );
      
      const [newLevel] = await connection.execute(
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
      await connection.execute(
        `INSERT INTO StockMovement 
         (inventoryItemId, ${warehouseField}, type, quantity, userId, createdAt)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [inventoryItemId, warehouseId, movementType, Math.abs(quantityDiff), userId]
      );
    }
    
    // تحديث StockAlert تلقائياً
    await updateStockAlert(connection, inventoryItemId, warehouseId, newQuantity, newMinLevel, userId);
    
    await connection.commit();
    
    res.json({
      success: true,
      data: stockLevel,
      message: existing.length > 0 ? 'تم تحديث مستوى المخزون بنجاح' : 'تم إنشاء مستوى المخزون بنجاح'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error managing stock level:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// PUT /api/stock-levels/:id - Update stock level
router.put('/:id', validate(stockLevelSchemas.updateStockLevel, 'body'), async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { quantity, minLevel, notes } = req.body;
    const userId = req.user?.id;
    
    // جلب البيانات الحالية
    const [current] = await connection.execute(
      'SELECT * FROM StockLevel WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (current.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'مستوى المخزون غير موجود'
      });
    }
    
    const currentLevel = current[0];
    const oldQuantity = currentLevel.quantity || 0;
    const newMinLevel = minLevel !== undefined ? minLevel : currentLevel.minLevel;
    const newQuantity = quantity !== undefined ? quantity : currentLevel.quantity;
    
    let updates = [];
    let params = [];
    
    if (quantity !== undefined) {
      const isLowStock = quantity <= newMinLevel;
      updates.push('quantity = ?');
      updates.push('isLowStock = ?');
      params.push(quantity);
      params.push(isLowStock ? 1 : 0);
    }
    
    if (minLevel !== undefined) {
      updates.push('minLevel = ?');
      params.push(minLevel);
      // Update isLowStock based on new minLevel if quantity wasn't updated
      if (quantity === undefined) {
        const isLowStock = currentLevel.quantity <= minLevel;
        const existingIsLowIndex = updates.indexOf('isLowStock = ?');
        if (existingIsLowIndex === -1) {
          updates.push('isLowStock = ?');
          params.push(isLowStock ? 1 : 0);
        } else {
          params[existingIsLowIndex] = isLowStock ? 1 : 0;
        }
      }
    }
    
    if (updates.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'لا توجد حقول للتحديث'
      });
    }
    
    updates.push('updatedAt = NOW()');
    params.push(id);
    
    const [result] = await connection.execute(
      `UPDATE StockLevel 
       SET ${updates.join(', ')}
       WHERE id = ?`,
      params
    );
    
    if (result.affectedRows === 0) {
      await connection.rollback();
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
      
      await connection.execute(
        `INSERT INTO StockMovement 
         (inventoryItemId, ${warehouseField}, type, quantity, userId, createdAt)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [currentLevel.inventoryItemId, currentLevel.warehouseId, movementType, Math.abs(quantityDiff), userId]
      );
    }
    
    // تحديث StockAlert تلقائياً
    await updateStockAlert(connection, currentLevel.inventoryItemId, currentLevel.warehouseId, newQuantity, newMinLevel, userId);
    
    // جلب البيانات المحدثة
    const [updated] = await connection.execute(
      'SELECT * FROM StockLevel WHERE id = ?',
      [id]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      data: updated[0],
      message: 'تم تحديث مستوى المخزون بنجاح'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating stock level:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// DELETE /api/stock-levels/:id - Delete stock level (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if StockLevel exists
    const [current] = await db.execute(
      'SELECT * FROM StockLevel WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (current.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'مستوى المخزون غير موجود'
      });
    }
    
    // Soft delete - update deletedAt
    const [result] = await db.execute(
      'UPDATE StockLevel SET deletedAt = NOW(), updatedAt = NOW() WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'مستوى المخزون غير موجود'
      });
    }
    
    // Resolve any active alerts for this stock level
    await db.execute(
      `UPDATE StockAlert 
       SET status = 'resolved', resolvedAt = NOW()
       WHERE inventoryItemId = ? AND warehouseId = ? AND status = 'active'`,
      [current[0].inventoryItemId, current[0].warehouseId]
    );
    
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
