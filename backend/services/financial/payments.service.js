// Payments Service
// Business logic for Payments

const paymentsRepository = require('../../repositories/financial/payments.repository');
const invoicesRepository = require('../../repositories/financial/invoices.repository');
const auditLogService = require('../auditLog.service');
const websocketService = require('../websocketService');
const db = require('../../db');

class PaymentsService {
  /**
   * Get all payments
   */
  async getAll(filters = {}, pagination = {}, user = null) {
    try {
      const result = await paymentsRepository.findAll(filters, pagination);
      return result;
    } catch (error) {
      console.error('Error in paymentsService.getAll:', error);
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getById(id, user = null) {
    try {
      const payment = await paymentsRepository.findById(id);
      if (!payment) {
        throw new Error('Payment not found');
      }
      return payment;
    } catch (error) {
      console.error('Error in paymentsService.getById:', error);
      throw error;
    }
  }

  /**
   * Create new payment
   */
  async create(data, user) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Validate invoice exists
      const invoice = await invoicesRepository.findById(data.invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Validate amount
      const totalPaid = await paymentsRepository.getTotalPaid(data.invoiceId);
      const remainingAmount = invoice.totalAmount - totalPaid;

      if (data.amount > remainingAmount) {
        throw new Error(`Payment amount (${data.amount}) exceeds remaining balance (${remainingAmount})`);
      }

      if (data.amount <= 0) {
        throw new Error('Payment amount must be positive');
      }

      // Create payment
      const payment = await paymentsRepository.create({
        ...data,
        userId: user.id,
        paymentDate: data.paymentDate || new Date().toISOString().split('T')[0]
      });

      // Update invoice status
      const newTotalPaid = totalPaid + parseFloat(data.amount);
      let newStatus = invoice.status;

      if (newTotalPaid >= invoice.totalAmount) {
        newStatus = 'paid';
      } else if (newTotalPaid > 0) {
        newStatus = 'partially_paid';
      }

      // Update invoice
      await invoicesRepository.update(data.invoiceId, {
        amountPaid: newTotalPaid,
        status: newStatus
      });

      // If fully paid, deduct stock and update repair request status
      if (newStatus === 'paid') {
        // Deduct stock for invoice items with inventoryItemId
        const [invoiceItems] = await connection.query(
          `SELECT inventoryItemId, quantity 
           FROM InvoiceItem 
           WHERE invoiceId = ? 
           AND inventoryItemId IS NOT NULL
           AND (deletedAt IS NULL OR deletedAt = '')`,
          [data.invoiceId]
        );

        for (const item of invoiceItems) {
          if (item.inventoryItemId && item.quantity > 0) {
            // Check if StockLevel table exists and has data
            try {
              const [stockRows] = await connection.query(
                `SELECT quantity FROM StockLevel WHERE inventoryItemId = ?`,
                [item.inventoryItemId]
              );

              if (stockRows.length > 0) {
                const currentStock = stockRows[0].quantity;
                if (currentStock >= item.quantity) {
                  // Deduct stock
                  await connection.query(
                    `UPDATE StockLevel 
                     SET quantity = quantity - ? 
                     WHERE inventoryItemId = ?`,
                    [item.quantity, item.inventoryItemId]
                  );

                  // Create stock movement record
                  try {
                    await connection.query(
                      `INSERT INTO StockMovement 
                       (type, quantity, inventoryItemId, userId, reason, referenceType, referenceId, createdAt) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                      [
                        'out',
                        item.quantity,
                        item.inventoryItemId,
                        user.id,
                        `دفع فاتورة #${invoice.invoiceNumber || data.invoiceId}`,
                        'invoice',
                        data.invoiceId
                      ]
                    );
                  } catch (movementError) {
                    // StockMovement table might have different structure, log and continue
                    console.log('Could not create stock movement:', movementError.message);
                  }
                } else {
                  console.warn(
                    `Insufficient stock for item ${item.inventoryItemId}: ` +
                    `required ${item.quantity}, available ${currentStock}`
                  );
                }
              }
            } catch (stockError) {
              // StockLevel table might not exist, skip silently
              console.log('StockLevel table not found or error:', stockError.message);
            }
          }
        }

        // Update repair request status if invoice is linked to repair
        if (invoice.repairRequestId) {
          await connection.query(
            `UPDATE RepairRequest 
             SET status = 'ready_for_delivery', updatedAt = NOW()
             WHERE id = ?`,
            [invoice.repairRequestId]
          );

          // Emit WebSocket event for repair status update
          if (websocketService) {
            websocketService.broadcastToAll({
              type: 'repair_ready_for_delivery',
              repairId: invoice.repairRequestId,
              invoiceId: data.invoiceId,
              message: 'تم دفع الفاتورة بالكامل - جاهز للتسليم',
              timestamp: new Date().toISOString()
            });
          }
        }
      }

      await connection.commit();

      // Log audit
      if (auditLogService) {
        await auditLogService.log({
          action: 'payment_created',
          entityType: 'Payment',
          entityId: payment.id,
          userId: user.id,
          changes: payment
        });
      }

      // Emit WebSocket event
      if (websocketService) {
        websocketService.broadcastToAll({
          type: 'payment_created',
          paymentId: payment.id,
          invoiceId: data.invoiceId,
          repairId: invoice.repairRequestId || null,
          message: 'تم إنشاء دفعة جديدة',
          timestamp: new Date().toISOString()
        });
      }

      return payment;
    } catch (error) {
      await connection.rollback();
      console.error('Error in paymentsService.create:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get payments by invoice
   */
  async getByInvoice(invoiceId, user = null) {
    try {
      const payments = await paymentsRepository.findByInvoice(invoiceId);
      const totalPaid = await paymentsRepository.getTotalPaid(invoiceId);
      const invoice = await invoicesRepository.findById(invoiceId);

      return {
        payments,
        summary: {
          totalPaid,
          totalAmount: invoice?.totalAmount || 0,
          remaining: (invoice?.totalAmount || 0) - totalPaid
        }
      };
    } catch (error) {
      console.error('Error in paymentsService.getByInvoice:', error);
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  async getStats(filters = {}, user = null) {
    try {
      const stats = await paymentsRepository.getStats(filters);
      return stats;
    } catch (error) {
      console.error('Error in paymentsService.getStats:', error);
      throw error;
    }
  }

  /**
   * Get overdue payments
   */
  async getOverdue(days = 0, user = null) {
    try {
      const payments = await paymentsRepository.getOverdue(days);
      return payments;
    } catch (error) {
      console.error('Error in paymentsService.getOverdue:', error);
      throw error;
    }
  }
}

module.exports = new PaymentsService();


