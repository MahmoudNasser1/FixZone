// backend/controllers/settings/localeSettingsController.js
const settingsService = require('../../services/settings/settingsService');

/**
 * Get locale settings
 */
exports.getLocaleSettings = async (req, res) => {
  try {
    const localeKeys = [
      'locale.rtl',
      'locale.dateFormat'
    ];

    const settings = {};
    for (const key of localeKeys) {
      try {
        const setting = await settingsService.getSettingByKey(key);
        if (setting) {
          const prop = key.split('.').pop();
          // Parse boolean values
          if (prop === 'rtl') {
            settings[prop] = setting.value === 'true' || setting.value === true;
          } else {
            settings[prop] = setting.value;
          }
        }
      } catch (err) {
        console.log(`Setting ${key} not found, skipping...`);
      }
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error in getLocaleSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch locale settings',
      error: error.message
    });
  }
};

/**
 * Update locale settings
 */
exports.updateLocaleSettings = async (req, res) => {
  try {
    const { rtl, dateFormat } = req.body;

    const updates = [];
    const errors = [];

    // Validate rtl
    if (rtl !== undefined) {
      updates.push({ key: 'locale.rtl', value: rtl ? 'true' : 'false' });
    }

    // Validate dateFormat
    if (dateFormat !== undefined) {
      // Basic date format validation
      const validFormats = ['yyyy/MM/dd', 'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'dd-MM-yyyy'];
      if (!validFormats.includes(dateFormat) && !/^[yMdHhms\/\-\s]+$/.test(dateFormat)) {
        errors.push('Invalid date format');
      } else {
        updates.push({ key: 'locale.dateFormat', value: dateFormat });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors
      });
    }

    // Update all settings
    const results = [];
    for (const update of updates) {
      try {
        const existing = await settingsService.getSettingByKey(update.key);
        if (existing) {
          await settingsService.updateSetting(update.key, {
            value: update.value,
            reason: 'Locale settings update'
          });
        } else {
          await settingsService.createSetting({
            key: update.key,
            value: update.value,
            type: update.key.includes('rtl') ? 'boolean' : 'string',
            category: 'locale',
            description: `Locale ${update.key.split('.').pop()}`,
            isSystem: false,
            isPublic: false
          });
        }
        results.push({ key: update.key, success: true });
      } catch (err) {
        console.error(`Error updating ${update.key}:`, err);
        results.push({ key: update.key, success: false, error: err.message });
      }
    }

    res.json({
      success: true,
      message: 'Locale settings updated successfully',
      data: results
    });
  } catch (error) {
    console.error('Error in updateLocaleSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update locale settings',
      error: error.message
    });
  }
};

