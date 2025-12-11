import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTechDashboard,
  getTechJobs
} from '../../services/technicianService';
import { getDailyTotal } from '../../services/timeTrackingService';
import TechnicianHeader from '../../components/technician/TechnicianHeader';
import TechnicianStatsCard from '../../components/technician/TechnicianStatsCard';
import QuickActionCard from '../../components/customer/QuickActionCard';
import Stopwatch from '../../components/technician/Stopwatch';
import NotesList from '../../components/technician/NotesList';
import QuickReportForm from '../../components/technician/QuickReportForm';
import TechnicianBottomNav from '../../components/technician/TechnicianBottomNav';
import { CardSkeleton } from '../../components/ui/Skeletons';
import { CardLoadingSkeleton } from '../../components/ui/LoadingSpinner';
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
  RefreshCw
} from 'lucide-react';

/**
 * 🛠️ Technician Dashboard Page
 * 
 * المميزات:
 * - Header مع Status Toggle
 * - Stats Cards محسنة
 * - Quick Actions
 * - Active Jobs List
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
  const [showQuickReport, setShowQuickReport] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
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
      
      // جلب بيانات Dashboard
      const dashboardRes = await getTechDashboard();
      if (dashboardRes.success) {
        setDashboardData(dashboardRes.data);
      } else {
        throw new Error(dashboardRes.error || 'فشل تحميل بيانات Dashboard');
      }

      // جلب المهام النشطة
      const jobsRes = await getTechJobs({ limit: 6, status: 'in_progress' });
      if (jobsRes.success) {
        setRecentJobs(jobsRes.data || []);
        // تحديد أول إصلاح نشط للـ Stopwatch
        if (jobsRes.data && jobsRes.data.length > 0) {
          setActiveRepairId(jobsRes.data[0].id);
        }
      }

      // جلب الوقت اليومي (غير حرج - لا نرمي خطأ إذا فشل)
      try {
        const timeRes = await getDailyTotal();
        if (timeRes.success) {
          setDailyTime(timeRes.data.total);
        }
      } catch (timeError) {
        console.error('Error loading daily time:', timeError);
        // لا نعرض خطأ للوقت اليومي لأنه غير حرج
      }

      // إعادة تعيين Retry Count عند النجاح
      setRetryCount(0);
      
      if (isRetry) {
        notifications.success('نجح', { message: 'تم تحميل البيانات بنجاح' });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      const errorMessage = error.message || 'فشل تحميل البيانات. يرجى المحاولة مرة أخرى.';
      setError(errorMessage);
      
      // إظهار إشعار فقط إذا لم تكن محاولة إعادة
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

  // تحديث الوقت اليومي فقط عند الحاجة (بدون refresh كامل للصفحة)
  const refreshDailyTime = async () => {
    try {
      const timeRes = await getDailyTotal();
      if (timeRes.success) {
        setDailyTime(timeRes.data.total);
      }
    } catch (timeError) {
      console.error('Error refreshing daily time:', timeError);
      // لا نعرض خطأ للوقت اليومي لأنه غير حرج
    }
  };

  const getStatusCount = (status) => {
    if (!dashboardData?.byStatus) return 0;
    const statusItem = dashboardData.byStatus.find(item => item.status === status);
    return statusItem ? statusItem.count : 0;
  };

  if (loading && !error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <TechnicianHeader user={user} notificationCount={5} />
        <div className="max-w-7xl mx-auto py-8 space-y-8">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
            <div className="h-4 w-96 bg-muted animate-pulse rounded" />
          </div>
          <CardSkeleton count={4} />
        </div>
      </div>
    );
  }

  // Error State
  if (error && !loading) {
    return (
      <PageTransition className="min-h-screen bg-background">
        <TechnicianHeader user={user} notificationCount={5} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
                  خطأ في تحميل البيانات
                </h3>
                <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
                <div className="flex gap-3">
                  <button
                    onClick={handleRetry}
                    disabled={retryCount >= 3}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    إعادة المحاولة {retryCount > 0 && `(${retryCount}/3)`}
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    تحديث الصفحة
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-background pb-20 md:pb-0">
      <TechnicianHeader user={user} notificationCount={5} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">مرحباً، مهندس {user?.name} 👋</h1>
          <p className="text-muted-foreground mt-1">إليك ملخص لأدائك والمهام الموكلة إليك اليوم</p>
        </div>

        {/* Stats Grid - محسّن Visual Hierarchy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {loading ? (
            <CardLoadingSkeleton count={4} />
          ) : (
            <>
              <TechnicianStatsCard
                title="مهام قيد العمل"
                value={getStatusCount('in_progress')}
                icon={Wrench}
                gradient="from-blue-500 to-blue-600"
                change={dashboardData?.stats?.inProgressChange}
                changeType="increase"
                tooltip="المهام قيد التنفيذ حالياً. اضغط لعرض التفاصيل"
                onClick={() => navigate('/technician/jobs?status=in_progress')}
              />
              <TechnicianStatsCard
                title="مكتملة اليوم"
                value={getStatusCount('completed')}
                icon={CheckCircle}
                gradient="from-green-500 to-green-600"
                change={dashboardData?.stats?.completedChange}
                changeType="increase"
                tooltip="المهام المكتملة اليوم. اضغط لعرض التفاصيل"
                onClick={() => navigate('/technician/jobs?status=completed')}
              />
              <TechnicianStatsCard
                title="في الانتظار"
                value={getStatusCount('pending')}
                icon={Clock}
                gradient="from-orange-500 to-orange-600"
                change={dashboardData?.stats?.pendingChange}
                changeType="decrease"
                tooltip="المهام في قائمة الانتظار. اضغط لعرض التفاصيل"
                onClick={() => navigate('/technician/jobs?status=pending')}
              />
              <TechnicianStatsCard
                title="وقت العمل اليوم"
                value={dailyTime ? `${dailyTime.totalHours || 0}:${(dailyTime.totalMinutes || 0).toString().padStart(2, '0')}` : '0:00'}
                icon={Timer}
                gradient="from-purple-500 to-pink-500"
                subtitle={dailyTime ? `${dailyTime.totalSessions || 0} جلسة عمل` : 'لم يبدأ بعد'}
                tooltip="إجمالي وقت العمل اليوم. اضغط لعرض التفاصيل"
                onClick={() => navigate('/technician/profile')}
              />
            </>
          )}
        </div>

        {/* Stopwatch Section - محسّن: يظهر دائماً */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">تتبع الوقت</h2>
          <div className="max-w-md">
            <Stopwatch 
              repairId={activeRepairId}
              onTimeUpdate={(time) => {
                // تحديث الوقت اليومي فقط عند إيقاف التتبع (لا نحدث كل ثانية)
                refreshDailyTime();
              }}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">إجراءات سريعة</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionCard
              icon={QrCode}
              label="مسح QR Code"
              gradient="from-indigo-500 to-violet-500"
              onClick={() => {
                // TODO: فتح QR Scanner Modal عند توفرها
                notifications.info('قريباً', { message: 'ميزة مسح QR Code قيد التطوير' });
              }}
            />
            <QuickActionCard
              icon={Plus}
              label="مهمة جديدة"
              gradient="from-blue-500 to-indigo-500"
              onClick={() => navigate('/technician/tasks')}
            />
            <QuickActionCard
              icon={FileText}
              label="التقارير"
              gradient="from-teal-500 to-green-500"
              onClick={() => {
                notifications.info('قريباً', { message: 'نظام التقارير قيد التطوير' });
                // TODO: إضافة رابط لصفحة التقارير عند توفرها
                // navigate('/technician/reports');
              }}
            />
            <QuickActionCard
              icon={Search}
              label="بحث"
              gradient="from-gray-600 to-gray-800"
              onClick={() => navigate('/technician/jobs')}
            />
          </div>
        </div>

        {/* Notes Section */}
        <div className="mb-8">
          <NotesList />
        </div>

        {/* Recent Jobs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">آخر المهام</h2>
            <button
              onClick={() => navigate('/technician/jobs')}
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              عرض الكل
            </button>
          </div>

          {recentJobs.length === 0 ? (
            <div className="bg-card rounded-xl shadow-sm border border-border p-8 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">لا توجد مهام حالياً</h3>
              <p className="text-muted-foreground mb-4">أنت جاهز لاستلام مهام جديدة!</p>
              <button
                onClick={() => navigate('/technician/jobs')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                عرض جميع المهام
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">رقم المهمة</th>
                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">الجهاز</th>
                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">المشكلة</th>
                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">الحالة</th>
                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">التاريخ</th>
                        <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentJobs.map((job) => (
                        <tr key={job.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">#{job.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{job.deviceType}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground truncate max-w-xs">{job.issueDescription}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${job.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              job.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}>
                              {job.status === 'completed' ? 'مكتمل' :
                                job.status === 'in_progress' ? 'قيد التنفيذ' : 'معلق'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {new Date(job.createdAt).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => navigate(`/technician/jobs/${job.id}`)}
                                className="text-primary hover:text-primary/80 font-medium"
                              >
                                عرض التفاصيل
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRepair({ id: job.id, repairNumber: job.repairNumber });
                                  setShowQuickReport(true);
                                }}
                                className="text-green-600 hover:text-green-800 font-medium"
                              >
                                تقرير سريع
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden space-y-4">
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-card rounded-xl shadow-sm border border-border p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">#{job.id}</h3>
                        <p className="text-sm text-muted-foreground">{job.deviceType}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${job.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        job.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                        {job.status === 'completed' ? 'مكتمل' :
                          job.status === 'in_progress' ? 'قيد التنفيذ' : 'معلق'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{job.issueDescription}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span>{new Date(job.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/technician/jobs/${job.id}`)}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                      >
                        عرض التفاصيل
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRepair({ id: job.id, repairNumber: job.repairNumber });
                          setShowQuickReport(true);
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        تقرير سريع
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
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
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <TechnicianBottomNav />
    </PageTransition>
  );
}
