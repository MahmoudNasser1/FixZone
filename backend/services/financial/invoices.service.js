// Invoices Service
// Business logic for Invoices

const invoicesRepository = require('../../repositories/financial/invoices.repository');
const paymentsRepository = require('../../repositories/financial/payments.repository');
const auditLogService = require('../auditLog.service');
const websocketService = require('../websocketService');
const db = require('../../db');

class InvoicesService {
  /**
   * Get all invoices
   */
  async getAll(filters = {}, pagination = {}, user = null) {
    try {
      const result = await invoicesRepository.findAll(filters, pagination);
      return result;
    } catch (error) {
      console.error('Error in invoicesService.getAll:', error);
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  async getById(id, user = null) {
    try {
      const invoice = await invoicesRepository.findById(id);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Get invoice items (check if deletedAt column exists)
      let items;
      const [columnCheck] = await db.query(`
        SELECT COUNT(*) as exists 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'InvoiceItem' 
        AND COLUMN_NAME = 'deletedAt'
      `);
      
      if (columnCheck[0].exists > 0) {
        // Use soft delete
        [items] = await db.query(
          `SELECT * FROM InvoiceItem 
           WHERE invoiceId = ? 
           AND (deletedAt IS NULL OR deletedAt = '')
           ORDER BY createdAt ASC`,
          [id]
        );
      } else {
        // No soft delete column
        [items] = await db.query(
          `SELECT * FROM InvoiceItem 
           WHERE invoiceId = ? 
           ORDER BY createdAt ASC`,
          [id]
        );
      }

      // Get payments
      const payments = await paymentsRepository.findByInvoice(id);

      return {
        ...invoice,
        items,
        payments
      };
    } catch (error) {
      console.error('Error in invoicesService.getById:', error);
      throw error;
    }
  }

  /**
   * Create new invoice
   */
  async create(data, user) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Generate invoice number
      const invoiceNumber = await invoicesRepository.generateInvoiceNumber();

      // Calculate totals - use taxRate from data if provided, otherwise default to 14%
      const taxRate = data.taxRate ? parseFloat(data.taxRate) / 100 : 0.14;
      const totals = this.calculateTotals(data.items || [], taxRate);

      // Create invoice
      const invoice = await invoicesRepository.create({
        invoiceNumber,
        customerId: data.customerId || null,
        companyId: data.companyId || null,
        branchId: data.branchId || null,
        repairRequestId: data.repairRequestId || null,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discountAmount: data.discountAmount || 0,
        totalAmount: Math.max(0, totals.totalAmount - (data.discountAmount || 0)), // Ensure non-negative
        currency: data.currency || 'EGP',
        status: 'draft',
        issueDate: data.issueDate || new Date().toISOString().split('T')[0],
        dueDate: data.dueDate || null,
        notes: data.notes || null,
        createdBy: user.id
      });

      // Create invoice items
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          await connection.query(
            `INSERT INTO InvoiceItem 
             (invoiceId, description, quantity, unitPrice, totalPrice, inventoryItemId, serviceId, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              invoice.id,
              item.description,
              item.quantity,
              item.unitPrice,
              item.quantity * item.unitPrice,
              item.inventoryItemId || null,
              item.serviceId || null
            ]
          );
        }
      }

      await connection.commit();

      // Log audit
      if (auditLogService) {
        await auditLogService.log({
          action: 'invoice_created',
          entityType: 'Invoice',
          entityId: invoice.id,
          userId: user.id,
          changes: invoice
        });
      }

      // Emit WebSocket event
      if (websocketService) {
        websocketService.broadcastToAll({
          type: 'invoice_created',
          invoiceId: invoice.id,
          message: 'تم إنشاء فاتورة جديدة',
          timestamp: new Date().toISOString()
        });
      }

      return invoice;
    } catch (error) {
      await connection.rollback();
      console.error('Error in invoicesService.create:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Create invoice from repair request
   */
  async createFromRepair(repairId, data, user) {
    try {
      // Get repair request
      const [repairs] = await db.query(
        `SELECT * FROM RepairRequest WHERE id = ? AND deletedAt IS NULL`,
        [repairId]
      );

      if (repairs.length === 0) {
        throw new Error('Repair request not found');
      }

      const repair = repairs[0];

      // Get customer to extract companyId and branchId
      let companyId = data.companyId || null;
      let branchId = data.branchId || null;

      if (repair.customerId) {
        const [customers] = await db.query(
          `SELECT companyId, branchId FROM Customer WHERE id = ?`,
          [repair.customerId]
        );
        if (customers.length > 0) {
          companyId = companyId || customers[0].companyId || null;
          branchId = branchId || customers[0].branchId || null;
        }
      }

      // Generate items from repair
      const items = await this.generateItemsFromRepair(repair);

      // Create invoice
      const invoice = await this.create({
        ...data,
        repairRequestId: repairId,
        customerId: repair.customerId,
        companyId: companyId,
        branchId: branchId,
        items
      }, user);

      // Update repair status to 'invoiced' if it's completed
      await db.query(
        `UPDATE RepairRequest 
         SET status = CASE 
           WHEN status = 'completed' THEN 'invoiced'
           ELSE status
         END,
         updatedAt = NOW() 
         WHERE id = ?`,
        [repairId]
      );

      // Emit WebSocket event for repair status update
      if (websocketService) {
        websocketService.broadcastToAll({
          type: 'repair_invoiced',
          repairId: repairId,
          invoiceId: invoice.id,
          message: 'تم إنشاء فاتورة لطلب الإصلاح',
          timestamp: new Date().toISOString()
        });
      }

      return invoice;
    } catch (error) {
      console.error('Error in invoicesService.createFromRepair:', error);
      throw error;
    }
  }

  /**
   * Calculate totals from items
   */
  calculateTotals(items, taxRate = 0.14) {
    const subtotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0));
    }, 0);

    const taxAmount = subtotal * taxRate; // Default 14% VAT, but can be customized
    const totalAmount = subtotal + taxAmount;

    return {
      subtotal,
      taxAmount,
      totalAmount
    };
  }

  /**
   * Generate items from repair request
   */
  async generateItemsFromRepair(repair) {
    const items = [];
    const repairId = repair.id;

    try {
      // Get services from RepairRequestService
      const [services] = await db.query(
        `SELECT 
          rrs.*,
          s.name as serviceName,
          s.price as servicePrice
        FROM RepairRequestService rrs
        LEFT JOIN Service s ON rrs.serviceId = s.id
        WHERE rrs.repairRequestId = ?
        AND (rrs.deletedAt IS NULL OR rrs.deletedAt = '')
        AND rrs.status = 'completed'
        ORDER BY rrs.createdAt ASC`,
        [repairId]
      );

      // Add services to invoice items
      for (const service of services) {
        const price = parseFloat(service.finalPrice || service.price || service.servicePrice || 0);
        if (price > 0) {
          items.push({
            description: service.serviceName || service.description || 'خدمة إصلاح',
            quantity: 1,
            unitPrice: price,
            serviceId: service.serviceId || null
          });
        }
      }

      // Get parts from PartsUsed (if table exists)
      try {
        const [parts] = await db.query(
          `SELECT 
            pu.*,
            ii.name as inventoryItemName,
            ii.sellingPrice as inventoryItemPrice
          FROM PartsUsed pu
          LEFT JOIN InventoryItem ii ON pu.inventoryItemId = ii.id
          WHERE pu.repairRequestId = ?
          AND (pu.deletedAt IS NULL OR pu.deletedAt = '')
          AND pu.status = 'used'
          ORDER BY pu.createdAt ASC`,
          [repairId]
        );

        // Add parts to invoice items
        for (const part of parts) {
          const price = parseFloat(part.unitSellingPrice || part.totalPrice / part.quantity || part.inventoryItemPrice || 0);
          const quantity = parseFloat(part.quantity || 1);
          if (price > 0 && quantity > 0) {
            items.push({
              description: part.inventoryItemName || part.description || 'قطعة غيار',
              quantity: quantity,
              unitPrice: price,
              inventoryItemId: part.inventoryItemId || null
            });
          }
        }
      } catch (partsError) {
        // PartsUsed table might not exist, skip silently
        console.log('PartsUsed table not found or error:', partsError.message);
      }

      // Add labor cost if any
      if (repair.laborCost && parseFloat(repair.laborCost) > 0) {
        items.push({
          description: 'تكلفة العمالة',
          quantity: 1,
          unitPrice: parseFloat(repair.laborCost)
        });
      }

    } catch (error) {
      console.error('Error generating items from repair:', error);
      // Return empty items array if there's an error
    }

    return items;
  }

  /**
   * Get invoice statistics
   */
  async getStats(filters = {}, user = null) {
    try {
      const stats = await invoicesRepository.getStats(filters);
      return stats;
    } catch (error) {
      console.error('Error in invoicesService.getStats:', error);
      throw error;
    }
  }

  /**
   * Get overdue invoices
   */
  async getOverdue(user = null) {
    try {
      const invoices = await invoicesRepository.getOverdue();
      return invoices;
    } catch (error) {
      console.error('Error in invoicesService.getOverdue:', error);
      throw error;
    }
  }
}

module.exports = new InvoicesService();


