const express = require('express');
const router = express.Router();
const db = require('../db');

// Simplified Services Route - Basic functionality only
router.get('/', async (req, res) => {
  try {
    const {
      q = '',
      sortBy = 'id',
      sortDir = 'asc',
      limit = '50',
      offset = '0',
      isActive,
    } = req.query;

    // Whitelists to prevent SQL injection for identifiers
    const allowedSortBy = new Set(['id', 'serviceName', 'basePrice', 'isActive', 'createdAt', 'updatedAt']);
    const safeSortBy = allowedSortBy.has(String(sortBy)) ? String(sortBy) : 'id';
    const safeSortDir = String(sortDir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);

    const whereClauses = ['deletedAt IS NULL'];
    const params = [];

    if (q && String(q).trim() !== '') {
      const like = `%${String(q).trim()}%`;
      whereClauses.push('(serviceName LIKE ? OR description LIKE ? OR CAST(id AS CHAR) LIKE ?)');
      params.push(like, like, like);
    }

    if (typeof isActive !== 'undefined') {
      // Accept 1/0/true/false
      const active = ['1', 'true', 'TRUE', 'yes'].includes(String(isActive));
      whereClauses.push('isActive = ?');
      params.push(active ? 1 : 0);
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
router.get('/:id', async (req, res) => {
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

// Create a new service
router.post('/', async (req, res) => {
  try {
    const { name, description, basePrice, category, estimatedDuration, isActive = true } = req.body;
    
    if (!name || !basePrice) {
      return res.status(400).json({ error: 'Name and base price are required' });
    }
    
    const sql = `
      INSERT INTO Service (serviceName, description, basePrice, category, estimatedDuration, isActive)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.query(sql, [name, description, basePrice, category, estimatedDuration, isActive]);
    
    res.status(201).json({
      id: result.insertId,
      serviceName: name,
      description,
      basePrice,
      category,
      estimatedDuration,
      isActive
    });
    
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ 
      error: 'Server Error',
      details: error.message 
    });
  }
});

// Update a service
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, basePrice, category, estimatedDuration, isActive } = req.body;
    
    if (!name || !basePrice) {
      return res.status(400).json({ error: 'Name and base price are required' });
    }
    
    const sql = `
      UPDATE Service
      SET serviceName = ?, description = ?, basePrice = ?, category = ?, estimatedDuration = ?, isActive = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ? AND deletedAt IS NULL
    `;
    
    const [result] = await db.query(sql, [name, description, basePrice, category, estimatedDuration, isActive, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json({ message: 'Service updated successfully' });
    
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ 
      error: 'Server Error',
      details: error.message 
    });
  }
});

// Delete a service (soft delete)
router.delete('/:id', async (req, res) => {
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
router.get('/:id/stats', async (req, res) => {
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
        MAX(rr.receivedAt) as lastUsed,
        MIN(rr.receivedAt) as firstUsed
      FROM RepairRequestServices rrs
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
        rr.receivedAt,
        rr.status,
        rrs.price,
        c.name as customerName
      FROM RepairRequestServices rrs
      LEFT JOIN RepairRequest rr ON rrs.repairRequestId = rr.id AND rr.deletedAt IS NULL
      LEFT JOIN Customer c ON rr.customerId = c.id AND c.deletedAt IS NULL
      WHERE rrs.serviceId = ?
      ORDER BY rr.receivedAt DESC
      LIMIT 5
    `;
    
    const [recentRows] = await db.query(recentSql, [id]);
    
    res.json({
      service,
      stats: {
        totalUsage: stats.totalUsage || 0,
        completedUsage: stats.completedUsage || 0,
        totalRevenue: stats.totalRevenue || 0,
        avgPrice: stats.avgPrice || 0,
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
