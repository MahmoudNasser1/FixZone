import React, { useState, useEffect } from 'react';
import { Calendar, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import { getTimeTrackings, getDailyTotal } from '../../services/timeTrackingService';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import PageTransition from '../../components/ui/PageTransition';

/**
 * 📊 Time Reports Page
 * 
 * صفحة تقارير الوقت
 * - تقرير يومي/أسبوعي/شهري
 * - رسوم بيانية
 */
export default function TimeReportsPage() {
  const notifications = useNotifications();
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

  return (
    <PageTransition className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-4">تقارير الوقت</h1>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="day">يومي</option>
              <option value="week">أسبوعي</option>
              <option value="month">شهري</option>
            </select>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Stats Cards */}
        {reports && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">إجمالي الوقت</h3>
                <p className="text-2xl font-bold text-foreground">
                  {formatTime(reports.totalSeconds)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {reports.totalHours} ساعة و {reports.totalMinutes} دقيقة
                </p>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">عدد الجلسات</h3>
                <p className="text-2xl font-bold text-foreground">{reports.sessions}</p>
                <p className="text-xs text-muted-foreground mt-1">جلسة عمل</p>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">متوسط الجلسة</h3>
                <p className="text-2xl font-bold text-foreground">{reports.avgSession}</p>
                <p className="text-xs text-muted-foreground mt-1">دقيقة</p>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">الفترة</h3>
                <p className="text-2xl font-bold text-foreground">
                  {period === 'day' ? 'يوم' : period === 'week' ? 'أسبوع' : 'شهر'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(date).toLocaleDateString('ar-EG')}
                </p>
              </div>
            </div>

            {/* Trackings List */}
            <div className="bg-card rounded-xl border border-border shadow-sm">
              <div className="p-6 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">سجل التتبع</h2>
              </div>
              <div className="p-6">
                {reports.trackings.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">لا توجد سجلات تتبع في هذه الفترة</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.trackings.map((tracking) => (
                      <div
                        key={tracking.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-foreground">
                              {tracking.deviceName || 'مهمة عامة'}
                            </h3>
                            {tracking.repairNumber && (
                              <span className="text-xs text-muted-foreground">
                                {tracking.repairNumber}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              {new Date(tracking.startTime).toLocaleDateString('ar-EG')}
                            </span>
                            <span>
                              {formatTime(tracking.duration || 0)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">
                            {formatTime(tracking.duration || 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tracking.status === 'completed' ? 'مكتمل' : 'متوقف'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}

