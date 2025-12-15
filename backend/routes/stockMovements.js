const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, stockMovementSchemas } = require('../middleware/validation');

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
    
    // CRITICAL: Use db.query instead of db.execute for queries with LIMIT/OFFSET
    // db.execute uses prepared statements which cause issues with LIMIT/OFFSET in MariaDB strict mode
    // db.query interpolates values directly and works perfectly with LIMIT/OFFSET
    const [rows] = await db.query(query, params);
    
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
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, notes } = req.body;
    const userId = req.user?.id;
    
    // التحقق من وجود الصنف
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
    
    // التحقق من صحة المخازن
    if (type === 'IN') {
      if (!toWarehouseId) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'المخزن المستقبل مطلوب لحركات IN'
        });
      }
    } else if (type === 'OUT') {
      if (!fromWarehouseId) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'المخزن المصدر مطلوب لحركات OUT'
        });
      }
      
      // التحقق من وجود كمية كافية
      const [stockLevel] = await connection.execute(
        'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ? AND deletedAt IS NULL',
        [inventoryItemId, fromWarehouseId]
      );
      
      const availableQuantity = stockLevel.length > 0 ? (stockLevel[0].quantity || 0) : 0;
      if (availableQuantity < quantity) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: `الكمية المتاحة (${availableQuantity}) أقل من المطلوب (${quantity})`
        });
      }
    } else if (type === 'TRANSFER') {
      if (!fromWarehouseId || !toWarehouseId) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'المخزن المصدر والمستقبل مطلوبان لحركات TRANSFER'
        });
      }
      
      if (fromWarehouseId === toWarehouseId) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'المخزن المصدر والمستقبل لا يمكن أن يكونا نفس المخزن'
        });
      }
      
      // التحقق من وجود كمية كافية في المخزن المصدر
      const [stockLevel] = await connection.execute(
        'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ? AND deletedAt IS NULL',
        [inventoryItemId, fromWarehouseId]
      );
      
      const availableQuantity = stockLevel.length > 0 ? (stockLevel[0].quantity || 0) : 0;
      if (availableQuantity < quantity) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: `الكمية المتاحة (${availableQuantity}) أقل من المطلوب (${quantity})`
        });
      }
    }
    
    // Check if notes column exists
    const [columns] = await connection.execute(`
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
    
    const [result] = await connection.execute(insertQuery, insertParams);
    
    // تحديث StockLevel وإضافة updateStockAlert
    if (type === 'IN' && toWarehouseId) {
      // إضافة للمخزن المستقبل
      await connection.execute(
        `INSERT INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel, createdAt, updatedAt)
         VALUES (?, ?, ?, 0, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
         quantity = quantity + VALUES(quantity),
         updatedAt = NOW()`,
        [inventoryItemId, toWarehouseId, quantity]
      );
      
      // الحصول على minLevel الحالي
      const [currentStock] = await connection.execute(
        'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [inventoryItemId, toWarehouseId]
      );
      const newQuantity = currentStock[0]?.quantity || quantity;
      const minLevel = currentStock[0]?.minLevel || 0;
      
      // تحديث StockAlert
      await updateStockAlert(connection, inventoryItemId, toWarehouseId, newQuantity, minLevel, userId);
    } else if (type === 'OUT' && fromWarehouseId) {
      // خصم من المخزن المصدر
      await connection.execute(
        `UPDATE StockLevel 
         SET quantity = quantity - ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [quantity, inventoryItemId, fromWarehouseId]
      );
      
      // الحصول على minLevel الحالي
      const [currentStock] = await connection.execute(
        'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [inventoryItemId, fromWarehouseId]
      );
      const newQuantity = currentStock[0]?.quantity || 0;
      const minLevel = currentStock[0]?.minLevel || 0;
      
      // تحديث StockAlert
      await updateStockAlert(connection, inventoryItemId, fromWarehouseId, newQuantity, minLevel, userId);
    } else if (type === 'TRANSFER' && fromWarehouseId && toWarehouseId) {
      // TRANSFER: subtract من المخزن المصدر و add إلى المخزن المستقبل
      // خصم من المخزن المصدر
      await connection.execute(
        `UPDATE StockLevel 
         SET quantity = quantity - ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [quantity, inventoryItemId, fromWarehouseId]
      );
      
      // الحصول على minLevel للمخزن المصدر
      const [fromStock] = await connection.execute(
        'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [inventoryItemId, fromWarehouseId]
      );
      const fromQuantity = fromStock[0]?.quantity || 0;
      const fromMinLevel = fromStock[0]?.minLevel || 0;
      
      // تحديث StockAlert للمخزن المصدر
      await updateStockAlert(connection, inventoryItemId, fromWarehouseId, fromQuantity, fromMinLevel, userId);
      
      // إضافة للمخزن المستقبل
      await connection.execute(
        `INSERT INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel, createdAt, updatedAt)
         VALUES (?, ?, ?, 0, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
         quantity = quantity + VALUES(quantity),
         updatedAt = NOW()`,
        [inventoryItemId, toWarehouseId, quantity]
      );
      
      // الحصول على minLevel للمخزن المستقبل
      const [toStock] = await connection.execute(
        'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [inventoryItemId, toWarehouseId]
      );
      const toQuantity = toStock[0]?.quantity || quantity;
      const toMinLevel = toStock[0]?.minLevel || 0;
      
      // تحديث StockAlert للمخزن المستقبل
      await updateStockAlert(connection, inventoryItemId, toWarehouseId, toQuantity, toMinLevel, userId);
    }
    
    await connection.commit();
    
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
    
    connection.release();
    
    res.status(201).json({
      success: true,
      data: movement[0],
      message: 'تم تسجيل الحركة بنجاح'
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
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
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, notes } = req.body;
    const userId = req.user?.id;
    
    // Check if deletedAt column exists
    const [columns] = await connection.execute(`
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
    
    const [current] = await connection.execute(currentQuery, [id]);
    
    if (current.length === 0) {
      await connection.rollback();
      connection.release();
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
      await connection.execute(
        `UPDATE StockLevel 
         SET quantity = quantity - ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [currentMovement.quantity, currentMovement.inventoryItemId, currentMovement.toWarehouseId]
      );
      
      // تحديث StockAlert بعد عكس الحركة
      const [reversedStock] = await connection.execute(
        'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [currentMovement.inventoryItemId, currentMovement.toWarehouseId]
      );
      if (reversedStock.length > 0) {
        await updateStockAlert(connection, currentMovement.inventoryItemId, currentMovement.toWarehouseId, reversedStock[0].quantity, reversedStock[0].minLevel, userId);
      }
    } else if (currentMovement.type === 'OUT' && currentMovement.fromWarehouseId) {
      await connection.execute(
        `UPDATE StockLevel 
         SET quantity = quantity + ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [currentMovement.quantity, currentMovement.inventoryItemId, currentMovement.fromWarehouseId]
      );
      
      // تحديث StockAlert بعد عكس الحركة
      const [reversedStock] = await connection.execute(
        'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [currentMovement.inventoryItemId, currentMovement.fromWarehouseId]
      );
      if (reversedStock.length > 0) {
        await updateStockAlert(connection, currentMovement.inventoryItemId, currentMovement.fromWarehouseId, reversedStock[0].quantity, reversedStock[0].minLevel, userId);
      }
    } else if (currentMovement.type === 'TRANSFER' && currentMovement.fromWarehouseId && currentMovement.toWarehouseId) {
      // Reverse TRANSFER: add back to from, subtract from to
      await connection.execute(
        `UPDATE StockLevel 
         SET quantity = quantity + ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [currentMovement.quantity, currentMovement.inventoryItemId, currentMovement.fromWarehouseId]
      );
      
      await connection.execute(
        `UPDATE StockLevel 
         SET quantity = quantity - ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [currentMovement.quantity, currentMovement.inventoryItemId, currentMovement.toWarehouseId]
      );
      
      // تحديث StockAlert بعد عكس الحركة
      const [fromReversedStock] = await connection.execute(
        'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [currentMovement.inventoryItemId, currentMovement.fromWarehouseId]
      );
      if (fromReversedStock.length > 0) {
        await updateStockAlert(connection, currentMovement.inventoryItemId, currentMovement.fromWarehouseId, fromReversedStock[0].quantity, fromReversedStock[0].minLevel, userId);
      }
      
      const [toReversedStock] = await connection.execute(
        'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [currentMovement.inventoryItemId, currentMovement.toWarehouseId]
      );
      if (toReversedStock.length > 0) {
        await updateStockAlert(connection, currentMovement.inventoryItemId, currentMovement.toWarehouseId, toReversedStock[0].quantity, toReversedStock[0].minLevel, userId);
      }
    }
    
    // Check if notes column exists
    const [notesColumns] = await connection.execute(`
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
    
    const [result] = await connection.execute(updateQuery, updateParams);
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'الحركة غير موجودة'
      });
    }
    
    // تطبيق الحركة الجديدة
    if (newType === 'IN' && newToWarehouseId) {
      await connection.execute(
        `INSERT INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel, createdAt, updatedAt)
         VALUES (?, ?, ?, 0, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
         quantity = quantity + VALUES(quantity),
         updatedAt = NOW()`,
        [newInventoryItemId, newToWarehouseId, newQuantity]
      );
      
      // تحديث StockAlert
      const [newStock] = await connection.execute(
        'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [newInventoryItemId, newToWarehouseId]
      );
      if (newStock.length > 0) {
        await updateStockAlert(connection, newInventoryItemId, newToWarehouseId, newStock[0].quantity, newStock[0].minLevel, userId);
      }
    } else if (newType === 'OUT' && newFromWarehouseId) {
      // التحقق من وجود كمية كافية
      const [stockLevel] = await connection.execute(
        'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ? AND deletedAt IS NULL',
        [newInventoryItemId, newFromWarehouseId]
      );
      
      const availableQuantity = stockLevel.length > 0 ? (stockLevel[0].quantity || 0) : 0;
      if (availableQuantity < newQuantity) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: `الكمية المتاحة (${availableQuantity}) أقل من المطلوب (${newQuantity})`
        });
      }
      
      await connection.execute(
        `UPDATE StockLevel 
         SET quantity = quantity - ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [newQuantity, newInventoryItemId, newFromWarehouseId]
      );
      
      // تحديث StockAlert
      const [newStock] = await connection.execute(
        'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [newInventoryItemId, newFromWarehouseId]
      );
      if (newStock.length > 0) {
        await updateStockAlert(connection, newInventoryItemId, newFromWarehouseId, newStock[0].quantity, newStock[0].minLevel, userId);
      }
    } else if (newType === 'TRANSFER' && newFromWarehouseId && newToWarehouseId) {
      // التحقق من وجود كمية كافية في المخزن المصدر
      const [stockLevel] = await connection.execute(
        'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ? AND deletedAt IS NULL',
        [newInventoryItemId, newFromWarehouseId]
      );
      
      const availableQuantity = stockLevel.length > 0 ? (stockLevel[0].quantity || 0) : 0;
      if (availableQuantity < newQuantity) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: `الكمية المتاحة (${availableQuantity}) أقل من المطلوب (${newQuantity})`
        });
      }
      
      // TRANSFER: subtract من المخزن المصدر و add إلى المخزن المستقبل
      await connection.execute(
        `UPDATE StockLevel 
         SET quantity = quantity - ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [newQuantity, newInventoryItemId, newFromWarehouseId]
      );
      
      // تحديث StockAlert للمخزن المصدر
      const [fromStock] = await connection.execute(
        'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [newInventoryItemId, newFromWarehouseId]
      );
      if (fromStock.length > 0) {
        await updateStockAlert(connection, newInventoryItemId, newFromWarehouseId, fromStock[0].quantity, fromStock[0].minLevel, userId);
      }
      
      await connection.execute(
        `INSERT INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel, createdAt, updatedAt)
         VALUES (?, ?, ?, 0, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
         quantity = quantity + VALUES(quantity),
         updatedAt = NOW()`,
        [newInventoryItemId, newToWarehouseId, newQuantity]
      );
      
      // تحديث StockAlert للمخزن المستقبل
      const [toStock] = await connection.execute(
        'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [newInventoryItemId, newToWarehouseId]
      );
      if (toStock.length > 0) {
        await updateStockAlert(connection, newInventoryItemId, newToWarehouseId, toStock[0].quantity, toStock[0].minLevel, userId);
      }
    }
    
    await connection.commit();
    connection.release();
    
    res.json({
      success: true,
      message: 'تم تحديث الحركة بنجاح'
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
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
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const userId = req.user?.id;
    
    // Check if deletedAt column exists
    const [columns] = await connection.execute(`
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
    
    const [movement] = await connection.execute(selectQuery, [id]);
    
    if (movement.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'الحركة غير موجودة'
      });
    }
    
    const movementData = movement[0];
    
    // معكوس الحركة (إرجاع الكمية)
    if (movementData.type === 'IN' && movementData.toWarehouseId) {
      await connection.execute(
        `UPDATE StockLevel 
         SET quantity = quantity - ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [movementData.quantity, movementData.inventoryItemId, movementData.toWarehouseId]
      );
      
      // تحديث StockAlert بعد عكس الحركة
      const [reversedStock] = await connection.execute(
        'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [movementData.inventoryItemId, movementData.toWarehouseId]
      );
      if (reversedStock.length > 0) {
        await updateStockAlert(connection, movementData.inventoryItemId, movementData.toWarehouseId, reversedStock[0].quantity, reversedStock[0].minLevel, userId);
      }
    } else if (movementData.type === 'OUT' && movementData.fromWarehouseId) {
      await connection.execute(
        `UPDATE StockLevel 
         SET quantity = quantity + ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [movementData.quantity, movementData.inventoryItemId, movementData.fromWarehouseId]
      );
      
      // تحديث StockAlert بعد عكس الحركة
      const [reversedStock] = await connection.execute(
        'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [movementData.inventoryItemId, movementData.fromWarehouseId]
      );
      if (reversedStock.length > 0) {
        await updateStockAlert(connection, movementData.inventoryItemId, movementData.fromWarehouseId, reversedStock[0].quantity, reversedStock[0].minLevel, userId);
      }
    } else if (movementData.type === 'TRANSFER' && movementData.fromWarehouseId && movementData.toWarehouseId) {
      // Reverse TRANSFER: add back to from, subtract from to
      await connection.execute(
        `UPDATE StockLevel 
         SET quantity = quantity + ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [movementData.quantity, movementData.inventoryItemId, movementData.fromWarehouseId]
      );
      
      await connection.execute(
        `UPDATE StockLevel 
         SET quantity = quantity - ?, updatedAt = NOW()
         WHERE inventoryItemId = ? AND warehouseId = ?`,
        [movementData.quantity, movementData.inventoryItemId, movementData.toWarehouseId]
      );
      
      // تحديث StockAlert بعد عكس الحركة
      const [fromReversedStock] = await connection.execute(
        'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [movementData.inventoryItemId, movementData.fromWarehouseId]
      );
      if (fromReversedStock.length > 0) {
        await updateStockAlert(connection, movementData.inventoryItemId, movementData.fromWarehouseId, fromReversedStock[0].quantity, fromReversedStock[0].minLevel, userId);
      }
      
      const [toReversedStock] = await connection.execute(
        'SELECT quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [movementData.inventoryItemId, movementData.toWarehouseId]
      );
      if (toReversedStock.length > 0) {
        await updateStockAlert(connection, movementData.inventoryItemId, movementData.toWarehouseId, toReversedStock[0].quantity, toReversedStock[0].minLevel, userId);
      }
    }
    
    // حذف الحركة (Soft Delete if column exists, otherwise hard delete)
    let result;
    if (hasDeletedAt) {
      [result] = await connection.execute(
        'UPDATE StockMovement SET deletedAt = NOW() WHERE id = ?',
        [id]
      );
    } else {
      [result] = await connection.execute(
        'DELETE FROM StockMovement WHERE id = ?',
        [id]
      );
    }
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'الحركة غير موجودة'
      });
    }
    
    await connection.commit();
    connection.release();
    
    res.json({
      success: true,
      message: 'تم حذف الحركة بنجاح'
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error(`Error deleting stock movement with ID ${id}:`, err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      details: err.message
    });
  }
});

module.exports = router;
