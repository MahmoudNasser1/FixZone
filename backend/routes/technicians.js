const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all technicians
router.get('/', async (req, res) => {
  try {
    // جلب الفنيين
    const [technicians] = await db.query(`
      SELECT 
        u.id, 
        u.name as name,
        u.email, 
        u.phone,
        u.roleId,
        r.name as roleName
      FROM User u 
      LEFT JOIN Role r ON u.roleId = r.id 
      WHERE (r.name IN ('Technician', 'technician') OR u.roleId = 6)
        AND u.deletedAt IS NULL
      ORDER BY u.name
    `);
    
    return res.json(technicians || []);
  } catch (err) {
    console.error('Error fetching technicians:', err);
    res.status(500).json({ 
      error: 'Server Error',
      details: err.message 
    });
  }
});

module.exports = router;
