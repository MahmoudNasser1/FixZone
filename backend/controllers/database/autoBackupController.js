// backend/controllers/database/autoBackupController.js
const autoBackupScheduler = require('../../services/database/autoBackupScheduler');

/**
 * Get auto backup settings
 */
exports.getSettings = async (req, res) => {
  try {
    const settings = autoBackupScheduler.getSettings();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error in getSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settings',
      error: error.message
    });
  }
};

/**
 * Update auto backup settings
 */
exports.updateSettings = async (req, res) => {
  try {
    const result = await autoBackupScheduler.updateSettings(req.body);
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in updateSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
};

/**
 * Start scheduler
 */
exports.start = async (req, res) => {
  try {
    await autoBackupScheduler.start();
    res.json({
      success: true,
      message: 'Scheduler started successfully'
    });
  } catch (error) {
    console.error('Error in start:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start scheduler',
      error: error.message
    });
  }
};

/**
 * Stop scheduler
 */
exports.stop = async (req, res) => {
  try {
    autoBackupScheduler.stop();
    res.json({
      success: true,
      message: 'Scheduler stopped successfully'
    });
  } catch (error) {
    console.error('Error in stop:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop scheduler',
      error: error.message
    });
  }
};

/**
 * Test backup
 */
exports.testBackup = async (req, res) => {
  try {
    const { type = 'daily' } = req.body;
    const result = await autoBackupScheduler.testBackup(type);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error in testBackup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test backup',
      error: error.message
    });
  }
};

