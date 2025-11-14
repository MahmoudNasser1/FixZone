const express = require('express');
const router = express.Router();
const Joi = require('joi');
const db = require('../db');
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');

// Validation schemas using Joi
const createSettingSchema = Joi.object({
  key: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'Key is required',
    'string.min': 'Key must be at least 1 character long',
    'string.max': 'Key must be at most 100 characters long',
    'any.required': 'Key is required'
  }),
  value: Joi.string().required().messages({
    'string.empty': 'Value is required',
    'any.required': 'Value is required'
  }),
  type: Joi.string().optional().valid('string', 'number', 'boolean', 'json', 'text').messages({
    'any.only': 'Type must be one of: string, number, boolean, json, text'
  }),
  description: Joi.string().optional().max(500).messages({
    'string.max': 'Description must be at most 500 characters long'
  })
});

const updateSettingSchema = Joi.object({
  value: Joi.string().required().messages({
    'string.empty': 'Value is required',
    'any.required': 'Value is required'
  }),
  type: Joi.string().optional().valid('string', 'number', 'boolean', 'json', 'text').messages({
    'any.only': 'Type must be one of: string, number, boolean, json, text'
  }),
  description: Joi.string().optional().max(500).allow(null, '').messages({
    'string.max': 'Description must be at most 500 characters long'
  })
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({ message: errors.join(', ') });
    }
    req.body = value; // Use validated value
    next();
  };
};

// Get all system settings
router.get('/', auth, authorize([1]), async (req, res) => {
  try {
    // Use db.execute instead of db.query for better security
    const [rows] = await db.execute('SELECT * FROM SystemSetting ORDER BY `key` ASC');
    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    console.error('Error fetching system settings:', err);
    res.status(500).json({ message: 'Failed to fetch system settings', error: err.message });
  }
});

// Get system setting by key
router.get('/:key', auth, authorize([1]), async (req, res) => {
  const { key } = req.params;
  
  // Validate key parameter
  if (!key || key.trim().length === 0) {
    return res.status(400).json({ message: 'Setting key is required' });
  }

  try {
    // Use db.execute instead of db.query for better security
    const [rows] = await db.execute('SELECT * FROM SystemSetting WHERE `key` = ?', [key]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: `System setting with key "${key}" not found` });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(`Error fetching system setting with key ${key}:`, err);
    res.status(500).json({ message: 'Failed to fetch system setting', error: err.message });
  }
});

// Create a new system setting
router.post('/', auth, authorize([1]), validate(createSettingSchema), async (req, res) => {
  const { key, value, type, description } = req.body;

  try {
    // Check if setting with this key already exists
    const [existing] = await db.execute('SELECT id FROM SystemSetting WHERE `key` = ?', [key]);
    
    if (existing.length > 0) {
      return res.status(409).json({ message: `System setting with key "${key}" already exists` });
    }

    // Use db.execute instead of db.query for better security
    const [result] = await db.execute(
      'INSERT INTO SystemSetting (`key`, value, type, description) VALUES (?, ?, ?, ?)',
      [key, value, type || 'string', description || null]
    );

    res.status(201).json({
      success: true,
      message: 'System setting created successfully',
      data: {
        id: result.insertId,
        key,
        value,
        type: type || 'string',
        description: description || null
      }
    });
  } catch (err) {
    console.error('Error creating system setting:', err);
    
    // Check for duplicate key error
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: `System setting with key "${key}" already exists` });
    }
    
    res.status(500).json({ message: 'Failed to create system setting', error: err.message });
  }
});

// Update a system setting
router.put('/:key', auth, authorize([1]), validate(updateSettingSchema), async (req, res) => {
  const { key } = req.params;
  const { value, type, description } = req.body;

  // Validate key parameter
  if (!key || key.trim().length === 0) {
    return res.status(400).json({ message: 'Setting key is required' });
  }

  try {
    // Use db.execute instead of db.query for better security
    const [result] = await db.execute(
      'UPDATE SystemSetting SET value = ?, type = ?, description = ?, updatedAt = CURRENT_TIMESTAMP WHERE `key` = ?',
      [value, type || 'string', description || null, key]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: `System setting with key "${key}" not found` });
    }

    // Fetch updated setting
    const [updated] = await db.execute('SELECT * FROM SystemSetting WHERE `key` = ?', [key]);

    res.json({
      success: true,
      message: 'System setting updated successfully',
      data: updated[0]
    });
  } catch (err) {
    console.error(`Error updating system setting with key ${key}:`, err);
    res.status(500).json({ message: 'Failed to update system setting', error: err.message });
  }
});

// Hard delete a system setting
router.delete('/:key', auth, authorize([1]), async (req, res) => {
  const { key } = req.params;

  // Validate key parameter
  if (!key || key.trim().length === 0) {
    return res.status(400).json({ message: 'Setting key is required' });
  }

  try {
    // Check if setting exists before deletion
    const [existing] = await db.execute('SELECT id FROM SystemSetting WHERE `key` = ?', [key]);
    
    if (existing.length === 0) {
      return res.status(404).json({ message: `System setting with key "${key}" not found` });
    }

    // Use db.execute instead of db.query for better security
    const [result] = await db.execute('DELETE FROM SystemSetting WHERE `key` = ?', [key]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: `System setting with key "${key}" not found` });
    }

    res.json({
      success: true,
      message: `System setting with key "${key}" deleted successfully`
    });
  } catch (err) {
    console.error(`Error deleting system setting with key ${key}:`, err);
    res.status(500).json({ message: 'Failed to delete system setting', error: err.message });
  }
});

module.exports = router;
