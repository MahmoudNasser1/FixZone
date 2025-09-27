const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/variable-categories
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, code, name, scope, createdAt, updatedAt
      FROM VariableCategory 
      WHERE deletedAt IS NULL
      ORDER BY code ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching variable categories:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// GET /api/variable-categories/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT id, code, name, scope, createdAt, updatedAt
      FROM VariableCategory 
      WHERE id = ? AND deletedAt IS NULL
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching variable category ${id}:`, err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST /api/variable-categories
router.post('/', async (req, res) => {
  const { code, name, scope = 'GLOBAL' } = req.body;
  
  if (!code || !name) {
    return res.status(400).json({ error: 'Code and name are required' });
  }
  
  try {
    const [result] = await db.query(`
      INSERT INTO VariableCategory (code, name, scope, createdAt, updatedAt)
      VALUES (?, ?, ?, NOW(), NOW())
    `, [code.toUpperCase(), name, scope]);
    
    res.status(201).json({
      id: result.insertId,
      code: code.toUpperCase(),
      name,
      scope
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Category code already exists' });
    }
    console.error('Error creating variable category:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// PUT /api/variable-categories/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { code, name, scope } = req.body;
  
  if (!code || !name) {
    return res.status(400).json({ error: 'Code and name are required' });
  }
  
  try {
    const [result] = await db.query(`
      UPDATE VariableCategory 
      SET code = ?, name = ?, scope = ?, updatedAt = NOW()
      WHERE id = ? AND deletedAt IS NULL
    `, [code.toUpperCase(), name, scope, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({
      id: parseInt(id),
      code: code.toUpperCase(),
      name,
      scope
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Category code already exists' });
    }
    console.error(`Error updating variable category ${id}:`, err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// DELETE /api/variable-categories/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Soft delete the category
    const [result] = await db.query(`
      UPDATE VariableCategory 
      SET deletedAt = NOW()
      WHERE id = ? AND deletedAt IS NULL
    `, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Also soft delete all options in this category
    await db.query(`
      UPDATE VariableOption 
      SET deletedAt = NOW()
      WHERE categoryId = ? AND deletedAt IS NULL
    `, [id]);
    
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error(`Error deleting variable category ${id}:`, err);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
