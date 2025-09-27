const express = require('express');
const router = express.Router();
const messagingController = require('../controllers/messagingController');
const authMiddleware = require('../middleware/authMiddleware');

// إرسال بريد إلكتروني
router.post('/send-email', authMiddleware, messagingController.sendEmail);

// إرسال رسالة واتساب
router.post('/send-whatsapp', authMiddleware, messagingController.sendWhatsApp);

// جلب إعدادات المراسلة
router.get('/settings', authMiddleware, messagingController.getMessagingSettings);

// حفظ إعدادات المراسلة
router.post('/settings', authMiddleware, messagingController.saveMessagingSettings);

module.exports = router;
