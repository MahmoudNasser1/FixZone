const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all warehouses
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Warehouse WHERE deletedAt IS NULL ORDER BY name ASC');
    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    console.error('Error fetching warehouses:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server Error',
      details: err.message 
    });
  }
});

// Get warehouse by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute('SELECT * FROM Warehouse WHERE id = ? AND deletedAt IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Warehouse not found' 
      });
    }
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    console.error(`Error fetching warehouse with ID ${id}:`, err);
    res.status(500).json({ 
      success: false,
      message: 'Server Error',
      details: err.message 
    });
  }
});

// Create a new warehouse
router.post('/', async (req, res) => {
  const { 
    name, 
    location, 
    branchId, 
    isActive = true 
  } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ 
      success: false,
      message: 'Warehouse name is required' 
    });
  }
  
  try {
    const [result] = await db.execute(`
      INSERT INTO Warehouse (name, location, branchId, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `, [name.trim(), location || null, branchId || null, isActive ? 1 : 0]);
    
    const [warehouse] = await db.execute('SELECT * FROM Warehouse WHERE id = ?', [result.insertId]);
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء المخزن بنجاح',
      data: warehouse[0]
    });
  } catch (err) {
    console.error('Error creating warehouse:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server Error',
      details: err.message 
    });
  }
});

// Update a warehouse
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    location, 
    branchId, 
    isActive 
  } = req.body;
  
  if (name !== undefined && (!name || !name.trim())) {
    return res.status(400).json({ 
      success: false,
      message: 'Warehouse name cannot be empty' 
    });
  }
  
  try {
    // Check if warehouse exists
    const [existing] = await db.execute(
      'SELECT id FROM Warehouse WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Warehouse not found' 
      });
    }
    
    // Build update query
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (location !== undefined) {
      updates.push('location = ?');
      values.push(location || null);
    }
    if (branchId !== undefined) {
      updates.push('branchId = ?');
      values.push(branchId || null);
    }
    if (isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(isActive ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No fields to update' 
      });
    }
    
    updates.push('updatedAt = NOW()');
    values.push(id);
    
    await db.execute(
      `UPDATE Warehouse SET ${updates.join(', ')} WHERE id = ? AND deletedAt IS NULL`,
      values
    );
    
    const [warehouse] = await db.execute('SELECT * FROM Warehouse WHERE id = ?', [id]);
    
    res.json({ 
      success: true,
      message: 'تم تحديث المخزن بنجاح',
      data: warehouse[0]
    });
  } catch (err) {
    console.error(`Error updating warehouse with ID ${id}:`, err);
    res.status(500).json({ 
      success: false,
      message: 'Server Error',
      details: err.message 
    });
  }
});

// Delete a warehouse (soft delete)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if warehouse exists
    const [existing] = await db.execute(
      'SELECT id FROM Warehouse WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Warehouse not found' 
      });
    }
    
    // Check if warehouse has stock
    const [stock] = await db.execute(
      'SELECT COUNT(*) as count FROM StockLevel WHERE warehouseId = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (stock[0].count > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot delete warehouse with existing stock. Please clear stock first.' 
      });
    }
    
    // Soft delete
    await db.execute(
      'UPDATE Warehouse SET deletedAt = NOW() WHERE id = ?',
      [id]
    );
    
    res.json({ 
      success: true,
      message: 'تم حذف المخزن بنجاح'
    });
  } catch (err) {
    console.error(`Error deleting warehouse with ID ${id}:`, err);
    res.status(500).json({ 
      success: false,
      message: 'Server Error',
      details: err.message 
    });
  }
});

module.exports = router;
