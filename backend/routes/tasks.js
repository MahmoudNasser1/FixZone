const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Task = require('../models/Task');
const { validateTask } = require('../validators/technicianValidator');

// جميع المسارات تتطلب تسجيل الدخول
router.use(authMiddleware);

/**
 * إنشاء مهمة جديدة
 * POST /api/tasks
 */
router.post('/', async (req, res) => {
  try {
    const technicianId = req.user.id;
    const taskData = {
      ...req.body,
      technicianId
    };

    // التحقق من البيانات
    const validation = validateTask(taskData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    const taskId = await Task.create(taskData);
    const task = await Task.findById(taskId, technicianId);
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء المهمة بنجاح',
      data: { task }
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * جلب جميع المهام
 * GET /api/tasks
 */
router.get('/', async (req, res) => {
  try {
    const technicianId = req.user.id;
    const filters = {
      technicianId,
      status: req.query.status,
      priority: req.query.priority,
      taskType: req.query.taskType,
      repairId: req.query.repairId,
      search: req.query.search,
      orderBy: req.query.orderBy || 'createdAt',
      orderDir: req.query.orderDir || 'DESC',
      limit: req.query.limit ? parseInt(req.query.limit) : null,
      offset: req.query.offset ? parseInt(req.query.offset) : null
    };

    const tasks = await Task.findAll(filters);
    
    res.json({
      success: true,
      data: { tasks }
    });
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * جلب مهمة محددة
 * GET /api/tasks/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { id } = req.params;

    const task = await Task.findById(id, technicianId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'لم يتم العثور على المهمة'
      });
    }

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    console.error('Error getting task:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * تحديث مهمة
 * PUT /api/tasks/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { id } = req.params;

    const task = await Task.update(id, technicianId, req.body);
    
    res.json({
      success: true,
      message: 'تم تحديث المهمة بنجاح',
      data: { task }
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * حذف مهمة
 * DELETE /api/tasks/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { id } = req.params;

    const deleted = await Task.delete(id, technicianId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'لم يتم العثور على المهمة'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف المهمة بنجاح'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * إحصائيات المهام
 * GET /api/tasks/stats
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const technicianId = req.user.id;
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const stats = await Task.getStats(technicianId, filters);
    
    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Error getting task stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

