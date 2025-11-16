import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getTechDashboard, 
  getTechJobs 
} from '../../services/technicianService';
import { StatsCard, JobCard } from '../../components/technician';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import useAuthStore from '../../stores/authStore';
import {
  Wrench,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  LogOut,
  Settings,
  List,
  Shield
} from 'lucide-react';

/**
 * TechnicianDashboard Page
 * لوحة تحكم الفني - الصفحة الرئيسية
 */

export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const loadingRef = useRef(false);

  useEffect(() => {
    // التحقق من أن المستخدم فني
    const roleId = user?.roleId || user?.role;
    const isTechnician = user && (roleId === 3 || roleId === '3');

    if (!user || !isTechnician) {
      notifications.error('خطأ', { message: 'يجب تسجيل الدخول كفني للوصول لهذه الصفحة' });
      navigate('/login');
      return;
    }

    // تحميل البيانات
    if (!loadingRef.current) {
      loadingRef.current = true;
      loadDashboardData().finally(() => {
        loadingRef.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // تحميل الإحصائيات
      const dashboardRes = await getTechDashboard();
      if (dashboardRes.success) {
        setDashboardData(dashboardRes.data);
      }

      // تحميل آخر الأجهزة (أحدث 6)
      const jobsRes = await getTechJobs({ limit: 6 });
      if (jobsRes.success) {
        setRecentJobs(jobsRes.data || []);
      }

    } catch (error) {
      console.error('Error loading dashboard:', error);
      notifications.error('خطأ', { message: 'فشل تحميل البيانات' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      logout();
      navigate('/login');
      notifications.success('نجاح', { message: 'تم تسجيل الخروج بنجاح' });
    } catch (error) {
      console.error('Logout error:', error);
      logout();
      navigate('/login');
    }
  };

  // حساب الإحصائيات من byStatus
  const getStatusCount = (status) => {
    if (!dashboardData?.byStatus) return 0;
    const item = dashboardData.byStatus.find(s => s.status === status);
    return item?.cnt || 0;
  };

  const activeJobs = getStatusCount('UNDER_REPAIR') + getStatusCount('UNDER_DIAGNOSIS');
  const completedToday = dashboardData?.todayUpdated || 0;
  const waitingParts = getStatusCount('WAITING_PARTS');
  const totalJobs = dashboardData?.totalJobs || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">لوحة تحكم الفني</h1>
                <p className="text-sm text-gray-600">مرحباً، {user?.name || 'الفني'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SimpleButton 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/tech/profile')}
              >
                <Settings className="w-4 h-4 mr-2" />
                الإعدادات
              </SimpleButton>
              <SimpleButton 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                خروج
              </SimpleButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="إجمالي الأجهزة"
            value={totalJobs}
            subtitle="المسلمة لك"
            icon={Package}
            iconColor="text-indigo-600"
            iconBgColor="bg-indigo-50"
          />
          <StatsCard
            title="قيد العمل"
            value={activeJobs}
            subtitle="نشط حالياً"
            icon={Wrench}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-50"
          />
          <StatsCard
            title="تم تحديثها اليوم"
            value={completedToday}
            subtitle="آخر 24 ساعة"
            icon={CheckCircle}
            iconColor="text-green-600"
            iconBgColor="bg-green-50"
          />
          <StatsCard
            title="بانتظار قطع غيار"
            value={waitingParts}
            subtitle="معلق"
            icon={AlertCircle}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-50"
          />
        </div>

        {/* Quick Actions */}
        <SimpleCard className="mb-8">
          <SimpleCardHeader>
            <SimpleCardTitle>إجراءات سريعة</SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SimpleButton
                variant="outline"
                className="h-20 justify-center"
                onClick={() => navigate('/tech/jobs')}
              >
                <div className="flex flex-col items-center gap-2">
                  <List className="w-6 h-6" />
                  <span>عرض كل الأجهزة</span>
                </div>
              </SimpleButton>
              <SimpleButton
                variant="outline"
                className="h-20 justify-center"
                onClick={() => navigate('/tech/jobs?status=UNDER_REPAIR')}
              >
                <div className="flex flex-col items-center gap-2">
                  <Wrench className="w-6 h-6" />
                  <span>الأجهزة النشطة</span>
                </div>
              </SimpleButton>
              <SimpleButton
                variant="outline"
                className="h-20 justify-center"
                onClick={() => navigate('/tech/jobs?status=WAITING_PARTS')}
              >
                <div className="flex flex-col items-center gap-2">
                  <Clock className="w-6 h-6" />
                  <span>بانتظار قطع غيار</span>
                </div>
              </SimpleButton>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* Recent Jobs */}
        <SimpleCard>
          <SimpleCardHeader>
            <div className="flex items-center justify-between">
              <SimpleCardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                آخر الأجهزة المحدثة
              </SimpleCardTitle>
              <SimpleButton
                variant="outline"
                size="sm"
                onClick={() => navigate('/tech/jobs')}
              >
                عرض الكل
              </SimpleButton>
            </div>
          </SimpleCardHeader>
          <SimpleCardContent>
            {recentJobs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">لا توجد أجهزة مسلمة لك بعد</p>
                <p className="text-sm mt-2">سيظهر هنا الأجهزة المسلمة لك من الإدارة</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </SimpleCardContent>
        </SimpleCard>
      </div>
    </div>
  );
}


