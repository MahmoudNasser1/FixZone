import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Clock } from 'lucide-react';
import { 
  startTimeTracking, 
  stopTimeTracking, 
  getActiveTracking 
} from '../../services/timeTrackingService';
import { useNotifications } from '../notifications/NotificationSystem';

/**
 * Stopwatch Component
 * مكون تتبع الوقت للفنيين
 * 
 * المميزات:
 * - بدء/إيقاف تتبع الوقت
 * - عرض الوقت بشكل واضح
 * - حفظ تلقائي
 * - ربط بإصلاح محدد
 */
const Stopwatch = ({ repairId = null, taskId = null, onTimeUpdate = null }) => {
  const notifications = useNotifications();
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0); // بالثواني
  const [trackingId, setTrackingId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const intervalRef = useRef(null);

  // جلب التتبع النشط عند التحميل فقط (مرة واحدة)
  useEffect(() => {
    loadActiveTracking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // فقط عند التحميل الأول

  // تحديث الوقت كل ثانية (بدون استدعاء onTimeUpdate كل ثانية)
  useEffect(() => {
    if (isRunning && startTime) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setTime(elapsed);
        // لا نستدعي onTimeUpdate كل ثانية لتجنب refresh الصفحة
        // سيتم استدعاؤه فقط عند إيقاف التتبع
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, startTime]);

  const loadActiveTracking = async () => {
    try {
      const response = await getActiveTracking();
      if (response.success && response.data.tracking) {
        const tracking = response.data.tracking;
        
        // التحقق من أن التتبع مرتبط بنفس الإصلاح/المهمة
        if ((repairId && tracking.repairId === repairId) || 
            (taskId && tracking.taskId === taskId) ||
            (!repairId && !taskId)) {
          setTrackingId(tracking.id);
          setIsRunning(tracking.status === 'running');
          
          if (tracking.status === 'running' && tracking.startTime) {
            const start = new Date(tracking.startTime);
            setStartTime(start.getTime());
            const elapsed = Math.floor((Date.now() - start.getTime()) / 1000);
            setTime(elapsed);
          } else {
            setTime(tracking.duration || 0);
          }
        }
      }
    } catch (error) {
      console.error('Error loading active tracking:', error);
    }
  };

  const handleStart = async () => {
    try {
      const response = await startTimeTracking(repairId, taskId);
      if (response.success) {
        setTrackingId(response.data.trackingId);
        setIsRunning(true);
        setStartTime(Date.now());
        setTime(0);
        notifications.success('تم بدء تتبع الوقت', { message: 'جاري تتبع الوقت الآن' });
      }
    } catch (error) {
      console.error('Error starting time tracking:', error);
      notifications.error('خطأ', { message: error.message || 'فشل بدء تتبع الوقت' });
    }
  };

  const handleStop = async () => {
    if (!trackingId) return;

    try {
      const response = await stopTimeTracking(trackingId);
      if (response.success) {
        setIsRunning(false);
        const duration = response.data.tracking.duration || time;
        setTime(duration);
        setTrackingId(null);
        setStartTime(null);
        notifications.success('تم إيقاف تتبع الوقت', { 
          message: `الوقت المستغرق: ${formatTime(duration)}` 
        });
        
        if (onTimeUpdate) {
          onTimeUpdate(duration);
        }
      }
    } catch (error) {
      console.error('Error stopping time tracking:', error);
      notifications.error('خطأ', { message: error.message || 'فشل إيقاف تتبع الوقت' });
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="stopwatch-container bg-card rounded-lg shadow-md p-6 border-2 border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className={`w-6 h-6 ${isRunning ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
          <h3 className="text-lg font-semibold text-foreground">
            تتبع الوقت
          </h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isRunning 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
            : 'bg-muted text-muted-foreground'
        }`}>
          {isRunning ? 'يعمل' : 'متوقف'}
        </div>
      </div>

      {/* عرض الوقت */}
      <div className="text-center mb-6">
        <div className={`text-5xl font-bold font-mono ${
          isRunning ? 'text-green-600 dark:text-green-400' : 'text-foreground'
        }`}>
          {formatTime(time)}
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          {isRunning ? 'جاري التتبع...' : 'متوقف'}
        </div>
      </div>

      {/* الأزرار */}
      <div className="flex gap-3 justify-center">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-medium shadow-sm"
          >
            <Play className="w-5 h-5" />
            <span>بدء</span>
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors font-medium shadow-sm"
          >
            <Square className="w-5 h-5" />
            <span>إيقاف</span>
          </button>
        )}
      </div>

      {/* معلومات إضافية */}
      {repairId && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          مرتبط بالإصلاح #{repairId}
        </div>
      )}
      {taskId && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          مرتبط بالمهمة #{taskId}
        </div>
      )}
    </div>
  );
};

export default Stopwatch;

