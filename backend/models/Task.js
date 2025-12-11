const db = require('../db');

class Task {
  /**
   * إنشاء مهمة جديدة
   */
  static async create(data) {
    try {
      const [result] = await db.query(`
        INSERT INTO Tasks (
          technicianId, title, description, taskType, repairId, deviceId,
          priority, status, category, dueDate, dueTime, estimatedDuration, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.technicianId,
        data.title,
        data.description || null,
        data.taskType || 'general',
        data.repairId || null,
        data.deviceId || null,
        data.priority || 'medium',
        data.status || 'todo',
        data.category || null,
        data.dueDate || null,
        data.dueTime || null,
        data.estimatedDuration || null,
        data.tags ? JSON.stringify(data.tags) : null
      ]);

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * جلب المهام
   */
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT 
          t.*,
          CONCAT('REP-', DATE_FORMAT(r.createdAt, '%Y%m%d'), '-', LPAD(r.id, 3, '0')) as repairNumber,
          CONCAT(COALESCE(d.brand, ''), ' ', COALESCE(d.model, '')) as deviceName,
          c.name as customerName
        FROM Tasks t
        LEFT JOIN RepairRequest r ON t.repairId = r.id
        LEFT JOIN Device d ON (t.deviceId = d.id OR (t.deviceId IS NULL AND r.deviceId = d.id))
        LEFT JOIN Customer c ON r.customerId = c.id
        WHERE t.deletedAt IS NULL
      `;
      const params = [];

      if (filters.technicianId) {
        query += ' AND t.technicianId = ?';
        params.push(filters.technicianId);
      }

      if (filters.status) {
        query += ' AND t.status = ?';
        params.push(filters.status);
      }

      if (filters.priority) {
        query += ' AND t.priority = ?';
        params.push(filters.priority);
      }

      if (filters.taskType) {
        query += ' AND t.taskType = ?';
        params.push(filters.taskType);
      }

      if (filters.repairId) {
        query += ' AND t.repairId = ?';
        params.push(filters.repairId);
      }

      if (filters.search) {
        query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }

      // الترتيب
      const orderBy = filters.orderBy || 'createdAt';
      const orderDir = filters.orderDir || 'DESC';
      query += ` ORDER BY t.${orderBy} ${orderDir}`;

      // Pagination
      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
        if (filters.offset) {
          query += ' OFFSET ?';
          params.push(filters.offset);
        }
      }

      const [result] = await db.query(query, params);
      
      // Parse JSON fields
      return result.map(task => ({
        ...task,
        tags: task.tags ? JSON.parse(task.tags) : [],
        attachments: task.attachments ? JSON.parse(task.attachments) : []
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * جلب مهمة محددة
   */
  static async findById(id, technicianId = null) {
    try {
      let query = `
        SELECT 
          t.*,
          CONCAT('REP-', DATE_FORMAT(r.createdAt, '%Y%m%d'), '-', LPAD(r.id, 3, '0')) as repairNumber,
          CONCAT(COALESCE(d.brand, ''), ' ', COALESCE(d.model, '')) as deviceName,
          c.name as customerName
        FROM Tasks t
        LEFT JOIN RepairRequest r ON t.repairId = r.id
        LEFT JOIN Device d ON (t.deviceId = d.id OR (t.deviceId IS NULL AND r.deviceId = d.id))
        LEFT JOIN Customer c ON r.customerId = c.id
        WHERE t.id = ? AND t.deletedAt IS NULL
      `;
      const params = [id];

      if (technicianId) {
        query += ' AND t.technicianId = ?';
        params.push(technicianId);
      }

      const [result] = await db.query(query, params);
      
      if (result.length === 0) {
        return null;
      }

      const task = result[0];
      return {
        ...task,
        tags: task.tags ? JSON.parse(task.tags) : [],
        attachments: task.attachments ? JSON.parse(task.attachments) : []
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * تحديث مهمة
   */
  static async update(id, technicianId, data) {
    try {
      const updates = [];
      const params = [];

      if (data.title !== undefined) {
        updates.push('title = ?');
        params.push(data.title);
      }

      if (data.description !== undefined) {
        updates.push('description = ?');
        params.push(data.description);
      }

      if (data.status !== undefined) {
        updates.push('status = ?');
        params.push(data.status);
        
        // إذا تم إكمال المهمة، تحديث completedAt
        if (data.status === 'done') {
          updates.push('completedAt = NOW()');
        }
      }

      if (data.priority !== undefined) {
        updates.push('priority = ?');
        params.push(data.priority);
      }

      if (data.dueDate !== undefined) {
        updates.push('dueDate = ?');
        params.push(data.dueDate);
      }

      if (data.dueTime !== undefined) {
        updates.push('dueTime = ?');
        params.push(data.dueTime);
      }

      if (data.estimatedDuration !== undefined) {
        updates.push('estimatedDuration = ?');
        params.push(data.estimatedDuration);
      }

      if (data.tags !== undefined) {
        updates.push('tags = ?');
        params.push(JSON.stringify(data.tags));
      }

      if (updates.length === 0) {
        throw new Error('لا توجد تحديثات');
      }

      params.push(id, technicianId);

      const [result] = await db.query(`
        UPDATE Tasks 
        SET ${updates.join(', ')}, updatedAt = NOW()
        WHERE id = ? AND technicianId = ?
      `, params);

      if (result.affectedRows === 0) {
        throw new Error('لم يتم العثور على المهمة');
      }

      return await this.findById(id, technicianId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * حذف مهمة (ناعم)
   */
  static async delete(id, technicianId) {
    try {
      const [result] = await db.query(`
        UPDATE Tasks 
        SET deletedAt = NOW()
        WHERE id = ? AND technicianId = ?
      `, [id, technicianId]);

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * إحصائيات المهام
   */
  static async getStats(technicianId, filters = {}) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgress,
          SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
        FROM Tasks
        WHERE technicianId = ? AND deletedAt IS NULL
      `;
      const params = [technicianId];

      if (filters.startDate) {
        query += ' AND DATE(createdAt) >= ?';
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ' AND DATE(createdAt) <= ?';
        params.push(filters.endDate);
      }

      const [result] = await db.query(query, params);
      return result[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Task;

