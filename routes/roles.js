const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all roles
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Role WHERE deletedAt IS NULL');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching roles:', err);
    res.status(500).send('Server Error');
  }
});

// Get role by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM Role WHERE id = ? AND deletedAt IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Role not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching role with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new role
router.post('/', async (req, res) => {
  const { name, permissions, parentRoleId } = req.body;
  if (!name) {
    return res.status(400).send('Role name is required');
  }
  try {
    const [result] = await db.query('INSERT INTO Role (name, permissions, parentRoleId) VALUES (?, ?, ?)', [name, JSON.stringify(permissions), parentRoleId]);
    res.status(201).json({ id: result.insertId, name, permissions, parentRoleId });
  } catch (err) {
    console.error('Error creating role:', err);
    res.status(500).send('Server Error');
  }
});

// Update a role
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, permissions, parentRoleId } = req.body;
  if (!name) {
    return res.status(400).send('Role name is required');
  }
  try {
    const [result] = await db.query('UPDATE Role SET name = ?, permissions = ?, parentRoleId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [name, JSON.stringify(permissions), parentRoleId, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Role not found or already deleted');
    }
    res.json({ message: 'Role updated successfully' });
  } catch (err) {
    console.error(`Error updating role with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Soft delete a role
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('UPDATE Role SET deletedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Role not found or already deleted');
    }
    res.json({ message: 'Role deleted successfully' });
  } catch (err) {
    console.error(`Error deleting role with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
