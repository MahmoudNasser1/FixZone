const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM InventoryItem');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching inventory items:', err);
    res.status(500).send('Server Error');
  }
});

// Get inventory item by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM InventoryItem WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Inventory item not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching inventory item with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new inventory item
router.post('/', async (req, res) => {
  const { sku, name, type, purchasePrice, sellingPrice, serialNumber, customFields } = req.body;
  if (!sku || !name) {
    return res.status(400).send('SKU and name are required');
  }
  try {
    const [result] = await db.query('INSERT INTO InventoryItem (sku, name, type, purchasePrice, sellingPrice, serialNumber, customFields) VALUES (?, ?, ?, ?, ?, ?, ?)', [sku, name, type, purchasePrice, sellingPrice, serialNumber, customFields]);
    res.status(201).json({ id: result.insertId, sku, name, type, purchasePrice, sellingPrice, serialNumber, customFields });
  } catch (err) {
    console.error('Error creating inventory item:', err);
    res.status(500).send('Server Error');
  }
});

// Update an inventory item
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { sku, name, type, purchasePrice, sellingPrice, serialNumber, customFields } = req.body;
  if (!sku || !name) {
    return res.status(400).send('SKU and name are required');
  }
  try {
    const [result] = await db.query('UPDATE InventoryItem SET sku = ?, name = ?, type = ?, purchasePrice = ?, sellingPrice = ?, serialNumber = ?, customFields = ? WHERE id = ?', [sku, name, type, purchasePrice, sellingPrice, serialNumber, customFields, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Inventory item not found');
    }
    res.json({ message: 'Inventory item updated successfully' });
  } catch (err) {
    console.error(`Error updating inventory item with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Delete an inventory item
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM InventoryItem WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Inventory item not found');
    }
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (err) {
    console.error(`Error deleting inventory item with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Get inventory reports
router.get('/reports/overview', async (req, res) => {
  try {
    // Get total warehouses
    const [warehousesResult] = await db.query('SELECT COUNT(*) as total FROM Warehouse');
    const totalWarehouses = warehousesResult[0].total;
    
    // Get total inventory items
    const [itemsResult] = await db.query('SELECT COUNT(*) as total FROM InventoryItem');
    const totalItems = itemsResult[0].total;
    
    // Get low stock items count
    const [lowStockResult] = await db.query('SELECT COUNT(*) as total FROM StockLevel WHERE quantity <= minLevel OR isLowStock = 1');
    const lowStockCount = lowStockResult[0].total;
    
    // Get total stock movements in date range
    const { startDate, endDate } = req.query;
    let movementsQuery = 'SELECT COUNT(*) as total FROM StockMovement';
    let movementsParams = [];
    
    if (startDate && endDate) {
      movementsQuery += ' WHERE DATE(createdAt) BETWEEN ? AND ?';
      movementsParams = [startDate, endDate];
    }
    
    const [movementsResult] = await db.query(movementsQuery, movementsParams);
    const totalMovements = movementsResult[0].total;
    
    res.json({
      totalWarehouses,
      totalItems,
      lowStockCount,
      totalMovements
    });
  } catch (err) {
    console.error('Error generating inventory overview report:', err);
    res.status(500).send('Server Error');
  }
});

// Get low stock report
router.get('/reports/low-stock', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        sl.id AS stockLevelId,
        ii.id AS inventoryItemId,
        ii.sku,
        ii.name,
        ii.type,
        sl.quantity,
        sl.minLevel,
        sl.isLowStock,
        w.id AS warehouseId,
        w.name AS warehouseName
      FROM StockLevel sl
      INNER JOIN InventoryItem ii ON ii.id = sl.inventoryItemId
      INNER JOIN Warehouse w ON w.id = sl.warehouseId
      WHERE (sl.quantity <= COALESCE(sl.minLevel, 0) OR sl.isLowStock = 1)
      ORDER BY sl.quantity ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error generating low stock report:', err);
    res.status(500).send('Server Error');
  }
});

// Get high value items report
router.get('/reports/high-value', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        ii.id,
        ii.sku,
        ii.name,
        ii.type,
        ii.sellingPrice,
        SUM(sl.quantity) as totalStock,
        (SUM(sl.quantity) * ii.sellingPrice) as totalValue
      FROM InventoryItem ii
      LEFT JOIN StockLevel sl ON ii.id = sl.inventoryItemId
      WHERE ii.sellingPrice > 0
      GROUP BY ii.id
      HAVING totalStock > 0
      ORDER BY totalValue DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error generating high value items report:', err);
    res.status(500).send('Server Error');
  }
});

// Get stock movements report
router.get('/reports/movements', async (req, res) => {
  try {
    const { startDate, endDate, warehouseId } = req.query;
    
    let query = `
      SELECT
        sm.id,
        sm.type,
        sm.quantity,
        sm.notes,
        sm.createdAt,
        ii.name as itemName,
        ii.sku,
        w1.name as fromWarehouse,
        w2.name as toWarehouse
      FROM StockMovement sm
      INNER JOIN InventoryItem ii ON sm.inventoryItemId = ii.id
      LEFT JOIN Warehouse w1 ON sm.fromWarehouseId = w1.id
      LEFT JOIN Warehouse w2 ON sm.toWarehouseId = w2.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (startDate && endDate) {
      query += ' AND DATE(sm.createdAt) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    if (warehouseId) {
      query += ' AND (sm.fromWarehouseId = ? OR sm.toWarehouseId = ?)';
      params.push(warehouseId, warehouseId);
    }
    
    query += ' ORDER BY sm.createdAt DESC';
    
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error generating stock movements report:', err);
    res.status(500).send('Server Error');
  }
});

// Import inventory items from CSV
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];
    const errors = [];

    // Parse CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          let successCount = 0;
          let errorCount = 0;

          for (const row of results) {
            try {
              // Validate required fields
              if (!row.SKU || !row.Name) {
                errors.push(`Row ${results.indexOf(row) + 1}: SKU and Name are required`);
                errorCount++;
                continue;
              }

              // Check if item already exists
              const [existing] = await db.query('SELECT id FROM InventoryItem WHERE sku = ?', [row.SKU]);
              
              if (existing.length > 0) {
                // Update existing item
                await db.query(
                  'UPDATE InventoryItem SET name = ?, type = ?, purchasePrice = ?, sellingPrice = ?, serialNumber = ?, updatedAt = CURRENT_TIMESTAMP WHERE sku = ?',
                  [
                    row.Name || null,
                    row.Type || null,
                    parseFloat(row['Purchase Price']) || 0,
                    parseFloat(row['Selling Price']) || 0,
                    row['Serial Number'] || null,
                    row.SKU
                  ]
                );
              } else {
                // Insert new item
                await db.query(
                  'INSERT INTO InventoryItem (sku, name, type, purchasePrice, sellingPrice, serialNumber) VALUES (?, ?, ?, ?, ?, ?)',
                  [
                    row.SKU,
                    row.Name,
                    row.Type || null,
                    parseFloat(row['Purchase Price']) || 0,
                    parseFloat(row['Selling Price']) || 0,
                    row['Serial Number'] || null
                  ]
                );
              }
              successCount++;
            } catch (error) {
              errors.push(`Row ${results.indexOf(row) + 1}: ${error.message}`);
              errorCount++;
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          res.json({
            message: 'Import completed',
            successCount,
            errorCount,
            errors: errors.slice(0, 10) // Limit errors to first 10
          });
        } catch (error) {
          console.error('Import processing error:', error);
          res.status(500).json({ message: 'Error processing import' });
        }
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        res.status(400).json({ message: 'Error parsing CSV file' });
      });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Server error during import' });
  }
});

module.exports = router;
