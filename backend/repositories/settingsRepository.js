// backend/repositories/settingsRepository.js
const db = require('../db');

class SettingsRepository {
  /**
   * Get all settings with optional filters
   */
  async findAll(filters = {}, pagination = {}) {
    try {
      let where = [];
      const params = [];
      
      if (filters.category) {
        where.push('category = ?');
        params.push(filters.category);
      }
      
      if (filters.environment) {
        where.push('(environment = ? OR environment = ?)');
        params.push(filters.environment, 'all');
      }
      
      if (filters.isSystem !== undefined) {
        where.push('isSystem = ?');
        params.push(filters.isSystem ? 1 : 0);
      }
      
      if (filters.search) {
        where.push('(`key` LIKE ? OR description LIKE ?)');
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }
      
      // Build WHERE clause - if no conditions, use 1=1 to avoid syntax error
      const whereClause = where.length > 0 ? where.join(' AND ') : '1=1';
      let sql = `SELECT * FROM SystemSetting WHERE ${whereClause} ORDER BY category, \`key\` ASC`;
      
      // Ensure limit and offset are valid numbers
      const limit = pagination.limit ? parseInt(pagination.limit) : null;
      const offset = pagination.offset ? parseInt(pagination.offset) : null;
      
      if (limit !== null && !isNaN(limit) && limit > 0) {
        sql += ` LIMIT ?`;
        params.push(limit);
        
        if (offset !== null && !isNaN(offset) && offset >= 0) {
          sql += ` OFFSET ?`;
          params.push(offset);
        }
      }
      
      const [rows] = await db.execute(sql, params);
      
      // Parse JSON fields
      return rows.map(row => ({
        ...row,
        value: this.parseValue(row.value, row.type),
        validationRules: row.validationRules ? JSON.parse(row.validationRules) : null,
        dependencies: row.dependencies ? JSON.parse(row.dependencies) : null,
        permissions: row.permissions ? JSON.parse(row.permissions) : null,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
        isEncrypted: Boolean(row.isEncrypted),
        isSystem: Boolean(row.isSystem),
        isPublic: Boolean(row.isPublic)
      }));
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }
  
  /**
   * Get setting by key
   */
  async findByKey(key) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM SystemSetting WHERE `key` = ?',
        [key]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      const row = rows[0];
      return {
        ...row,
        value: this.parseValue(row.value, row.type),
        validationRules: row.validationRules ? JSON.parse(row.validationRules) : null,
        dependencies: row.dependencies ? JSON.parse(row.dependencies) : null,
        permissions: row.permissions ? JSON.parse(row.permissions) : null,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
        isEncrypted: Boolean(row.isEncrypted),
        isSystem: Boolean(row.isSystem),
        isPublic: Boolean(row.isPublic)
      };
    } catch (error) {
      console.error('Error in findByKey:', error);
      throw error;
    }
  }
  
  /**
   * Get settings by category
   */
  async findByCategory(category) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM SystemSetting WHERE category = ? ORDER BY `key` ASC',
        [category]
      );
      
      return rows.map(row => ({
        ...row,
        value: this.parseValue(row.value, row.type),
        validationRules: row.validationRules ? JSON.parse(row.validationRules) : null,
        dependencies: row.dependencies ? JSON.parse(row.dependencies) : null,
        permissions: row.permissions ? JSON.parse(row.permissions) : null,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
        isEncrypted: Boolean(row.isEncrypted),
        isSystem: Boolean(row.isSystem),
        isPublic: Boolean(row.isPublic)
      }));
    } catch (error) {
      console.error('Error in findByCategory:', error);
      throw error;
    }
  }
  
  /**
   * Create new setting
   */
  async create(settingData) {
    try {
      const {
        key, value, type, category, description, isEncrypted, isSystem, isPublic,
        defaultValue, validationRules, dependencies, environment, permissions, metadata
      } = settingData;
      
      const [result] = await db.execute(
        `INSERT INTO SystemSetting (
          \`key\`, value, type, category, description, isEncrypted, isSystem, isPublic,
          defaultValue, validationRules, dependencies, environment, permissions, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          key,
          this.stringifyValue(value, type),
          type || 'string',
          category || 'general',
          description || null,
          isEncrypted ? 1 : 0,
          isSystem ? 1 : 0,
          isPublic ? 1 : 0,
          defaultValue ? this.stringifyValue(defaultValue, type) : null,
          validationRules ? JSON.stringify(validationRules) : null,
          dependencies ? JSON.stringify(dependencies) : null,
          environment || 'all',
          permissions ? JSON.stringify(permissions) : null,
          metadata ? JSON.stringify(metadata) : null
        ]
      );
      
      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }
  
  /**
   * Update setting
   */
  async update(key, settingData) {
    try {
      const {
        value, type, description, validationRules, dependencies, permissions
      } = settingData;
      
      const updates = [];
      const params = [];
      
      if (value !== undefined) {
        updates.push('value = ?');
        params.push(this.stringifyValue(value, type || 'string'));
      }
      
      if (type !== undefined) {
        updates.push('type = ?');
        params.push(type);
      }
      
      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description || null);
      }
      
      if (validationRules !== undefined) {
        updates.push('validationRules = ?');
        params.push(validationRules ? JSON.stringify(validationRules) : null);
      }
      
      if (dependencies !== undefined) {
        updates.push('dependencies = ?');
        params.push(dependencies ? JSON.stringify(dependencies) : null);
      }
      
      if (permissions !== undefined) {
        updates.push('permissions = ?');
        params.push(permissions ? JSON.stringify(permissions) : null);
      }
      
      if (updates.length === 0) {
        return await this.findByKey(key);
      }
      
      params.push(key);
      
      await db.execute(
        `UPDATE SystemSetting SET ${updates.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE \`key\` = ?`,
        params
      );
      
      return await this.findByKey(key);
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }
  
  /**
   * Delete setting (soft delete)
   */
  async delete(key) {
    try {
      await db.execute(
        'DELETE FROM SystemSetting WHERE `key` = ?',
        [key]
      );
      return true;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }
  
  /**
   * Get setting by ID
   */
  async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM SystemSetting WHERE id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      const row = rows[0];
      return {
        ...row,
        value: this.parseValue(row.value, row.type),
        validationRules: row.validationRules ? JSON.parse(row.validationRules) : null,
        dependencies: row.dependencies ? JSON.parse(row.dependencies) : null,
        permissions: row.permissions ? JSON.parse(row.permissions) : null,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
        isEncrypted: Boolean(row.isEncrypted),
        isSystem: Boolean(row.isSystem),
        isPublic: Boolean(row.isPublic)
      };
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
  }
  
  /**
   * Count settings
   */
  async count(filters = {}) {
    try {
      let where = [];
      const params = [];
      
      if (filters.category) {
        where.push('category = ?');
        params.push(filters.category);
      }
      
      if (filters.environment) {
        where.push('(environment = ? OR environment = ?)');
        params.push(filters.environment, 'all');
      }
      
      if (filters.search) {
        where.push('(`key` LIKE ? OR description LIKE ?)');
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }
      
      // Build WHERE clause - if no conditions, use 1=1 to avoid syntax error
      const whereClause = where.length > 0 ? where.join(' AND ') : '1=1';
      const [rows] = await db.execute(
        `SELECT COUNT(*) as count FROM SystemSetting WHERE ${whereClause}`,
        params
      );
      
      return rows[0].count;
    } catch (error) {
      console.error('Error in count:', error);
      throw error;
    }
  }
  
  /**
   * Parse value based on type
   */
  parseValue(value, type) {
    if (value === null || value === undefined) {
      return null;
    }
    
    switch (type) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value === 'true' || value === true || value === 1;
      case 'json':
        try {
          return typeof value === 'string' ? JSON.parse(value) : value;
        } catch (e) {
          return value;
        }
      default:
        return value;
    }
  }
  
  /**
   * Stringify value based on type
   */
  stringifyValue(value, type) {
    if (value === null || value === undefined) {
      return null;
    }
    
    switch (type) {
      case 'json':
        return typeof value === 'string' ? value : JSON.stringify(value);
      case 'boolean':
        return value ? 'true' : 'false';
      default:
        return String(value);
    }
  }
}

module.exports = new SettingsRepository();

