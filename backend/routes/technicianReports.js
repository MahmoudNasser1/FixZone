const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db');
const { validateReport } = require('../validators/technicianValidator');

// جميع المسارات تتطلب تسجيل الدخول
router.use(authMiddleware);

/**
 * إنشاء تقرير جديد
 * POST /api/technician-reports
 */
router.post('/', async (req, res) => {
  try {
    const technicianId = req.user.id;
    const {
      repairId,
      reportType = 'quick',
      problemDescription,
      solutionApplied,
      partsUsed = [],
      timeSpent,
      images = [],
      additionalNotes,
      status = 'draft'
    } = req.body;

    // التحقق من البيانات
    const validation = validateReport(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    const [result] = await db.query(`
      INSERT INTO TechnicianReports (
        technicianId, repairId, reportType, problemDescription,
        solutionApplied, partsUsed, timeSpent, images, additionalNotes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      technicianId,
      repairId,
      reportType,
      problemDescription || null,
      solutionApplied || null,
      JSON.stringify(partsUsed),
      timeSpent || null,
      JSON.stringify(images),
      additionalNotes || null,
      status
    ]);

    // إذا كان التقرير مقدم، تحديث حالة الإصلاح
    if (status === 'submitted') {
      await db.query(`
        UPDATE RepairRequest 
        SET status = 'completed', updatedAt = NOW()
        WHERE id = ?
      `, [repairId]);
    }

    const [report] = await db.query(`
      SELECT * FROM TechnicianReports WHERE id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء التقرير بنجاح',
      data: {
        report: {
          ...report[0],
          partsUsed: JSON.parse(report[0].partsUsed || '[]'),
          images: JSON.parse(report[0].images || '[]')
        }
      }
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * جلب تقارير الفني
 * GET /api/technician-reports
 */
router.get('/', async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { repairId, reportType, status } = req.query;

    let query = `
      SELECT 
        r.*,
        CONCAT('REP-', DATE_FORMAT(rep.createdAt, '%Y%m%d'), '-', LPAD(rep.id, 3, '0')) as repairNumber,
        CONCAT(COALESCE(d.brand, ''), ' ', COALESCE(d.model, '')) as deviceName,
        c.name as customerName
      FROM TechnicianReports r
      INNER JOIN RepairRequest rep ON r.repairId = rep.id
      LEFT JOIN Device d ON rep.deviceId = d.id
      LEFT JOIN Customer c ON rep.customerId = c.id
      WHERE r.technicianId = ?
    `;
    const params = [technicianId];

    if (repairId) {
      query += ' AND r.repairId = ?';
      params.push(repairId);
    }

    if (reportType) {
      query += ' AND r.reportType = ?';
      params.push(reportType);
    }

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    query += ' ORDER BY r.createdAt DESC';

    if (req.query.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(req.query.limit));
    }

    const [reports] = await db.query(query, params);

    const formattedReports = reports.map(report => ({
      ...report,
      partsUsed: JSON.parse(report.partsUsed || '[]'),
      images: JSON.parse(report.images || '[]')
    }));

    res.json({
      success: true,
      data: { reports: formattedReports }
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * جلب تقرير محدد
 * GET /api/technician-reports/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { id } = req.params;

    const [reports] = await db.query(`
      SELECT 
        r.*,
        rep.repairNumber,
        CONCAT(COALESCE(d.brand, ''), ' ', COALESCE(d.model, '')) as deviceName,
        c.name as customerName
      FROM TechnicianReports r
      INNER JOIN RepairRequest rep ON r.repairId = rep.id
      LEFT JOIN Device d ON rep.deviceId = d.id
      LEFT JOIN Customer c ON rep.customerId = c.id
      WHERE r.id = ? AND r.technicianId = ?
    `, [id, technicianId]);

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'لم يتم العثور على التقرير'
      });
    }

    const report = reports[0];
    res.json({
      success: true,
      data: {
        report: {
          ...report,
          partsUsed: JSON.parse(report.partsUsed || '[]'),
          images: JSON.parse(report.images || '[]')
        }
      }
    });
  } catch (error) {
    console.error('Error getting report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * تحديث تقرير
 * PUT /api/technician-reports/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { id } = req.params;
    const updates = req.body;

    // التحقق من وجود التقرير
    const [existing] = await db.query(`
      SELECT * FROM TechnicianReports WHERE id = ? AND technicianId = ?
    `, [id, technicianId]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'لم يتم العثور على التقرير'
      });
    }

    const updateFields = [];
    const params = [];

    if (updates.problemDescription !== undefined) {
      updateFields.push('problemDescription = ?');
      params.push(updates.problemDescription);
    }

    if (updates.solutionApplied !== undefined) {
      updateFields.push('solutionApplied = ?');
      params.push(updates.solutionApplied);
    }

    if (updates.partsUsed !== undefined) {
      updateFields.push('partsUsed = ?');
      params.push(JSON.stringify(updates.partsUsed));
    }

    if (updates.timeSpent !== undefined) {
      updateFields.push('timeSpent = ?');
      params.push(updates.timeSpent);
    }

    if (updates.images !== undefined) {
      updateFields.push('images = ?');
      params.push(JSON.stringify(updates.images));
    }

    if (updates.additionalNotes !== undefined) {
      updateFields.push('additionalNotes = ?');
      params.push(updates.additionalNotes);
    }

    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      params.push(updates.status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'لا توجد تحديثات'
      });
    }

    params.push(id, technicianId);

    await db.query(`
      UPDATE TechnicianReports 
      SET ${updateFields.join(', ')}, updatedAt = NOW()
      WHERE id = ? AND technicianId = ?
    `, params);

    // إذا تم تقديم التقرير، تحديث حالة الإصلاح
    if (updates.status === 'submitted') {
      await db.query(`
        UPDATE RepairRequest 
        SET status = 'completed', updatedAt = NOW()
        WHERE id = ?
      `, [existing[0].repairId]);
    }

    const [updated] = await db.query(`
      SELECT * FROM TechnicianReports WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'تم تحديث التقرير بنجاح',
      data: {
        report: {
          ...updated[0],
          partsUsed: JSON.parse(updated[0].partsUsed || '[]'),
          images: JSON.parse(updated[0].images || '[]')
        }
      }
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * تقديم تقرير
 * POST /api/technician-reports/:id/submit
 */
router.post('/:id/submit', async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { id } = req.params;

    const [reports] = await db.query(`
      SELECT * FROM TechnicianReports WHERE id = ? AND technicianId = ?
    `, [id, technicianId]);

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'لم يتم العثور على التقرير'
      });
    }

    await db.query(`
      UPDATE TechnicianReports 
      SET status = 'submitted', submittedAt = NOW()
      WHERE id = ?
    `, [id]);

    // تحديث حالة الإصلاح
    await db.query(`
      UPDATE RepairRequest 
      SET status = 'completed', updatedAt = NOW()
      WHERE id = ?
    `, [reports[0].repairId]);

    res.json({
      success: true,
      message: 'تم تقديم التقرير بنجاح'
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

