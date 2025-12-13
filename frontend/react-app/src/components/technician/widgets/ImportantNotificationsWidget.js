import React from 'react';
import { Bell, AlertCircle, Info, CheckCircle, X, ChevronRight } from 'lucide-react';

/**
 * Important Notifications Widget
 * يعرض الإشعارات المهمة للفني
 */
export default function ImportantNotificationsWidget({ notifications = [], loading = false, onViewAll, onMarkAsRead }) {
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
        <div className="h-4 bg-muted rounded w-40 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'urgent':
      case 'error':
        return AlertCircle;
      case 'success':
        return CheckCircle;
      case 'info':
      default:
        return Info;
    }
  };

  const getNotificationColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'urgent':
      case 'error':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'success':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'info':
      default:
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
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
    } catch (e) {
      return '';
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">الإشعارات المهمة</h3>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              عرض الكل
            </button>
          )}
        </div>
        <div className="text-center py-8">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">لا توجد إشعارات جديدة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">الإشعارات المهمة</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            عرض الكل
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="space-y-3 flex-1 overflow-y-auto">
        {notifications.slice(0, 5).map((notification) => {
          const Icon = getNotificationIcon(notification.type);
          const isUnread = !notification.isRead;

          return (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border transition-colors ${
                isUnread
                  ? getNotificationColor(notification.type)
                  : 'bg-muted/30 border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  isUnread
                    ? getNotificationColor(notification.type)
                    : 'bg-muted'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    isUnread
                      ? notification.type === 'urgent' || notification.type === 'error'
                        ? 'text-red-600'
                        : notification.type === 'success'
                        ? 'text-green-600'
                        : 'text-blue-600'
                      : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={`font-medium line-clamp-1 ${
                      isUnread ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {notification.title || 'إشعار'}
                    </h4>
                    {isUnread && onMarkAsRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(notification.id);
                        }}
                        className="p-1 hover:bg-background/50 rounded transition-colors"
                        title="تمييز كمقروء"
                      >
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  {notification.message && (
                    <p className={`text-sm line-clamp-2 mb-2 ${
                      isUnread ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {notification.message}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatTime(notification.createdAt)}
                    </span>
                    {isUnread && (
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


