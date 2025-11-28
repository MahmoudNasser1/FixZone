// frontend/react-app/src/hooks/useSettingsImportExport.js
import { useState, useCallback } from 'react';
import api from '../services/api';
import { useNotifications } from '../components/notifications/NotificationSystem';

/**
 * Custom hook for managing settings import/export
 */
export const useSettingsImportExport = () => {
  const notifications = useNotifications();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Export settings
   */
  const exportSettings = useCallback(async (format = 'json', filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.exportSettings(format, filters);
      
      // Create download link
      const blob = new Blob([response], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `settings_export_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      notifications.success('نجح', { message: 'تم تصدير الإعدادات بنجاح' });
      return true;
    } catch (err) {
      const errorMessage = err.message || 'Failed to export settings';
      setError(errorMessage);
      notifications.error('خطأ', { message: errorMessage });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [notifications]);

  /**
   * Get export template
   */
  const getTemplate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getExportTemplate();
      
      // Create download link
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'settings_template.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      notifications.success('نجح', { message: 'تم تحميل القالب بنجاح' });
      return true;
    } catch (err) {
      const errorMessage = err.message || 'Failed to get template';
      setError(errorMessage);
      notifications.error('خطأ', { message: errorMessage });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [notifications]);

  /**
   * Import settings
   */
  const importSettings = useCallback(async (file, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.importSettings(file, options);
      
      if (response.success) {
        notifications.success('نجح', { 
          message: `تم استيراد ${response.data.imported} إعداد بنجاح`
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to import settings');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to import settings';
      setError(errorMessage);
      notifications.error('خطأ', { message: errorMessage });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [notifications]);

  /**
   * Validate import file
   */
  const validateFile = useCallback(async (file) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.validateImportFile(file);
      
      if (response.success) {
        if (response.data.valid) {
          notifications.success('نجح', { message: 'الملف صالح للاستيراد' });
        } else {
          notifications.warning('تحذير', { 
            message: `الملف يحتوي على أخطاء: ${response.data.errors || 'غير معروف'}`
          });
        }
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to validate file');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to validate file';
      setError(errorMessage);
      notifications.error('خطأ', { message: errorMessage });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [notifications]);

  return {
    loading,
    error,
    exportSettings,
    getTemplate,
    importSettings,
    validateFile
  };
};

