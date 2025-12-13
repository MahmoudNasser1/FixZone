import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * 🔔 Hook for Technician Notifications
 * 
 * إدارة الإشعارات للفني:
 * - جلب الإشعارات من API
 * - تحديث تلقائي
 * - تمييز كمقروء
 */

export default function useTechnicianNotifications(options = {}) {
  const { autoRefresh = true, refreshInterval = 60000 } = options; // Refresh every minute

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.getNotifications({
        limit: 20,
        channel: 'technician' // Only technician notifications
      });

      if (response.success) {
        const notifs = response.data?.notifications || response.data || [];
        setNotifications(notifs);
        
        // Calculate unread count
        const unread = notifs.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      } else {
        throw new Error(response.error || 'فشل جلب الإشعارات');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
      
      // Fallback to mock data if API fails
      setNotifications([
        {
          id: 1,
          title: 'مهمة جديدة',
          message: 'تم تعيين مهمة إصلاح جديدة لك',
          type: 'job_assigned',
          isRead: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          title: 'تحديث حالة',
          message: 'تم تحديث حالة المهمة #1024',
          type: 'status_update',
          isRead: true,
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ]);
      setUnreadCount(1);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await api.markNotificationAsRead(notificationId);
      if (response.success) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await api.markAllNotificationsAsRead();
      if (response.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchNotifications, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchNotifications]);

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-EG');
  };

  // Get notification icon type
  const getNotificationType = (type) => {
    switch (type) {
      case 'job_assigned':
      case 'new_job':
        return { icon: 'job', color: 'bg-blue-100 text-blue-600' };
      case 'status_update':
        return { icon: 'status', color: 'bg-emerald-100 text-emerald-600' };
      case 'urgent':
      case 'alert':
        return { icon: 'alert', color: 'bg-red-100 text-red-600' };
      case 'reminder':
        return { icon: 'reminder', color: 'bg-amber-100 text-amber-600' };
      default:
        return { icon: 'default', color: 'bg-slate-100 text-slate-600' };
    }
  };

  return {
    notifications: notifications.map(n => ({
      ...n,
      timeAgo: formatTimeAgo(n.createdAt),
      typeConfig: getNotificationType(n.type)
    })),
    unreadCount,
    loading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead
  };
}
