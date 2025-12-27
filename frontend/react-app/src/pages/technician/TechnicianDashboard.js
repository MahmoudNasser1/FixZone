import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTechDashboard,
  getTechJobs,
  getTechJobDetails
} from '../../services/technicianService';
import { getDailyTotal, getActiveTracking } from '../../services/timeTrackingService';
import { getTasks, getTaskStats } from '../../services/taskService';
import TechnicianHeader from '../../components/technician/TechnicianHeader';
import Stopwatch from '../../components/technician/Stopwatch';
import QuickReportForm from '../../components/technician/QuickReportForm';
import TechnicianBottomNav from '../../components/technician/TechnicianBottomNav';
import QRScannerModal from '../../components/technician/QRScannerModal';
import { CardSkeleton } from '../../components/ui/Skeletons';
import PageTransition from '../../components/ui/PageTransition';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import useAuthStore from '../../stores/authStore';
import { ROLE_TECHNICIAN } from '../../constants/roles';
import {
  Wrench,
  CheckCircle,
  Clock,
  QrCode,
  Plus,
  FileText,
  Search,
  Timer,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  Smartphone,
  Laptop,
  Tablet,
  Zap,
  TrendingUp,
  Calendar,
  Play
} from 'lucide-react';

/**
 * 🛠️ Technician Dashboard Page - Redesigned
 * 
 * تصميم جديد مبسط يركز على:
 * - المهمة الحالية بشكل بارز
 * - Stopwatch متكامل
 * - إحصائيات سريعة (3 فقط)
 * - المهام القادمة
 */

export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [dailyTime, setDailyTime] = useState(null);
  const [activeRepairId, setActiveRepairId] = useState(null);
  const [activeJob, setActiveJob] = useState(null);
  const [showQuickReport, setShowQuickReport] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [taskStats, setTaskStats] = useState(null);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [pendingRepairRequests, setPendingRepairRequests] = useState([]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentElapsedTime, setCurrentElapsedTime] = useState(0);
  const loadingRef = useRef(false);

  useEffect(() => {
    const roleId = user?.roleId || user?.role;
    const isTechnician = user && roleId === ROLE_TECHNICIAN;

    if (!user || !isTechnician) {
      notifications.error('خطأ', { message: 'يجب تسجيل الدخول كفني للوصول لهذه الصفحة' });
      navigate('/login');
      return;
    }

    if (!loadingRef.current) {
      loadingRef.current = true;
      loadDashboardData().finally(() => {
        loadingRef.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadDashboardData = async (isRetry = false) => {
    try {
      setLoading(true);
      setError(null);

      const dashboardRes = await getTechDashboard();
      if (dashboardRes.success) {
        setDashboardData(dashboardRes.data);
      } else {
        throw new Error(dashboardRes.error || 'فشل تحميل بيانات Dashboard');
      }

      const jobsRes = await getTechJobs({ limit: 6, status: 'in_progress' });
      if (jobsRes.success) {
        setRecentJobs(jobsRes.data || []);
        if (jobsRes.data && jobsRes.data.length > 0) {
          setActiveRepairId(jobsRes.data[0].id);
          setActiveJob(jobsRes.data[0]);
        }
      }

      try {
        const timeRes = await getDailyTotal();
        if (timeRes.success) {
          setDailyTime(timeRes.data.total);
        }
      } catch (timeError) {
        console.error('Error loading daily time:', timeError);
      }

      try {
        const taskStatsRes = await getTaskStats();
        if (taskStatsRes.success) {
          setTaskStats(taskStatsRes.data);
        }
      } catch (taskError) {
        console.error('Error loading task stats:', taskError);
      }

      try {
        const tasksRes = await getTasks({ status: 'todo', limit: 5 });
        if (tasksRes.success) {
          setPendingTasks(tasksRes.data.tasks || []);
        }
      } catch (taskError) {
        console.error('Error loading pending tasks:', taskError);
      }

      // Load pending repair requests (waiting for technician)
      try {
        const pendingRes = await getTechJobs({ limit: 5, status: 'pending' });
        if (pendingRes.success) {
          setPendingRepairRequests(pendingRes.data || []);
        }
      } catch (pendingError) {
        console.error('Error loading pending repair requests:', pendingError);
      }

      // Check for active time tracking
      try {
        const trackingRes = await getActiveTracking();
        if (trackingRes.success && trackingRes.data?.tracking) {
          const tracking = trackingRes.data.tracking;
          if (tracking.status === 'running') {
            setIsTimerRunning(true);
            // Calculate elapsed time
            const start = new Date(tracking.startTime).getTime();
            const now = Date.now();
            const elapsed = Math.floor((now - start) / 1000);
            setCurrentElapsedTime(elapsed);

            // If we have a repairId from tracking, fetch its details and set as activeJob
            if (tracking.repairId) {
              setActiveRepairId(tracking.repairId);
              // Fetch job details for the active tracking repair
              try {
                const jobDetailsRes = await getTechJobDetails(tracking.repairId);
                if (jobDetailsRes.success && jobDetailsRes.data?.job) {
                  const job = jobDetailsRes.data.job;
                  setActiveJob({
                    id: job.id,
                    repairNumber: job.id,
                    deviceType: job.deviceType || job.brand,
                    issueDescription: job.issueDescription || job.reportedProblem,
                    customerName: job.customerName,
                    status: job.status
                  });
                }
              } catch (jobError) {
                console.error('Error fetching job details for active tracking:', jobError);
              }
            }
          }
        }
      } catch (trackingError) {
        console.error('Error checking active tracking:', trackingError);
      }

      setRetryCount(0);

      if (isRetry) {
        notifications.success('نجح', { message: 'تم تحميل البيانات بنجاح' });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      const errorMessage = error.message || 'فشل تحميل البيانات. يرجى المحاولة مرة أخرى.';
      setError(errorMessage);

      if (!isRetry) {
        notifications.error('خطأ', { message: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      loadDashboardData(true);
    } else {
      notifications.error('خطأ', { message: 'تم تجاوز عدد المحاولات المسموح. يرجى تحديث الصفحة.' });
    }
  };

  const refreshDailyTime = async () => {
    try {
      const timeRes = await getDailyTotal();
      if (timeRes.success) {
        setDailyTime(timeRes.data.total);
      }
    } catch (timeError) {
      console.error('Error refreshing daily time:', timeError);
    }
  };

  const getStatusCount = (status) => {
    if (!dashboardData?.byStatus) return 0;
    const statusItem = dashboardData.byStatus.find(item => item.status === status);
    return statusItem ? statusItem.count : 0;
  };

  const getDeviceIcon = (type) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('iphone') || lowerType.includes('phone')) return Smartphone;
    if (lowerType.includes('mac') || lowerType.includes('laptop')) return Laptop;
    if (lowerType.includes('ipad') || lowerType.includes('tablet')) return Tablet;
    return Smartphone;
  };

  const formatDailyTime = () => {
    if (!dailyTime) return '0:00';
    const hours = dailyTime.hours || 0;
    const minutes = dailyTime.minutes || 0;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatElapsedTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading State
  if (loading && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/20">
        <TechnicianHeader user={user} notificationCount={5} />
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted animate-pulse rounded-lg" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded-lg" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-muted animate-pulse rounded-2xl" />
            <div className="h-64 bg-muted animate-pulse rounded-2xl" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-muted animate-pulse rounded-xl" />
            <div className="h-24 bg-muted animate-pulse rounded-xl" />
            <div className="h-24 bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error && !loading) {
    return (
      <PageTransition className="min-h-screen bg-background pb-20 md:pb-8">
        <TechnicianHeader user={user} notificationCount={5} />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-card border border-destructive/20 rounded-2xl p-8 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                خطأ في تحميل البيانات
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  disabled={retryCount >= 3}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  إعادة المحاولة {retryCount > 0 && `(${retryCount}/3)`}
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors font-medium"
                >
                  تحديث الصفحة
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  const inProgressCount = getStatusCount('in_progress');
  const completedCount = getStatusCount('completed');
  const pendingCount = taskStats?.pending || pendingTasks.length || 0;

  return (
    <PageTransition className="min-h-screen bg-background pb-24 md:pb-8">
      <TechnicianHeader user={user} notificationCount={5} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Welcome Section - Simplified */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              أهلاً، {user?.name?.split(' ')[0]} 👋
            </h1>
          </div>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Active Work Session - Unified View */}
        {activeJob && isTimerRunning ? (
          // When actively working - show unified prominent card
          <div className="mb-8 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-[2rem] blur-md opacity-30 animate-pulse" />
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl shadow-2xl shadow-emerald-500/30">
              {/* Animated Background */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-white/5 rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
                <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
              </div>

              <div className="relative p-6 md:p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full animate-ping absolute" />
                      <div className="w-3 h-3 bg-emerald-400 rounded-full relative" />
                    </div>
                    <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-bold">
                      🔧 جلسة عمل نشطة
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/30 backdrop-blur-sm rounded-full">
                    <Timer className="w-4 h-4 text-emerald-200" />
                    <span className="text-emerald-100 text-sm">اليوم: {formatDailyTime()}</span>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center">
                  {/* Task Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                      {React.createElement(getDeviceIcon(activeJob.deviceType), {
                        className: "w-10 h-10 text-white"
                      })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-emerald-100/80 text-sm mb-1">أعمل حالياً على:</p>
                      <h2 className="text-2xl font-bold text-white mb-1 truncate">
                        {activeJob.deviceType || 'جهاز'}
                      </h2>
                      <p className="text-teal-100/70 text-sm truncate">
                        {activeJob.issueDescription || 'لا يوجد وصف'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-teal-200/70">
                          #{activeJob.repairNumber || activeJob.id}
                        </span>
                        {activeJob.customerName && (
                          <span className="text-xs text-teal-200/70">
                            • {activeJob.customerName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timer Display */}
                  <div className="flex flex-col items-center lg:items-end">
                    <p className="text-emerald-200/80 text-sm mb-2">الوقت المنقضي:</p>
                    <div className="text-5xl md:text-6xl font-mono font-bold text-white tracking-wider animate-pulse" style={{ animationDuration: '2s' }}>
                      {formatElapsedTime(currentElapsedTime)}
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-emerald-200/60 text-xs">
                      <div className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                      </div>
                      الحفظ التلقائي نشط
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-4 mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate(`/technician/jobs/${activeJob.id}`)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white text-teal-700 rounded-xl font-bold hover:bg-teal-50 transition-colors shadow-lg"
                    >
                      عرض التفاصيل
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRepair({ id: activeJob.id, repairNumber: activeJob.repairNumber });
                        setShowQuickReport(true);
                      }}
                      className="p-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-colors"
                      title="إضافة تقرير سريع"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => navigate(`/technician/jobs/${activeJob.id}#notes`)}
                      className="p-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-colors"
                      title="إضافة ملاحظة"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="hidden md:block">
                    <Stopwatch
                      repairId={activeRepairId}
                      onTimeUpdate={(time) => {
                        setCurrentElapsedTime(time);
                        refreshDailyTime();
                      }}
                      onStart={() => setIsTimerRunning(true)}
                      onStop={() => {
                        setIsTimerRunning(false);
                        setCurrentElapsedTime(0);
                      }}
                      compact={true}
                    />
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-1 bg-emerald-800/50 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400"
                  style={{
                    width: '100%',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s linear infinite'
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          // When not actively working - show separate cards
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Current Task Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-700 rounded-3xl p-6 shadow-2xl shadow-teal-500/20">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-xs font-medium">
                    المهمة الحالية
                  </span>
                  {activeJob && (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/30 backdrop-blur-sm rounded-full text-amber-100 text-xs font-medium">
                      <Clock className="w-3 h-3" />
                      في انتظار البدء
                    </span>
                  )}
                </div>

                {activeJob ? (
                  <>
                    <div className="flex items-start gap-4 mb-6">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                        {React.createElement(getDeviceIcon(activeJob.deviceType), {
                          className: "w-8 h-8 text-white"
                        })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-white mb-1 truncate">
                          {activeJob.deviceType || 'جهاز'}
                        </h2>
                        <p className="text-teal-100/80 text-sm line-clamp-2">
                          {activeJob.issueDescription || 'لا يوجد وصف'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => navigate(`/technician/jobs/${activeJob.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-teal-700 rounded-xl font-bold hover:bg-teal-50 transition-colors shadow-lg"
                      >
                        عرض التفاصيل
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRepair({ id: activeJob.id, repairNumber: activeJob.repairNumber });
                          setShowQuickReport(true);
                        }}
                        className="p-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-colors"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wrench className="w-8 h-8 text-white/80" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">لا توجد مهمة نشطة</h3>
                    <p className="text-teal-100/70 text-sm mb-4">ابدأ العمل على مهمة جديدة</p>
                    <button
                      onClick={() => navigate('/technician/jobs')}
                      className="px-6 py-2.5 bg-white text-teal-700 rounded-xl font-medium hover:bg-teal-50 transition-colors"
                    >
                      عرض المهام
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Stopwatch Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200/50 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">تتبع الوقت</h3>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Timer className="w-4 h-4" />
                  <span>اليوم: {formatDailyTime()}</span>
                </div>
              </div>
              <Stopwatch
                repairId={activeRepairId}
                onTimeUpdate={(time) => {
                  setCurrentElapsedTime(time);
                  refreshDailyTime();
                }}
                onStart={() => setIsTimerRunning(true)}
                onStop={() => {
                  setIsTimerRunning(false);
                  setCurrentElapsedTime(0);
                }}
              />
            </div>
          </div>
        )}

        {/* Quick Stats - 3 Cards Only */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-2xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                <Wrench className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{inProgressCount}</p>
                <p className="text-xs text-muted-foreground font-medium">قيد العمل</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl">
                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{completedCount}</p>
                <p className="text-xs text-muted-foreground font-medium">مكتملة اليوم</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-xl">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-xs text-muted-foreground font-medium">معلقة</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Repair Requests - Prominent Section */}
        {pendingRepairRequests.length > 0 && (
          <div className="mb-8 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-[2rem] blur-sm opacity-20 animate-pulse" />
            <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-white dark:from-amber-950/50 dark:via-orange-950/30 dark:to-slate-900 rounded-3xl p-6 shadow-xl border-2 border-amber-200/50 dark:border-amber-800/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/30">
                      <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-bounce">
                      {pendingRepairRequests.length}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">طلبات جديدة في الانتظار</h3>
                    <p className="text-xs text-amber-600 dark:text-amber-400">بحاجة لاهتمامك الآن</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/technician/jobs?status=pending')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/25 text-sm"
                >
                  عرض الكل
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {pendingRepairRequests.slice(0, 3).map((request, index) => {
                  const DeviceIcon = getDeviceIcon(request.deviceType);
                  return (
                    <div
                      key={request.id}
                      onClick={() => navigate(`/technician/jobs/${request.id}`)}
                      className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all cursor-pointer group border border-amber-100 dark:border-amber-800/30 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md"
                    >
                      <div className="relative">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl group-hover:bg-amber-200 dark:group-hover:bg-amber-800/40 transition-colors">
                          <DeviceIcon className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                        </div>
                        {index === 0 && (
                          <span className="absolute -top-1 -left-1 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">
                            جديد
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-bold text-slate-900 dark:text-white truncate">
                            {request.deviceType}
                          </h4>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            #{request.repairNumber || request.id}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                          {request.issueDescription || 'لا يوجد وصف'}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {request.createdAt ? new Date(request.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) : 'غير محدد'}
                          </span>
                          {request.customerName && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              • {request.customerName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {request.priority === 'high' && (
                          <span className="px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-xs font-bold flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            عاجل
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/technician/jobs/${request.id}`);
                          }}
                          className="p-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl hover:from-teal-600 hover:to-emerald-700 transition-all shadow-md opacity-0 group-hover:opacity-100"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {pendingRepairRequests.length > 3 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => navigate('/technician/jobs?status=pending')}
                    className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                  >
                    +{pendingRepairRequests.length - 3} طلبات أخرى في الانتظار
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-foreground mb-4">إجراءات سريعة</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setShowQRScanner(true)}
              className="group flex flex-col items-center gap-2 p-4 bg-card rounded-2xl border border-border hover:border-violet-500/50 hover:shadow-lg transition-all"
            >
              <div className="p-3 bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-xl group-hover:scale-110 transition-transform">
                <QrCode className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">مسح QR</span>
            </button>

            <button
              onClick={() => navigate('/technician/jobs')}
              className="group flex flex-col items-center gap-2 p-4 bg-card rounded-2xl border border-border hover:border-teal-500/50 hover:shadow-lg transition-all"
            >
              <div className="p-3 bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-xl group-hover:scale-110 transition-transform">
                <Wrench className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">المهام</span>
            </button>

            <button
              onClick={() => navigate('/technician/time-reports')}
              className="group flex flex-col items-center gap-2 p-4 bg-card rounded-2xl border border-border hover:border-blue-500/50 hover:shadow-lg transition-all"
            >
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">التقارير</span>
            </button>

            <button
              onClick={() => navigate('/technician/jobs')}
              className="group flex flex-col items-center gap-2 p-4 bg-card rounded-2xl border border-border hover:border-slate-500/50 hover:shadow-lg transition-all"
            >
              <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl group-hover:scale-110 transition-transform">
                <Search className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">بحث</span>
            </button>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200/50 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">المهام القادمة</h3>
            <button
              onClick={() => navigate('/technician/jobs')}
              className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors flex items-center gap-1"
            >
              عرض الكل
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {recentJobs.length === 0 && pendingTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-1">لا توجد مهام معلقة</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm">أحسنت! أنت على اطلاع بكل شيء</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.slice(0, 3).map((job) => {
                const DeviceIcon = getDeviceIcon(job.deviceType);
                return (
                  <div
                    key={job.id}
                    onClick={() => navigate(`/technician/jobs/${job.id}`)}
                    className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                  >
                    <div className="p-2.5 bg-white dark:bg-slate-700 rounded-xl shadow-sm">
                      <DeviceIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-900 dark:text-white truncate">
                        {job.deviceType}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {job.issueDescription}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${job.priority === 'high'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                        {job.priority === 'high' ? 'عاجل' : 'عادي'}
                      </span>
                      <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Report Modal */}
        {showQuickReport && selectedRepair && (
          <QuickReportForm
            repairId={selectedRepair.id}
            repairNumber={selectedRepair.repairNumber}
            onClose={() => {
              setShowQuickReport(false);
              setSelectedRepair(null);
            }}
            onSuccess={() => {
              setShowQuickReport(false);
              setSelectedRepair(null);
              loadDashboardData();
            }}
          />
        )}

        {/* QR Scanner Modal */}
        <QRScannerModal
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          onScan={(result) => {
            setShowQRScanner(false);
            if (result.type === 'repair') {
              navigate(`/technician/jobs/${result.id}`);
            }
          }}
        />
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <TechnicianBottomNav />
    </PageTransition>
  );
}

// Add missing import for Briefcase
const Briefcase = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
