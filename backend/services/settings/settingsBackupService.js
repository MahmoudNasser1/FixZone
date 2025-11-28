// backend/services/settings/settingsBackupService.js
const settingsRepository = require('../../repositories/settingsRepository');
const settingsBackupRepository = require('../../repositories/settingsBackupRepository');
const settingsService = require('./settingsService');

class SettingsBackupService {
  /**
   * Create backup of all settings
   */
  async createBackup(name, description, userId) {
    try {
      // Get all settings
      const allSettings = await settingsRepository.findAll({}, {});
      
      // Create backup object
      const backup = {
        name: name || `Backup_${new Date().toISOString().replace(/[:.]/g, '-')}`,
        description: description || null,
        settings: allSettings.map(setting => ({
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
        })),
        createdAt: new Date().toISOString(),
        createdBy: userId
      };
      
      // Save backup to database
      const savedBackup = await settingsBackupRepository.create({
        name: backup.name,
        description: backup.description,
        settings: backup.settings,
        createdBy: userId
      });
      
      return savedBackup;
    } catch (error) {
      console.error('Error in createBackup:', error);
      throw error;
    }
  }
  
  /**
   * Restore settings from backup
   */
  async restoreBackup(backupId, userId, options = {}) {
    try {
      const { overwriteExisting = true, skipSystemSettings = true } = options;
      
      // Get backup
      const backup = await settingsBackupRepository.findById(backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }
      
      const restored = [];
      const skipped = [];
      const errors = [];
      
      // Restore each setting
      for (const setting of backup.settings) {
        try {
          // Skip system settings if requested
          if (skipSystemSettings && setting.isSystem) {
            skipped.push({ key: setting.key, reason: 'System setting' });
            continue;
          }
          
          // Check if setting exists
          const existing = await settingsRepository.findByKey(setting.key);
          
          if (existing) {
            if (!overwriteExisting) {
              skipped.push({ key: setting.key, reason: 'Setting already exists' });
              continue;
            }
            
            // Update existing setting
            await settingsService.updateSetting(
              setting.key,
              {
                value: setting.value,
                type: setting.type,
                description: setting.description,
                validationRules: setting.validationRules,
                dependencies: setting.dependencies,
                permissions: setting.permissions
              },
              userId,
              `Restored from backup: ${backup.name}`
            );
            
            restored.push({ key: setting.key, action: 'updated' });
          } else {
            // Create new setting
            await settingsService.createSetting(
              {
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
              },
              userId
            );
            
            restored.push({ key: setting.key, action: 'created' });
          }
        } catch (error) {
          errors.push({ key: setting.key, error: error.message });
        }
      }
      
      return {
        success: true,
        backup: backup.name,
        restored: restored.length,
        skipped: skipped.length,
        errors: errors.length,
        details: {
          restored,
          skipped,
          errors
        }
      };
    } catch (error) {
      console.error('Error in restoreBackup:', error);
      throw error;
    }
  }
  
  /**
   * List all backups
   */
  async listBackups(pagination = {}) {
    try {
      const backups = await settingsBackupRepository.findAll(pagination);
      const count = await settingsBackupRepository.count();
      
      return {
        backups,
        count,
        pagination: {
          limit: pagination.limit || null,
          offset: pagination.offset || 0,
          total: count
        }
      };
    } catch (error) {
      console.error('Error in listBackups:', error);
      throw error;
    }
  }
  
  /**
   * Delete backup
   */
  async deleteBackup(backupId, userId) {
    try {
      await settingsBackupRepository.delete(backupId);
      return { success: true, message: 'Backup deleted successfully' };
    } catch (error) {
      console.error('Error in deleteBackup:', error);
      throw error;
    }
  }
  
  /**
   * Get backup details
   */
  async getBackup(backupId) {
    try {
      const backup = await settingsBackupRepository.findById(backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }
      return backup;
    } catch (error) {
      console.error('Error in getBackup:', error);
      throw error;
    }
  }
}

module.exports = new SettingsBackupService();

