const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/authMiddleware');
const Joi = require('joi');

// Joi schemas for validation
const createNotificationSchema = Joi.object({
  type: Joi.string().max(50).required().messages({
    'string.empty': 'Type is required',
    'string.max': 'Type cannot exceed 50 characters',
    'any.required': 'Type is required'
  }),
  message: Joi.string().required().messages({
    'string.empty': 'Message is required',
    'any.required': 'Message is required'
  }),
  isRead: Joi.boolean().default(false),
  userId: Joi.number().integer().optional(),
  repairRequestId: Joi.number().integer().optional(),
  channel: Joi.string().valid('EMAIL', 'SMS', 'IN_APP').default('IN_APP')
});

const updateNotificationSchema = Joi.object({
  type: Joi.string().max(50).optional(),
  message: Joi.string().optional(),
  isRead: Joi.boolean().optional(),
  userId: Joi.number().integer().optional(),
  repairRequestId: Joi.number().integer().optional(),
  channel: Joi.string().valid('EMAIL', 'SMS', 'IN_APP').optional()
});

const markAllReadSchema = Joi.object({
  userId: Joi.number().integer().required()
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

// Get all notifications (filtered by current user)
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { type, isRead, channel, page = 1, limit = 20 } = req.query;
    
    let query = 'SELECT * FROM Notification WHERE userId = ?';
    const params = [userId];
    
    // Add filters
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (isRead !== undefined) {
      query += ' AND isRead = ?';
      params.push(isRead === 'true' ? 1 : 0);
    }
    if (channel) {
      query += ' AND channel = ?';
      params.push(channel);
    }
    
    // Order by createdAt DESC (newest first)
    query += ' ORDER BY createdAt DESC';
    
    // Add pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [rows] = await db.execute(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM Notification WHERE userId = ?';
    const countParams = [userId];
    if (type) {
      countQuery += ' AND type = ?';
      countParams.push(type);
    }
    if (isRead !== undefined) {
      countQuery += ' AND isRead = ?';
      countParams.push(isRead === 'true' ? 1 : 0);
    }
    if (channel) {
      countQuery += ' AND channel = ?';
      countParams.push(channel);
    }
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({ 
      success: true, 
      data: rows, 
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, message: 'Server Error: Failed to fetch notifications' });
  }
});

// Get notification by ID (must belong to current user)
// IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
router.get('/unread/count', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const [rows] = await db.execute(
      'SELECT COUNT(*) as count FROM Notification WHERE userId = ? AND isRead = 0',
      [userId]
    );
    res.json({ success: true, count: rows[0].count });
  } catch (err) {
    console.error('Error fetching unread notifications count:', err);
    res.status(500).json({ success: false, message: 'Server Error: Failed to fetch unread count' });
  }
});

// Get notification by ID (must belong to current user)
router.get('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  try {
    const [rows] = await db.execute(
      'SELECT * FROM Notification WHERE id = ? AND userId = ?',
      [id, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(`Error fetching notification with ID ${id}:`, err);
    res.status(500).json({ success: false, message: `Server Error: Failed to fetch notification with ID ${id}` });
  }
});

// Create a new notification
router.post('/', auth, validate(createNotificationSchema), async (req, res) => {
  const { type, message, isRead, userId, repairRequestId, channel } = req.body;
  const currentUserId = req.user?.id;
  
  // Use current user's ID if userId not provided
  const targetUserId = userId || currentUserId;
  
  try {
    const [result] = await db.execute(
      'INSERT INTO Notification (type, message, isRead, userId, repairRequestId, channel) VALUES (?, ?, ?, ?, ?, ?)',
      [type, message, isRead || false, targetUserId, repairRequestId || null, channel || 'IN_APP']
    );
    res.status(201).json({ 
      success: true, 
      message: 'Notification created successfully',
      data: { 
        id: result.insertId, 
        type, 
        message, 
        isRead: isRead || false, 
        userId: targetUserId, 
        repairRequestId: repairRequestId || null, 
        channel: channel || 'IN_APP' 
      }
    });
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).json({ success: false, message: 'Server Error: Failed to create notification' });
  }
});

// Update a notification (must belong to current user)
router.put('/:id', auth, validate(updateNotificationSchema), async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const { type, message, isRead, repairRequestId, channel } = req.body;
  
  try {
    // Build dynamic UPDATE query
    const updates = [];
    const params = [];
    
    if (type !== undefined) {
      updates.push('type = ?');
      params.push(type);
    }
    if (message !== undefined) {
      updates.push('message = ?');
      params.push(message);
    }
    if (isRead !== undefined) {
      updates.push('isRead = ?');
      params.push(isRead ? 1 : 0);
    }
    if (repairRequestId !== undefined) {
      updates.push('repairRequestId = ?');
      params.push(repairRequestId);
    }
    if (channel !== undefined) {
      updates.push('channel = ?');
      params.push(channel);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }
    
    updates.push('updatedAt = CURRENT_TIMESTAMP');
    params.push(id, userId);
    
    const query = `UPDATE Notification SET ${updates.join(', ')} WHERE id = ? AND userId = ?`;
    const [result] = await db.execute(query, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    // Fetch updated notification
    const [updated] = await db.execute(
      'SELECT * FROM Notification WHERE id = ? AND userId = ?',
      [id, userId]
    );
    
    res.json({ 
      success: true, 
      message: 'Notification updated successfully',
      data: updated[0]
    });
  } catch (err) {
    console.error(`Error updating notification with ID ${id}:`, err);
    res.status(500).json({ success: false, message: `Server Error: Failed to update notification with ID ${id}` });
  }
});

// Mark notification as read
router.patch('/:id/read', auth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  
  try {
    const [result] = await db.execute(
      'UPDATE Notification SET isRead = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND userId = ?',
      [id, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    console.error(`Error marking notification ${id} as read:`, err);
    res.status(500).json({ success: false, message: `Server Error: Failed to mark notification as read` });
  }
});

// Mark all notifications as read for current user
router.patch('/read/all', auth, async (req, res) => {
  const userId = req.user?.id;
  
  try {
    const [result] = await db.execute(
      'UPDATE Notification SET isRead = 1, updatedAt = CURRENT_TIMESTAMP WHERE userId = ? AND isRead = 0',
      [userId]
    );
    
    res.json({ 
      success: true, 
      message: `Marked ${result.affectedRows} notifications as read`,
      count: result.affectedRows
    });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ success: false, message: 'Server Error: Failed to mark all notifications as read' });
  }
});

// Delete a notification (must belong to current user)
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  
  try {
    const [result] = await db.execute(
      'DELETE FROM Notification WHERE id = ? AND userId = ?',
      [id, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (err) {
    console.error(`Error deleting notification with ID ${id}:`, err);
    res.status(500).json({ success: false, message: `Server Error: Failed to delete notification with ID ${id}` });
  }
});

module.exports = router;
