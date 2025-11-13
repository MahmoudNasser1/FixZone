const db = require('../db');
const { validationResult } = require('express-validator');

/**
 * Invoice Controller - Comprehensive invoice management
 * Supports: CRUD operations, bulk actions, search, filtering, pagination
 */
class InvoicesController {
  
  // Get new invoice page data
  async getNewInvoicePage(req, res) {
    try {
      // Return empty invoice data for new invoice creation
      res.json({
        success: true,
        data: {
          id: null,
          totalAmount: 0,
          amountPaid: 0,
          status: 'draft',
          currency: 'EGP',
          taxAmount: 0,
          discountAmount: 0,
          notes: '',
          dueDate: null,
          items: [],
          payments: []
        }
      });
    } catch (error) {
      console.error('Error in getNewInvoicePage:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load new invoice page'
      });
    }
  }
  
  // Get all invoices with advanced filtering and pagination
  async getAllInvoices(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        dateFrom = '',
        dateTo = '',
        customerId = '',
        repairRequestId = '',
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE i.deletedAt IS NULL';
      const queryParams = [];

      // Search functionality
      if (search) {
        whereClause += ` AND (c.name LIKE ? OR i.id LIKE ? OR rr.deviceModel LIKE ?)`;
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      // Status filter
      if (status) {
        whereClause += ` AND i.status = ?`;
        queryParams.push(status);
      }

      // Customer filter
      if (customerId) {
        whereClause += ` AND c.id = ?`;
        queryParams.push(customerId);
      }

      // Repair Request filter
      if (repairRequestId) {
        whereClause += ` AND rr.id = ?`;
        queryParams.push(repairRequestId);
      }

      // Date range filter
      if (dateFrom) {
        whereClause += ` AND DATE(i.createdAt) >= ?`;
        queryParams.push(dateFrom);
      }
      if (dateTo) {
        whereClause += ` AND DATE(i.createdAt) <= ?`;
        queryParams.push(dateTo);
      }

      // Validate sort parameters
      const allowedSortFields = ['createdAt', 'totalAmount', 'status', 'customerName'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Main query with joins
      const query = `
        SELECT 
          i.*,
          c.name as customerName,
          c.phone as customerPhone,
          c.email as customerEmail,
          rr.deviceModel as deviceModel,
          rr.deviceBrand as deviceBrand,
          rr.reportedProblem as problemDescription,
          COUNT(ii.id) as itemsCount,
          COALESCE(SUM(ii.quantity * ii.unitPrice), 0) as calculatedTotal
        FROM Invoice i
        LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
        LEFT JOIN Customer c ON rr.customerId = c.id
        LEFT JOIN InvoiceItem ii ON i.id = ii.invoiceId
        ${whereClause}
        GROUP BY i.id
        ORDER BY ${sortField === 'customerName' ? 'c.name' : `i.${sortField}`} ${order}
        LIMIT ? OFFSET ?
      `;

      queryParams.push(parseInt(limit), parseInt(offset));

      const [invoices] = await db.query(query, queryParams);

      // Calculate actual amountPaid for each invoice from payments
      const invoicesWithCorrectAmounts = await Promise.all(
        invoices.map(async (invoice) => {
          const [payments] = await db.query(`
            SELECT COALESCE(SUM(amount), 0) as totalPaid 
            FROM Payment 
            WHERE invoiceId = ?
          `, [invoice.id]);
          
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
          
          return {
            ...invoice,
            amountPaid: actualAmountPaid,
            status: correctStatus
          };
        })
      );

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(DISTINCT i.id) as total
        FROM Invoice i
        LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
        LEFT JOIN Customer c ON rr.customerId = c.id
        ${whereClause}
      `;
      
      const [countResult] = await db.query(countQuery, queryParams.slice(0, -2));
      const totalCount = countResult[0].total;

      // Get summary statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
          SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue,
          SUM(totalAmount) as totalRevenue,
          SUM(amountPaid) as totalPaid,
          SUM(totalAmount - amountPaid) as totalOutstanding
        FROM Invoice 
        WHERE deletedAt IS NULL
      `;
      
      const [stats] = await db.query(statsQuery);

      res.json({
        success: true,
        data: {
          invoices: invoicesWithCorrectAmounts,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: parseInt(limit)
          },
          stats: stats[0]
        }
      });
    } catch (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Get single invoice with full details
  async getInvoiceById(req, res) {
    try {
      const { id } = req.params;

      // Get invoice with customer and repair details
      const [invoiceRows] = await db.query(`
        SELECT 
          i.*,
          c.name as customerName,
          c.phone as customerPhone,
          c.email as customerEmail,
          c.address as customerAddress,
          rr.deviceModel as deviceModel,
          rr.deviceBrand as deviceBrand,
          rr.reportedProblem as problemDescription,
          d.serialNumber as deviceSerial,
          u.name as technicianName
        FROM Invoice i
        LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
        LEFT JOIN Customer c ON rr.customerId = c.id
        LEFT JOIN User u ON rr.technicianId = u.id
        WHERE i.id = ? AND i.deletedAt IS NULL
      `, [id]);

      if (invoiceRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }

      const invoice = invoiceRows[0];

      // Get invoice items (parts and services)
      const [items] = await db.query(`
        SELECT 
          ii.*,
          (ii.quantity * ii.unitPrice) as totalPrice,
          CASE 
            WHEN ii.inventoryItemId IS NOT NULL THEN 'part'
            WHEN ii.serviceId IS NOT NULL THEN 'service'
            ELSE 'other'
          END as itemType,
          COALESCE(inv.name, s.name, 'Unknown Item') as itemName,
          COALESCE(inv.sku, CONCAT('SVC-', s.id), NULL) as itemCode
        FROM InvoiceItem ii
        LEFT JOIN InventoryItem inv ON ii.inventoryItemId = inv.id
        LEFT JOIN Service s ON ii.serviceId = s.id
        WHERE ii.invoiceId = ?
        ORDER BY ii.createdAt
      `, [id]);

      // Get payment history
      const [payments] = await db.query(`
        SELECT p.*, u.name as createdByName
        FROM Payment p
        LEFT JOIN User u ON p.userId = u.id
        WHERE p.invoiceId = ?
        ORDER BY p.createdAt DESC
      `, [id]);

      // Calculate actual amount paid from payments
      const actualAmountPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
      
      // Determine correct status based on actual payments
      let correctStatus = invoice.status;
      if (actualAmountPaid >= parseFloat(invoice.totalAmount || 0)) {
        correctStatus = 'paid';
      } else if (actualAmountPaid > 0) {
        correctStatus = 'partially_paid';
      } else {
        correctStatus = 'draft';
      }

      res.json({
        success: true,
        data: {
          ...invoice,
          amountPaid: actualAmountPaid, // Use calculated amount instead of table value
          status: correctStatus, // Use calculated status
          items,
          payments,
          itemsCount: items.length,
          calculatedTotal: items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
        }
      });
    } catch (error) {
      console.error('Error fetching invoice:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Create new invoice
  async createInvoice(req, res) {
    try {
      const {
        repairRequestId,
        totalAmount = 0,
        amountPaid = 0,
        status = 'draft',
        currency = 'EGP',
        taxAmount = 0,
        discountAmount = 0,
        notes = '',
        dueDate = null
      } = req.body;

      // Validate required fields
      if (!repairRequestId || repairRequestId === '' || repairRequestId === null) {
        return res.status(400).json({
          success: false,
          error: 'repairRequestId is required and cannot be empty'
        });
      }

      // Guard: prevent duplicate invoice for the same repair request
      try {
        if (repairRequestId) {
          const [existingForRR] = await db.query(
            `SELECT id FROM Invoice WHERE repairRequestId = ? AND deletedAt IS NULL`,
            [repairRequestId]
          );
          if (existingForRR.length > 0) {
            return res.status(409).json({
              success: false,
              error: 'Invoice already exists for this repair request',
              data: { invoiceId: existingForRR[0].id }
            });
          }
        }
      } catch (err) {
        // If this guard query fails, proceed to main try/catch to surface as server error
      }

      // Create invoice without transaction for now
      const invoiceCurrency = currency || 'EGP';
      const [result] = await db.query(`
        INSERT INTO Invoice (
          repairRequestId, totalAmount, amountPaid, status, 
          currency, taxAmount, discountAmount, dueDate, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        repairRequestId,
        totalAmount,
        amountPaid,
        status,
        invoiceCurrency,
        taxAmount,
        discountAmount,
        dueDate
      ]);

      const invoiceId = result.insertId;

      // If linked to repair request, auto-add parts and services
      if (repairRequestId) {
        // Add parts used
        const [partsUsed] = await db.query(`
          SELECT pu.*, ii.name, ii.sellingPrice
          FROM PartsUsed pu
          LEFT JOIN InventoryItem ii ON pu.inventoryItemId = ii.id
          WHERE pu.repairRequestId = ? AND pu.invoiceItemId IS NULL
        `, [repairRequestId]);

        for (const part of partsUsed) {
          const [itemResult] = await db.query(`
            INSERT INTO InvoiceItem (
              invoiceId, inventoryItemId, quantity, unitPrice, totalPrice, itemType
            ) VALUES (?, ?, ?, ?, ?, 'part')
          `, [
            invoiceId,
            part.inventoryItemId,
            part.quantity,
            part.sellingPrice || 0,
            (part.quantity || 1) * (part.sellingPrice || 0)
          ]);

          // Update PartsUsed to link to invoice item
          await db.query(`
            UPDATE PartsUsed SET invoiceItemId = ? WHERE id = ?
          `, [itemResult.insertId, part.id]);
        }

        // Add services
        const [services] = await db.query(`
          SELECT rrs.*, s.name, s.basePrice
          FROM RepairRequestService rrs
          LEFT JOIN Service s ON rrs.serviceId = s.id
          WHERE rrs.repairRequestId = ?
        `, [repairRequestId]);

        for (const service of services) {
          await db.query(`
            INSERT INTO InvoiceItem (
              invoiceId, serviceId, quantity, unitPrice, totalPrice, itemType
            ) VALUES (?, ?, ?, ?, ?, 'service')
          `, [
            invoiceId,
            service.serviceId,
            1,
            service.price || service.basePrice || 0,
            service.price || service.basePrice || 0
          ]);
        }
      }

      // Fetch the created invoice with details
      const [createdInvoice] = await db.query(`
        SELECT i.*, 
          CONCAT(c.firstName, ' ', c.lastName) as customerName,
          c.phone as customerPhone,
          c.email as customerEmail
        FROM Invoice i
        LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
        LEFT JOIN Customer c ON rr.customerId = c.id
        WHERE i.id = ?
      `, [invoiceId]);

      res.status(201).json({
        success: true,
        data: createdInvoice[0],
        message: 'Invoice created successfully'
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Update invoice
  async updateInvoice(req, res) {
    try {
      const { id } = req.params;
      const {
        totalAmount,
        amountPaid,
        status,
        currency,
        taxAmount,
        discountAmount,
        notes,
        dueDate
      } = req.body;
      
      const invoiceCurrency = currency || 'EGP';

      // Check if invoice exists
      const [existing] = await db.query(`
        SELECT id FROM Invoice WHERE id = ? AND deletedAt IS NULL
      `, [id]);

      if (existing.length === 0) {
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }

      // Build update query dynamically
      const updates = [];
      const values = [];

      if (totalAmount !== undefined) {
        updates.push('totalAmount = ?');
        values.push(totalAmount);
      }
      if (amountPaid !== undefined) {
        updates.push('amountPaid = ?');
        values.push(amountPaid);
      }
      if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);
      }
      if (currency !== undefined) {
        updates.push('currency = ?');
        values.push(invoiceCurrency);
      }
      if (taxAmount !== undefined) {
        updates.push('taxAmount = ?');
        values.push(taxAmount);
      }
      if (discountAmount !== undefined) {
        updates.push('discountAmount = ?');
        values.push(discountAmount);
      }
      if (notes !== undefined) {
        updates.push('notes = ?');
        values.push(notes);
      }
      if (dueDate !== undefined) {
        updates.push('dueDate = ?');
        values.push(dueDate);
      }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, error: 'No fields to update' });
      }

      updates.push('updatedAt = NOW()');
      values.push(id);

      await db.query(`
        UPDATE Invoice SET ${updates.join(', ')} WHERE id = ?
      `, values);

      // Fetch updated invoice
      const [updated] = await db.query(`
        SELECT i.*, 
          CONCAT(c.firstName, ' ', c.lastName) as customerName,
          c.phone as customerPhone,
          c.email as customerEmail,
          c.address as customerAddress
        FROM Invoice i
        LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
        LEFT JOIN Customer c ON rr.customerId = c.id
        WHERE i.id = ?
      `, [id]);

      res.json({
        success: true,
        data: updated[0],
        message: 'Invoice updated successfully'
      });
    } catch (error) {
      console.error('Error updating invoice:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Bulk actions for invoices
  async bulkAction(req, res) {
    try {
      const { action, invoiceIds, data = {} } = req.body;

      if (!action || !invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        return res.status(400).json({ success: false, error: 'Action and invoice IDs are required' });
      }

      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        let result;
        const placeholders = invoiceIds.map(() => '?').join(',');

        switch (action) {
          case 'delete':
            [result] = await connection.query(`
              UPDATE Invoice SET deletedAt = NOW() 
              WHERE id IN (${placeholders}) AND deletedAt IS NULL
            `, invoiceIds);
            break;

          case 'updateStatus':
            if (!data.status) {
              throw new Error('Status is required for status update');
            }
            [result] = await connection.query(`
              UPDATE Invoice SET status = ?, updatedAt = NOW() 
              WHERE id IN (${placeholders}) AND deletedAt IS NULL
            `, [data.status, ...invoiceIds]);
            break;

          case 'markPaid':
            [result] = await connection.query(`
              UPDATE Invoice SET 
                status = 'paid', 
                amountPaid = totalAmount, 
                updatedAt = NOW() 
              WHERE id IN (${placeholders}) AND deletedAt IS NULL
            `, invoiceIds);
            break;

          case 'send':
            [result] = await connection.query(`
              UPDATE Invoice SET status = 'sent', updatedAt = NOW() 
              WHERE id IN (${placeholders}) AND deletedAt IS NULL AND status = 'draft'
            `, invoiceIds);
            break;

          default:
            throw new Error('Invalid bulk action');
        }

        await connection.commit();

        res.json({
          success: true,
          message: `Bulk ${action} completed successfully`,
          affectedRows: result.affectedRows
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Soft delete invoice
  async deleteInvoice(req, res) {
    try {
      const { id } = req.params;

      // Check if invoice exists
      const [existing] = await db.execute(`
        SELECT id FROM Invoice WHERE id = ? AND deletedAt IS NULL
      `, [id]);

      if (existing.length === 0) {
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }

      // Soft delete
      await db.execute(`
        UPDATE Invoice SET deletedAt = NOW(), updatedAt = NOW() WHERE id = ?
      `, [id]);

      res.json({
        success: true,
        message: 'Invoice deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Get invoice statistics
  async getStatistics(req, res) {
    try {
      const { period = '30' } = req.query;
      const days = parseInt(period);

      // Get basic stats
      const [basicStats] = await db.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
          SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue,
          SUM(totalAmount) as totalRevenue,
          SUM(amountPaid) as totalPaid,
          SUM(totalAmount - amountPaid) as totalOutstanding
        FROM Invoice 
        WHERE deletedAt IS NULL
          AND createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `, [days]);

      // Get monthly trends
      const [monthlyTrends] = await db.query(`
        SELECT 
          DATE_FORMAT(createdAt, '%Y-%m') as month,
          COUNT(*) as count,
          SUM(totalAmount) as revenue,
          SUM(amountPaid) as paid
        FROM Invoice 
        WHERE deletedAt IS NULL
          AND createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
        ORDER BY month DESC
        LIMIT 12
      `);

      // Get top customers by invoice count
      const [topCustomers] = await db.query(`
        SELECT 
          CONCAT(c.firstName, ' ', c.lastName) as customerName,
          COUNT(i.id) as invoiceCount,
          SUM(i.totalAmount) as totalAmount
        FROM Invoice i
        LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
        LEFT JOIN Customer c ON rr.customerId = c.id
        WHERE i.deletedAt IS NULL
          AND i.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY c.id, c.firstName, c.lastName
        ORDER BY invoiceCount DESC
        LIMIT 10
      `, [days]);

      res.json({
        success: true,
        data: {
          summary: basicStats[0],
          monthlyTrends,
          topCustomers,
          period: days
        }
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Generate PDF for invoice
  async generatePDF(req, res) {
    try {
      const { id } = req.params;

      // Get invoice with full details
      const [invoice] = await db.query(`
        SELECT i.*, 
          rr.id as repairRequestId,
          d.deviceType,
          d.brand as deviceBrand,
          d.model as deviceModel,
          CONCAT(c.firstName, ' ', c.lastName) as customerName,
          c.phone as customerPhone,
          c.email as customerEmail,
          c.address as customerAddress
        FROM Invoice i
        LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
        LEFT JOIN Customer c ON rr.customerId = c.id
        WHERE i.id = ? AND i.deletedAt IS NULL
      `, [id]);

      if (invoice.length === 0) {
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }

      // Get invoice items
      const [items] = await db.query(`
        SELECT ii.*, 
          COALESCE(inv.name, s.name) as itemName,
          COALESCE(inv.sku, s.id) as itemCode
        FROM InvoiceItem ii
        LEFT JOIN InventoryItem inv ON ii.inventoryItemId = inv.id
        LEFT JOIN Service s ON ii.serviceId = s.id
        WHERE ii.invoiceId = ?
        ORDER BY ii.createdAt
      `, [id]);

      // For now, return JSON data that can be used to generate PDF on frontend
      // In a real implementation, you would use a PDF library like puppeteer or jsPDF
      res.json({
        success: true,
        data: {
          invoice: invoice[0],
          items,
          generatedAt: new Date().toISOString()
        },
        message: 'PDF data generated successfully'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Get invoice items
  async getInvoiceItems(req, res) {
    try {
      const { id } = req.params;

      // Validate invoice exists
      const [invoice] = await db.query(`
        SELECT id FROM Invoice WHERE id = ? AND deletedAt IS NULL
      `, [id]);

      if (invoice.length === 0) {
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }

      // Get invoice items
      const [items] = await db.query(`
        SELECT 
          ii.*,
          ii.description as itemDescription,
          ii.quantity,
          ii.unitPrice,
          ii.totalPrice,
          ii.itemType as type,
          ii.currency,
          ii.createdAt,
          ii.updatedAt
        FROM InvoiceItem ii
        WHERE ii.invoiceId = ? AND ii.deletedAt IS NULL
        ORDER BY ii.createdAt ASC
      `, [id]);

      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error('Error in getInvoiceItems:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Add invoice item (part or service) and recalculate total
  async addInvoiceItem(req, res) {
    try {
      const { id } = req.params; // invoiceId
      let { inventoryItemId = null, serviceId = null, quantity = 1, unitPrice = null, description = null, partsUsedId = null } = req.body || {};

      // Validate invoice exists
      const [invRows] = await db.query(`SELECT id FROM Invoice WHERE id = ? AND deletedAt IS NULL`, [id]);
      if (invRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }

      // Validate payload
      if (!inventoryItemId && !serviceId) {
        return res.status(400).json({ success: false, error: 'Either inventoryItemId or serviceId is required' });
      }

      // Check for duplicates
      if (inventoryItemId) {
        const [existingPart] = await db.query(
          `SELECT id FROM InvoiceItem WHERE invoiceId = ? AND inventoryItemId = ?`,
          [id, inventoryItemId]
        );
        if (existingPart.length > 0) {
          return res.status(409).json({ success: false, error: 'هذه القطعة مضافة مسبقاً للفاتورة' });
        }
      }

      if (serviceId) {
        const [existingService] = await db.query(
          `SELECT id FROM InvoiceItem WHERE invoiceId = ? AND serviceId = ?`,
          [id, serviceId]
        );
        if (existingService.length > 0) {
          return res.status(409).json({ success: false, error: 'هذه الخدمة مضافة مسبقاً للفاتورة' });
        }
      }

      quantity = Number(quantity) || 1;

      // If unitPrice not provided, fetch default from item/service
      if (unitPrice == null) {
        if (inventoryItemId) {
          const [rows] = await db.query(`SELECT sellingPrice FROM InventoryItem WHERE id = ?`, [inventoryItemId]);
          unitPrice = rows.length ? (rows[0].sellingPrice || 0) : 0;
        } else if (serviceId) {
          const [rows] = await db.query(`SELECT basePrice FROM Service WHERE id = ?`, [serviceId]);
          unitPrice = rows.length ? (rows[0].basePrice || 0) : 0;
        }
      }

      const totalPrice = Number(quantity) * Number(unitPrice || 0);

      // Insert invoice item
      const [result] = await db.query(
        `INSERT INTO InvoiceItem (invoiceId, inventoryItemId, serviceId, quantity, unitPrice, totalPrice, description, itemType, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [id, inventoryItemId, serviceId, quantity, unitPrice, totalPrice, description, inventoryItemId ? 'part' : 'service']
      );

      const itemId = result.insertId;

      // Update RepairRequestService to link with invoice item if serviceId provided
      if (serviceId) {
        await db.query(
          `UPDATE RepairRequestService SET invoiceItemId = ? WHERE serviceId = ? AND repairRequestId = (
            SELECT repairRequestId FROM Invoice WHERE id = ?
          )`,
          [itemId, serviceId, id]
        );
      }

      // Update PartsUsed to link with invoice item if partsUsedId provided
      if (partsUsedId) {
        await db.query(
          `UPDATE PartsUsed SET invoiceItemId = ? WHERE id = ?`,
          [itemId, partsUsedId]
        );
      }

      // Recalculate invoice totalAmount as sum of items
      await db.query(
        `UPDATE Invoice i 
         SET i.totalAmount = (
           SELECT COALESCE(SUM(ii.quantity * ii.unitPrice), 0)
           FROM InvoiceItem ii WHERE ii.invoiceId = i.id
         ), i.updatedAt = NOW()
         WHERE i.id = ?`,
        [id]
      );

      // Return created item
      const [createdRows] = await db.query(`SELECT * FROM InvoiceItem WHERE id = ?`, [itemId]);
      return res.status(201).json({ success: true, data: createdRows[0], message: 'Invoice item added' });
    } catch (error) {
      console.error('Error adding invoice item:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Update invoice item and recalculate total
  async updateInvoiceItem(req, res) {
    try {
      const { id, itemId } = req.params; // invoiceId, itemId
      const { quantity, unitPrice, description } = req.body;

      // Validate invoice exists
      const [invRows] = await db.query(`SELECT id FROM Invoice WHERE id = ? AND deletedAt IS NULL`, [id]);
      if (invRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }

      // Check if item exists
      const [itemRows] = await db.query(`SELECT * FROM InvoiceItem WHERE id = ? AND invoiceId = ?`, [itemId, id]);
      if (itemRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Invoice item not found' });
      }

      // Build update query dynamically
      const updates = [];
      const values = [];

      if (quantity !== undefined) {
        updates.push('quantity = ?');
        values.push(Number(quantity) || 0);
      }
      if (unitPrice !== undefined) {
        updates.push('unitPrice = ?');
        values.push(Number(unitPrice) || 0);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
      }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, error: 'No fields to update' });
      }

      // Calculate new total price if quantity or unitPrice changed
      if (quantity !== undefined || unitPrice !== undefined) {
        const currentItem = itemRows[0];
        const newQuantity = quantity !== undefined ? Number(quantity) : Number(currentItem.quantity);
        const newUnitPrice = unitPrice !== undefined ? Number(unitPrice) : Number(currentItem.unitPrice);
        const newTotalPrice = newQuantity * newUnitPrice;
        
        updates.push('totalPrice = ?');
        values.push(newTotalPrice);
      }

      updates.push('updatedAt = NOW()');
      values.push(itemId);

      // Update invoice item
      await db.query(`UPDATE InvoiceItem SET ${updates.join(', ')} WHERE id = ?`, values);

      // Recalculate invoice totalAmount
      await db.query(
        `UPDATE Invoice i 
         SET i.totalAmount = (
           SELECT COALESCE(SUM(ii.quantity * ii.unitPrice), 0)
           FROM InvoiceItem ii WHERE ii.invoiceId = i.id
         ), i.updatedAt = NOW()
         WHERE i.id = ?`,
        [id]
      );

      // Return updated item
      const [updatedRows] = await db.query(`SELECT * FROM InvoiceItem WHERE id = ?`, [itemId]);
      return res.json({ success: true, data: updatedRows[0], message: 'Invoice item updated' });
    } catch (error) {
      console.error('Error updating invoice item:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Remove invoice item and recalculate total
  async removeInvoiceItem(req, res) {
    try {
      const { id, itemId } = req.params; // invoiceId, itemId

      // Validate invoice exists
      const [invRows] = await db.query(`SELECT id FROM Invoice WHERE id = ? AND deletedAt IS NULL`, [id]);
      if (invRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }

      // Note: No need to clear PartsUsed links as we're not using partsUsedId field anymore
      

      // Delete invoice item
      const [delRes] = await db.query(`DELETE FROM InvoiceItem WHERE id = ? AND invoiceId = ?`, [itemId, id]);
      if (delRes.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Invoice item not found' });
      }

      // Recalculate invoice totalAmount
      await db.query(
        `UPDATE Invoice i 
         SET i.totalAmount = (
           SELECT COALESCE(SUM(ii.quantity * ii.unitPrice), 0)
           FROM InvoiceItem ii WHERE ii.invoiceId = i.id
         ), i.updatedAt = NOW()
         WHERE i.id = ?`,
        [id]
      );

      return res.json({ success: true, message: 'Invoice item removed' });
    } catch (error) {
      console.error('Error removing invoice item:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Get invoice by repair request ID
  async getInvoiceByRepairId(req, res) {
    try {
      const { repairId } = req.params;

      const [invoices] = await db.query(`
        SELECT 
          i.*,
          CONCAT(c.firstName, ' ', c.lastName) as customerName,
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
      const [items] = await db.query(`
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

      // Get payment history
      const [payments] = await db.query(`
        SELECT p.*, u.name as createdByName
        FROM Payment p
        LEFT JOIN User u ON p.userId = u.id
        WHERE p.invoiceId = ?
        ORDER BY p.createdAt DESC
      `, [invoice.id]);

      res.json({
        success: true,
        data: {
          ...invoice,
          items,
          payments,
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
    try {
      const { repairId } = req.params;
      const {
        status = 'draft',
        currency = 'EGP',
        taxAmount = 0,
        discountAmount = 0,
        notes = '',
        dueDate = null
      } = req.body;

      // Check if repair request exists
      const [repairRows] = await db.query(`
        SELECT rr.*, CONCAT(c.firstName, ' ', c.lastName) as customerName, rr.deviceModel as deviceModel, rr.deviceBrand as deviceBrand
        FROM RepairRequest rr
        LEFT JOIN Customer c ON rr.customerId = c.id
        WHERE rr.id = ? AND rr.deletedAt IS NULL
      `, [repairId]);

      if (repairRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Repair request not found' });
      }

      // Check if invoice already exists for this repair
      const [existingInvoice] = await db.query(`
        SELECT id FROM Invoice WHERE repairRequestId = ? AND deletedAt IS NULL
      `, [repairId]);

      if (existingInvoice.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Invoice already exists for this repair request',
          data: { invoiceId: existingInvoice[0].id }
        });
      }

      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // Create invoice
        const [result] = await connection.query(`
          INSERT INTO Invoice (
            repairRequestId, totalAmount, amountPaid, status, 
            currency, taxAmount, discountAmount, dueDate, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          repairId,
          0, // Will be calculated after adding items
          0,
          status,
          currency,
          taxAmount,
          discountAmount,
          dueDate
        ]);

        const invoiceId = result.insertId;

        // Add parts used in repair
        const [partsUsed] = await connection.query(`
          SELECT pu.*, ii.name, ii.sellingPrice
          FROM PartsUsed pu
          LEFT JOIN InventoryItem ii ON pu.inventoryItemId = ii.id
          WHERE pu.repairRequestId = ?
        `, [repairId]);

        for (const part of partsUsed) {
          const unitPrice = part.sellingPrice || 0;
          const quantity = part.quantity || 1;
          const totalPrice = quantity * unitPrice;

          await connection.query(`
            INSERT INTO InvoiceItem (
              invoiceId, inventoryItemId, quantity, unitPrice, totalPrice, itemType, description
            ) VALUES (?, ?, ?, ?, ?, 'part', ?)
          `, [invoiceId, part.inventoryItemId, quantity, unitPrice, totalPrice, `قطعة غيار: ${part.name || 'غير محدد'}`]);
        }

        // Add services used in repair
        const [services] = await connection.query(`
          SELECT rrs.*, s.name, s.basePrice
          FROM RepairRequestService rrs
          LEFT JOIN Service s ON rrs.serviceId = s.id
          WHERE rrs.repairRequestId = ?
        `, [repairId]);

        for (const service of services) {
          const unitPrice = service.price || service.basePrice || 0;
          await connection.query(`
            INSERT INTO InvoiceItem (
              invoiceId, serviceId, quantity, unitPrice, totalPrice, itemType, description
            ) VALUES (?, ?, ?, ?, ?, 'service', ?)
          `, [invoiceId, service.serviceId, 1, unitPrice, unitPrice, `خدمة: ${service.name || 'غير محدد'}`]);
        }

        // Calculate and update total amount
        const [totalResult] = await connection.query(`
          SELECT COALESCE(SUM(quantity * unitPrice), 0) as calculatedTotal
          FROM InvoiceItem WHERE invoiceId = ?
        `, [invoiceId]);

        const finalTotal = Number(totalResult[0].calculatedTotal) + Number(taxAmount) - Number(discountAmount);

        await connection.query(`
          UPDATE Invoice SET totalAmount = ?, updatedAt = NOW() WHERE id = ?
        `, [finalTotal, invoiceId]);

        await connection.commit();

        // Fetch the created invoice with details
        const [createdInvoice] = await connection.query(`
          SELECT i.*, 
            CONCAT(c.firstName, ' ', c.lastName) as customerName,
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
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error creating invoice from repair:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }
}

module.exports = new InvoicesController();
