import React from 'react';
import SimpleBadge from '../ui/SimpleBadge';
import { 
  Clock, 
  Search, 
  Wrench, 
  Package, 
  User, 
  CheckCircle, 
  CheckCircle2, 
  XCircle,
  AlertCircle 
} from 'lucide-react';

/**
 * JobStatusBadge Component
 * Badge لعرض حالة الجهاز مع الأيقونة المناسبة
 */

// Status mapping مع الألوان والأيقونات
const statusMap = {
  'PENDING': { 
    label: 'قيد الانتظار', 
    variant: 'warning', 
    icon: Clock,
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200'
  },
  'UNDER_DIAGNOSIS': { 
    label: 'جاري الفحص', 
    variant: 'info', 
    icon: Search,
    color: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  'UNDER_REPAIR': { 
    label: 'قيد الإصلاح', 
    variant: 'default', 
    icon: Wrench,
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  'WAITING_PARTS': { 
    label: 'بانتظار قطع غيار', 
    variant: 'warning', 
    icon: Package,
    color: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  'WAITING_CUSTOMER': { 
    label: 'بانتظار العميل', 
    variant: 'secondary', 
    icon: User,
    color: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  'READY': { 
    label: 'جاهز للتسليم', 
    variant: 'success', 
    icon: CheckCircle,
    color: 'bg-green-50 text-green-700 border-green-200'
  },
  'COMPLETED': { 
    label: 'مكتمل', 
    variant: 'success', 
    icon: CheckCircle2,
    color: 'bg-green-50 text-green-700 border-green-200'
  },
  'CANCELLED': { 
    label: 'ملغي', 
    variant: 'destructive', 
    icon: XCircle,
    color: 'bg-red-50 text-red-700 border-red-200'
  },
  // Legacy statuses (fallback)
  'pending': { 
    label: 'قيد الانتظار', 
    variant: 'warning', 
    icon: Clock,
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200'
  },
  'in_progress': { 
    label: 'قيد التنفيذ', 
    variant: 'info', 
    icon: Wrench,
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  'completed': { 
    label: 'مكتمل', 
    variant: 'success', 
    icon: CheckCircle2,
    color: 'bg-green-50 text-green-700 border-green-200'
  },
  'cancelled': { 
    label: 'ملغي', 
    variant: 'destructive', 
    icon: XCircle,
    color: 'bg-red-50 text-red-700 border-red-200'
  }
};

export default function JobStatusBadge({ status, showIcon = true, className = '' }) {
  // Default status info if not found
  const statusInfo = statusMap[status] || { 
    label: status || 'غير محدد', 
    variant: 'default', 
    icon: AlertCircle,
    color: 'bg-gray-50 text-gray-700 border-gray-200'
  };
  
  const Icon = statusInfo.icon;

  return (
    <SimpleBadge 
      variant={statusInfo.variant} 
      className={`inline-flex items-center gap-1.5 ${className}`}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      <span>{statusInfo.label}</span>
    </SimpleBadge>
  );
}

// Export status map for use in other components
export { statusMap };


