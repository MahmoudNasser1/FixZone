const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all devices
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Device WHERE deletedAt IS NULL');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching devices:', err);
    res.status(500).send('Server Error');
  }
});

// Get device by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM Device WHERE id = ? AND deletedAt IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Device not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching device with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new device
router.post('/', async (req, res) => {
  const { customerId, deviceType, brand, model, serialNumber, customFields, deviceBatchId } = req.body;
  if (!customerId || !deviceType || !brand || !model || !serialNumber) {
    return res.status(400).send('Customer ID, device type, brand, model, and serial number are required');
  }
  try {
    const [result] = await db.query('INSERT INTO Device (customerId, deviceType, brand, model, serialNumber, customFields, deviceBatchId) VALUES (?, ?, ?, ?, ?, ?, ?)', [customerId, deviceType, brand, model, serialNumber, JSON.stringify(customFields), deviceBatchId]);
    res.status(201).json({ id: result.insertId, customerId, deviceType, brand, model, serialNumber, customFields, deviceBatchId });
  } catch (err) {
    console.error('Error creating device:', err);
    res.status(500).send('Server Error');
  }
});

// Update a device
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { customerId, deviceType, brand, model, serialNumber, customFields, deviceBatchId } = req.body;
  if (!customerId || !deviceType || !brand || !model || !serialNumber) {
    return res.status(400).send('Customer ID, device type, brand, model, and serial number are required');
  }
  try {
    const [result] = await db.query('UPDATE Device SET customerId = ?, deviceType = ?, brand = ?, model = ?, serialNumber = ?, customFields = ?, deviceBatchId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [customerId, deviceType, brand, model, serialNumber, JSON.stringify(customFields), deviceBatchId, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Device not found or already deleted');
    }
    res.json({ message: 'Device updated successfully' });
  } catch (err) {
    console.error(`Error updating device with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Soft delete a device
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('UPDATE Device SET deletedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Device not found or already deleted');
    }
    res.json({ message: 'Device deleted successfully' });
  } catch (err) {
    console.error(`Error deleting device with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
