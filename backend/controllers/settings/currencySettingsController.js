// backend/controllers/settings/currencySettingsController.js
const settingsService = require('../../services/settings/settingsService');

/**
 * Get currency settings
 */
exports.getCurrencySettings = async (req, res) => {
  try {
    const currencyKeys = [
      'currency.code',
      'currency.symbol',
      'currency.name',
      'currency.locale',
      'currency.minimumFractionDigits',
      'currency.position'
    ];

    const settings = {};
    for (const key of currencyKeys) {
      try {
        const setting = await settingsService.getSettingByKey(key);
        if (setting) {
          const prop = key.split('.').pop();
          // Parse numeric values
          if (prop === 'minimumFractionDigits') {
            settings[prop] = parseInt(setting.value) || 2;
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
    console.error('Error in getCurrencySettings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch currency settings',
      error: error.message
    });
  }
};

/**
 * Update currency settings
 */
exports.updateCurrencySettings = async (req, res) => {
  try {
    const { code, symbol, name, locale, minimumFractionDigits, position } = req.body;

    const updates = [];
    const errors = [];

    // Validate currency code
    if (code !== undefined) {
      if (typeof code !== 'string' || code.length !== 3) {
        errors.push('Currency code must be 3 characters (ISO 4217)');
      } else {
        updates.push({ key: 'currency.code', value: code.toUpperCase() });
      }
    }

    if (symbol !== undefined) {
      if (typeof symbol !== 'string' || symbol.trim().length === 0) {
        errors.push('Currency symbol is required');
      } else {
        updates.push({ key: 'currency.symbol', value: symbol.trim() });
      }
    }

    if (name !== undefined) {
      updates.push({ key: 'currency.name', value: name || '' });
    }

    if (locale !== undefined) {
      // Basic locale validation (format: xx-XX)
      if (locale && !/^[a-z]{2}-[A-Z]{2}$/.test(locale)) {
        errors.push('Invalid locale format (expected: xx-XX)');
      } else {
        updates.push({ key: 'currency.locale', value: locale || 'ar-EG' });
      }
    }

    if (minimumFractionDigits !== undefined) {
      const digits = parseInt(minimumFractionDigits);
      if (isNaN(digits) || digits < 0 || digits > 10) {
        errors.push('Minimum fraction digits must be between 0 and 10');
      } else {
        updates.push({ key: 'currency.minimumFractionDigits', value: digits.toString() });
      }
    }

    if (position !== undefined) {
      if (position !== 'before' && position !== 'after') {
        errors.push('Position must be "before" or "after"');
      } else {
        updates.push({ key: 'currency.position', value: position });
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
    const userId = req.user?.id || 1; // Default to admin user ID if not provided

    for (const update of updates) {
      try {
        const existing = await settingsService.getSettingByKey(update.key);
        if (existing) {
          await settingsService.updateSetting(update.key, {
            value: update.value,
            reason: 'Currency settings update'
          }, userId);
        } else {
          await settingsService.createSetting({
            key: update.key,
            value: update.value,
            type: update.key.includes('minimumFractionDigits') ? 'number' : 'string',
            category: 'currency',
            description: `Currency ${update.key.split('.').pop()}`,
            isSystem: false,
            isPublic: true
          }, userId);
        }
        results.push({ key: update.key, success: true });
      } catch (err) {
        console.error(`Error updating ${update.key}:`, err);
        results.push({ key: update.key, success: false, error: err.message });
      }
    }

    res.json({
      success: true,
      message: 'Currency settings updated successfully',
      data: results
    });
  } catch (error) {
    console.error('Error in updateCurrencySettings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update currency settings',
      error: error.message
    });
  }
};

