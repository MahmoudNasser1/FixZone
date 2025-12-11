const db = require('../db');

class TimeTracking {
  /**
   * بدء تتبع الوقت
   */
  static async start(technicianId, repairId = null, taskId = null) {
    try {
      // التحقق من وجود تتبع نشط
      const [active] = await db.query(`
        SELECT id FROM TimeTracking 
        WHERE technicianId = ? 
          AND status = 'running' 
          AND endTime IS NULL
        LIMIT 1
      `, [technicianId]);

      if (active.length > 0) {
        throw new Error('يوجد تتبع وقت نشط بالفعل. يرجى إيقافه أولاً');
      }

      const [result] = await db.query(`
        INSERT INTO TimeTracking (technicianId, repairId, taskId, startTime, status)
        VALUES (?, ?, ?, NOW(), 'running')
      `, [technicianId, repairId, taskId]);

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * إيقاف تتبع الوقت
   */
  static async stop(trackingId, technicianId) {
    try {
      const [result] = await db.query(`
        UPDATE TimeTracking 
        SET endTime = NOW(),
            status = 'stopped',
            duration = TIMESTAMPDIFF(SECOND, startTime, NOW())
        WHERE id = ? AND technicianId = ?
      `, [trackingId, technicianId]);

      if (result.affectedRows === 0) {
        throw new Error('لم يتم العثور على تتبع الوقت');
      }

      // جلب البيانات المحدثة
      const [updated] = await db.query(`
        SELECT * FROM TimeTracking WHERE id = ?
      `, [trackingId]);

      return updated[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * جلب التتبع النشط
   */
  static async getActive(technicianId) {
    try {
      const [result] = await db.query(`
        SELECT 
          t.*,
          r.id as repairId,
          CONCAT('REP-', DATE_FORMAT(r.createdAt, '%Y%m%d'), '-', LPAD(r.id, 3, '0')) as repairNumber,
          CONCAT(COALESCE(d.brand, ''), ' ', COALESCE(d.model, '')) as deviceName,
          c.name as customerName
        FROM TimeTracking t
        LEFT JOIN RepairRequest r ON t.repairId = r.id
        LEFT JOIN Device d ON r.deviceId = d.id
        LEFT JOIN Customer c ON r.customerId = c.id
        WHERE t.technicianId = ? 
          AND t.status = 'running' 
          AND t.endTime IS NULL
        ORDER BY t.startTime DESC
        LIMIT 1
      `, [technicianId]);

      return result[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * جلب جميع التتبع للفني
   */
  static async getByTechnician(technicianId, filters = {}) {
    try {
      let query = `
        SELECT 
          t.*,
          CONCAT('REP-', DATE_FORMAT(r.createdAt, '%Y%m%d'), '-', LPAD(r.id, 3, '0')) as repairNumber,
          CONCAT(COALESCE(d.brand, ''), ' ', COALESCE(d.model, '')) as deviceName,
          c.name as customerName
        FROM TimeTracking t
        LEFT JOIN RepairRequest r ON t.repairId = r.id
        LEFT JOIN Device d ON r.deviceId = d.id
        LEFT JOIN Customer c ON r.customerId = c.id
        WHERE t.technicianId = ?
      `;
      const params = [technicianId];

      if (filters.repairId) {
        query += ' AND t.repairId = ?';
        params.push(filters.repairId);
      }

      if (filters.startDate) {
        query += ' AND DATE(t.startTime) >= ?';
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ' AND DATE(t.startTime) <= ?';
        params.push(filters.endDate);
      }

      query += ' ORDER BY t.startTime DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const [result] = await db.query(query, params);
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * حساب الوقت اليومي
   */
  static async getDailyTotal(technicianId, date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const [result] = await db.query(`
        SELECT 
          SUM(duration) as totalSeconds,
          COUNT(*) as totalSessions
        FROM TimeTracking
        WHERE technicianId = ?
          AND DATE(startTime) = ?
          AND status IN ('stopped', 'completed')
      `, [technicianId, targetDate]);

      const totalSeconds = parseInt(result[0].totalSeconds || 0);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const totalHours = (totalSeconds / 3600).toFixed(2);

      return {
        totalSeconds: totalSeconds,
        totalHours: parseFloat(totalHours),
        totalSessions: result[0].totalSessions || 0,
        hours: hours,
        minutes: minutes
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * طلب تعديل الوقت
   */
  static async requestAdjustment(trackingId, technicianId, newDuration, reason) {
    try {
      // جلب التتبع الحالي
      const [tracking] = await db.query(`
        SELECT duration FROM TimeTracking WHERE id = ? AND technicianId = ?
      `, [trackingId, technicianId]);

      if (tracking.length === 0) {
        throw new Error('لم يتم العثور على تتبع الوقت');
      }

      const oldDuration = tracking[0].duration;

      const [result] = await db.query(`
        INSERT INTO TimeAdjustments 
        (timeTrackingId, oldDuration, newDuration, reason, requestedBy, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
      `, [trackingId, oldDuration, newDuration, reason, technicianId]);

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * موافقة/رفض تعديل الوقت
   */
  static async approveAdjustment(adjustmentId, approverId, approved = true, rejectionReason = null) {
    try {
      const [result] = await db.query(`
        UPDATE TimeAdjustments
        SET status = ?,
            approvedBy = ?,
            approvedAt = NOW(),
            rejectionReason = ?
        WHERE id = ?
      `, [approved ? 'approved' : 'rejected', approverId, rejectionReason, adjustmentId]);

      if (result.affectedRows === 0) {
        throw new Error('لم يتم العثور على طلب التعديل');
      }

      // إذا تمت الموافقة، تحديث الوقت
      if (approved) {
        const [adjustment] = await db.query(`
          SELECT timeTrackingId, newDuration FROM TimeAdjustments WHERE id = ?
        `, [adjustmentId]);

        if (adjustment.length > 0) {
          await db.query(`
            UPDATE TimeTracking
            SET adjustedDuration = ?,
                adjustedBy = ?,
                adjustedAt = NOW()
            WHERE id = ?
          `, [adjustment[0].newDuration, approverId, adjustment[0].timeTrackingId]);
        }
      }

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = TimeTracking;

