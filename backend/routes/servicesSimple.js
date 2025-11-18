const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const { validate, serviceSchemas } = require('../middleware/validation');

// Simplified Services Route - Basic functionality only
// GET /services - يجب أن يكون محمي (أو public حسب المتطلبات)
router.get('/', auth, validate(serviceSchemas.getServices, 'query'), async (req, res) => {
  try {
    const {
      q = '',
      sortBy = 'id',
      sortDir = 'asc',
      limit = '50',
      offset = '0',
      page,
      pageSize,
      isActive,
    } = req.query;

    // Whitelists to prevent SQL injection for identifiers
    const allowedSortBy = new Set(['id', 'name', 'basePrice', 'isActive', 'createdAt', 'updatedAt']);
    
    // Map frontend sortBy values to database column names
    const sortByMapping = {
      'serviceName': 'name',
      'name': 'name'
    };
    
    const mappedSortBy = sortByMapping[String(sortBy)] || String(sortBy);
    const safeSortBy = allowedSortBy.has(mappedSortBy) ? mappedSortBy : 'id';
    const safeSortDir = String(sortDir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Handle both pagination formats: page/pageSize and limit/offset
    let safeLimit, safeOffset;
    if (page && pageSize) {
      // Frontend pagination format
      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const size = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 200);
      safeLimit = size;
      safeOffset = (pageNum - 1) * size;
    } else {
      // Backend pagination format
      safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
      safeOffset = Math.max(parseInt(offset, 10) || 0, 0);
    }

    const whereClauses = ['deletedAt IS NULL'];
    const params = [];

    if (q && String(q).trim() !== '') {
      const like = `%${String(q).trim()}%`;
      whereClauses.push('(name LIKE ? OR description LIKE ? OR CAST(id AS CHAR) LIKE ?)');
      params.push(like, like, like);
    }

    if (typeof isActive !== 'undefined') {
      // Accept 1/0/true/false
      const active = ['1', 'true', 'TRUE', 'yes'].includes(String(isActive));
      whereClauses.push('isActive = ?');
      params.push(active ? 1 : 0);
    }

    // Category filter
    if (req.query.category && String(req.query.category).trim() !== '') {
      whereClauses.push('category = ?');
      params.push(String(req.query.category).trim());
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const sql = `
      SELECT *
      FROM Service
      ${whereSql}
      ORDER BY ${safeSortBy} ${safeSortDir}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(sql, [...params, safeLimit, safeOffset]);

    // Get total count for pagination
    const countSql = `
      SELECT COUNT(*) as total
      FROM Service
      ${whereSql}
    `;
    const [countResult] = await db.query(countSql, params);
    const total = countResult[0].total;

    res.json({
      items: rows,  // Changed from 'services' to 'items' to match frontend expectation
      total,
      page: Math.floor(safeOffset / safeLimit) + 1,
      pageSize: safeLimit,
      totalPages: Math.ceil(total / safeLimit)
    });

  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ 
      error: 'Server Error',
      details: error.message 
    });
  }
});

// Get service by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT *
      FROM Service
      WHERE id = ? AND deletedAt IS NULL
    `;
    
    const [rows] = await db.query(sql, [id]);
    
    if (!rows.length) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json(rows[0]);
    
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ 
      error: 'Server Error',
      details: error.message 
    });
  }
});

// Create a new service - Admin only
router.post('/', auth, authorize([1]), validate(serviceSchemas.createService), async (req, res) => {
  try {
    const { name, description, basePrice, category, categoryId, estimatedDuration, isActive = true } = req.body;
    
    // Check for duplicate service name
    const [existing] = await db.query(
      'SELECT id FROM Service WHERE name = ? AND deletedAt IS NULL',
      [name]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ 
        success: false,
        error: 'Service name already exists',
        message: 'اسم الخدمة موجود مسبقاً'
      });
    }
    
    // Determine category value (use categoryId if provided, else use category string)
    const finalCategory = categoryId ? null : (category || null);
    const finalCategoryId = categoryId || null;
    
    // Insert service - note: category field is string, we'll use it for backward compatibility
    const sql = `
      INSERT INTO Service (name, description, basePrice, category, estimatedDuration, isActive)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.query(sql, [name, description, basePrice, finalCategory, estimatedDuration, isActive]);
    
    // If categoryId is provided, we might want to create a ServiceCategory relationship in future
    // For now, we'll store category as string for backward compatibility
    
    res.status(201).json({
      success: true,
      id: result.insertId,
      serviceName: name,
      name,
      description,
      basePrice,
      category: finalCategory,
      categoryId: finalCategoryId,
      estimatedDuration,
      isActive
    });
    
  } catch (error) {
    console.error('Error creating service:', error);
    
    // Handle duplicate entry error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        success: false,
        error: 'Service name already exists',
        message: 'اسم الخدمة موجود مسبقاً'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message 
    });
  }
});

// Update a service - Admin only
router.put('/:id', auth, authorize([1]), validate(serviceSchemas.updateService), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, basePrice, category, categoryId, estimatedDuration, isActive } = req.body;
    
    // Check if service exists
    const [existingService] = await db.query(
      'SELECT name FROM Service WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (!existingService.length) {
      return res.status(404).json({ 
        success: false,
        error: 'Service not found',
        message: 'الخدمة غير موجودة'
      });
    }
    
    // If name is being updated, check for duplicate
    if (name && name !== existingService[0].name) {
      const [duplicate] = await db.query(
        'SELECT id FROM Service WHERE name = ? AND id != ? AND deletedAt IS NULL',
        [name, id]
      );
      
      if (duplicate.length > 0) {
        return res.status(409).json({ 
          success: false,
          error: 'Service name already exists',
          message: 'اسم الخدمة موجود مسبقاً'
        });
      }
    }
    
    // Build update query dynamically based on provided fields
    const updateFields = [];
    const updateValues = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description || null);
    }
    
    if (basePrice !== undefined) {
      updateFields.push('basePrice = ?');
      updateValues.push(basePrice);
    }
    
    if (category !== undefined || categoryId !== undefined) {
      // Use categoryId if provided, else use category string
      const finalCategory = categoryId ? null : (category !== undefined ? category : null);
      updateFields.push('category = ?');
      updateValues.push(finalCategory);
    }
    
    if (estimatedDuration !== undefined) {
      updateFields.push('estimatedDuration = ?');
      updateValues.push(estimatedDuration || null);
    }
    
    if (isActive !== undefined) {
      updateFields.push('isActive = ?');
      updateValues.push(isActive);
    }
    
    // Always update updatedAt
    updateFields.push('updatedAt = CURRENT_TIMESTAMP');
    updateValues.push(id);
    
    const sql = `
      UPDATE Service
      SET ${updateFields.join(', ')}
      WHERE id = ? AND deletedAt IS NULL
    `;
    
    const [result] = await db.query(sql, updateValues);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Service not found',
        message: 'الخدمة غير موجودة'
      });
    }
    
    res.json({ 
      success: true,
      message: 'Service updated successfully',
      messageAr: 'تم تحديث الخدمة بنجاح'
    });
    
  } catch (error) {
    console.error('Error updating service:', error);
    
    // Handle duplicate entry error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        success: false,
        error: 'Service name already exists',
        message: 'اسم الخدمة موجود مسبقاً'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message 
    });
  }
});

// Delete a service (soft delete) - Admin only
router.delete('/:id', auth, authorize([1]), async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      UPDATE Service
      SET deletedAt = CURRENT_TIMESTAMP
      WHERE id = ? AND deletedAt IS NULL
    `;
    
    const [result] = await db.query(sql, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json({ message: 'Service deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ 
      error: 'Server Error',
      details: error.message 
    });
  }
});

// Get service usage statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get service details
    const serviceSql = `
      SELECT *
      FROM Service
      WHERE id = ? AND deletedAt IS NULL
    `;
    
    const [serviceRows] = await db.query(serviceSql, [id]);
    
    if (!serviceRows.length) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const service = serviceRows[0];
    
    // Get usage statistics from RepairRequestServices
    const statsSql = `
      SELECT 
        COUNT(rrs.id) as totalUsage,
        COUNT(CASE WHEN rr.status = 'completed' THEN 1 END) as completedUsage,
        COALESCE(SUM(CASE WHEN rr.status = 'completed' THEN rrs.price END), 0) as totalRevenue,
        COALESCE(AVG(CASE WHEN rr.status = 'completed' THEN rrs.price END), 0) as avgPrice,
        MAX(rr.createdAt) as lastUsed,
        MIN(rr.createdAt) as firstUsed
      FROM RepairRequestService rrs
      LEFT JOIN RepairRequest rr ON rrs.repairRequestId = rr.id AND rr.deletedAt IS NULL
      WHERE rrs.serviceId = ?
    `;
    
    const [statsRows] = await db.query(statsSql, [id]);
    const stats = statsRows[0];
    
    // Get recent usage
    const recentSql = `
      SELECT 
        rr.id,
        rr.deviceType,
        rr.deviceBrand,
        rr.createdAt,
        rr.status,
        rrs.price,
        c.name as customerName
      FROM RepairRequestService rrs
      LEFT JOIN RepairRequest rr ON rrs.repairRequestId = rr.id AND rr.deletedAt IS NULL
      LEFT JOIN Customer c ON rr.customerId = c.id AND c.deletedAt IS NULL
      WHERE rrs.serviceId = ?
      ORDER BY rr.createdAt DESC
      LIMIT 5
    `;
    
    const [recentRows] = await db.query(recentSql, [id]);
    
    res.json({
      service,
      stats: {
        totalUsage: parseInt(stats.totalUsage) || 0,
        completedUsage: parseInt(stats.completedUsage) || 0,
        totalRevenue: parseFloat(stats.totalRevenue) || 0,
        avgPrice: parseFloat(stats.avgPrice) || 0,
        lastUsed: stats.lastUsed,
        firstUsed: stats.firstUsed
      },
      recentUsage: recentRows
    });
    
  } catch (error) {
    console.error('Error fetching service stats:', error);
    res.status(500).json({ 
      error: 'Server Error',
      details: error.message 
    });
  }
});

module.exports = router;
