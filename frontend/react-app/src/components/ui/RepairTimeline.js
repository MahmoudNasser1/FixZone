import React from 'react';
import { 
  Clock, CheckCircle, Play, Pause, XCircle, 
  AlertTriangle, Calendar, User, ShoppingCart, Package
} from 'lucide-react';
import SimpleBadge from './SimpleBadge';

const RepairTimeline = ({ repair, compact = false }) => {
  const getStatusInfo = (status) => {
    const statusMap = {
      pending: {
        icon: Clock,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'في الانتظار',
        description: 'تم استلام الطلب وفي انتظار المراجعة'
      },
      'in-progress': {
        icon: Play,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'قيد التنفيذ',
        description: 'جاري العمل على إصلاح الجهاز'
      },
      'waiting-parts': {
        icon: ShoppingCart,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'بانتظار قطع غيار',
        description: 'في انتظار وصول قطع الغيار'
      },
      'ready-for-pickup': {
        icon: Package,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        text: 'جاهز للاستلام',
        description: 'انتهى الإصلاح والجهاز جاهز للاستلام'
      },
      'on-hold': {
        icon: Pause,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'معلق',
        description: 'تم إيقاف العمل مؤقتاً'
      },
      completed: {
        icon: CheckCircle,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        text: 'مكتمل',
        description: 'تم إنجاز الإصلاح بنجاح'
      },
      cancelled: {
        icon: XCircle,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        text: 'ملغي',
        description: 'تم إلغاء طلب الإصلاح'
      }
    };
    
    return statusMap[status] || statusMap.pending;
  };

  const getPriorityInfo = (priority) => {
    const priorityMap = {
      low: {
        color: 'bg-muted text-muted-foreground',
        text: 'منخفضة',
        icon: Clock
      },
      medium: {
        color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
        text: 'متوسطة',
        icon: AlertTriangle
      },
      high: {
        color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
        text: 'عالية',
        icon: AlertTriangle
      }
    };
    
    return priorityMap[priority] || priorityMap.medium;
  };

  const calculateProgress = (status) => {
    const progressMap = {
      pending: 20,
      'in-progress': 50,
      'waiting-parts': 40,
      'ready-for-pickup': 90,
      'on-hold': 30,
      completed: 100,
      cancelled: 0
    };
    
    return progressMap[status] || 20;
  };

  const estimateTimeRemaining = (status, createdAt) => {
    if (status === 'completed' || status === 'cancelled' || status === 'ready-for-pickup') return null;
    
    const created = new Date(createdAt);
    const now = new Date();
    const daysPassed = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    
    // تقدير بسيط بناءً على نوع الحالة
    const estimatedTotalDays = {
      pending: 1,
      'in-progress': 3,
      'waiting-parts': 5,
      'on-hold': 5
    };
    
    const totalDays = estimatedTotalDays[status] || 3;
    const remainingDays = Math.max(0, totalDays - daysPassed);
    
    return remainingDays;
  };

  const statusInfo = getStatusInfo(repair.status);
  const priorityInfo = getPriorityInfo(repair.priority);
  const progress = calculateProgress(repair.status);
  const timeRemaining = estimateTimeRemaining(repair.status, repair.createdAt);
  const StatusIcon = statusInfo.icon;
  const PriorityIcon = priorityInfo.icon;

  if (compact) {
    return (
      <div className="flex items-center space-x-3 space-x-reverse">
        {/* Status Icon */}
        <div className={`w-8 h-8 rounded-full ${statusInfo.bgColor} flex items-center justify-center`}>
          <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
        </div>
        
        {/* Progress Bar */}
        <div className="flex-1 max-w-20">
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                repair.status === 'completed' ? 'bg-green-500 dark:bg-green-400' :
                repair.status === 'cancelled' ? 'bg-red-500 dark:bg-red-400' :
                repair.status === 'ready-for-pickup' ? 'bg-green-500 dark:bg-green-400' :
                repair.status === 'waiting-parts' ? 'bg-orange-500 dark:bg-orange-400' :
                repair.status === 'in-progress' ? 'bg-blue-500 dark:bg-blue-400' : 'bg-yellow-500 dark:bg-yellow-400'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        {/* Priority Badge */}
        <SimpleBadge className={`${priorityInfo.color} text-xs`} size="sm">
          {priorityInfo.text}
        </SimpleBadge>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full ${statusInfo.bgColor} flex items-center justify-center ml-3`}>
            <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{statusInfo.text}</h3>
            <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <SimpleBadge className={priorityInfo.color} size="sm">
            <PriorityIcon className="w-3 h-3 ml-1" />
            {priorityInfo.text}
          </SimpleBadge>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>التقدم</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              repair.status === 'completed' ? 'bg-green-500 dark:bg-green-400' :
              repair.status === 'cancelled' ? 'bg-red-500 dark:bg-red-400' :
              repair.status === 'ready-for-pickup' ? 'bg-green-500 dark:bg-green-400' :
              repair.status === 'waiting-parts' ? 'bg-orange-500 dark:bg-orange-400' :
              repair.status === 'in-progress' ? 'bg-blue-500 dark:bg-blue-400' : 'bg-yellow-500 dark:bg-yellow-400'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Time Information */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center text-muted-foreground">
          <Calendar className="w-4 h-4 ml-2" />
          <div>
            <div className="font-medium">تاريخ الإنشاء</div>
            <div>{new Date(repair.createdAt).toLocaleDateString('en-GB')}</div>
          </div>
        </div>
        
        {timeRemaining !== null && (
          <div className="flex items-center text-muted-foreground">
            <Clock className="w-4 h-4 ml-2" />
            <div>
              <div className="font-medium">الوقت المتبقي</div>
              <div>
                {timeRemaining === 0 ? 'اليوم' : 
                 timeRemaining === 1 ? 'غداً' : 
                 `${timeRemaining} أيام`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Info */}
      {repair.customerName && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="w-4 h-4 ml-2" />
            <span className="font-medium">العميل:</span>
            <span className="mr-2">{repair.customerName}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairTimeline;
