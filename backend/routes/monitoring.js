/**
 * Monitoring Routes
 * Health check and monitoring endpoints
 */

const express = require('express');
const router = express.Router();
const Monitoring = require('../utils/monitoring');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeMiddleware = require('../middleware/authorizeMiddleware');

/**
 * Health check endpoint (public)
 * GET /api/monitoring/health
 */
router.get('/health', async (req, res) => {
  try {
    const health = await Monitoring.checkHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Statistics endpoint (requires auth)
 * GET /api/monitoring/statistics
 */
router.get('/statistics', authMiddleware, authorizeMiddleware([1, 'admin']), async (req, res) => {
  try {
    const stats = await Monitoring.getStatistics();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

