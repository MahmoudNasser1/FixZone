// frontend/react-app/src/hooks/useSettingsBackup.js
import { useState, useCallback } from 'react';
import api from '../services/api';
import { useNotifications } from '../components/notifications/NotificationSystem';

/**
 * Custom hook for managing settings backups
 */
export const useSettingsBackup = () => {
  const notifications = useNotifications();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load all backups
   */
  const loadBackups = useCallback(async (pagination = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.listBackups(pagination);
      
      if (response.success) {
        setBackups(response.data || []);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to load backups');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load backups';
      setError(errorMessage);
      notifications.error('خطأ', { message: errorMessage });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [notifications]);

  /**
   * Create backup
   */
  const createBackup = useCallback(async (name, description = null) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.createBackup(name, description);
      
      if (response.success) {
        notifications.success('نجح', { message: 'تم إنشاء النسخة الاحتياطية بنجاح' });
        // Reload backups
        await loadBackups();
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create backup');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to create backup';
      setError(errorMessage);
      notifications.error('خطأ', { message: errorMessage });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [notifications, loadBackups]);

  /**
   * Restore backup
   */
  const restoreBackup = useCallback(async (id, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.restoreBackup(id, options);
      
      if (response.success) {
        notifications.success('نجح', { 
          message: `تم استعادة النسخة الاحتياطية بنجاح (${response.data.restored} إعدادات)`
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to restore backup');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to restore backup';
      setError(errorMessage);
      notifications.error('خطأ', { message: errorMessage });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [notifications]);

  /**
   * Delete backup
   */
  const deleteBackup = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.deleteBackup(id);
      
      if (response.success) {
        notifications.success('نجح', { message: 'تم حذف النسخة الاحتياطية بنجاح' });
        // Reload backups
        await loadBackups();
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete backup');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to delete backup';
      setError(errorMessage);
      notifications.error('خطأ', { message: errorMessage });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [notifications, loadBackups]);

  /**
   * Get backup details
   */
  const getBackup = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getBackup(id);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get backup');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to get backup';
      setError(errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    backups,
    loading,
    error,
    loadBackups,
    createBackup,
    restoreBackup,
    deleteBackup,
    getBackup
  };
};

