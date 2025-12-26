import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotifications } from '../components/notifications/NotificationSystem';

const DashboardPage = () => {
  const navigate = useNavigate();
  const notifications = useNotifications();

  const [stats, setStats] = useState(null);
  const [recentRepairs, setRecentRepairs] = useState([]);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, recentRepairsRes, alertsRes] = await Promise.all([
        api.getDashboardStats().catch(e => ({ success: false, error: e.message })),
        api.getRecentRepairs(5).catch(e => ({ success: false, error: e.message })),
        api.getDashboardAlerts().catch(e => ({ success: false, error: e.message }))
      ]);

      // Parse stats
      if (statsRes?.success && statsRes?.data) {
        setStats(statsRes.data);
      } else if (statsRes?.error) {
        console.error('Error loading stats:', statsRes.error);
      }

      // Parse recent repairs
      if (recentRepairsRes?.success && recentRepairsRes?.data) {
        setRecentRepairs(Array.isArray(recentRepairsRes.data) ? recentRepairsRes.data : []);
      } else if (Array.isArray(recentRepairsRes)) {
        setRecentRepairs(recentRepairsRes);
      } else if (recentRepairsRes?.error) {
        console.error('Error loading recent repairs:', recentRepairsRes.error);
      }

      // Parse alerts
      if (alertsRes?.success && alertsRes?.data) {
        setAlerts(alertsRes.data);
      } else if (alertsRes?.error) {
        console.error('Error loading alerts:', alertsRes.error);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
      notifications.error('خطأ في التحميل', {
        message: err.message || 'فشل تحميل بيانات لوحة التحكم'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('completed') || statusLower.includes('delivered')) {
      return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
    }
    if (statusLower.includes('pending') || statusLower.includes('received')) {
      return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
    if (statusLower.includes('in_progress') || statusLower.includes('diagnosed')) {
      return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
    }
    return 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400';
  };

  if (loading && !stats) {
    return (
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-6">لوحة التحكم</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-6">لوحة التحكم</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-300 px-4 py-3 rounded">
          <p className="font-semibold">خطأ في التحميل</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">لوحة التحكم</h1>
        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="px-4 py-2 border rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'جاري التحديث...' : 'تحديث'}
        </button>
      </div>

      {/* Alerts */}
      {alerts && (alerts.totalAlerts > 0 || alerts.delayedCount > 0 || alerts.lowStockCount > 0) && (
        <div className="mb-6 space-y-3">
          {alerts.delayedCount > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-300 px-4 py-3 rounded">
              <p className="font-semibold">⚠️ طلبات متأخرة: {alerts.delayedCount}</p>
            </div>
          )}
          {alerts.lowStockCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-900/50 dark:text-yellow-300 px-4 py-3 rounded">
              <p className="font-semibold">⚠️ أصناف منخفضة المخزون: {alerts.lowStockCount}</p>
            </div>
          )}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي طلبات الإصلاح</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stats?.totalRequests || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.recentStats?.repairs > 0
                ? `+${stats.recentStats.repairs} خلال آخر 7 أيام`
                : 'لا توجد طلبات حديثة'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">طلبات معلقة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{stats?.pendingRequests || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.todayStats?.pending > 0
                ? `+${stats.todayStats.pending} جديد اليوم`
                : 'لا توجد طلبات جديدة اليوم'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">طلبات مكتملة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-500">{stats?.completedRequests || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.todayStats?.repairs > 0
                ? `${stats.todayStats.repairs} اليوم`
                : 'لا توجد إحصائيات اليوم'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">طلبات متأخرة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-500">{stats?.delayedCount || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.delayedCount > 0
                ? 'تتطلب متابعة'
                : 'لا توجد طلبات متأخرة'}
            </p>
          </CardContent>
        </Card>

        {stats?.lowStockCount > 0 && (
          <Card className="border-yellow-200 dark:border-yellow-900/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">أصناف منخفضة المخزون</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{stats.lowStockCount}</p>
              <p className="text-xs text-muted-foreground mt-1">تتطلب إعادة تموين</p>
            </CardContent>
          </Card>
        )}

        {stats?.technicianTasksCount > 0 && (
          <Card className="border-blue-200 dark:border-blue-900/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">مهام الفنيين</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">{stats.technicianTasksCount}</p>
              <p className="text-xs text-muted-foreground mt-1">قيد التنفيذ</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Repairs */}
      {recentRepairs.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>آخر طلبات الإصلاح</CardTitle>
              <button
                onClick={() => navigate('/repairs')}
                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                عرض الكل →
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRepairs.slice(0, 5).map((repair) => (
                <div
                  key={repair.id}
                  onClick={() => navigate(`/repairs/${repair.id}`)}
                  className="p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {repair.requestNumber || `#${repair.id}`}
                      </p>
                      <p className="text-sm text-muted-foreground">{repair.reportedProblem || 'لا يوجد وصف'}</p>
                      {repair.customerName && (
                        <p className="text-xs text-muted-foreground mt-1">{repair.customerName}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(repair.status)}`}>
                        {repair.status || 'غير محدد'}
                      </span>
                      {repair.createdAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(repair.createdAt).toLocaleDateString('ar')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !stats && !error && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">لا توجد بيانات للعرض</p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
