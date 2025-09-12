const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/variable-options
router.get('/', async (req, res) => {
  try {
    const { categoryId, deviceType, active } = req.query;
    
    let where = ['vo.deletedAt IS NULL'];
    const params = [];
    
    if (categoryId) {
      where.push('vo.categoryId = ?');
      params.push(categoryId);
    }
    
    if (deviceType) {
      where.push('(vo.deviceType = ? OR vo.deviceType IS NULL)');
      params.push(deviceType);
    }
    
    if (typeof active !== 'undefined') {
      where.push('vo.isActive = ?');
      params.push(active === '1' || active === 'true');
    }
    
    const [rows] = await db.query(`
      SELECT vo.id, vo.categoryId, vo.label, vo.value, vo.deviceType, 
             vo.isActive, vo.sortOrder, vo.createdAt, vo.updatedAt,
             vc.code as categoryCode, vc.name as categoryName
      FROM VariableOption vo
      LEFT JOIN VariableCategory vc ON vo.categoryId = vc.id
      WHERE ${where.join(' AND ')}
      ORDER BY vo.sortOrder ASC, vo.label ASC
    `, params);
    
    res.json(rows);
  } catch (err) {
    console.error('Error fetching variable options:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// GET /api/variable-options/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT vo.id, vo.categoryId, vo.label, vo.value, vo.deviceType, 
             vo.isActive, vo.sortOrder, vo.createdAt, vo.updatedAt,
             vc.code as categoryCode, vc.name as categoryName
      FROM VariableOption vo
      LEFT JOIN VariableCategory vc ON vo.categoryId = vc.id
      WHERE vo.id = ? AND vo.deletedAt IS NULL
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Option not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching variable option ${id}:`, err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST /api/variable-options
router.post('/', async (req, res) => {
  const { 
    categoryId, 
    label, 
    value, 
    deviceType = null, 
    isActive = true, 
    sortOrder = 0 
  } = req.body;
  
  if (!categoryId || !label || !value) {
    return res.status(400).json({ error: 'CategoryId, label, and value are required' });
  }
  
  try {
    const [result] = await db.query(`
      INSERT INTO VariableOption (categoryId, label, value, deviceType, isActive, sortOrder, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [categoryId, label, value, deviceType, isActive, sortOrder]);
    
    res.status(201).json({
      id: result.insertId,
      categoryId,
      label,
      value,
      deviceType,
      isActive,
      sortOrder
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Option already exists for this category and device type' });
    }
    console.error('Error creating variable option:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// PUT /api/variable-options/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    label, 
    value, 
    deviceType, 
    isActive, 
    sortOrder 
  } = req.body;
  
  if (!label || !value) {
    return res.status(400).json({ error: 'Label and value are required' });
  }
  
  try {
    const [result] = await db.query(`
      UPDATE VariableOption 
      SET label = ?, value = ?, deviceType = ?, isActive = ?, sortOrder = ?, updatedAt = NOW()
      WHERE id = ? AND deletedAt IS NULL
    `, [label, value, deviceType, isActive, sortOrder, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Option not found' });
    }
    
    res.json({
      id: parseInt(id),
      label,
      value,
      deviceType,
      isActive,
      sortOrder
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Option already exists for this category and device type' });
    }
    console.error(`Error updating variable option ${id}:`, err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// DELETE /api/variable-options/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const [result] = await db.query(`
      UPDATE VariableOption 
      SET deletedAt = NOW()
      WHERE id = ? AND deletedAt IS NULL
    `, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Option not found' });
    }
    
    res.json({ message: 'Option deleted successfully' });
  } catch (err) {
    console.error(`Error deleting variable option ${id}:`, err);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
