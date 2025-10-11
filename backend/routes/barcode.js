const express = require('express');
const router = express.Router();
const barcodeController = require('../controllers/barcodeController');

/**
 * Barcode Routes
 */

// توليد باركود
router.post('/generate', barcodeController.generateBarcode);

// مسح باركود
router.post('/scan', barcodeController.scanBarcode);

// البحث بالباركود
router.get('/item/:barcode', barcodeController.getItemByBarcode);

// مسح متعدد
router.post('/batch-scan', barcodeController.batchScan);

// سجل المسح
router.get('/history', barcodeController.getScanHistory);

// إحصائيات المسح
router.get('/stats', barcodeController.getScanStats);

module.exports = router;

