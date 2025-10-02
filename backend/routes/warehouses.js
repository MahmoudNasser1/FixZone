const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all warehouses
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Warehouse');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching warehouses:', err);
    res.status(500).json({ 
      error: 'Server Error',
      details: err.message 
    });
  }
});

// Get warehouse by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM Warehouse WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching warehouse with ID ${id}:`, err);
    res.status(500).json({ 
      error: 'Server Error',
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
  
  if (!name) {
    return res.status(400).json({ error: 'Warehouse name is required' });
  }
  
  try {
    const [result] = await db.query(`
      INSERT INTO Warehouse (name, location, branchId, isActive)
      VALUES (?, ?, ?, ?)
    `, [name, location, branchId, isActive]);
    
    res.status(201).json({ 
      id: result.insertId, 
      name, 
      location, 
      branchId, 
      isActive 
    });
  } catch (err) {
    console.error('Error creating warehouse:', err);
    res.status(500).json({ 
      error: 'Server Error',
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
  
  if (!name) {
    return res.status(400).json({ error: 'Warehouse name is required' });
  }
  
  try {
    const [result] = await db.query(`
      UPDATE Warehouse SET 
        name = ?, 
        location = ?, 
        branchId = ?, 
        isActive = ?
      WHERE id = ?
    `, [name, location, branchId, isActive, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    
    res.json({ 
      message: 'Warehouse updated successfully',
      id, 
      name, 
      location, 
      branchId, 
      isActive 
    });
  } catch (err) {
    console.error(`Error updating warehouse with ID ${id}:`, err);
    res.status(500).json({ 
      error: 'Server Error',
      details: err.message 
    });
  }
});

// Delete a warehouse
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM Warehouse WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    res.json({ message: 'Warehouse deleted successfully' });
  } catch (err) {
    console.error(`Error deleting warehouse with ID ${id}:`, err);
    res.status(500).json({ 
      error: 'Server Error',
      details: err.message 
    });
  }
});

module.exports = router;
