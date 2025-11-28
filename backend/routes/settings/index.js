// backend/routes/settings/index.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const authorizeMiddleware = require('../../middleware/authorizeMiddleware');
const settingsController = require('../../controllers/settings/settingsController');
const {
  settingsReadRateLimit,
  settingsWriteRateLimit,
  settingsAdminRateLimit,
  settingsImportExportRateLimit
} = require('../../middleware/settings/settingsRateLimit');
const auditSettingsChange = require('../../middleware/settings/settingsAudit');
const { encryptSensitiveSettings } = require('../../middleware/settings/settingsEncryption');
const {
  validate,
  createSettingSchema,
  updateSettingSchema,
  batchUpdateSchema,
  searchSchema,
  rollbackSchema
} = require('../../validators/settingsValidators');

// All routes require authentication and admin role (role ID 1)
router.use(authMiddleware);
router.use(authorizeMiddleware([1]));
router.use(auditSettingsChange);

// ⚠️ IMPORTANT: Specific routes MUST come before parameterized routes (/:key)
// Otherwise Express will match /backups as /:key where key="backups"

// Main settings routes (Read operations - rate limited)
router.get('/', settingsReadRateLimit, settingsController.getAllSettings);
router.get('/search', settingsReadRateLimit, validate(searchSchema, 'query'), settingsController.searchSettings);
router.get('/category/:category', settingsReadRateLimit, settingsController.getSettingsByCategory);

// Backup/Restore routes (MUST be before /:key)
const settingsBackupController = require('../../controllers/settings/settingsBackupController');
router.get('/backups', settingsReadRateLimit, settingsBackupController.listBackups);
router.get('/backups/:id', settingsReadRateLimit, settingsBackupController.getBackup);
router.post('/backups', settingsAdminRateLimit, settingsBackupController.createBackup);
router.post('/backups/:id/restore', settingsAdminRateLimit, settingsBackupController.restoreBackup);
router.delete('/backups/:id', settingsAdminRateLimit, settingsBackupController.deleteBackup);

// Import/Export routes (MUST be before /:key)
const settingsImportExportController = require('../../controllers/settings/settingsImportExportController');
router.get('/export', settingsImportExportRateLimit, settingsImportExportController.exportSettings);
router.get('/export/template', settingsReadRateLimit, settingsImportExportController.getExportTemplate);
router.post('/import', settingsImportExportRateLimit, settingsImportExportController.upload, settingsImportExportController.importSettings);
router.post('/import/validate', settingsReadRateLimit, settingsImportExportController.upload, settingsImportExportController.validateImportFile);

// Company and Currency settings routes (MUST be before /:key)
const companySettingsController = require('../../controllers/settings/companySettingsController');
const currencySettingsController = require('../../controllers/settings/currencySettingsController');
const printingSettingsController = require('../../controllers/settings/printingSettingsController');
const localeSettingsController = require('../../controllers/settings/localeSettingsController');
router.get('/company', settingsReadRateLimit, companySettingsController.getCompanySettings);
router.put('/company', settingsWriteRateLimit, companySettingsController.updateCompanySettings);
router.get('/currency', settingsReadRateLimit, currencySettingsController.getCurrencySettings);
router.put('/currency', settingsWriteRateLimit, currencySettingsController.updateCurrencySettings);
router.get('/printing', settingsReadRateLimit, printingSettingsController.getPrintingSettings);
router.put('/printing', settingsWriteRateLimit, printingSettingsController.updatePrintingSettings);
router.get('/locale', settingsReadRateLimit, localeSettingsController.getLocaleSettings);
router.put('/locale', settingsWriteRateLimit, localeSettingsController.updateLocaleSettings);

// Write operations (rate limited + encryption)
router.post('/', settingsWriteRateLimit, encryptSensitiveSettings, validate(createSettingSchema), settingsController.createSetting);
router.post('/batch', settingsWriteRateLimit, validate(batchUpdateSchema), settingsController.batchUpdateSettings);

// History routes (MUST be before /:key)
router.get('/:key/history', settingsReadRateLimit, settingsController.getSettingHistory);
router.post('/:key/rollback', settingsAdminRateLimit, validate(rollbackSchema), settingsController.rollbackSetting);

// Parameterized routes (MUST be last - matches any key)
router.get('/:key', settingsReadRateLimit, settingsController.getSettingByKey);
router.put('/:key', settingsWriteRateLimit, encryptSensitiveSettings, validate(updateSettingSchema), settingsController.updateSetting);
router.delete('/:key', settingsAdminRateLimit, settingsController.deleteSetting);

module.exports = router;

