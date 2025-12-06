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
  console.log('📥 Received issue request:', JSON.stringify(req.body, null, 2));
  
  const { 
    repairRequestId, 
    inventoryItemId, 
    warehouseId, 
    quantity, 
    userId, 
    invoiceItemId = null, 
    invoiceId = null,
    serialNumber = null,
    notes = null,
    unitSellingPrice = null  // 🔧 Add custom selling price support
  } = req.body || {};
  
  console.log('📥 Extracted unitSellingPrice from req.body:', unitSellingPrice, typeof unitSellingPrice);

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

  let conn;
  try {
    conn = await db.getConnection();
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
    // Use custom selling price if provided, otherwise use item's default selling price
    // 🔧 Fix: Use the extracted unitSellingPrice from req.body (already extracted above)
    // Check if unitSellingPrice is provided and is a valid number
    let finalUnitSellingPrice;
    if (unitSellingPrice !== null && unitSellingPrice !== undefined && unitSellingPrice !== '') {
      const parsedPrice = Number(unitSellingPrice);
      if (!Number.isNaN(parsedPrice) && parsedPrice > 0) {
        finalUnitSellingPrice = parsedPrice;
        console.log('✅ Using custom selling price:', finalUnitSellingPrice);
      } else {
        console.warn('⚠️ Invalid custom price provided, using default:', unitSellingPrice);
        finalUnitSellingPrice = item.sellingPrice ? Number(item.sellingPrice) : 0;
      }
    } else {
      finalUnitSellingPrice = item.sellingPrice ? Number(item.sellingPrice) : 0;
      console.log('ℹ️ No custom price provided, using default:', finalUnitSellingPrice);
    }
    
    console.log('💰 Pricing calculation:', {
      customPrice: unitSellingPrice,
      itemDefaultPrice: item.sellingPrice,
      finalPrice: finalUnitSellingPrice,
      itemName: item.name
    });
    
    // Use finalUnitSellingPrice for all calculations
    const calculatedUnitSellingPrice = finalUnitSellingPrice;
    const totalCost = unitPurchasePrice * quantity;
    const totalPrice = calculatedUnitSellingPrice * quantity;
    const profit = totalPrice - totalCost;
    const profitMargin = unitPurchasePrice > 0 ? ((profit / totalCost) * 100).toFixed(2) : 0;

    // Approval logic removed - always set status to 'used'
    const partStatus = 'used';

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
    // StockMovement table doesn't have referenceType/referenceId columns
    // Use notes field to store repair request reference
    const [mvResult] = await conn.query(
      `INSERT INTO StockMovement 
        (type, quantity, inventoryItemId, fromWarehouseId, toWarehouseId, userId, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['OUT', quantity, inventoryItemId, warehouseId, null, userId, `صرف قطعة لطلب إصلاح #${repairRequestId}`]
    );

    // 7) Insert PartsUsed with available columns only
    // Note: Only insert columns that exist in the base schema
    // Additional columns will be added via migrations if needed
    const now = new Date();
    
    // Log values before insert for debugging
    console.log('📦 Inserting PartsUsed with values:', {
      quantity,
      repairRequestId,
      inventoryItemId,
      warehouseId,
      invoiceItemId,
      partStatus,
      userId,
      unitPurchasePrice,
      unitSellingPrice: calculatedUnitSellingPrice,
      totalCost,
      totalPrice,
      profit,
      serialNumber,
      notes
    });
    
    // Try to insert with enhanced columns first, fallback to basic columns if they don't exist
    let puResult;
    try {
      // Try with enhanced columns (if migration was applied)
      // Check if profit column exists by trying to insert without it first if needed
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
          unitPurchasePrice, calculatedUnitSellingPrice, totalCost, totalPrice, profit,
          serialNumber, notes
        ]
      );
      console.log('✅ PartsUsed inserted successfully with ID:', puResult.insertId);
    } catch (insertError) {
      // If enhanced columns don't exist, fallback to basic columns only
      console.error('❌ INSERT failed with enhanced columns:', insertError.message);
      console.error('Insert error details:', {
        code: insertError.code,
        sqlState: insertError.sqlState,
        sqlMessage: insertError.sqlMessage,
        errno: insertError.errno,
        sql: insertError.sql
      });
      
      // Extract column name from error message if it's a "column not found" error
      if (insertError.code === 'ER_BAD_FIELD_ERROR' && insertError.sqlMessage) {
        const columnMatch = insertError.sqlMessage.match(/Unknown column '([^']+)'/);
        if (columnMatch) {
          console.error(`❌ Missing column: ${columnMatch[1]}`);
        }
      }
      
      // Try with pricing columns but without profit
      try {
        [puResult] = await conn.query(
          `INSERT INTO PartsUsed 
            (quantity, repairRequestId, inventoryItemId, warehouseId, invoiceItemId,
             status, requestedBy, usedBy, requestedAt, usedAt,
             unitPurchasePrice, calculatedUnitSellingPrice, totalCost, totalPrice,
             serialNumber, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            quantity, repairRequestId, inventoryItemId, warehouseId, invoiceItemId,
            partStatus, userId, partStatus === 'used' ? userId : null, now, partStatus === 'used' ? now : null,
            unitPurchasePrice, calculatedUnitSellingPrice, totalCost, totalPrice,
            serialNumber, notes
          ]
        );
      } catch (pricingError) {
        // Try with warehouseId but without pricing
        console.warn('Pricing columns not available, trying without pricing:', pricingError.message);
        try {
          [puResult] = await conn.query(
            `INSERT INTO PartsUsed 
              (quantity, repairRequestId, inventoryItemId, warehouseId, invoiceItemId,
               status, requestedBy, usedBy, requestedAt, usedAt,
               serialNumber, notes) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              quantity, repairRequestId, inventoryItemId, warehouseId, invoiceItemId,
              partStatus, userId, partStatus === 'used' ? userId : null, now, partStatus === 'used' ? now : null,
              serialNumber, notes
            ]
          );
        } catch (statusError) {
          // Try with warehouseId but without status columns
          console.warn('Status columns not available, trying without status:', statusError.message);
          try {
            [puResult] = await conn.query(
              `INSERT INTO PartsUsed 
                (quantity, repairRequestId, inventoryItemId, warehouseId, invoiceItemId) 
                VALUES (?, ?, ?, ?, ?)`,
              [quantity, repairRequestId, inventoryItemId, warehouseId, invoiceItemId]
            );
          } catch (warehouseError) {
            // If warehouseId doesn't exist, try without it
            console.warn('WarehouseId column not available, trying without it:', warehouseError.message);
            try {
              [puResult] = await conn.query(
                `INSERT INTO PartsUsed 
                  (quantity, repairRequestId, inventoryItemId, invoiceItemId) 
                  VALUES (?, ?, ?, ?)`,
                [quantity, repairRequestId, inventoryItemId, invoiceItemId]
              );
            } catch (finalError) {
              // If even basic insert fails, log and rethrow
              console.error('❌ Failed to insert PartsUsed even with basic schema:', finalError);
              console.error('Final error details:', {
                code: finalError.code,
                sqlState: finalError.sqlState,
                sqlMessage: finalError.sqlMessage,
                errno: finalError.errno,
                stack: finalError.stack
              });
              
              // Extract column name if it's a column error
              if (finalError.code === 'ER_BAD_FIELD_ERROR' && finalError.sqlMessage) {
                const columnMatch = finalError.sqlMessage.match(/Unknown column ['"]([^'"]+)['"]/);
                if (columnMatch) {
                  console.error(`❌ Missing column in basic schema: ${columnMatch[1]}`);
                }
              }
              
              throw finalError;
            }
          }
        }
      }
    }
    
    // If we get here, the insert was successful
    if (!puResult || !puResult.insertId) {
      throw new Error('Failed to insert PartsUsed: No insertId returned');
    }

    const partsUsedId = puResult.insertId;

    // 8) If invoiceId provided and no invoiceItemId, create an invoice item and link both ways
    // 🔧 Fix: If invoiceId not provided, try to find existing invoice for this repair request
    let finalInvoiceId = invoiceId;
    if (!finalInvoiceId) {
      const [existingInvoice] = await conn.query(`
        SELECT id FROM Invoice WHERE repairRequestId = ? AND deletedAt IS NULL ORDER BY createdAt DESC LIMIT 1
      `, [repairRequestId]);
      if (existingInvoice.length > 0) {
        finalInvoiceId = existingInvoice[0].id;
        console.log('🔍 Found existing invoice for repair request:', { repairRequestId, invoiceId: finalInvoiceId });
      }
    }
    
    let createdInvoiceItemId = invoiceItemId || null;
    if (finalInvoiceId && !createdInvoiceItemId) {
      const totalPriceForInvoice = calculatedUnitSellingPrice * Number(quantity);
      // Check if partsUsedId column exists in InvoiceItem
      try {
        // Try with partsUsedId first (if column exists)
        const [invItemRes] = await conn.query(
          'INSERT INTO InvoiceItem (quantity, unitPrice, totalPrice, invoiceId, partsUsedId, itemType, inventoryItemId) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [quantity, calculatedUnitSellingPrice, totalPriceForInvoice, finalInvoiceId, puResult.insertId, 'part', inventoryItemId]
        );
        createdInvoiceItemId = invItemRes.insertId;
      } catch (invItemError) {
        // If partsUsedId doesn't exist, try without it
        if (invItemError.code === 'ER_BAD_FIELD_ERROR' && invItemError.sqlMessage && invItemError.sqlMessage.includes('partsUsedId')) {
          console.warn('partsUsedId column not found in InvoiceItem, inserting without it');
          const [invItemRes] = await conn.query(
          'INSERT INTO InvoiceItem (quantity, unitPrice, totalPrice, invoiceId, itemType, inventoryItemId) VALUES (?, ?, ?, ?, ?, ?)',
          [quantity, calculatedUnitSellingPrice, totalPriceForInvoice, finalInvoiceId, 'part', inventoryItemId]
          );
          createdInvoiceItemId = invItemRes.insertId;
        } else {
          throw invItemError;
        }
      }
      
      // update PartsUsed with the generated invoiceItemId
      await conn.query('UPDATE PartsUsed SET invoiceItemId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', 
        [createdInvoiceItemId, puResult.insertId]);
      
      // 🔧 Fix: Recalculate and update invoice totalAmount after adding item
      const [invoiceTotalResult] = await conn.query(`
        SELECT COALESCE(SUM(totalPrice), 0) as calculatedTotal
        FROM InvoiceItem WHERE invoiceId = ? AND (deletedAt IS NULL OR deletedAt IS NULL)
      `, [finalInvoiceId]);
      
      const newInvoiceTotal = Number(invoiceTotalResult[0]?.calculatedTotal || 0);
      await conn.query(`
        UPDATE Invoice SET totalAmount = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?
      `, [newInvoiceTotal, finalInvoiceId]);
      
      console.log('💰 Updated invoice totalAmount after adding part:', { invoiceId: finalInvoiceId, newTotal: newInvoiceTotal });
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
      message: isNegativeStock 
        ? `تم صرف القطعة بنجاح. ⚠️ تحذير: المخزون أصبح سالباً (${newQty}). يرجى تصحيح المخزون لاحقاً.`
        : 'تم صرف القطعة بنجاح',
      warning: isNegativeStock ? {
        message: `⚠️ تحذير: المخزون أصبح سالباً (${newQty}). يرجى تصحيح المخزون عبر إضافة مخزون جديد.`,
        newQuantity: newQty,
        actionRequired: 'add_stock'
      } : null,
      data: {
        stockLevel: { id: level.id, quantity: newQty, isLowStock: newIsLow === 1 },
        stockMovementId: mvResult.insertId,
        partsUsedId: puResult.insertId,
        invoiceItemId: createdInvoiceItemId,
        invoiceId: finalInvoiceId || invoiceId,
        pricing: {
          unitPurchasePrice,
          unitSellingPrice: calculatedUnitSellingPrice,
          totalCost,
          totalPrice,
          profit: Number(profit.toFixed(2)),
          profitMargin: `${profitMargin}%`
        },
        lowStockWarning,
        partStatus: partStatus,
        repairCost: {
          partsCost: totalPartsCost,
          servicesCost: totalServicesCost,
          totalActualCost: newActualCost
        }
      }
    });
  } catch (err) {
    try { 
      if (conn) {
        await conn.rollback(); 
      }
    } catch (rollbackErr) {
      console.error('Error during rollback:', rollbackErr);
    }
    console.error('❌ Error issuing part transaction:', err);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    console.error('SQL State:', err.sqlState);
    console.error('Error stack:', err.stack);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    
    // Provide more detailed error message
    let errorMessage = 'Server Error';
    let errorDetails = err.message || 'Unknown error occurred';
    
    // Check for specific SQL errors
    if (err.code === 'ER_NO_SUCH_TABLE') {
      errorMessage = 'Database table not found';
      errorDetails = `Table missing: ${err.message}`;
    } else if (err.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = 'Database column not found';
      // Extract column name from error message
      const columnMatch = err.message && err.message.match(/Unknown column ['"]([^'"]+)['"]/);
      if (columnMatch) {
        errorDetails = `Column '${columnMatch[1]}' not found in table. ${err.message}`;
      } else {
        errorDetails = `Column missing: ${err.message}`;
      }
    } else if (err.code === 'ER_DUP_ENTRY') {
      errorMessage = 'Duplicate entry';
      errorDetails = err.message;
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      errorMessage = 'Foreign key constraint failed';
      errorDetails = `Referenced record not found: ${err.message}`;
    } else if (err.sqlState) {
      errorMessage = 'Database error';
      errorDetails = `${err.code || 'SQL Error'}: ${err.message}`;
    }
    
    return res.status(500).json({ 
      success: false,
      message: errorMessage,
      details: errorDetails,
      errorCode: err.code || 'UNKNOWN_ERROR',
      sqlState: err.sqlState || null,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  } finally {
    if (conn) {
      try {
        conn.release();
      } catch (releaseErr) {
        console.error('Error releasing connection:', releaseErr);
      }
    }
  }
});

module.exports = router;
