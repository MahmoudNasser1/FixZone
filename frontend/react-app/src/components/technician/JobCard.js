import React from 'react';
import {
  Smartphone,
  Laptop,
  Tablet,
  Watch,
  Clock,
  Calendar,
  User,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

/**
 * 🛠️ Job Card Component for Technicians
 * 
 * بطاقة عرض المهمة للفني، تحتوي على:
 * - نوع الجهاز والأيقونة
 * - وصف المشكلة
 * - اسم العميل
 * - الحالة والأولوية
 * - الوقت المتبقي/المنقضي
 */

export default function JobCard({ job, onClick }) {
  const getDeviceIcon = (type) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('iphone') || lowerType.includes('phone')) return Smartphone;
    if (lowerType.includes('mac') || lowerType.includes('laptop')) return Laptop;
    if (lowerType.includes('ipad') || lowerType.includes('tablet')) return Tablet;
    if (lowerType.includes('watch')) return Watch;
    return Smartphone;
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'medium': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const Icon = getDeviceIcon(job.deviceType);

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
    >
      {/* Status Stripe */}
      <div className={`absolute top-0 right-0 w-1 h-full ${job.status === 'completed' ? 'bg-green-500' :
        job.status === 'in_progress' ? 'bg-blue-500' :
          'bg-yellow-500'
        }`} />

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
            <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{job.deviceType}</h3>
            <p className="text-xs text-muted-foreground">#{job.id}</p>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getPriorityColor(job.priority)}`}>
          {job.priority === 'high' ? 'عاجل' : job.priority === 'medium' ? 'متوسط' : 'عادي'}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {job.issueDescription}
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>{job.customerName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(job.createdAt).toLocaleDateString('ar-EG')}</span>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(job.status)}`}>
          {job.status === 'in_progress' && <Clock className="w-3.5 h-3.5 animate-pulse" />}
          <span>
            {job.status === 'completed' ? 'مكتمل' :
              job.status === 'in_progress' ? 'قيد العمل' : 'معلق'}
          </span>
        </div>
      </div>
    </div>
  );
}
