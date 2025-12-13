const db = require('../db');

class TechnicianAnalyticsController {
  /**
   * الحصول على اتجاهات الأداء
   * @param {number} technicianId - معرف الفني
   * @param {string} period - 'week' | 'month' | 'year'
   */
  async getPerformanceTrends(req, res) {
    try {
      const { id: technicianId } = req.params;
      const { period = 'month' } = req.query;

      let dateFilter = '';
      const params = [technicianId];

      switch (period) {
        case 'week':
          dateFilter = 'AND tr.assignedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
          break;
        case 'month':
          dateFilter = 'AND tr.assignedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
          break;
        case 'year':
          dateFilter = 'AND tr.assignedAt >= DATE_SUB(NOW(), INTERVAL 365 DAY)';
          break;
      }

      const query = `
        SELECT 
          DATE(tr.assignedAt) as date,
          COUNT(DISTINCT tr.repairId) as repairsCount,
          COUNT(DISTINCT CASE WHEN tr.status = 'completed' THEN tr.repairId END) as completedCount,
          AVG(CASE WHEN tr.status = 'completed' THEN tr.timeSpent END) as avgTimeSpent,
          SUM(CASE WHEN tr.status = 'completed' THEN tr.timeSpent END) as totalTimeSpent
        FROM TechnicianRepairs tr
        WHERE tr.technicianId = ? ${dateFilter}
        GROUP BY DATE(tr.assignedAt)
        ORDER BY date ASC
      `;

      const [rows] = await db.execute(query, params);

      res.json({
        success: true,
        data: rows,
        period
      });
    } catch (error) {
      console.error('Error getting performance trends:', error);
      res.status(500).json({
        success: false,
        error: 'Server Error',
        details: error.message
      });
    }
  }

  /**
   * تحليل الكفاءة
   * @param {number} technicianId - معرف الفني
   * @param {string} period - 'week' | 'month' | 'year'
   */
  async getEfficiencyAnalysis(req, res) {
    try {
      const { id: technicianId } = req.params;
      const { period = 'month' } = req.query;

      let dateFilter = '';
      const params = [technicianId];

      switch (period) {
        case 'week':
          dateFilter = 'AND tr.assignedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
          break;
        case 'month':
          dateFilter = 'AND tr.assignedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
          break;
        case 'year':
          dateFilter = 'AND tr.assignedAt >= DATE_SUB(NOW(), INTERVAL 365 DAY)';
          break;
      }

      const query = `
        SELECT 
          COUNT(DISTINCT tr.repairId) as totalRepairs,
          COUNT(DISTINCT CASE WHEN tr.status = 'completed' THEN tr.repairId END) as completedRepairs,
          COUNT(DISTINCT CASE WHEN tr.status = 'in_progress' THEN tr.repairId END) as inProgressRepairs,
          AVG(CASE WHEN tr.status = 'completed' THEN tr.timeSpent END) as avgTimeSpent,
          MIN(CASE WHEN tr.status = 'completed' THEN tr.timeSpent END) as minTimeSpent,
          MAX(CASE WHEN tr.status = 'completed' THEN tr.timeSpent END) as maxTimeSpent,
          SUM(CASE WHEN tr.status = 'completed' THEN tr.timeSpent END) as totalTimeSpent,
          (COUNT(DISTINCT CASE WHEN tr.status = 'completed' THEN tr.repairId END) / 
           NULLIF(COUNT(DISTINCT tr.repairId), 0) * 100) as completionRate
        FROM TechnicianRepairs tr
        WHERE tr.technicianId = ? ${dateFilter}
      `;

      const [rows] = await db.execute(query, params);
      const efficiency = rows[0] || {};

      // حساب الكفاءة بناءً على معدل الإنجاز والوقت
      const efficiencyScore = efficiency.completionRate 
        ? (parseFloat(efficiency.completionRate) * 0.7 + 
           (efficiency.avgTimeSpent ? Math.min(100, (100 - (efficiency.avgTimeSpent / 60))) * 0.3 : 0))
        : 0;

      res.json({
        success: true,
        data: {
          ...efficiency,
          efficiencyScore: Math.round(efficiencyScore * 10) / 10
        },
        period
      });
    } catch (error) {
      console.error('Error getting efficiency analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Server Error',
        details: error.message
      });
    }
  }

  /**
   * مقارنة بين الفنيين
   * @param {object} filters - { startDate, endDate, technicianIds }
   */
  async getComparativeAnalysis(req, res) {
    try {
      const { startDate, endDate, technicianIds } = req.query;

      let query = `
        SELECT 
          u.id as technicianId,
          u.name as technicianName,
          COUNT(DISTINCT tr.repairId) as totalRepairs,
          COUNT(DISTINCT CASE WHEN tr.status = 'completed' THEN tr.repairId END) as completedRepairs,
          AVG(CASE WHEN tr.status = 'completed' THEN tr.timeSpent END) as avgTimeSpent,
          COUNT(DISTINCT ts.id) as skillsCount,
          COUNT(DISTINCT tw.id) as wagesRecordsCount,
          AVG(CASE WHEN te.overallScore IS NOT NULL THEN te.overallScore END) as avgEvaluationScore
        FROM User u
        INNER JOIN Role r ON u.roleId = r.id
        LEFT JOIN TechnicianRepairs tr ON u.id = tr.technicianId
        LEFT JOIN TechnicianSkills ts ON u.id = ts.technicianId
        LEFT JOIN TechnicianWages tw ON u.id = tw.technicianId
        LEFT JOIN TechnicianEvaluations te ON u.id = te.technicianId
        WHERE LOWER(TRIM(r.name)) = 'technician' AND u.deletedAt IS NULL
      `;
      const params = [];

      if (technicianIds) {
        const ids = technicianIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        if (ids.length > 0) {
          query += ` AND u.id IN (${ids.map(() => '?').join(',')})`;
          params.push(...ids);
        }
      }

      if (startDate) {
        query += ' AND (tr.assignedAt >= ? OR tr.assignedAt IS NULL)';
        params.push(startDate);
      }
      if (endDate) {
        query += ' AND (tr.assignedAt <= ? OR tr.assignedAt IS NULL)';
        params.push(endDate);
      }

      query += ' GROUP BY u.id, u.name ORDER BY completedRepairs DESC';

      const [rows] = await db.execute(query, params);

      res.json({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error('Error getting comparative analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Server Error',
        details: error.message
      });
    }
  }

  /**
   * توقعات الأداء
   * @param {number} technicianId - معرف الفني
   */
  async getPredictiveInsights(req, res) {
    try {
      const { id: technicianId } = req.params;

      // جلب بيانات الأداء التاريخي
      const [historicalData] = await db.execute(`
        SELECT 
          COUNT(DISTINCT tr.repairId) as totalRepairs,
          COUNT(DISTINCT CASE WHEN tr.status = 'completed' THEN tr.repairId END) as completedRepairs,
          AVG(CASE WHEN tr.status = 'completed' THEN tr.timeSpent END) as avgTimeSpent,
          DATE(tr.assignedAt) as date
        FROM TechnicianRepairs tr
        WHERE tr.technicianId = ? AND tr.assignedAt >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        GROUP BY DATE(tr.assignedAt)
        ORDER BY date DESC
      `, [technicianId]);

      // حساب الاتجاهات
      const recentData = historicalData.slice(0, 30);
      const olderData = historicalData.slice(30, 60);

      const recentAvg = recentData.length > 0
        ? recentData.reduce((sum, d) => sum + (d.completedRepairs || 0), 0) / recentData.length
        : 0;
      const olderAvg = olderData.length > 0
        ? olderData.reduce((sum, d) => sum + (d.completedRepairs || 0), 0) / olderData.length
        : 0;

      const trend = recentAvg > olderAvg ? 'increasing' : recentAvg < olderAvg ? 'decreasing' : 'stable';
      const trendPercentage = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg * 100) : 0;

      // توقع الأداء القادم
      const predictedNextMonth = recentAvg * 30; // متوسط يومي × 30 يوم

      res.json({
        success: true,
        data: {
          trend,
          trendPercentage: Math.round(trendPercentage * 10) / 10,
          recentAverage: Math.round(recentAvg * 10) / 10,
          predictedNextMonth: Math.round(predictedNextMonth),
          historicalData: historicalData.slice(0, 30) // آخر 30 يوم
        }
      });
    } catch (error) {
      console.error('Error getting predictive insights:', error);
      res.status(500).json({
        success: false,
        error: 'Server Error',
        details: error.message
      });
    }
  }

  /**
   * تحليل فجوات المهارات
   * @param {number} technicianId - معرف الفني
   */
  async getSkillGapAnalysis(req, res) {
    try {
      const { id: technicianId } = req.params;

      // جلب مهارات الفني
      const [technicianSkills] = await db.execute(`
        SELECT 
          ts.*,
          COUNT(DISTINCT tr.repairId) as repairsCount
        FROM TechnicianSkills ts
        LEFT JOIN TechnicianRepairs tr ON ts.technicianId = tr.technicianId
        WHERE ts.technicianId = ?
        GROUP BY ts.id
      `, [technicianId]);

      // جلب أنواع الإصلاحات الأكثر شيوعاً
      const [commonRepairs] = await db.execute(`
        SELECT 
          rr.deviceType,
          COUNT(*) as count
        FROM TechnicianRepairs tr
        JOIN RepairRequest rr ON tr.repairId = rr.id
        WHERE tr.technicianId = ? AND tr.status = 'completed'
        GROUP BY rr.deviceType
        ORDER BY count DESC
        LIMIT 10
      `, [technicianId]);

      // تحديد المهارات المطلوبة بناءً على أنواع الإصلاحات
      const requiredSkills = commonRepairs.map(repair => ({
        deviceType: repair.deviceType,
        count: repair.count,
        hasSkill: technicianSkills.some(skill => 
          skill.skillName && skill.skillName.toLowerCase().includes(repair.deviceType?.toLowerCase() || '')
        )
      }));

      // المهارات المفقودة
      const missingSkills = requiredSkills.filter(skill => !skill.hasSkill);

      res.json({
        success: true,
        data: {
          currentSkills: technicianSkills,
          requiredSkills,
          missingSkills,
          skillGapPercentage: requiredSkills.length > 0
            ? (missingSkills.length / requiredSkills.length * 100)
            : 0
        }
      });
    } catch (error) {
      console.error('Error getting skill gap analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Server Error',
        details: error.message
      });
    }
  }
}

module.exports = new TechnicianAnalyticsController();


