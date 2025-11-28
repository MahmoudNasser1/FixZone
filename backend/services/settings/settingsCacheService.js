// backend/services/settings/settingsCacheService.js
// Simple in-memory cache (can be replaced with Redis later)
const NodeCache = require('node-cache');

class SettingsCacheService {
  constructor() {
    // Cache with 5 minute default TTL
    this.cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
  }
  
  /**
   * Get value from cache
   */
  async get(key) {
    try {
      return this.cache.get(key) || null;
    } catch (error) {
      console.error('Error getting from cache:', error);
      return null;
    }
  }
  
  /**
   * Set value in cache
   */
  async set(key, value, ttl = 300) {
    try {
      return this.cache.set(key, value, ttl);
    } catch (error) {
      console.error('Error setting cache:', error);
      return false;
    }
  }
  
  /**
   * Delete value from cache
   */
  async delete(key) {
    try {
      return this.cache.del(key);
    } catch (error) {
      console.error('Error deleting from cache:', error);
      return false;
    }
  }
  
  /**
   * Clear all cache
   */
  async clear() {
    try {
      this.cache.flushAll();
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }
  
  /**
   * Invalidate cache by pattern
   */
  async invalidateCache(pattern) {
    try {
      if (pattern) {
        const keys = this.cache.keys();
        const patternRegex = new RegExp(pattern.replace('*', '.*'));
        keys.forEach(key => {
          if (patternRegex.test(key)) {
            this.cache.del(key);
          }
        });
      } else {
        this.cache.flushAll();
      }
      return true;
    } catch (error) {
      console.error('Error invalidating cache:', error);
      return false;
    }
  }
  
  /**
   * Invalidate all cache
   */
  async invalidateAllCache() {
    return await this.clear();
  }
  
  /**
   * Warmup cache with frequently accessed settings
   */
  async warmup() {
    try {
      // This can be implemented to pre-load common settings
      // For now, it's a placeholder
      return true;
    } catch (error) {
      console.error('Error warming up cache:', error);
      return false;
    }
  }
}

module.exports = new SettingsCacheService();

