const db = require('../db');

/**
 * Get schedule for a technician
 */
exports.getSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        ts.*,
        CONCAT("REP-", YEAR(rr.createdAt), LPAD(MONTH(rr.createdAt), 2, "0"), LPAD(DAY(rr.createdAt), 2, "0"), "-", LPAD(rr.id, 3, "0")) as requestNumber,
        rr.status as repairStatus,
        rr.id as repairId,
        c.name as customerName
      FROM TechnicianSchedules ts
      INNER JOIN RepairRequest rr ON ts.repairId = rr.id
      LEFT JOIN Customer c ON rr.customerId = c.id
      WHERE ts.technicianId = ? AND rr.deletedAt IS NULL
    `;
    
    const params = [id];
    
    if (date) {
      query += ` AND ts.scheduledDate = ?`;
      params.push(date);
    } else if (startDate && endDate) {
      query += ` AND ts.scheduledDate BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    } else {
      // Default to current month
      query += ` AND ts.scheduledDate >= DATE_FORMAT(NOW(), '%Y-%m-01') 
                 AND ts.scheduledDate < DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 1 MONTH), '%Y-%m-01')`;
    }
    
    query += ` ORDER BY ts.scheduledDate ASC, ts.scheduledTime ASC`;
    
    const [schedule] = await db.query(query, params);
    
    res.json({ success: true, data: schedule });
  } catch (err) {
    console.error('Error fetching schedule:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
};

/**
 * Schedule a repair for a technician
 */
exports.scheduleRepair = async (req, res) => {
  try {
    const { id } = req.params;
    const { repairId, scheduledDate, scheduledTime, estimatedDuration, priority, notes } = req.body;
    
    if (!repairId || !scheduledDate || !scheduledTime) {
      return res.status(400).json({ success: false, error: 'معرف الإصلاح، التاريخ، والوقت مطلوبون' });
    }
    
    // Check if repair exists
    const [repair] = await db.query(
      'SELECT id FROM RepairRequest WHERE id = ? AND deletedAt IS NULL',
      [repairId]
    );
    
    if (repair.length === 0) {
      return res.status(404).json({ success: false, error: 'الإصلاح غير موجود' });
    }
    
    // Check for conflicts
    const [conflicts] = await db.query(`
      SELECT id FROM TechnicianSchedules
      WHERE technicianId = ? 
        AND scheduledDate = ?
        AND status != 'cancelled'
        AND (
          (scheduledTime <= ? AND ADDTIME(scheduledTime, SEC_TO_TIME(COALESCE(estimatedDuration, 60) * 60)) > ?)
          OR (scheduledTime < ADDTIME(?, SEC_TO_TIME(COALESCE(estimatedDuration, 60) * 60)) AND ADDTIME(scheduledTime, SEC_TO_TIME(COALESCE(estimatedDuration, 60) * 60)) >= ?)
        )
    `, [id, scheduledDate, scheduledTime, scheduledTime, scheduledTime, scheduledTime]);
    
    if (conflicts.length > 0) {
      return res.status(400).json({ success: false, error: 'يوجد تعارض في الجدول' });
    }
    
    const [result] = await db.query(`
      INSERT INTO TechnicianSchedules 
      (technicianId, repairId, scheduledDate, scheduledTime, estimatedDuration, priority, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')
    `, [id, repairId, scheduledDate, scheduledTime, estimatedDuration || null, priority || 'medium', notes || null]);
    
    const [newSchedule] = await db.query(`
      SELECT 
        ts.*,
        CONCAT("REP-", YEAR(rr.createdAt), LPAD(MONTH(rr.createdAt), 2, "0"), LPAD(DAY(rr.createdAt), 2, "0"), "-", LPAD(rr.id, 3, "0")) as requestNumber,
        rr.status as repairStatus,
        c.name as customerName
      FROM TechnicianSchedules ts
      INNER JOIN RepairRequest rr ON ts.repairId = rr.id
      LEFT JOIN Customer c ON rr.customerId = c.id
      WHERE ts.id = ?
    `, [result.insertId]);
    
    res.status(201).json({ success: true, data: newSchedule[0] });
  } catch (err) {
    console.error('Error scheduling repair:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
};

/**
 * Update a schedule
 */
exports.updateSchedule = async (req, res) => {
  try {
    const { id, scheduleId } = req.params;
    const { scheduledDate, scheduledTime, estimatedDuration, priority, status, notes } = req.body;
    
    const [existing] = await db.query(
      'SELECT * FROM TechnicianSchedules WHERE id = ? AND technicianId = ?',
      [scheduleId, id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'الجدول غير موجود' });
    }
    
    const updateData = {};
    if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate;
    if (scheduledTime !== undefined) updateData.scheduledTime = scheduledTime;
    if (estimatedDuration !== undefined) updateData.estimatedDuration = estimatedDuration;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: 'لا توجد بيانات للتحديث' });
    }
    
    const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), scheduleId, id];
    
    await db.query(`
      UPDATE TechnicianSchedules 
      SET ${setClause}
      WHERE id = ? AND technicianId = ?
    `, values);
    
    const [updated] = await db.query(`
      SELECT 
        ts.*,
        CONCAT("REP-", YEAR(rr.createdAt), LPAD(MONTH(rr.createdAt), 2, "0"), LPAD(DAY(rr.createdAt), 2, "0"), "-", LPAD(rr.id, 3, "0")) as requestNumber,
        rr.status as repairStatus
      FROM TechnicianSchedules ts
      INNER JOIN RepairRequest rr ON ts.repairId = rr.id
      WHERE ts.id = ?
    `, [scheduleId]);
    
    res.json({ success: true, data: updated[0] });
  } catch (err) {
    console.error('Error updating schedule:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
};

/**
 * Delete a schedule
 */
exports.deleteSchedule = async (req, res) => {
  try {
    const { id, scheduleId } = req.params;
    
    const [result] = await db.query(
      'DELETE FROM TechnicianSchedules WHERE id = ? AND technicianId = ?',
      [scheduleId, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'الجدول غير موجود' });
    }
    
    res.json({ success: true, message: 'تم حذف الجدول بنجاح' });
  } catch (err) {
    console.error('Error deleting schedule:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
};

