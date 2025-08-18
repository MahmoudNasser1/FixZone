const db = require('../db');
const { validationResult } = require('express-validator');

/**
 * Inventory Controller - Comprehensive inventory management
 * Supports: CRUD operations, stock tracking, bulk actions, search, filtering
 */
class InventoryController {
  
  // Get all inventory items with advanced filtering and stock levels
  async getAllInventoryItems(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        type = '',
        lowStock = false,
        warehouseId = '',
        sortBy = 'name',
        sortOrder = 'ASC'
      } = req.query;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE inv.deletedAt IS NULL';
      const queryParams = [];

      // Search functionality
      if (search) {
        whereClause += ` AND (inv.name LIKE ? OR inv.sku LIKE ? OR inv.type LIKE ?)`;
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      // Type filter
      if (type) {
        whereClause += ` AND inv.type = ?`;
        queryParams.push(type);
      }

      // Warehouse filter
      if (warehouseId) {
        whereClause += ` AND w.id = ?`;
        queryParams.push(warehouseId);
      }

      // Low stock filter (سيتم التعامل معه لاحقًا عبر الحقول المشتقة/التجميع)
      if (lowStock === 'true') {
        // ملاحظة: سنقوم بالاعتماد على الحقل المشتق isLowStock في النتائج بدل فلتر WHERE لأن minLevel موجودة في StockLevel
      }

      // Validate sort parameters
      const allowedSortFields = ['name', 'sku', 'type', 'purchasePrice', 'sellingPrice', 'totalStock'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'name';
      const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      // Main query with stock levels
      const query = `
        SELECT 
          inv.id,
          inv.sku,
          inv.name,
          inv.type,
          inv.purchasePrice,
          inv.sellingPrice,
          inv.serialNumber,
          inv.createdAt,
          inv.updatedAt,
          w.name as warehouseName,
          COALESCE(SUM(sl.quantity), 0) as totalStock,
          CASE 
            WHEN COALESCE(SUM(sl.quantity), 0) <= MIN(sl.minLevel) THEN true 
            ELSE false 
          END as isLowStock
        FROM InventoryItem inv
        LEFT JOIN StockLevel sl ON inv.id = sl.inventoryItemId
        LEFT JOIN Warehouse w ON sl.warehouseId = w.id
        ${whereClause}
        GROUP BY inv.id, w.id
        ORDER BY inv.${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
      `;

      queryParams.push(parseInt(limit), parseInt(offset));

      const [items] = await db.query(query, queryParams);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(DISTINCT inv.id) as total
        FROM InventoryItem inv
        LEFT JOIN StockLevel sl ON inv.id = sl.inventoryItemId
        LEFT JOIN Warehouse w ON sl.warehouseId = w.id
        ${whereClause}
      `;
      
      const [countResult] = await db.query(countQuery, queryParams.slice(0, -2));
      const totalCount = countResult[0].total;

      // Get inventory statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as totalItems,
          SUM(CASE WHEN sl.quantity <= sl.minLevel THEN 1 ELSE 0 END) as lowStockItems,
          SUM(sl.quantity) as totalQuantity,
          AVG(inv.purchasePrice) as avgPurchasePrice,
          AVG(inv.sellingPrice) as avgSellingPrice
        FROM InventoryItem inv
        LEFT JOIN StockLevel sl ON inv.id = sl.inventoryItemId
        WHERE inv.deletedAt IS NULL
      `;
      
      const [stats] = await db.query(statsQuery);

      // Process stock by warehouse data
      const processedItems = items.map(item => ({
        ...item,
        stockByWarehouse: item.stockByWarehouse ? 
          item.stockByWarehouse.split(';').map(entry => {
            const [name, quantity] = entry.split(':');
            return { warehouse: name, quantity: parseInt(quantity) || 0 };
          }) : []
      }));

      res.json({
        success: true,
        data: {
          items: processedItems,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: parseInt(limit)
          },
          stats: stats[0]
        }
      });
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Get single inventory item with detailed stock information
  async getInventoryItemById(req, res) {
    try {
      const { id } = req.params;

      // Get item details
      const [itemRows] = await db.query(`
        SELECT 
          inv.*,
          COALESCE(SUM(sl.quantity), 0) as totalStock
        FROM InventoryItem inv
        LEFT JOIN StockLevel sl ON inv.id = sl.inventoryItemId
        WHERE inv.id = ? AND inv.deletedAt IS NULL
        GROUP BY inv.id
      `, [id]);

      if (itemRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Inventory item not found' });
      }

      const item = itemRows[0];

      // Get stock levels for the item
      const [stockLevels] = await db.query(
        `SELECT sl.*, w.name as warehouseName 
         FROM StockLevel sl 
         LEFT JOIN Warehouse w ON sl.warehouseId = w.id 
         WHERE sl.inventoryItemId = ?`,
        [id]
      );

      // Get recent stock movements
      const [movements] = await db.query(`
        SELECT 
          sm.id, sm.type, sm.quantity, sm.inventoryItemId,
          sm.fromWarehouseId, w1.name as fromWarehouseName,
          sm.toWarehouseId, w2.name as toWarehouseName,
          sm.userId, u.name as createdByName,
          sm.createdAt, sm.updatedAt
        FROM StockMovement sm
        LEFT JOIN Warehouse w1 ON sm.fromWarehouseId = w1.id
        LEFT JOIN Warehouse w2 ON sm.toWarehouseId = w2.id
        LEFT JOIN User u ON sm.userId = u.id
        WHERE sm.inventoryItemId = ?
        ORDER BY sm.createdAt DESC
        LIMIT 20
      `, [id]);

      // Get usage history
      const [usageHistory] = await db.query(`
        SELECT 
          pu.*,
          rr.id as repairId,
          rr.deviceModel,
          c.name as customerName,
          u.name as technicianName
        FROM PartsUsed pu
        JOIN RepairRequest rr ON pu.repairRequestId = rr.id
        LEFT JOIN Customer c ON rr.customerId = c.id
        LEFT JOIN User u ON rr.technicianId = u.id
        WHERE pu.inventoryItemId = ?
        ORDER BY pu.createdAt DESC
        LIMIT 10
      `, [id]);

      res.json({
        success: true,
        data: {
          ...item,
          stockLevels,
          movements,
          usageHistory,
          stockStatus: item.totalStock <= 0 ? 'out_of_stock' : 
                      item.totalStock <= item.minStockLevel ? 'low_stock' : 'in_stock'
        }
      });
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Create new inventory item
  async createInventoryItem(req, res) {
    try {
      const {
        sku,
        name,
        type,
        purchasePrice,
        sellingPrice,
        serialNumber,
      } = req.body;

      if (!sku || !name || !type) {
        return res.status(400).json({ success: false, error: 'SKU, name, and type are required' });
      }

      // Check for duplicate SKU
      const [existingItem] = await db.query(
        'SELECT id FROM InventoryItem WHERE sku = ? AND deletedAt IS NULL',
        [sku]
      );

      if (existingItem.length > 0) {
        return res.status(400).json({ success: false, error: 'SKU already exists' });
      }

      const [result] = await db.query(
        `INSERT INTO InventoryItem (sku, name, type, purchasePrice, sellingPrice, serialNumber) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [sku, name, type, purchasePrice, sellingPrice, serialNumber]
      );

      const newItem = {
        id: result.insertId,
        sku, name, type, purchasePrice, sellingPrice, serialNumber
      };

      res.status(201).json({
        success: true,
        data: newItem,
        message: 'Inventory item created successfully'
      });
    } catch (error) {
      console.error('Error creating inventory item:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Update inventory item
  async updateInventoryItem(req, res) {
    try {
      const { id } = req.params;
      const {
        sku,
        name,
        type,
        purchasePrice,
        sellingPrice,
        serialNumber,
      } = req.body;

      // Check if item exists
      const [existingItem] = await db.query(
        'SELECT id FROM InventoryItem WHERE id = ? AND deletedAt IS NULL',
        [id]
      );

      if (existingItem.length === 0) {
        return res.status(404).json({ success: false, error: 'Inventory item not found' });
      }

      // Check for duplicate SKU (excluding current item)
      if (sku) {
        const [duplicateItem] = await db.query(
          'SELECT id FROM InventoryItem WHERE sku = ? AND id != ? AND deletedAt IS NULL',
          [sku, id]
        );

        if (duplicateItem.length > 0) {
          return res.status(400).json({ success: false, error: 'SKU already exists' });
        }
      }

      const updates = [];
      const values = [];

      if (sku) {
        updates.push('sku = ?');
        values.push(sku);
      }

      if (name) {
        updates.push('name = ?');
        values.push(name);
      }

      if (type) {
        updates.push('type = ?');
        values.push(type);
      }

      if (purchasePrice !== undefined) {
        updates.push('purchasePrice = ?');
        values.push(purchasePrice);
      }

      if (sellingPrice !== undefined) {
        updates.push('sellingPrice = ?');
        values.push(sellingPrice);
      }

      if (serialNumber) {
        updates.push('serialNumber = ?');
        values.push(serialNumber);
      }

      updates.push('updatedAt = NOW()');

      const [result] = await db.query(
        `UPDATE InventoryItem SET ${updates.join(', ')} WHERE id = ?`,
        values.concat([id])
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Inventory item not found' });
      }

      res.json({ success: true, message: 'Inventory item updated successfully' });
    } catch (error) {
      console.error('Error updating inventory item:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Soft delete inventory item
  async deleteInventoryItem(req, res) {
    try {
      const { id } = req.params;

      const [result] = await db.query(
        `UPDATE InventoryItem SET deletedAt = NOW() WHERE id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Inventory item not found' });
      }

      res.json({ success: true, message: 'Inventory item deleted successfully' });
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Adjust stock levels
  async adjustStock(req, res) {
    try {
      const { id } = req.params;
      const { warehouseId, quantity, type, reason = '', reference = '' } = req.body;

      if (!warehouseId || quantity === undefined || !type) {
        return res.status(400).json({ 
          success: false, 
          error: 'Warehouse ID, quantity, and type are required' 
        });
      }

      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // Check if item exists
        const [item] = await connection.query(
          'SELECT * FROM InventoryItem WHERE id = ? AND deletedAt IS NULL',
          [id]
        );

        if (item.length === 0) {
          throw new Error('Inventory item not found');
        }

        // Check if stock level exists
        const [existing] = await connection.query(
          'SELECT id, quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
          [id, warehouseId]
        );

        let currentQuantity = 0;
        if (existing.length === 0) {
          // Create new stock level
          await connection.query(
            'INSERT INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel) VALUES (?, ?, ?, ?)',
            [id, warehouseId, Math.max(0, quantity), 0]
          );
        } else {
          currentQuantity = Number(existing[0].quantity || 0);
        }

        // Calculate new quantity based on type
        let newQuantity;
        let movementQuantity;

        switch (type) {
          case 'add':
            newQuantity = currentQuantity + Math.abs(quantity);
            movementQuantity = Math.abs(quantity);
            break;
          case 'remove':
            newQuantity = Math.max(0, currentQuantity - Math.abs(quantity));
            movementQuantity = -Math.abs(quantity);
            break;
          case 'set':
            newQuantity = Math.max(0, quantity);
            movementQuantity = newQuantity - currentQuantity;
            break;
          default:
            throw new Error('Invalid adjustment type');
        }

        // Update existing
        await connection.query(
          'UPDATE StockLevel SET quantity = quantity + ?, updatedAt = NOW() WHERE inventoryItemId = ? AND warehouseId = ?',
          [movementQuantity, id, warehouseId]
        );

        // Record stock movement per schema (IN/OUT/TRANSFER) using fromWarehouseId/toWarehouseId and userId
        let fromWarehouseId = null;
        let toWarehouseId = null;
        if (type === 'add') {
          // IN to the warehouse
          toWarehouseId = warehouseId;
        } else if (type === 'remove') {
          // OUT from the warehouse
          fromWarehouseId = warehouseId;
        } else if (type === 'set') {
          // Represent SET as IN/OUT depending on delta
          if (movementQuantity >= 0) {
            toWarehouseId = warehouseId;
          } else {
            fromWarehouseId = warehouseId;
          }
        }

        const userId = req.user?.id || null;

        await connection.query(
          'INSERT INTO StockMovement (type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, userId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [type === 'set' ? (movementQuantity >= 0 ? 'IN' : 'OUT') : (type === 'add' ? 'IN' : type === 'remove' ? 'OUT' : type), Math.abs(movementQuantity), id, fromWarehouseId, toWarehouseId, userId]
        );

        await connection.commit();

        res.json({
          success: true,
          message: 'Stock adjusted successfully',
          data: {
            previousQuantity: currentQuantity,
            newQuantity,
            adjustment: movementQuantity
          }
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Bulk actions for inventory items
  async bulkAction(req, res) {
    try {
      const { action, itemIds, data = {} } = req.body;

      if (!action || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({ success: false, error: 'Action and item IDs are required' });
      }

      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        let result;
        const placeholders = itemIds.map(() => '?').join(',');

        switch (action) {
          case 'delete':
            [result] = await connection.query(`
              UPDATE InventoryItem SET deletedAt = NOW() 
              WHERE id IN (${placeholders}) AND deletedAt IS NULL
            `, itemIds);
            break;

          case 'updateType':
            if (!data.type) {
              throw new Error('Type is required for type update');
            }
            [result] = await connection.query(`
              UPDATE InventoryItem SET type = ?, updatedAt = NOW() 
              WHERE id IN (${placeholders}) AND deletedAt IS NULL
            `, [data.type, ...itemIds]);
            break;

          case 'updatePrices':
            if (data.purchasePrice === undefined && data.sellingPrice === undefined) {
              throw new Error('At least one price is required for price update');
            }
            let setParts = [];
            let params = [];
            if (data.purchasePrice !== undefined) {
              setParts.push('purchasePrice = ?');
              params.push(data.purchasePrice);
            }
            if (data.sellingPrice !== undefined) {
              setParts.push('sellingPrice = ?');
              params.push(data.sellingPrice);
            }
            setParts.push('updatedAt = NOW()');
            
            [result] = await connection.query(`
              UPDATE InventoryItem SET ${setParts.join(', ')} 
              WHERE id IN (${placeholders}) AND deletedAt IS NULL
            `, [...params, ...itemIds]);
            break;

          default:
            throw new Error('Invalid bulk action');
        }

        await connection.commit();

        res.json({
          success: true,
          message: `Bulk ${action} completed successfully`,
          affectedRows: result.affectedRows
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Get low stock alerts
  async getLowStockAlerts(req, res) {
    try {
      const [alerts] = await db.query(`
        SELECT 
          COUNT(*) as totalItems,
          SUM(CASE WHEN sl.quantity <= sl.minLevel THEN 1 ELSE 0 END) as lowStockItems,
          SUM(sl.quantity) as totalQuantity,
          AVG(inv.purchasePrice) as avgPurchasePrice,
          AVG(inv.sellingPrice) as avgSellingPrice
        FROM InventoryItem inv
        LEFT JOIN StockLevel sl ON inv.id = sl.inventoryItemId
        WHERE inv.deletedAt IS NULL
      `);

      res.json({ success: true, data: alerts });
    } catch (error) {
      console.error('Error fetching low stock alerts:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Get inventory types
  async getInventoryTypes(req, res) {
    try {
      const [types] = await db.query(`
        SELECT 
          type,
          COUNT(*) as count,
          SUM(COALESCE(sl_sum.totalStock, 0) * purchasePrice) as totalValue
        FROM InventoryItem inv
        LEFT JOIN (
          SELECT inventoryItemId, SUM(quantity) as totalStock
          FROM StockLevel 
          GROUP BY inventoryItemId
        ) sl_sum ON inv.id = sl_sum.inventoryItemId
        WHERE inv.deletedAt IS NULL
        GROUP BY type
        ORDER BY count DESC
      `);

      res.json({ success: true, data: types });
    } catch (error) {
      console.error('Error fetching inventory types:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Get inventory statistics (used by routes: GET /api/inventory/stats)
  async getInventoryStatistics(req, res) {
    try {
      // Overall stats
      const [overall] = await db.query(`
        SELECT 
          COUNT(*) as totalItems,
          SUM(CASE WHEN sl.quantity <= sl.minLevel THEN 1 ELSE 0 END) as lowStockItems,
          SUM(sl.quantity) as totalQuantity,
          AVG(inv.purchasePrice) as avgPurchasePrice,
          AVG(inv.sellingPrice) as avgSellingPrice
        FROM InventoryItem inv
        LEFT JOIN StockLevel sl ON inv.id = sl.inventoryItemId
        WHERE inv.deletedAt IS NULL
      `);

      // Top 10 lowest stock items
      const [lowStockList] = await db.query(`
        SELECT 
          inv.id,
          inv.name,
          inv.sku,
          COALESCE(SUM(sl.quantity), 0) as totalStock,
          MIN(sl.minLevel) as minLevel
        FROM InventoryItem inv
        LEFT JOIN StockLevel sl ON inv.id = sl.inventoryItemId
        WHERE inv.deletedAt IS NULL
        GROUP BY inv.id
        ORDER BY (CASE WHEN MIN(sl.minLevel) IS NULL OR MIN(sl.minLevel) = 0 THEN 999999 ELSE COALESCE(SUM(sl.quantity),0) / MIN(sl.minLevel) END) ASC
        LIMIT 10
      `);

      // Stock by type
      const [byType] = await db.query(`
        SELECT 
          inv.type,
          COUNT(*) as count,
          COALESCE(SUM(sl.quantity), 0) as totalQuantity
        FROM InventoryItem inv
        LEFT JOIN StockLevel sl ON inv.id = sl.inventoryItemId
        WHERE inv.deletedAt IS NULL
        GROUP BY inv.type
        ORDER BY count DESC
      `);

      res.json({
        success: true,
        data: {
          overall: overall[0] || {},
          lowStockList,
          byType
        }
      });
    } catch (error) {
      console.error('Error fetching inventory statistics:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }
}

module.exports = new InventoryController();
