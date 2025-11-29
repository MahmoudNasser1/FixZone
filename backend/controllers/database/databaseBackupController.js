// backend/controllers/database/databaseBackupController.js
const databaseBackupService = require('../../services/database/databaseBackupService');

/**
 * Create database backup
 */
exports.createBackup = async (req, res) => {
  try {
    const { name, description, compress, includeData, includeStructure, tables } = req.body;
    const userId = req.user?.id || null;

    const backup = await databaseBackupService.createBackup({
      name,
      description,
      compress: compress !== false, // Default true
      includeData: includeData !== false, // Default true
      includeStructure: includeStructure !== false, // Default true
      tables: tables || null,
      userId
    });

    res.json({
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
    const { startDate, endDate, type } = req.query;
    
    const backups = await databaseBackupService.listBackups({
      startDate,
      endDate,
      type
    });

    res.json({
      success: true,
      data: backups,
      count: backups.length
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
    const backup = await databaseBackupService.getBackup(id);

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
    const { dropDatabase, createDatabase } = req.body;
    const userId = req.user?.id || null;

    const result = await databaseBackupService.restoreBackup(id, {
      dropDatabase: dropDatabase === true,
      createDatabase: createDatabase !== false, // Default true
      userId
    });

    res.json({
      success: true,
      message: 'Backup restored successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in restoreBackup:', error);
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
    await databaseBackupService.deleteBackup(id);

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

/**
 * Get backup statistics
 */
exports.getStatistics = async (req, res) => {
  try {
    const stats = await databaseBackupService.getStatistics();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getStatistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message
    });
  }
};

/**
 * Cleanup old backups
 */
exports.cleanupOldBackups = async (req, res) => {
  try {
    const { daysToKeep = 30 } = req.body;
    const result = await databaseBackupService.cleanupOldBackups(daysToKeep);

    res.json({
      success: true,
      message: `Cleaned up ${result.deleted} old backup(s)`,
      data: result
    });
  } catch (error) {
    console.error('Error in cleanupOldBackups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup old backups',
      error: error.message
    });
  }
};

