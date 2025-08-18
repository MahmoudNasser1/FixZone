const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /inventory/issue
// Atomically issue a part to a repair request:
// 1) Lock stock level (item+warehouse)
// 2) Validate available quantity
// 3) Decrease StockLevel and recompute isLowStock
// 4) Insert StockMovement (type = 'ISSUE')
// 5) Insert PartsUsed
router.post('/issue', async (req, res) => {
  const { repairRequestId, inventoryItemId, warehouseId, quantity, userId, invoiceItemId = null, invoiceId = null } = req.body || {};

  if (!repairRequestId || !inventoryItemId || !warehouseId || !userId || typeof quantity !== 'number') {
    return res.status(400).json({ message: 'repairRequestId, inventoryItemId, warehouseId, userId, and quantity (number) are required' });
  }
  if (quantity <= 0) {
    return res.status(400).json({ message: 'quantity must be > 0' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Lock stock level row
    const [levels] = await conn.query(
      'SELECT id, quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ? FOR UPDATE',
      [inventoryItemId, warehouseId]
    );
    if (levels.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Stock level not found for this item and warehouse' });
    }
    const level = levels[0];

    // 2) Validate available quantity
    if (Number(level.quantity) < quantity) {
      await conn.rollback();
      return res.status(409).json({ message: 'Insufficient stock quantity', available: Number(level.quantity) });
    }

    // 3) Decrease quantity and recompute isLowStock
    const newQty = Number(level.quantity) - quantity;
    const minLevel = level.minLevel == null ? 0 : Number(level.minLevel);
    const newIsLow = newQty <= minLevel ? 1 : 0;

    await conn.query(
      'UPDATE StockLevel SET quantity = ?, isLowStock = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [newQty, newIsLow, level.id]
    );

    // 4) Insert StockMovement (OUT)
    const [mvResult] = await conn.query(
      'INSERT INTO StockMovement (type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, userId) VALUES (?, ?, ?, ?, ?, ?)',
      ['OUT', quantity, inventoryItemId, warehouseId, null, userId]
    );

    // 5) Insert PartsUsed
    const [puResult] = await conn.query(
      'INSERT INTO PartsUsed (quantity, repairRequestId, inventoryItemId, invoiceItemId) VALUES (?, ?, ?, ?)',
      [quantity, repairRequestId, inventoryItemId, invoiceItemId]
    );

    // 6) If invoiceId provided and no invoiceItemId, create an invoice item and link both ways
    let createdInvoiceItemId = invoiceItemId || null;
    if (invoiceId && !createdInvoiceItemId) {
      // fetch selling price
      const [itemRows] = await conn.query('SELECT sellingPrice FROM InventoryItem WHERE id = ?', [inventoryItemId]);
      const unitPrice = itemRows && itemRows[0] && itemRows[0].sellingPrice != null ? Number(itemRows[0].sellingPrice) : 0;
      const totalPrice = unitPrice * Number(quantity);
      const [invItemRes] = await conn.query(
        'INSERT INTO InvoiceItem (quantity, unitPrice, totalPrice, invoiceId, partsUsedId) VALUES (?, ?, ?, ?, ?)',
        [quantity, unitPrice, totalPrice, invoiceId, puResult.insertId]
      );
      createdInvoiceItemId = invItemRes.insertId;
      // update PartsUsed with the generated invoiceItemId
      await conn.query('UPDATE PartsUsed SET invoiceItemId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [createdInvoiceItemId, puResult.insertId]);
    }

    await conn.commit();

    return res.status(201).json({
      message: 'Part issued successfully',
      stockLevel: { id: level.id, quantity: newQty, isLowStock: newIsLow },
      stockMovementId: mvResult.insertId,
      partsUsedId: puResult.insertId,
      invoiceItemId: createdInvoiceItemId,
    });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    console.error('Error issuing part transaction:', err);
    return res.status(500).json({ message: 'Server Error' });
  } finally {
    conn.release();
  }
});

module.exports = router;
