const express = require('express');
const router = express.Router();
const db = require('../db');
const technicianController = require('../controllers/technicians');
const technicianSkillsController = require('../controllers/technicianSkills');
const technicianRepairsController = require('../controllers/technicianRepairs');
const technicianPerformanceController = require('../controllers/technicianPerformance');
const technicianSchedulesController = require('../controllers/technicianSchedules');
const technicianWagesController = require('../controllers/technicianWages');
const technicianReportsController = require('../controllers/technicianReportsController');
const technicianAnalyticsController = require('../controllers/technicianAnalyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeMiddleware = require('../middleware/authorizeMiddleware');
const bcrypt = require('bcryptjs');

// Helper function to get technician role ID
const getTechnicianRoleId = async () => {
  try {
    const [roles] = await db.query(
      `SELECT id FROM Role WHERE LOWER(TRIM(name)) = 'technician' AND deletedAt IS NULL LIMIT 1`
    );
    return roles.length > 0 ? roles[0].id : null;
  } catch (err) {
    console.error('Error getting technician role ID:', err);
    return null;
  }
};

// Get all technicians - Public or authenticated
router.get('/', async (req, res) => {
  try {
    // جلب الفنيين فقط - فلترة صارمة حسب اسم الدور فقط (لا نعتمد على roleId)
    const [technicians] = await db.query(`
      SELECT 
        u.id, 
        u.name as name,
        u.email, 
        u.phone,
        u.roleId,
        u.isActive,
        r.name as roleName
      FROM User u 
      INNER JOIN Role r ON u.roleId = r.id 
      WHERE LOWER(TRIM(r.name)) = 'technician'
        AND u.deletedAt IS NULL
      ORDER BY u.name
    `);
    
    console.log(`[Technicians Route] Found ${technicians.length} technicians`);
    return res.json({ success: true, data: technicians || [] });
  } catch (err) {
    console.error('Error fetching technicians:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server Error',
      details: err.message 
    });
  }
});

// ==================== Skills Routes ====================
// Get technician skills - Admin only
router.get('/:id/skills', authMiddleware, authorizeMiddleware([1]), technicianSkillsController.getTechnicianSkills);

// Add skill - Admin only
router.post('/:id/skills', authMiddleware, authorizeMiddleware([1]), technicianSkillsController.addSkill);

// Update skill - Admin only
router.put('/:id/skills/:skillId', authMiddleware, authorizeMiddleware([1]), technicianSkillsController.updateSkill);

// Delete skill - Admin only
router.delete('/:id/skills/:skillId', authMiddleware, authorizeMiddleware([1]), technicianSkillsController.deleteSkill);

// ==================== Repairs Routes ====================
// Get technician repairs - Admin only
router.get('/:id/repairs', authMiddleware, authorizeMiddleware([1]), technicianRepairsController.getTechnicianRepairs);

// Get active repairs - Admin only
router.get('/:id/repairs/active', authMiddleware, authorizeMiddleware([1]), technicianRepairsController.getActiveRepairs);

// Assign repair - Admin only
router.post('/:id/repairs/:repairId/assign', authMiddleware, authorizeMiddleware([1]), technicianRepairsController.assignRepair);

// Unassign repair - Admin only
router.delete('/:id/repairs/:repairId/unassign', authMiddleware, authorizeMiddleware([1]), technicianRepairsController.unassignRepair);

// Update repair status - Admin only
router.put('/:id/repairs/:repairId/status', authMiddleware, authorizeMiddleware([1]), technicianRepairsController.updateRepairStatus);

// Get technicians assigned to a repair - Admin only (in repairs routes, but using technicians controller)

// ==================== Performance Routes ====================
// Get technician evaluations - Admin only
router.get('/:id/evaluations', authMiddleware, authorizeMiddleware([1]), technicianPerformanceController.getEvaluations);

// Get performance stats - Admin only
router.get('/:id/performance/stats', authMiddleware, authorizeMiddleware([1]), technicianPerformanceController.getPerformanceStats);

// Evaluate technician - Admin only
router.post('/:id/performance/evaluate', authMiddleware, authorizeMiddleware([1]), technicianPerformanceController.evaluateTechnician);

// ==================== Schedule Routes ====================
// Schedule repair - Admin only
router.post('/:id/schedule', authMiddleware, authorizeMiddleware([1]), technicianSchedulesController.scheduleRepair);

// Update schedule - Admin only
router.put('/:id/schedule/:scheduleId', authMiddleware, authorizeMiddleware([1]), technicianSchedulesController.updateSchedule);

// Delete schedule - Admin only
router.delete('/:id/schedule/:scheduleId', authMiddleware, authorizeMiddleware([1]), technicianSchedulesController.deleteSchedule);

// ==================== Wages Routes ====================
// Get technician wages - Admin only
router.get('/:id/wages', authMiddleware, authorizeMiddleware([1]), technicianWagesController.getWages);

// Create wage - Admin only
router.post('/:id/wages', authMiddleware, authorizeMiddleware([1]), technicianWagesController.createWage);

// Calculate wages - Admin only
router.post('/:id/wages/calculate', authMiddleware, authorizeMiddleware([1]), technicianWagesController.calculateWages);

// Update wage - Admin only
router.put('/:id/wages/:wageId', authMiddleware, authorizeMiddleware([1]), technicianWagesController.updateWage);

// ==================== Existing Routes ====================
// Get technician stats - Admin only (MUST be before /:id route)
// Reports Routes - MUST be before /:id route
router.get('/:id/reports/performance/export', authMiddleware, authorizeMiddleware([1]), technicianReportsController.exportPerformanceReport);
router.get('/:id/reports/wages/export', authMiddleware, authorizeMiddleware([1]), technicianReportsController.exportWagesReport);
router.get('/:id/reports/skills/export', authMiddleware, authorizeMiddleware([1]), technicianReportsController.exportSkillsReport);
router.get('/:id/reports/schedule/export', authMiddleware, authorizeMiddleware([1]), technicianReportsController.exportScheduleReport);
router.get('/reports/performance/export', authMiddleware, authorizeMiddleware([1]), technicianReportsController.exportAllTechniciansReport);

// Analytics Routes - MUST be before /:id route
router.get('/:id/analytics/trends', authMiddleware, authorizeMiddleware([1]), technicianAnalyticsController.getPerformanceTrends);
router.get('/:id/analytics/efficiency', authMiddleware, authorizeMiddleware([1]), technicianAnalyticsController.getEfficiencyAnalysis);
router.get('/:id/analytics/predictions', authMiddleware, authorizeMiddleware([1]), technicianAnalyticsController.getPredictiveInsights);
router.get('/:id/analytics/skill-gaps', authMiddleware, authorizeMiddleware([1]), technicianAnalyticsController.getSkillGapAnalysis);
router.get('/analytics/comparative', authMiddleware, authorizeMiddleware([1]), technicianAnalyticsController.getComparativeAnalysis);

router.get('/:id/stats', authMiddleware, authorizeMiddleware([1]), async (req, res) => {
  try {
    const technicianRoleId = await getTechnicianRoleId();
    
    if (!technicianRoleId) {
      return res.status(500).json({ success: false, error: 'Technician role not found' });
    }

    // Check if technician exists
    const [technician] = await db.query(
      'SELECT id, name FROM User WHERE id = ? AND roleId = ? AND deletedAt IS NULL',
      [req.params.id, technicianRoleId]
    );

    if (technician.length === 0) {
      return res.status(404).json({ success: false, error: 'Technician not found' });
    }

    // Get repair stats
    const [repairStats] = await db.query(`
      SELECT 
        COUNT(*) as totalRepairs,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedRepairs,
        COUNT(CASE WHEN status = 'in_progress' OR status = 'UNDER_REPAIR' THEN 1 END) as inProgressRepairs,
        COUNT(CASE WHEN status = 'pending' OR status = 'RECEIVED' THEN 1 END) as pendingRepairs
      FROM RepairRequest
      WHERE technicianId = ? AND deletedAt IS NULL
    `, [req.params.id]);

    // Get time tracking stats
    const [timeStats] = await db.query(`
      SELECT 
        SUM(duration) as totalMinutes,
        COUNT(*) as totalSessions,
        DATE(createdAt) as date
      FROM TimeTracking
      WHERE technicianId = ? AND DATE(createdAt) = CURDATE()
      GROUP BY DATE(createdAt)
    `, [req.params.id]);

    res.json({
      success: true,
      data: {
        repairs: repairStats[0] || {
          totalRepairs: 0,
          completedRepairs: 0,
          inProgressRepairs: 0,
          pendingRepairs: 0
        },
        timeTracking: {
          todayMinutes: timeStats[0]?.totalMinutes || 0,
          todaySessions: timeStats[0]?.totalSessions || 0
        }
      }
    });
  } catch (err) {
    console.error('Error fetching technician stats:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Get technician performance - Admin only (MUST be before /:id route)
router.get('/:id/performance', authMiddleware, authorizeMiddleware([1]), technicianPerformanceController.getPerformance);

// Get technician schedule - Admin only (MUST be before /:id route)
router.get('/:id/schedule', authMiddleware, authorizeMiddleware([1]), technicianSchedulesController.getSchedule);

// Get technician by ID - Admin only (MUST be after specific routes like /:id/stats)
router.get('/:id', authMiddleware, authorizeMiddleware([1]), async (req, res) => {
  try {
    const technicianRoleId = await getTechnicianRoleId();
    if (!technicianRoleId) {
      return res.status(500).json({ success: false, error: 'Technician role not found' });
    }

    const [technicians] = await db.query(`
      SELECT 
        u.id, 
        u.name as name,
        u.email, 
        u.phone,
        u.roleId,
        u.isActive,
        u.createdAt,
        u.updatedAt,
        r.name as roleName
      FROM User u 
      INNER JOIN Role r ON u.roleId = r.id 
      WHERE u.id = ? 
        AND u.roleId = ?
        AND u.deletedAt IS NULL
    `, [req.params.id, technicianRoleId]);

    if (technicians.length === 0) {
      return res.status(404).json({ success: false, error: 'Technician not found' });
    }

    res.json({ success: true, data: technicians[0] });
  } catch (err) {
    console.error('Error fetching technician:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Create new technician - Admin only
router.post('/', authMiddleware, authorizeMiddleware([1]), async (req, res) => {
  try {
    const { name, email, password, phone, isActive } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, email, and password are required' 
      });
    }

    const technicianRoleId = await getTechnicianRoleId();
    if (!technicianRoleId) {
      return res.status(500).json({ success: false, error: 'Technician role not found' });
    }

    // Check if email already exists
    const [existing] = await db.query(
      'SELECT id FROM User WHERE email = ? AND deletedAt IS NULL',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create technician
    const [result] = await db.query(
      `INSERT INTO User (name, email, password, phone, isActive, roleId, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        name, 
        email, 
        hashedPassword, 
        phone || null, 
        isActive !== undefined ? isActive : true, 
        technicianRoleId
      ]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Technician created successfully',
      data: { id: result.insertId } 
    });
  } catch (err) {
    console.error('Error creating technician:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Update technician - Admin only
router.put('/:id', authMiddleware, authorizeMiddleware([1]), async (req, res) => {
  try {
    const { name, email, password, phone, isActive } = req.body;
    const technicianRoleId = await getTechnicianRoleId();
    
    if (!technicianRoleId) {
      return res.status(500).json({ success: false, error: 'Technician role not found' });
    }

    // Check if technician exists
    const [existing] = await db.query(
      'SELECT id FROM User WHERE id = ? AND roleId = ? AND deletedAt IS NULL',
      [req.params.id, technicianRoleId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Technician not found' });
    }

    // Check if email is being changed and if it already exists
    if (email) {
      const [emailCheck] = await db.query(
        'SELECT id FROM User WHERE email = ? AND id != ? AND deletedAt IS NULL',
        [email, req.params.id]
      );

      if (emailCheck.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email already exists' 
        });
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      values.push(hashedPassword);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    updates.push('updatedAt = NOW()');
    values.push(req.params.id);

    const [result] = await db.query(
      `UPDATE User SET ${updates.join(', ')} WHERE id = ? AND roleId = ? AND deletedAt IS NULL`,
      [...values, technicianRoleId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Technician not found' });
    }

    res.json({ success: true, message: 'Technician updated successfully' });
  } catch (err) {
    console.error('Error updating technician:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Delete technician (soft delete) - Admin only
router.delete('/:id', authMiddleware, authorizeMiddleware([1]), async (req, res) => {
  try {
    const technicianRoleId = await getTechnicianRoleId();
    
    if (!technicianRoleId) {
      return res.status(500).json({ success: false, error: 'Technician role not found' });
    }

    const [result] = await db.query(
      'UPDATE User SET deletedAt = NOW() WHERE id = ? AND roleId = ? AND deletedAt IS NULL',
      [req.params.id, technicianRoleId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Technician not found' });
    }

    res.json({ success: true, message: 'Technician deleted successfully' });
  } catch (err) {
    console.error('Error deleting technician:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

module.exports = router;
