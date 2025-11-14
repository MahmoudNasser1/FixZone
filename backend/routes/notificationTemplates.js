const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const Joi = require('joi');

// Joi schemas for validation
const createTemplateSchema = Joi.object({
  type: Joi.string().max(50).required().messages({
    'string.empty': 'Type is required',
    'string.max': 'Type cannot exceed 50 characters',
    'any.required': 'Type is required'
  }),
  template: Joi.string().required().messages({
    'string.empty': 'Template is required',
    'any.required': 'Template is required'
  })
});

const updateTemplateSchema = Joi.object({
  type: Joi.string().max(50).optional(),
  template: Joi.string().optional()
});

// Helper for validation middleware
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({ success: false, message: errors.join(', ') });
  }
  req.body = value;
  next();
};

// Get all notification templates (Admin only)
router.get('/', auth, authorize([1]), async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM NotificationTemplate ORDER BY type, createdAt DESC');
    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    console.error('Error fetching notification templates:', err);
    res.status(500).json({ success: false, message: 'Server Error: Failed to fetch notification templates' });
  }
});

// Get notification template by ID (Admin only)
router.get('/:id', auth, authorize([1]), async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute('SELECT * FROM NotificationTemplate WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification template not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(`Error fetching notification template with ID ${id}:`, err);
    res.status(500).json({ success: false, message: `Server Error: Failed to fetch notification template with ID ${id}` });
  }
});

// Create a new notification template (Admin only)
router.post('/', auth, authorize([1]), validate(createTemplateSchema), async (req, res) => {
  const { type, template } = req.body;
  try {
    const [result] = await db.execute(
      'INSERT INTO NotificationTemplate (type, template) VALUES (?, ?)',
      [type, template]
    );
    res.status(201).json({ 
      success: true, 
      message: 'Notification template created successfully',
      data: { id: result.insertId, type, template }
    });
  } catch (err) {
    console.error('Error creating notification template:', err);
    res.status(500).json({ success: false, message: 'Server Error: Failed to create notification template' });
  }
});

// Update a notification template (Admin only)
router.put('/:id', auth, authorize([1]), validate(updateTemplateSchema), async (req, res) => {
  const { id } = req.params;
  const { type, template } = req.body;
  
  try {
    // Build dynamic UPDATE query
    const updates = [];
    const params = [];
    
    if (type !== undefined) {
      updates.push('type = ?');
      params.push(type);
    }
    if (template !== undefined) {
      updates.push('template = ?');
      params.push(template);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }
    
    updates.push('updatedAt = CURRENT_TIMESTAMP');
    params.push(id);
    
    const query = `UPDATE NotificationTemplate SET ${updates.join(', ')} WHERE id = ?`;
    const [result] = await db.execute(query, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification template not found' });
    }
    
    // Fetch updated template
    const [updated] = await db.execute('SELECT * FROM NotificationTemplate WHERE id = ?', [id]);
    
    res.json({ 
      success: true, 
      message: 'Notification template updated successfully',
      data: updated[0]
    });
  } catch (err) {
    console.error(`Error updating notification template with ID ${id}:`, err);
    res.status(500).json({ success: false, message: `Server Error: Failed to update notification template with ID ${id}` });
  }
});

// Delete a notification template (Admin only)
router.delete('/:id', auth, authorize([1]), async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute('DELETE FROM NotificationTemplate WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification template not found' });
    }
    res.json({ success: true, message: 'Notification template deleted successfully' });
  } catch (err) {
    console.error(`Error deleting notification template with ID ${id}:`, err);
    res.status(500).json({ success: false, message: `Server Error: Failed to delete notification template with ID ${id}` });
  }
});

module.exports = router;
