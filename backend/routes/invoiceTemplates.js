const express = require('express');
const router = express.Router();
const invoiceTemplatesController = require('../controllers/invoiceTemplatesController');
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');

// حماية جميع المسارات - يتطلب تسجيل دخول
router.use(auth);

// جلب جميع قوالب الفواتير (متاح للجميع)
router.get('/', invoiceTemplatesController.getAllTemplates);

// جلب قالب واحد (متاح للجميع)
router.get('/:id', invoiceTemplatesController.getTemplateById);

// معاينة قالب مع فاتورة تجريبية (متاح للجميع)
router.get('/:id/preview', invoiceTemplatesController.previewTemplate);

// المسارات التالية تتطلب صلاحيات إدارية
router.use(authorize); // فقط الأدمن

// إنشاء قالب جديد
router.post('/', invoiceTemplatesController.createTemplate);

// تحديث قالب
router.put('/:id', invoiceTemplatesController.updateTemplate);

// تعيين قالب كافتراضي
router.patch('/:id/set-default', invoiceTemplatesController.setAsDefault);

// حذف قالب
router.delete('/:id', invoiceTemplatesController.deleteTemplate);

module.exports = router;
