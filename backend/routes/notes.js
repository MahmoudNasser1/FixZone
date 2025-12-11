const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Note = require('../models/Note');
const { validateNote } = require('../validators/technicianValidator');

// جميع المسارات تتطلب تسجيل الدخول
router.use(authMiddleware);

/**
 * إنشاء ملاحظة جديدة
 * POST /api/notes
 */
router.post('/', async (req, res) => {
  try {
    const technicianId = req.user.id;
    const noteData = {
      ...req.body,
      technicianId
    };

    // التحقق من البيانات
    const validation = validateNote(noteData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    const noteId = await Note.create(noteData);
    const note = await Note.findById(noteId, technicianId);
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الملاحظة بنجاح',
      data: { note }
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * جلب جميع الملاحظات
 * GET /api/notes
 */
router.get('/', async (req, res) => {
  try {
    const technicianId = req.user.id;
    const filters = {
      technicianId,
      noteType: req.query.noteType,
      deviceId: req.query.deviceId,
      repairId: req.query.repairId,
      category: req.query.category,
      search: req.query.search,
      limit: req.query.limit ? parseInt(req.query.limit) : null
    };

    const notes = await Note.findAll(filters);
    
    res.json({
      success: true,
      data: { notes }
    });
  } catch (error) {
    console.error('Error getting notes:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * جلب ملاحظة محددة
 * GET /api/notes/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { id } = req.params;

    const note = await Note.findById(id, technicianId);
    
    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'لم يتم العثور على الملاحظة'
      });
    }

    res.json({
      success: true,
      data: { note }
    });
  } catch (error) {
    console.error('Error getting note:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * تحديث ملاحظة
 * PUT /api/notes/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { id } = req.params;

    const note = await Note.update(id, technicianId, req.body);
    
    res.json({
      success: true,
      message: 'تم تحديث الملاحظة بنجاح',
      data: { note }
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * حذف ملاحظة
 * DELETE /api/notes/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { id } = req.params;

    const deleted = await Note.delete(id, technicianId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'لم يتم العثور على الملاحظة'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف الملاحظة بنجاح'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * جلب التذكيرات
 * GET /api/notes/reminders
 */
router.get('/reminders/list', async (req, res) => {
  try {
    const technicianId = req.user.id;
    const date = req.query.date || null;

    const reminders = await Note.getReminders(technicianId, date);
    
    res.json({
      success: true,
      data: { reminders }
    });
  } catch (error) {
    console.error('Error getting reminders:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

