// backend/repositories/settingsHistoryRepository.js
const db = require('../db');

class SettingsHistoryRepository {
  /**
   * Create history entry
   */
  async create(historyData) {
    try {
      const {
        settingId, settingKey, oldValue, newValue, changedBy,
        changeReason, ipAddress, userAgent
      } = historyData;
      
      const [result] = await db.execute(
        `INSERT INTO SettingHistory (
          settingId, settingKey, oldValue, newValue, changedBy,
          changeReason, ipAddress, userAgent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          settingId,
          settingKey,
          oldValue || null,
          newValue,
          changedBy,
          changeReason || null,
          ipAddress || null,
          userAgent || null
        ]
      );
      
      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }
  
  /**
   * Get history by setting key
   */
  async findBySettingKey(key, pagination = {}) {
    try {
      let sql = `
        SELECT sh.*, u.name as changedByName, u.email as changedByEmail
        FROM SettingHistory sh
        LEFT JOIN User u ON sh.changedBy = u.id
        WHERE sh.settingKey = ?
        ORDER BY sh.createdAt DESC
      `;
      
      const params = [key];
      
      // CRITICAL: Use db.query instead of db.execute for queries with LIMIT/OFFSET
      // db.execute uses prepared statements which cause issues with LIMIT/OFFSET in MariaDB strict mode
      if (pagination.limit) {
        const limitVal = parseInt(pagination.limit);
        sql += ` LIMIT ${limitVal}`;
        
        if (pagination.offset) {
          const offsetVal = parseInt(pagination.offset);
          sql += ` OFFSET ${offsetVal}`;
        }
      }
      
      const [rows] = await db.query(sql, params);
      return rows;
    } catch (error) {
      console.error('Error in findBySettingKey:', error);
      throw error;
    }
  }
  
  /**
   * Get history by setting ID
   */
  async findBySettingId(settingId, pagination = {}) {
    try {
      let sql = `
        SELECT sh.*, u.name as changedByName, u.email as changedByEmail
        FROM SettingHistory sh
        LEFT JOIN User u ON sh.changedBy = u.id
        WHERE sh.settingId = ?
        ORDER BY sh.createdAt DESC
      `;
      
      const params = [settingId];
      
      // CRITICAL: Use db.query instead of db.execute for queries with LIMIT/OFFSET
      // db.execute uses prepared statements which cause issues with LIMIT/OFFSET in MariaDB strict mode
      if (pagination.limit) {
        const limitVal = parseInt(pagination.limit);
        sql += ` LIMIT ${limitVal}`;
        
        if (pagination.offset) {
          const offsetVal = parseInt(pagination.offset);
          sql += ` OFFSET ${offsetVal}`;
        }
      }
      
      const [rows] = await db.query(sql, params);
      return rows;
    } catch (error) {
      console.error('Error in findBySettingId:', error);
      throw error;
    }
  }
  
  /**
   * Get all history with filters
   */
  async findAll(filters = {}, pagination = {}) {
    try {
      let where = ['1=1'];
      const params = [];
      
      if (filters.settingKey) {
        where.push('sh.settingKey = ?');
        params.push(filters.settingKey);
      }
      
      if (filters.changedBy) {
        where.push('sh.changedBy = ?');
        params.push(filters.changedBy);
      }
      
      if (filters.startDate) {
        where.push('sh.createdAt >= ?');
        params.push(filters.startDate);
      }
      
      if (filters.endDate) {
        where.push('sh.createdAt <= ?');
        params.push(filters.endDate);
      }
      
      let sql = `
        SELECT sh.*, u.name as changedByName, u.email as changedByEmail
        FROM SettingHistory sh
        LEFT JOIN User u ON sh.changedBy = u.id
        WHERE ${where.join(' AND ')}
        ORDER BY sh.createdAt DESC
      `;
      
      // CRITICAL: Use db.query instead of db.execute for queries with LIMIT/OFFSET
      // db.execute uses prepared statements which cause issues with LIMIT/OFFSET in MariaDB strict mode
      if (pagination.limit) {
        const limitVal = parseInt(pagination.limit);
        sql += ` LIMIT ${limitVal}`;
        
        if (pagination.offset) {
          const offsetVal = parseInt(pagination.offset);
          sql += ` OFFSET ${offsetVal}`;
        }
      }
      
      const [rows] = await db.query(sql, params);
      return rows;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }
  
  /**
   * Get history entry by ID
   */
  async findById(id) {
    try {
      const [rows] = await db.execute(
        `SELECT sh.*, u.name as changedByName, u.email as changedByEmail
         FROM SettingHistory sh
         LEFT JOIN User u ON sh.changedBy = u.id
         WHERE sh.id = ?`,
        [id]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
  }
  
  /**
   * Count history entries
   */
  async count(filters = {}) {
    try {
      let where = ['1=1'];
      const params = [];
      
      if (filters.settingKey) {
        where.push('settingKey = ?');
        params.push(filters.settingKey);
      }
      
      if (filters.changedBy) {
        where.push('changedBy = ?');
        params.push(filters.changedBy);
      }
      
      if (filters.startDate) {
        where.push('createdAt >= ?');
        params.push(filters.startDate);
      }
      
      if (filters.endDate) {
        where.push('createdAt <= ?');
        params.push(filters.endDate);
      }
      
      const [rows] = await db.execute(
        `SELECT COUNT(*) as count FROM SettingHistory WHERE ${where.join(' AND ')}`,
        params
      );
      
      return rows[0].count;
    } catch (error) {
      console.error('Error in count:', error);
      throw error;
    }
  }
}

module.exports = new SettingsHistoryRepository();

