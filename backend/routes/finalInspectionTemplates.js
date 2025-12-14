const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/finalinspectiontemplates - جلب قوالب المكونات للفحص النهائي
router.get('/', async (req, res) => {
  try {
    const { deviceCategory } = req.query;
    
    let query = `
      SELECT * FROM FinalInspectionComponentTemplate 
      WHERE 1=1
    `;
    const params = [];
    
    if (deviceCategory && deviceCategory !== 'all') {
      query += ' AND (deviceCategory = ? OR deviceCategory = "all")';
      params.push(deviceCategory);
    }
    
    query += ' ORDER BY displayOrder ASC, name ASC';
    
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching final inspection templates:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

module.exports = router;

