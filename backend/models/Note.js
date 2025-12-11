const db = require('../db');

class Note {
  /**
   * إنشاء ملاحظة جديدة
   */
  static async create(data) {
    try {
      const [result] = await db.query(`
        INSERT INTO Notes (
          technicianId, noteType, deviceId, repairId, taskId,
          title, content, category, priority, tags, isPrivate,
          reminderDate, reminderTime
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.technicianId,
        data.noteType,
        data.deviceId || null,
        data.repairId || null,
        data.taskId || null,
        data.title || null,
        data.content,
        data.category || null,
        data.priority || 'medium',
        data.tags ? JSON.stringify(data.tags) : null,
        data.isPrivate || false,
        data.reminderDate || null,
        data.reminderTime || null
      ]);

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * جلب الملاحظات
   */
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT 
          n.*,
          CONCAT(COALESCE(d.brand, ''), ' ', COALESCE(d.model, '')) as deviceName,
          CONCAT('REP-', DATE_FORMAT(r.createdAt, '%Y%m%d'), '-', LPAD(r.id, 3, '0')) as repairNumber,
          c.name as customerName
        FROM Notes n
        LEFT JOIN Device d ON n.deviceId = d.id
        LEFT JOIN RepairRequest r ON n.repairId = r.id
        LEFT JOIN Customer c ON r.customerId = c.id
        WHERE n.deletedAt IS NULL
      `;
      const params = [];

      if (filters.technicianId) {
        query += ' AND n.technicianId = ?';
        params.push(filters.technicianId);
      }

      if (filters.noteType) {
        query += ' AND n.noteType = ?';
        params.push(filters.noteType);
      }

      if (filters.deviceId) {
        query += ' AND n.deviceId = ?';
        params.push(filters.deviceId);
      }

      if (filters.repairId) {
        query += ' AND n.repairId = ?';
        params.push(filters.repairId);
      }

      if (filters.category) {
        query += ' AND n.category = ?';
        params.push(filters.category);
      }

      if (filters.search) {
        query += ' AND (n.title LIKE ? OR n.content LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }

      query += ' ORDER BY n.createdAt DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const [result] = await db.query(query, params);
      
      return result.map(note => ({
        ...note,
        tags: note.tags ? JSON.parse(note.tags) : []
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * جلب ملاحظة محددة
   */
  static async findById(id, technicianId = null) {
    try {
      let query = `
        SELECT 
          n.*,
          CONCAT(COALESCE(d.brand, ''), ' ', COALESCE(d.model, '')) as deviceName,
          CONCAT('REP-', DATE_FORMAT(r.createdAt, '%Y%m%d'), '-', LPAD(r.id, 3, '0')) as repairNumber
        FROM Notes n
        LEFT JOIN Device d ON n.deviceId = d.id
        LEFT JOIN RepairRequest r ON n.repairId = r.id
        WHERE n.id = ? AND n.deletedAt IS NULL
      `;
      const params = [id];

      if (technicianId) {
        query += ' AND n.technicianId = ?';
        params.push(technicianId);
      }

      const [result] = await db.query(query, params);
      
      if (result.length === 0) {
        return null;
      }

      const note = result[0];
      return {
        ...note,
        tags: note.tags ? JSON.parse(note.tags) : []
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * تحديث ملاحظة
   */
  static async update(id, technicianId, data) {
    try {
      const updates = [];
      const params = [];

      if (data.title !== undefined) {
        updates.push('title = ?');
        params.push(data.title);
      }

      if (data.content !== undefined) {
        updates.push('content = ?');
        params.push(data.content);
      }

      if (data.category !== undefined) {
        updates.push('category = ?');
        params.push(data.category);
      }

      if (data.priority !== undefined) {
        updates.push('priority = ?');
        params.push(data.priority);
      }

      if (data.tags !== undefined) {
        updates.push('tags = ?');
        params.push(JSON.stringify(data.tags));
      }

      if (data.reminderDate !== undefined) {
        updates.push('reminderDate = ?');
        params.push(data.reminderDate);
      }

      if (data.reminderTime !== undefined) {
        updates.push('reminderTime = ?');
        params.push(data.reminderTime);
      }

      if (updates.length === 0) {
        throw new Error('لا توجد تحديثات');
      }

      params.push(id, technicianId);

      const [result] = await db.query(`
        UPDATE Notes 
        SET ${updates.join(', ')}, updatedAt = NOW()
        WHERE id = ? AND technicianId = ?
      `, params);

      if (result.affectedRows === 0) {
        throw new Error('لم يتم العثور على الملاحظة');
      }

      return await this.findById(id, technicianId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * حذف ملاحظة (ناعم)
   */
  static async delete(id, technicianId) {
    try {
      const [result] = await db.query(`
        UPDATE Notes 
        SET deletedAt = NOW()
        WHERE id = ? AND technicianId = ?
      `, [id, technicianId]);

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * جلب التذكيرات
   */
  static async getReminders(technicianId, date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const [result] = await db.query(`
        SELECT * FROM Notes
        WHERE technicianId = ?
          AND reminderDate = ?
          AND reminderSent = false
          AND deletedAt IS NULL
        ORDER BY reminderTime ASC
      `, [technicianId, targetDate]);

      return result.map(note => ({
        ...note,
        tags: note.tags ? JSON.parse(note.tags) : []
      }));
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Note;

