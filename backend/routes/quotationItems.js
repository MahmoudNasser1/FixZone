const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, quotationItemSchemas } = require('../middleware/validation');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all quotation items (filter by quotationId)
router.get('/', validate(quotationItemSchemas.getQuotationItems, 'query'), async (req, res) => {
  try {
    const { quotationId } = req.query;
    
    if (!quotationId) {
      return res.status(400).json({
        success: false,
        error: 'quotationId is required'
      });
    }
    
    // Check if deletedAt column exists
    const [columnCheck] = await db.execute(
      `SELECT COUNT(*) as col_exists FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = 'FZ' AND TABLE_NAME = 'QuotationItem' AND COLUMN_NAME = 'deletedAt'`
    );
    
    const hasDeletedAt = columnCheck[0].col_exists > 0;
    const whereClause = hasDeletedAt 
      ? 'WHERE quotationId = ? AND deletedAt IS NULL'
      : 'WHERE quotationId = ?';
    
    const [rows] = await db.execute(
      `SELECT * FROM QuotationItem ${whereClause} ORDER BY id ASC`,
      [quotationId]
    );
    
    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    console.error('Error fetching quotation items:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Get quotation item by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if deletedAt column exists
    const [columnCheck] = await db.execute(
      `SELECT COUNT(*) as col_exists FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = 'FZ' AND TABLE_NAME = 'QuotationItem' AND COLUMN_NAME = 'deletedAt'`
    );
    
    const hasDeletedAt = columnCheck[0].col_exists > 0;
    const whereClause = hasDeletedAt 
      ? 'WHERE id = ? AND deletedAt IS NULL'
      : 'WHERE id = ?';
    
    const [rows] = await db.execute(
      `SELECT * FROM QuotationItem ${whereClause}`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Quotation item not found'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    console.error(`Error fetching quotation item with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Create a new quotation item
router.post('/', validate(quotationItemSchemas.createQuotationItem, 'body'), async (req, res) => {
  const { description, quantity, unitPrice, totalPrice, quotationId } = req.body;
  
  try {
    // Check if deletedAt column exists in Quotation table
    const [columnCheck] = await db.execute(
      `SELECT COUNT(*) as col_exists FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = 'FZ' AND TABLE_NAME = 'Quotation' AND COLUMN_NAME = 'deletedAt'`
    );
    
    const hasDeletedAt = columnCheck[0].col_exists > 0;
    const whereClause = hasDeletedAt
      ? 'WHERE id = ? AND deletedAt IS NULL'
      : 'WHERE id = ?';
    
    // Verify quotation exists
    const [quotationCheck] = await db.execute(
      `SELECT id FROM Quotation ${whereClause}`,
      [quotationId]
    );
    
    if (quotationCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
    }
    
    // Auto-calculate totalPrice if not provided or if quantity/unitPrice changed
    const calculatedTotalPrice = (quantity * unitPrice).toFixed(2);
    const finalTotalPrice = totalPrice || calculatedTotalPrice;
    
    const [result] = await db.execute(
      'INSERT INTO QuotationItem (description, quantity, unitPrice, totalPrice, quotationId) VALUES (?, ?, ?, ?, ?)',
      [description, quantity, unitPrice, finalTotalPrice, quotationId]
    );
    
    // Get created item
    const [created] = await db.execute(
      'SELECT * FROM QuotationItem WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      data: created[0]
    });
  } catch (err) {
    console.error('Error creating quotation item:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Update a quotation item
router.put('/:id', validate(quotationItemSchemas.updateQuotationItem, 'body'), async (req, res) => {
  const { id } = req.params;
  const { description, quantity, unitPrice, totalPrice, quotationId } = req.body;
  
  try {
    // Check if item exists
    const [columnCheck] = await db.execute(
      `SELECT COUNT(*) as col_exists FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = 'FZ' AND TABLE_NAME = 'QuotationItem' AND COLUMN_NAME = 'deletedAt'`
    );
    
    const hasDeletedAt = columnCheck[0].col_exists > 0;
    const whereClause = hasDeletedAt 
      ? 'WHERE id = ? AND deletedAt IS NULL'
      : 'WHERE id = ?';
    
    const [existing] = await db.execute(
      `SELECT * FROM QuotationItem ${whereClause}`,
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Quotation item not found'
      });
    }
    
    // Build update query dynamically
    const updates = [];
    const params = [];
    
    let finalQuantity = quantity !== undefined ? quantity : existing[0].quantity;
    let finalUnitPrice = unitPrice !== undefined ? unitPrice : existing[0].unitPrice;
    
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (quantity !== undefined) {
      updates.push('quantity = ?');
      params.push(quantity);
    }
    if (unitPrice !== undefined) {
      updates.push('unitPrice = ?');
      params.push(unitPrice);
    }
    
    // Auto-calculate totalPrice if quantity or unitPrice changed
    if (quantity !== undefined || unitPrice !== undefined) {
      const calculatedTotalPrice = (finalQuantity * finalUnitPrice).toFixed(2);
      updates.push('totalPrice = ?');
      params.push(calculatedTotalPrice);
    } else if (totalPrice !== undefined) {
      updates.push('totalPrice = ?');
      params.push(totalPrice);
    }
    
    if (quotationId !== undefined) {
      // Check if deletedAt column exists in Quotation table
      const [quotationColumnCheck] = await db.execute(
        `SELECT COUNT(*) as col_exists FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = 'FZ' AND TABLE_NAME = 'Quotation' AND COLUMN_NAME = 'deletedAt'`
      );
      
      const hasQuotationDeletedAt = quotationColumnCheck[0].col_exists > 0;
      const quotationWhereClause = hasQuotationDeletedAt
        ? 'WHERE id = ? AND deletedAt IS NULL'
        : 'WHERE id = ?';
      
      // Verify quotation exists
      const [quotationCheck] = await db.execute(
        `SELECT id FROM Quotation ${quotationWhereClause}`,
        [quotationId]
      );
      
      if (quotationCheck.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Quotation not found'
        });
      }
      
      updates.push('quotationId = ?');
      params.push(quotationId);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }
    
    updates.push('updatedAt = CURRENT_TIMESTAMP');
    params.push(id);
    
    await db.execute(
      `UPDATE QuotationItem SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    // Get updated item
    const [updated] = await db.execute(
      'SELECT * FROM QuotationItem WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      data: updated[0]
    });
  } catch (err) {
    console.error(`Error updating quotation item with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Delete a quotation item (soft delete)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if deletedAt column exists
    const [columnCheck] = await db.execute(
      `SELECT COUNT(*) as col_exists FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = 'FZ' AND TABLE_NAME = 'QuotationItem' AND COLUMN_NAME = 'deletedAt'`
    );
    
    const hasDeletedAt = columnCheck[0].col_exists > 0;
    
    let result;
    if (hasDeletedAt) {
      // Soft delete
      [result] = await db.execute(
        'UPDATE QuotationItem SET deletedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL',
        [id]
      );
    } else {
      // Hard delete (fallback if deletedAt doesn't exist)
      [result] = await db.execute(
        'DELETE FROM QuotationItem WHERE id = ?',
        [id]
      );
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Quotation item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Quotation item deleted successfully'
    });
  } catch (err) {
    console.error(`Error deleting quotation item with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

module.exports = router;
