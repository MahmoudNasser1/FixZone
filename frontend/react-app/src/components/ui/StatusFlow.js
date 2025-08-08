import React from 'react';
import { 
  Clock, Play, AlertTriangle, CheckCircle, XCircle,
  ArrowRight, Circle 
} from 'lucide-react';
import SimpleBadge from './SimpleBadge';

const StatusFlow = ({ currentStatus, compact = false }) => {
  const statusFlow = [
    {
      key: 'pending',
      text: 'في الانتظار',
      description: 'تم استلام الطلب',
      icon: Clock,
      color: 'yellow'
    },
    {
      key: 'in-progress',
      text: 'قيد الإصلاح',
      description: 'جاري العمل على الجهاز',
      icon: Play,
      color: 'blue'
    },
    {
      key: 'completed',
      text: 'مكتمل',
      description: 'تم إنجاز الإصلاح',
      icon: CheckCircle,
      color: 'green'
    }
  ];

  const getStatusIndex = (status) => {
    const index = statusFlow.findIndex(s => s.key === status);
    return index !== -1 ? index : 0;
  };

  const currentIndex = getStatusIndex(currentStatus);
  
  // التعامل مع الحالات الخاصة
  const isOnHold = currentStatus === 'on-hold';
  const isCancelled = currentStatus === 'cancelled';

  if (compact) {
    return (
      <div className="flex items-center space-x-2 space-x-reverse">
        {statusFlow.map((status, index) => {
          const StatusIcon = status.icon;
          const isActive = index <= currentIndex && !isOnHold && !isCancelled;
          const isCurrent = index === currentIndex && !isOnHold && !isCancelled;
          
          return (
            <React.Fragment key={status.key}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                isActive 
                  ? `bg-${status.color}-500 border-${status.color}-500 text-white` 
                  : 'bg-gray-100 border-gray-300 text-gray-400'
              } ${isCurrent ? 'ring-2 ring-offset-2 ring-' + status.color + '-500' : ''}`}>
                <StatusIcon className="w-4 h-4" />
              </div>
              {index < statusFlow.length - 1 && (
                <ArrowRight className={`w-4 h-4 ${
                  index < currentIndex && !isOnHold && !isCancelled 
                    ? 'text-gray-400' 
                    : 'text-gray-300'
                }`} />
              )}
            </React.Fragment>
          );
        })}
        
        {/* عرض الحالات الخاصة */}
        {isOnHold && (
          <div className="flex items-center space-x-2 space-x-reverse mr-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 border-2 border-orange-500 text-white">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-orange-600">معلق</span>
          </div>
        )}
        
        {isCancelled && (
          <div className="flex items-center space-x-2 space-x-reverse mr-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 border-2 border-red-500 text-white">
              <XCircle className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-red-600">ملغي</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">مراحل الإصلاح</h3>
      
      {/* الحالات الخاصة */}
      {isOnHold && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-orange-600 ml-2" />
            <div>
              <h4 className="font-medium text-orange-900">الطلب معلق مؤقتاً</h4>
              <p className="text-sm text-orange-700">تم إيقاف العمل على هذا الطلب مؤقتاً</p>
            </div>
          </div>
        </div>
      )}
      
      {isCancelled && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-600 ml-2" />
            <div>
              <h4 className="font-medium text-red-900">تم إلغاء الطلب</h4>
              <p className="text-sm text-red-700">تم إلغاء طلب الإصلاح</p>
            </div>
          </div>
        </div>
      )}

      {/* مخطط انسيابي للحالات العادية */}
      <div className="space-y-6">
        {statusFlow.map((status, index) => {
          const StatusIcon = status.icon;
          const isCompleted = index < currentIndex && !isOnHold && !isCancelled;
          const isCurrent = index === currentIndex && !isOnHold && !isCancelled;
          const isPending = index > currentIndex || isOnHold || isCancelled;
          
          return (
            <div key={status.key} className="flex items-start space-x-4 space-x-reverse">
              {/* أيقونة الحالة */}
              <div className="flex-shrink-0">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                  isCompleted 
                    ? `bg-${status.color}-500 border-${status.color}-500 text-white` 
                    : isCurrent 
                    ? `bg-${status.color}-100 border-${status.color}-500 text-${status.color}-600 ring-2 ring-offset-2 ring-${status.color}-500` 
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}>
                  <StatusIcon className="w-5 h-5" />
                </div>
              </div>
              
              {/* محتوى الحالة */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium ${
                    isCompleted || isCurrent 
                      ? 'text-gray-900' 
                      : 'text-gray-500'
                  }`}>
                    {status.text}
                  </h4>
                  
                  {isCompleted && (
                    <SimpleBadge className="bg-green-100 text-green-800" size="sm">
                      مكتمل
                    </SimpleBadge>
                  )}
                  
                  {isCurrent && (
                    <SimpleBadge className={`bg-${status.color}-100 text-${status.color}-800`} size="sm">
                      الحالة الحالية
                    </SimpleBadge>
                  )}
                  
                  {isPending && (
                    <SimpleBadge className="bg-gray-100 text-gray-600" size="sm">
                      في الانتظار
                    </SimpleBadge>
                  )}
                </div>
                
                <p className={`text-sm mt-1 ${
                  isCompleted || isCurrent 
                    ? 'text-gray-600' 
                    : 'text-gray-400'
                }`}>
                  {status.description}
                </p>
              </div>
              
              {/* خط الربط */}
              {index < statusFlow.length - 1 && (
                <div className="absolute right-5 mt-10 w-0.5 h-6 bg-gray-300"></div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* معلومات إضافية */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-gray-900">
              {statusFlow.filter((_, i) => i <= currentIndex && !isOnHold && !isCancelled).length}
            </div>
            <div className="text-gray-600">مراحل مكتملة</div>
          </div>
          
          <div className="text-center">
            <div className="font-medium text-gray-900">
              {statusFlow.length - statusFlow.filter((_, i) => i <= currentIndex && !isOnHold && !isCancelled).length}
            </div>
            <div className="text-gray-600">مراحل متبقية</div>
          </div>
          
          <div className="text-center">
            <div className="font-medium text-gray-900">
              {Math.round((statusFlow.filter((_, i) => i <= currentIndex && !isOnHold && !isCancelled).length / statusFlow.length) * 100)}%
            </div>
            <div className="text-gray-600">نسبة الإنجاز</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusFlow;
