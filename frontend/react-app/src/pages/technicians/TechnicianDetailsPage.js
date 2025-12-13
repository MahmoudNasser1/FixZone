import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Phone, Mail, Edit, Trash2, UserCheck, UserX, Calendar, Clock,
  Activity, TrendingUp, Wrench, CheckCircle, XCircle, ArrowLeft,
  BarChart3, Calendar as CalendarIcon, Award, Award as SkillsIcon, Star, DollarSign
} from 'lucide-react';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import technicianService from '../../services/technicianService';
import PageTransition from '../../components/ui/PageTransition';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleBadge from '../../components/ui/SimpleBadge';
import TechnicianReportExport from '../../components/technicians/TechnicianReportExport';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// Lazy load components for better performance
const TechnicianSkillsList = lazy(() => import('../../components/technicians/TechnicianSkillsList'));
const TechnicianRepairsList = lazy(() => import('../../components/technicians/TechnicianRepairsList'));
const TechnicianEvaluationsList = lazy(() => import('../../components/technicians/TechnicianEvaluationsList'));
const TechnicianWagesList = lazy(() => import('../../components/technicians/TechnicianWagesList'));

const TechnicianDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();
  
  const [technician, setTechnician] = useState(null);
  const [stats, setStats] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Cache for loaded data
  const [dataCache, setDataCache] = useState({});

  useEffect(() => {
    if (id) {
      loadTechnician();
      loadStats();
      loadPerformance();
    }
  }, [id]);

  const loadTechnician = async () => {
    // Check cache first
    if (dataCache.technician && dataCache.technician.id === id) {
      setTechnician(dataCache.technician);
      return;
    }

    try {
      setLoading(true);
      const response = await technicianService.getTechnicianById(id);
      
      if (response.success && response.data) {
        setTechnician(response.data);
        setDataCache(prev => ({ ...prev, technician: response.data }));
      } else {
        throw new Error('Technician not found');
      }
    } catch (error) {
      console.error('Error loading technician:', error);
      notifications.error('خطأ في تحميل بيانات الفني', { message: error.message || 'حدث خطأ غير متوقع' });
      navigate('/technicians');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await technicianService.getTechnicianStats(id);
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadPerformance = async () => {
    try {
      const response = await technicianService.getTechnicianPerformance(id, {
        periodStart: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        periodEnd: new Date().toISOString().split('T')[0]
      });
      if (response.success && response.data) {
        setPerformance(response.data);
      }
    } catch (error) {
      console.error('Error loading performance:', error);
    }
  };

  const handleToggleStatus = async () => {
    if (!technician) return;
    
    try {
      const newStatus = !technician.isActive;
      const response = await technicianService.updateTechnician(id, { isActive: newStatus });
      
      if (response.success) {
        setTechnician({ ...technician, isActive: newStatus });
        notifications.success(`تم ${newStatus ? 'تفعيل' : 'تعطيل'} الفني بنجاح`);
      } else {
        throw new Error(response.error || 'فشل تحديث الحالة');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      notifications.error('فشل في تحديث حالة الفني', { message: error.message || 'حدث خطأ غير متوقع' });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`هل أنت متأكد من حذف الفني "${technician.name}"؟`)) {
      return;
    }

    try {
      const response = await technicianService.deleteTechnician(id);
      if (response.success) {
        notifications.success('تم حذف الفني بنجاح');
        navigate('/technicians');
      } else {
        throw new Error(response.error || 'فشل في حذف الفني');
      }
    } catch (error) {
      console.error('Error deleting technician:', error);
      notifications.error('فشل في حذف الفني', { message: error.message || 'حدث خطأ غير متوقع' });
    }
  };

  if (loading) {
    return (
      <PageTransition className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-4">جاري التحميل...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!technician) {
    return (
      <PageTransition className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <SimpleCard>
            <SimpleCardContent className="p-12 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-muted-foreground">الفني غير موجود</p>
              <SimpleButton onClick={() => navigate('/technicians')} className="mt-4">
                العودة للقائمة
              </SimpleButton>
            </SimpleCardContent>
          </SimpleCard>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <SimpleButton
            variant="outline"
            onClick={() => navigate('/technicians')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة للقائمة
          </SimpleButton>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{technician.name}</h1>
                <p className="text-muted-foreground">{technician.email}</p>
              </div>
              <SimpleBadge 
                variant={technician.isActive ? 'success' : 'danger'}
                className="flex items-center gap-1"
              >
                {technician.isActive ? (
                  <>
                    <UserCheck className="w-3 h-3" />
                    نشط
                  </>
                ) : (
                  <>
                    <UserX className="w-3 h-3" />
                    معطل
                  </>
                )}
              </SimpleBadge>
            </div>
            <div className="flex items-center gap-2">
              <SimpleButton
                variant="outline"
                onClick={handleToggleStatus}
                className={technician.isActive ? 'text-yellow-600' : 'text-green-600'}
              >
                {technician.isActive ? (
                  <>
                    <UserX className="w-4 h-4 ml-1" />
                    تعطيل
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 ml-1" />
                    تفعيل
                  </>
                )}
              </SimpleButton>
              <SimpleButton
                variant="outline"
                onClick={() => navigate(`/technicians/${id}/edit`)}
              >
                <Edit className="w-4 h-4 ml-1" />
                تعديل
              </SimpleButton>
              <SimpleButton
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 ml-1" />
                حذف
              </SimpleButton>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            نظرة عامة
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'skills'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <SkillsIcon className="w-4 h-4 inline ml-1" />
            المهارات
          </button>
          <button
            onClick={() => setActiveTab('repairs')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'repairs'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Wrench className="w-4 h-4 inline ml-1" />
            الإصلاحات
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'performance'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline ml-1" />
            الأداء
          </button>
          <button
            onClick={() => setActiveTab('evaluations')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'evaluations'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Star className="w-4 h-4 inline ml-1" />
            التقييمات
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CalendarIcon className="w-4 h-4 inline ml-1" />
            الجدول
          </button>
          <button
            onClick={() => setActiveTab('wages')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'wages'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <DollarSign className="w-4 h-4 inline ml-1" />
            الأجور
          </button>
          <button
            onClick={() => navigate(`/technicians/${id}/analytics`)}
            className="px-4 py-2 font-medium transition-colors whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            <BarChart3 className="w-4 h-4 inline ml-1" />
            التحليلات
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>المعلومات الأساسية</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">الاسم</p>
                    <p className="font-medium text-foreground">{technician.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                    <p className="font-medium text-foreground">{technician.email}</p>
                  </div>
                </div>
                {technician.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                      <p className="font-medium text-foreground">{technician.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
                    <p className="font-medium text-foreground">
                      {technician.createdAt ? new Date(technician.createdAt).toLocaleDateString('ar-EG') : 'غير محدد'}
                    </p>
                  </div>
                </div>
              </SimpleCardContent>
            </SimpleCard>

            {/* Stats */}
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>الإحصائيات</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                {stats ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-muted-foreground">إجمالي الإصلاحات</span>
                      </div>
                      <span className="text-xl font-bold text-blue-600">
                        {stats.repairs?.totalRepairs || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-muted-foreground">مكتملة</span>
                      </div>
                      <span className="text-xl font-bold text-green-600">
                        {stats.repairs?.completedRepairs || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm text-muted-foreground">وقت العمل اليوم (دقيقة)</span>
                      </div>
                      <span className="text-xl font-bold text-yellow-600">
                        {stats.timeTracking?.todayMinutes || 0}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">جاري تحميل الإحصائيات...</p>
                )}
              </SimpleCardContent>
            </SimpleCard>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-4">
            <TechnicianReportExport technicianId={id} reportType="performance" />
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>أداء الفني (آخر 30 يوم)</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                {performance ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">إجمالي الإصلاحات</p>
                      <p className="text-2xl font-bold text-blue-600">{performance.totalRepairs || 0}</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">مكتملة</p>
                      <p className="text-2xl font-bold text-green-600">{performance.completedRepairs || 0}</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">متوسط وقت الإصلاح (ساعة)</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {performance.averageRepairTime ? Math.round(performance.averageRepairTime * 10) / 10 : 0}
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">إجمالي الإيرادات</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {performance.totalRevenue ? `${performance.totalRevenue.toFixed(2)} ج.م` : '0 ج.م'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">جاري تحميل بيانات الأداء...</p>
                )}
              </SimpleCardContent>
            </SimpleCard>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-4">
            <Suspense fallback={<LoadingSpinner />}>
              <TechnicianSkillsList technicianId={id} />
            </Suspense>
            <TechnicianReportExport technicianId={id} reportType="skills" />
          </div>
        )}

        {activeTab === 'repairs' && (
          <div className="space-y-4">
            <Suspense fallback={<LoadingSpinner />}>
              <TechnicianRepairsList technicianId={id} />
            </Suspense>
            <TechnicianReportExport technicianId={id} reportType="performance" />
          </div>
        )}

        {activeTab === 'evaluations' && (
          <Suspense fallback={<LoadingSpinner />}>
            <TechnicianEvaluationsList technicianId={id} />
          </Suspense>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>الجدول</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <p className="text-sm text-muted-foreground">سيتم إضافة عرض الجدول قريباً</p>
              </SimpleCardContent>
            </SimpleCard>
            <TechnicianReportExport technicianId={id} reportType="schedule" />
          </div>
        )}

        {activeTab === 'wages' && (
          <div className="space-y-4">
            <Suspense fallback={<LoadingSpinner />}>
              <TechnicianWagesList technicianId={id} />
            </Suspense>
            <TechnicianReportExport technicianId={id} reportType="wages" />
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default TechnicianDetailsPage;

