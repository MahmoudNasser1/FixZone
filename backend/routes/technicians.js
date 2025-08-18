const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all technicians
router.get('/', async (req, res) => {
  try {
    // محاولة أولى بالأسماء
    const [byName] = await db.query('SELECT u.id, u.name, u.email, u.phone FROM User u JOIN Role r ON u.roleId = r.id WHERE r.name IN ("Technician", "technician") AND u.deletedAt IS NULL');
    if (byName && byName.length > 0) {
      return res.json(byName);
    }
    // محاولة ثانية بالـ roleId الشائع 2
    const [byId] = await db.query('SELECT id, name, email, phone FROM User WHERE roleId = 2 AND deletedAt IS NULL');
    return res.json(byId || []);
  } catch (err) {
    console.error('Error fetching technicians:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
