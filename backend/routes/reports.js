const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports');

router.get('/summary', reportsController.getSummaryReport);
router.get('/inventory', reportsController.getInventoryReport);

module.exports = router; 