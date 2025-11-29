const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all audit logs
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM AuditLog');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).send('Server Error');
  }
});

// Get audit log by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM AuditLog WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Audit log not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching audit log with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new audit log (typically done by system, but included for completeness)
router.post('/', async (req, res) => {
  const { action, actionType, details, entityType, entityId, userId, ipAddress, beforeValue, afterValue } = req.body;
  if (!action || !actionType || !userId) {
    return res.status(400).json({ 
      error: 'Action, actionType, and userId are required',
      message: 'خطأ في البيانات المدخلة - Action, actionType, and userId مطلوبة'
    });
  }
  try {
    // التحقق من وجود userId في جدول User
    if (userId) {
      const [userCheck] = await db.query('SELECT id FROM User WHERE id = ? AND deletedAt IS NULL', [userId]);
      if (userCheck.length === 0) {
        console.error(`User with ID ${userId} not found`);
        return res.status(400).json({ 
          error: 'User not found',
          message: `المستخدم برقم ${userId} غير موجود`
        });
      }
    }
    
    const [result] = await db.query(
      'INSERT INTO AuditLog (action, actionType, details, entityType, entityId, userId, ipAddress, beforeValue, afterValue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [action, actionType, details, entityType, entityId, userId, ipAddress, beforeValue, afterValue]
    );
    res.status(201).json({ 
      id: result.insertId, 
      action, 
      actionType, 
      details, 
      entityType, 
      entityId, 
      userId, 
      ipAddress, 
      beforeValue, 
      afterValue,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error creating audit log:', err);
    // إرجاع رسالة خطأ أوضح
    let errorMessage = 'Server Error';
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      errorMessage = `المستخدم برقم ${userId} غير موجود في قاعدة البيانات`;
    } else if (err.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = 'خطأ في بنية قاعدة البيانات';
    } else if (err.message) {
      errorMessage = err.message;
    }
    res.status(500).json({ 
      error: 'Server Error',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Audit logs are typically not updated, but included for completeness
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { action, actionType, details, entityType, entityId, userId, ipAddress, beforeValue, afterValue } = req.body;
  if (!action || !actionType || !userId) {
    return res.status(400).send('Action, actionType, and userId are required');
  }
  try {
    const [result] = await db.query(
      'UPDATE AuditLog SET action = ?, actionType = ?, details = ?, entityType = ?, entityId = ?, userId = ?, ipAddress = ?, beforeValue = ?, afterValue = ?, createdAt = CURRENT_TIMESTAMP WHERE id = ?',
      [action, actionType, details, entityType, entityId, userId, ipAddress, beforeValue, afterValue, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).send('Audit log not found');
    }
    res.json({ message: 'Audit log updated successfully' });
  } catch (err) {
    console.error(`Error updating audit log with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Hard delete an audit log (typically not deleted, but included for completeness)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM AuditLog WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Audit log not found');
    }
    res.json({ message: 'Audit log deleted successfully' });
  } catch (err) {
    console.error(`Error deleting audit log with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
