import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  TrendingUp,
  BarChart3,
  ChevronLeft,
  Search,
  Filter,
  ArrowRight,
  History,
  Timer
} from 'lucide-react';
import { getTimeTrackings, getDailyTotal } from '../../services/timeTrackingService';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import PageTransition from '../../components/ui/PageTransition';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { cn } from '../../lib/utils';
import TechnicianHeader from '../../components/technician/TechnicianHeader';
import TechnicianBottomNav from '../../components/technician/TechnicianBottomNav';
import useAuthStore from '../../stores/authStore';

export default function TimeReportsPage() {
  const notifications = useNotifications();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('day'); // day, week, month
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reports, setReports] = useState(null);

  useEffect(() => {
    loadReports();
  }, [period, date]);

  const loadReports = async () => {
    try {
      setLoading(true);

      let startDate, endDate;
      const selectedDate = new Date(date);

      if (period === 'day') {
        startDate = endDate = date;
      } else if (period === 'week') {
        const dayOfWeek = selectedDate.getDay();
        const diff = selectedDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
        startDate = new Date(selectedDate.setDate(diff)).toISOString().split('T')[0];
        endDate = new Date(selectedDate.setDate(diff + 6)).toISOString().split('T')[0];
      } else if (period === 'month') {
        startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).toISOString().split('T')[0];
        endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).toISOString().split('T')[0];
      }

      const response = await getTimeTrackings({
        startDate,
        endDate,
      });

      if (response.success) {
        const trackings = response.data.trackings || [];

        // حساب الإحصائيات
        const totalSeconds = trackings.reduce((sum, t) => sum + (t.duration || 0), 0);
        const totalHours = Math.floor(totalSeconds / 3600);
        const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
        const sessions = trackings.length;
        const avgSession = sessions > 0 ? Math.floor(totalSeconds / sessions / 60) : 0;

        setReports({
          totalSeconds,
          totalHours,
          totalMinutes,
          sessions,
          avgSession,
          trackings,
        });
      } else {
        throw new Error(response.error || 'فشل تحميل التقارير');
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      notifications.error('خطأ', { message: 'فشل تحميل التقارير' });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <PageTransition className="min-h-screen bg-background text-right" dir="rtl">
        <TechnicianHeader user={user} notificationCount={5} />
        <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center">
          <LoadingSpinner message="جاري تحليل سجلات الوقت..." />
        </div>
        <TechnicianBottomNav />
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-background pb-28 md:pb-8 text-right font-sans" dir="rtl">
      <TechnicianHeader user={user} notificationCount={5} />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Timer className="w-5 h-5 text-primary" />
              </div>
              <SimpleBadge variant="secondary" className="px-3">تقارير الإنتاجية</SimpleBadge>
            </div>
            <h1 className="text-3xl font-black text-foreground">تحليل وقت العمل</h1>
            <p className="text-muted-foreground max-w-md">
              راجع إحصائياتك الزمنية وسجلات المهام المنجزة خلال الفترة المحددة.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative group">
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="pr-10 pl-4 py-3 bg-card border-border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
              >
                <option value="day">اليوم الحالي</option>
                <option value="week">الأسبوع الجاري</option>
                <option value="month">الشهر الجاري</option>
              </select>
            </div>
            <div className="relative group">
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pr-10 pl-4 py-3 bg-card border-border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {reports && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SimpleCard className="border-none shadow-lg shadow-primary/5 bg-gradient-to-br from-card to-muted/20">
              <SimpleCardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-primary/20 rounded-xl">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <SimpleBadge variant="info">مباشر</SimpleBadge>
                </div>
                <h3 className="text-xs font-bold text-muted-foreground mb-1">إجمالي الوقت</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-foreground">
                    {formatTime(reports.totalSeconds)}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">ساعة:دقيقة</span>
                </div>
                <div className="mt-4 pt-4 border-t border-border/40 flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">تفصيل دقيق</span>
                  <span className="text-xs font-bold text-foreground">{reports.totalHours}س {reports.totalMinutes}د</span>
                </div>
              </SimpleCardContent>
            </SimpleCard>

            <SimpleCard className="border-none shadow-lg shadow-blue-500/5 bg-gradient-to-br from-card to-blue-500/5">
              <SimpleCardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-xl">
                    <BarChart3 className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
                <h3 className="text-xs font-bold text-muted-foreground mb-1">عدد الجلسات</h3>
                <p className="text-3xl font-black text-foreground">{reports.sessions || 0}</p>
                <p className="text-xs text-muted-foreground mt-2 font-medium">جلسة تتبع مكتملة</p>
              </SimpleCardContent>
            </SimpleCard>

            <SimpleCard className="border-none shadow-lg shadow-emerald-500/5 bg-gradient-to-br from-card to-emerald-500/5">
              <SimpleCardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-emerald-500/20 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                  </div>
                </div>
                <h3 className="text-xs font-bold text-muted-foreground mb-1">متوسط الجلسة</h3>
                <p className="text-2xl font-black text-foreground">{reports.avgSession || 0} دقيقة</p>
                <div className="h-1.5 w-full bg-emerald-500/10 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-emerald-500 w-1/2 rounded-full" />
                </div>
              </SimpleCardContent>
            </SimpleCard>

            <SimpleCard className="border-none shadow-lg shadow-purple-500/5 bg-gradient-to-br from-card to-purple-500/5">
              <SimpleCardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-500/20 rounded-xl">
                    <Calendar className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
                <h3 className="text-xs font-bold text-muted-foreground mb-1">الفترة الزمنية</h3>
                <p className="text-xl font-black text-foreground">
                  {period === 'day' ? 'تقرير يومي' : period === 'week' ? 'تقرير أسبوعي' : 'تقرير شهري'}
                </p>
                <p className="text-xs text-muted-foreground mt-2 font-medium">
                  بتاريخ: {new Date(date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}
                </p>
              </SimpleCardContent>
            </SimpleCard>
          </div>
        )}

        {/* Detailed Logs Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-black text-foreground">سجل الجلسات التفصيلي</h2>
            </div>
            {reports?.trackings?.length > 0 && (
              <SimpleBadge variant="outline" className="font-bold">{reports.trackings.length} سجلات</SimpleBadge>
            )}
          </div>

          <SimpleCard className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md overflow-hidden">
            <SimpleCardContent className="p-0">
              {!reports || reports.trackings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                    <Clock className="w-10 h-10 text-muted-foreground opacity-20" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">لا توجد بيانات متاحة</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    لم نتمكن من العثور على أي جلسات عمل مسجلة خلال الفترة المختارة. حاول تغيير نطاق التاريخ.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {reports.trackings.map((tracking) => (
                    <div
                      key={tracking.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-muted/30 transition-all gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1 p-2 bg-muted rounded-xl text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <Timer className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                            {tracking.deviceName || 'جلسة عمل عامة'}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                            {tracking.repairNumber && (
                              <span className="flex items-center gap-1.5 font-bold text-primary/80">
                                <Search className="w-3 h-3" />
                                {tracking.repairNumber}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded-md">
                              <Calendar className="w-3 h-3" />
                              {new Date(tracking.startTime).toLocaleDateString('ar-EG')}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              {new Date(tracking.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 sm:text-left">
                        <div className="space-y-1 sm:text-left">
                          <p className="text-lg font-black text-foreground">
                            {formatTime(tracking.duration || 0)}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">المدة الزمنية</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <SimpleBadge
                            variant={tracking.status === 'completed' ? 'success' : 'warning'}
                            className="text-[10px] font-black"
                          >
                            {tracking.status === 'completed' ? 'تم الإنجاز' : 'متوقف مؤقتاً'}
                          </SimpleBadge>
                        </div>
                        <button className="p-2 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100 hidden sm:block">
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SimpleCardContent>
          </SimpleCard>
        </div>
      </div>

      <TechnicianBottomNav />
    </PageTransition>
  );
}

