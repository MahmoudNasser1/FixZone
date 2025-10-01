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
      services: rows,
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

module.exports = router;
