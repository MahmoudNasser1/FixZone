const db = require('../db');
const websocketService = require('../services/websocketService');

// Simplified Invoice Controller - Basic functionality only
class InvoicesControllerSimple {

  // Get all invoices with improved pagination and filters
  async getAllInvoices(req, res) {
    try {
      // DEBUG: Log request info
      console.log('🔍 [DEBUG] getAllInvoices called');
      console.log('🔍 [DEBUG] req.user:', req.user ? { id: req.user.id, role: req.user.role } : 'undefined');
      console.log('🔍 [DEBUG] req.query:', req.query);

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
          i.createdAt,
          COALESCE(c_direct.name, c_via_repair.name) as customerName,
          COALESCE(c_direct.phone, c_via_repair.phone) as customerPhone,
          COALESCE(c_direct.email, c_via_repair.email) as customerEmail,
          rr.deviceBrand,
          rr.deviceModel,
          rr.deviceType
        FROM Invoice i
        LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
        LEFT JOIN Customer c_direct ON i.customerId = c_direct.id
        LEFT JOIN Customer c_via_repair ON rr.customerId = c_via_repair.id
        ${whereClause}
        ORDER BY i.createdAt DESC
        LIMIT ? OFFSET ?
      `;

      // Ensure limit and offset are integers (safeguard against NaN)
      const finalLimit = Math.floor(Number(limitNum)) || 10;
      const finalOffset = Math.floor(Number(offset)) || 0;
      
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
      
      queryParams.push(finalLimit, finalOffset);
      
      // DEBUG: Log query params before execution
      console.log('🔍 [DEBUG] Query params:', queryParams.map((p, i) => `[${i}]: ${p} (${typeof p})`));

      const [invoices] = await db.execute(query, queryParams);

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

          return {
            id: invoice.id,
            repairId: invoice.repairRequestId,
            customerId: invoice.customerId,
            customerName: invoice.customerName || 'غير محدد',
            customerPhone: invoice.customerPhone || 'غير محدد',
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

      const [result] = await connection.execute(
        `INSERT INTO Invoice (repairRequestId, customerId, vendorId, invoiceType, totalAmount, amountPaid, status, currency, taxAmount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [repairRequestId || null, finalCustomerId || null, vendorId || null, invoiceType, totalAmount, amountPaid, status, currency, taxAmount]
      );

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

      // Calculate actual amountPaid from payments
      const [payments] = await db.execute(`
        SELECT COALESCE(SUM(amount), 0) as totalPaid 
        FROM Payment 
        WHERE invoiceId = ?
      `, [id]);

      const actualAmountPaid = parseFloat(payments[0].totalPaid || 0);
      const totalAmount = parseFloat(invoice.totalAmount || 0);

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
      const { totalAmount, amountPaid, status, currency, taxAmount, discountAmount, notes } = req.body;

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
      if (discountAmount !== undefined) {
        updates.push('discountAmount = ?');
        params.push(discountAmount);
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
      const [items] = await db.execute(`
        SELECT * FROM InvoiceItem WHERE invoiceId = ?
      `, [id]);
      res.json({ success: true, data: items });
    } catch (error) {
      console.error('Error fetching invoice items:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
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

      await db.execute(`
        DELETE FROM InvoiceItem WHERE id = ? AND invoiceId = ?
      `, [itemId, id]);

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
        taxAmount = 0
      } = req.body;

      // Extract fields that don't exist in Invoice table
      const { notes, discountAmount, ...otherFields } = req.body;

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

      // Create invoice
      const [result] = await connection.execute(`
        INSERT INTO Invoice (
          repairRequestId, totalAmount, amountPaid, status, 
          currency, taxAmount, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        repairId,
        0, // Will be calculated after adding items
        0,
        status,
        currency,
        taxAmount
      ]);

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

      const finalTotal = Number(totalResult[0].calculatedTotal) + Number(taxAmount);

      await connection.execute(`
        UPDATE Invoice SET totalAmount = ?, updatedAt = NOW() WHERE id = ?
      `, [finalTotal, invoiceId]);

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
