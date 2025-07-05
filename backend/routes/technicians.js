const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all technicians
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM User WHERE roleId = (SELECT id FROM Role WHERE name = "Technician")'); // Assuming 'Technician' role exists
    res.json(rows);
  } catch (err) {
    console.error('Error fetching technicians:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
