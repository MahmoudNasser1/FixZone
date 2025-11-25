// backend/controllers/inventoryEnhanced.js
// Enhanced Inventory Controller with Validation & Error Handling

const db = require('../db');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * Get all inventory items with filters, search, and pagination
 * GET /api/inventory
 */
exports.getAllItems = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    category = '',
    status = '',
    condition = '',
    lowStock = false,
    warehouseId = '',
    sortBy = 'name',
    sortOrder = 'ASC'
  } = req.query;

  const offset = (page - 1) * limit;

  // Build WHERE clauses
  let whereConditions = ['i.deletedAt IS NULL'];
  const params = [];

  if (search) {
    whereConditions.push(`(
      i.name LIKE ? OR 
      i.sku LIKE ? OR 
      i.barcode LIKE ? OR 
      i.partNumber LIKE ? OR
      i.brand LIKE ? OR
      i.model LIKE ?
    )`);
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  // Note: categoryId doesn't exist, using type instead
  if (category) {
    whereConditions.push('i.type = ?');
    params.push(category);
  }

  // Note: isActive column doesn't exist in InventoryItem table
  // Status filtering removed until proper column is added
  if (status === 'active' || status === 'inactive') {
    // TODO: Add proper status column or use alternative logic
  }

  if (condition) {
    whereConditions.push('i.condition = ?');
    params.push(condition);
  }

  // Main query
  let query = `
    SELECT 
      i.*,
      c.name as categoryName,
      COALESCE(SUM(sl.quantity), 0) as totalQuantity,
      0 as totalReserved,
      COALESCE(SUM(sl.quantity), 0) as totalAvailable,
      COALESCE(SUM(sl.quantity * i.purchasePrice), 0) as totalValue,
      COUNT(DISTINCT sl.warehouseId) as warehouseCount
    FROM InventoryItem i
    LEFT JOIN InventoryItemCategory c ON c.name COLLATE utf8mb4_unicode_ci = i.type COLLATE utf8mb4_unicode_ci
    LEFT JOIN StockLevel sl ON i.id = sl.inventoryItemId
    WHERE ${whereConditions.join(' AND ')}
  `;

  // Add warehouse filter if specified
  if (warehouseId) {
    query += ` AND sl.warehouseId = ?`;
    params.push(warehouseId);
  }

  query += ` GROUP BY i.id`;

  // Add low stock filter after grouping
  if (lowStock === 'true' || lowStock === true) {
    query += ` HAVING totalAvailable <= i.reorderPoint`;
  }

  // Add sorting
  const allowedSortFields = ['name', 'sku', 'categoryName', 'purchasePrice', 'sellingPrice', 'totalQuantity', 'createdAt'];
  const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
  const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

  query += ` ORDER BY ${validSortBy} ${validSortOrder}`;
  query += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  // CRITICAL: Use db.query instead of db.execute for queries with LIMIT/OFFSET
  // db.execute uses prepared statements which cause issues with LIMIT/OFFSET in MariaDB strict mode
  // db.query interpolates values directly and works perfectly with LIMIT/OFFSET
  const [items] = await db.query(query, params);

  // Count total items
  let countQuery = `
    SELECT COUNT(DISTINCT i.id) as total
    FROM InventoryItem i
    LEFT JOIN StockLevel sl ON i.id = sl.inventoryItemId
    WHERE ${whereConditions.join(' AND ')}
  `;

  if (warehouseId) {
    countQuery += ` AND sl.warehouseId = ?`;
  }

  const countParams = warehouseId 
    ? params.slice(0, params.length - 2).concat([warehouseId])
    : params.slice(0, params.length - 2);

  const [countResult] = await db.execute(countQuery, countParams);
  const totalItems = countResult[0].total;

  // Get summary statistics
  const [stats] = await db.execute(`
    SELECT 
      COUNT(DISTINCT i.id) as totalItems,
      COUNT(DISTINCT i.id) as activeItems,
      COALESCE(SUM(sl.quantity), 0) as totalQuantity,
      COALESCE(SUM(sl.quantity * i.purchasePrice), 0) as totalValue
    FROM InventoryItem i
    LEFT JOIN StockLevel sl ON i.id = sl.inventoryItemId
    WHERE i.deletedAt IS NULL
  `);

  res.json({
    success: true,
    data: {
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      },
      summary: stats[0]
    }
  });
});

/**
 * Get single inventory item by ID
 * GET /api/inventory/:id
 */
exports.getItemById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [items] = await db.execute(`
    SELECT 
      i.*,
      c.name as categoryName,
      COALESCE(SUM(sl.quantity), 0) as totalQuantity,
      0 as totalReserved,
      COALESCE(SUM(sl.quantity), 0) as totalAvailable
    FROM InventoryItem i
    LEFT JOIN InventoryItemCategory c ON c.name COLLATE utf8mb4_unicode_ci = i.type COLLATE utf8mb4_unicode_ci
    LEFT JOIN StockLevel sl ON i.id = sl.inventoryItemId
    WHERE i.id = ? AND i.deletedAt IS NULL
    GROUP BY i.id
  `, [id]);

  if (!items.length) {
    throw new AppError('الصنف غير موجود', 404);
  }

  // Get stock levels per warehouse
  const [stockLevels] = await db.execute(`
    SELECT 
      sl.*,
      w.name as warehouseName
    FROM StockLevel sl
    JOIN Warehouse w ON sl.warehouseId = w.id
    WHERE sl.inventoryItemId = ? AND w.deletedAt IS NULL
    ORDER BY sl.quantity DESC
  `, [id]);

  // Get recent stock movements
  const [movements] = await db.execute(`
    SELECT 
      sm.*,
      wf.name as fromWarehouseName,
      wt.name as toWarehouseName
    FROM StockMovement sm
    LEFT JOIN Warehouse wf ON sm.fromWarehouseId = wf.id
    LEFT JOIN Warehouse wt ON sm.toWarehouseId = wt.id
    WHERE sm.inventoryItemId = ?
    ORDER BY sm.createdAt DESC
    LIMIT 10
  `, [id]);

  // Get vendors for this item
  const [vendors] = await db.execute(`
    SELECT 
      iv.*,
      v.name as vendorName,
      v.phone as vendorPhone
    FROM InventoryItemVendor iv
    JOIN Vendor v ON iv.vendorId = v.id
    WHERE iv.inventoryItemId = ? AND v.deletedAt IS NULL
    ORDER BY iv.isPrimary DESC, iv.unitPrice ASC
  `, [id]);

  res.json({
    success: true,
    data: {
      item: items[0],
      stockLevels,
      recentMovements: movements,
      vendors
    }
  });
});

/**
 * Create new inventory item
 * POST /api/inventory
 */
exports.createItem = asyncHandler(async (req, res) => {
  const itemData = req.body;

  // Check for duplicate SKU
  if (itemData.sku) {
    const [existing] = await db.execute(
      'SELECT id FROM InventoryItem WHERE sku = ? AND deletedAt IS NULL',
      [itemData.sku]
    );

    if (existing.length) {
      throw new AppError('رمز الصنف (SKU) موجود مسبقاً', 409);
    }
  }

  // Check for duplicate barcode
  if (itemData.barcode) {
    const [existing] = await db.execute(
      'SELECT id FROM InventoryItem WHERE barcode = ? AND deletedAt IS NULL',
      [itemData.barcode]
    );

    if (existing.length) {
      throw new AppError('الباركود موجود مسبقاً', 409);
    }
  }

  // Generate SKU if not provided
  if (!itemData.sku) {
    const [maxSku] = await db.execute(
      'SELECT MAX(CAST(SUBSTRING(sku, 6) AS UNSIGNED)) as maxNum FROM InventoryItem WHERE sku LIKE "PART-%"'
    );
    const nextNum = (maxSku[0].maxNum || 0) + 1;
    itemData.sku = `PART-${String(nextNum).padStart(3, '0')}`;
  }

  // Insert item
  const [result] = await db.execute(`
    INSERT INTO InventoryItem (
      name, sku, purchasePrice, sellingPrice, unit,
      minStockLevel, maxStockLevel, description, isActive
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    itemData.name,
    itemData.sku,
    itemData.purchasePrice,
    itemData.sellingPrice,
    itemData.unit || 'قطعة',
    itemData.minStockLevel || 0,
    itemData.maxStockLevel || 1000,
    itemData.description || null,
    itemData.isActive !== false ? 1 : 0
  ]);

  res.status(201).json({
    success: true,
    message: 'تم إضافة الصنف بنجاح',
    data: {
      id: result.insertId,
      sku: itemData.sku
    }
  });
});

/**
 * Update inventory item
 * PUT /api/inventory/:id
 */
exports.updateItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Check if item exists
  const [existing] = await db.execute(
    'SELECT id FROM InventoryItem WHERE id = ? AND deletedAt IS NULL',
    [id]
  );

  if (!existing.length) {
    throw new AppError('الصنف غير موجود', 404);
  }

  // Check for duplicate SKU (excluding current item)
  if (updateData.sku) {
    const [duplicate] = await db.execute(
      'SELECT id FROM InventoryItem WHERE sku = ? AND id != ? AND deletedAt IS NULL',
      [updateData.sku, id]
    );

    if (duplicate.length) {
      throw new AppError('رمز الصنف (SKU) موجود مسبقاً', 409);
    }
  }

  // Check for duplicate barcode
  if (updateData.barcode) {
    const [duplicate] = await db.execute(
      'SELECT id FROM InventoryItem WHERE barcode = ? AND id != ? AND deletedAt IS NULL',
      [updateData.barcode, id]
    );

    if (duplicate.length) {
      throw new AppError('الباركود موجود مسبقاً', 409);
    }
  }

  // Build update query dynamically
  const updateFields = [];
  const params = [];

  Object.keys(updateData).forEach(key => {
    if (key === 'customFields' && updateData[key]) {
      updateFields.push(`${key} = ?`);
      params.push(JSON.stringify(updateData[key]));
    } else {
      updateFields.push(`${key} = ?`);
      params.push(updateData[key]);
    }
  });

  if (updateFields.length === 0) {
    throw new AppError('لا توجد بيانات للتحديث', 400);
  }

  updateFields.push('updatedAt = NOW()');
  params.push(id);

  await db.execute(`
    UPDATE InventoryItem 
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `, params);

  res.json({
    success: true,
    message: 'تم تحديث الصنف بنجاح'
  });
});

/**
 * Delete inventory item (soft delete)
 * DELETE /api/inventory/:id
 */
exports.deleteItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if item exists
  const [existing] = await db.execute(
    'SELECT id FROM InventoryItem WHERE id = ? AND deletedAt IS NULL',
    [id]
  );

  if (!existing.length) {
    throw new AppError('الصنف غير موجود', 404);
  }

  // Check if item has stock
  const [stock] = await db.execute(
    'SELECT SUM(currentQuantity) as total FROM StockLevel WHERE inventoryItemId = ?',
    [id]
  );

  if (stock[0].total > 0) {
    throw new AppError('لا يمكن حذف الصنف لوجود مخزون حالي', 400);
  }

  // Soft delete
  await db.execute(
    'UPDATE InventoryItem SET deletedAt = NOW() WHERE id = ?',
    [id]
  );

  res.json({
    success: true,
    message: 'تم حذف الصنف بنجاح'
  });
});

/**
 * Get inventory statistics
 * GET /api/inventory/stats
 */
exports.getStats = asyncHandler(async (req, res) => {
  const [stats] = await db.execute(`
    SELECT 
      COUNT(DISTINCT i.id) as totalItems,
      COUNT(DISTINCT i.id) as activeItems,
      COALESCE(SUM(sl.quantity), 0) as totalQuantity,
      COALESCE(SUM(sl.quantity * i.purchasePrice), 0) as totalCostValue,
      COALESCE(SUM(sl.quantity * i.sellingPrice), 0) as totalSellingValue,
      COUNT(DISTINCT c.id) as totalCategories
    FROM InventoryItem i
    LEFT JOIN StockLevel sl ON i.id = sl.inventoryItemId
    LEFT JOIN InventoryItemCategory c ON c.name COLLATE utf8mb4_unicode_ci = i.type COLLATE utf8mb4_unicode_ci
    WHERE i.deletedAt IS NULL
  `);

  // Get by category
  const [byCategory] = await db.execute(`
    SELECT 
      c.name as category,
      COUNT(DISTINCT i.id) as items,
      COALESCE(SUM(sl.quantity), 0) as totalQuantity,
      COALESCE(SUM(sl.quantity * i.purchasePrice), 0) as totalValue
    FROM InventoryItemCategory c
    LEFT JOIN InventoryItem i ON c.name COLLATE utf8mb4_unicode_ci = i.type COLLATE utf8mb4_unicode_ci AND i.deletedAt IS NULL
    LEFT JOIN StockLevel sl ON i.id = sl.inventoryItemId
    GROUP BY c.id
    ORDER BY totalValue DESC
  `);

  res.json({
    success: true,
    data: {
      overview: stats[0],
      byCategory
    }
  });
});

/**
 * Get stock movements with filters
 * GET /api/inventory-enhanced/movements
 */
exports.getMovements = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    itemId = '',
    warehouseId = '',
    movementType = '',
    dateFrom = '',
    dateTo = ''
  } = req.query;

  const offset = (page - 1) * limit;

  // Build WHERE conditions
  let whereConditions = [];
  const params = [];

  if (itemId) {
    whereConditions.push('sm.inventoryItemId = ?');
    params.push(itemId);
  }

  if (warehouseId) {
    whereConditions.push('sm.warehouseId = ?');
    params.push(warehouseId);
  }

  if (movementType) {
    whereConditions.push('sm.movementType = ?');
    params.push(movementType);
  }

  if (dateFrom) {
    whereConditions.push('sm.createdAt >= ?');
    params.push(dateFrom);
  }

  if (dateTo) {
    whereConditions.push('sm.createdAt <= ?');
    params.push(dateTo);
  }

  const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

  // Get movements
  // CRITICAL: Use db.query instead of db.execute for queries with LIMIT/OFFSET
  // db.execute uses prepared statements which cause issues with LIMIT/OFFSET in MariaDB strict mode
  // db.query interpolates values directly and works perfectly with LIMIT/OFFSET
  const [movements] = await db.query(`
    SELECT 
      sm.*,
      i.name as itemName,
      i.sku,
      w.name as warehouseName,
      sm.createdBy as createdByName
    FROM StockMovement sm
    LEFT JOIN InventoryItem i ON sm.inventoryItemId = i.id
    LEFT JOIN Warehouse w ON sm.warehouseId = w.id
    ${whereClause}
    ORDER BY sm.createdAt DESC
    LIMIT ? OFFSET ?
  `, [...params, parseInt(limit), offset]);

  // Get total count
  const [countResult] = await db.execute(`
    SELECT COUNT(*) as total
    FROM StockMovement sm
    ${whereClause}
  `, params);

  const total = countResult[0].total;
  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: {
      movements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems: total,
        totalPages
      }
    }
  });
});

/**
 * Create stock movement
 * POST /api/inventory-enhanced/movements
 */
exports.createMovement = asyncHandler(async (req, res) => {
  const {
    inventoryItemId,
    warehouseId,
    movementType,
    quantity,
    unitCost,
    totalCost,
    referenceType,
    referenceId,
    notes,
    createdBy,
    fromWarehouseId,
    toWarehouseId
  } = req.body;

  // Validate required fields
  if (!inventoryItemId || !warehouseId || !movementType || !quantity) {
    throw new AppError('البيانات المطلوبة ناقصة', 400);
  }

  // Validate quantity
  if (quantity <= 0) {
    throw new AppError('الكمية يجب أن تكون أكبر من صفر', 400);
  }

  // For 'out' movements, check available stock
  if (movementType === 'out') {
    const [stockLevels] = await db.execute(`
      SELECT quantity 
      FROM StockLevel 
      WHERE inventoryItemId = ? AND warehouseId = ?
    `, [inventoryItemId, warehouseId]);

    if (stockLevels.length === 0) {
      throw new AppError('لا يوجد مخزون لهذا الصنف في المخزن المحدد', 400);
    }

    const availableQuantity = stockLevels[0].quantity;
    if (availableQuantity < quantity) {
      throw new AppError(`الكمية المتاحة (${availableQuantity}) أقل من المطلوب (${quantity})`, 400);
    }
  }

  // Start transaction
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Insert movement
    const [movementResult] = await connection.execute(`
      INSERT INTO StockMovement (
        inventoryItemId, warehouseId, movementType, quantity,
        unitCost, totalCost, referenceType, referenceId,
        notes, createdBy, fromWarehouseId, toWarehouseId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      inventoryItemId, warehouseId, movementType, quantity,
      unitCost, totalCost, referenceType, referenceId,
      notes, createdBy, fromWarehouseId, toWarehouseId
    ]);

    const movementId = movementResult.insertId;

    // Update stock levels
    if (movementType === 'in') {
      // Add to stock
      await connection.execute(`
        INSERT INTO StockLevel (inventoryItemId, warehouseId, currentQuantity)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
        currentQuantity = currentQuantity + ?,
        updatedAt = CURRENT_TIMESTAMP
      `, [inventoryItemId, warehouseId, quantity, quantity]);

    } else if (movementType === 'out') {
      // Remove from stock
      await connection.execute(`
        UPDATE StockLevel 
        SET currentQuantity = currentQuantity - ?,
            updatedAt = CURRENT_TIMESTAMP
        WHERE inventoryItemId = ? AND warehouseId = ?
      `, [quantity, inventoryItemId, warehouseId]);

    } else if (movementType === 'transfer') {
      // Transfer between warehouses
      if (!fromWarehouseId || !toWarehouseId) {
        throw new AppError('تحتاج تحديد المخزن المصدر والوجهة للنقل', 400);
      }

      // Remove from source warehouse
      await connection.execute(`
        UPDATE StockLevel 
        SET currentQuantity = currentQuantity - ?,
            updatedAt = CURRENT_TIMESTAMP
        WHERE inventoryItemId = ? AND warehouseId = ?
      `, [quantity, inventoryItemId, fromWarehouseId]);

      // Add to destination warehouse
      await connection.execute(`
        INSERT INTO StockLevel (inventoryItemId, warehouseId, currentQuantity)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
        currentQuantity = currentQuantity + ?,
        updatedAt = CURRENT_TIMESTAMP
      `, [inventoryItemId, toWarehouseId, quantity, quantity]);
    }

    await connection.commit();
    connection.release();

    res.status(201).json({
      success: true,
      message: 'تم تسجيل حركة المخزون بنجاح وتحديث المستويات',
      data: {
        movementId,
        movementType,
        quantity
      }
    });

  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
});

