const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM InventoryItem');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching inventory items:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
