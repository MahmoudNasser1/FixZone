const express = require('express');
const router = express.Router();
const messagingController = require('../controllers/messagingController');
const authMiddleware = require('../middleware/authMiddleware');

// جميع المسارات تحتاج مصادقة
router.use(authMiddleware);

// ============================================
// إرسال الرسائل
// ============================================

// إرسال رسالة موحدة (يدعم WhatsApp و Email)
router.post('/send', messagingController.sendMessage);

// إرسال بريد إلكتروني (legacy - للتوافق مع الكود القديم)
router.post('/send-email', messagingController.sendEmail);

// إرسال رسالة واتساب (legacy - للتوافق مع الكود القديم)
router.post('/send-whatsapp', messagingController.sendWhatsApp);

// ============================================
// سجل المراسلات
// ============================================

// الحصول على سجل المراسلات
router.get('/logs', messagingController.getMessageLogs);

// الحصول على رسالة محددة
router.get('/logs/:id', messagingController.getMessageLog);

// إعادة محاولة إرسال رسالة فاشلة
router.post('/retry/:id', messagingController.retryMessage);

// حذف سجل رسالة
router.delete('/logs/:id', messagingController.deleteMessageLog);

// ============================================
// الإحصائيات
// ============================================

// الحصول على إحصائيات المراسلات
router.get('/stats', messagingController.getStats);

// ============================================
// الإعدادات
// ============================================

// جلب إعدادات المراسلة
router.get('/settings', messagingController.getMessagingSettings);

// حفظ إعدادات المراسلة
router.post('/settings', messagingController.saveMessagingSettings);

// ============================================
// التحقق من الإعدادات
// ============================================

// التحقق من صحة إعدادات WhatsApp
router.get('/validate/whatsapp', messagingController.validateWhatsApp);

// التحقق من صحة إعدادات Email
router.get('/validate/email', messagingController.validateEmail);

module.exports = router;
