const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const TimeTracking = require('../models/TimeTracking');
const { validateTimeTracking } = require('../validators/technicianValidator');

// جميع المسارات تتطلب تسجيل الدخول
router.use(authMiddleware);

/**
 * بدء تتبع الوقت
 * POST /api/time-tracking/start
 */
router.post('/start', async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { repairId, taskId } = req.body;

    // التحقق من البيانات
    const validation = validateTimeTracking({ repairId, taskId });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    const trackingId = await TimeTracking.start(technicianId, repairId, taskId);
    
    res.json({
      success: true,
      message: 'تم بدء تتبع الوقت',
      data: { trackingId }
    });
  } catch (error) {
    console.error('Error starting time tracking:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * إيقاف تتبع الوقت
 * POST /api/time-tracking/:id/stop
 */
router.post('/:id/stop', async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { id } = req.params;

    const tracking = await TimeTracking.stop(id, technicianId);
    
    res.json({
      success: true,
      message: 'تم إيقاف تتبع الوقت',
      data: { tracking }
    });
  } catch (error) {
    console.error('Error stopping time tracking:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * جلب التتبع النشط
 * GET /api/time-tracking/active
 */
router.get('/active', async (req, res) => {
  try {
    const technicianId = req.user.id;
    const active = await TimeTracking.getActive(technicianId);
    
    res.json({
      success: true,
      data: { tracking: active }
    });
  } catch (error) {
    console.error('Error getting active tracking:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * جلب جميع التتبع للفني
 * GET /api/time-tracking
 */
router.get('/', async (req, res) => {
  try {
    const technicianId = req.user.id;
    const filters = {
      repairId: req.query.repairId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: req.query.limit ? parseInt(req.query.limit) : null
    };

    const trackings = await TimeTracking.getByTechnician(technicianId, filters);
    
    res.json({
      success: true,
      data: { trackings }
    });
  } catch (error) {
    console.error('Error getting time trackings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * حساب الوقت اليومي
 * GET /api/time-tracking/daily-total
 */
router.get('/daily-total', async (req, res) => {
  try {
    const technicianId = req.user.id;
    const date = req.query.date || null;

    const total = await TimeTracking.getDailyTotal(technicianId, date);
    
    res.json({
      success: true,
      data: { total }
    });
  } catch (error) {
    console.error('Error getting daily total:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * طلب تعديل الوقت
 * POST /api/time-tracking/:id/adjust
 */
router.post('/:id/adjust', async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { id } = req.params;
    const { newDuration, reason } = req.body;

    if (!newDuration || !reason) {
      return res.status(400).json({
        success: false,
        error: 'الوقت الجديد والسبب مطلوبان'
      });
    }

    const adjustmentId = await TimeTracking.requestAdjustment(id, technicianId, newDuration, reason);
    
    res.json({
      success: true,
      message: 'تم إرسال طلب تعديل الوقت',
      data: { adjustmentId }
    });
  } catch (error) {
    console.error('Error requesting time adjustment:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

