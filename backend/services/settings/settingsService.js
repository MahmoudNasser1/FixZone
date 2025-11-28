// backend/services/settings/settingsService.js
const settingsRepository = require('../../repositories/settingsRepository');
const settingsHistoryRepository = require('../../repositories/settingsHistoryRepository');
const settingsCacheService = require('./settingsCacheService');
const settingsValidationService = require('./settingsValidationService');

class SettingsService {
  /**
   * Get all settings with filters and pagination
   */
  async getAllSettings(filters = {}, pagination = {}) {
    try {
      // Try cache first
      const cacheKey = `settings:all:${JSON.stringify(filters)}:${JSON.stringify(pagination)}`;
      const cached = await settingsCacheService.get(cacheKey);
      if (cached) {
        return cached;
      }
      
      const settings = await settingsRepository.findAll(filters, pagination);
      const count = await settingsRepository.count(filters);
      
      const result = {
        settings,
        count,
        pagination: {
          limit: pagination.limit || null,
          offset: pagination.offset || 0,
          total: count
        }
      };
      
      // Cache for 5 minutes
      await settingsCacheService.set(cacheKey, result, 300);
      
      return result;
    } catch (error) {
      console.error('Error in getAllSettings:', error);
      throw error;
    }
  }
  
  /**
   * Get setting by key
   */
  async getSettingByKey(key) {
    try {
      // Try cache first
      const cacheKey = `settings:key:${key}`;
      const cached = await settingsCacheService.get(cacheKey);
      if (cached) {
        return cached;
      }
      
      const setting = await settingsRepository.findByKey(key);
      
      if (setting) {
        // Cache for 5 minutes
        await settingsCacheService.set(cacheKey, setting, 300);
      }
      
      return setting;
    } catch (error) {
      console.error('Error in getSettingByKey:', error);
      throw error;
    }
  }
  
  /**
   * Get settings by category
   */
  async getSettingsByCategory(category) {
    try {
      // Try cache first
      const cacheKey = `settings:category:${category}`;
      const cached = await settingsCacheService.get(cacheKey);
      if (cached) {
        return cached;
      }
      
      const settings = await settingsRepository.findByCategory(category);
      
      // Cache for 5 minutes
      await settingsCacheService.set(cacheKey, settings, 300);
      
      return settings;
    } catch (error) {
      console.error('Error in getSettingsByCategory:', error);
      throw error;
    }
  }
  
  /**
   * Create new setting
   */
  async createSetting(settingData, userId) {
    try {
      // Validate setting data
      await settingsValidationService.validateSetting(settingData.key, settingData.value, settingData.type, settingData.validationRules);
      
      // Check if setting already exists
      const existing = await settingsRepository.findByKey(settingData.key);
      if (existing) {
        throw new Error(`Setting with key "${settingData.key}" already exists`);
      }
      
      // Create setting
      const setting = await settingsRepository.create(settingData);
      
      // Log history
      await settingsHistoryRepository.create({
        settingId: setting.id,
        settingKey: setting.key,
        oldValue: null,
        newValue: setting.value,
        changedBy: userId,
        changeReason: 'Setting created'
      });
      
      // Invalidate cache
      await settingsCacheService.invalidateCache(`settings:key:${setting.key}`);
      await settingsCacheService.invalidateCache('settings:all');
      await settingsCacheService.invalidateCache(`settings:category:${setting.category}`);
      
      return setting;
    } catch (error) {
      console.error('Error in createSetting:', error);
      throw error;
    }
  }
  
  /**
   * Update setting
   */
  async updateSetting(key, settingData, userId, reason = null) {
    try {
      // Get existing setting
      const existing = await settingsRepository.findByKey(key);
      if (!existing) {
        throw new Error(`Setting with key "${key}" not found`);
      }
      
      // Validate new value
      const newValue = settingData.value !== undefined ? settingData.value : existing.value;
      const type = settingData.type || existing.type;
      const validationRules = settingData.validationRules || existing.validationRules;
      
      await settingsValidationService.validateSetting(key, newValue, type, validationRules);
      
      // Check dependencies
      await settingsValidationService.checkDependencies(key, newValue, existing.dependencies);
      
      // Update setting
      const updated = await settingsRepository.update(key, settingData);
      
      // Log history
      await settingsHistoryRepository.create({
        settingId: existing.id,
        settingKey: key,
        oldValue: existing.value,
        newValue: updated.value,
        changedBy: userId,
        changeReason: reason || 'Setting updated'
      });
      
      // Invalidate cache
      await settingsCacheService.invalidateCache(`settings:key:${key}`);
      await settingsCacheService.invalidateCache('settings:all');
      await settingsCacheService.invalidateCache(`settings:category:${existing.category}`);
      
      return updated;
    } catch (error) {
      console.error('Error in updateSetting:', error);
      throw error;
    }
  }
  
  /**
   * Delete setting (soft delete)
   */
  async deleteSetting(key, userId, reason = null) {
    try {
      // Get existing setting
      const existing = await settingsRepository.findByKey(key);
      if (!existing) {
        throw new Error(`Setting with key "${key}" not found`);
      }
      
      // Check if system setting (cannot delete)
      if (existing.isSystem) {
        throw new Error('Cannot delete system setting');
      }
      
      // Delete setting
      await settingsRepository.delete(key);
      
      // Log history
      await settingsHistoryRepository.create({
        settingId: existing.id,
        settingKey: key,
        oldValue: existing.value,
        newValue: null,
        changedBy: userId,
        changeReason: reason || 'Setting deleted'
      });
      
      // Invalidate cache
      await settingsCacheService.invalidateCache(`settings:key:${key}`);
      await settingsCacheService.invalidateCache('settings:all');
      await settingsCacheService.invalidateCache(`settings:category:${existing.category}`);
      
      return true;
    } catch (error) {
      console.error('Error in deleteSetting:', error);
      throw error;
    }
  }
  
  /**
   * Batch update settings
   */
  async batchUpdateSettings(settings, userId, reason = null) {
    try {
      const results = [];
      
      for (const setting of settings) {
        try {
          const updated = await this.updateSetting(
            setting.key,
            { value: setting.value },
            userId,
            reason || 'Batch update'
          );
          results.push({ key: setting.key, success: true, setting: updated });
        } catch (error) {
          results.push({ key: setting.key, success: false, error: error.message });
        }
      }
      
      // Invalidate all cache
      await settingsCacheService.invalidateAllCache();
      
      return results;
    } catch (error) {
      console.error('Error in batchUpdateSettings:', error);
      throw error;
    }
  }
  
  /**
   * Search settings
   */
  async searchSettings(query, filters = {}) {
    try {
      const searchFilters = {
        ...filters,
        search: query
      };
      
      return await settingsRepository.findAll(searchFilters);
    } catch (error) {
      console.error('Error in searchSettings:', error);
      throw error;
    }
  }
  
  /**
   * Get setting history
   */
  async getSettingHistory(key, pagination = {}) {
    try {
      return await settingsHistoryRepository.findBySettingKey(key, pagination);
    } catch (error) {
      console.error('Error in getSettingHistory:', error);
      throw error;
    }
  }
  
  /**
   * Rollback setting to previous version
   */
  async rollbackSetting(key, historyId, userId) {
    try {
      // Get history entry
      const history = await settingsHistoryRepository.findById(historyId);
      if (!history || history.settingKey !== key) {
        throw new Error('History entry not found');
      }
      
      // Get current setting
      const current = await settingsRepository.findByKey(key);
      if (!current) {
        throw new Error('Setting not found');
      }
      
      // Update to old value
      const updated = await this.updateSetting(
        key,
        { value: history.oldValue },
        userId,
        `Rollback to history entry #${historyId}`
      );
      
      return updated;
    } catch (error) {
      console.error('Error in rollbackSetting:', error);
      throw error;
    }
  }
}

module.exports = new SettingsService();

