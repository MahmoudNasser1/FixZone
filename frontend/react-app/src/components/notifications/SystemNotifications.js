import { useEffect, useRef } from 'react';
import { useNotifications } from './NotificationSystem';

// مكون لإدارة الإشعارات التلقائية للنظام
const SystemNotifications = () => {
  const notifications = useNotifications();
  const hasShownWelcome = useRef(false);

  useEffect(() => {
    // إشعار ترحيب عند تحميل النظام (مرة واحدة فقط)
    if (!hasShownWelcome.current) {
      setTimeout(() => {
        notifications.info('مرحباً بك في نظام Fix Zone ERP', {
          title: 'أهلاً وسهلاً',
          duration: 4000,
          showProgress: true
        });
        hasShownWelcome.current = true;
      }, 2000);
    }
    
    return () => {
      // لا حاجة لتنظيف أي مؤقتات
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // هذا المكون لا يعرض أي شيء، فقط يدير الإشعارات
  return null;
};

export default SystemNotifications;
