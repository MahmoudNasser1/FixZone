const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const authorizeMiddleware = require('../middleware/authorizeMiddleware');
const { checkPermission, checkAnyPermission } = require('../middleware/permissionMiddleware');
const technicianController = require('../controllers/technicianController');

// جميع مسارات الفنيين تتطلب تسجيل الدخول
router.use(authMiddleware);
// السماح فقط بدور الفني (roleId = 3)
router.use(authorizeMiddleware([3, 'Technician']));

// Dashboard للفني (إحصائيات بسيطة)
router.get(
  '/dashboard',
  checkPermission('repairs.view_own'),
  technicianController.getTechnicianDashboard
);

// قائمة الشغل الخاصة بالفني
router.get(
  '/jobs',
  checkPermission('repairs.view_own'),
  technicianController.getTechnicianJobs
);

// تفاصيل شغل واحد
router.get(
  '/jobs/:id',
  checkPermission('repairs.view_own'),
  technicianController.getTechnicianJobById
);

// تحديث حالة شغل للفني (status فقط)
router.put(
  '/jobs/:id/status',
  checkAnyPermission(['repairs.update_own', 'repairs.timeline_update']),
  technicianController.updateTechnicianJobStatus
);

// إضافة ملاحظة / Note في الـ Timeline
router.post(
  '/jobs/:id/notes',
  checkPermission('repairs.timeline_update'),
  technicianController.addTechnicianJobNote
);

// رفع وسائط (صور/فيديو) — Sprint 2
router.post(
  '/jobs/:id/media',
  checkAnyPermission(['repairs.update_own', 'repairs.timeline_update']),
  technicianController.uploadJobMedia
);

// جلب الوسائط الخاصة بجهاز
router.get(
  '/jobs/:id/media',
  checkPermission('repairs.view_own'),
  technicianController.getJobMedia
);

// طلب قطع غيار — Sprint 3
router.post(
  '/parts-request',
  checkPermission('repairs.parts_request'),
  technicianController.createPartsRequest
);
router.get(
  '/parts-request/:id',
  checkPermission('repairs.parts_request'),
  technicianController.getPartsRequestById
);

// ملف شخصي وحالة الفني — Sprint 3
router.get(
  '/profile',
  checkPermission('repairs.view_own'),
  technicianController.getTechnicianProfile
);
router.put(
  '/profile',
  checkPermission('repairs.view_own'),
  technicianController.updateTechnicianProfile
);
router.put(
  '/status',
  checkPermission('repairs.view_own'),
  technicianController.updateTechnicianStatus
);

module.exports = router;


