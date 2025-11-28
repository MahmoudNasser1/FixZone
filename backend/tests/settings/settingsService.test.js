// backend/tests/settings/settingsService.test.js
const settingsService = require('../../services/settings/settingsService');
const settingsRepository = require('../../repositories/settingsRepository');
const settingsCacheService = require('../../services/settings/settingsCacheService');
const settingsValidationService = require('../../services/settings/settingsValidationService');
const settingsHistoryRepository = require('../../repositories/settingsHistoryRepository');

// Mock dependencies
jest.mock('../../repositories/settingsRepository');
jest.mock('../../services/settings/settingsCacheService');
jest.mock('../../services/settings/settingsValidationService');
jest.mock('../../repositories/settingsHistoryRepository');

describe('SettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllSettings', () => {
    it('should return all settings from cache if available', async () => {
      const mockResult = {
        settings: [
          { id: 1, key: 'company.name', value: 'Fix Zone', type: 'string' },
          { id: 2, key: 'currency.code', value: 'EGP', type: 'string' },
        ],
        count: 2,
        pagination: { limit: null, offset: 0, total: 2 }
      };
      const cacheKey = 'settings:all:{}:{}';

      settingsCacheService.get.mockResolvedValue(mockResult);

      const result = await settingsService.getAllSettings();

      expect(result).toEqual(mockResult);
      expect(settingsCacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(settingsRepository.findAll).not.toHaveBeenCalled();
    });

    it('should fetch from database if cache is empty', async () => {
      const mockSettings = [
        { id: 1, key: 'company.name', value: 'Fix Zone', type: 'string' },
      ];
      const mockResult = {
        settings: mockSettings,
        count: 1,
        pagination: { limit: null, offset: 0, total: 1 }
      };
      const cacheKey = 'settings:all:{}:{}';

      settingsCacheService.get.mockResolvedValue(null);
      settingsRepository.findAll.mockResolvedValue(mockSettings);
      settingsRepository.count.mockResolvedValue(1);
      settingsCacheService.set.mockResolvedValue(true);

      const result = await settingsService.getAllSettings();

      expect(result.settings).toEqual(mockSettings);
      expect(result.count).toBe(1);
      expect(settingsRepository.findAll).toHaveBeenCalled();
      expect(settingsCacheService.set).toHaveBeenCalledWith(cacheKey, expect.any(Object), 300);
    });
  });

  describe('getSettingByKey', () => {
    it('should return setting by key from cache', async () => {
      const mockSetting = { id: 1, key: 'company.name', value: 'Fix Zone', type: 'string' };
      const cacheKey = 'settings:key:company.name';

      settingsCacheService.get.mockResolvedValue(mockSetting);

      const result = await settingsService.getSettingByKey('company.name');

      expect(result).toEqual(mockSetting);
      expect(settingsCacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(settingsRepository.findByKey).not.toHaveBeenCalled();
    });

    it('should fetch from database if not in cache', async () => {
      const mockSetting = { id: 1, key: 'company.name', value: 'Fix Zone', type: 'string' };
      const cacheKey = 'settings:key:company.name';

      settingsCacheService.get.mockResolvedValue(null);
      settingsRepository.findByKey.mockResolvedValue(mockSetting);
      settingsCacheService.set.mockResolvedValue(true);

      const result = await settingsService.getSettingByKey('company.name');

      expect(result).toEqual(mockSetting);
      expect(settingsRepository.findByKey).toHaveBeenCalledWith('company.name');
      expect(settingsCacheService.set).toHaveBeenCalledWith(cacheKey, mockSetting, 300);
    });

    it('should return null if setting not found', async () => {
      const cacheKey = 'settings:key:non.existent';

      settingsCacheService.get.mockResolvedValue(null);
      settingsRepository.findByKey.mockResolvedValue(null);

      const result = await settingsService.getSettingByKey('non.existent');

      expect(result).toBeNull();
    });
  });

  describe('updateSetting', () => {
    it('should update setting and invalidate cache', async () => {
      const mockSetting = { id: 1, key: 'company.name', value: 'New Name', type: 'string' };

      settingsRepository.findByKey.mockResolvedValue({ id: 1, key: 'company.name', value: 'Old Name' });
      settingsValidationService.validateSetting.mockResolvedValue(true);
      settingsRepository.update.mockResolvedValue(mockSetting);
      settingsHistoryRepository.create.mockResolvedValue({ id: 1 });
      settingsCacheService.invalidateCache.mockResolvedValue(true);

      const result = await settingsService.updateSetting('company.name', 'New Name', 1, 'Test reason');

      expect(result).toEqual(mockSetting);
      expect(settingsRepository.update).toHaveBeenCalled();
      expect(settingsCacheService.invalidateCache).toHaveBeenCalled();
    });

    it('should throw error if setting not found', async () => {
      settingsRepository.findByKey.mockResolvedValue(null);

      await expect(
        settingsService.updateSetting('non.existent', 'value', 1)
      ).rejects.toThrow('Setting with key "non.existent" not found');
    });
  });

  describe('createSetting', () => {
    it('should create new setting', async () => {
      const mockSetting = { id: 1, key: 'new.setting', value: 'value', type: 'string' };
      const settingData = {
        key: 'new.setting',
        value: 'value',
        type: 'string',
        category: 'general',
      };

      settingsRepository.findByKey.mockResolvedValue(null);
      settingsValidationService.validateSetting.mockResolvedValue(true);
      settingsRepository.create.mockResolvedValue(mockSetting);
      settingsHistoryRepository.create.mockResolvedValue({ id: 1 });
      settingsCacheService.invalidateCache.mockResolvedValue(true);

      const result = await settingsService.createSetting(settingData, 1);

      expect(result).toEqual(mockSetting);
      expect(settingsRepository.create).toHaveBeenCalled();
      expect(settingsCacheService.invalidateCache).toHaveBeenCalled();
    });

    it('should throw error if setting already exists', async () => {
      settingsRepository.findByKey.mockResolvedValue({ id: 1, key: 'existing.setting' });

      await expect(
        settingsService.createSetting({ key: 'existing.setting' }, 1)
      ).rejects.toThrow('Setting with key "existing.setting" already exists');
    });
  });

  describe('deleteSetting', () => {
    it('should delete setting and invalidate cache', async () => {
      const mockSetting = { id: 1, key: 'company.name', isSystem: false };

      settingsRepository.findByKey.mockResolvedValue(mockSetting);
      settingsRepository.delete.mockResolvedValue(true);
      settingsCacheService.invalidateCache.mockResolvedValue(true);

      const result = await settingsService.deleteSetting('company.name', 1);

      expect(result).toBe(true);
      expect(settingsRepository.delete).toHaveBeenCalled();
      expect(settingsCacheService.invalidateCache).toHaveBeenCalled();
    });

    it('should throw error if setting not found', async () => {
      settingsRepository.findByKey.mockResolvedValue(null);

      await expect(
        settingsService.deleteSetting('non.existent', 1)
      ).rejects.toThrow('Setting with key "non.existent" not found');
    });
  });

  describe('batchUpdateSettings', () => {
    it('should update multiple settings', async () => {
      const updates = [
        { key: 'company.name', value: 'New Name' },
        { key: 'currency.code', value: 'USD' },
      ];

      const mockResults = [
        { id: 1, key: 'company.name', value: 'New Name' },
        { id: 2, key: 'currency.code', value: 'USD' },
      ];

      settingsRepository.findByKey
        .mockResolvedValueOnce({ id: 1, key: 'company.name' })
        .mockResolvedValueOnce({ id: 2, key: 'currency.code' });
      settingsValidationService.validateSetting.mockResolvedValue(true);
      settingsRepository.update
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1]);
      settingsHistoryRepository.create.mockResolvedValue({ id: 1 });
      settingsCacheService.invalidateCache.mockResolvedValue(true);

      const result = await settingsService.batchUpdateSettings(updates, 1, 'Batch update');

      expect(result).toHaveLength(2);
      expect(settingsCacheService.invalidateCache).toHaveBeenCalled();
    });
  });
});
