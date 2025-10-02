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

    // Also return total count for the same filter (without limit/offset)
    const countSql = `SELECT COUNT(*) as total FROM Service ${whereSql}`;
    const [countRows] = await db.query(countSql, params);
    const total = countRows?.[0]?.total || 0;

    res.json({ items: rows, total, limit: safeLimit, offset: safeOffset, sortBy: safeSortBy, sortDir: safeSortDir });
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
      'INSERT INTO Service (serviceName, description, basePrice, isActive) VALUES (?, ?, ?, ?)',
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
      'UPDATE Service SET serviceName = ?, description = ?, basePrice = ?, isActive = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL',
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
