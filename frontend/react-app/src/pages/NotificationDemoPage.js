import React from 'react';
import NotificationDemo from '../components/notifications/NotificationDemo';

const NotificationDemoPage = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          تجربة نظام الإشعارات
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          اختبر جميع أنواع الإشعارات والتفاعلات المتاحة في النظام
        </p>
      </div>
      
      <NotificationDemo />
    </div>
  );
};

export default NotificationDemoPage;
