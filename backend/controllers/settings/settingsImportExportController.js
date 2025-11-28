// backend/controllers/settings/settingsImportExportController.js
const settingsImportExportService = require('../../services/settings/settingsImportExportService');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.json') {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'));
    }
  }
});

/**
 * Export settings
 */
exports.exportSettings = async (req, res) => {
  try {
    const { format = 'json', category, environment } = req.query;
    
    const filters = {};
    if (category) filters.category = category;
    if (environment) filters.environment = environment;
    
    const result = await settingsImportExportService.exportSettings(format, filters);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  } catch (error) {
    console.error('Error in exportSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export settings',
      error: error.message
    });
  }
};

/**
 * Import settings
 */
exports.importSettings = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const { overwriteExisting = false, skipSystemSettings = true } = req.body;
    const userId = req.user.id;
    const filePath = req.file.path;
    
    try {
      const result = await settingsImportExportService.importSettings(filePath, userId, {
        overwriteExisting: overwriteExisting === 'true' || overwriteExisting === true,
        skipSystemSettings: skipSystemSettings === 'true' || skipSystemSettings === true
      });
      
      // Clean up uploaded file
      await fs.unlink(filePath).catch(() => {});
      
      res.json({
        success: true,
        message: 'Settings imported successfully',
        data: result
      });
    } catch (error) {
      // Clean up uploaded file on error
      await fs.unlink(filePath).catch(() => {});
      throw error;
    }
  } catch (error) {
    console.error('Error in importSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import settings',
      error: error.message
    });
  }
};

/**
 * Get export template
 */
exports.getExportTemplate = async (req, res) => {
  try {
    const template = await settingsImportExportService.getExportTemplate();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="settings_template.json"');
    res.json(template);
  } catch (error) {
    console.error('Error in getExportTemplate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get export template',
      error: error.message
    });
  }
};

/**
 * Validate import file
 */
exports.validateImportFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const filePath = req.file.path;
    
    try {
      const result = await settingsImportExportService.validateImportFile(filePath);
      
      // Clean up uploaded file
      await fs.unlink(filePath).catch(() => {});
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      // Clean up uploaded file on error
      await fs.unlink(filePath).catch(() => {});
      throw error;
    }
  } catch (error) {
    console.error('Error in validateImportFile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate import file',
      error: error.message
    });
  }
};

// Export multer upload middleware
exports.upload = upload.single('file');

