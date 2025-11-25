const db = require('../db');

/**
 * Barcode Controller
 * Handles barcode generation, scanning, and lookup
 */

// توليد باركود للصنف
exports.generateBarcode = async (req, res) => {
  try {
    const { inventoryItemId, barcodeType = 'CODE128' } = req.body;

    // التحقق من الصنف
    const [item] = await db.execute(
      'SELECT id, sku, name FROM InventoryItem WHERE id = ?',
      [inventoryItemId]
    );

    if (item.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الصنف غير موجود'
      });
    }

    // توليد باركود من SKU أو ID
    const barcodeValue = item[0].sku || `ITEM${String(item[0].id).padStart(8, '0')}`;

    // تحديث الصنف بالباركود
    await db.execute(
      'UPDATE InventoryItem SET sku = ?, barcodeType = ? WHERE id = ?',
      [barcodeValue, barcodeType, inventoryItemId]
    );

    res.json({
      success: true,
      data: {
        barcode: barcodeValue,
        barcodeType,
        item: item[0]
      }
    });
  } catch (error) {
    console.error('Error generating barcode:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في توليد الباركود',
      error: error.message
    });
  }
};

// مسح باركود
exports.scanBarcode = async (req, res) => {
  try {
    const {
      barcode,
      scanType = 'lookup',
      warehouseId,
      scannedBy,
      referenceType,
      referenceId
    } = req.body;

    // البحث عن الصنف بالباركود
    const [items] = await db.execute(
      `SELECT 
        ii.*,
        SUM(sl.currentQuantity) as totalQuantity,
        SUM(sl.availableQuantity) as availableQuantity
      FROM InventoryItem ii
      LEFT JOIN StockLevel sl ON ii.id = sl.inventoryItemId
      WHERE ii.sku = ? AND ii.deletedAt IS NULL
      GROUP BY ii.id`,
      [barcode]
    );

    const result = items.length > 0 ? 'success' : 'not_found';
    const errorMessage = items.length === 0 ? 'الصنف غير موجود' : null;

    // تسجيل عملية المسح
    await db.execute(
      `INSERT INTO BarcodeScan (
        barcode, inventoryItemId, scannedBy, scanType, warehouseId,
        referenceType, referenceId, result, errorMessage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        barcode,
        items.length > 0 ? items[0].id : null,
        scannedBy || 1,
        scanType,
        warehouseId || null,
        referenceType || null,
        referenceId || null,
        result,
        errorMessage
      ]
    );

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الصنف غير موجود',
        barcode
      });
    }

    res.json({
      success: true,
      data: {
        item: items[0],
        scanType,
        result
      }
    });
  } catch (error) {
    console.error('Error scanning barcode:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في مسح الباركود',
      error: error.message
    });
  }
};

// البحث بالباركود
exports.getItemByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;

    const [items] = await db.execute(
      `SELECT 
        ii.*,
        iic.name as categoryName,
        SUM(sl.currentQuantity) as totalQuantity,
        SUM(sl.availableQuantity) as availableQuantity,
        SUM(sl.reservedQuantity) as reservedQuantity
      FROM InventoryItem ii
      LEFT JOIN InventoryItemCategory iic ON ii.category = iic.name
      LEFT JOIN StockLevel sl ON ii.id = sl.inventoryItemId
      WHERE ii.sku = ? AND ii.deletedAt IS NULL
      GROUP BY ii.id`,
      [barcode]
    );

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الصنف غير موجود'
      });
    }

    // جلب مستويات المخزون لكل مخزن
    const [stockLevels] = await db.execute(
      `SELECT 
        sl.*,
        w.name as warehouseName
      FROM StockLevel sl
      LEFT JOIN Warehouse w ON sl.warehouseId = w.id
      WHERE sl.inventoryItemId = ?`,
      [items[0].id]
    );

    res.json({
      success: true,
      data: {
        ...items[0],
        stockLevels
      }
    });
  } catch (error) {
    console.error('Error getting item by barcode:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في البحث',
      error: error.message
    });
  }
};

// مسح متعدد
exports.batchScan = async (req, res) => {
  try {
    const { barcodes, scanType = 'lookup', warehouseId, scannedBy } = req.body;

    if (!Array.isArray(barcodes) || barcodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'يجب تقديم قائمة باركودات'
      });
    }

    const results = [];

    for (const barcode of barcodes) {
      const [items] = await db.execute(
        'SELECT id, name, sku FROM InventoryItem WHERE sku = ? AND deletedAt IS NULL',
        [barcode]
      );

      const result = items.length > 0 ? 'success' : 'not_found';
      
      // تسجيل المسح
      await db.execute(
        `INSERT INTO BarcodeScan (
          barcode, inventoryItemId, scannedBy, scanType, warehouseId, result
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          barcode,
          items.length > 0 ? items[0].id : null,
          scannedBy || 1,
          scanType,
          warehouseId || null,
          result
        ]
      );

      results.push({
        barcode,
        result,
        item: items.length > 0 ? items[0] : null
      });
    }

    const successCount = results.filter(r => r.result === 'success').length;
    const notFoundCount = results.filter(r => r.result === 'not_found').length;

    res.json({
      success: true,
      data: {
        total: barcodes.length,
        successCount,
        notFoundCount,
        results
      }
    });
  } catch (error) {
    console.error('Error in batch scan:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في المسح المتعدد',
      error: error.message
    });
  }
};

// سجل المسح
exports.getScanHistory = async (req, res) => {
  try {
    const { limit = 50, offset = 0, scanType, result, startDate, endDate } = req.query;

    let whereClause = '1=1';
    const params = [];

    if (scanType) {
      whereClause += ' AND bs.scanType = ?';
      params.push(scanType);
    }

    if (result) {
      whereClause += ' AND bs.result = ?';
      params.push(result);
    }

    if (startDate) {
      whereClause += ' AND DATE(bs.scannedAt) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND DATE(bs.scannedAt) <= ?';
      params.push(endDate);
    }

    // CRITICAL: Use db.query instead of db.execute for queries with LIMIT/OFFSET
    // db.execute uses prepared statements which cause issues with LIMIT/OFFSET in MariaDB strict mode
    // db.query interpolates values directly and works perfectly with LIMIT/OFFSET
    const [scans] = await db.query(
      `SELECT 
        bs.*,
        ii.name as itemName,
        ii.sku as itemSku,
        u.username as scannedByUser,
        w.name as warehouseName
      FROM BarcodeScan bs
      LEFT JOIN InventoryItem ii ON bs.inventoryItemId = ii.id
      LEFT JOIN User u ON bs.scannedBy = u.id
      LEFT JOIN Warehouse w ON bs.warehouseId = w.id
      WHERE ${whereClause}
      ORDER BY bs.scannedAt DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM BarcodeScan bs WHERE ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        scans,
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error getting scan history:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب السجل',
      error: error.message
    });
  }
};

// إحصائيات المسح
exports.getScanStats = async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as totalScans,
        SUM(CASE WHEN result = 'success' THEN 1 ELSE 0 END) as successfulScans,
        SUM(CASE WHEN result = 'not_found' THEN 1 ELSE 0 END) as notFoundScans,
        SUM(CASE WHEN result = 'error' THEN 1 ELSE 0 END) as errorScans,
        COUNT(DISTINCT inventoryItemId) as uniqueItems,
        COUNT(DISTINCT scannedBy) as uniqueUsers,
        DATE(MAX(scannedAt)) as lastScanDate
      FROM BarcodeScan
      WHERE scannedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    const [scansByType] = await db.execute(`
      SELECT 
        scanType,
        COUNT(*) as count
      FROM BarcodeScan
      WHERE scannedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY scanType
    `);

    const [topItems] = await db.execute(`
      SELECT 
        ii.id,
        ii.name,
        ii.sku,
        COUNT(bs.id) as scanCount
      FROM BarcodeScan bs
      INNER JOIN InventoryItem ii ON bs.inventoryItemId = ii.id
      WHERE bs.scannedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY ii.id
      ORDER BY scanCount DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        overview: stats[0],
        byType: scansByType,
        topScannedItems: topItems
      }
    });
  } catch (error) {
    console.error('Error getting scan stats:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب الإحصائيات',
      error: error.message
    });
  }
};

module.exports = exports;

