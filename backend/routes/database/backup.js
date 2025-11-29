// backend/routes/database/backup.js
const express = require('express');
const router = express.Router();
const databaseBackupController = require('../../controllers/database/databaseBackupController');
const authMiddleware = require('../../middleware/authMiddleware');
const authorizeMiddleware = require('../../middleware/authorizeMiddleware');

// All routes require authentication and admin role (role ID 1)
router.use(authMiddleware);
router.use(authorizeMiddleware([1, 'admin'])); // Support both ID and name for compatibility

// Import auto backup controller
const autoBackupController = require('../../controllers/database/autoBackupController');

// ============================================
// SPECIFIC ROUTES (must be before /:id)
// ============================================

// Get backup statistics
router.get('/statistics', databaseBackupController.getStatistics);

// Cleanup old backups
router.post('/cleanup', databaseBackupController.cleanupOldBackups);

// Auto backup scheduler routes (MUST be before /:id)
router.get('/auto/settings', autoBackupController.getSettings);
router.put('/auto/settings', autoBackupController.updateSettings);
router.post('/auto/start', autoBackupController.start);
router.post('/auto/stop', autoBackupController.stop);
router.post('/auto/test', autoBackupController.testBackup);

// ============================================
// GENERAL ROUTES
// ============================================

// Create backup
router.post('/', databaseBackupController.createBackup);

// List backups
router.get('/', databaseBackupController.listBackups);

// ============================================
// PARAMETERIZED ROUTES (must be last)
// ============================================

// Restore backup (must be before /:id)
router.post('/:id/restore', databaseBackupController.restoreBackup);

// Get backup details
router.get('/:id', databaseBackupController.getBackup);

// Delete backup
router.delete('/:id', databaseBackupController.deleteBackup);

module.exports = router;

