const db = require('../db');
const websocketService = require('../services/websocketService');

// Simplified Invoice Controller - Basic functionality only
class InvoicesControllerSimple {

  // Get all invoices with improved pagination and filters
  async getAllInvoices(req, res) {
    try {
      // Request received

      const {
        repairRequestId,
        customerId,
        paymentStatus,
        page = 1,
        limit = 10
      } = req.query;

      console.log('getAllInvoices called with:', { repairRequestId, customerId, paymentStatus, page, limit });

      // Parse pagination parameters
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
      const offset = Math.max(0, (pageNum - 1) * limitNum);

      // Build WHERE conditions
      let whereConditions = ['i.deletedAt IS NULL'];
      const queryParams = [];

      // Filter by repair request ID if provided
      if (repairRequestId) {
        const safeRepairRequestId = parseInt(repairRequestId);
        if (!isNaN(safeRepairRequestId) && safeRepairRequestId > 0) {
          whereConditions.push('i.repairRequestId = ?');
          queryParams.push(safeRepairRequestId);
          console.log('Added repairRequestId filter:', safeRepairRequestId);
        } else {
          console.warn('⚠️ Invalid repairRequestId:', repairRequestId);
        }
      }

      // Filter by customerId - check both direct customer and via repair
      if (customerId) {
        const safeCustomerId = parseInt(customerId);
        if (!isNaN(safeCustomerId) && safeCustomerId > 0) {
          whereConditions.push('(i.customerId = ? OR rr.customerId = ?)');
          queryParams.push(safeCustomerId, safeCustomerId);
          console.log('Added customerId filter:', safeCustomerId);
        } else {
          console.warn('⚠️ Invalid customerId:', customerId);
        }
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Main query with pagination
      const query = `
        SELECT 
          i.id,
          i.totalAmount,
          i.amountPaid,
          i.status,
          i.currency,
          i.taxAmount,
          i.repairRequestId,
          i.customerId,
          i.vendorId,
          i.invoiceType,
          i.createdAt,
          COALESCE(c_direct.name, c_via_repair.name) as customerName,
          COALESCE(c_direct.phone, c_via_repair.phone) as customerPhone,
          COALESCE(c_direct.email, c_via_repair.email) as customerEmail,
          v.name as vendorName,
          v.contactPerson as vendorContact,
          v.phone as vendorPhone,
          v.email as vendorEmail,
          rr.deviceBrand,
          rr.deviceModel,
          rr.deviceType
        FROM Invoice i
        LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
        LEFT JOIN Customer c_direct ON i.customerId = c_direct.id
        LEFT JOIN Customer c_via_repair ON rr.customerId = c_via_repair.id
        LEFT JOIN Vendor v ON i.vendorId = v.id
        ${whereClause}
        ORDER BY i.createdAt DESC
        LIMIT ? OFFSET ?
      `;

      // CRITICAL: Ensure limit and offset are integers (not strings!) for MariaDB strict mode
      // Use parseInt() explicitly to convert to integer
      const finalLimit = parseInt(limitNum, 10) || 10;
      const finalOffset = parseInt(offset, 10) || 0;
      
      // Final validation - ensure we have valid numbers
      if (isNaN(finalLimit) || finalLimit < 1 || finalLimit > 100) {
        console.error('❌ [ERROR] Invalid finalLimit:', finalLimit);
        return res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters',
          error: 'PAGINATION_ERROR'
        });
      }
      if (isNaN(finalOffset) || finalOffset < 0) {
        console.error('❌ [ERROR] Invalid finalOffset:', finalOffset);
        return res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters',
          error: 'PAGINATION_ERROR'
        });
      }
      
      // CRITICAL: Ensure these are integers before pushing to queryParams
      queryParams.push(finalLimit, finalOffset);
      
      // Query params prepared

      // CRITICAL: Use db.query instead of db.execute for queries with LIMIT/OFFSET
      // db.execute uses prepared statements which cause issues with LIMIT/OFFSET in MariaDB strict mode
      // db.query interpolates values directly and works perfectly with LIMIT/OFFSET
      const [invoices] = await db.query(query, queryParams);

      console.log('Query executed, found invoices:', invoices.length);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM Invoice i
        LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
        ${whereClause}
      `;

      // Remove limit and offset params for count query
      const countParams = queryParams.slice(0, -2);
      const [countResult] = await db.execute(countQuery, countParams);
      const total = countResult[0]?.total || 0;

      // Calculate actual amountPaid for each invoice from payments and determine correct status
      const invoicesWithCorrectAmounts = await Promise.all(
        invoices.map(async (invoice) => {
          // Fail-safe: Ensure invoice.id is valid
          if (!invoice || !invoice.id || isNaN(invoice.id)) {
            console.warn('⚠️ Invalid invoice object:', invoice);
            return null;
          }
          
          const [payments] = await db.execute(`
            SELECT COALESCE(SUM(amount), 0) as totalPaid 
            FROM Payment 
            WHERE invoiceId = ?
          `, [invoice.id]);

          const actualAmountPaid = parseFloat(payments[0].totalPaid || 0);
          const totalAmount = parseFloat(invoice.totalAmount || 0);
          const remainingAmount = totalAmount - actualAmountPaid;

          // Determine correct payment status based on actual payments
          let paymentStatusValue = invoice.status || 'pending';
          if (actualAmountPaid >= totalAmount && totalAmount > 0) {
            paymentStatusValue = 'paid';
          } else if (actualAmountPaid > 0) {
            paymentStatusValue = 'partially_paid';
          } else {
            paymentStatusValue = 'pending';
          }

          // For purchase invoices, show vendor info instead of customer
          const isPurchaseInvoice = invoice.invoiceType === 'purchase';
          
          return {
            id: invoice.id,
            repairId: invoice.repairRequestId,
            customerId: invoice.customerId,
            vendorId: invoice.vendorId,
            invoiceType: invoice.invoiceType || 'sale',
            customerName: isPurchaseInvoice ? null : (invoice.customerName || 'غير محدد'),
            customerPhone: isPurchaseInvoice ? null : (invoice.customerPhone || 'غير محدد'),
            vendorName: isPurchaseInvoice ? (invoice.vendorName || 'غير محدد') : null,
            vendorPhone: isPurchaseInvoice ? (invoice.vendorPhone || null) : null,
            totalAmount: parseFloat(invoice.totalAmount) || 0,
            paidAmount: actualAmountPaid,
            remainingAmount: Math.max(0, remainingAmount),
            paymentStatus: paymentStatusValue,
            createdAt: invoice.createdAt,
            items: [] // Will be populated if needed
          };
        })
      );
      
      // Filter out null values (invalid invoices)
      const validInvoices = invoicesWithCorrectAmounts.filter(inv => inv !== null);

      // Filter by paymentStatus if provided (after calculation)
      let filteredInvoices = validInvoices;
      if (paymentStatus) {
        filteredInvoices = validInvoices.filter(inv =>
          inv && inv.paymentStatus === paymentStatus
        );
      }

      res.json({
        success: true,
        data: {
          invoices: filteredInvoices,
          pagination: {
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            totalItems: total
          }
        }
      });

    } catch (error) {
      console.error('❌ [ERROR] Error in getAllInvoices:', error);
      console.error('❌ [ERROR] Error stack:', error.stack);
      console.error('❌ [ERROR] Error code:', error.code);
      console.error('❌ [ERROR] SQL Message:', error.sqlMessage);
      console.error('❌ [ERROR] req.user:', req.user);
      
      res.status(500).json({
        success: false,
        message: 'حصل خطأ في السيرفر',
        code: 'SERVER_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        sqlError: process.env.NODE_ENV === 'development' ? error.sqlMessage : undefined
      });
    }
  }

  // Get invoice statistics - simplified version
  async getInvoiceStats(req, res) {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
          SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue,
          SUM(totalAmount) as totalRevenue
        FROM Invoice 
        WHERE deletedAt IS NULL
      `;

      const [stats] = await db.execute(statsQuery);

      res.json({
        success: true,
        data: stats[0] || {
          total: 0,
          draft: 0,
          sent: 0,
          paid: 0,
          overdue: 0,
          totalRevenue: 0
        }
      });

    } catch (error) {
      console.error('Error in getInvoiceStats:', error);
      res.status(500).json({
        success: false,
        error: 'Server error',
        details: error.message
      });
    }
  }

  // Create a new invoice - minimal required fields
  async createInvoice(req, res) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const {
        repairRequestId,
        customerId,
        vendorId,
        invoiceType = 'sale',
        totalAmount,
        status = 'draft',
        currency = 'EGP',
        taxAmount = 0,
        shippingAmount = 0,
        discountAmount = 0,
        discountPercent = 0,
        amountPaid = 0
      } = req.body;

      // Validation is done by Joi middleware, but keeping basic checks for safety
      if (invoiceType === 'purchase') {
        // التحقق من وجود المورد
        const [vendor] = await connection.execute(
          'SELECT id FROM Vendor WHERE id = ? AND deletedAt IS NULL',
          [vendorId]
        );
        if (vendor.length === 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            error: 'المورد غير موجود'
          });
        }
      }

      // التحقق من وجود العميل إذا تم تحديده
      let finalCustomerId = customerId;
      if (!finalCustomerId && repairRequestId) {
        const [repair] = await connection.execute(
          'SELECT customerId FROM RepairRequest WHERE id = ?',
          [repairRequestId]
        );
        if (repair.length > 0) {
          finalCustomerId = repair[0].customerId;
        }
      } else if (customerId) {
        const [customer] = await connection.execute(
          'SELECT id FROM Customer WHERE id = ? AND deletedAt IS NULL',
          [customerId]
        );
        if (customer.length === 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            error: 'العميل غير موجود'
          });
        }
      }

      // Calculate discountAmount from discountPercent if provided
      let finalDiscountAmount = discountAmount;
      if (discountPercent > 0 && totalAmount > 0 && discountAmount === 0) {
        finalDiscountAmount = (totalAmount * discountPercent) / 100;
      }

      // محاولة إدراج shippingAmount و discountAmount إذا كانا موجودين في قاعدة البيانات
      let result;
      try {
        // محاولة مع shippingAmount و discountAmount و discountPercent
        [result] = await connection.execute(
          `INSERT INTO Invoice (repairRequestId, customerId, vendorId, invoiceType, totalAmount, amountPaid, status, currency, taxAmount, shippingAmount, discountAmount, discountPercent)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [repairRequestId || null, finalCustomerId || null, vendorId || null, invoiceType, totalAmount, amountPaid, status, currency, taxAmount, shippingAmount, finalDiscountAmount, discountPercent]
        );
      } catch (error) {
        // إذا فشل بسبب عدم وجود العمود، نستخدم الاستعلام بدون الأعمدة المفقودة
        if (error.message && (error.message.includes('shippingAmount') || error.message.includes('discountAmount') || error.message.includes('discountPercent'))) {
          try {
            // محاولة مع shippingAmount و discountAmount فقط
            [result] = await connection.execute(
              `INSERT INTO Invoice (repairRequestId, customerId, vendorId, invoiceType, totalAmount, amountPaid, status, currency, taxAmount, shippingAmount, discountAmount)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [repairRequestId || null, finalCustomerId || null, vendorId || null, invoiceType, totalAmount, amountPaid, status, currency, taxAmount, shippingAmount, finalDiscountAmount]
            );
          } catch (error2) {
            if (error2.message && error2.message.includes('shippingAmount')) {
              // محاولة مع discountAmount فقط
              try {
                [result] = await connection.execute(
                  `INSERT INTO Invoice (repairRequestId, customerId, vendorId, invoiceType, totalAmount, amountPaid, status, currency, taxAmount, discountAmount)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [repairRequestId || null, finalCustomerId || null, vendorId || null, invoiceType, totalAmount, amountPaid, status, currency, taxAmount, finalDiscountAmount]
                );
              } catch (error3) {
                // بدون discountAmount أيضاً
                [result] = await connection.execute(
                  `INSERT INTO Invoice (repairRequestId, customerId, vendorId, invoiceType, totalAmount, amountPaid, status, currency, taxAmount)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [repairRequestId || null, finalCustomerId || null, vendorId || null, invoiceType, totalAmount, amountPaid, status, currency, taxAmount]
                );
              }
            } else {
              throw error2;
            }
          }
        } else {
          throw error;
        }
      }

      await connection.commit();

      // Send notification
      websocketService.broadcastToAll({
        type: 'invoice_created',
        invoiceId: result.insertId,
        message: 'تم إنشاء فاتورة جديدة',
        timestamp: new Date().toISOString()
      });

      return res.status(201).json({ success: true, id: result.insertId });
    } catch (error) {
      await connection.rollback();
      console.error('Error in createInvoice:', error);
      return res.status(500).json({ success: false, error: 'Server error', details: error.message });
    } finally {
      connection.release();
    }
  }

  async getInvoiceById(req, res) {
    try {
      const { id } = req.params;

      const [rows] = await db.execute(`
        SELECT 
          i.*,
          COALESCE(c_direct.name, c_via_repair.name) as customerName,
          COALESCE(c_direct.phone, c_via_repair.phone) as customerPhone,
          COALESCE(c_direct.email, c_via_repair.email) as customerEmail
        FROM Invoice i
        LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
        LEFT JOIN Customer c_direct ON i.customerId = c_direct.id
        LEFT JOIN Customer c_via_repair ON rr.customerId = c_via_repair.id
        WHERE i.id = ? AND i.deletedAt IS NULL
      `, [id]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      const invoice = rows[0];

      // 🔧 Fix: Recalculate totalAmount from InvoiceItems to ensure accuracy
      // This ensures that the total includes all items (parts and services) even if totalAmount in Invoice table is outdated
      const [itemsTotal] = await db.execute(`
        SELECT COALESCE(SUM(totalPrice), 0) as calculatedTotal
        FROM InvoiceItem 
        WHERE invoiceId = ?
      `, [id]);
      
      const calculatedTotalAmount = Number(itemsTotal[0]?.calculatedTotal || 0);
      
      // Update invoice totalAmount if it's different from calculated (to keep it in sync)
      if (Math.abs(calculatedTotalAmount - parseFloat(invoice.totalAmount || 0)) > 0.01) {
        console.log('💰 Recalculating invoice totalAmount:', {
          invoiceId: id,
          oldTotal: invoice.totalAmount,
          newTotal: calculatedTotalAmount
        });
        await db.execute(`
          UPDATE Invoice SET totalAmount = ?, updatedAt = NOW() WHERE id = ?
        `, [calculatedTotalAmount, id]);
      }

      // Calculate actual amountPaid from payments
      const [payments] = await db.execute(`
        SELECT COALESCE(SUM(amount), 0) as totalPaid 
        FROM Payment 
        WHERE invoiceId = ?
      `, [id]);

      const actualAmountPaid = parseFloat(payments[0].totalPaid || 0);
      // Use calculated totalAmount instead of stored one
      const totalAmount = calculatedTotalAmount;

      // Determine correct status based on actual payments
      let correctStatus = invoice.status;
      if (actualAmountPaid >= totalAmount && totalAmount > 0) {
        correctStatus = 'paid';
      } else if (actualAmountPaid > 0) {
        correctStatus = 'partially_paid';
      } else {
        correctStatus = 'draft';
      }

      return res.json({
        success: true,
        data: {
          ...invoice,
          totalAmount: totalAmount, // Use calculated totalAmount
          amountPaid: actualAmountPaid,
          status: correctStatus
        }
      });
    } catch (error) {
      console.error('Error in getInvoiceById:', error);
      return res.status(500).json({
        success: false,
        error: 'Server error',
        details: error.message
      });
    }
  }

  async updateInvoice(req, res) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const { id } = req.params;
      const { totalAmount, amountPaid, status, currency, taxAmount, shippingAmount, discountAmount, discountPercent, notes } = req.body;

      // Check if invoice exists
      const [existing] = await connection.execute(`
        SELECT id FROM Invoice WHERE id = ? AND deletedAt IS NULL
      `, [id]);

      if (existing.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }

      // Build update query dynamically
      const updates = [];
      const params = [];

      if (totalAmount !== undefined) {
        updates.push('totalAmount = ?');
        params.push(totalAmount);
      }
      if (amountPaid !== undefined) {
        updates.push('amountPaid = ?');
        params.push(amountPaid);
      }
      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
      }
      if (currency !== undefined) {
        updates.push('currency = ?');
        params.push(currency);
      }
      if (taxAmount !== undefined) {
        updates.push('taxAmount = ?');
        params.push(taxAmount);
      }
      if (shippingAmount !== undefined) {
        updates.push('shippingAmount = ?');
        params.push(shippingAmount);
      }
      // Handle discount: if discountPercent is provided, calculate discountAmount from totalAmount
      // If discountAmount is provided directly, use it
      let finalDiscountAmount = discountAmount;
      if (discountPercent !== undefined) {
        // Check if discountPercent column exists before trying to update it
        try {
          const [colCheck] = await connection.execute(`
            SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'Invoice' 
            AND COLUMN_NAME = 'discountPercent'
          `);
          if (colCheck[0].count > 0) {
            updates.push('discountPercent = ?');
            params.push(discountPercent);
          }
        } catch (colError) {
          // Column doesn't exist, skip it
          console.log('discountPercent column does not exist, skipping');
        }
        
        // Calculate discountAmount from discountPercent
        // If totalAmount is being updated, use the new value; otherwise get current value
        if (totalAmount !== undefined && totalAmount > 0) {
          // Use the new totalAmount being set
          finalDiscountAmount = (totalAmount * discountPercent) / 100;
        } else if (discountAmount === undefined) {
          // If totalAmount is not being updated, get current totalAmount to calculate discount
          const [currentInvoice] = await connection.execute(
            'SELECT totalAmount FROM Invoice WHERE id = ?',
            [id]
          );
          if (currentInvoice.length > 0 && currentInvoice[0].totalAmount > 0) {
            finalDiscountAmount = (currentInvoice[0].totalAmount * discountPercent) / 100;
          } else {
            finalDiscountAmount = 0;
          }
        }
        // If discountAmount was also provided, it takes precedence
      }
      
      // Update discountAmount if we have a value (either provided directly or calculated from discountPercent)
      if (discountAmount !== undefined || finalDiscountAmount !== undefined) {
        updates.push('discountAmount = ?');
        params.push(finalDiscountAmount !== undefined ? finalDiscountAmount : discountAmount);
      }
      if (notes !== undefined) {
        updates.push('notes = ?');
        params.push(notes);
      }

      updates.push('updatedAt = NOW()');
      params.push(id);

      const query = `UPDATE Invoice SET ${updates.join(', ')} WHERE id = ?`;
      await connection.execute(query, params);

      await connection.commit();

      // Send notification
      websocketService.broadcastToAll({
        type: 'invoice_updated',
        invoiceId: id,
        message: 'تم تحديث الفاتورة بنجاح',
        timestamp: new Date().toISOString()
      });

      res.json({ success: true, message: 'Invoice updated successfully' });
    } catch (error) {
      await connection.rollback();
      console.error('Error updating invoice:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    } finally {
      connection.release();
    }
  }

  async deleteInvoice(req, res) {
    try {
      const { id } = req.params;
      console.log('Attempting to delete invoice:', id);

      // Check if invoice exists
      const [existing] = await db.execute(`
        SELECT id FROM Invoice WHERE id = ? AND deletedAt IS NULL
      `, [id]);

      console.log('Existing invoice check result:', existing);

      if (existing.length === 0) {
        console.log('Invoice not found or already deleted');
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }

      // Soft delete
      console.log('Soft deleting invoice:', id);
      await db.execute(`
        UPDATE Invoice SET deletedAt = NOW(), updatedAt = NOW() WHERE id = ?
      `, [id]);
      console.log('Invoice deleted successfully');

      // Send notification
      websocketService.broadcastToAll({
        type: 'invoice_deleted',
        invoiceId: id,
        message: 'تم حذف الفاتورة بنجاح',
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Invoice deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  async getInvoiceItems(req, res) {
    try {
      const { id } = req.params;
      console.log('🔍 getInvoiceItems (Simple) called for invoice ID:', id);
      
      // Get invoice items with JOIN to InventoryItem and Service for full details
      // Only include columns that definitely exist in the database
      const [items] = await db.execute(`
        SELECT 
          ii.id,
          ii.invoiceId,
          ii.inventoryItemId,
          ii.serviceId,
          ii.quantity,
          ii.unitPrice,
          ii.totalPrice,
          ii.description,
          ii.itemType,
          ii.createdAt,
          ii.updatedAt,
          -- Inventory Item details (for parts) - only confirmed columns
          inv.id as partId,
          inv.name as partName,
          inv.sku as partSku,
          inv.serialNumber as partSerialNumber,
          inv.type as partType,
          -- Service details (for services)
          s.id as serviceId_full,
          s.name as serviceName,
          s.description as serviceDescription,
          -- Service notes from RepairRequestService
          rrs.notes as serviceNotes
        FROM InvoiceItem ii
        LEFT JOIN InventoryItem inv ON ii.inventoryItemId = inv.id AND ii.itemType = 'part'
        LEFT JOIN Service s ON ii.serviceId = s.id AND ii.itemType = 'service'
        LEFT JOIN Invoice i ON ii.invoiceId = i.id
        LEFT JOIN RepairRequestService rrs ON (
          (rrs.serviceId = ii.serviceId AND rrs.repairRequestId = i.repairRequestId)
          OR (rrs.serviceId IS NULL AND ii.serviceId IS NULL AND rrs.repairRequestId = i.repairRequestId AND rrs.notes IS NOT NULL)
        )
        WHERE ii.invoiceId = ?
        ORDER BY ii.createdAt ASC
      `, [id]);
      
      console.log('✅ Found', items.length, 'invoice items for invoice', id);
      res.json({ success: true, data: items });
    } catch (error) {
      console.error('❌ Error fetching invoice items:', error);
      console.error('Error stack:', error.stack);
      console.error('Error code:', error.code);
      console.error('Error SQL state:', error.sqlState);
      res.status(500).json({ 
        success: false, 
        error: 'Server error', 
        details: error.message,
        errorCode: error.code,
        sqlState: error.sqlState
      });
    }
  }

  async addInvoiceItem(req, res) {
    try {
      const { id } = req.params;
      const { description, quantity, unitPrice, itemType, serviceId, inventoryItemId } = req.body;

      console.log('addInvoiceItem called with:', {
        invoiceId: id,
        description,
        quantity,
        unitPrice,
        itemType,
        serviceId,
        inventoryItemId
      });

      // Handle undefined parameters by setting them to null
      const safeDescription = description || null;
      const safeQuantity = quantity || 1;
      const safeUnitPrice = unitPrice || 0;
      const safeItemType = itemType || null;
      const safeServiceId = serviceId || null;
      const safeInventoryItemId = inventoryItemId || null;

      console.log('Safe parameters:', {
        invoiceId: id,
        description: safeDescription,
        quantity: safeQuantity,
        unitPrice: safeUnitPrice,
        itemType: safeItemType,
        serviceId: safeServiceId,
        inventoryItemId: safeInventoryItemId
      });

      // Check for duplicates - prevent adding the same service or inventory item twice
      if (safeServiceId) {
        const [existingService] = await db.execute(`
          SELECT id FROM InvoiceItem WHERE invoiceId = ? AND serviceId = ?
        `, [id, safeServiceId]);

        if (existingService.length > 0) {
          console.log('Service already exists in invoice:', safeServiceId);
          return res.status(409).json({
            success: false,
            error: 'Service already exists in this invoice',
            duplicate: true
          });
        }
      }

      if (safeInventoryItemId) {
        const [existingItem] = await db.execute(`
          SELECT id FROM InvoiceItem WHERE invoiceId = ? AND inventoryItemId = ?
        `, [id, safeInventoryItemId]);

        if (existingItem.length > 0) {
          console.log('Inventory item already exists in invoice:', safeInventoryItemId);
          return res.status(409).json({
            success: false,
            error: 'Inventory item already exists in this invoice',
            duplicate: true
          });
        }
      }

      const [result] = await db.execute(`
        INSERT INTO InvoiceItem (invoiceId, description, quantity, unitPrice, totalPrice, itemType, serviceId, inventoryItemId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [id, safeDescription, safeQuantity, safeUnitPrice, safeQuantity * safeUnitPrice, safeItemType, safeServiceId, safeInventoryItemId]);

      // Recalculate and update invoice total
      const [totalResult] = await db.execute(`
        SELECT COALESCE(SUM(quantity * unitPrice), 0) as calculatedTotal
        FROM InvoiceItem WHERE invoiceId = ?
      `, [id]);

      const newTotal = Number(totalResult[0].calculatedTotal);

      await db.execute(`
        UPDATE Invoice SET totalAmount = ?, updatedAt = NOW() WHERE id = ?
      `, [newTotal, id]);

      console.log('Updated invoice total to:', newTotal);

      res.json({ success: true, data: { id: result.insertId, newTotal } });
    } catch (error) {
      console.error('Error adding invoice item:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  async updateInvoiceItem(req, res) {
    try {
      const { id, itemId } = req.params;
      const { description, quantity, unitPrice, itemType, serviceId, inventoryItemId } = req.body;

      const updates = [];
      const params = [];

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
      if (itemType !== undefined) {
        updates.push('itemType = ?');
        params.push(itemType);
      }
      if (serviceId !== undefined) {
        updates.push('serviceId = ?');
        params.push(serviceId);
      }
      if (inventoryItemId !== undefined) {
        updates.push('inventoryItemId = ?');
        params.push(inventoryItemId);
      }

      if (quantity !== undefined || unitPrice !== undefined) {
        const finalQuantity = quantity !== undefined ? quantity : 1;
        const finalUnitPrice = unitPrice !== undefined ? unitPrice : 0;
        updates.push('totalPrice = ?');
        params.push(finalQuantity * finalUnitPrice);
      }

      updates.push('updatedAt = NOW()');
      params.push(itemId);

      const query = `UPDATE InvoiceItem SET ${updates.join(', ')} WHERE id = ? AND invoiceId = ?`;
      params.push(id);

      await db.execute(query, params);

      // Recalculate and update invoice total
      const [totalResult] = await db.execute(`
        SELECT COALESCE(SUM(quantity * unitPrice), 0) as calculatedTotal
        FROM InvoiceItem WHERE invoiceId = ?
      `, [id]);

      const newTotal = Number(totalResult[0].calculatedTotal);

      await db.execute(`
        UPDATE Invoice SET totalAmount = ?, updatedAt = NOW() WHERE id = ?
      `, [newTotal, id]);

      console.log('Updated invoice total to:', newTotal);

      res.json({ success: true, message: 'Invoice item updated successfully', newTotal });
    } catch (error) {
      console.error('Error updating invoice item:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  async removeInvoiceItem(req, res) {
    try {
      const { id, itemId } = req.params;

      // Check if deletedAt column exists
      const [columnCheck] = await db.execute(`
        SELECT COUNT(*) as exists 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'InvoiceItem' 
        AND COLUMN_NAME = 'deletedAt'
      `);

      const hasSoftDelete = columnCheck[0].exists > 0;

      if (hasSoftDelete) {
        // Use soft delete
        await db.execute(`
          UPDATE InvoiceItem 
          SET deletedAt = NOW(), updatedAt = NOW() 
          WHERE id = ? AND invoiceId = ?
        `, [itemId, id]);
      } else {
        // Use hard delete (fallback for old schema)
        await db.execute(`
          DELETE FROM InvoiceItem WHERE id = ? AND invoiceId = ?
        `, [itemId, id]);
      }

      // Recalculate and update invoice total (exclude soft-deleted items)
      const totalQuery = hasSoftDelete
        ? `SELECT COALESCE(SUM(quantity * unitPrice), 0) as calculatedTotal
           FROM InvoiceItem 
           WHERE invoiceId = ? AND (deletedAt IS NULL OR deletedAt IS NULL)`
        : `SELECT COALESCE(SUM(quantity * unitPrice), 0) as calculatedTotal
           FROM InvoiceItem 
           WHERE invoiceId = ?`;

      const [totalResult] = await db.execute(totalQuery, [id]);
      const newTotal = Number(totalResult[0].calculatedTotal);

      await db.execute(`
        UPDATE Invoice SET totalAmount = ?, updatedAt = NOW() WHERE id = ?
      `, [newTotal, id]);

      console.log('Updated invoice total to:', newTotal);

      res.json({ success: true, message: 'Invoice item removed successfully', newTotal });
    } catch (error) {
      console.error('Error removing invoice item:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Get invoice by repair request ID
  async getInvoiceByRepairId(req, res) {
    try {
      const { repairId } = req.params;

      const [invoices] = await db.execute(`
        SELECT 
          i.*,
          c.name as customerName,
          c.phone as customerPhone,
          c.email as customerEmail,
          rr.deviceModel as deviceModel,
          rr.deviceBrand as deviceBrand,
          rr.reportedProblem as problemDescription
        FROM Invoice i
        LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
        LEFT JOIN Customer c ON rr.customerId = c.id
        WHERE rr.id = ? AND i.deletedAt IS NULL
      `, [repairId]);

      if (invoices.length === 0) {
        return res.status(404).json({ success: false, error: 'No invoice found for this repair request' });
      }

      const invoice = invoices[0];

      // Get invoice items
      const [items] = await db.execute(`
        SELECT 
          ii.*,
          COALESCE(inv.name, s.name, 'Unknown Item') as itemName,
          COALESCE(inv.sku, s.id, NULL) as itemCode
        FROM InvoiceItem ii
        LEFT JOIN InventoryItem inv ON ii.inventoryItemId = inv.id
        LEFT JOIN Service s ON ii.serviceId = s.id
        WHERE ii.invoiceId = ?
        ORDER BY ii.createdAt
      `, [invoice.id]);

      res.json({
        success: true,
        data: {
          ...invoice,
          items,
          itemsCount: items.length,
          calculatedTotal: items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
        }
      });
    } catch (error) {
      console.error('Error fetching invoice by repair ID:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Create invoice from repair request
  async createInvoiceFromRepair(req, res) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const { repairId } = req.params;
      const {
        status = 'draft',
        currency = 'EGP',
        taxAmount = 0,
        shippingAmount = 0,
        discountAmount = 0,
        discountPercent = 0
      } = req.body;

      // Extract fields that don't exist in Invoice table
      const { notes, ...otherFields } = req.body;

      // Check if repair request exists
      const [repairRows] = await connection.execute(`
        SELECT rr.*, c.name as customerName, rr.deviceModel as deviceModel, rr.deviceBrand as deviceBrand
        FROM RepairRequest rr
        LEFT JOIN Customer c ON rr.customerId = c.id
        WHERE rr.id = ? AND rr.deletedAt IS NULL
      `, [repairId]);

      if (repairRows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ success: false, error: 'Repair request not found' });
      }

      // Check if invoice already exists for this repair
      const [existingInvoice] = await connection.execute(`
        SELECT id FROM Invoice WHERE repairRequestId = ? AND deletedAt IS NULL
      `, [repairId]);

      if (existingInvoice.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(409).json({
          success: false,
          error: 'Invoice already exists for this repair request',
          data: { invoiceId: existingInvoice[0].id }
        });
      }

      // Calculate discountAmount from discountPercent if provided
      let finalDiscountAmount = discountAmount;
      if (discountPercent > 0 && discountAmount === 0) {
        // Will be calculated after totalAmount is known
        finalDiscountAmount = 0; // Will be recalculated after items are added
      }

      // Create invoice - try with all fields, fallback if columns don't exist
      let result;
      try {
        [result] = await connection.execute(`
          INSERT INTO Invoice (
            repairRequestId, totalAmount, amountPaid, status, 
            currency, taxAmount, shippingAmount, discountAmount, discountPercent, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          repairId,
          0, // Will be calculated after adding items
          0,
          status,
          currency,
          taxAmount,
          shippingAmount,
          finalDiscountAmount,
          discountPercent
        ]);
      } catch (error) {
        // Fallback if columns don't exist
        if (error.message && (error.message.includes('shippingAmount') || error.message.includes('discountAmount') || error.message.includes('discountPercent'))) {
          try {
            [result] = await connection.execute(`
              INSERT INTO Invoice (
                repairRequestId, totalAmount, amountPaid, status, 
                currency, taxAmount, shippingAmount, discountAmount, createdAt, updatedAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [
              repairId,
              0,
              0,
              status,
              currency,
              taxAmount,
              shippingAmount,
              finalDiscountAmount
            ]);
          } catch (error2) {
            if (error2.message && error2.message.includes('shippingAmount')) {
              [result] = await connection.execute(`
                INSERT INTO Invoice (
                  repairRequestId, totalAmount, amountPaid, status, 
                  currency, taxAmount, discountAmount, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
              `, [
                repairId,
                0,
                0,
                status,
                currency,
                taxAmount,
                finalDiscountAmount
              ]);
            } else {
              [result] = await connection.execute(`
                INSERT INTO Invoice (
                  repairRequestId, totalAmount, amountPaid, status, 
                  currency, taxAmount, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
              `, [
                repairId,
                0,
                0,
                status,
                currency,
                taxAmount
              ]);
            }
          }
        } else {
          throw error;
        }
      }

      const invoiceId = result.insertId;

      // Add parts used in repair
      const [partsUsed] = await connection.execute(`
        SELECT pu.*, ii.name, ii.sellingPrice
        FROM PartsUsed pu
        LEFT JOIN InventoryItem ii ON pu.inventoryItemId = ii.id
        WHERE pu.repairRequestId = ?
      `, [repairId]);

      for (const part of partsUsed) {
        const unitPrice = part.sellingPrice || 0;
        const quantity = part.quantity || 1;
        const totalPrice = quantity * unitPrice;

        await connection.execute(`
          INSERT INTO InvoiceItem (
            invoiceId, inventoryItemId, quantity, unitPrice, totalPrice, itemType, description
          ) VALUES (?, ?, ?, ?, ?, 'part', ?)
        `, [invoiceId, part.inventoryItemId, quantity, unitPrice, totalPrice, `قطعة غيار: ${part.name || 'غير محدد'}`]);
      }

      // Add services used in repair
      const [services] = await connection.execute(`
        SELECT rrs.*, s.name, s.basePrice
        FROM RepairRequestService rrs
        LEFT JOIN Service s ON rrs.serviceId = s.id
        WHERE rrs.repairRequestId = ?
      `, [repairId]);

      for (const service of services) {
        const unitPrice = service.price || service.basePrice || 0;
        await connection.execute(`
          INSERT INTO InvoiceItem (
            invoiceId, serviceId, quantity, unitPrice, totalPrice, itemType, description
          ) VALUES (?, ?, ?, ?, ?, 'service', ?)
        `, [invoiceId, service.serviceId, 1, unitPrice, unitPrice, `خدمة: ${service.name || 'غير محدد'}`]);
      }

      // Calculate and update total amount
      const [totalResult] = await connection.execute(`
        SELECT COALESCE(SUM(quantity * unitPrice), 0) as calculatedTotal
        FROM InvoiceItem WHERE invoiceId = ?
      `, [invoiceId]);

      const subtotal = Number(totalResult[0].calculatedTotal);
      
      // Calculate discountAmount from discountPercent if needed
      let calculatedDiscountAmount = finalDiscountAmount;
      if (discountPercent > 0 && subtotal > 0) {
        calculatedDiscountAmount = (subtotal * discountPercent) / 100;
      }
      
      // Calculate final total: subtotal - discount + tax + shipping
      const finalTotal = subtotal - calculatedDiscountAmount + Number(taxAmount) + Number(shippingAmount);

      // Update invoice with calculated values
      try {
        await connection.execute(`
          UPDATE Invoice SET 
            totalAmount = ?, 
            discountAmount = ?,
            discountPercent = ?,
            updatedAt = NOW() 
          WHERE id = ?
        `, [finalTotal, calculatedDiscountAmount, discountPercent, invoiceId]);
      } catch (updateError) {
        // Fallback if discountPercent column doesn't exist
        if (updateError.message && updateError.message.includes('discountPercent')) {
          await connection.execute(`
            UPDATE Invoice SET 
              totalAmount = ?, 
              discountAmount = ?,
              updatedAt = NOW() 
            WHERE id = ?
          `, [finalTotal, calculatedDiscountAmount, invoiceId]);
        } else {
          throw updateError;
        }
      }

      await connection.commit();

      // Fetch the created invoice with details
      const [createdInvoice] = await connection.execute(`
        SELECT i.*, 
          c.name as customerName,
          c.phone as customerPhone,
          c.email as customerEmail,
          rr.deviceModel as deviceModel,
          rr.deviceBrand as deviceBrand
        FROM Invoice i
        LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
        LEFT JOIN Customer c ON rr.customerId = c.id
        WHERE i.id = ?
      `, [invoiceId]);

      res.status(201).json({
        success: true,
        data: createdInvoice[0],
        message: 'Invoice created successfully from repair request'
      });
    } catch (error) {
      await connection.rollback();
      console.error('Error creating invoice from repair:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    } finally {
      connection.release();
    }
  }
}

module.exports = new InvoicesControllerSimple();
