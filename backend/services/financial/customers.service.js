// Customers Financial Service
// Business logic for customer financial operations

const db = require('../../db');

class CustomersFinancialService {
  /**
   * Calculate customer balance
   * @param {number} customerId - Customer ID
   * @returns {Promise<Object>} Balance information
   */
  async getBalance(customerId) {
    try {
      // Get total invoices amount (direct and via repairs)
      const [invoiceRows] = await db.query(
        `SELECT 
          COALESCE(SUM(i.totalAmount), 0) as totalInvoiced,
          COALESCE(SUM(i.amountPaid), 0) as totalPaid,
          COUNT(i.id) as invoiceCount
        FROM Invoice i
        WHERE (i.customerId = ? OR i.id IN (
          SELECT id FROM Invoice WHERE repairRequestId IN (
            SELECT id FROM RepairRequest WHERE customerId = ?
          )
        ))
        AND (i.deletedAt IS NULL OR i.deletedAt = '')`,
        [customerId, customerId]
      );

      const totalInvoiced = parseFloat(invoiceRows[0]?.totalInvoiced || 0);
      const totalPaid = parseFloat(invoiceRows[0]?.totalPaid || 0);
      const invoiceCount = parseInt(invoiceRows[0]?.invoiceCount || 0);
      const balance = totalInvoiced - totalPaid;

      // Get overdue invoices count
      const [overdueRows] = await db.query(
        `SELECT COUNT(*) as overdueCount
        FROM Invoice i
        WHERE (i.customerId = ? OR i.id IN (
          SELECT id FROM Invoice WHERE repairRequestId IN (
            SELECT id FROM RepairRequest WHERE customerId = ?
          )
        ))
        AND (i.deletedAt IS NULL OR i.deletedAt = '')
        AND i.status != 'paid'
        AND (i.dueDate IS NOT NULL AND i.dueDate < CURDATE())`,
        [customerId, customerId]
      );

      const overdueCount = parseInt(overdueRows[0]?.overdueCount || 0);

      return {
        customerId,
        totalInvoiced,
        totalPaid,
        balance,
        invoiceCount,
        overdueCount
      };
    } catch (error) {
      console.error('Error in customersFinancialService.getBalance:', error);
      throw error;
    }
  }

  /**
   * Get customer invoices
   * @param {number} customerId - Customer ID
   * @param {Object} filters - Filters (status, dateFrom, dateTo)
   * @returns {Promise<Array>} Customer invoices
   */
  async getInvoices(customerId, filters = {}) {
    try {
      let whereClause = `WHERE (i.customerId = ? OR i.id IN (
        SELECT id FROM Invoice WHERE repairRequestId IN (
          SELECT id FROM RepairRequest WHERE customerId = ?
        )
      ))
      AND (i.deletedAt IS NULL OR i.deletedAt = '')`;
      const params = [customerId, customerId];

      if (filters.status) {
        whereClause += ' AND i.status = ?';
        params.push(filters.status);
      }

      if (filters.dateFrom) {
        whereClause += ' AND DATE(i.createdAt) >= ?';
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        whereClause += ' AND DATE(i.createdAt) <= ?';
        params.push(filters.dateTo);
      }

      const [invoices] = await db.query(
        `SELECT 
          i.*,
          COALESCE(SUM(p.amount), 0) as totalPaid,
          (i.totalAmount - COALESCE(SUM(p.amount), 0)) as remainingAmount
        FROM Invoice i
        LEFT JOIN Payment p ON i.id = p.invoiceId
        ${whereClause}
        GROUP BY i.id
        ORDER BY i.createdAt DESC`,
        params
      );

      return invoices;
    } catch (error) {
      console.error('Error in customersFinancialService.getInvoices:', error);
      throw error;
    }
  }

  /**
   * Get customer payments
   * @param {number} customerId - Customer ID
   * @param {Object} filters - Filters (dateFrom, dateTo)
   * @returns {Promise<Array>} Customer payments
   */
  async getPayments(customerId, filters = {}) {
    try {
      let whereClause = `WHERE (i.customerId = ? OR i.id IN (
        SELECT id FROM Invoice WHERE repairRequestId IN (
          SELECT id FROM RepairRequest WHERE customerId = ?
        )
      ))`;
      const params = [customerId, customerId];

      if (filters.dateFrom) {
        whereClause += ' AND DATE(p.paymentDate) >= ?';
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        whereClause += ' AND DATE(p.paymentDate) <= ?';
        params.push(filters.dateTo);
      }

      const [payments] = await db.query(
        `SELECT 
          p.*,
          i.id as invoiceId,
          i.invoiceNumber,
          i.totalAmount as invoiceTotal
        FROM Payment p
        INNER JOIN Invoice i ON p.invoiceId = i.id
        ${whereClause}
        ORDER BY p.paymentDate DESC, p.createdAt DESC`,
        params
      );

      return payments;
    } catch (error) {
      console.error('Error in customersFinancialService.getPayments:', error);
      throw error;
    }
  }
}

module.exports = new CustomersFinancialService();

