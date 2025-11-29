// frontend/react-app/src/hooks/useSettings.js
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useNotifications } from '../components/notifications/NotificationSystem';

/**
 * Custom hook for managing settings
 */
export const useSettings = () => {
  const notifications = useNotifications();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  /**
   * Load all settings
   */
  const loadSettings = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getSettings(filters);
      
      if (response.success) {
        // Convert array to object with key as property
        const settingsObj = {};
        if (Array.isArray(response.data)) {
          response.data.forEach(setting => {
            settingsObj[setting.key] = setting;
          });
        }
        setSettings(settingsObj);
        return settingsObj;
      } else {
        throw new Error(response.message || 'Failed to load settings');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load settings';
      // Don't show error for 401 (unauthorized) - user is not logged in yet
      const isUnauthorized = errorMessage.includes('401') || errorMessage.includes('authorization denied') || errorMessage.includes('No token');
      
      if (!isUnauthorized) {
        setError(errorMessage);
        notifications.error('خطأ', { message: errorMessage });
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [notifications]);

  /**
   * Load settings by category
   */
  const loadSettingsByCategory = useCallback(async (category) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getSettingsByCategory(category);
      
      if (response.success) {
        const settingsObj = {};
        if (Array.isArray(response.data)) {
          response.data.forEach(setting => {
            settingsObj[setting.key] = setting;
          });
        }
        // Replace settings for this category only, keep others
        setSettings(prev => {
          // Remove old settings from this category
          const filtered = Object.fromEntries(
            Object.entries(prev).filter(([_, setting]) => setting.category !== category)
          );
          // Add new settings
          return { ...filtered, ...settingsObj };
        });
        return settingsObj;
      } else {
        throw new Error(response.message || 'Failed to load settings');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load settings';
      // Don't show error for 401 (unauthorized) - user is not logged in yet
      const isUnauthorized = errorMessage.includes('401') || errorMessage.includes('authorization denied') || errorMessage.includes('No token');
      
      if (!isUnauthorized) {
        setError(errorMessage);
        notifications.error('خطأ', { message: errorMessage });
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [notifications]);

  /**
   * Get setting by key
   */
  const getSetting = useCallback(async (key) => {
    try {
      setError(null);
      const response = await api.getSetting(key);
      
      if (response.success) {
        setSettings(prev => ({ ...prev, [key]: response.data }));
        return response.data;
      } else {
        throw new Error(response.message || 'Setting not found');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to get setting';
      setError(errorMessage);
      notifications.error('خطأ', { message: errorMessage });
      throw err;
    }
  }, [notifications]);

  /**
   * Update setting
   */
  const updateSetting = useCallback(async (key, value, reason = null) => {
    try {
      setError(null);
      const response = await api.updateSetting(key, { value, reason });
      
      if (response.success) {
        setSettings(prev => ({ ...prev, [key]: response.data }));
        notifications.success('نجح', { message: 'تم تحديث الإعداد بنجاح' });
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update setting');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to update setting';
      setError(errorMessage);
      notifications.error('خطأ', { message: errorMessage });
      throw err;
    }
  }, [notifications]);

  /**
   * Batch update settings
   */
  const batchUpdate = useCallback(async (updates, reason = null) => {
    try {
      setLoading(true);
      setError(null);
      const settingsArray = Object.entries(updates).map(([key, value]) => ({ key, value }));
      const response = await api.batchUpdateSettings(settingsArray, reason);
      
      if (response.success) {
        // Update local state
        const updatedSettings = { ...settings };
        response.data.forEach(({ key, setting }) => {
          if (setting) {
            updatedSettings[key] = setting;
          }
        });
        setSettings(updatedSettings);
        notifications.success('نجح', { message: 'تم تحديث الإعدادات بنجاح' });
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to batch update settings');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to batch update settings';
      setError(errorMessage);
      notifications.error('خطأ', { message: errorMessage });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [settings, notifications]);

  /**
   * Search settings
   */
  const searchSettings = useCallback(async (query, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.searchSettings(query, filters);
      
      if (response.success) {
        const settingsObj = {};
        if (Array.isArray(response.data)) {
          response.data.forEach(setting => {
            settingsObj[setting.key] = setting;
          });
        }
        return settingsObj;
      } else {
        throw new Error(response.message || 'Search failed');
      }
    } catch (err) {
      const errorMessage = err.message || 'Search failed';
      setError(errorMessage);
      notifications.error('خطأ', { message: errorMessage });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [notifications]);

  /**
   * Get setting value by key (from local state)
   */
  const getSettingValue = useCallback((key, defaultValue = null) => {
    return settings[key]?.value ?? defaultValue;
  }, [settings]);

  /**
   * Check if setting exists
   */
  const hasSetting = useCallback((key) => {
    return key in settings;
  }, [settings]);

  return {
    settings,
    loading,
    error,
    categories,
    loadSettings,
    loadSettingsByCategory,
    getSetting,
    updateSetting,
    batchUpdate,
    searchSettings,
    getSettingValue,
    hasSetting,
    setSettings
  };
};

