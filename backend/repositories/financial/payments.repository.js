// Payments Repository
// Handles all database operations for Payments

const BaseRepository = require('./base.repository');
const db = require('../../db');

class PaymentsRepository extends BaseRepository {
  constructor() {
    super('Payment');
  }

  /**
   * Find all payments with advanced filters
   */
  async findAll(filters = {}, pagination = {}) {
    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;

    // Check if deletedAt column exists in Payment table
    const [columnCheck] = await db.query(`
      SELECT COUNT(*) as exists 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Payment' 
      AND COLUMN_NAME = 'deletedAt'
    `);

    const hasSoftDelete = columnCheck[0].exists > 0;
    let whereConditions = hasSoftDelete ? ['p.deletedAt IS NULL'] : [];
    whereConditions.push('i.deletedAt IS NULL');
    let queryParams = [];

    // Filter by invoice
    if (filters.invoiceId) {
      whereConditions.push('p.invoiceId = ?');
      queryParams.push(filters.invoiceId);
    }

    // Filter by company (via invoice)
    if (filters.companyId) {
      whereConditions.push('i.companyId = ?');
      queryParams.push(filters.companyId);
    }

    // Filter by branch (via invoice)
    if (filters.branchId) {
      whereConditions.push('i.branchId = ?');
      queryParams.push(filters.branchId);
    }

    // Filter by customer (via invoice or repair)
    if (filters.customerId) {
      whereConditions.push('(i.customerId = ? OR rr.customerId = ?)');
      queryParams.push(filters.customerId, filters.customerId);
    }

    // Filter by payment method
    if (filters.paymentMethod) {
      whereConditions.push('p.paymentMethod = ?');
      queryParams.push(filters.paymentMethod);
    }

    // Filter by date range (use paymentDate if exists, otherwise createdAt)
    if (filters.dateFrom) {
      whereConditions.push('DATE(COALESCE(p.paymentDate, p.createdAt)) >= ?');
      queryParams.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      whereConditions.push('DATE(COALESCE(p.paymentDate, p.createdAt)) <= ?');
      queryParams.push(filters.dateTo);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total 
       FROM Payment p
       LEFT JOIN Invoice i ON p.invoiceId = i.id
       LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
       ${whereClause}`,
      queryParams
    );
    const total = countResult[0]?.total || 0;

    // Get data with joins
    const [rows] = await db.query(
      `SELECT 
        p.*,
        i.id as invoiceId,
        i.invoiceNumber,
        i.totalAmount as invoiceTotal,
        i.status as invoiceStatus,
        i.companyId,
        i.branchId,
        c.name as customerName,
        c.phone as customerPhone,
        comp.name as companyName,
        b.name as branchName,
        u.name as createdByName,
        (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE invoiceId = p.invoiceId AND deletedAt IS NULL) as totalPaid,
        (i.totalAmount - (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE invoiceId = p.invoiceId AND deletedAt IS NULL)) as remainingAmount
       FROM Payment p
       LEFT JOIN Invoice i ON p.invoiceId = i.id
       LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
       LEFT JOIN Customer c ON i.customerId = c.id OR rr.customerId = c.id
       LEFT JOIN Company comp ON i.companyId = comp.id
       LEFT JOIN Branch b ON i.branchId = b.id
       LEFT JOIN User u ON p.userId = u.id
       ${whereClause}
       ORDER BY COALESCE(p.paymentDate, p.createdAt) DESC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      queryParams
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
   * Get payments by invoice ID
   */
  async findByInvoice(invoiceId) {
    // Check if deletedAt column exists
    const [columnCheck] = await db.query(`
      SELECT COUNT(*) as colExists 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Payment' 
      AND COLUMN_NAME = 'deletedAt'
    `);

    const hasSoftDelete = columnCheck[0].colExists > 0;
    const deletedClause = hasSoftDelete ? 'AND p.deletedAt IS NULL' : '';

    const [rows] = await db.query(
      `SELECT 
        p.*,
        u.name as createdByName
       FROM Payment p
       LEFT JOIN User u ON p.userId = u.id
       WHERE p.invoiceId = ? ${deletedClause}
       ORDER BY COALESCE(p.paymentDate, p.createdAt) DESC`,
      [invoiceId]
    );
    return rows;
  }

  /**
   * Create payment (override base create to handle paymentDate)
   */
  async create(data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');

    // Build INSERT query with paymentDate handling
    let insertFields = fields.join(', ');
    let insertValues = placeholders;

    // If paymentDate is not in fields but exists in data, add it
    if (data.paymentDate && !fields.includes('paymentDate')) {
      insertFields += ', paymentDate';
      insertValues += ', ?';
      values.push(data.paymentDate);
    }

    const [result] = await db.query(
      `INSERT INTO Payment (${insertFields}, createdAt, updatedAt) VALUES (${insertValues}, NOW(), NOW())`,
      values
    );

    return await this.findById(result.insertId);
  }

  /**
   * Get total paid for an invoice
   */
  async getTotalPaid(invoiceId) {
    // Check if deletedAt column exists
    const [columnCheck] = await db.query(`
      SELECT COUNT(*) as colExists 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Payment' 
      AND COLUMN_NAME = 'deletedAt'
    `);

    const hasSoftDelete = columnCheck[0].colExists > 0;
    const deletedClause = hasSoftDelete ? 'AND deletedAt IS NULL' : '';

    const [rows] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as totalPaid
       FROM Payment
       WHERE invoiceId = ? ${deletedClause}`,
      [invoiceId]
    );
    return parseFloat(rows[0]?.totalPaid || 0);
  }

  /**
   * Get payment statistics
   */
  async getStats(filters = {}) {
    // Check if deletedAt column exists
    const [columnCheck] = await db.query(`
      SELECT COUNT(*) as colExists 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Payment' 
      AND COLUMN_NAME = 'deletedAt'
    `);

    const hasSoftDelete = columnCheck[0].colExists > 0;
    let whereConditions = hasSoftDelete ? ['p.deletedAt IS NULL'] : [];
    let queryParams = [];

    if (filters.dateFrom) {
      whereConditions.push('DATE(COALESCE(p.paymentDate, p.createdAt)) >= ?');
      queryParams.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      whereConditions.push('DATE(COALESCE(p.paymentDate, p.createdAt)) <= ?');
      queryParams.push(filters.dateTo);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as totalPayments,
        COALESCE(SUM(amount), 0) as totalAmount,
        COALESCE(AVG(amount), 0) as averageAmount,
        COUNT(CASE WHEN paymentMethod = 'cash' THEN 1 END) as cashPayments,
        COUNT(CASE WHEN paymentMethod = 'card' THEN 1 END) as cardPayments,
        COUNT(CASE WHEN paymentMethod = 'bank_transfer' THEN 1 END) as bankTransferPayments,
        COUNT(CASE WHEN paymentMethod = 'check' THEN 1 END) as checkPayments,
        COUNT(CASE WHEN paymentMethod = 'other' THEN 1 END) as otherPayments,
        COALESCE(SUM(CASE WHEN paymentMethod = 'cash' THEN amount ELSE 0 END), 0) as cashAmount,
        COALESCE(SUM(CASE WHEN paymentMethod = 'card' THEN amount ELSE 0 END), 0) as cardAmount,
        COALESCE(SUM(CASE WHEN paymentMethod = 'bank_transfer' THEN amount ELSE 0 END), 0) as bankTransferAmount,
        COALESCE(SUM(CASE WHEN paymentMethod = 'check' THEN amount ELSE 0 END), 0) as checkAmount,
        COALESCE(SUM(CASE WHEN paymentMethod = 'other' THEN amount ELSE 0 END), 0) as otherAmount
       FROM Payment p
       ${whereClause}`,
      queryParams
    );

    return rows[0] || {
      totalPayments: 0,
      totalAmount: 0,
      averageAmount: 0,
      cashPayments: 0,
      cardPayments: 0,
      bankTransferPayments: 0,
      checkPayments: 0,
      otherPayments: 0,
      cashAmount: 0,
      cardAmount: 0,
      bankTransferAmount: 0,
      checkAmount: 0,
      otherAmount: 0
    };
  }

  /**
   * Get overdue payments
   */
  async getOverdue(days = 0) {
    const [rows] = await db.query(
      `SELECT 
        p.*,
        i.invoiceNumber,
        i.totalAmount,
        i.dueDate,
        DATEDIFF(CURDATE(), i.dueDate) as daysOverdue
       FROM Payment p
       INNER JOIN Invoice i ON p.invoiceId = i.id
       WHERE i.dueDate IS NOT NULL
         AND i.dueDate < CURDATE()
         AND i.status != 'paid'
         AND p.deletedAt IS NULL
         AND i.deletedAt IS NULL
         AND DATEDIFF(CURDATE(), i.dueDate) >= ?
       ORDER BY i.dueDate ASC`,
      [days]
    );
    return rows;
  }
}

module.exports = new PaymentsRepository();

