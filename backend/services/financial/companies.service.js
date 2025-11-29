// Companies Financial Service
// Business logic for company financial operations

const db = require('../../db');

class CompaniesFinancialService {
  /**
   * Get company financial summary
   * @param {number} companyId - Company ID
   * @param {Object} filters - Filters (dateFrom, dateTo)
   * @returns {Promise<Object>} Financial summary
   */
  async getFinancialSummary(companyId, filters = {}) {
    try {
      let dateFilter = '';
      const params = [companyId];

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
          COUNT(CASE WHEN i.status = 'pending' THEN 1 END) as pendingInvoices,
          COUNT(CASE WHEN i.status = 'overdue' THEN 1 END) as overdueInvoices
        FROM Invoice i
        WHERE i.companyId = ?
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
        WHERE i.companyId = ?
        AND (i.deletedAt IS NULL OR i.deletedAt = '')
        ${dateFilter}`,
        params
      );

      // Get expenses summary (if expenses have companyId)
      let expensesSummary = { totalExpenses: 0, expenseCount: 0 };
      try {
        const [expenseRows] = await db.query(
          `SELECT 
            COUNT(*) as expenseCount,
            COALESCE(SUM(e.amount), 0) as totalExpenses
          FROM Expense e
          WHERE e.companyId = ?
          AND (e.deletedAt IS NULL OR e.deletedAt = '')
          ${dateFilter.replace(/i\.issueDate/g, 'e.date')}`,
          params
        );
        if (expenseRows.length > 0) {
          expensesSummary = {
            totalExpenses: parseFloat(expenseRows[0].totalExpenses || 0),
            expenseCount: parseInt(expenseRows[0].expenseCount || 0)
          };
        }
      } catch (expenseError) {
        // Expenses might not have companyId column
        console.log('Expenses companyId not available:', expenseError.message);
      }

      const invoiceSummary = invoiceRows[0] || {};
      const paymentSummary = paymentRows[0] || {};

      return {
        companyId,
        invoices: {
          total: parseInt(invoiceSummary.totalInvoices || 0),
          totalInvoiced: parseFloat(invoiceSummary.totalInvoiced || 0),
          totalPaid: parseFloat(invoiceSummary.totalPaid || 0),
          outstandingBalance: parseFloat(invoiceSummary.outstandingBalance || 0),
          paid: parseInt(invoiceSummary.paidInvoices || 0),
          pending: parseInt(invoiceSummary.pendingInvoices || 0),
          overdue: parseInt(invoiceSummary.overdueInvoices || 0)
        },
        payments: {
          total: parseInt(paymentSummary.totalPayments || 0),
          totalAmount: parseFloat(paymentSummary.totalPaidAmount || 0)
        },
        expenses: expensesSummary,
        netRevenue: parseFloat(paymentSummary.totalPaidAmount || 0) - expensesSummary.totalExpenses
      };
    } catch (error) {
      console.error('Error in companiesFinancialService.getFinancialSummary:', error);
      throw error;
    }
  }

  /**
   * Get company invoices
   * @param {number} companyId - Company ID
   * @param {Object} filters - Filters
   * @returns {Promise<Array>} Company invoices
   */
  async getInvoices(companyId, filters = {}) {
    try {
      let whereClause = `WHERE i.companyId = ? AND (i.deletedAt IS NULL OR i.deletedAt = '')`;
      const params = [companyId];

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
      console.error('Error in companiesFinancialService.getInvoices:', error);
      throw error;
    }
  }
}

module.exports = new CompaniesFinancialService();

