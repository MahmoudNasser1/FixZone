import React, { useState } from 'react';
import {
  Smartphone,
  Laptop,
  Tablet,
  Watch,
  Clock,
  Calendar,
  User,
  AlertCircle,
  ChevronLeft,
  Zap,
  CheckCircle,
  Wrench
} from 'lucide-react';

/**
 * 🛠️ Job Card Component - Enhanced with Animations
 * 
 * بطاقة عرض المهمة للفني مع:
 * - Micro-interactions
 * - Hover effects
 * - Progress indicator
 * - Priority badges محسنة
 */

export default function JobCard({ job, onClick }) {
  const [isPressed, setIsPressed] = useState(false);

  const getDeviceIcon = (type) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('iphone') || lowerType.includes('phone')) return Smartphone;
    if (lowerType.includes('mac') || lowerType.includes('laptop')) return Laptop;
    if (lowerType.includes('ipad') || lowerType.includes('tablet')) return Tablet;
    if (lowerType.includes('watch')) return Watch;
    return Smartphone;
  };

  const getPriorityConfig = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return {
          label: 'عاجل',
          bgColor: 'bg-red-500',
          textColor: 'text-white',
          borderColor: 'border-red-500',
          glowColor: 'shadow-red-500/25',
          icon: Zap
        };
      case 'medium':
        return {
          label: 'متوسط',
          bgColor: 'bg-amber-500',
          textColor: 'text-white',
          borderColor: 'border-amber-500',
          glowColor: 'shadow-amber-500/25',
          icon: AlertCircle
        };
      case 'low':
        return {
          label: 'عادي',
          bgColor: 'bg-slate-500',
          textColor: 'text-white',
          borderColor: 'border-slate-500',
          glowColor: 'shadow-slate-500/25',
          icon: null
        };
      default:
        return {
          label: 'عادي',
          bgColor: 'bg-slate-400',
          textColor: 'text-white',
          borderColor: 'border-slate-400',
          glowColor: '',
          icon: null
        };
    }
  };

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return {
          label: 'مكتمل',
          color: 'text-emerald-600 dark:text-emerald-400',
          bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
          icon: CheckCircle,
          stripColor: 'bg-emerald-500'
        };
      case 'in_progress':
        return {
          label: 'قيد العمل',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          icon: Wrench,
          stripColor: 'bg-blue-500',
          animate: true
        };
      case 'pending':
        return {
          label: 'في الانتظار',
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          icon: Clock,
          stripColor: 'bg-amber-500'
        };
      default:
        return {
          label: status || 'غير محدد',
          color: 'text-slate-600 dark:text-slate-400',
          bgColor: 'bg-slate-100 dark:bg-slate-800',
          icon: AlertCircle,
          stripColor: 'bg-slate-400'
        };
    }
  };

  const DeviceIcon = getDeviceIcon(job.deviceType);
  const priorityConfig = getPriorityConfig(job.priority);
  const statusConfig = getStatusConfig(job.status);
  const StatusIcon = statusConfig.icon;
  const PriorityIcon = priorityConfig.icon;

  return (
    <div
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`
        relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 
        overflow-hidden cursor-pointer group
        transition-all duration-300 ease-out
        hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50
        hover:-translate-y-1 hover:border-teal-300 dark:hover:border-teal-700
        ${isPressed ? 'scale-[0.98] shadow-inner' : ''}
      `}
    >
      {/* Status Stripe - Animated */}
      <div className={`
        absolute top-0 right-0 w-1.5 h-full ${statusConfig.stripColor}
        transition-all duration-300 group-hover:w-2
        ${statusConfig.animate ? 'animate-pulse' : ''}
      `} />

      {/* Priority Glow Effect (for high priority) */}
      {job.priority === 'high' && (
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none" />
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {/* Device Icon with hover effect */}
            <div className={`
              p-3 rounded-xl transition-all duration-300
              bg-slate-100 dark:bg-slate-800
              group-hover:bg-teal-100 dark:group-hover:bg-teal-900/30
              group-hover:scale-110
            `}>
              <DeviceIcon className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                {job.deviceType}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-500">#{job.id}</p>
            </div>
          </div>

          {/* Priority Badge */}
          <span className={`
            flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold
            ${priorityConfig.bgColor} ${priorityConfig.textColor}
            shadow-lg ${priorityConfig.glowColor}
            transition-transform duration-300 group-hover:scale-105
          `}>
            {PriorityIcon && <PriorityIcon className="w-3.5 h-3.5" />}
            {priorityConfig.label}
          </span>
        </div>

        {/* Issue Description */}
        <div className="mb-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {job.issueDescription}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span className="max-w-[100px] truncate">{job.customerName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(job.createdAt).toLocaleDateString('ar-EG')}</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
            ${statusConfig.bgColor} ${statusConfig.color}
            transition-all duration-300
          `}>
            <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.animate ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            <span>{statusConfig.label}</span>
          </div>
        </div>

        {/* Hover Arrow Indicator */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all duration-300">
          <ChevronLeft className="w-5 h-5 text-teal-500" />
        </div>
      </div>

      {/* Bottom Progress Bar (for in_progress status) */}
      {job.status === 'in_progress' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 animate-pulse"
            style={{ width: '60%' }}
          />
        </div>
      )}
    </div>
  );
}
