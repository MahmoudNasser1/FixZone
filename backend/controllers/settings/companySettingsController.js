// backend/controllers/settings/companySettingsController.js
const settingsService = require('../../services/settings/settingsService');

/**
 * Get company settings
 */
exports.getCompanySettings = async (req, res) => {
  try {
    const companyKeys = [
      'company.name',
      'company.address',
      'company.phone',
      'company.website',
      'company.logoUrl',
      'company.city',
      'company.country'
    ];

    const settings = {};
    for (const key of companyKeys) {
      try {
        const setting = await settingsService.getSettingByKey(key);
        if (setting) {
          // Extract the property name (e.g., 'name' from 'company.name')
          const prop = key.split('.').pop();
          settings[prop] = setting.value;
        }
      } catch (err) {
        // Setting doesn't exist, skip it
        console.log(`Setting ${key} not found, skipping...`);
      }
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error in getCompanySettings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company settings',
      error: error.message
    });
  }
};

/**
 * Update company settings
 */
exports.updateCompanySettings = async (req, res) => {
  try {
    const { name, address, phone, website, logoUrl, city, country } = req.body;

    const updates = [];
    const errors = [];

    // Validate and update each field
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        errors.push('Company name is required');
      } else {
        updates.push({ key: 'company.name', value: name.trim() });
      }
    }

    if (address !== undefined) {
      updates.push({ key: 'company.address', value: address || '' });
    }

    if (phone !== undefined) {
      // Basic phone validation (Egyptian format)
      const phoneRegex = /^(\+20|0)?1[0-9]{9}$/;
      if (phone && !phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
        errors.push('Invalid phone number format');
      } else {
        updates.push({ key: 'company.phone', value: phone || '' });
      }
    }

    if (website !== undefined) {
      // Basic URL validation
      if (website && website.trim() && !/^https?:\/\/.+/.test(website.trim())) {
        errors.push('Invalid website URL format');
      } else {
        updates.push({ key: 'company.website', value: website || '' });
      }
    }

    if (logoUrl !== undefined) {
      updates.push({ key: 'company.logoUrl', value: logoUrl || '/logo.png' });
    }

    if (city !== undefined) {
      updates.push({ key: 'company.city', value: city || '' });
    }

    if (country !== undefined) {
      updates.push({ key: 'company.country', value: country || '' });
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
        // Check if setting exists
        const existing = await settingsService.getSettingByKey(update.key);
        if (existing) {
          // Update existing
          await settingsService.updateSetting(update.key, {
            value: update.value,
            reason: 'Company settings update'
          });
        } else {
          // Create new
          await settingsService.createSetting({
            key: update.key,
            value: update.value,
            type: 'string',
            category: 'general',
            description: `Company ${update.key.split('.').pop()}`,
            isSystem: false,
            isPublic: true
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
      message: 'Company settings updated successfully',
      data: results
    });
  } catch (error) {
    console.error('Error in updateCompanySettings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company settings',
      error: error.message
    });
  }
};

