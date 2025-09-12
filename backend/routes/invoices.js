const express = require('express');
const router = express.Router();
const invoicesController = require('../controllers/invoicesController');
const authMiddleware = require('../middleware/authMiddleware');

// جميع المسارات تحتاج مصادقة
router.use(authMiddleware);

// قائمة الفواتير مع فلترة وترقيم
router.get('/', invoicesController.getAllInvoices);

// إحصائيات الفواتير
router.get('/stats', invoicesController.getStatistics);

// العمليات المجمعة للفواتير
router.post('/bulk-action', invoicesController.bulkAction);

// إنشاء فاتورة جديدة
router.post('/', invoicesController.createInvoice);

// صفحة إنشاء فاتورة جديدة (GET)
router.get('/new', invoicesController.getNewInvoicePage);

// جلب فاتورة طلب إصلاح
router.get('/by-repair/:repairId', invoicesController.getInvoiceByRepairId);

// إنشاء فاتورة من طلب إصلاح
router.post('/create-from-repair/:repairId', invoicesController.createInvoiceFromRepair);

// توليد PDF للفاتورة
router.get('/:id/pdf', invoicesController.generatePDF);

// جلب تفاصيل فاتورة محددة
router.get('/:id', invoicesController.getInvoiceById);

// تحديث فاتورة
router.put('/:id', invoicesController.updateInvoice);

// حذف فاتورة (soft delete)
router.delete('/:id', invoicesController.deleteInvoice);

// عمليات عناصر الفاتورة
router.get('/:id/items', invoicesController.getInvoiceItems);
router.post('/:id/items', invoicesController.addInvoiceItem);
router.put('/:id/items/:itemId', invoicesController.updateInvoiceItem);
router.delete('/:id/items/:itemId', invoicesController.removeInvoiceItem);


module.exports = router;
