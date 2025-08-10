const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/variables?category=BRAND&deviceType=Laptop&active=1
router.get('/', async (req, res) => {
  try {
    const { category, deviceType, active } = req.query;
    if (!category) {
      return res.status(400).json({ error: 'category query param is required (e.g., BRAND, ACCESSORY)' });
    }

    // Find categoryId by code
    const [catRows] = await db.query('SELECT id FROM VariableCategory WHERE code = ? AND (deletedAt IS NULL)', [category]);
    if (catRows.length === 0) {
      return res.json([]);
    }
    const categoryId = catRows[0].id;

    // Build query
    let where = ['categoryId = ?', 'deletedAt IS NULL'];
    const params = [categoryId];

    if (typeof active !== 'undefined') {
      where.push('isActive = ?');
      params.push(active === '1' || active === 'true');
    }
    if (deviceType) {
      // Match either same deviceType or global (NULL)
      where.push('(deviceType = ? OR deviceType IS NULL)');
      params.push(deviceType);
    }

    const sql = `
      SELECT id, label, value, deviceType, isActive, sortOrder
      FROM VariableOption
      WHERE ${where.join(' AND ')}
      ORDER BY sortOrder ASC, label ASC
    `;
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching variables:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
