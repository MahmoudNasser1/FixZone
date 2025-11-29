// Branches Financial Service
// Business logic for branch financial operations

const db = require('../../db');

class BranchesFinancialService {
  /**
   * Get branch financial summary
   * @param {number} branchId - Branch ID
   * @param {Object} filters - Filters (dateFrom, dateTo)
   * @returns {Promise<Object>} Financial summary
   */
  async getFinancialSummary(branchId, filters = {}) {
    try {
      let dateFilter = '';
      const params = [branchId];

      if (filters.dateFrom) {
        dateFilter += ' AND DATE(i.issueDate) >= ?';
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        dateFilter += ' AND DATE(i.issueDate) <= ?';
        params.push(filters.dateTo);
      }

      // Get invoices summary
      const [invoiceRows] = await db.query(
        `SELECT 
          COUNT(*) as totalInvoices,
          COALESCE(SUM(i.totalAmount), 0) as totalInvoiced,
          COALESCE(SUM(i.amountPaid), 0) as totalPaid,
          COALESCE(SUM(i.totalAmount - COALESCE(i.amountPaid, 0)), 0) as outstandingBalance,
          COUNT(CASE WHEN i.status = 'paid' THEN 1 END) as paidInvoices,
          COUNT(CASE WHEN i.status = 'pending' THEN 1 END) as pendingInvoices
        FROM Invoice i
        WHERE i.branchId = ?
        AND (i.deletedAt IS NULL OR i.deletedAt = '')
        ${dateFilter}`,
        params
      );

      // Get payments summary
      const [paymentRows] = await db.query(
        `SELECT 
          COUNT(*) as totalPayments,
          COALESCE(SUM(p.amount), 0) as totalPaidAmount
        FROM Payment p
        INNER JOIN Invoice i ON p.invoiceId = i.id
        WHERE i.branchId = ?
        AND (i.deletedAt IS NULL OR i.deletedAt = '')
        ${dateFilter}`,
        params
      );

      // Get expenses summary
      const [expenseRows] = await db.query(
        `SELECT 
          COUNT(*) as expenseCount,
          COALESCE(SUM(e.amount), 0) as totalExpenses
        FROM Expense e
        WHERE e.branchId = ?
        AND (e.deletedAt IS NULL OR e.deletedAt = '')
        ${dateFilter.replace(/i\.issueDate/g, 'e.date')}`,
        params
      );

      const invoiceSummary = invoiceRows[0] || {};
      const paymentSummary = paymentRows[0] || {};
      const expenseSummary = expenseRows[0] || {};

      return {
        branchId,
        invoices: {
          total: parseInt(invoiceSummary.totalInvoices || 0),
          totalInvoiced: parseFloat(invoiceSummary.totalInvoiced || 0),
          totalPaid: parseFloat(invoiceSummary.totalPaid || 0),
          outstandingBalance: parseFloat(invoiceSummary.outstandingBalance || 0),
          paid: parseInt(invoiceSummary.paidInvoices || 0),
          pending: parseInt(invoiceSummary.pendingInvoices || 0)
        },
        payments: {
          total: parseInt(paymentSummary.totalPayments || 0),
          totalAmount: parseFloat(paymentSummary.totalPaidAmount || 0)
        },
        expenses: {
          total: parseFloat(expenseSummary.totalExpenses || 0),
          count: parseInt(expenseSummary.expenseCount || 0)
        },
        netRevenue: parseFloat(paymentSummary.totalPaidAmount || 0) - parseFloat(expenseSummary.totalExpenses || 0)
      };
    } catch (error) {
      console.error('Error in branchesFinancialService.getFinancialSummary:', error);
      throw error;
    }
  }

  /**
   * Get branch invoices
   * @param {number} branchId - Branch ID
   * @param {Object} filters - Filters
   * @returns {Promise<Array>} Branch invoices
   */
  async getInvoices(branchId, filters = {}) {
    try {
      let whereClause = `WHERE i.branchId = ? AND (i.deletedAt IS NULL OR i.deletedAt = '')`;
      const params = [branchId];

      if (filters.status) {
        whereClause += ' AND i.status = ?';
        params.push(filters.status);
      }

      if (filters.dateFrom) {
        whereClause += ' AND DATE(i.issueDate) >= ?';
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        whereClause += ' AND DATE(i.issueDate) <= ?';
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
      console.error('Error in branchesFinancialService.getInvoices:', error);
      throw error;
    }
  }

  /**
   * Get branch expenses
   * @param {number} branchId - Branch ID
   * @param {Object} filters - Filters
   * @returns {Promise<Array>} Branch expenses
   */
  async getExpenses(branchId, filters = {}) {
    try {
      let whereClause = `WHERE e.branchId = ? AND (e.deletedAt IS NULL OR e.deletedAt = '')`;
      const params = [branchId];

      if (filters.categoryId) {
        whereClause += ' AND e.categoryId = ?';
        params.push(filters.categoryId);
      }

      if (filters.dateFrom) {
        whereClause += ' AND DATE(e.date) >= ?';
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        whereClause += ' AND DATE(e.date) <= ?';
        params.push(filters.dateTo);
      }

      const [expenses] = await db.query(
        `SELECT 
          e.*,
          ec.name as categoryName
        FROM Expense e
        LEFT JOIN ExpenseCategory ec ON e.categoryId = ec.id
        ${whereClause}
        ORDER BY e.date DESC, e.createdAt DESC`,
        params
      );

      return expenses;
    } catch (error) {
      console.error('Error in branchesFinancialService.getExpenses:', error);
      throw error;
    }
  }
}

module.exports = new BranchesFinancialService();

