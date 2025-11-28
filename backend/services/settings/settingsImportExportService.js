// backend/services/settings/settingsImportExportService.js
const settingsRepository = require('../../repositories/settingsRepository');
const settingsService = require('./settingsService');
const fs = require('fs').promises;
const path = require('path');

class SettingsImportExportService {
  /**
   * Export settings to JSON file
   */
  async exportSettings(format = 'json', filters = {}) {
    try {
      // Get all settings based on filters
      const settings = await settingsRepository.findAll(filters, {});
      
      // Prepare export data
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        exportedBy: 'system',
        settings: settings.map(setting => ({
          key: setting.key,
          value: setting.value,
          type: setting.type,
          category: setting.category,
          description: setting.description,
          isEncrypted: setting.isEncrypted,
          isSystem: setting.isSystem,
          isPublic: setting.isPublic,
          defaultValue: setting.defaultValue,
          validationRules: setting.validationRules,
          dependencies: setting.dependencies,
          environment: setting.environment,
          permissions: setting.permissions,
          metadata: setting.metadata
        }))
      };
      
      if (format === 'json') {
        return {
          format: 'json',
          data: JSON.stringify(exportData, null, 2),
          filename: `settings_export_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
        };
      }
      
      throw new Error(`Unsupported export format: ${format}`);
    } catch (error) {
      console.error('Error in exportSettings:', error);
      throw error;
    }
  }
  
  /**
   * Import settings from file
   */
  async importSettings(filePath, userId, options = {}) {
    try {
      const { overwriteExisting = false, skipSystemSettings = true, validateOnly = false } = options;
      
      // Read file
      const fileContent = await fs.readFile(filePath, 'utf8');
      const importData = JSON.parse(fileContent);
      
      // Validate import data structure
      if (!importData.settings || !Array.isArray(importData.settings)) {
        throw new Error('Invalid import file format');
      }
      
      const imported = [];
      const skipped = [];
      const errors = [];
      
      // Process each setting
      for (const setting of importData.settings) {
        try {
          // Skip system settings if requested
          if (skipSystemSettings && setting.isSystem) {
            skipped.push({ key: setting.key, reason: 'System setting' });
            continue;
          }
          
          // Validate required fields
          if (!setting.key || setting.value === undefined) {
            errors.push({ key: setting.key || 'unknown', error: 'Missing required fields' });
            continue;
          }
          
          // Check if setting exists
          const existing = await settingsRepository.findByKey(setting.key);
          
          if (existing) {
            if (!overwriteExisting) {
              skipped.push({ key: setting.key, reason: 'Setting already exists' });
              continue;
            }
            
            if (!validateOnly) {
              // Update existing setting
              await settingsService.updateSetting(
                setting.key,
                {
                  value: setting.value,
                  type: setting.type || existing.type,
                  description: setting.description,
                  validationRules: setting.validationRules,
                  dependencies: setting.dependencies,
                  permissions: setting.permissions
                },
                userId,
                `Imported from file: ${path.basename(filePath)}`
              );
            }
            
            imported.push({ key: setting.key, action: 'updated' });
          } else {
            if (!validateOnly) {
              // Create new setting
              await settingsService.createSetting(
                {
                  key: setting.key,
                  value: setting.value,
                  type: setting.type || 'string',
                  category: setting.category || 'general',
                  description: setting.description,
                  isEncrypted: setting.isEncrypted || false,
                  isSystem: setting.isSystem || false,
                  isPublic: setting.isPublic || false,
                  defaultValue: setting.defaultValue,
                  validationRules: setting.validationRules,
                  dependencies: setting.dependencies,
                  environment: setting.environment || 'all',
                  permissions: setting.permissions,
                  metadata: setting.metadata
                },
                userId
              );
            }
            
            imported.push({ key: setting.key, action: 'created' });
          }
        } catch (error) {
          errors.push({ key: setting.key, error: error.message });
        }
      }
      
      return {
        success: true,
        validateOnly,
        imported: imported.length,
        skipped: skipped.length,
        errors: errors.length,
        details: {
          imported,
          skipped,
          errors
        }
      };
    } catch (error) {
      console.error('Error in importSettings:', error);
      throw error;
    }
  }
  
  /**
   * Get export template
   */
  async getExportTemplate() {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exportedBy: 'template',
      settings: [
        {
          key: 'example.setting.key',
          value: 'example value',
          type: 'string',
          category: 'general',
          description: 'Example setting description',
          isEncrypted: false,
          isSystem: false,
          isPublic: false,
          defaultValue: null,
          validationRules: null,
          dependencies: null,
          environment: 'all',
          permissions: null,
          metadata: null
        }
      ]
    };
  }
  
  /**
   * Validate import file
   */
  async validateImportFile(filePath) {
    try {
      const result = await this.importSettings(filePath, null, {
        validateOnly: true,
        overwriteExisting: false,
        skipSystemSettings: true
      });
      
      return {
        valid: result.errors.length === 0,
        ...result
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

module.exports = new SettingsImportExportService();

