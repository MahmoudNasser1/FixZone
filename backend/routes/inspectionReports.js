const express = require('express');
const router = express.Router();
const { body, validationResult, param } = require('express-validator');
const db = require('../db');
const websocketService = require('../services/websocketService');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeMiddleware = require('../middleware/authorizeMiddleware');

// Helper function to check if user can modify report
const canModifyReport = async (userId, userRoleId, reportId) => {
  // Admin (role 1) and Manager (role 2) can modify any report
  if (userRoleId === 1 || userRoleId === 2) return true;
  
  // Technician can only modify their own reports (role 3 or 4)
  if (userRoleId === 3 || userRoleId === 4) {
    const [report] = await db.query(
      'SELECT technicianId FROM InspectionReport WHERE id = ? AND deletedAt IS NULL',
      [reportId]
    );
    if (report.length > 0 && report[0].technicianId === userId) {
      return true;
    }
  }
  
  return false;
};

// Get all inspection reports (Admin/Manager only) with pagination, filtering, and sorting
router.get('/', authMiddleware, authorizeMiddleware([1, 2]), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      repairRequestId,
      technicianId,
      inspectionTypeId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    // Build WHERE clause
    let whereConditions = ['ir.deletedAt IS NULL'];
    const params = [];

    if (repairRequestId) {
      whereConditions.push('ir.repairRequestId = ?');
      params.push(parseInt(repairRequestId));
    }
    if (technicianId) {
      whereConditions.push('ir.technicianId = ?');
      params.push(parseInt(technicianId));
    }
    if (inspectionTypeId) {
      whereConditions.push('ir.inspectionTypeId = ?');
      params.push(parseInt(inspectionTypeId));
    }
    if (startDate) {
      whereConditions.push('ir.reportDate >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereConditions.push('ir.reportDate <= ?');
      params.push(endDate);
    }

    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['createdAt', 'updatedAt', 'reportDate', 'id'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Calculate pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;

    // Build query with joins for better data
    const query = `
      SELECT 
        ir.*,
        COALESCE(it.name, 'تقرير فحص') as inspectionTypeName,
        u.name as technicianName,
        b.name as branchName
      FROM InspectionReport ir
      LEFT JOIN InspectionType it ON ir.inspectionTypeId = it.id AND (it.deletedAt IS NULL OR it.deletedAt = '0000-00-00 00:00:00')
      LEFT JOIN User u ON ir.technicianId = u.id AND u.deletedAt IS NULL
      LEFT JOIN Branch b ON ir.branchId = b.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ir.${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limitNum, offset);

    const [rows] = await db.query(query, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM InspectionReport ir
      WHERE ${whereConditions.join(' AND ')}
    `;
    const countParams = params.slice(0, -2); // Remove limit and offset
    const [countRows] = await db.query(countQuery, countParams);
    const total = countRows[0]?.total || 0;

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error('Error fetching inspection reports:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Get inspection reports by repair request ID (Public - for tracking page)
router.get('/repair/:repairRequestId', async (req, res) => {
  const { repairRequestId } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT 
        ir.*,
        COALESCE(it.name, 'تقرير فحص') as inspectionTypeName,
        u.name as technicianName,
        b.name as branchName
      FROM InspectionReport ir
      LEFT JOIN InspectionType it ON ir.inspectionTypeId = it.id AND (it.deletedAt IS NULL OR it.deletedAt = '0000-00-00 00:00:00')
      LEFT JOIN User u ON ir.technicianId = u.id AND u.deletedAt IS NULL
      LEFT JOIN Branch b ON ir.branchId = b.id
      WHERE ir.repairRequestId = ? AND ir.deletedAt IS NULL
      ORDER BY ir.reportDate DESC, ir.createdAt DESC
    `, [repairRequestId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(`Error fetching inspection reports for repair ${repairRequestId}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Get inspection reports by technician ID (Authenticated - Technician can see their own, Admin/Manager can see all)
router.get('/technician/:technicianId', authMiddleware, async (req, res) => {
  const { technicianId } = req.params;
  const userRoleId = req.user?.roleId || req.user?.role;
  const userId = req.user?.id;
  
  // Check if user can access this technician's reports
  // Admin/Manager can see all, Technician can only see their own
  if (userRoleId !== 1 && userRoleId !== 2 && parseInt(technicianId) !== userId) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied: You can only view your own reports' 
    });
  }
  
  try {
    const [rows] = await db.query(`
      SELECT 
        ir.*,
        COALESCE(it.name, 'تقرير فحص') as inspectionTypeName,
        u.name as technicianName,
        b.name as branchName,
        rr.id as repairRequestId,
        rr.requestNumber,
        rr.status as repairStatus
      FROM InspectionReport ir
      LEFT JOIN InspectionType it ON ir.inspectionTypeId = it.id AND (it.deletedAt IS NULL OR it.deletedAt = '0000-00-00 00:00:00')
      LEFT JOIN User u ON ir.technicianId = u.id AND u.deletedAt IS NULL
      LEFT JOIN Branch b ON ir.branchId = b.id
      LEFT JOIN RepairRequest rr ON ir.repairRequestId = rr.id AND rr.deletedAt IS NULL
      WHERE ir.technicianId = ? AND ir.deletedAt IS NULL
      ORDER BY ir.reportDate DESC, ir.createdAt DESC
    `, [technicianId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(`Error fetching inspection reports for technician ${technicianId}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Get inspection reports by job ID (repairRequestId) - Authenticated
router.get('/job/:jobId', authMiddleware, async (req, res) => {
  const { jobId } = req.params;
  // jobId is the repairRequestId
  try {
    const [rows] = await db.query(`
      SELECT 
        ir.*,
        COALESCE(it.name, 'تقرير فحص') as inspectionTypeName,
        u.name as technicianName,
        b.name as branchName
      FROM InspectionReport ir
      LEFT JOIN InspectionType it ON ir.inspectionTypeId = it.id AND (it.deletedAt IS NULL OR it.deletedAt = '0000-00-00 00:00:00')
      LEFT JOIN User u ON ir.technicianId = u.id AND u.deletedAt IS NULL
      LEFT JOIN Branch b ON ir.branchId = b.id
      WHERE ir.repairRequestId = ? AND ir.deletedAt IS NULL
      ORDER BY ir.reportDate DESC, ir.createdAt DESC
    `, [jobId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(`Error fetching inspection reports for job ${jobId}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Get inspection report by ID (Authenticated)
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM InspectionReport WHERE id = ? AND deletedAt IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Inspection report not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(`Error fetching inspection report with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Validation middleware for creating/updating reports
const validateInspectionReport = [
  body('repairRequestId')
    .notEmpty().withMessage('repairRequestId is required')
    .custom((value) => {
      const num = Number(value);
      return !isNaN(num) && Number.isInteger(num);
    }).withMessage('repairRequestId must be an integer'),
  body('reportDate')
    .notEmpty().withMessage('reportDate is required')
    .custom((value) => {
      // Accept ISO 8601 format or YYYY-MM-DD format
      if (!value || typeof value !== 'string') return false;
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (iso8601Regex.test(value) || dateOnlyRegex.test(value)) {
        const date = new Date(value);
        return !isNaN(date.getTime());
      }
      return false;
    }).withMessage('reportDate must be a valid date (ISO 8601 or YYYY-MM-DD format)'),
  body('inspectionTypeId')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && Number.isInteger(num);
    }).withMessage('inspectionTypeId must be an integer'),
  body('technicianId')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && Number.isInteger(num);
    }).withMessage('technicianId must be an integer'),
  body('summary')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('summary must be a string')
    .isLength({ max: 5000 }).withMessage('summary must not exceed 5000 characters'),
  body('result')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('result must be a string')
    .isLength({ max: 5000 }).withMessage('result must not exceed 5000 characters'),
  body('recommendations')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('recommendations must be a string')
    .isLength({ max: 5000 }).withMessage('recommendations must not exceed 5000 characters'),
  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('notes must be a string')
    .isLength({ max: 5000 }).withMessage('notes must not exceed 5000 characters'),
];

// Helper middleware to check validation results
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('[Validation Error] Inspection Report validation failed:', errors.array());
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
      receivedData: {
        repairRequestId: req.body?.repairRequestId,
        inspectionTypeId: req.body?.inspectionTypeId,
        technicianId: req.body?.technicianId,
        reportDate: req.body?.reportDate,
        reportDateType: typeof req.body?.reportDate,
        reportDateLength: req.body?.reportDate?.length
      }
    });
  }
  next();
};

// Create a new inspection report (Authenticated - Admin/Manager/Technician)
// Allow roles: 1 (Admin), 2 (Manager), 3 (Legacy Technician), 4 (Technician)
router.post('/', authMiddleware, authorizeMiddleware([1, 2, 3, 4]), validateInspectionReport, checkValidation, async (req, res) => {
  let { repairRequestId, inspectionTypeId, technicianId, summary, result, recommendations, notes, reportDate, branchId, invoiceLink, qrCode, attachments } = req.body || {};
  try {
    // Ensure repair exists
    const [repRows] = await db.query('SELECT id FROM RepairRequest WHERE id = ? AND deletedAt IS NULL', [repairRequestId]);
    if (!repRows || repRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Repair request not found' });
    }

    // Validate/resolve inspectionTypeId
    let validInspectionTypeId = null;
    if (inspectionTypeId) {
      const [it] = await db.query('SELECT id FROM InspectionType WHERE id = ? AND deletedAt IS NULL', [inspectionTypeId]);
      if (it && it.length > 0) validInspectionTypeId = it[0].id;
    }
    if (!validInspectionTypeId) {
      const [byName] = await db.query("SELECT id FROM InspectionType WHERE name IN ('فحص مبدئي','فحص نهائي','Initial Inspection') AND deletedAt IS NULL ORDER BY id LIMIT 1");
      if (byName && byName.length > 0) {
        validInspectionTypeId = byName[0].id;
      } else {
        const [created] = await db.query('INSERT INTO InspectionType (name, description, isActive) VALUES (?, ?, ?)', ['فحص مبدئي', 'نوع فحص افتراضي', 1]);
        validInspectionTypeId = created.insertId;
      }
    }

    // Validate/resolve technicianId (optional)
    let validTechnicianId = null;
    if (technicianId) {
      const [tech] = await db.query('SELECT id FROM User WHERE id = ? AND deletedAt IS NULL', [technicianId]);
      if (tech && tech.length > 0) validTechnicianId = tech[0].id;
    }

    // Validate branchId (optional)
    let validBranchId = null;
    if (branchId) {
      const [br] = await db.query('SELECT id FROM Branch WHERE id = ? AND deletedAt IS NULL', [branchId]);
      if (br && br.length > 0) validBranchId = br[0].id;
    }

    // Normalize reportDate to MySQL datetime format
    let normalizedReportDate = reportDate;
    if (reportDate && typeof reportDate === 'string') {
      // If it's ISO 8601 format, convert to MySQL datetime format
      if (reportDate.includes('T')) {
        normalizedReportDate = new Date(reportDate).toISOString().slice(0, 19).replace('T', ' ');
      } else if (reportDate.length === 10) {
        // If it's YYYY-MM-DD, convert to MySQL datetime format
        normalizedReportDate = reportDate + ' 00:00:00';
      }
    }
    
    const payload = [
      Number(repairRequestId),
      validInspectionTypeId,
      validTechnicianId,
      summary || null,
      result || null,
      recommendations || null,
      notes || null,
      normalizedReportDate,
      validBranchId,
      invoiceLink || null,
      qrCode || null,
      attachments ? JSON.stringify(attachments) : null
    ];

    const [resultQuery] = await db.query(
      'INSERT INTO InspectionReport (repairRequestId, inspectionTypeId, technicianId, summary, result, recommendations, notes, reportDate, branchId, invoiceLink, qrCode, attachments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      payload
    );
    
    // إرسال WebSocket notification لتحديث صفحة التتبع
    try {
      const [repairRows] = await db.query(
        'SELECT * FROM RepairRequest WHERE id = ? AND deletedAt IS NULL',
        [repairRequestId]
      );
      if (repairRows && repairRows.length > 0) {
        // إرسال تحديث للطلب لإعلام صفحة التتبع بوجود تقرير جديد
        websocketService.sendRepairUpdate('updated', repairRows[0]);
        console.log(`[InspectionReports] WebSocket notification sent for repair ${repairRequestId}`);
      }
    } catch (wsError) {
      // لا نوقف العملية إذا فشل WebSocket
      console.warn('[InspectionReports] Failed to send WebSocket notification:', wsError);
    }
    
    res.status(201).json({ 
      success: true,
      id: resultQuery.insertId, 
      repairRequestId, 
      inspectionTypeId: validInspectionTypeId, 
      technicianId: validTechnicianId, 
      summary, 
      result, 
      recommendations, 
      notes, 
      reportDate, 
      branchId: validBranchId, 
      invoiceLink, 
      qrCode 
    });
  } catch (err) {
    console.error('Error creating inspection report:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Update an inspection report (Authenticated - Admin/Manager can update any, Technician can update their own)
router.put('/:id', 
  authMiddleware,
  param('id').isInt().withMessage('Report ID must be an integer'),
  validateInspectionReport,
  checkValidation,
  async (req, res) => {
  const { id } = req.params;
  const { repairRequestId, inspectionTypeId, technicianId, summary, result, recommendations, notes, reportDate: rawReportDate, branchId, invoiceLink, qrCode, attachments } = req.body;
  
  // Normalize reportDate to MySQL datetime format
  let reportDate = rawReportDate;
  if (rawReportDate && typeof rawReportDate === 'string') {
    // If it's ISO 8601 format, convert to MySQL datetime format
    if (rawReportDate.includes('T')) {
      reportDate = new Date(rawReportDate).toISOString().slice(0, 19).replace('T', ' ');
    } else if (rawReportDate.length === 10) {
      // If it's YYYY-MM-DD, convert to MySQL datetime format
      reportDate = rawReportDate + ' 00:00:00';
    }
  }
  const userRoleId = req.user?.roleId || req.user?.role;
  const userId = req.user?.id;
  
  // Check if user can modify this report
  const canModify = await canModifyReport(userId, userRoleId, id);
  if (!canModify) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied: You can only modify your own reports' 
    });
  }
  
  try {
    // For technicians, ensure they can't change technicianId to someone else
    let finalTechnicianId = technicianId;
    if (userRoleId === 3 || userRoleId === 4) {
      // Technician can only set themselves as technician
      finalTechnicianId = userId;
    }
    
    // Validate/resolve inspectionTypeId (similar to POST)
    let validInspectionTypeId = inspectionTypeId;
    if (inspectionTypeId) {
      const [it] = await db.query('SELECT id FROM InspectionType WHERE id = ? AND deletedAt IS NULL', [inspectionTypeId]);
      if (!it || it.length === 0) {
        // Try to find default
        const [byName] = await db.query("SELECT id FROM InspectionType WHERE name IN ('فحص مبدئي','فحص نهائي','Initial Inspection') AND deletedAt IS NULL ORDER BY id LIMIT 1");
        if (byName && byName.length > 0) {
          validInspectionTypeId = byName[0].id;
        } else {
          validInspectionTypeId = null;
        }
      }
    }
    const [resultQuery] = await db.query(
      'UPDATE InspectionReport SET repairRequestId = ?, inspectionTypeId = ?, technicianId = ?, summary = ?, result = ?, recommendations = ?, notes = ?, reportDate = ?, branchId = ?, invoiceLink = ?, qrCode = ?, attachments = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [repairRequestId, validInspectionTypeId, finalTechnicianId, summary || null, result || null, recommendations || null, notes || null, reportDate, branchId || null, invoiceLink || null, qrCode || null, attachments ? JSON.stringify(attachments) : null, id]
    );
    if (resultQuery.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Inspection report not found' });
    }
    
    // إرسال WebSocket notification
    try {
      const [repairRows] = await db.query(
        'SELECT * FROM RepairRequest WHERE id = ? AND deletedAt IS NULL',
        [repairRequestId]
      );
      if (repairRows && repairRows.length > 0) {
        websocketService.sendRepairUpdate('updated', repairRows[0]);
        console.log(`[InspectionReports] WebSocket notification sent for repair ${repairRequestId}`);
      }
    } catch (wsError) {
      console.warn('[InspectionReports] Failed to send WebSocket notification:', wsError);
    }
    
    res.json({ success: true, message: 'Inspection report updated successfully' });
  } catch (err) {
    console.error(`Error updating inspection report with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Soft delete an inspection report (Authenticated - Admin/Manager can delete any, Technician can delete their own)
router.delete('/:id', 
  authMiddleware,
  param('id').isInt().withMessage('Report ID must be an integer'),
  checkValidation,
  async (req, res) => {
  const { id } = req.params;
  const userRoleId = req.user?.roleId || req.user?.role;
  const userId = req.user?.id;
  
  // Check if user can delete this report
  const canModify = await canModifyReport(userId, userRoleId, id);
  if (!canModify) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied: You can only delete your own reports' 
    });
  }
  
  try {
    // جلب repairRequestId قبل الحذف لإرسال WebSocket notification
    const [reportRows] = await db.query('SELECT repairRequestId FROM InspectionReport WHERE id = ? AND deletedAt IS NULL', [id]);
    if (reportRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Inspection report not found' });
    }
    
    const repairRequestId = reportRows[0].repairRequestId;
    
    // Soft delete
    const [result] = await db.query(
      'UPDATE InspectionReport SET deletedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Inspection report not found or already deleted' });
    }
    
    // إرسال WebSocket notification
    try {
      const [repairRows] = await db.query(
        'SELECT * FROM RepairRequest WHERE id = ? AND deletedAt IS NULL',
        [repairRequestId]
      );
      if (repairRows && repairRows.length > 0) {
        websocketService.sendRepairUpdate('updated', repairRows[0]);
        console.log(`[InspectionReports] WebSocket notification sent for repair ${repairRequestId} after report deletion`);
      }
    } catch (wsError) {
      console.warn('[InspectionReports] Failed to send WebSocket notification:', wsError);
    }
    
    res.json({ success: true, message: 'Inspection report deleted successfully' });
  } catch (err) {
    console.error(`Error deleting inspection report with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Load final inspection components from templates
router.post('/:id/load-final-inspection-components', authMiddleware, authorizeMiddleware([1, 2, 3, 4]), async (req, res) => {
  const { id } = req.params;
  const { deviceCategory = 'all' } = req.body;
  
  try {
    // التحقق من أن التقرير موجود ونوعه "فحص نهائي"
    const [report] = await db.query(`
      SELECT ir.*, it.name as inspectionTypeName 
      FROM InspectionReport ir
      LEFT JOIN InspectionType it ON ir.inspectionTypeId = it.id AND (it.deletedAt IS NULL OR it.deletedAt = '0000-00-00 00:00:00')
      WHERE ir.id = ? AND ir.deletedAt IS NULL
    `, [id]);
    
    if (!report || report.length === 0) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    
    const reportData = report[0];
    
    // التحقق من وجود جدول القوالب
    const [tableCheck] = await db.query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'FinalInspectionComponentTemplate'
    `);
    
    if (tableCheck[0].count === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'FinalInspectionComponentTemplate table not found. Please run migrations first.' 
      });
    }
    
    // جلب قوالب المكونات (case-insensitive matching)
    console.log(`[InspectionReports] Loading components for report ${id}, deviceCategory: ${deviceCategory}`);
    const [templates] = await db.query(`
      SELECT * FROM FinalInspectionComponentTemplate 
      WHERE (LOWER(deviceCategory) = LOWER(?) OR deviceCategory = 'all' OR deviceCategory IS NULL)
      ORDER BY displayOrder ASC
    `, [deviceCategory || 'all']);
    
    console.log(`[InspectionReports] Found ${templates.length} templates for deviceCategory: ${deviceCategory}`);
    
    if (!templates || templates.length === 0) {
      return res.json({ 
        success: true, 
        message: `لا توجد قوالب متاحة لهذا النوع من الأجهزة (${deviceCategory})`,
        componentIds: [] 
      });
    }
    
    // التحقق من أن التقرير موجود
    const [reportCheck] = await db.query('SELECT id FROM InspectionReport WHERE id = ?', [id]);
    if (reportCheck.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'التقرير غير موجود' 
      });
    }
    
    // إنشاء مكونات فحص من القوالب
    const components = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const template of templates) {
      try {
        // استخدام القيم الافتراضية (WORKING للمكونات الجديدة، MEDIUM للأولوية)
        const [component] = await db.query(
          `INSERT INTO InspectionComponent 
           (inspectionReportId, name, status, notes, priority, createdAt)
           VALUES (?, ?, 'WORKING', ?, 'MEDIUM', CURRENT_TIMESTAMP)`,
          [id, template.name, template.description || null]
        );
        components.push(component.insertId);
        successCount++;
        console.log(`[InspectionReports] ✅ Created component: ${template.name} (ID: ${component.insertId})`);
      } catch (err) {
        errorCount++;
        console.error(`[InspectionReports] ❌ Error creating component from template ${template.id} (${template.name}):`, err.message);
        // Continue with other components even if one fails
      }
    }
    
    console.log(`[InspectionReports] Summary: ${successCount} created, ${errorCount} failed out of ${templates.length} templates`);
    
    // إرسال WebSocket notification
    try {
      const [reportData] = await db.query('SELECT repairRequestId FROM InspectionReport WHERE id = ?', [id]);
      if (reportData && reportData.length > 0 && reportData[0].repairRequestId) {
        const [repairRows] = await db.query(
          'SELECT * FROM RepairRequest WHERE id = ? AND deletedAt IS NULL',
          [reportData[0].repairRequestId]
        );
        if (repairRows && repairRows.length > 0) {
          websocketService.sendRepairUpdate('component_created', repairRows[0]);
          console.log(`[InspectionReports] WebSocket notification sent for repair ${reportData[0].repairRequestId}`);
        }
      }
    } catch (wsError) {
      console.warn('[InspectionReports] Failed to send WebSocket notification:', wsError);
    }
    
    res.json({ 
      success: true, 
      message: `تم إنشاء ${components.length} مكون فحص من القوالب`,
      componentIds: components 
    });
  } catch (err) {
    console.error('Error loading final inspection components:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Export report to PDF (Placeholder - to be implemented in phase 6)
router.get('/:id/export/pdf', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    // TODO: Implement PDF export using pdfkit or puppeteer
    // For now, return a placeholder response
    res.status(501).json({ 
      success: false, 
      error: 'PDF export feature is under development',
      message: 'ميزة التصدير إلى PDF قيد التطوير'
    });
  } catch (err) {
    console.error(`Error exporting report ${id} to PDF:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

module.exports = router;
