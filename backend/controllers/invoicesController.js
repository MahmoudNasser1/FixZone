const db = require('../db');
const { validationResult } = require('express-validator');

/**
 * Invoice Controller - Comprehensive invoice management
 * Supports: CRUD operations, bulk actions, search, filtering, pagination
 */
class InvoicesController {
  
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
        whereClause += ` AND (c.name LIKE ? OR i.id LIKE ? OR d.model LIKE ?)`;
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
          d.model as deviceModel,
          d.brand as deviceBrand,
          rr.reportedProblem as problemDescription,
          COUNT(ii.id) as itemsCount,
          COALESCE(SUM(ii.quantity * ii.unitPrice), 0) as calculatedTotal
        FROM Invoice i
        LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
        LEFT JOIN Device d ON rr.deviceId = d.id
        LEFT JOIN Customer c ON rr.customerId = c.id
        LEFT JOIN InvoiceItem ii ON i.id = ii.invoiceId
        ${whereClause}
        GROUP BY i.id
        ORDER BY ${sortField === 'customerName' ? 'c.name' : `i.${sortField}`} ${order}
        LIMIT ? OFFSET ?
      `;

      queryParams.push(parseInt(limit), parseInt(offset));

      const [invoices] = await db.query(query, queryParams);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(DISTINCT i.id) as total
        FROM Invoice i
        LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
        LEFT JOIN Customer c ON rr.customerId = c.id
        LEFT JOIN Device d ON rr.deviceId = d.id
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
          invoices,
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
          d.model as deviceModel,
          d.brand as deviceBrand,
          rr.reportedProblem as problemDescription,
          d.serialNumber as deviceSerial,
          u.name as technicianName
        FROM Invoice i
        LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
        LEFT JOIN Device d ON rr.deviceId = d.id
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
            WHEN ii.partsUsedId IS NOT NULL THEN 'part'
            WHEN ii.serviceId IS NOT NULL THEN 'service'
            ELSE 'other'
          END as itemType,
          COALESCE(inv.name, s.name, 'Unknown Item') as itemName,
          COALESCE(inv.sku, s.id, NULL) as itemCode
        FROM InvoiceItem ii
        LEFT JOIN PartsUsed pu ON ii.partsUsedId = pu.id
        LEFT JOIN InventoryItem inv ON COALESCE(ii.inventoryItemId, pu.inventoryItemId) = inv.id
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
          repairRequestId,
          totalAmount,
          amountPaid,
          status,
          currency,
          taxAmount,
          discountAmount,
          dueDate
        ]);

        const invoiceId = result.insertId;

        // If linked to repair request, auto-add parts and services
        if (repairRequestId) {
          // Add parts used
          const [partsUsed] = await connection.query(`
            SELECT pu.*, ii.name, ii.sellingPrice
            FROM PartsUsed pu
            LEFT JOIN InventoryItem ii ON pu.inventoryItemId = ii.id
            WHERE pu.repairRequestId = ? AND pu.invoiceItemId IS NULL
          `, [repairRequestId]);

          for (const part of partsUsed) {
            const [itemResult] = await connection.query(`
              INSERT INTO InvoiceItem (
                invoiceId, inventoryItemId, quantity, unitPrice, totalPrice
              ) VALUES (?, ?, ?, ?, ?)
            `, [
              invoiceId,
              part.inventoryItemId,
              part.quantity,
              part.sellingPrice || 0,
              (part.quantity || 1) * (part.sellingPrice || 0)
            ]);

            // Update PartsUsed to link to invoice item
            await connection.query(`
              UPDATE PartsUsed SET invoiceItemId = ? WHERE id = ?
            `, [itemResult.insertId, part.id]);
          }
        }

        // Calculate totals for accounting entry
        let computedTotal = Number(totalAmount) || 0;
        // Prefer calculated sum of items if present
        const [sumRows] = await connection.query(`
          SELECT COALESCE(SUM(quantity * unitPrice), 0) as itemsTotal
          FROM InvoiceItem WHERE invoiceId = ?
        `, [invoiceId]);
        const itemsTotal = Number(sumRows[0]?.itemsTotal || 0);
        if (itemsTotal > 0) {
          computedTotal = itemsTotal;
          // Sync invoice totalAmount with items sum
          await connection.query(`UPDATE Invoice SET totalAmount = ?, updatedAt = NOW() WHERE id = ?`, [computedTotal, invoiceId]);
        }
        const tax = Number(taxAmount) || 0;
        const discount = Number(discountAmount) || 0;
        const subtotal = Math.max(0, computedTotal - tax + discount);
        const total = computedTotal;

        // إنشاء قيد محاسبي للفاتورة
        const entryNumber = `INV-${new Date().getFullYear()}-${String(invoiceId).padStart(6, '0')}`;
        const [journalResult] = await connection.query(`
          INSERT INTO JournalEntry (entryNumber, entryDate, description, reference, totalDebit, totalCredit, status, createdBy)
          VALUES (?, CURDATE(), ?, ?, ?, ?, 'draft', ?)
        `, [entryNumber, `فاتورة رقم ${invoiceId}`, `INV-${invoiceId}`, total, total, req.user?.id || 1]);

        const journalEntryId = journalResult.insertId;

        // سطر مدين - العملاء
        await connection.query(`
          INSERT INTO JournalEntryLine (journalEntryId, lineNumber, accountId, description, debitAmount, creditAmount)
          VALUES (?, 1, 3, ?, ?, 0.00)
        `, [journalEntryId, `فاتورة عميل رقم ${invoiceId}`, total]);

        // سطر دائن - الإيرادات
        await connection.query(`
          INSERT INTO JournalEntryLine (journalEntryId, lineNumber, accountId, description, debitAmount, creditAmount)
          VALUES (?, 2, 35, ?, 0.00, ?)
        `, [journalEntryId, `إيراد فاتورة رقم ${invoiceId}`, subtotal]);

        // سطر دائن - الضرائب (إذا وجدت)
        if (taxAmount > 0) {
          await connection.query(`
            INSERT INTO JournalEntryLine (journalEntryId, lineNumber, accountId, description, debitAmount, creditAmount)
            VALUES (?, 3, 24, ?, 0.00, ?)
          `, [journalEntryId, `ضريبة فاتورة رقم ${invoiceId}`, taxAmount]);
        }

        // ربط الفاتورة بالقيد المحاسبي
        await connection.query(`
          UPDATE Invoice SET journalEntryId = ? WHERE id = ?
        `, [journalEntryId, invoiceId]);

        await connection.commit();

        res.status(201).json({
          success: true,
          data: { invoiceId, journalEntryId, message: 'Invoice created successfully with accounting entry' }
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

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
        values.push(currency);
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

      // Add updatedAt
      updates.push('updatedAt = NOW()');
      values.push(id);

      const [result] = await db.query(`
        UPDATE Invoice SET ${updates.join(', ')} WHERE id = ? AND deletedAt IS NULL
      `, values);

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Invoice not found or no changes made' });
      }

      res.json({ success: true, message: 'Invoice updated successfully' });

    } catch (error) {
      console.error('Error updating invoice:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // Bulk operations on invoices
  async bulkOperations(req, res) {
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
      const [existing] = await db.query(`
        SELECT id FROM Invoice WHERE id = ? AND deletedAt IS NULL
      `, [id]);

      if (existing.length === 0) {
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }

      // Soft delete
      await db.query(`
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
          c.name as customerName,
          COUNT(i.id) as invoiceCount,
          SUM(i.totalAmount) as totalAmount
        FROM Invoice i
        LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
        LEFT JOIN Customer c ON rr.customerId = c.id
        WHERE i.deletedAt IS NULL
          AND i.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY c.id, c.name
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
          c.name as customerName,
          c.phone as customerPhone,
          c.email as customerEmail,
          c.address as customerAddress
        FROM Invoice i
        LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
        LEFT JOIN Device d ON rr.deviceId = d.id
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

  // Add invoice item (part or service) and recalculate total
  async addInvoiceItem(req, res) {
    try {
      const { id } = req.params; // invoiceId
      let { inventoryItemId = null, serviceId = null, quantity = 1, unitPrice = null, partsUsedId = null, description = null } = req.body || {};

      // Validate invoice exists
      const [invRows] = await db.query(`SELECT id FROM Invoice WHERE id = ? AND deletedAt IS NULL`, [id]);
      if (invRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }

      // Validate payload
      if (!inventoryItemId && !serviceId) {
        return res.status(400).json({ success: false, error: 'Either inventoryItemId or serviceId is required' });
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
        `INSERT INTO InvoiceItem (invoiceId, inventoryItemId, serviceId, quantity, unitPrice, totalPrice, partsUsedId, description, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [id, inventoryItemId, serviceId, quantity, unitPrice, totalPrice, partsUsedId, description]
      );

      const itemId = result.insertId;

      // If partsUsedId provided, link PartsUsed to this invoice item
      if (partsUsedId) {
        await db.query(`UPDATE PartsUsed SET invoiceItemId = ? WHERE id = ?`, [itemId, partsUsedId]);
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

  // Remove invoice item and recalculate total
  async removeInvoiceItem(req, res) {
    try {
      const { id, itemId } = req.params; // invoiceId, itemId

      // Validate invoice exists
      const [invRows] = await db.query(`SELECT id FROM Invoice WHERE id = ? AND deletedAt IS NULL`, [id]);
      if (invRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }

      // Clear link from PartsUsed if linked
      await db.query(`UPDATE PartsUsed SET invoiceItemId = NULL WHERE invoiceItemId = ?`, [itemId]);

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
}

module.exports = new InvoicesController();
