// backend/tests/settings/settingsCacheService.test.js
const settingsCacheService = require('../../services/settings/settingsCacheService');

describe('SettingsCacheService', () => {
  beforeEach(async () => {
    // Clear cache before each test
    await settingsCacheService.clear();
  });

  describe('get and set', () => {
    it('should cache and retrieve a value', async () => {
      const key = 'test:key';
      const value = { id: 1, name: 'test' };

      await settingsCacheService.set(key, value);
      const cached = await settingsCacheService.get(key);

      expect(cached).toEqual(value);
    });

    it('should return null if key does not exist', async () => {
      const cached = await settingsCacheService.get('non.existent');
      expect(cached).toBeNull();
    });

    it('should cache with custom TTL', async () => {
      const key = 'test:ttl';
      const value = 'test value';

      await settingsCacheService.set(key, value, 60);
      const cached = await settingsCacheService.get(key);

      expect(cached).toEqual(value);
    });
  });

  describe('delete', () => {
    it('should delete a cached value', async () => {
      const key = 'test:delete';
      const value = 'test value';

      await settingsCacheService.set(key, value);
      await settingsCacheService.delete(key);

      const cached = await settingsCacheService.get(key);
      expect(cached).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all cached values', async () => {
      await settingsCacheService.set('key1', 'value1');
      await settingsCacheService.set('key2', 'value2');

      await settingsCacheService.clear();

      const cached1 = await settingsCacheService.get('key1');
      const cached2 = await settingsCacheService.get('key2');

      expect(cached1).toBeNull();
      expect(cached2).toBeNull();
    });
  });

  describe('invalidateCache', () => {
    it('should invalidate cache by pattern', async () => {
      await settingsCacheService.set('settings:key1', 'value1');
      await settingsCacheService.set('settings:key2', 'value2');
      await settingsCacheService.set('other:key3', 'value3');

      await settingsCacheService.invalidateCache('settings:*');

      const cached1 = await settingsCacheService.get('settings:key1');
      const cached2 = await settingsCacheService.get('settings:key2');
      const cached3 = await settingsCacheService.get('other:key3');

      expect(cached1).toBeNull();
      expect(cached2).toBeNull();
      expect(cached3).toEqual('value3'); // Should still exist
    });

    it('should clear all cache if no pattern provided', async () => {
      await settingsCacheService.set('key1', 'value1');
      await settingsCacheService.set('key2', 'value2');

      await settingsCacheService.invalidateCache();

      const cached1 = await settingsCacheService.get('key1');
      const cached2 = await settingsCacheService.get('key2');

      expect(cached1).toBeNull();
      expect(cached2).toBeNull();
    });
  });

  describe('invalidateAllCache', () => {
    it('should clear all cache', async () => {
      await settingsCacheService.set('key1', 'value1');
      await settingsCacheService.set('key2', 'value2');

      await settingsCacheService.invalidateAllCache();

      const cached1 = await settingsCacheService.get('key1');
      const cached2 = await settingsCacheService.get('key2');

      expect(cached1).toBeNull();
      expect(cached2).toBeNull();
    });
  });
});

