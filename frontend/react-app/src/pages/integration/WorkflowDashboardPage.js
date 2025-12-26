import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PlusIcon,
  WrenchIcon,
  BanknotesIcon,
  UserPlusIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  BellAlertIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  PhoneIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import { useSettings } from '../../context/SettingsContext';
import api from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';

const WorkflowDashboardPage = () => {
  const navigate = useNavigate();
  const { formatMoney } = useSettings();
  const notifications = useNotifications();
  const [stats, setStats] = useState(null);
  const [recentRepairs, setRecentRepairs] = useState([]);
  const [todayStats, setTodayStats] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [dashboardAlerts, setDashboardAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAllData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadAllData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch alerts first (needed for low stock items)
      await fetchDashboardAlerts();
      // Then fetch all other data in parallel
      await Promise.all([
        fetchDashboardStats(),
        fetchRecentRepairs(),
        fetchTodayStats(),
        fetchLowStockItems(),
        fetchPendingInvoices(),
        fetchRecentPayments()
      ]);
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

  // Use new Dashboard API
  const fetchDashboardStats = async () => {
    try {
      const dashboardStats = await api.getDashboardStats().catch(() => null);
      if (dashboardStats?.success && dashboardStats?.data) {
        const data = dashboardStats.data;
        setStats({
          totalRepairs: data.totalRequests || 0,
          pendingRepairs: data.pendingRequests || 0,
          inProgressRepairs: data.requestsByStatus?.find(s => s.status === 'in_progress')?.count || 0,
          completedRepairs: data.completedRequests || 0,
          deliveredRepairs: data.requestsByStatus?.find(s => s.status === 'delivered')?.count || 0,
          delayedCount: data.delayedCount || 0,
          lowStockCount: data.lowStockCount || 0,
          technicianTasksCount: data.technicianTasksCount || 0
        });
        setTodayStats({
          totalRevenue: 0, // Will be fetched separately
          paymentCount: 0, // Will be fetched separately
          repairs: data.todayStats?.repairs || 0,
          pending: data.todayStats?.pending || 0
        });
      } else {
        // Fallback to old method if new API fails
        await fetchStatsFallback();
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      await fetchStatsFallback();
    }
  };

  // Fallback method using old API
  const fetchStatsFallback = async () => {
    try {
      const [repairsRes, customersRes, inventoryRes] = await Promise.all([
        api.getRepairRequests().catch(() => ({ data: [] })),
        api.getCustomers().catch(() => ({ data: [] })),
        api.getInventoryItems().catch(() => ({ data: [] }))
      ]);

      const repairsArray = Array.isArray(repairsRes) ? repairsRes : (repairsRes?.data || repairsRes || []);
      const customersArray = Array.isArray(customersRes) ? customersRes : (customersRes?.data || customersRes || []);
      const inventoryArray = Array.isArray(inventoryRes) ? inventoryRes : (inventoryRes?.data || inventoryRes?.items || inventoryRes || []);

      // التأكد من أن repairsArray هو array
      const safeRepairsArray = Array.isArray(repairsArray) ? repairsArray : [];
      const safeCustomersArray = Array.isArray(customersArray) ? customersArray : [];
      const safeInventoryArray = Array.isArray(inventoryArray) ? inventoryArray : [];

      setStats({
        totalRepairs: safeRepairsArray.length,
        pendingRepairs: safeRepairsArray.filter(r => r && ['pending', 'RECEIVED', 'في الانتظار'].includes(r.status)).length,
        inProgressRepairs: safeRepairsArray.filter(r => r && ['in_progress', 'DIAGNOSED', 'قيد الإصلاح'].includes(r.status)).length,
        completedRepairs: safeRepairsArray.filter(r => r && ['completed', 'COMPLETED', 'مكتمل'].includes(r.status)).length,
        deliveredRepairs: safeRepairsArray.filter(r => r && ['delivered', 'DELIVERED', 'مسلم'].includes(r.status)).length,
        totalCustomers: safeCustomersArray.length,
        activeCustomers: safeCustomersArray.filter(c => c && !c.deletedAt && c.status !== 'deleted').length,
        totalInventoryItems: safeInventoryArray.length,
        lowStockCount: 0
      });
    } catch (error) {
      console.error('Error fetching stats (fallback):', error);
      setStats({
        totalRepairs: 0,
        pendingRepairs: 0,
        inProgressRepairs: 0,
        completedRepairs: 0,
        deliveredRepairs: 0,
        totalCustomers: 0,
        activeCustomers: 0,
        totalInventoryItems: 0,
        lowStockCount: 0
      });
    }
  };

  const fetchRecentRepairs = async () => {
    try {
      // Use new Dashboard API for recent repairs
      const recentData = await api.getRecentRepairs(5).catch(() => null);
      if (recentData?.success && recentData?.data) {
        setRecentRepairs(Array.isArray(recentData.data) ? recentData.data : []);
      } else if (Array.isArray(recentData)) {
        setRecentRepairs(recentData);
      } else {
        // Fallback to old method
        const repairsRes = await api.getRepairRequests().catch(() => ({ data: [] }));
        const repairsArray = Array.isArray(repairsRes) ? repairsRes : (repairsRes.data || repairsRes || []);
        setRecentRepairs(repairsArray.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching recent repairs:', error);
      setRecentRepairs([]);
    }
  };

  const fetchTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await api.request(`/reports/daily-revenue?date=${today}`).catch(() => null);
      if (data) {
        setTodayStats({
          totalRevenue: data.totalRevenue || 0,
          paymentCount: data.paymentCount || 0
        });
      } else {
        // Calculate from recent payments if API fails
        const paymentsRes = await api.request('/payments').catch(() => ({ data: [] }));
        const paymentsArray = Array.isArray(paymentsRes) ? paymentsRes : (paymentsRes.data || paymentsRes.payments || paymentsRes || []);
        const todayPayments = paymentsArray.filter(p => {
          const paymentDate = new Date(p.createdAt || p.paymentDate);
          return paymentDate.toISOString().split('T')[0] === today;
        });
        setTodayStats({
          totalRevenue: todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
          paymentCount: todayPayments.length
        });
      }
    } catch (error) {
      console.error('Error fetching today stats:', error);
      setTodayStats({ totalRevenue: 0, paymentCount: 0 });
    }
  };

  const fetchDashboardAlerts = async () => {
    try {
      const alertsData = await api.getDashboardAlerts().catch(() => null);
      if (alertsData?.success && alertsData?.data) {
        setDashboardAlerts(alertsData.data);
        // Update low stock items from alerts
        if (alertsData.data.lowStockItems && alertsData.data.lowStockItems.length > 0) {
          setLowStockItems(alertsData.data.lowStockItems.slice(0, 5));
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard alerts:', error);
    }
  };

  const fetchLowStockItems = async () => {
    try {
      // Try to use dashboard alerts first
      if (dashboardAlerts?.lowStockItems && dashboardAlerts.lowStockItems.length > 0) {
        setLowStockItems(dashboardAlerts.lowStockItems.slice(0, 5));
        return;
      }

      // Fallback to old endpoint
      const response = await api.request('/stocklevels/low-stock').catch(() => null);
      if (response && Array.isArray(response)) {
        setLowStockItems(response.slice(0, 5));
      } else if (response?.data && Array.isArray(response.data)) {
        setLowStockItems(response.data.slice(0, 5));
      } else {
        setLowStockItems([]);
      }
    } catch (error) {
      console.error('Error fetching low stock:', error);
      setLowStockItems([]);
    }
  };

  const fetchPendingInvoices = async () => {
    try {
      const invoicesRes = await api.getInvoices().catch(() => ({ data: { invoices: [] } }));

      // Handle different response formats
      let invoicesArray = [];
      if (Array.isArray(invoicesRes)) {
        invoicesArray = invoicesRes;
      } else if (invoicesRes?.success && invoicesRes?.data?.invoices && Array.isArray(invoicesRes.data.invoices)) {
        invoicesArray = invoicesRes.data.invoices;
      } else if (invoicesRes?.data && Array.isArray(invoicesRes.data)) {
        invoicesArray = invoicesRes.data;
      } else if (invoicesRes?.invoices && Array.isArray(invoicesRes.invoices)) {
        invoicesArray = invoicesRes.invoices;
      } else if (Array.isArray(invoicesRes)) {
        invoicesArray = invoicesRes;
      }

      // Ensure invoicesArray is an array before filtering
      if (!Array.isArray(invoicesArray)) {
        invoicesArray = [];
      }

      const pending = invoicesArray.filter(inv =>
        inv && (inv.status === 'unpaid' || inv.paymentStatus === 'unpaid' || inv.status === 'pending' || inv.paymentStatus === 'pending')
      );
      setPendingInvoices(pending.slice(0, 5));
    } catch (error) {
      console.error('Error fetching pending invoices:', error);
      setPendingInvoices([]);
    }
  };

  const fetchRecentPayments = async () => {
    try {
      const paymentsRes = await api.request('/payments').catch(() => ({ data: [] }));
      const paymentsArray = Array.isArray(paymentsRes) ? paymentsRes : (paymentsRes.data || paymentsRes.payments || paymentsRes || []);
      setRecentPayments(paymentsArray.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent payments:', error);
      setRecentPayments([]);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'delivered':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'معلق',
      'in_progress': 'قيد الإصلاح',
      'completed': 'مكتمل',
      'delivered': 'مسلم',
      'cancelled': 'ملغي'
    };
    return statusMap[status] || status;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Quick actions
  const quickActions = [
    {
      label: 'طلب إصلاح جديد',
      icon: WrenchIcon,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => navigate('/repairs/new')
    },
    {
      label: 'عميل جديد',
      icon: UserPlusIcon,
      color: 'bg-green-600 hover:bg-green-700',
      action: () => navigate('/customers/new')
    },
    {
      label: 'فاتورة جديدة',
      icon: DocumentTextIcon,
      color: 'bg-purple-600 hover:bg-purple-700',
      action: () => navigate('/invoices/new')
    },
    {
      label: 'إضافة مخزون',
      icon: ArchiveBoxIcon,
      color: 'bg-orange-600 hover:bg-orange-700',
      action: () => navigate('/inventory')
    },
    {
      label: 'طلب شراء',
      icon: ShoppingCartIcon,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      action: () => navigate('/inventory/orders')
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with Refresh */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Cog6ToothIcon className="h-10 w-10" />
              لوحة التحكم المتكاملة
            </h1>
            <p className="mt-2 text-blue-100 dark:text-blue-200">
              مراقبة شاملة وإجراءات سريعة لجميع العمليات • آخر تحديث: {new Date().toLocaleTimeString('ar-EG')}
            </p>
          </div>
          <button
            onClick={loadAllData}
            className="bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <ArrowPathIcon className="h-5 w-5" />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <BellAlertIcon className="h-6 w-6 text-primary" />
          الإجراءات السريعة
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.action}
              className={`${action.color} text-white p-4 rounded-lg flex flex-col items-center gap-2 transition-all transform hover:scale-105 shadow-md`}
            >
              <action.icon className="h-8 w-8" />
              <span className="text-sm font-medium text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Repairs */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">إجمالي الطلبات</div>
                <div className="text-4xl font-bold text-blue-900 dark:text-blue-100">{stats.totalRepairs}</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                  نشط اليوم
                </div>
              </div>
              <div className="bg-blue-600 dark:bg-blue-500 rounded-full p-4">
                <WrenchIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl shadow-sm border border-orange-200 dark:border-orange-800 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">قيد الإصلاح</div>
                <div className="text-4xl font-bold text-orange-900 dark:text-orange-100">{stats.inProgressRepairs}</div>
                <div className="text-xs text-orange-600 dark:text-orange-400 mt-2">يحتاج متابعة</div>
              </div>
              <div className="bg-orange-600 dark:bg-orange-500 rounded-full p-4">
                <ClockIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Total Customers */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl shadow-sm border border-green-200 dark:border-green-800 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">العملاء النشطين</div>
                <div className="text-4xl font-bold text-green-900 dark:text-green-100">{stats.activeCustomers}</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-2">من {stats.totalCustomers} إجمالي</div>
              </div>
              <div className="bg-green-600 dark:bg-green-500 rounded-full p-4">
                <UserGroupIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Today Revenue */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl shadow-sm border border-purple-200 dark:border-purple-800 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">إيرادات اليوم</div>
                <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  {formatMoney(todayStats?.totalRevenue || 0, 'EGP')}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                  {todayStats?.paymentCount || 0} مدفوعات
                </div>
              </div>
              <div className="bg-purple-600 dark:bg-purple-500 rounded-full p-4">
                <CurrencyDollarIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Progress */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
          <ChartBarIcon className="h-6 w-6 text-primary" />
          تقدم سير العمل
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            {
              label: 'معلق', count: stats?.pendingRepairs || 0, color: 'yellow', icon: ExclamationTriangleIcon,
              bgClass: 'bg-yellow-100 dark:bg-yellow-900/30', borderClass: 'border-yellow-200 dark:border-yellow-800',
              textIcon: 'text-yellow-600 dark:text-yellow-400', textCount: 'text-yellow-900 dark:text-yellow-100'
            },
            {
              label: 'قيد الإصلاح', count: stats?.inProgressRepairs || 0, color: 'blue', icon: ClockIcon,
              bgClass: 'bg-blue-100 dark:bg-blue-900/30', borderClass: 'border-blue-200 dark:border-blue-800',
              textIcon: 'text-blue-600 dark:text-blue-400', textCount: 'text-blue-900 dark:text-blue-100'
            },
            {
              label: 'مكتمل', count: stats?.completedRepairs || 0, color: 'green', icon: CheckCircleIcon,
              bgClass: 'bg-green-100 dark:bg-green-900/30', borderClass: 'border-green-200 dark:border-green-800',
              textIcon: 'text-green-600 dark:text-green-400', textCount: 'text-green-900 dark:text-green-100'
            },
            {
              label: 'تم الاضافة', count: pendingInvoices.length, color: 'purple', icon: DocumentTextIcon,
              bgClass: 'bg-purple-100 dark:bg-purple-900/30', borderClass: 'border-purple-200 dark:border-purple-800',
              textIcon: 'text-purple-600 dark:text-purple-400', textCount: 'text-purple-900 dark:text-purple-100'
            },
            {
              label: 'مسلم', count: stats?.deliveredRepairs || 0, color: 'emerald', icon: CheckCircleIcon,
              bgClass: 'bg-emerald-100 dark:bg-emerald-900/30', borderClass: 'border-emerald-200 dark:border-emerald-800',
              textIcon: 'text-emerald-600 dark:text-emerald-400', textCount: 'text-emerald-900 dark:text-emerald-100'
            }
          ].map((status, idx) => (
            <div key={idx} className="text-center">
              <div className={`${status.bgClass} rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-3 border-2 ${status.borderClass} shadow-sm`}>
                <div>
                  <status.icon className={`h-6 w-6 ${status.textIcon} mx-auto mb-1`} />
                  <span className={`text-2xl font-bold ${status.textCount}`}>{status.count}</span>
                </div>
              </div>
              <div className="text-sm font-medium text-muted-foreground">{status.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Three Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Repairs */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <WrenchIcon className="h-5 w-5 text-primary" />
              أحدث الطلبات
            </h3>
            <Link to="/repairs" className="text-sm text-primary hover:text-primary/80">
              عرض الكل ←
            </Link>
          </div>
          <div className="space-y-3">
            {recentRepairs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">لا توجد طلبات</p>
            ) : (
              recentRepairs.map((repair) => (
                <Link
                  key={repair.id}
                  to={`/repairs/${repair.id}`}
                  className="block border border-border rounded-lg p-3 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-foreground truncate">
                        {repair.customerName || 'عميل غير محدد'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {repair.deviceType || 'غير محدد'}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(repair.status)}`}>
                      {getStatusText(repair.status)}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {new Date(repair.createdAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                    </span>
                    {repair.estimatedCost && (
                      <span className="font-medium text-foreground">
                        {formatMoney(repair.estimatedCost, 'EGP')}
                      </span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Pending Invoices & Payments */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-primary" />
              فواتير معلقة
            </h3>
            <Link to="/invoices" className="text-sm text-primary hover:text-primary/80">
              عرض الكل ←
            </Link>
          </div>
          <div className="space-y-3">
            {pendingInvoices.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">لا توجد فواتير معلقة</p>
            ) : (
              pendingInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="border border-border rounded-lg p-3 hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        فاتورة #{invoice.id}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {invoice.customerName || 'عميل غير محدد'}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-foreground">
                        {formatMoney(invoice.totalAmount || invoice.total || 0, 'EGP')}
                      </div>
                      <div className="text-xs text-destructive">غير مدفوعة</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Recent Payments */}
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <BanknotesIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
              آخر المدفوعات
            </h4>
            <div className="space-y-2">
              {recentPayments.slice(0, 3).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">فاتورة #{payment.invoiceId}</span>
                  <span className="font-medium text-green-700 dark:text-green-400">
                    {formatMoney(payment.amount, 'EGP')}
                  </span>
                </div>
              ))}
              {recentPayments.length === 0 && (
                <p className="text-muted-foreground text-xs">لا توجد مدفوعات اليوم</p>
              )}
            </div>
          </div>
        </div>

        {/* Alerts & Low Stock */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BellAlertIcon className="h-5 w-5 text-destructive" />
              تنبيهات النظام
            </h3>
            <span className="bg-destructive/10 text-destructive text-xs font-bold px-2 py-1 rounded-full">
              {lowStockItems.length + pendingInvoices.length}
            </span>
          </div>

          {/* Low Stock Alert */}
          {lowStockItems.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-bold text-destructive mb-3 flex items-center gap-2">
                <ArchiveBoxIcon className="h-4 w-4" />
                مخزون منخفض ({lowStockItems.length})
              </h4>
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <div key={item.stockLevelId || item.id} className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-foreground text-sm">{item.name || item.itemName}</div>
                        <div className="text-xs text-muted-foreground">{item.sku}</div>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-destructive">{item.quantity}</div>
                        <div className="text-xs text-muted-foreground">متبقي</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/inventory/stock-alerts"
                className="mt-3 block text-center text-sm text-destructive hover:text-destructive/80 font-medium"
              >
                عرض جميع التنبيهات →
              </Link>
            </div>
          )}

          {/* Unpaid Invoices Alert */}
          {pendingInvoices.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-orange-700 dark:text-orange-400 mb-3 flex items-center gap-2">
                <DocumentTextIcon className="h-4 w-4" />
                فواتير غير مدفوعة ({pendingInvoices.length})
              </h4>
              <div className="text-sm text-muted-foreground">
                المبلغ الإجمالي:{' '}
                <span className="font-bold text-orange-700 dark:text-orange-400">
                  {formatMoney(
                    pendingInvoices.reduce((sum, inv) => sum + (inv.totalAmount || inv.total || 0), 0),
                    'EGP'
                  )}
                </span>
              </div>
            </div>
          )}

          {/* No Alerts */}
          {lowStockItems.length === 0 && pendingInvoices.length === 0 && (
            <div className="text-center py-8">
              <CheckCircleIcon className="h-12 w-12 text-green-500 dark:text-green-400 mx-auto mb-2" />
              <p className="text-muted-foreground">لا توجد تنبيهات حالياً</p>
              <p className="text-xs text-muted-foreground/80 mt-1">النظام يعمل بشكل طبيعي ✨</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Summary */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            ملخص اليوم
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">طلبات جديدة</div>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {stats?.pendingRepairs || 0}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="text-sm text-green-700 dark:text-green-300 mb-1">طلبات مكتملة</div>
              <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                {stats?.completedRepairs || 0}
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="text-sm text-purple-700 dark:text-purple-300 mb-1">إيرادات</div>
              <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
                {formatMoney(todayStats?.totalRevenue || 0, 'EGP')}
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
              <div className="text-sm text-orange-700 dark:text-orange-300 mb-1">مدفوعات</div>
              <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                {todayStats?.paymentCount || 0}
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Cog6ToothIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            حالة النظام
          </h3>
          <div className="space-y-4">
            {[
              { label: 'نظام الإصلاحات', status: 'active', count: stats?.totalRepairs || 0 },
              { label: 'إدارة العملاء', status: 'active', count: stats?.totalCustomers || 0 },
              { label: 'المخزون', status: stats?.lowStockCount > 0 ? 'warning' : 'active', count: stats?.totalInventoryItems || 0 },
              { label: 'النظام المالي', status: pendingInvoices.length > 5 ? 'warning' : 'active', count: pendingInvoices.length }
            ].map((system, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${system.status === 'active' ? 'bg-green-500 dark:bg-green-400 animate-pulse' :
                      system.status === 'warning' ? 'bg-yellow-500 dark:bg-yellow-400 animate-pulse' :
                        'bg-muted-foreground'
                    }`}></div>
                  <span className="font-medium text-foreground">{system.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{system.count} عنصر</span>
                  <span className={`text-xs font-bold ${system.status === 'active' ? 'text-green-600 dark:text-green-400' :
                      system.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-muted-foreground'
                    }`}>
                    {system.status === 'active' ? 'نشط' : system.status === 'warning' ? 'تحذير' : 'متوقف'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Performance Indicator */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">الأداء العام</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-muted rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-400 dark:to-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (stats?.completedRepairs / (stats?.totalRepairs || 1)) * 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-green-700 dark:text-green-400">
                  {Math.round((stats?.completedRepairs / (stats?.totalRepairs || 1)) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Banner */}
      {(stats?.pendingRepairs > 5 || lowStockItems.length > 3) && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border-2 border-red-200 dark:border-red-800 p-6">
          <div className="flex items-start gap-4">
            <div className="bg-red-100 dark:bg-red-900/40 rounded-full p-3">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 dark:text-red-200 mb-2">يحتاج انتباهك!</h3>
              <ul className="space-y-1 text-sm text-red-800 dark:text-red-300">
                {stats?.pendingRepairs > 5 && (
                  <li>• لديك {stats.pendingRepairs} طلبات معلقة تحتاج متابعة</li>
                )}
                {lowStockItems.length > 3 && (
                  <li>• {lowStockItems.length} قطع مخزون منخفض جداً</li>
                )}
                {pendingInvoices.length > 5 && (
                  <li>• {pendingInvoices.length} فواتير غير مدفوعة</li>
                )}
              </ul>
              <div className="mt-4 flex gap-3">
                {stats?.pendingRepairs > 5 && (
                  <button
                    onClick={() => navigate('/repairs?status=pending')}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    عرض الطلبات المعلقة
                  </button>
                )}
                {lowStockItems.length > 3 && (
                  <button
                    onClick={() => navigate('/inventory/stock-alerts')}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    طلب قطع غيار
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {stats?.pendingRepairs === 0 && lowStockItems.length === 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-900">ممتاز! 🎉</h3>
              <p className="text-green-800">
                لا توجد طلبات معلقة وجميع الأنظمة تعمل بشكل طبيعي
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowDashboardPage;
