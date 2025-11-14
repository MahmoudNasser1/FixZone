const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all stock movements with details
router.get('/', async (req, res) => {
  try {
    const { type, inventoryItemId, warehouseId, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    let query = `
      SELECT 
        sm.*,
        i.name as itemName,
        i.sku,
        wf.name as fromWarehouseName,
        wt.name as toWarehouseName,
        u.name as userName
      FROM StockMovement sm
      LEFT JOIN InventoryItem i ON sm.inventoryItemId = i.id
      LEFT JOIN Warehouse wf ON sm.fromWarehouseId = wf.id
      LEFT JOIN Warehouse wt ON sm.toWarehouseId = wt.id
      LEFT JOIN User u ON sm.userId = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (type) {
      query += ' AND sm.type = ?';
      params.push(type);
    }
    
    if (inventoryItemId) {
      query += ' AND sm.inventoryItemId = ?';
      params.push(inventoryItemId);
    }
    
    if (warehouseId) {
      query += ' AND (sm.fromWarehouseId = ? OR sm.toWarehouseId = ?)';
      params.push(warehouseId, warehouseId);
    }
    
    if (startDate) {
      query += ' AND DATE(sm.createdAt) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND DATE(sm.createdAt) <= ?';
      params.push(endDate);
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY sm.createdAt DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    
    const [rows] = await db.execute(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM StockMovement sm
      WHERE 1=1
    `;
    const countParams = [];
    
    if (type) {
      countQuery += ' AND sm.type = ?';
      countParams.push(type);
    }
    
    if (inventoryItemId) {
      countQuery += ' AND sm.inventoryItemId = ?';
      countParams.push(inventoryItemId);
    }
    
    if (warehouseId) {
      countQuery += ' AND (sm.fromWarehouseId = ? OR sm.toWarehouseId = ?)';
      countParams.push(warehouseId, warehouseId);
    }
    
    if (startDate) {
      countQuery += ' AND DATE(sm.createdAt) >= ?';
      countParams.push(startDate);
    }
    
    if (endDate) {
      countQuery += ' AND DATE(sm.createdAt) <= ?';
      countParams.push(endDate);
    }
    
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching stock movements:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// GET /api/stockmovements/inventory/:itemId - Get movements for specific item
router.get('/inventory/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const [rows] = await db.execute(`
      SELECT 
        sm.*,
        i.name as itemName,
        i.sku,
        wf.name as fromWarehouseName,
        wt.name as toWarehouseName,
        u.name as userName
      FROM StockMovement sm
      LEFT JOIN InventoryItem i ON sm.inventoryItemId = i.id
      LEFT JOIN Warehouse wf ON sm.fromWarehouseId = wf.id
      LEFT JOIN Warehouse wt ON sm.toWarehouseId = wt.id
      LEFT JOIN User u ON sm.userId = u.id
      WHERE sm.inventoryItemId = ?
      ORDER BY sm.createdAt DESC
    `, [itemId]);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    console.error(`Error fetching stock movements for item ${itemId}:`, err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Get stock movement by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute(`
      SELECT 
        sm.*,
        i.name as itemName,
        i.sku,
        wf.name as fromWarehouseName,
        wt.name as toWarehouseName,
        u.name as userName
      FROM StockMovement sm
      LEFT JOIN InventoryItem i ON sm.inventoryItemId = i.id
      LEFT JOIN Warehouse wf ON sm.fromWarehouseId = wf.id
      LEFT JOIN Warehouse wt ON sm.toWarehouseId = wt.id
      LEFT JOIN User u ON sm.userId = u.id
      WHERE sm.id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stock movement not found'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    console.error(`Error fetching stock movement with ID ${id}:`, err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Create a new stock movement
router.post('/', async (req, res) => {
  try {
    const { type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, notes } = req.body;
    const userId = req.user?.id;
    
    if (!type || quantity === undefined || !inventoryItemId) {
      return res.status(400).json({
        success: false,
        message: 'النوع والكمية ومعرف الصنف مطلوبة'
      });
    }
    
    if (!['IN', 'OUT', 'TRANSFER'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'النوع يجب أن يكون IN أو OUT أو TRANSFER'
      });
    }
    
    // التحقق من وجود الصنف
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
    
    let warehouseId = null;
    if (type === 'IN') {
      warehouseId = toWarehouseId;
    } else if (type === 'OUT') {
      warehouseId = fromWarehouseId;
      
      // التحقق من وجود كمية كافية
      if (warehouseId) {
        const [stockLevel] = await db.execute(
          'SELECT quantity FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
          [inventoryItemId, warehouseId]
        );
        
        const availableQuantity = stockLevel.length > 0 ? (stockLevel[0].quantity || 0) : 0;
        if (availableQuantity < quantity) {
          return res.status(400).json({
            success: false,
            message: `الكمية المتاحة (${availableQuantity}) أقل من المطلوب (${quantity})`
          });
        }
      }
    }
    
    // تسجيل الحركة
    const [result] = await db.execute(
      'INSERT INTO StockMovement (type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, userId, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [type, quantity, inventoryItemId, fromWarehouseId || null, toWarehouseId || null, userId]
    );
    
    // تحديث StockLevel
    if (warehouseId) {
      if (type === 'IN') {
        // إضافة للمخزن
        await db.execute(
          `INSERT INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel, createdAt, updatedAt)
           VALUES (?, ?, ?, 0, NOW(), NOW())
           ON DUPLICATE KEY UPDATE
           quantity = quantity + VALUES(quantity),
           updatedAt = NOW()`,
          [inventoryItemId, warehouseId, quantity]
        );
      } else if (type === 'OUT') {
        // خصم من المخزن
        await db.execute(
          `UPDATE StockLevel 
           SET quantity = quantity - ?, updatedAt = NOW()
           WHERE inventoryItemId = ? AND warehouseId = ?`,
          [quantity, inventoryItemId, warehouseId]
        );
      }
    }
    
    // جلب الحركة المُنشأة
    const [movement] = await db.execute(
      `SELECT 
        sm.*,
        i.name as itemName,
        i.sku,
        wf.name as fromWarehouseName,
        wt.name as toWarehouseName,
        u.name as userName
      FROM StockMovement sm
      LEFT JOIN InventoryItem i ON sm.inventoryItemId = i.id
      LEFT JOIN Warehouse wf ON sm.fromWarehouseId = wf.id
      LEFT JOIN Warehouse wt ON sm.toWarehouseId = wt.id
      LEFT JOIN User u ON sm.userId = u.id
      WHERE sm.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      data: movement[0],
      message: 'تم تسجيل الحركة بنجاح'
    });
  } catch (err) {
    console.error('Error creating stock movement:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      details: err.message
    });
  }
});

// Update a stock movement (معكوس الحركة القديمة وإضافة الحركة الجديدة)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, notes } = req.body;
    const userId = req.user?.id;
    
    if (!type || quantity === undefined || !inventoryItemId) {
      return res.status(400).json({
        success: false,
        message: 'النوع والكمية ومعرف الصنف مطلوبة'
      });
    }
    
    // جلب الحركة الحالية
    const [current] = await db.execute(
      'SELECT * FROM StockMovement WHERE id = ?',
      [id]
    );
    
    if (current.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الحركة غير موجودة'
      });
    }
    
    const currentMovement = current[0];
    
    // معكوس الحركة القديمة (إرجاع الكمية)
    if (currentMovement.type === 'IN' && currentMovement.toWarehouseId) {
      await db.execute(
        `UPDATE StockLevel 
         SET quantity = quantity - ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [currentMovement.quantity, currentMovement.inventoryItemId, currentMovement.toWarehouseId]
      );
    } else if (currentMovement.type === 'OUT' && currentMovement.fromWarehouseId) {
      await db.execute(
        `UPDATE StockLevel 
         SET quantity = quantity + ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [currentMovement.quantity, currentMovement.inventoryItemId, currentMovement.fromWarehouseId]
      );
    }
    
    // تحديث الحركة
    const [result] = await db.execute(
      'UPDATE StockMovement SET type = ?, quantity = ?, inventoryItemId = ?, fromWarehouseId = ?, toWarehouseId = ?, userId = ?, updatedAt = NOW() WHERE id = ?',
      [type, quantity, inventoryItemId, fromWarehouseId || null, toWarehouseId || null, userId, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'الحركة غير موجودة'
      });
    }
    
    // تطبيق الحركة الجديدة
    let warehouseId = null;
    if (type === 'IN') {
      warehouseId = toWarehouseId;
    } else if (type === 'OUT') {
      warehouseId = fromWarehouseId;
    }
    
    if (warehouseId) {
      if (type === 'IN') {
        await db.execute(
          `INSERT INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel, createdAt, updatedAt)
           VALUES (?, ?, ?, 0, NOW(), NOW())
           ON DUPLICATE KEY UPDATE
           quantity = quantity + VALUES(quantity),
           updatedAt = NOW()`,
          [inventoryItemId, warehouseId, quantity]
        );
      } else if (type === 'OUT') {
        await db.execute(
          `UPDATE StockLevel 
           SET quantity = quantity - ?, updatedAt = NOW()
           WHERE inventoryItemId = ? AND warehouseId = ?`,
          [quantity, inventoryItemId, warehouseId]
        );
      }
    }
    
    res.json({
      success: true,
      message: 'تم تحديث الحركة بنجاح'
    });
  } catch (err) {
    console.error(`Error updating stock movement with ID ${id}:`, err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      details: err.message
    });
  }
});

// Delete a stock movement (معكوس الحركة)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // جلب الحركة
    const [movement] = await db.execute(
      'SELECT * FROM StockMovement WHERE id = ?',
      [id]
    );
    
    if (movement.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الحركة غير موجودة'
      });
    }
    
    const movementData = movement[0];
    
    // معكوس الحركة (إرجاع الكمية)
    if (movementData.type === 'IN' && movementData.toWarehouseId) {
      await db.execute(
        `UPDATE StockLevel 
         SET quantity = quantity - ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [movementData.quantity, movementData.inventoryItemId, movementData.toWarehouseId]
      );
    } else if (movementData.type === 'OUT' && movementData.fromWarehouseId) {
      await db.execute(
        `UPDATE StockLevel 
         SET quantity = quantity + ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [movementData.quantity, movementData.inventoryItemId, movementData.fromWarehouseId]
      );
    }
    
    // حذف الحركة
    const [result] = await db.execute(
      'DELETE FROM StockMovement WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'الحركة غير موجودة'
      });
    }
    
    res.json({
      success: true,
      message: 'تم حذف الحركة بنجاح'
    });
  } catch (err) {
    console.error(`Error deleting stock movement with ID ${id}:`, err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      details: err.message
    });
  }
});

module.exports = router;
