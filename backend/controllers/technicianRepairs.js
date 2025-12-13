const db = require('../db');

/**
 * Get all repairs for a technician
 */
exports.getTechnicianRepairs = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, active, repairId } = req.query;
    
    let query = `
      SELECT 
        tr.*,
        CONCAT("REP-", YEAR(rr.createdAt), LPAD(MONTH(rr.createdAt), 2, "0"), LPAD(DAY(rr.createdAt), 2, "0"), "-", LPAD(rr.id, 3, "0")) as requestNumber,
        rr.status as repairStatus,
        rr.id as repairId,
        c.name as customerName,
        u.name as assignedByName,
        tech.name as technicianName
      FROM TechnicianRepairs tr
      INNER JOIN RepairRequest rr ON tr.repairId = rr.id
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN User u ON tr.assignedBy = u.id
      LEFT JOIN User tech ON tr.technicianId = tech.id
      WHERE tr.technicianId = ? AND rr.deletedAt IS NULL
    `;
    
    const params = [id];
    
    if (repairId) {
      query += ` AND tr.repairId = ?`;
      params.push(repairId);
    }
    
    if (active === 'true') {
      query += ` AND tr.status IN ('assigned', 'in_progress')`;
    } else if (status) {
      query += ` AND tr.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY tr.assignedAt DESC`;
    
    const [repairs] = await db.query(query, params);
    
    res.json({ success: true, data: repairs });
  } catch (err) {
    console.error('Error fetching technician repairs:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
};

/**
 * Get all technicians assigned to a repair
 */
exports.getRepairTechnicians = async (req, res) => {
  try {
    const { repairId } = req.params;
    
    const [technicians] = await db.query(`
      SELECT 
        tr.*,
        u.id as technicianId,
        u.name as technicianName,
        u.email as technicianEmail,
        u.phone as technicianPhone
      FROM TechnicianRepairs tr
      INNER JOIN User u ON tr.technicianId = u.id
      WHERE tr.repairId = ?
      ORDER BY tr.role DESC, tr.assignedAt ASC
    `, [repairId]);
    
    res.json({ success: true, data: technicians });
  } catch (err) {
    console.error('Error fetching repair technicians:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
};

/**
 * Get active repairs for a technician
 */
exports.getActiveRepairs = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [repairs] = await db.query(`
      SELECT 
        tr.*,
        CONCAT("REP-", YEAR(rr.createdAt), LPAD(MONTH(rr.createdAt), 2, "0"), LPAD(DAY(rr.createdAt), 2, "0"), "-", LPAD(rr.id, 3, "0")) as requestNumber,
        rr.status as repairStatus,
        rr.id as repairId,
        c.name as customerName
      FROM TechnicianRepairs tr
      INNER JOIN RepairRequest rr ON tr.repairId = rr.id
      LEFT JOIN Customer c ON rr.customerId = c.id
      WHERE tr.technicianId = ? 
        AND tr.status IN ('assigned', 'in_progress')
        AND rr.deletedAt IS NULL
      ORDER BY tr.assignedAt DESC
    `, [id]);
    
    res.json({ success: true, data: repairs });
  } catch (err) {
    console.error('Error fetching active repairs:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
};

/**
 * Assign a repair to a technician
 */
exports.assignRepair = async (req, res) => {
  try {
    const { id, repairId } = req.params;
    const { role = 'primary', notes } = req.body;
    const assignedBy = req.user?.id;
    
    // Check if repair exists
    const [repair] = await db.query(
      'SELECT id FROM RepairRequest WHERE id = ? AND deletedAt IS NULL',
      [repairId]
    );
    
    if (repair.length === 0) {
      return res.status(404).json({ success: false, error: 'الإصلاح غير موجود' });
    }
    
    // Check if already assigned
    const [existing] = await db.query(
      'SELECT id FROM TechnicianRepairs WHERE technicianId = ? AND repairId = ?',
      [id, repairId]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'الإصلاح معين بالفعل لهذا الفني' });
    }
    
    const [result] = await db.query(`
      INSERT INTO TechnicianRepairs 
      (technicianId, repairId, role, assignedBy, notes, status)
      VALUES (?, ?, ?, ?, ?, 'assigned')
    `, [id, repairId, role, assignedBy, notes || null]);
    
    const [newAssignment] = await db.query(`
      SELECT 
        tr.*,
        CONCAT("REP-", YEAR(rr.createdAt), LPAD(MONTH(rr.createdAt), 2, "0"), LPAD(DAY(rr.createdAt), 2, "0"), "-", LPAD(rr.id, 3, "0")) as requestNumber,
        rr.status as repairStatus,
        c.name as customerName
      FROM TechnicianRepairs tr
      INNER JOIN RepairRequest rr ON tr.repairId = rr.id
      LEFT JOIN Customer c ON rr.customerId = c.id
      WHERE tr.id = ?
    `, [result.insertId]);
    
    res.status(201).json({ success: true, data: newAssignment[0] });
  } catch (err) {
    console.error('Error assigning repair:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
};

/**
 * Unassign a repair from a technician
 */
exports.unassignRepair = async (req, res) => {
  try {
    const { id, repairId } = req.params;
    
    const [result] = await db.query(
      'DELETE FROM TechnicianRepairs WHERE technicianId = ? AND repairId = ?',
      [id, repairId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'التعيين غير موجود' });
    }
    
    res.json({ success: true, message: 'تم إلغاء التعيين بنجاح' });
  } catch (err) {
    console.error('Error unassigning repair:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
};

/**
 * Update repair assignment status
 */
exports.updateRepairStatus = async (req, res) => {
  try {
    const { id, repairId } = req.params;
    const { status, startedAt, completedAt, timeSpent, notes } = req.body;
    
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (startedAt !== undefined) updateData.startedAt = startedAt;
    if (completedAt !== undefined) updateData.completedAt = completedAt;
    if (timeSpent !== undefined) updateData.timeSpent = timeSpent;
    if (notes !== undefined) updateData.notes = notes;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: 'لا توجد بيانات للتحديث' });
    }
    
    const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), id, repairId];
    
    await db.query(`
      UPDATE TechnicianRepairs 
      SET ${setClause}
      WHERE technicianId = ? AND repairId = ?
    `, values);
    
    const [updated] = await db.query(`
      SELECT 
        tr.*,
        CONCAT("REP-", YEAR(rr.createdAt), LPAD(MONTH(rr.createdAt), 2, "0"), LPAD(DAY(rr.createdAt), 2, "0"), "-", LPAD(rr.id, 3, "0")) as requestNumber,
        rr.status as repairStatus
      FROM TechnicianRepairs tr
      INNER JOIN RepairRequest rr ON tr.repairId = rr.id
      WHERE tr.technicianId = ? AND tr.repairId = ?
    `, [id, repairId]);
    
    res.json({ success: true, data: updated[0] });
  } catch (err) {
    console.error('Error updating repair status:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
};

