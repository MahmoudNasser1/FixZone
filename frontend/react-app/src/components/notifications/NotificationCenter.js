import React, { useState, useEffect } from 'react';
import { Bell, X, Trash2, Settings } from 'lucide-react';
import { useNotifications } from './NotificationSystem';
import SimpleButton from '../ui/SimpleButton';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, removeNotification, clearAllNotifications, updateNotification } = useNotifications();

  const unreadCount = notifications.filter(n => !n.read).length;

  // عند فتح المركز، علّم كل الإشعارات كمقروءة
  useEffect(() => {
    if (isOpen) {
      notifications.forEach(n => {
        if (!n.read) updateNotification(n.id, { read: true });
      });
    }
  }, [isOpen, notifications, updateNotification]);

  return (
    <div className="relative">
      <SimpleButton
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </SimpleButton>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">الإشعارات</h3>
              <div className="flex items-center space-x-2 space-x-reverse">
                <SimpleButton variant="ghost" size="sm" onClick={clearAllNotifications}>
                  <Trash2 className="w-4 h-4" />
                </SimpleButton>
                <SimpleButton variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </SimpleButton>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                لا توجد إشعارات
              </div>
            ) : (
              notifications.map(notification => (
                <div key={notification.id} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-gray-600">{notification.message}</p>
                    </div>
                    <SimpleButton
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNotification(notification.id)}
                    >
                      <X className="w-3 h-3" />
                    </SimpleButton>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
