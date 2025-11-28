// backend/controllers/settings/settingsBackupController.js
const settingsBackupService = require('../../services/settings/settingsBackupService');

/**
 * Create backup
 */
exports.createBackup = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;
    
    const backup = await settingsBackupService.createBackup(name, description, userId);
    
    res.status(201).json({
      success: true,
      message: 'Backup created successfully',
      data: backup
    });
  } catch (error) {
    console.error('Error in createBackup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: error.message
    });
  }
};

/**
 * List backups
 */
exports.listBackups = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const pagination = {
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    };
    
    const result = await settingsBackupService.listBackups(pagination);
    
    res.json({
      success: true,
      data: result.backups,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in listBackups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list backups',
      error: error.message
    });
  }
};

/**
 * Get backup details
 */
exports.getBackup = async (req, res) => {
  try {
    const { id } = req.params;
    
    const backup = await settingsBackupService.getBackup(id);
    
    res.json({
      success: true,
      data: backup
    });
  } catch (error) {
    console.error('Error in getBackup:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to get backup',
      error: error.message
    });
  }
};

/**
 * Restore backup
 */
exports.restoreBackup = async (req, res) => {
  try {
    const { id } = req.params;
    const { overwriteExisting = true, skipSystemSettings = true } = req.body;
    const userId = req.user.id;
    
    const result = await settingsBackupService.restoreBackup(id, userId, {
      overwriteExisting,
      skipSystemSettings
    });
    
    res.json({
      success: true,
      message: 'Backup restored successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in restoreBackup:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to restore backup',
      error: error.message
    });
  }
};

/**
 * Delete backup
 */
exports.deleteBackup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    await settingsBackupService.deleteBackup(id, userId);
    
    res.json({
      success: true,
      message: 'Backup deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteBackup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete backup',
      error: error.message
    });
  }
};

