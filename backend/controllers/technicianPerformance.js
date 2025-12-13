const db = require('../db');

/**
 * Get performance data for a technician
 */
exports.getPerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const { periodStart, periodEnd } = req.query;
    
    let query = `
      SELECT 
        tp.*,
        u.name as technicianName
      FROM TechnicianPerformance tp
      INNER JOIN User u ON tp.technicianId = u.id
      WHERE tp.technicianId = ?
    `;
    
    const params = [id];
    
    if (periodStart && periodEnd) {
      query += ` AND tp.periodStart >= ? AND tp.periodEnd <= ?`;
      params.push(periodStart, periodEnd);
    }
    
    query += ` ORDER BY tp.periodStart DESC LIMIT 12`;
    
    const [performance] = await db.query(query, params);
    
    res.json({ success: true, data: performance });
  } catch (err) {
    console.error('Error fetching performance:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
};

/**
 * Get performance statistics
 */
exports.getPerformanceStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get repair stats
    const [repairStats] = await db.query(`
      SELECT 
        COUNT(*) as totalRepairs,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedRepairs,
        AVG(TIMESTAMPDIFF(MINUTE, createdAt, updatedAt)) as averageTime
      FROM RepairRequest
      WHERE technicianId = ? AND deletedAt IS NULL
    `, [id]);
    
    // Get recent performance
    const [recentPerformance] = await db.query(`
      SELECT * FROM TechnicianPerformance
      WHERE technicianId = ?
      ORDER BY periodEnd DESC
      LIMIT 1
    `, [id]);
    
    // Get average ratings
    const [ratings] = await db.query(`
      SELECT 
        AVG(overallScore) as averageRating,
        COUNT(*) as totalEvaluations
      FROM TechnicianEvaluations
      WHERE technicianId = ?
    `, [id]);
    
    res.json({
      success: true,
      data: {
        repairs: repairStats[0] || {},
        recentPerformance: recentPerformance[0] || null,
        ratings: ratings[0] || { averageRating: 0, totalEvaluations: 0 }
      }
    });
  } catch (err) {
    console.error('Error fetching performance stats:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
};

/**
 * Evaluate a technician
 */
exports.evaluateTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const { evaluationType, repairId, criteria, overallScore, comments } = req.body;
    const evaluatedBy = req.user?.id;
    
    if (!evaluationType || !overallScore) {
      return res.status(400).json({ success: false, error: 'نوع التقييم والنتيجة الإجمالية مطلوبان' });
    }
    
    const [result] = await db.query(`
      INSERT INTO TechnicianEvaluations 
      (technicianId, evaluatedBy, evaluationType, repairId, criteria, overallScore, comments, evaluationDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())
    `, [id, evaluatedBy, evaluationType, repairId || null, JSON.stringify(criteria || {}), overallScore, comments || null]);
    
    const [newEvaluation] = await db.query(`
      SELECT 
        te.*,
        u.name as evaluatedByName
      FROM TechnicianEvaluations te
      LEFT JOIN User u ON te.evaluatedBy = u.id
      WHERE te.id = ?
    `, [result.insertId]);
    
    res.status(201).json({ success: true, data: newEvaluation[0] });
  } catch (err) {
    console.error('Error evaluating technician:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
};

/**
 * Get evaluations for a technician
 */
exports.getEvaluations = async (req, res) => {
  try {
    const { id } = req.params;
    const { evaluationType } = req.query;
    
    let query = `
      SELECT 
        te.*,
        u.name as evaluatedByName,
        CONCAT("REP-", YEAR(rr.createdAt), LPAD(MONTH(rr.createdAt), 2, "0"), LPAD(DAY(rr.createdAt), 2, "0"), "-", LPAD(rr.id, 3, "0")) as requestNumber
      FROM TechnicianEvaluations te
      LEFT JOIN User u ON te.evaluatedBy = u.id
      LEFT JOIN RepairRequest rr ON te.repairId = rr.id
      WHERE te.technicianId = ?
    `;
    
    const params = [id];
    
    if (evaluationType) {
      query += ` AND te.evaluationType = ?`;
      params.push(evaluationType);
    }
    
    query += ` ORDER BY te.evaluationDate DESC, te.createdAt DESC`;
    
    const [evaluations] = await db.query(query, params);
    
    // Parse JSON criteria
    const parsed = evaluations.map(eval => ({
      ...eval,
      criteria: typeof eval.criteria === 'string' ? JSON.parse(eval.criteria) : eval.criteria
    }));
    
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('Error fetching evaluations:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
};

