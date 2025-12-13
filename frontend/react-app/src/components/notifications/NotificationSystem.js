import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { 
  CheckCircle, AlertCircle, Info, X, Bell, 
  AlertTriangle, Clock, Zap, Settings
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
const NotificationItem = ({ notification, onRemove, onAction }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Animation in
    setTimeout(() => setIsVisible(true), 100);
    
    // Auto remove for non-persistent notifications
    if (!notification.persistent && notification.duration !== 0) {
      const timer = setTimeout(() => {
        handleRemove();
      }, notification.duration || 5000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return CheckCircle;
      case 'error': return AlertCircle;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
      case 'loading': return Clock;
      default: return Bell;
    }
  };

  const getColorClasses = () => {
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
  };

  const getIconColorClasses = () => {
    switch (notification.type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      case 'loading': return 'text-gray-600 animate-spin';
      default: return 'text-gray-600';
    }
  };

  const Icon = getIcon();

  return (
    <div 
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isRemoving ? 'translate-x-full opacity-0' : ''}
        max-w-sm w-full shadow-lg rounded-lg pointer-events-auto border
        ${getColorClasses()}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={`w-5 h-5 ${getIconColorClasses()}`} />
          </div>
          
          <div className="mr-3 flex-1">
            {notification.title && (
              <p className="text-sm font-medium">
                {notification.title}
              </p>
            )}
            
            {notification.message && (
              <p className={`text-sm ${notification.title ? 'mt-1' : ''}`}>
                {notification.message}
              </p>
            )}
            
            {notification.actions && notification.actions.length > 0 && (
              <div className="mt-3 flex space-x-2 space-x-reverse">
                {notification.actions.map((action, index) => (
                  <SimpleButton
                    key={index}
                    size="sm"
                    variant={action.variant || 'outline'}
                    onClick={() => {
                      if (action.onClick) action.onClick();
                      if (onAction) onAction(notification.id, action);
                      if (action.autoClose !== false) handleRemove();
                    }}
                  >
                    {action.label}
                  </SimpleButton>
                ))}
              </div>
            )}
          </div>
          
          {!notification.persistent && (
            <div className="mr-4 flex-shrink-0 flex">
              <button
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition ease-in-out duration-150"
                onClick={handleRemove}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Progress bar for timed notifications */}
      {!notification.persistent && notification.duration && notification.showProgress && (
        <div className="h-1 bg-gray-200 rounded-b-lg overflow-hidden">
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
};

// مكون حاوي الإشعارات
const NotificationContainer = ({ notifications, onRemove, onAction, position = 'top-left' }) => {
  const getPositionClasses = () => {
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
  };

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
          fixed z-50 flex flex-col space-y-4 pointer-events-none p-6
          ${getPositionClasses()}
        `}
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
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
};

// مكون مزود الإشعارات
export const NotificationProvider = ({ children, maxNotifications = 5, position = 'top-right' }) => {
  const [notifications, setNotifications] = useState([]);
  const lastByKeyRef = useRef({}); // dedupe/throttle tracker

  const addNotification = (notification) => {
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
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const updateNotification = (id, updates) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, ...updates } : n)
    );
  };

  // Helper functions for common notification types
  const success = (message, options = {}) => {
    return addNotification({
      type: 'success',
      message,
      priority: options.priority || 'normal',
      ...options
    });
  };

  const error = (message, options = {}) => {
    return addNotification({
      type: 'error',
      message,
      persistent: true, // Errors should be persistent by default
      priority: options.priority || 'high', // Errors are high priority by default
      ...options
    });
  };

  const warning = (message, options = {}) => {
    return addNotification({
      type: 'warning',
      message,
      priority: options.priority || 'normal',
      ...options
    });
  };

  const info = (message, options = {}) => {
    return addNotification({
      type: 'info',
      message,
      priority: options.priority || 'normal',
      ...options
    });
  };

  const loading = (message, options = {}) => {
    return addNotification({
      type: 'loading',
      message,
      persistent: true,
      ...options
    });
  };

  // Promise helper: manage loading/success/error lifecycle
  const withNotification = async (asyncFn, {
    loadingMessage = 'جارٍ المعالجة...'
    , successMessage = 'تمت العملية بنجاح'
    , errorMessage = 'حدث خطأ غير متوقع'
    , dedupeKey
    , loadingOptions = {}
    , successOptions = {}
    , errorOptions = {}
  } = {}) => {
    const loadingId = addNotification({
      type: 'loading',
      message: loadingMessage,
      persistent: true,
      dedupeKey,
      ...loadingOptions
    });
    try {
      const result = await asyncFn();
      updateNotification(loadingId, {
        type: 'success',
        message: successMessage,
        persistent: false,
        duration: successOptions.duration ?? 3000,
        ...successOptions
      });
      return result;
    } catch (err) {
      updateNotification(loadingId, {
        type: 'error',
        message: (err && err.message) ? `${errorMessage}: ${err.message}` : errorMessage,
        persistent: true,
        ...errorOptions
      });
      throw err;
    }
  };

  const handleAction = (notificationId, action) => {
    // يمكن إضافة منطق إضافي هنا
    console.log('Notification action:', { notificationId, action });
  };

  const contextValue = {
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
  };

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
