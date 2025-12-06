const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all technicians
router.get('/', async (req, res) => {
  try {
    // جلب الفنيين فقط - فلترة صارمة حسب اسم الدور فقط (لا نعتمد على roleId)
    const [technicians] = await db.query(`
      SELECT 
        u.id, 
        u.name as name,
        u.email, 
        u.phone,
        u.roleId,
        r.name as roleName
      FROM User u 
      INNER JOIN Role r ON u.roleId = r.id 
      WHERE LOWER(TRIM(r.name)) = 'technician'
        AND u.deletedAt IS NULL
        AND u.isActive = 1
      ORDER BY u.name
    `);
    
    console.log(`[Technicians Route] Found ${technicians.length} technicians`);
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
