// Invoices Repository
// Handles all database operations for Invoices

const BaseRepository = require('./base.repository');
const db = require('../../db');

class InvoicesRepository extends BaseRepository {
  constructor() {
    super('Invoice');
  }

  /**
   * Find all invoices with advanced filters
   */
  async findAll(filters = {}, pagination = {}) {
    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;

    let whereConditions = ['i.deletedAt IS NULL'];
    let queryParams = [];

    // Filter by repair request
    if (filters.repairRequestId) {
      whereConditions.push('i.repairRequestId = ?');
      queryParams.push(filters.repairRequestId);
    }

    // Filter by customer
    if (filters.customerId) {
      whereConditions.push('(i.customerId = ? OR rr.customerId = ?)');
      queryParams.push(filters.customerId, filters.customerId);
    }

    // Filter by company
    if (filters.companyId) {
      whereConditions.push('i.companyId = ?');
      queryParams.push(filters.companyId);
    }

    // Filter by branch
    if (filters.branchId) {
      whereConditions.push('i.branchId = ?');
      queryParams.push(filters.branchId);
    }

    // Filter by status
    if (filters.status) {
      whereConditions.push('i.status = ?');
      queryParams.push(filters.status);
    }

    // Filter by payment status
    if (filters.paymentStatus) {
      if (filters.paymentStatus === 'paid') {
        whereConditions.push('i.status = ?');
        queryParams.push('paid');
      } else if (filters.paymentStatus === 'unpaid') {
        whereConditions.push('i.status != ?');
        queryParams.push('paid');
      } else if (filters.paymentStatus === 'overdue') {
        whereConditions.push('i.dueDate IS NOT NULL AND i.dueDate < CURDATE() AND i.status != ?');
        queryParams.push('paid');
      }
    }

    // Filter by date range
    if (filters.dateFrom) {
      whereConditions.push('DATE(i.issueDate) >= ?');
      queryParams.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      whereConditions.push('DATE(i.issueDate) <= ?');
      queryParams.push(filters.dateTo);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total 
       FROM Invoice i
       LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
       ${whereClause}`,
      queryParams
    );
    const total = countResult[0]?.total || 0;

    // Get data with joins
    const [rows] = await db.query(
      `SELECT 
        i.*,
        COALESCE(c_direct.name, c_via_repair.name) as customerName,
        COALESCE(c_direct.phone, c_via_repair.phone) as customerPhone,
        COALESCE(c_direct.email, c_via_repair.email) as customerEmail,
        comp.name as companyName,
        b.name as branchName,
        rr.deviceBrand,
        rr.deviceModel,
        rr.deviceType,
        (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE invoiceId = i.id AND deletedAt IS NULL) as amountPaid,
        (i.totalAmount - (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE invoiceId = i.id AND deletedAt IS NULL)) as amountRemaining
       FROM Invoice i
       LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
       LEFT JOIN Customer c_direct ON i.customerId = c_direct.id
       LEFT JOIN Customer c_via_repair ON rr.customerId = c_via_repair.id
       ${whereClause}
       ORDER BY i.createdAt DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    return {
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find invoice by ID with full details
   */
  async findById(id) {
    const [rows] = await db.query(
      `SELECT 
        i.*,
        COALESCE(c_direct.name, c_via_repair.name) as customerName,
        COALESCE(c_direct.phone, c_via_repair.phone) as customerPhone,
        COALESCE(c_direct.email, c_via_repair.email) as customerEmail,
        rr.id as repairRequestId,
        rr.repairNumber,
        rr.deviceBrand,
        rr.deviceModel,
        (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE invoiceId = i.id AND deletedAt IS NULL) as amountPaid,
        (i.totalAmount - (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE invoiceId = i.id AND deletedAt IS NULL)) as amountRemaining
       FROM Invoice i
       LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
       LEFT JOIN Customer c_direct ON i.customerId = c_direct.id
       LEFT JOIN Customer c_via_repair ON rr.customerId = c_via_repair.id
       WHERE i.id = ? AND i.deletedAt IS NULL`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Find invoice by repair request ID
   */
  async findByRepairRequest(repairRequestId) {
    const [rows] = await db.query(
      `SELECT * FROM Invoice 
       WHERE repairRequestId = ? AND deletedAt IS NULL
       LIMIT 1`,
      [repairRequestId]
    );
    return rows[0] || null;
  }

  /**
   * Generate unique invoice number
   */
  async generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const [countResult] = await db.query(
      `SELECT COUNT(*) as count 
       FROM Invoice 
       WHERE YEAR(createdAt) = ? AND deletedAt IS NULL`,
      [year]
    );
    const count = countResult[0]?.count || 0;
    return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  /**
   * Get invoice statistics
   */
  async getStats(filters = {}) {
    // Check if dueDate column exists
    const [columnCheck] = await db.query(`
      SELECT COUNT(*) as colExists 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Invoice' 
      AND COLUMN_NAME = 'dueDate'
    `);

    const hasDueDate = columnCheck[0].colExists > 0;

    let whereConditions = ['deletedAt IS NULL'];
    let queryParams = [];

    if (filters.dateFrom) {
      whereConditions.push('DATE(issueDate) >= ?');
      queryParams.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      whereConditions.push('DATE(issueDate) <= ?');
      queryParams.push(filters.dateTo);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Build overdue amount calculation based on whether dueDate exists
    const overdueAmountCalc = hasDueDate
      ? `COALESCE(SUM(CASE WHEN dueDate IS NOT NULL AND dueDate < CURDATE() AND status != 'paid' THEN totalAmount ELSE 0 END), 0) as overdueAmount`
      : `0 as overdueAmount`;

    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draftCount,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sentCount,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paidCount,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdueCount,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelledCount,
        COALESCE(SUM(totalAmount), 0) as totalAmount,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN totalAmount ELSE 0 END), 0) as paidAmount,
        COALESCE(SUM(CASE WHEN status != 'paid' THEN totalAmount ELSE 0 END), 0) as unpaidAmount,
        ${overdueAmountCalc}
       FROM Invoice
       ${whereClause}`,
      queryParams
    );

    return rows[0] || {
      total: 0,
      draftCount: 0,
      sentCount: 0,
      paidCount: 0,
      overdueCount: 0,
      cancelledCount: 0,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      overdueAmount: 0
    };
  }

  /**
   * Get overdue invoices
   */
  async getOverdue() {
    // Check if dueDate column exists
    const [columnCheck] = await db.query(`
      SELECT COUNT(*) as colExists 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Invoice' 
      AND COLUMN_NAME = 'dueDate'
    `);

    const hasDueDate = columnCheck[0].colExists > 0;

    if (!hasDueDate) {
      // If dueDate doesn't exist, return empty array
      return [];
    }

    const [rows] = await db.query(
      `SELECT 
        i.*,
        DATEDIFF(CURDATE(), i.dueDate) as daysOverdue,
        (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE invoiceId = i.id) as amountPaid
       FROM Invoice i
       WHERE i.dueDate IS NOT NULL
         AND i.dueDate < CURDATE()
         AND i.status != 'paid'
         AND i.deletedAt IS NULL
       ORDER BY i.dueDate ASC`
    );
    return rows;
  }
}

module.exports = new InvoicesRepository();

