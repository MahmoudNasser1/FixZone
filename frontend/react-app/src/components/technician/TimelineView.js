import React from 'react';
import { 
  Clock, 
  User, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  MessageCircle,
  Activity
} from 'lucide-react';

/**
 * TimelineView Component
 * عرض Timeline للأحداث والتحديثات على الجهاز
 */

// Timeline item type icons
const timelineIcons = {
  status_change: Activity,
  note: MessageCircle,
  NOTE: MessageCircle,
  media: FileText,
  default: AlertCircle
};

export default function TimelineView({ timeline = [], className = '' }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>لا توجد أحداث في Timeline</p>
      </div>
    );
  }

  // Format date
  const formatDateTime = (dateString) => {
    if (!dateString) return 'غير محدد';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ar-EG', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (days > 0) return `منذ ${days} يوم`;
      if (hours > 0) return `منذ ${hours} ساعة`;
      if (minutes > 0) return `منذ ${minutes} دقيقة`;
      return 'الآن';
    } catch (error) {
      return '';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {timeline.map((item, index) => {
        const IconComponent = timelineIcons[item.type] || timelineIcons.default;
        const isLast = index === timeline.length - 1;

        return (
          <div key={item.id || index} className="relative">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute right-[19px] top-10 bottom-0 w-0.5 bg-gray-200" 
                   style={{ transform: 'translateY(-24px)' }}
              />
            )}

            {/* Timeline item */}
            <div className="flex gap-4">
              {/* Icon circle */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <IconComponent className="w-5 h-5 text-indigo-600" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-700">
                        {item.author || 'النظام'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeTime(item.createdAt)}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="text-gray-900 mb-2">
                    {item.content || 'لا توجد تفاصيل'}
                  </div>

                  {/* Timestamp */}
                  <div className="text-xs text-gray-400">
                    {formatDateTime(item.createdAt)}
                  </div>

                  {/* Type badge */}
                  {item.type && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        {item.type === 'status_change' && 'تغيير حالة'}
                        {item.type === 'NOTE' && 'ملاحظة'}
                        {item.type === 'note' && 'ملاحظة'}
                        {item.type === 'media' && 'ملف مرفق'}
                        {!['status_change', 'NOTE', 'note', 'media'].includes(item.type) && item.type}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


