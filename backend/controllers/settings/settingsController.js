// backend/controllers/settings/settingsController.js
const settingsService = require('../../services/settings/settingsService');
const { validateSetting, validateUpdateSetting, validateBatchUpdate } = require('../../models/setting');

/**
 * Get all settings
 */
exports.getAllSettings = async (req, res) => {
  try {
    const { category, environment, search, page = 1, limit = 50 } = req.query;
    
    const filters = {};
    if (category) filters.category = category;
    if (environment) filters.environment = environment;
    if (search) filters.search = search;
    
    const pagination = {
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    };
    
    const result = await settingsService.getAllSettings(filters, pagination);
    
    res.json({
      success: true,
      data: result.settings,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getAllSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
};

/**
 * Get setting by key
 */
exports.getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Setting key is required'
      });
    }
    
    const setting = await settingsService.getSettingByKey(key);
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: `Setting with key "${key}" not found`
      });
    }
    
    res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Error in getSettingByKey:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch setting',
      error: error.message
    });
  }
};

/**
 * Get settings by category
 */
exports.getSettingsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }
    
    const settings = await settingsService.getSettingsByCategory(category);
    
    res.json({
      success: true,
      data: settings,
      count: settings.length
    });
  } catch (error) {
    console.error('Error in getSettingsByCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
};

/**
 * Create new setting
 */
exports.createSetting = async (req, res) => {
  try {
    const { error, value } = validateSetting(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(d => d.message)
      });
    }
    
    const userId = req.user.id;
    const setting = await settingsService.createSetting(value, userId);
    
    res.status(201).json({
      success: true,
      message: 'Setting created successfully',
      data: setting
    });
  } catch (error) {
    console.error('Error in createSetting:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create setting',
      error: error.message
    });
  }
};

/**
 * Update setting
 */
exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { error, value } = validateUpdateSetting(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(d => d.message)
      });
    }
    
    const userId = req.user.id;
    const reason = req.body.reason || null;
    
    const setting = await settingsService.updateSetting(key, value, userId, reason);
    
    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: setting
    });
  } catch (error) {
    console.error('Error in updateSetting:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update setting',
      error: error.message
    });
  }
};

/**
 * Delete setting
 */
exports.deleteSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const userId = req.user.id;
    const reason = req.body.reason || null;
    
    await settingsService.deleteSetting(key, userId, reason);
    
    res.json({
      success: true,
      message: 'Setting deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteSetting:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('Cannot delete')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete setting',
      error: error.message
    });
  }
};

/**
 * Batch update settings
 */
exports.batchUpdateSettings = async (req, res) => {
  try {
    const { error, value } = validateBatchUpdate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(d => d.message)
      });
    }
    
    const userId = req.user.id;
    const reason = req.body.reason || 'Batch update';
    
    const results = await settingsService.batchUpdateSettings(value, userId, reason);
    
    res.json({
      success: true,
      message: 'Batch update completed',
      data: results
    });
  } catch (error) {
    console.error('Error in batchUpdateSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to batch update settings',
      error: error.message
    });
  }
};

/**
 * Search settings
 */
exports.searchSettings = async (req, res) => {
  try {
    const { q, category, environment } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const filters = {};
    if (category) filters.category = category;
    if (environment) filters.environment = environment;
    
    const settings = await settingsService.searchSettings(q, filters);
    
    res.json({
      success: true,
      data: settings,
      count: settings.length
    });
  } catch (error) {
    console.error('Error in searchSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search settings',
      error: error.message
    });
  }
};

/**
 * Get setting history
 */
exports.getSettingHistory = async (req, res) => {
  try {
    const { key } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const pagination = {
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    };
    
    const history = await settingsService.getSettingHistory(key, pagination);
    
    res.json({
      success: true,
      data: history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: history.length
      }
    });
  } catch (error) {
    console.error('Error in getSettingHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch setting history',
      error: error.message
    });
  }
};

/**
 * Rollback setting
 */
exports.rollbackSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { historyId } = req.body;
    
    if (!historyId) {
      return res.status(400).json({
        success: false,
        message: 'History ID is required'
      });
    }
    
    const userId = req.user.id;
    const setting = await settingsService.rollbackSetting(key, historyId, userId);
    
    res.json({
      success: true,
      message: 'Setting rolled back successfully',
      data: setting
    });
  } catch (error) {
    console.error('Error in rollbackSetting:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to rollback setting',
      error: error.message
    });
  }
};

