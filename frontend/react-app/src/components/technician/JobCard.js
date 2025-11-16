import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SimpleCard, SimpleCardContent } from '../ui/SimpleCard';
import SimpleButton from '../ui/SimpleButton';
import JobStatusBadge from './JobStatusBadge';
import { 
  Calendar, 
  Clock, 
  User, 
  Smartphone,
  Laptop,
  Monitor,
  Tablet,
  Printer,
  Package,
  ArrowRight
} from 'lucide-react';

/**
 * JobCard Component
 * بطاقة لعرض معلومات الجهاز بشكل مختصر
 */

// Device type icons
const deviceIcons = {
  LAPTOP: Laptop,
  DESKTOP: Monitor,
  TABLET: Tablet,
  SMARTPHONE: Smartphone,
  PRINTER: Printer,
  OTHER: Package
};

export default function JobCard({ job, className = '' }) {
  const navigate = useNavigate();

  if (!job) return null;

  const DeviceIcon = deviceIcons[job.deviceType] || deviceIcons.OTHER;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
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
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);
      
      if (days > 0) return `منذ ${days} يوم`;
      if (hours > 0) return `منذ ${hours} ساعة`;
      return 'منذ قليل';
    } catch (error) {
      return '';
    }
  };

  const handleOpenJob = () => {
    navigate(`/tech/jobs/${job.id}`);
  };

  return (
    <SimpleCard 
      className={`hover:shadow-md transition-all duration-200 cursor-pointer ${className}`}
      onClick={handleOpenJob}
    >
      <SimpleCardContent className="p-4">
        {/* Header: Device Icon + Request Number + Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
              <DeviceIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">طلب #{job.requestNumber || job.id}</p>
              <p className="text-sm text-gray-500">
                {job.deviceBrand || 'غير محدد'} {job.deviceModel || ''}
              </p>
            </div>
          </div>
          <JobStatusBadge status={job.status} />
        </div>

        {/* Customer Info */}
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span>{job.customerName || 'عميل غير معروف'}</span>
        </div>

        {/* Date Info */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>استلام: {formatDate(job.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{formatRelativeTime(job.createdAt)}</span>
          </div>
        </div>

        {/* Problem Description (if available) */}
        {job.reportedProblem && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-600 line-clamp-2">
              {job.reportedProblem}
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <SimpleButton 
            variant="outline" 
            size="sm" 
            className="w-full justify-center"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenJob();
            }}
          >
            فتح التفاصيل
            <ArrowRight className="w-4 h-4 mr-2" />
          </SimpleButton>
        </div>
      </SimpleCardContent>
    </SimpleCard>
  );
}


