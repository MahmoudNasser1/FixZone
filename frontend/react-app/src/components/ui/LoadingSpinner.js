import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * LoadingSpinner - مكون لعرض مؤشر التحميل
 * 
 * @param {string} size - حجم المؤشر (sm, md, lg, xl)
 * @param {string} message - رسالة اختيارية تظهر مع المؤشر
 * @param {boolean} fullScreen - إذا كان true، يظهر في وسط الشاشة
 */
const LoadingSpinner = ({ 
  size = 'md', 
  message = 'جاري التحميل...', 
  fullScreen = false,
  color = 'blue'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    gray: 'text-gray-600',
    white: 'text-white'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 
        className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}
      />
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

/**
 * TableLoadingSkeleton - مكون لعرض skeleton للجدول أثناء التحميل
 */
export const TableLoadingSkeleton = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="animate-pulse space-y-4">
      {/* Header Skeleton */}
      <div className="flex gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1 h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
        ))}
      </div>
      
      {/* Rows Skeleton */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * CardLoadingSkeleton - مكون لعرض skeleton للكارد أثناء التحميل
 */
export const CardLoadingSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * LoadingOverlay - مكون لعرض overlay للتحميل فوق محتوى معين
 */
export const LoadingOverlay = ({ show, message = 'جاري التحميل...' }) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
      <LoadingSpinner size="lg" message={message} />
    </div>
  );
};

export default LoadingSpinner;

