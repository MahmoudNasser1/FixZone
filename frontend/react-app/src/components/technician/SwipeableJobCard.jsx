import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Smartphone,
  Laptop,
  Tablet,
  Clock,
  Calendar,
  User,
  ChevronLeft,
  Check,
  X,
  Play,
  Pause,
  MoreHorizontal
} from 'lucide-react';
import { updateTechJobStatus } from '../../services/technicianService';
import { useNotifications } from '../notifications/NotificationSystem';

/**
 * 📱 Swipeable Job Card for Mobile
 * 
 * بطاقة المهمة مع دعم:
 * - Swipe Right: قبول/بدء المهمة
 * - Swipe Left: رفض/تأجيل
 * - Long Press: قائمة خيارات
 */

export default function SwipeableJobCard({ job, onStatusChange }) {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const cardRef = useRef(null);
  
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [swiping, setSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [translateX, setTranslateX] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const minSwipeDistance = 80;

  const getDeviceIcon = (type) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('iphone') || lowerType.includes('phone')) return Smartphone;
    if (lowerType.includes('mac') || lowerType.includes('laptop')) return Laptop;
    if (lowerType.includes('ipad') || lowerType.includes('tablet')) return Tablet;
    return Smartphone;
  };

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!swiping) return;
    const currentX = e.targetTouches[0].clientX;
    setTouchEnd(currentX);
    
    const diff = currentX - touchStart;
    // Limit swipe distance
    const limitedDiff = Math.max(-120, Math.min(120, diff));
    setTranslateX(limitedDiff);
    
    if (diff > 30) {
      setSwipeDirection('right');
    } else if (diff < -30) {
      setSwipeDirection('left');
    } else {
      setSwipeDirection(null);
    }
  };

  const handleTouchEnd = async () => {
    setSwiping(false);
    
    if (!touchStart || !touchEnd) {
      setTranslateX(0);
      setSwipeDirection(null);
      return;
    }

    const distance = touchEnd - touchStart;
    const isSwipe = Math.abs(distance) > minSwipeDistance;

    if (isSwipe) {
      if (distance > 0) {
        // Swipe Right - Start/Accept
        await handleStartJob();
      } else {
        // Swipe Left - Show options
        setShowActions(true);
      }
    }

    // Reset
    setTranslateX(0);
    setSwipeDirection(null);
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleStartJob = async () => {
    if (job.status === 'in_progress') {
      navigate(`/technician/jobs/${job.id}`);
      return;
    }

    setIsUpdating(true);
    try {
      const response = await updateTechJobStatus(job.id, { status: 'in_progress' });
      if (response.success) {
        notifications.success('تم', { message: 'تم بدء العمل على المهمة' });
        if (onStatusChange) onStatusChange(job.id, 'in_progress');
      }
    } catch (error) {
      notifications.error('خطأ', { message: 'فشل تحديث الحالة' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleComplete = async () => {
    setIsUpdating(true);
    try {
      const response = await updateTechJobStatus(job.id, { status: 'completed' });
      if (response.success) {
        notifications.success('تم', { message: 'تم إتمام المهمة' });
        if (onStatusChange) onStatusChange(job.id, 'completed');
      }
    } catch (error) {
      notifications.error('خطأ', { message: 'فشل تحديث الحالة' });
    } finally {
      setIsUpdating(false);
      setShowActions(false);
    }
  };

  const DeviceIcon = getDeviceIcon(job.deviceType);

  const getStatusColor = () => {
    switch (job.status) {
      case 'completed': return 'bg-emerald-500';
      case 'in_progress': return 'bg-blue-500';
      default: return 'bg-amber-500';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl mb-3 md:hidden">
      {/* Background Actions */}
      <div className="absolute inset-0 flex">
        {/* Right Action (Swipe Right) */}
        <div className={`flex-1 flex items-center justify-start px-6 transition-colors ${
          swipeDirection === 'right' ? 'bg-emerald-500' : 'bg-emerald-400'
        }`}>
          <div className="flex items-center gap-2 text-white">
            <Play className="w-6 h-6" />
            <span className="font-bold">{job.status === 'in_progress' ? 'فتح' : 'بدء'}</span>
          </div>
        </div>
        
        {/* Left Action (Swipe Left) */}
        <div className={`flex-1 flex items-center justify-end px-6 transition-colors ${
          swipeDirection === 'left' ? 'bg-slate-600' : 'bg-slate-500'
        }`}>
          <div className="flex items-center gap-2 text-white">
            <span className="font-bold">خيارات</span>
            <MoreHorizontal className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => !swiping && navigate(`/technician/jobs/${job.id}`)}
        style={{ transform: `translateX(${translateX}px)` }}
        className={`
          relative bg-white dark:bg-slate-900 p-4 border border-slate-200/50 dark:border-slate-800
          transition-transform duration-200 ease-out cursor-pointer
          ${swiping ? '' : 'transition-all'}
          ${isUpdating ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        {/* Status Strip */}
        <div className={`absolute top-0 right-0 w-1 h-full ${getStatusColor()}`} />

        <div className="flex items-center gap-4">
          {/* Device Icon */}
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex-shrink-0">
            <DeviceIcon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-slate-900 dark:text-white truncate">
                {job.deviceType}
              </h3>
              {job.priority === 'high' && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full flex-shrink-0">
                  عاجل
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
              {job.issueDescription}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {job.customerName}
              </span>
              <span>#{job.id}</span>
            </div>
          </div>

          {/* Arrow */}
          <ChevronLeft className="w-5 h-5 text-slate-400 flex-shrink-0" />
        </div>
      </div>

      {/* Action Bottom Sheet */}
      {showActions && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowActions(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>
            <div className="p-4 space-y-2 pb-safe">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-4">
                خيارات المهمة #{job.id}
              </h3>
              
              <button
                onClick={() => {
                  setShowActions(false);
                  navigate(`/technician/jobs/${job.id}`);
                }}
                className="w-full flex items-center gap-3 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-500" />
                <span className="font-medium text-slate-900 dark:text-white">عرض التفاصيل</span>
              </button>
              
              {job.status === 'pending' && (
                <button
                  onClick={handleStartJob}
                  disabled={isUpdating}
                  className="w-full flex items-center gap-3 p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50"
                >
                  <Play className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium text-emerald-700 dark:text-emerald-300">بدء العمل</span>
                </button>
              )}
              
              {job.status === 'in_progress' && (
                <button
                  onClick={handleComplete}
                  disabled={isUpdating}
                  className="w-full flex items-center gap-3 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                >
                  <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-700 dark:text-blue-300">إتمام المهمة</span>
                </button>
              )}

              <button
                onClick={() => setShowActions(false)}
                className="w-full flex items-center justify-center gap-3 p-4 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
                <span className="font-medium">إلغاء</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


