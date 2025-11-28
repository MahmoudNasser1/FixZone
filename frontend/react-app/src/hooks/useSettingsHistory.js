// frontend/react-app/src/hooks/useSettingsHistory.js
import { useState, useCallback } from 'react';
import api from '../services/api';
import { useNotifications } from '../components/notifications/NotificationSystem';

/**
 * Custom hook for managing settings history
 */
export const useSettingsHistory = (key) => {
  const notifications = useNotifications();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load history for a setting
   */
  const loadHistory = useCallback(async (settingKey = key, pagination = {}) => {
    if (!settingKey) {
      setError('Setting key is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.getSettingHistory(settingKey, pagination);
      
      if (response.success) {
        setHistory(response.data || []);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to load history');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load history';
      setError(errorMessage);
      notifications.error('خطأ', { message: errorMessage });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [key, notifications]);

  /**
   * Rollback to a previous version
   */
  const rollback = useCallback(async (settingKey = key, historyId) => {
    if (!settingKey || !historyId) {
      setError('Setting key and history ID are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.rollbackSetting(settingKey, historyId);
      
      if (response.success) {
        notifications.success('نجح', { message: 'تم التراجع عن التغيير بنجاح' });
        // Reload history after rollback
        await loadHistory(settingKey);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to rollback');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to rollback';
      setError(errorMessage);
      notifications.error('خطأ', { message: errorMessage });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [key, notifications, loadHistory]);

  return {
    history,
    loading,
    error,
    loadHistory,
    rollback
  };
};

