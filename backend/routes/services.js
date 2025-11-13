const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');

// Get services with optional search/sort/pagination (excluding soft-deleted ones)
router.get('/', async (req, res) => {
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
    
    console.log('Debug - sortBy:', sortBy, 'mappedSortBy:', mappedSortBy, 'safeSortBy:', safeSortBy);
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

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const sql = `
      SELECT *
      FROM Service
      ${whereSql}
      ORDER BY ${safeSortBy} ${safeSortDir}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(sql, [...params, safeLimit, safeOffset]);

    // Also return total count for the same filter (without limit/offset)
    const countSql = `SELECT COUNT(*) as total FROM Service ${whereSql}`;
    const [countRows] = await db.query(countSql, params);
    const total = countRows?.[0]?.total || 0;

    // Calculate pagination info for frontend
    const totalPages = Math.ceil(total / safeLimit);
    const currentPage = Math.floor(safeOffset / safeLimit) + 1;
    
    res.json({ 
      items: rows, 
      total, 
      limit: safeLimit, 
      offset: safeOffset, 
      sortBy: safeSortBy, 
      sortDir: safeSortDir,
      totalPages,
      currentPage,
      pageSize: safeLimit
    });
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).send('Server Error');
  }
});

// Get service by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM Service WHERE id = ? AND deletedAt IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Service not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching service with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new service
router.post('/', auth, authorize([1]), async (req, res) => {
  const { name, description, basePrice, isActive } = req.body;
  if (!name || !basePrice) {
    return res.status(400).send('Name and basePrice are required');
  }
  try {
    const [result] = await db.query(
      'INSERT INTO Service (name, description, basePrice, isActive) VALUES (?, ?, ?, ?)',
      [name, description, basePrice, isActive]
    );
    res.status(201).json({ id: result.insertId, name, description, basePrice, isActive });
  } catch (err) {
    console.error('Error creating service:', err);
    res.status(500).send('Server Error');
  }
});

// Update a service
router.put('/:id', auth, authorize([1]), async (req, res) => {
  const { id } = req.params;
  const { name, description, basePrice, isActive } = req.body;
  if (!name || !basePrice) {
    return res.status(400).send('Name and basePrice are required');
  }
  try {
    const [result] = await db.query(
      'UPDATE Service SET name = ?, description = ?, basePrice = ?, isActive = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL',
      [name, description, basePrice, isActive, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).send('Service not found or already deleted');
    }
    res.json({ message: 'Service updated successfully' });
  } catch (err) {
    console.error(`Error updating service with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Get service statistics
router.get('/:id/stats', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if service exists
    const [serviceRows] = await db.query('SELECT id FROM Service WHERE id = ? AND deletedAt IS NULL', [id]);
    if (serviceRows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Get service usage statistics
    const [usageStats] = await db.query(`
      SELECT 
        COUNT(*) as totalUsage,
        SUM(CASE WHEN rrs.status = 'completed' THEN 1 ELSE 0 END) as completedUsage,
        SUM(CASE WHEN rrs.status = 'completed' THEN COALESCE(rrs.finalPrice, rrs.price, rrs.baseCost, 0) ELSE 0 END) as totalRevenue,
        AVG(CASE WHEN rrs.status = 'completed' THEN COALESCE(rrs.finalPrice, rrs.price, rrs.baseCost, 0) ELSE NULL END) as avgPrice,
        MAX(rrs.createdAt) as lastUsed,
        MIN(rrs.createdAt) as firstUsed
      FROM RepairRequestService rrs
      WHERE rrs.serviceId = ?
    `, [id]);

    const stats = usageStats[0] || {
      totalUsage: 0,
      completedUsage: 0,
      totalRevenue: 0,
      avgPrice: 0,
      lastUsed: null,
      firstUsed: null
    };

    res.json({ 
      success: true,
      stats: {
        totalUsage: parseInt(stats.totalUsage) || 0,
        completedUsage: parseInt(stats.completedUsage) || 0,
        totalRevenue: parseFloat(stats.totalRevenue) || 0,
        avgPrice: parseFloat(stats.avgPrice) || 0,
        lastUsed: stats.lastUsed,
        firstUsed: stats.firstUsed
      }
    });
  } catch (err) {
    console.error(`Error fetching service stats for ID ${id}:`, err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Soft delete a service
router.delete('/:id', auth, authorize([1]), async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('UPDATE Service SET deletedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Service not found');
    }
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    console.error(`Error deleting service with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
