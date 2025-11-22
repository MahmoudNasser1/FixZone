const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// POST /inventory/issue
// Atomically issue a part to a repair request with full integration:
// 1) Lock stock level (item+warehouse)
// 2) Validate available quantity + Low stock warning
// 3) Fetch item pricing (purchase & selling prices)
// 4) Calculate costs, prices, and profit
// 5) Decrease StockLevel and recompute isLowStock
// 6) Insert StockMovement (type = 'OUT')
// 7) Insert PartsUsed with full data (requestedBy, warehouseId, prices, profit, status='used', usedBy)
// 8) Update repair cost breakdown
router.post('/issue', async (req, res) => {
  const { 
    repairRequestId, 
    inventoryItemId, 
    warehouseId, 
    quantity, 
    userId, 
    invoiceItemId = null, 
    invoiceId = null,
    serialNumber = null,
    notes = null
  } = req.body || {};

  if (!repairRequestId || !inventoryItemId || !warehouseId || !userId || typeof quantity !== 'number') {
    return res.status(400).json({ 
      success: false,
      message: 'repairRequestId, inventoryItemId, warehouseId, userId, and quantity (number) are required' 
    });
  }
  if (quantity <= 0) {
    return res.status(400).json({ 
      success: false,
      message: 'quantity must be > 0' 
    });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Fetch inventory item details (pricing)
    const [itemRows] = await conn.query(
      'SELECT id, name, sku, purchasePrice, sellingPrice FROM InventoryItem WHERE id = ? AND deletedAt IS NULL',
      [inventoryItemId]
    );
    if (itemRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Inventory item not found' 
      });
    }
    const item = itemRows[0];

    // 2) Lock stock level row - create if doesn't exist
    let [levels] = await conn.query(
      'SELECT id, quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ? FOR UPDATE',
      [inventoryItemId, warehouseId]
    );
    
    // Check for stock in other warehouses before creating new StockLevel
    let totalStockAvailable = 0;
    let otherWarehousesStock = [];
    
    if (levels.length === 0) {
      // Check if stock exists in other warehouses
      const [otherStock] = await conn.query(
        'SELECT warehouseId, quantity, w.name as warehouseName FROM StockLevel sl LEFT JOIN Warehouse w ON sl.warehouseId = w.id WHERE sl.inventoryItemId = ? AND sl.quantity > 0 AND sl.deletedAt IS NULL',
        [inventoryItemId]
      );
      
      if (otherStock.length > 0) {
        otherWarehousesStock = otherStock.map(s => ({
          warehouseId: s.warehouseId,
          warehouseName: s.warehouseName,
          quantity: s.quantity
        }));
        totalStockAvailable = otherStock.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
      }
      
      // Create StockLevel with quantity = 0 if it doesn't exist
      await conn.query(
        'INSERT INTO StockLevel (inventoryItemId, warehouseId, quantity, minLevel, isLowStock, createdAt, updatedAt) VALUES (?, ?, 0, 0, 0, NOW(), NOW())',
        [inventoryItemId, warehouseId]
      );
      // Re-fetch the newly created stock level
      [levels] = await conn.query(
        'SELECT id, quantity, minLevel FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ? FOR UPDATE',
        [inventoryItemId, warehouseId]
      );
    }
    
    if (levels.length === 0) {
      await conn.rollback();
      return res.status(500).json({ 
        success: false,
        message: 'فشل في إنشاء أو جلب مستوى المخزون. يرجى المحاولة مرة أخرى.' 
      });
    }
    const level = levels[0];
    const currentQty = Number(level.quantity);
    const minLevel = level.minLevel == null ? 0 : Number(level.minLevel);

    // 3) Validate available quantity + Low stock warning
    // 🔧 FIX: Allow issuing even with zero stock, but with warning
    if (currentQty < quantity) {
      // Check if there's stock in other warehouses
      if (otherWarehousesStock.length === 0) {
        // Check again if we haven't checked before
        const [otherStock] = await conn.query(
          'SELECT warehouseId, quantity, w.name as warehouseName FROM StockLevel sl LEFT JOIN Warehouse w ON sl.warehouseId = w.id WHERE sl.inventoryItemId = ? AND sl.quantity > 0 AND sl.deletedAt IS NULL',
          [inventoryItemId]
        );
        
        if (otherStock.length > 0) {
          otherWarehousesStock = otherStock.map(s => ({
            warehouseId: s.warehouseId,
            warehouseName: s.warehouseName,
            quantity: s.quantity
          }));
          totalStockAvailable = otherStock.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
        }
      }
      
      // If no stock exists anywhere, allow issuing with warning (for urgent repairs)
      if (otherWarehousesStock.length === 0 && currentQty === 0) {
        // Allow issuing with zero stock - this will go negative, but allow urgent repairs
        console.warn(`⚠️ Issuing part with zero stock - InventoryItemId: ${inventoryItemId}, WarehouseId: ${warehouseId}, Quantity: ${quantity}`);
        // Continue with the process - will result in negative stock which can be corrected later
      } else {
        // Stock exists in other warehouses - suggest transfer
        await conn.rollback();
        return res.status(409).json({ 
          success: false,
          message: `الكمية المتاحة في هذا المخزن (${currentQty}) أقل من المطلوب (${quantity}). يوجد مخزون في مخازن أخرى.`,
          messageEn: 'Insufficient stock quantity in this warehouse. Stock available in other warehouses.',
          available: currentQty,
          requested: quantity,
          shortage: quantity - currentQty,
          inventoryItemId,
          warehouseId,
          otherWarehousesStock: otherWarehousesStock,
          totalStockAvailable: totalStockAvailable,
          suggestion: 'يمكنك نقل المخزون من مخزن آخر أو اختيار مخزن آخر'
        });
      }
    }

    // Check for low stock warning (before issuing)
    const willBeLowStock = (currentQty - quantity) <= minLevel;
    const lowStockWarning = willBeLowStock ? {
      warning: true,
      message: `⚠️ تحذير: المخزون سيكون منخفضاً بعد الإصدار (${currentQty - quantity} / ${minLevel})`,
      newQuantity: currentQty - quantity,
      minLevel: minLevel
    } : null;

    // 4) Calculate pricing and profit
    const unitPurchasePrice = item.purchasePrice ? Number(item.purchasePrice) : 0;
    const unitSellingPrice = item.sellingPrice ? Number(item.sellingPrice) : 0;
    const totalCost = unitPurchasePrice * quantity;
    const totalPrice = unitSellingPrice * quantity;
    const profit = totalPrice - totalCost;
    const profitMargin = unitPurchasePrice > 0 ? ((profit / totalCost) * 100).toFixed(2) : 0;

    // 🔧 Fix #3: Check if approval is needed for expensive/critical parts
    const needsApproval = 
      totalCost > 500 || // أكثر من 500 جنيه
      unitPurchasePrice > 1000; // سعر الوحدة أكثر من 1000 جنيه
    
    // Determine approver role based on cost
    let approverRoleId = null;
    let approvalPriority = 'normal';
    if (needsApproval) {
      if (totalCost > 5000) {
        approverRoleId = 1; // Super Admin
        approvalPriority = 'urgent';
      } else if (totalCost > 1000) {
        approverRoleId = 2; // Branch Manager (assuming role 2)
        approvalPriority = 'high';
      } else {
        approverRoleId = 3; // Supervisor (assuming role 3)
        approvalPriority = 'normal';
      }
    }

    // If approval needed, set status to 'requested' instead of 'used'
    const partStatus = needsApproval ? 'requested' : 'used';

    // 5) Decrease quantity and recompute isLowStock
    // Allow negative stock for urgent repairs (will be corrected later via inventory adjustments)
    const newQty = currentQty - quantity;
    const newIsLow = newQty <= minLevel ? 1 : 0;
    const isNegativeStock = newQty < 0;

    await conn.query(
      'UPDATE StockLevel SET quantity = ?, isLowStock = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [newQty, newIsLow, level.id]
    );
    
    // Add warning if stock went negative
    if (isNegativeStock) {
      console.warn(`⚠️ Stock went negative: InventoryItemId: ${inventoryItemId}, WarehouseId: ${warehouseId}, New Quantity: ${newQty}`);
    }

    // Update StockAlert if needed
    if (newIsLow) {
      const alertType = newQty <= 0 ? 'out_of_stock' : 'low_stock';
      const severity = newQty <= 0 ? 'critical' : 'warning';
      const alertMessage = newQty <= 0 
        ? `الصنف منتهٍ تماماً (0 قطعة)`
        : `المخزون منخفض: ${newQty} / ${minLevel}`;
      
      // Check if alert exists
      const [existingAlert] = await conn.query(
        'SELECT id FROM StockAlert WHERE inventoryItemId = ? AND warehouseId = ? AND status = "active"',
        [inventoryItemId, warehouseId]
      );
      
      if (existingAlert.length > 0) {
        await conn.query(`
          UPDATE StockAlert 
          SET alertType = ?, currentQuantity = ?, threshold = ?, severity = ?, message = ?, updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [alertType, newQty, minLevel, severity, alertMessage, existingAlert[0].id]);
      } else {
        await conn.query(`
          INSERT INTO StockAlert 
          (inventoryItemId, warehouseId, alertType, currentQuantity, threshold, severity, status, message, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, 'active', ?, CURRENT_TIMESTAMP)
        `, [inventoryItemId, warehouseId, alertType, newQty, minLevel, severity, alertMessage]);
      }
    }

    // 6) Insert StockMovement (OUT)
    const [mvResult] = await conn.query(
      `INSERT INTO StockMovement 
        (type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, userId, referenceType, referenceId, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['OUT', quantity, inventoryItemId, warehouseId, null, userId, 'RepairRequest', repairRequestId, `صرف قطعة لطلب إصلاح #${repairRequestId}`]
    );

    // 7) Insert PartsUsed with available columns only
    // Note: Only insert columns that exist in the base schema
    // Additional columns will be added via migrations if needed
    const now = new Date();
    
    // Try to insert with enhanced columns first, fallback to basic columns if they don't exist
    let puResult;
    try {
      // Try with enhanced columns (if migration was applied)
      [puResult] = await conn.query(
        `INSERT INTO PartsUsed 
          (quantity, repairRequestId, inventoryItemId, warehouseId, invoiceItemId,
           status, requestedBy, usedBy, requestedAt, usedAt,
           unitPurchasePrice, unitSellingPrice, totalCost, totalPrice, profit,
           serialNumber, notes) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          quantity, repairRequestId, inventoryItemId, warehouseId, invoiceItemId,
          partStatus, userId, partStatus === 'used' ? userId : null, now, partStatus === 'used' ? now : null,
          unitPurchasePrice, unitSellingPrice, totalCost, totalPrice, profit,
          serialNumber, notes
        ]
      );
    } catch (insertError) {
      // If enhanced columns don't exist, fallback to basic columns only
      console.warn('Enhanced columns not available, using basic schema:', insertError.message);
      try {
        [puResult] = await conn.query(
          `INSERT INTO PartsUsed 
            (quantity, repairRequestId, inventoryItemId, invoiceItemId) 
            VALUES (?, ?, ?, ?)`,
          [quantity, repairRequestId, inventoryItemId, invoiceItemId]
        );
      } catch (fallbackError) {
        // If even basic insert fails, log and rethrow
        console.error('Failed to insert PartsUsed even with basic schema:', fallbackError);
        throw fallbackError;
      }
    }

    const partsUsedId = puResult.insertId;

    // 🔧 Fix #3: Create approval request if needed
    let approvalId = null;
    if (needsApproval && approverRoleId) {
      try {
        const [approvalResult] = await conn.query(`
          INSERT INTO RepairPartsApproval (
            repairRequestId, partsUsedId, requestedBy, approverRoleId, 
            status, priority, totalCost, requestReason, 
            autoApproved, requestedAt, createdAt
          ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, 0, NOW(), NOW())
        `, [
          repairRequestId,
          partsUsedId,
          userId,
          approverRoleId,
          approvalPriority,
          totalCost,
          `قطعة ${item.name || 'غير محددة'} - التكلفة: ${totalCost.toFixed(2)} جنيه`
        ]);

        approvalId = approvalResult.insertId;

        // Update PartsUsed status to 'requested' (already set above)
        console.log(`⚠️ Approval request ${approvalId} created for part ${inventoryItemId}, total cost: ${totalCost}`);
      } catch (approvalError) {
        console.error('Error creating approval request:', approvalError);
        // Don't fail the part issue if approval creation fails, but log it
      }
    }

    // 8) If invoiceId provided and no invoiceItemId, create an invoice item and link both ways
    let createdInvoiceItemId = invoiceItemId || null;
    if (invoiceId && !createdInvoiceItemId) {
      const totalPriceForInvoice = unitSellingPrice * Number(quantity);
      const [invItemRes] = await conn.query(
        'INSERT INTO InvoiceItem (quantity, unitPrice, totalPrice, invoiceId, partsUsedId, itemType) VALUES (?, ?, ?, ?, ?, ?)',
        [quantity, unitSellingPrice, totalPriceForInvoice, invoiceId, puResult.insertId, 'part']
      );
      createdInvoiceItemId = invItemRes.insertId;
      // update PartsUsed with the generated invoiceItemId
      await conn.query('UPDATE PartsUsed SET invoiceItemId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', 
        [createdInvoiceItemId, puResult.insertId]);
    }

    // 9) Update repair request cost breakdown (recalculate actualCost)
    const [repairParts] = await conn.query(
      'SELECT SUM(totalCost) as totalPartsCost FROM PartsUsed WHERE repairRequestId = ? AND status IN ("used", "approved", "reserved")',
      [repairRequestId]
    );
    const totalPartsCost = repairParts[0]?.totalPartsCost || 0;

    // Get services cost
    const [repairServices] = await conn.query(
      'SELECT SUM(finalPrice) as totalServicesCost FROM RepairRequestService WHERE repairRequestId = ? AND status = "completed"',
      [repairRequestId]
    );
    const totalServicesCost = repairServices[0]?.totalServicesCost || 0;

    const newActualCost = Number(totalPartsCost) + Number(totalServicesCost);
    await conn.query(
      'UPDATE RepairRequest SET actualCost = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [newActualCost, repairRequestId]
    );

    await conn.commit();

    return res.status(201).json({
      success: true,
      message: needsApproval 
        ? 'تم طلب القطعة. في انتظار الموافقة.' 
        : (isNegativeStock 
            ? `تم صرف القطعة بنجاح. ⚠️ تحذير: المخزون أصبح سالباً (${newQty}). يرجى تصحيح المخزون لاحقاً.`
            : 'تم صرف القطعة بنجاح'),
      warning: !needsApproval && isNegativeStock ? {
        message: `⚠️ تحذير: المخزون أصبح سالباً (${newQty}). يرجى تصحيح المخزون عبر إضافة مخزون جديد.`,
        newQuantity: newQty,
        actionRequired: 'add_stock'
      } : null,
      data: {
        stockLevel: { id: level.id, quantity: newQty, isLowStock: newIsLow === 1 },
        stockMovementId: mvResult.insertId,
        partsUsedId: puResult.insertId,
        invoiceItemId: createdInvoiceItemId,
        pricing: {
          unitPurchasePrice,
          unitSellingPrice,
          totalCost,
          totalPrice,
          profit: Number(profit.toFixed(2)),
          profitMargin: `${profitMargin}%`
        },
        lowStockWarning,
        approval: needsApproval ? {
          required: true,
          approvalId: approvalId,
          status: 'pending',
          priority: approvalPriority,
          approverRoleId: approverRoleId,
          message: `⚠️ هذه القطعة تحتاج موافقة. تم إنشاء طلب موافقة #${approvalId}`
        } : {
          required: false,
          message: '✅ لا تحتاج موافقة - تم الصرف مباشرة'
        },
        partStatus: partStatus,
        repairCost: {
          partsCost: totalPartsCost,
          servicesCost: totalServicesCost,
          totalActualCost: newActualCost
        }
      }
    });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    console.error('Error issuing part transaction:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Server Error',
      details: err.message 
    });
  } finally {
    conn.release();
  }
});

module.exports = router;
