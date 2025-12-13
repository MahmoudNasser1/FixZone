const db = require('../db');

/**
 * Get wages for a technician
 */
exports.getWages = async (req, res) => {
  try {
    const { id } = req.params;
    const { periodStart, periodEnd, paymentStatus } = req.query;
    
    let query = `
      SELECT 
        tw.*,
        u.name as technicianName
      FROM TechnicianWages tw
      INNER JOIN User u ON tw.technicianId = u.id
      WHERE tw.technicianId = ?
    `;
    
    const params = [id];
    
    if (periodStart && periodEnd) {
      query += ` AND tw.periodStart >= ? AND tw.periodEnd <= ?`;
      params.push(periodStart, periodEnd);
    }
    
    if (paymentStatus) {
      query += ` AND tw.paymentStatus = ?`;
      params.push(paymentStatus);
    }
    
    query += ` ORDER BY tw.periodEnd DESC LIMIT 24`;
    
    const [wages] = await db.query(query, params);
    
    res.json({ success: true, data: wages });
  } catch (err) {
    console.error('Error fetching wages:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
};

/**
 * Create a wage record
 */
exports.createWage = async (req, res) => {
  try {
    const { id } = req.params;
    const { periodStart, periodEnd, baseSalary, commission, bonuses, deductions, paymentDate, notes } = req.body;
    
    if (!periodStart || !periodEnd) {
      return res.status(400).json({ success: false, error: 'بداية ونهاية الفترة مطلوبتان' });
    }
    
    // Calculate total earnings
    const totalEarnings = (parseFloat(baseSalary || 0) + 
                          parseFloat(commission || 0) + 
                          parseFloat(bonuses || 0) - 
                          parseFloat(deductions || 0));
    
    const [result] = await db.query(`
      INSERT INTO TechnicianWages 
      (technicianId, periodStart, periodEnd, baseSalary, commission, bonuses, deductions, totalEarnings, paymentDate, notes, paymentStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [id, periodStart, periodEnd, baseSalary || 0, commission || 0, bonuses || 0, deductions || 0, totalEarnings, paymentDate || null, notes || null]);
    
    const [newWage] = await db.query('SELECT * FROM TechnicianWages WHERE id = ?', [result.insertId]);
    
    res.status(201).json({ success: true, data: newWage[0] });
  } catch (err) {
    console.error('Error creating wage:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
};

/**
 * Calculate wages automatically
 */
exports.calculateWages = async (req, res) => {
  try {
    const { id } = req.params;
    const { periodStart, periodEnd } = req.body;
    
    if (!periodStart || !periodEnd) {
      return res.status(400).json({ success: false, error: 'بداية ونهاية الفترة مطلوبتان' });
    }
    
    // Get completed repairs in period
    const [repairs] = await db.query(`
      SELECT 
        COUNT(*) as totalRepairs,
        SUM(COALESCE(totalCost, 0)) as totalRevenue
      FROM RepairRequest
      WHERE technicianId = ?
        AND status = 'completed'
        AND DATE(updatedAt) BETWEEN ? AND ?
        AND deletedAt IS NULL
    `, [id, periodStart, periodEnd]);
    
    // Get time spent
    const [timeStats] = await db.query(`
      SELECT 
        SUM(COALESCE(duration, 0)) as totalSeconds
      FROM TimeTracking
      WHERE technicianId = ?
        AND DATE(createdAt) BETWEEN ? AND ?
        AND status = 'completed'
    `, [id, periodStart, periodEnd]);
    
    // TODO: Get base salary from technician settings or default
    const baseSalary = 0; // Should be fetched from technician settings
    const commissionRate = 0.1; // 10% - Should be fetched from technician settings
    const hourlyRate = 50; // Should be fetched from technician settings
    
    const totalRevenue = parseFloat(repairs[0]?.totalRevenue || 0);
    const commission = totalRevenue * commissionRate;
    const totalHours = parseFloat(timeStats[0]?.totalSeconds || 0) / 3600;
    const timeBasedEarnings = totalHours * hourlyRate;
    
    const bonuses = 0; // Can be calculated based on performance
    const deductions = 0; // Can be calculated based on absences, etc.
    
    const totalEarnings = baseSalary + commission + timeBasedEarnings + bonuses - deductions;
    
    // Check if wage record already exists
    const [existing] = await db.query(`
      SELECT id FROM TechnicianWages
      WHERE technicianId = ? AND periodStart = ? AND periodEnd = ?
    `, [id, periodStart, periodEnd]);
    
    let wageRecord;
    if (existing.length > 0) {
      // Update existing
      await db.query(`
        UPDATE TechnicianWages
        SET baseSalary = ?, commission = ?, bonuses = ?, deductions = ?, totalEarnings = ?
        WHERE id = ?
      `, [baseSalary, commission, bonuses, deductions, totalEarnings, existing[0].id]);
      
      const [updated] = await db.query('SELECT * FROM TechnicianWages WHERE id = ?', [existing[0].id]);
      wageRecord = updated[0];
    } else {
      // Create new
      const [result] = await db.query(`
        INSERT INTO TechnicianWages 
        (technicianId, periodStart, periodEnd, baseSalary, commission, bonuses, deductions, totalEarnings, paymentStatus)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `, [id, periodStart, periodEnd, baseSalary, commission, bonuses, deductions, totalEarnings]);
      
      const [newWage] = await db.query('SELECT * FROM TechnicianWages WHERE id = ?', [result.insertId]);
      wageRecord = newWage[0];
    }
    
    res.json({
      success: true,
      data: {
        wage: wageRecord,
        calculations: {
          totalRepairs: repairs[0]?.totalRepairs || 0,
          totalRevenue,
          totalHours: totalHours.toFixed(2),
          baseSalary,
          commission: commission.toFixed(2),
          timeBasedEarnings: timeBasedEarnings.toFixed(2),
          bonuses,
          deductions,
          totalEarnings: totalEarnings.toFixed(2)
        }
      }
    });
  } catch (err) {
    console.error('Error calculating wages:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
};

/**
 * Update a wage record
 */
exports.updateWage = async (req, res) => {
  try {
    const { id, wageId } = req.params;
    const { baseSalary, commission, bonuses, deductions, paymentDate, paymentStatus, notes } = req.body;
    
    const [existing] = await db.query(
      'SELECT * FROM TechnicianWages WHERE id = ? AND technicianId = ?',
      [wageId, id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'سجل الأجر غير موجود' });
    }
    
    const updateData = {};
    if (baseSalary !== undefined) updateData.baseSalary = baseSalary;
    if (commission !== undefined) updateData.commission = commission;
    if (bonuses !== undefined) updateData.bonuses = bonuses;
    if (deductions !== undefined) updateData.deductions = deductions;
    if (paymentDate !== undefined) updateData.paymentDate = paymentDate;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (notes !== undefined) updateData.notes = notes;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: 'لا توجد بيانات للتحديث' });
    }
    
    // Recalculate total earnings if financial fields changed
    if (baseSalary !== undefined || commission !== undefined || bonuses !== undefined || deductions !== undefined) {
      const finalBaseSalary = baseSalary !== undefined ? baseSalary : existing[0].baseSalary;
      const finalCommission = commission !== undefined ? commission : existing[0].commission;
      const finalBonuses = bonuses !== undefined ? bonuses : existing[0].bonuses;
      const finalDeductions = deductions !== undefined ? deductions : existing[0].deductions;
      updateData.totalEarnings = finalBaseSalary + finalCommission + finalBonuses - finalDeductions;
    }
    
    const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), wageId, id];
    
    await db.query(`
      UPDATE TechnicianWages 
      SET ${setClause}
      WHERE id = ? AND technicianId = ?
    `, values);
    
    const [updated] = await db.query('SELECT * FROM TechnicianWages WHERE id = ?', [wageId]);
    
    res.json({ success: true, data: updated[0] });
  } catch (err) {
    console.error('Error updating wage:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
};


