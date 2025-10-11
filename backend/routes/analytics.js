const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Analytics Routes

// GET /api/analytics/inventory-value - تحليل قيمة المخزون
router.get('/inventory-value', analyticsController.getInventoryValue);

// GET /api/analytics/turnover-rate - معدل الدوران
router.get('/turnover-rate', analyticsController.getTurnoverRate);

// GET /api/analytics/abc-analysis - تحليل ABC
router.get('/abc-analysis', analyticsController.getABCAnalysis);

// GET /api/analytics/slow-moving - الأصناف بطيئة الحركة
router.get('/slow-moving', analyticsController.getSlowMovingItems);

// GET /api/analytics/profit-margin - تحليل هامش الربح
router.get('/profit-margin', analyticsController.getProfitMarginAnalysis);

// GET /api/analytics/forecasting - التنبؤ بالطلب
router.get('/forecasting', analyticsController.getForecasting);

// GET /api/analytics/summary - ملخص التحليلات
router.get('/summary', analyticsController.getAnalyticsSummary);

// Default route
router.get('/', analyticsController.getAnalyticsSummary);

module.exports = router;

