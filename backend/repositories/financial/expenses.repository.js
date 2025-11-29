// Expenses Repository
// Handles all database operations for Expenses

const BaseRepository = require('./base.repository');
const db = require('../../db');

class ExpensesRepository extends BaseRepository {
  constructor() {
    super('Expense');
  }

  /**
   * Find all expenses with advanced filters
   */
  async findAll(filters = {}, pagination = {}) {
    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;

    let whereConditions = ['e.deletedAt IS NULL'];
    let queryParams = [];

    // Filter by category
    if (filters.categoryId) {
      whereConditions.push('e.categoryId = ?');
      queryParams.push(filters.categoryId);
    }

    // Filter by vendor
    if (filters.vendorId) {
      whereConditions.push('e.vendorId = ?');
      queryParams.push(filters.vendorId);
    }

    // Filter by branch
    if (filters.branchId) {
      whereConditions.push('e.branchId = ?');
      queryParams.push(filters.branchId);
    }

    // Filter by date range
    if (filters.dateFrom) {
      whereConditions.push('DATE(e.date) >= ?');
      queryParams.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      whereConditions.push('DATE(e.date) <= ?');
      queryParams.push(filters.dateTo);
    }

    // Search query
    if (filters.q) {
      whereConditions.push('(e.description LIKE ? OR e.amount LIKE ?)');
      queryParams.push(`%${filters.q}%`, `%${filters.q}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM Expense e ${whereClause}`,
      queryParams
    );
    const total = countResult[0]?.total || 0;

    // Get data with joins
    const [rows] = await db.query(
      `SELECT 
        e.*,
        ec.name as categoryName,
        b.name as branchName,
        u.name as createdByName
       FROM Expense e
       LEFT JOIN ExpenseCategory ec ON e.categoryId = ec.id
       LEFT JOIN Branch b ON e.branchId = b.id
       LEFT JOIN User u ON e.createdBy = u.id
       ${whereClause}
       ORDER BY e.date DESC, e.createdAt DESC
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
   * Get expense statistics
   */
  async getStats(filters = {}) {
    let whereConditions = ['deletedAt IS NULL'];
    let queryParams = [];

    if (filters.dateFrom) {
      whereConditions.push('DATE(date) >= ?');
      queryParams.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      whereConditions.push('DATE(date) <= ?');
      queryParams.push(filters.dateTo);
    }

    if (filters.branchId) {
      whereConditions.push('branchId = ?');
      queryParams.push(filters.branchId);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as totalCount,
        COALESCE(SUM(amount), 0) as totalAmount,
        COALESCE(AVG(amount), 0) as averageAmount,
        COALESCE(MIN(amount), 0) as minAmount,
        COALESCE(MAX(amount), 0) as maxAmount,
        COUNT(DISTINCT categoryId) as categoryCount
       FROM Expense
       ${whereClause}`,
      queryParams
    );

    return rows[0] || {
      totalCount: 0,
      totalAmount: 0,
      averageAmount: 0,
      minAmount: 0,
      maxAmount: 0,
      categoryCount: 0
    };
  }

  /**
   * Get expenses by category
   */
  async getByCategory(categoryId, filters = {}) {
    return await this.findAll({ ...filters, categoryId }, { page: 1, limit: 1000 });
  }

  /**
   * Get expenses by branch
   */
  async getByBranch(branchId, filters = {}) {
    return await this.findAll({ ...filters, branchId }, { page: 1, limit: 1000 });
  }
}

module.exports = new ExpensesRepository();


