// Base Repository for Financial Module
// Provides common database operations

const db = require('../../db');

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
  }

  /**
   * Find all records with pagination and filters
   */
  async findAll(filters = {}, pagination = {}) {
    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];

    // Add soft delete filter if deletedAt column exists
    whereConditions.push(`${this.tableName}.deletedAt IS NULL`);

    // Build WHERE clause from filters
    if (filters.id) {
      whereConditions.push(`${this.tableName}.id = ?`);
      queryParams.push(filters.id);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`,
      queryParams
    );
    const total = countResult[0]?.total || 0;

    // Get data
    const [rows] = await db.query(
      `SELECT * FROM ${this.tableName} ${whereClause} ORDER BY ${this.tableName}.createdAt DESC LIMIT ? OFFSET ?`,
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
   * Find record by ID
   */
  async findById(id) {
    const [rows] = await db.query(
      `SELECT * FROM ${this.tableName} WHERE id = ? AND deletedAt IS NULL`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Create new record
   */
  async create(data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');

    const [result] = await db.query(
      `INSERT INTO ${this.tableName} (${fields.join(', ')}, createdAt, updatedAt) VALUES (${placeholders}, NOW(), NOW())`,
      values
    );

    return await this.findById(result.insertId);
  }

  /**
   * Update record by ID
   */
  async update(id, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    await db.query(
      `UPDATE ${this.tableName} SET ${setClause}, updatedAt = NOW() WHERE id = ? AND deletedAt IS NULL`,
      [...values, id]
    );

    return await this.findById(id);
  }

  /**
   * Soft delete record
   */
  async softDelete(id) {
    await db.query(
      `UPDATE ${this.tableName} SET deletedAt = NOW(), updatedAt = NOW() WHERE id = ?`,
      [id]
    );
    return true;
  }

  /**
   * Hard delete record (use with caution)
   */
  async hardDelete(id) {
    const [result] = await db.query(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Count records
   */
  async count(filters = {}) {
    let whereConditions = [];
    let queryParams = [];

    whereConditions.push('deletedAt IS NULL');

    if (filters.id) {
      whereConditions.push('id = ?');
      queryParams.push(filters.id);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const [result] = await db.query(
      `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`,
      queryParams
    );

    return result[0]?.total || 0;
  }
}

module.exports = BaseRepository;


