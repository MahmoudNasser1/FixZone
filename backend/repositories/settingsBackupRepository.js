// backend/repositories/settingsBackupRepository.js
const db = require('../db');

class SettingsBackupRepository {
  /**
   * Create backup
   */
  async create(backupData) {
    try {
      const { name, description, settings, createdBy } = backupData;
      
      const [result] = await db.execute(
        `INSERT INTO SettingBackup (name, description, settings, createdBy)
         VALUES (?, ?, ?, ?)`,
        [
          name,
          description || null,
          JSON.stringify(settings),
          createdBy
        ]
      );
      
      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }
  
  /**
   * Get backup by ID
   */
  async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM SettingBackup WHERE id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      const row = rows[0];
      return {
        ...row,
        settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings
      };
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
  }
  
  /**
   * Get all backups with pagination
   */
  async findAll(pagination = {}) {
    try {
      let sql = `
        SELECT sb.*, u.name as createdByName, u.email as createdByEmail
        FROM SettingBackup sb
        LEFT JOIN User u ON sb.createdBy = u.id
        ORDER BY sb.createdAt DESC
      `;
      
      const params = [];
      
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
      
      return rows.map(row => ({
        ...row,
        settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings
      }));
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }
  
  /**
   * Delete backup
   */
  async delete(id) {
    try {
      await db.execute('DELETE FROM SettingBackup WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }
  
  /**
   * Count backups
   */
  async count() {
    try {
      const [rows] = await db.execute('SELECT COUNT(*) as count FROM SettingBackup');
      return rows[0].count;
    } catch (error) {
      console.error('Error in count:', error);
      throw error;
    }
  }
}

module.exports = new SettingsBackupRepository();

