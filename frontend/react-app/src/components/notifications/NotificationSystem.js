import React, { useState, useEffect, createContext, useContext, useRef, useCallback, useMemo, memo } from 'react';
import { 
  CheckCircle, AlertCircle, Info, X, Bell, 
  AlertTriangle, Clock
} from 'lucide-react';
import SimpleButton from '../ui/SimpleButton';

// Context للإشعارات
const NotificationContext = createContext();

// Hook لاستخدام الإشعارات
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// مكون الإشعار الواحد
const NotificationItem = memo(({ notification, onRemove, onAction }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const timersRef = useRef([]);

  // استخدام useCallback لـ handleRemove لتجنب stale closures
  const handleRemove = useCallback(() => {
    setIsRemoving(true);
    const removeTimer = setTimeout(() => {
      try {
        onRemove(notification.id);
      } catch (err) {
        console.error('Error removing notification:', err);
      }
    }, 300);
    timersRef.current.push(removeTimer);
  }, [notification.id, onRemove]);

  // تنظيف جميع timers عند unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    // Animation in
    const animationTimer = setTimeout(() => setIsVisible(true), 100);
    timersRef.current.push(animationTimer);
    
    // Auto remove for non-persistent notifications
    if (!notification.persistent && notification.duration !== 0) {
      const autoRemoveTimer = setTimeout(() => {
        handleRemove();
      }, notification.duration || 5000);
      timersRef.current.push(autoRemoveTimer);
      
      return () => {
        clearTimeout(animationTimer);
        clearTimeout(autoRemoveTimer);
      };
    }
    
    return () => {
      clearTimeout(animationTimer);
    };
  }, [notification.persistent, notification.duration, handleRemove]);

  // استخدام useMemo للـ icon لتجنب إعادة الحساب
  const Icon = useMemo(() => {
    switch (notification.type) {
      case 'success': return CheckCircle;
      case 'error': return AlertCircle;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
      case 'loading': return Clock;
      default: return Bell;
    }
  }, [notification.type]);

  // استخدام useMemo للـ color classes
  const colorClasses = useMemo(() => {
    const baseColors = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      loading: 'bg-gray-50 border-gray-200 text-gray-800',
      default: 'bg-white border-gray-200 text-gray-800'
    };

    let colorClass = baseColors[notification.type] || baseColors.default;
    
    // Add priority-based styling
    if (notification.priority === 'urgent') {
      colorClass += ' ring-2 ring-red-500 ring-opacity-50 animate-pulse';
    } else if (notification.priority === 'high') {
      colorClass += ' ring-2 ring-orange-500 ring-opacity-30';
    }
    
    return colorClass;
  }, [notification.type, notification.priority]);

  // استخدام useMemo للـ icon color classes
  const iconColorClasses = useMemo(() => {
    switch (notification.type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      case 'loading': return 'text-gray-600 animate-spin';
      default: return 'text-gray-600';
    }
  }, [notification.type]);

  // تحديد role و aria-live بناءً على نوع الإشعار
  const ariaRole = notification.type === 'error' || notification.priority === 'urgent' ? 'alert' : 'status';
  const ariaLive = notification.type === 'error' || notification.priority === 'urgent' ? 'assertive' : 'polite';

  return (
    <div 
      role={ariaRole}
      aria-live={ariaLive}
      aria-atomic="true"
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
        ${isRemoving ? 'translate-x-full opacity-0 scale-95' : ''}
        max-w-sm w-full shadow-lg rounded-lg pointer-events-auto border
        ${colorClasses}
        focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500
      `}
      onKeyDown={(e) => {
        // Keyboard navigation - Escape key to close
        if (e.key === 'Escape') {
          handleRemove();
        }
      }}
      tabIndex={0}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Icon className={`w-5 h-5 ${iconColorClasses}`} aria-hidden="true" />
          </div>
          
          <div className="flex-1 min-w-0">
            {notification.title && (
              <p className="text-sm font-medium" id={`notification-title-${notification.id}`}>
                {notification.title}
              </p>
            )}
            
            {notification.message && (
              <p 
                className={`text-sm ${notification.title ? 'mt-1' : ''}`}
                id={`notification-message-${notification.id}`}
                aria-labelledby={notification.title ? `notification-title-${notification.id}` : undefined}
              >
                {notification.message}
              </p>
            )}
            
            {notification.actions && notification.actions.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {notification.actions.map((action, index) => (
                  <SimpleButton
                    key={index}
                    size="sm"
                    variant={action.variant || 'outline'}
                    onClick={() => {
                      try {
                        if (action.onClick) action.onClick();
                        if (onAction) onAction(notification.id, action);
                        if (action.autoClose !== false) handleRemove();
                      } catch (err) {
                        console.error('Error handling notification action:', err);
                      }
                    }}
                  >
                    {action.label}
                  </SimpleButton>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0 flex">
            <button
              type="button"
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded transition ease-in-out duration-150 p-1"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              aria-label="إغلاق الإشعار"
              title="إغلاق (Esc)"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Progress bar for timed notifications */}
      {!notification.persistent && notification.duration && notification.showProgress && (
        <div className="h-1 bg-gray-200 rounded-b-lg overflow-hidden" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
          <div 
            className="h-full bg-current opacity-50 transition-all ease-linear"
            style={{
              animation: `shrink ${notification.duration}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
});

NotificationItem.displayName = 'NotificationItem';

// مكون حاوي الإشعارات
const NotificationContainer = memo(({ notifications, onRemove, onAction, position = 'top-left' }) => {
  const positionClasses = useMemo(() => {
    switch (position) {
      case 'top-right':
        return 'top-0 right-0 items-end';
      case 'top-left':
        return 'top-0 left-0 items-start';
      case 'bottom-right':
        return 'bottom-0 right-0 items-end';
      case 'bottom-left':
        return 'bottom-0 left-0 items-start';
      case 'top-center':
        return 'top-0 left-1/2 transform -translate-x-1/2 items-center';
      case 'bottom-center':
        return 'bottom-0 left-1/2 transform -translate-x-1/2 items-center';
      default:
        return 'top-0 right-0 items-end';
    }
  }, [position]);

  if (notifications.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      
      <div 
        className={`
          fixed z-50 flex flex-col gap-4 pointer-events-none p-6
          ${positionClasses}
        `}
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
        role="region"
        aria-label="الإشعارات"
        aria-live="polite"
      >
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={onRemove}
            onAction={onAction}
          />
        ))}
      </div>
    </>
  );
});

NotificationContainer.displayName = 'NotificationContainer';

// مكون مزود الإشعارات
export const NotificationProvider = ({ children, maxNotifications = 5, position = 'top-right' }) => {
  const [notifications, setNotifications] = useState([]);
  const lastByKeyRef = useRef({}); // dedupe/throttle tracker
  const cleanupIntervalRef = useRef(null);

  // Cleanup old dedupe keys periodically to prevent memory leaks
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const maxAge = 5 * 60 * 1000; // 5 minutes
      
      Object.keys(lastByKeyRef.current).forEach(key => {
        if (now - lastByKeyRef.current[key].ts > maxAge) {
          delete lastByKeyRef.current[key];
        }
      });
    }, 60000); // Run cleanup every minute

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, []);

  const addNotification = useCallback((notification) => {
    try {
      const now = Date.now();
      const id = now + Math.random();
      const {
        dedupeKey,
        dedupeWindowMs = 1500,
        priority = 'normal', // 'low', 'normal', 'high', 'urgent'
        ...rest
      } = notification || {};

      // Build with defaults
      const newNotification = {
        id,
        type: 'info',
        duration: 5000,
        persistent: false,
        showProgress: false,
        read: false,
        priority: priority,
        createdAt: now,
        ...rest
      };

      // Dedupe/throttle by key if provided
      if (dedupeKey) {
        const last = lastByKeyRef.current[dedupeKey];
        if (last && now - last.ts < dedupeWindowMs) {
          // Optionally update existing latest notification with same key
          setNotifications(prev => prev.map(n => 
            n.id === last.id ? { ...n, createdAt: now } : n
          ));
          return last.id;
        }
        lastByKeyRef.current[dedupeKey] = { id, ts: now };
      }

      setNotifications(prev => {
        const updated = [newNotification, ...prev];
        // Sort by priority: urgent > high > normal > low
        const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
        updated.sort((a, b) => {
          const priorityDiff = (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
          if (priorityDiff !== 0) return priorityDiff;
          // If same priority, sort by creation time (newest first)
          return b.createdAt - a.createdAt;
        });
        // Keep only max notifications
        return updated.slice(0, maxNotifications);
      });

      return id;
    } catch (err) {
      console.error('Error adding notification:', err);
      // Return a fallback ID even if there's an error
      return Date.now() + Math.random();
    }
  }, [maxNotifications]);

  const removeNotification = useCallback((id) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      // Clean up dedupe key if this notification had one
      Object.keys(lastByKeyRef.current).forEach(key => {
        if (lastByKeyRef.current[key].id === id) {
          delete lastByKeyRef.current[key];
        }
      });
    } catch (err) {
      console.error('Error removing notification:', err);
    }
  }, []);

  const clearAllNotifications = useCallback(() => {
    try {
      setNotifications([]);
      lastByKeyRef.current = {};
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  }, []);

  const updateNotification = useCallback((id, updates) => {
    try {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, ...updates } : n)
      );
    } catch (err) {
      console.error('Error updating notification:', err);
    }
  }, []);

  // Helper functions for common notification types
  const success = useCallback((message, options = {}) => {
    try {
      return addNotification({
        type: 'success',
        message,
        priority: options.priority || 'normal',
        ...options
      });
    } catch (err) {
      console.error('Error showing success notification:', err);
      return null;
    }
  }, [addNotification]);

  const error = useCallback((message, options = {}) => {
    try {
      return addNotification({
        type: 'error',
        message,
        persistent: true, // Errors should be persistent by default
        priority: options.priority || 'high', // Errors are high priority by default
        ...options
      });
    } catch (err) {
      console.error('Error showing error notification:', err);
      return null;
    }
  }, [addNotification]);

  const warning = useCallback((message, options = {}) => {
    try {
      return addNotification({
        type: 'warning',
        message,
        priority: options.priority || 'normal',
        ...options
      });
    } catch (err) {
      console.error('Error showing warning notification:', err);
      return null;
    }
  }, [addNotification]);

  const info = useCallback((message, options = {}) => {
    try {
      return addNotification({
        type: 'info',
        message,
        priority: options.priority || 'normal',
        ...options
      });
    } catch (err) {
      console.error('Error showing info notification:', err);
      return null;
    }
  }, [addNotification]);

  const loading = useCallback((message, options = {}) => {
    try {
      return addNotification({
        type: 'loading',
        message,
        persistent: true,
        ...options
      });
    } catch (err) {
      console.error('Error showing loading notification:', err);
      return null;
    }
  }, [addNotification]);

  // Promise helper: manage loading/success/error lifecycle
  const withNotification = useCallback(async (asyncFn, {
    loadingMessage = 'جارٍ المعالجة...'
    , successMessage = 'تمت العملية بنجاح'
    , errorMessage = 'حدث خطأ غير متوقع'
    , dedupeKey
    , loadingOptions = {}
    , successOptions = {}
    , errorOptions = {}
  } = {}) => {
    let loadingId = null;
    try {
      loadingId = addNotification({
        type: 'loading',
        message: loadingMessage,
        persistent: true,
        dedupeKey,
        ...loadingOptions
      });
      
      const result = await asyncFn();
      
      if (loadingId) {
        updateNotification(loadingId, {
          type: 'success',
          message: successMessage,
          persistent: false,
          duration: successOptions.duration ?? 3000,
          ...successOptions
        });
      }
      
      return result;
    } catch (err) {
      if (loadingId) {
        try {
          updateNotification(loadingId, {
            type: 'error',
            message: (err && err.message) ? `${errorMessage}: ${err.message}` : errorMessage,
            persistent: true,
            ...errorOptions
          });
        } catch (updateErr) {
          console.error('Error updating notification:', updateErr);
        }
      }
      throw err;
    }
  }, [addNotification, updateNotification]);

  const handleAction = useCallback((notificationId, action) => {
    try {
      // يمكن إضافة منطق إضافي هنا
      console.log('Notification action:', { notificationId, action });
      if (action && typeof action.onClick === 'function') {
        action.onClick();
      }
    } catch (err) {
      console.error('Error handling notification action:', err);
    }
  }, []);

  // استخدام useMemo للـ contextValue لتجنب re-renders غير ضرورية
  const contextValue = useMemo(() => ({
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    updateNotification,
    success,
    error,
    warning,
    info,
    loading,
    withNotification
  }), [
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    updateNotification,
    success,
    error,
    warning,
    info,
    loading,
    withNotification
  ]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
        onAction={handleAction}
        position={position}
      />
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
