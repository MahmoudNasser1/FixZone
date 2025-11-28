// backend/controllers/settings/printingSettingsController.js
const settingsService = require('../../services/settings/settingsService');

/**
 * Get printing settings
 */
exports.getPrintingSettings = async (req, res) => {
  try {
    const printingKeys = [
      'printing.defaultCopy',
      'printing.showWatermark',
      'printing.paperSize',
      'printing.showSerialBarcode'
    ];

    const settings = {};
    for (const key of printingKeys) {
      try {
        const setting = await settingsService.getSettingByKey(key);
        if (setting) {
          const prop = key.split('.').pop();
          // Parse boolean values
          if (prop === 'showWatermark' || prop === 'showSerialBarcode') {
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
    console.error('Error in getPrintingSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch printing settings',
      error: error.message
    });
  }
};

/**
 * Update printing settings
 */
exports.updatePrintingSettings = async (req, res) => {
  try {
    const { defaultCopy, showWatermark, paperSize, showSerialBarcode } = req.body;

    const updates = [];
    const errors = [];

    // Validate defaultCopy
    if (defaultCopy !== undefined) {
      if (defaultCopy !== 'customer' && defaultCopy !== 'archive') {
        errors.push('defaultCopy must be "customer" or "archive"');
      } else {
        updates.push({ key: 'printing.defaultCopy', value: defaultCopy });
      }
    }

    // Validate showWatermark
    if (showWatermark !== undefined) {
      updates.push({ key: 'printing.showWatermark', value: showWatermark ? 'true' : 'false' });
    }

    // Validate paperSize
    if (paperSize !== undefined) {
      const validSizes = ['A4', 'A5', 'Letter', 'Legal'];
      if (!validSizes.includes(paperSize)) {
        errors.push(`paperSize must be one of: ${validSizes.join(', ')}`);
      } else {
        updates.push({ key: 'printing.paperSize', value: paperSize });
      }
    }

    // Validate showSerialBarcode
    if (showSerialBarcode !== undefined) {
      updates.push({ key: 'printing.showSerialBarcode', value: showSerialBarcode ? 'true' : 'false' });
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
            reason: 'Printing settings update'
          });
        } else {
          await settingsService.createSetting({
            key: update.key,
            value: update.value,
            type: update.key.includes('show') ? 'boolean' : 'string',
            category: 'printing',
            description: `Printing ${update.key.split('.').pop()}`,
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
      message: 'Printing settings updated successfully',
      data: results
    });
  } catch (error) {
    console.error('Error in updatePrintingSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update printing settings',
      error: error.message
    });
  }
};

