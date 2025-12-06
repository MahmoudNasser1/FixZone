const express = require('express');
const router = express.Router();
const db = require('../db');

// Get parts used entries (optionally filter by repairRequestId, startDate, endDate)
router.get('/', async (req, res) => {
  try {
    const { repairRequestId, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    let whereClause = '1=1';
    let queryParams = [];
    
    if (repairRequestId) {
      whereClause += ' AND pu.repairRequestId = ?';
      queryParams.push(repairRequestId);
    }
    
    if (startDate) {
      whereClause += ' AND pu.createdAt >= ?';
      queryParams.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND pu.createdAt <= ?';
      queryParams.push(endDate + ' 23:59:59');
    }
    
    const offset = (page - 1) * limit;
    
    const [rows] = await db.query(
      `SELECT 
        pu.*,
        ii.name as itemName,
        ii.sku as itemSku,
        ii.purchasePrice,
        ii.sellingPrice
      FROM PartsUsed pu
      LEFT JOIN InventoryItem ii ON pu.inventoryItemId = ii.id
      WHERE ${whereClause}
      ORDER BY pu.createdAt DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      queryParams
    );
    
    res.json(rows);
  } catch (err) {
    console.error('Error fetching parts used entries:', err);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});

// Get parts used entry by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM PartsUsed WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Parts used entry not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching parts used entry with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new parts used entry
router.post('/', async (req, res) => {
  const { quantity, repairRequestId, inventoryItemId, invoiceItemId } = req.body;
  if (!quantity || !repairRequestId || !inventoryItemId) {
    return res.status(400).send('Quantity, repair request ID, and inventory item ID are required');
  }
  try {
    const [result] = await db.query('INSERT INTO PartsUsed (quantity, repairRequestId, inventoryItemId, invoiceItemId) VALUES (?, ?, ?, ?)', [quantity, repairRequestId, inventoryItemId, invoiceItemId]);
    res.status(201).json({ id: result.insertId, quantity, repairRequestId, inventoryItemId, invoiceItemId });
  } catch (err) {
    console.error('Error creating parts used entry:', err);
    res.status(500).send('Server Error');
  }
});

// Update a parts used entry
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { quantity, repairRequestId, inventoryItemId, invoiceItemId } = req.body;
  if (!quantity || !repairRequestId || !inventoryItemId) {
    return res.status(400).send('Quantity, repair request ID, and inventory item ID are required');
  }
  try {
    const [result] = await db.query('UPDATE PartsUsed SET quantity = ?, repairRequestId = ?, inventoryItemId = ?, invoiceItemId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [quantity, repairRequestId, inventoryItemId, invoiceItemId, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Parts used entry not found');
    }
    res.json({ message: 'Parts used entry updated successfully' });
  } catch (err) {
    console.error(`Error updating parts used entry with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Delete a parts used entry
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // First, get the parts used entry details before deleting
    const [partsRows] = await connection.execute('SELECT * FROM PartsUsed WHERE id = ?', [id]);
    
    if (partsRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Parts used entry not found' });
    }
    
    const partUsed = partsRows[0];
    const { invoiceItemId, repairRequestId, inventoryItemId } = partUsed;
    
    // Check if this part exists in any invoice items
    if (invoiceItemId) {
      // Find the invoice for this invoice item
      const [invoiceItems] = await connection.execute(`
        SELECT invoiceId FROM InvoiceItem WHERE id = ?
      `, [invoiceItemId]);
      
      // Delete the invoice item
      if (invoiceItems.length > 0) {
        const invoiceId = invoiceItems[0].invoiceId;
        
        await connection.execute(`
          DELETE FROM InvoiceItem WHERE id = ?
        `, [invoiceItemId]);
        
        // Recalculate invoice total
        const [totalResult] = await connection.execute(`
          SELECT COALESCE(SUM(quantity * unitPrice), 0) as calculatedTotal
          FROM InvoiceItem WHERE invoiceId = ?
        `, [invoiceId]);
        
        const newTotal = Number(totalResult[0].calculatedTotal);
        
        await connection.execute(`
          UPDATE Invoice SET totalAmount = ?, updatedAt = NOW() WHERE id = ?
        `, [newTotal, invoiceId]);
        
        console.log(`Deleted invoice item ${invoiceItemId} from invoice ${invoiceId} and updated total to ${newTotal}`);
      }
    }
    
    // Now delete the parts used entry
    const [result] = await connection.execute('DELETE FROM PartsUsed WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Parts used entry not found' });
    }
    
    await connection.commit();
    res.json({ success: true, message: 'Parts used entry deleted successfully' });
  } catch (err) {
    await connection.rollback();
    console.error(`Error deleting parts used entry with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  } finally {
    connection.release();
  }
});

// Get parts usage report/stats
router.get('/reports/consumption', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'item' } = req.query;
    
    let whereClause = '1=1';
    let queryParams = [];
    
    if (startDate) {
      whereClause += ' AND pu.createdAt >= ?';
      queryParams.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND pu.createdAt <= ?';
      queryParams.push(endDate + ' 23:59:59');
    }
    
    if (groupBy === 'item') {
      const [rows] = await db.query(
        `SELECT 
          pu.inventoryItemId,
          ii.name as itemName,
          ii.sku,
          COUNT(pu.id) as usageCount,
          SUM(pu.quantity) as totalQuantity,
          COUNT(DISTINCT pu.repairRequestId) as repairsCount
        FROM PartsUsed pu
        LEFT JOIN InventoryItem ii ON pu.inventoryItemId = ii.id
        WHERE ${whereClause}
        GROUP BY pu.inventoryItemId, ii.name, ii.sku
        ORDER BY totalQuantity DESC`,
        queryParams
      );
      return res.json({ success: true, data: rows });
    }
    
    res.json({ success: true, data: [] });
  } catch (err) {
    console.error('Error fetching parts consumption report:', err);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});

module.exports = router;
