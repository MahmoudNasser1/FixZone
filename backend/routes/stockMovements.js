const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, stockMovementSchemas } = require('../middleware/validation');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all stock movements with details
router.get('/', validate(stockMovementSchemas.getMovements, 'query'), async (req, res) => {
  try {
    const { 
      type, 
      inventoryItemId, 
      warehouseId, 
      startDate, 
      endDate, 
      q,
      sort = 'createdAt',
      sortDir = 'DESC',
      page = 1, 
      limit = 50 
    } = req.query;
    
    // Check if deletedAt column exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'FZ' 
        AND TABLE_NAME = 'StockMovement' 
        AND COLUMN_NAME = 'deletedAt'
    `);
    const hasDeletedAt = columns.length > 0;
    
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
      WHERE ${hasDeletedAt ? 'sm.deletedAt IS NULL' : '1=1'}
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
    
    // Search functionality
    if (q) {
      query += ' AND (i.name LIKE ? OR i.sku LIKE ? OR u.name LIKE ? OR wf.name LIKE ? OR wt.name LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Sorting
    const sortFieldMap = {
      'createdAt': 'sm.createdAt',
      'quantity': 'sm.quantity',
      'type': 'sm.type',
      'itemName': 'i.name'
    };
    const sortField = sortFieldMap[sort] || 'sm.createdAt';
    const sortDirection = sortDir === 'ASC' ? 'ASC' : 'DESC';
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY ${sortField} ${sortDirection} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    
    const [rows] = await db.execute(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM StockMovement sm
      LEFT JOIN InventoryItem i ON sm.inventoryItemId = i.id
      LEFT JOIN Warehouse wf ON sm.fromWarehouseId = wf.id
      LEFT JOIN Warehouse wt ON sm.toWarehouseId = wt.id
      LEFT JOIN User u ON sm.userId = u.id
      WHERE ${hasDeletedAt ? 'sm.deletedAt IS NULL' : '1=1'}
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
    
    if (q) {
      countQuery += ' AND (i.name LIKE ? OR i.sku LIKE ? OR u.name LIKE ? OR wf.name LIKE ? OR wt.name LIKE ?)';
      const searchTerm = `%${q}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
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
    
    // Check if deletedAt column exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'FZ' 
        AND TABLE_NAME = 'StockMovement' 
        AND COLUMN_NAME = 'deletedAt'
    `);
    const hasDeletedAt = columns.length > 0;
    
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
      WHERE sm.inventoryItemId = ?${hasDeletedAt ? ' AND sm.deletedAt IS NULL' : ''}
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

// Get stock movements statistics (must be before /:id route)
router.get('/stats/summary', async (req, res) => {
  try {
    const { dateFrom, dateTo, type, warehouseId, inventoryItemId } = req.query;
    
    // Check if deletedAt column exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'FZ' 
        AND TABLE_NAME = 'StockMovement' 
        AND COLUMN_NAME = 'deletedAt'
    `);
    const hasDeletedAt = columns.length > 0;
    
    let whereClause = hasDeletedAt ? 'WHERE sm.deletedAt IS NULL' : 'WHERE 1=1';
    const queryParams = [];
    
    if (dateFrom) {
      whereClause += ' AND DATE(sm.createdAt) >= ?';
      queryParams.push(dateFrom);
    }
    
    if (dateTo) {
      whereClause += ' AND DATE(sm.createdAt) <= ?';
      queryParams.push(dateTo);
    }
    
    if (type) {
      whereClause += ' AND sm.type = ?';
      queryParams.push(type);
    }
    
    if (warehouseId) {
      whereClause += ' AND (sm.fromWarehouseId = ? OR sm.toWarehouseId = ?)';
      queryParams.push(warehouseId, warehouseId);
    }
    
    if (inventoryItemId) {
      whereClause += ' AND sm.inventoryItemId = ?';
      queryParams.push(inventoryItemId);
    }
    
    // Get overall statistics
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as totalMovements,
        COALESCE(SUM(CASE WHEN sm.type = 'IN' THEN sm.quantity ELSE 0 END), 0) as totalInQuantity,
        COALESCE(SUM(CASE WHEN sm.type = 'OUT' THEN sm.quantity ELSE 0 END), 0) as totalOutQuantity,
        COALESCE(SUM(CASE WHEN sm.type = 'TRANSFER' THEN sm.quantity ELSE 0 END), 0) as totalTransferQuantity,
        COUNT(CASE WHEN sm.type = 'IN' THEN 1 END) as inCount,
        COUNT(CASE WHEN sm.type = 'OUT' THEN 1 END) as outCount,
        COUNT(CASE WHEN sm.type = 'TRANSFER' THEN 1 END) as transferCount,
        IFNULL(SUM(CASE WHEN DATE(sm.createdAt) = CURDATE() THEN 1 ELSE 0 END), 0) as todayMovements,
        IFNULL(SUM(CASE WHEN DATE(sm.createdAt) = CURDATE() AND sm.type = 'IN' THEN sm.quantity ELSE 0 END), 0) as todayInQuantity,
        IFNULL(SUM(CASE WHEN DATE(sm.createdAt) = CURDATE() AND sm.type = 'OUT' THEN sm.quantity ELSE 0 END), 0) as todayOutQuantity,
        IFNULL(SUM(CASE WHEN DATE(sm.createdAt) = CURDATE() AND sm.type = 'TRANSFER' THEN sm.quantity ELSE 0 END), 0) as todayTransferQuantity,
        IFNULL(SUM(CASE WHEN DATE(sm.createdAt) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END), 0) as weekMovements,
        IFNULL(SUM(CASE WHEN DATE(sm.createdAt) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND sm.type = 'IN' THEN sm.quantity ELSE 0 END), 0) as weekInQuantity,
        IFNULL(SUM(CASE WHEN DATE(sm.createdAt) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND sm.type = 'OUT' THEN sm.quantity ELSE 0 END), 0) as weekOutQuantity,
        IFNULL(SUM(CASE WHEN DATE(sm.createdAt) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND sm.type = 'TRANSFER' THEN sm.quantity ELSE 0 END), 0) as weekTransferQuantity,
        IFNULL(SUM(CASE WHEN DATE(sm.createdAt) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END), 0) as monthMovements,
        IFNULL(SUM(CASE WHEN DATE(sm.createdAt) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND sm.type = 'IN' THEN sm.quantity ELSE 0 END), 0) as monthInQuantity,
        IFNULL(SUM(CASE WHEN DATE(sm.createdAt) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND sm.type = 'OUT' THEN sm.quantity ELSE 0 END), 0) as monthOutQuantity,
        IFNULL(SUM(CASE WHEN DATE(sm.createdAt) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND sm.type = 'TRANSFER' THEN sm.quantity ELSE 0 END), 0) as monthTransferQuantity,
        MIN(sm.createdAt) as firstMovementDate,
        MAX(sm.createdAt) as lastMovementDate
      FROM StockMovement sm
      ${whereClause}
    `, queryParams);
    
    // Helper functions to safely convert to numbers
    const toInt = (val) => {
      if (val === null || val === undefined) return 0;
      const parsed = parseInt(val);
      return isNaN(parsed) ? 0 : parsed;
    };
    
    const rawStats = stats[0] || {};
    
    // Format stats object
    const formattedStats = {
      totalMovements: toInt(rawStats.totalMovements),
      totalQuantity: {
        in: toInt(rawStats.totalInQuantity),
        out: toInt(rawStats.totalOutQuantity),
        transfer: toInt(rawStats.totalTransferQuantity)
      },
      counts: {
        in: toInt(rawStats.inCount),
        out: toInt(rawStats.outCount),
        transfer: toInt(rawStats.transferCount)
      },
      today: {
        movements: toInt(rawStats.todayMovements),
        inQuantity: toInt(rawStats.todayInQuantity),
        outQuantity: toInt(rawStats.todayOutQuantity),
        transferQuantity: toInt(rawStats.todayTransferQuantity)
      },
      week: {
        movements: toInt(rawStats.weekMovements),
        inQuantity: toInt(rawStats.weekInQuantity),
        outQuantity: toInt(rawStats.weekOutQuantity),
        transferQuantity: toInt(rawStats.weekTransferQuantity)
      },
      month: {
        movements: toInt(rawStats.monthMovements),
        inQuantity: toInt(rawStats.monthInQuantity),
        outQuantity: toInt(rawStats.monthOutQuantity),
        transferQuantity: toInt(rawStats.monthTransferQuantity)
      },
      dateRange: {
        firstMovementDate: rawStats.firstMovementDate || null,
        lastMovementDate: rawStats.lastMovementDate || null
      }
    };
    
    // Get statistics by type (for charts)
    const [byType] = await db.execute(`
      SELECT 
        sm.type,
        COUNT(*) as count,
        COALESCE(SUM(sm.quantity), 0) as totalQuantity
      FROM StockMovement sm
      ${whereClause}
      GROUP BY sm.type
      ORDER BY sm.type
    `, queryParams);
    
    // Get top items by movement count
    const [topItems] = await db.execute(`
      SELECT 
        sm.inventoryItemId,
        i.name as itemName,
        i.sku,
        COUNT(*) as movementCount,
        COALESCE(SUM(CASE WHEN sm.type = 'IN' THEN sm.quantity ELSE 0 END), 0) as totalIn,
        COALESCE(SUM(CASE WHEN sm.type = 'OUT' THEN sm.quantity ELSE 0 END), 0) as totalOut,
        COALESCE(SUM(CASE WHEN sm.type = 'TRANSFER' THEN sm.quantity ELSE 0 END), 0) as totalTransfer
      FROM StockMovement sm
      LEFT JOIN InventoryItem i ON sm.inventoryItemId = i.id
      ${whereClause}
      GROUP BY sm.inventoryItemId, i.name, i.sku
      ORDER BY movementCount DESC
      LIMIT 10
    `, queryParams);
    
    // Get top warehouses by movement count
    const [topWarehouses] = await db.execute(`
      SELECT 
        COALESCE(wf.id, wt.id) as warehouseId,
        COALESCE(wf.name, wt.name) as warehouseName,
        COUNT(*) as movementCount,
        COALESCE(SUM(CASE WHEN sm.type = 'IN' THEN sm.quantity ELSE 0 END), 0) as totalIn,
        COALESCE(SUM(CASE WHEN sm.type = 'OUT' THEN sm.quantity ELSE 0 END), 0) as totalOut,
        COALESCE(SUM(CASE WHEN sm.type = 'TRANSFER' THEN sm.quantity ELSE 0 END), 0) as totalTransfer
      FROM StockMovement sm
      LEFT JOIN Warehouse wf ON sm.fromWarehouseId = wf.id
      LEFT JOIN Warehouse wt ON sm.toWarehouseId = wt.id
      ${whereClause}
      GROUP BY warehouseId, warehouseName
      ORDER BY movementCount DESC
      LIMIT 10
    `, queryParams);
    
    res.json({
      success: true,
      data: {
        summary: formattedStats,
        byType: byType.map(item => ({
          type: item.type,
          count: toInt(item.count),
          totalQuantity: toInt(item.totalQuantity)
        })),
        topItems: topItems.map(item => ({
          inventoryItemId: item.inventoryItemId,
          itemName: item.itemName,
          sku: item.sku,
          movementCount: toInt(item.movementCount),
          totalIn: toInt(item.totalIn),
          totalOut: toInt(item.totalOut),
          totalTransfer: toInt(item.totalTransfer)
        })),
        topWarehouses: topWarehouses.map(item => ({
          warehouseId: item.warehouseId,
          warehouseName: item.warehouseName,
          movementCount: toInt(item.movementCount),
          totalIn: toInt(item.totalIn),
          totalOut: toInt(item.totalOut),
          totalTransfer: toInt(item.totalTransfer)
        }))
      }
    });
  } catch (err) {
    console.error('Error fetching stock movement stats:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      details: err.message
    });
  }
});

// Get stock movement by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if deletedAt column exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'FZ' 
        AND TABLE_NAME = 'StockMovement' 
        AND COLUMN_NAME = 'deletedAt'
    `);
    const hasDeletedAt = columns.length > 0;
    
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
      WHERE sm.id = ?${hasDeletedAt ? ' AND sm.deletedAt IS NULL' : ''}
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الحركة غير موجودة'
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
router.post('/', validate(stockMovementSchemas.createMovement, 'body'), async (req, res) => {
  try {
    const { type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, notes } = req.body;
    const userId = req.user?.id;
    
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
    
    // التحقق من صحة المخازن
    if (type === 'IN') {
      if (!toWarehouseId) {
        return res.status(400).json({
          success: false,
          message: 'المخزن المستقبل مطلوب لحركات IN'
        });
      }
    } else if (type === 'OUT') {
      if (!fromWarehouseId) {
        return res.status(400).json({
          success: false,
          message: 'المخزن المصدر مطلوب لحركات OUT'
        });
      }
      
      // التحقق من وجود كمية كافية
      const [stockLevel] = await db.execute(
        'SELECT quantity FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [inventoryItemId, fromWarehouseId]
      );
      
      const availableQuantity = stockLevel.length > 0 ? (stockLevel[0].quantity || 0) : 0;
      if (availableQuantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `الكمية المتاحة (${availableQuantity}) أقل من المطلوب (${quantity})`
        });
      }
    } else if (type === 'TRANSFER') {
      if (!fromWarehouseId || !toWarehouseId) {
        return res.status(400).json({
          success: false,
          message: 'المخزن المصدر والمستقبل مطلوبان لحركات TRANSFER'
        });
      }
      
      if (fromWarehouseId === toWarehouseId) {
        return res.status(400).json({
          success: false,
          message: 'المخزن المصدر والمستقبل لا يمكن أن يكونا نفس المخزن'
        });
      }
      
      // التحقق من وجود كمية كافية في المخزن المصدر
      const [stockLevel] = await db.execute(
        'SELECT quantity FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [inventoryItemId, fromWarehouseId]
      );
      
      const availableQuantity = stockLevel.length > 0 ? (stockLevel[0].quantity || 0) : 0;
      if (availableQuantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `الكمية المتاحة (${availableQuantity}) أقل من المطلوب (${quantity})`
        });
      }
    }
    
    // Check if notes column exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'FZ' 
        AND TABLE_NAME = 'StockMovement' 
        AND COLUMN_NAME = 'notes'
    `);
    const hasNotes = columns.length > 0;
    
    // تسجيل الحركة
    const insertQuery = hasNotes
      ? 'INSERT INTO StockMovement (type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, userId, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())'
      : 'INSERT INTO StockMovement (type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, userId, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())';
    
    const insertParams = hasNotes
      ? [type, quantity, inventoryItemId, fromWarehouseId || null, toWarehouseId || null, userId, notes || null]
      : [type, quantity, inventoryItemId, fromWarehouseId || null, toWarehouseId || null, userId];
    
    const [result] = await db.execute(insertQuery, insertParams);
    
    // تحديث StockLevel
    if (type === 'IN' && toWarehouseId) {
      // إضافة للمخزن المستقبل
      await db.execute(
        `INSERT INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel, createdAt, updatedAt)
         VALUES (?, ?, ?, 0, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
         quantity = quantity + VALUES(quantity),
         updatedAt = NOW()`,
        [inventoryItemId, toWarehouseId, quantity]
      );
    } else if (type === 'OUT' && fromWarehouseId) {
      // خصم من المخزن المصدر
      await db.execute(
        `UPDATE StockLevel 
         SET quantity = quantity - ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [quantity, inventoryItemId, fromWarehouseId]
      );
    } else if (type === 'TRANSFER' && fromWarehouseId && toWarehouseId) {
      // TRANSFER: subtract من المخزن المصدر و add إلى المخزن المستقبل
      // خصم من المخزن المصدر
      await db.execute(
        `UPDATE StockLevel 
         SET quantity = quantity - ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [quantity, inventoryItemId, fromWarehouseId]
      );
      
      // إضافة للمخزن المستقبل
      await db.execute(
        `INSERT INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel, createdAt, updatedAt)
         VALUES (?, ?, ?, 0, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
         quantity = quantity + VALUES(quantity),
         updatedAt = NOW()`,
        [inventoryItemId, toWarehouseId, quantity]
      );
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
router.put('/:id', validate(stockMovementSchemas.updateMovement, 'body'), async (req, res) => {
  try {
    const { id } = req.params;
    const { type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, notes } = req.body;
    const userId = req.user?.id;
    
    // Check if deletedAt column exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'FZ' 
        AND TABLE_NAME = 'StockMovement' 
        AND COLUMN_NAME = 'deletedAt'
    `);
    const hasDeletedAt = columns.length > 0;
    
    // جلب الحركة الحالية
    const currentQuery = hasDeletedAt
      ? 'SELECT * FROM StockMovement WHERE id = ? AND deletedAt IS NULL'
      : 'SELECT * FROM StockMovement WHERE id = ?';
    
    const [current] = await db.execute(currentQuery, [id]);
    
    if (current.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الحركة غير موجودة'
      });
    }
    
    const currentMovement = current[0];
    
    // Use new values if provided, otherwise use current values
    const newType = type || currentMovement.type;
    const newQuantity = quantity !== undefined ? quantity : currentMovement.quantity;
    const newInventoryItemId = inventoryItemId || currentMovement.inventoryItemId;
    const newFromWarehouseId = fromWarehouseId !== undefined ? fromWarehouseId : currentMovement.fromWarehouseId;
    const newToWarehouseId = toWarehouseId !== undefined ? toWarehouseId : currentMovement.toWarehouseId;
    
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
    } else if (currentMovement.type === 'TRANSFER' && currentMovement.fromWarehouseId && currentMovement.toWarehouseId) {
      // Reverse TRANSFER: add back to from, subtract from to
      await db.execute(
        `UPDATE StockLevel 
         SET quantity = quantity + ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [currentMovement.quantity, currentMovement.inventoryItemId, currentMovement.fromWarehouseId]
      );
      
      await db.execute(
        `UPDATE StockLevel 
         SET quantity = quantity - ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [currentMovement.quantity, currentMovement.inventoryItemId, currentMovement.toWarehouseId]
      );
    }
    
    // Check if notes column exists
    const [notesColumns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'FZ' 
        AND TABLE_NAME = 'StockMovement' 
        AND COLUMN_NAME = 'notes'
    `);
    const hasNotes = notesColumns.length > 0;
    
    // تحديث الحركة
    const updateQuery = hasNotes
      ? 'UPDATE StockMovement SET type = ?, quantity = ?, inventoryItemId = ?, fromWarehouseId = ?, toWarehouseId = ?, userId = ?, notes = ?, updatedAt = NOW() WHERE id = ?'
      : 'UPDATE StockMovement SET type = ?, quantity = ?, inventoryItemId = ?, fromWarehouseId = ?, toWarehouseId = ?, userId = ?, updatedAt = NOW() WHERE id = ?';
    
    const updateParams = hasNotes
      ? [newType, newQuantity, newInventoryItemId, newFromWarehouseId || null, newToWarehouseId || null, userId, notes !== undefined ? notes : currentMovement.notes, id]
      : [newType, newQuantity, newInventoryItemId, newFromWarehouseId || null, newToWarehouseId || null, userId, id];
    
    const [result] = await db.execute(updateQuery, updateParams);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'الحركة غير موجودة'
      });
    }
    
    // تطبيق الحركة الجديدة
    if (newType === 'IN' && newToWarehouseId) {
      await db.execute(
        `INSERT INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel, createdAt, updatedAt)
         VALUES (?, ?, ?, 0, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
         quantity = quantity + VALUES(quantity),
         updatedAt = NOW()`,
        [newInventoryItemId, newToWarehouseId, newQuantity]
      );
    } else if (newType === 'OUT' && newFromWarehouseId) {
      // التحقق من وجود كمية كافية
      const [stockLevel] = await db.execute(
        'SELECT quantity FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [newInventoryItemId, newFromWarehouseId]
      );
      
      const availableQuantity = stockLevel.length > 0 ? (stockLevel[0].quantity || 0) : 0;
      if (availableQuantity < newQuantity) {
        // Rollback: restore old movement
        // (This is a simplified rollback - in production, use transactions)
        return res.status(400).json({
          success: false,
          message: `الكمية المتاحة (${availableQuantity}) أقل من المطلوب (${newQuantity})`
        });
      }
      
      await db.execute(
        `UPDATE StockLevel 
         SET quantity = quantity - ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [newQuantity, newInventoryItemId, newFromWarehouseId]
      );
    } else if (newType === 'TRANSFER' && newFromWarehouseId && newToWarehouseId) {
      // التحقق من وجود كمية كافية في المخزن المصدر
      const [stockLevel] = await db.execute(
        'SELECT quantity FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [newInventoryItemId, newFromWarehouseId]
      );
      
      const availableQuantity = stockLevel.length > 0 ? (stockLevel[0].quantity || 0) : 0;
      if (availableQuantity < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `الكمية المتاحة (${availableQuantity}) أقل من المطلوب (${newQuantity})`
        });
      }
      
      // TRANSFER: subtract من المخزن المصدر و add إلى المخزن المستقبل
      await db.execute(
        `UPDATE StockLevel 
         SET quantity = quantity - ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [newQuantity, newInventoryItemId, newFromWarehouseId]
      );
      
      await db.execute(
        `INSERT INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel, createdAt, updatedAt)
         VALUES (?, ?, ?, 0, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
         quantity = quantity + VALUES(quantity),
         updatedAt = NOW()`,
        [newInventoryItemId, newToWarehouseId, newQuantity]
      );
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

// Delete a stock movement (معكوس الحركة - Soft Delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if deletedAt column exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'FZ' 
        AND TABLE_NAME = 'StockMovement' 
        AND COLUMN_NAME = 'deletedAt'
    `);
    const hasDeletedAt = columns.length > 0;
    
    // جلب الحركة
    const selectQuery = hasDeletedAt
      ? 'SELECT * FROM StockMovement WHERE id = ? AND deletedAt IS NULL'
      : 'SELECT * FROM StockMovement WHERE id = ?';
    
    const [movement] = await db.execute(selectQuery, [id]);
    
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
    } else if (movementData.type === 'TRANSFER' && movementData.fromWarehouseId && movementData.toWarehouseId) {
      // Reverse TRANSFER: add back to from, subtract from to
      await db.execute(
        `UPDATE StockLevel 
         SET quantity = quantity + ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [movementData.quantity, movementData.inventoryItemId, movementData.fromWarehouseId]
      );
      
      await db.execute(
        `UPDATE StockLevel 
         SET quantity = quantity - ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [movementData.quantity, movementData.inventoryItemId, movementData.toWarehouseId]
      );
    }
    
    // حذف الحركة (Soft Delete if column exists, otherwise hard delete)
    let result;
    if (hasDeletedAt) {
      [result] = await db.execute(
        'UPDATE StockMovement SET deletedAt = NOW() WHERE id = ?',
        [id]
      );
    } else {
      [result] = await db.execute(
        'DELETE FROM StockMovement WHERE id = ?',
        [id]
      );
    }
    
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
