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

const WorkflowDashboardPage = () => {
  const navigate = useNavigate();
  const { formatMoney } = useSettings();
  const [stats, setStats] = useState(null);
  const [recentRepairs, setRecentRepairs] = useState([]);
  const [todayStats, setTodayStats] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadAllData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchRecentRepairs(),
      fetchTodayStats(),
      fetchLowStockItems(),
      fetchPendingInvoices(),
      fetchRecentPayments()
    ]);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const [repairsRes, customersRes, inventoryRes] = await Promise.all([
        fetch('http://localhost:3001/api/repairs', { credentials: 'include' }),
        fetch('http://localhost:3001/api/customers', { credentials: 'include' }),
        fetch('http://localhost:3001/api/inventory', { credentials: 'include' })
      ]);

      const repairs = await repairsRes.json();
      const customers = await customersRes.json();
      const inventory = await inventoryRes.json();

      const repairsArray = Array.isArray(repairs) ? repairs : (repairs.data || []);
      const customersArray = Array.isArray(customers) ? customers : (customers.data || []);
      const inventoryArray = Array.isArray(inventory) ? inventory : (inventory.items || inventory.data || []);

      setStats({
        totalRepairs: repairsArray.length,
        pendingRepairs: repairsArray.filter(r => r.status === 'pending').length,
        inProgressRepairs: repairsArray.filter(r => r.status === 'in_progress').length,
        completedRepairs: repairsArray.filter(r => r.status === 'completed').length,
        deliveredRepairs: repairsArray.filter(r => r.status === 'delivered').length,
        totalCustomers: customersArray.length,
        activeCustomers: customersArray.filter(c => c.status === 'active').length,
        totalInventoryItems: inventoryArray.length,
        lowStockCount: inventoryArray.filter(item => 
          item.currentQuantity <= (item.minStockLevel || 0)
        ).length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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
      const response = await fetch('http://localhost:3001/api/repairs?limit=5', { 
        credentials: 'include' 
      });
      const data = await response.json();
      const repairsArray = Array.isArray(data) ? data : (data.data || []);
      setRecentRepairs(repairsArray.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent repairs:', error);
      setRecentRepairs([]);
    }
  };

  const fetchTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`http://localhost:3001/api/reports/daily-revenue?date=${today}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setTodayStats(data);
    } catch (error) {
      console.error('Error fetching today stats:', error);
      setTodayStats({ totalRevenue: 0, paymentCount: 0 });
    }
  };

  const fetchLowStockItems = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/stocklevels/low-stock', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setLowStockItems(Array.isArray(data) ? data.slice(0, 5) : []);
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
      const response = await fetch('http://localhost:3001/api/invoices', {
        credentials: 'include'
      });
      const data = await response.json();
      const invoicesArray = Array.isArray(data) ? data : (data.data || data.invoices || []);
      const pending = invoicesArray.filter(inv => inv.status === 'unpaid' || inv.paymentStatus === 'unpaid');
      setPendingInvoices(pending.slice(0, 5));
    } catch (error) {
      console.error('Error fetching pending invoices:', error);
      setPendingInvoices([]);
    }
  };

  const fetchRecentPayments = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/payments', {
        credentials: 'include'
      });
      const data = await response.json();
      const paymentsArray = Array.isArray(data) ? data : (data.data || data.payments || []);
      setRecentPayments(paymentsArray.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent payments:', error);
      setRecentPayments([]);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with Refresh */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Cog6ToothIcon className="h-10 w-10" />
              لوحة التحكم المتكاملة
            </h1>
            <p className="mt-2 text-blue-100">
              مراقبة شاملة وإجراءات سريعة لجميع العمليات • آخر تحديث: {new Date().toLocaleTimeString('ar-EG')}
            </p>
          </div>
          <button
            onClick={loadAllData}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <ArrowPathIcon className="h-5 w-5" />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BellAlertIcon className="h-6 w-6 text-blue-600" />
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
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-700 mb-1">إجمالي الطلبات</div>
                <div className="text-4xl font-bold text-blue-900">{stats.totalRepairs}</div>
                <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                  نشط اليوم
                </div>
              </div>
              <div className="bg-blue-600 rounded-full p-4">
                <WrenchIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-sm border border-orange-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-orange-700 mb-1">قيد الإصلاح</div>
                <div className="text-4xl font-bold text-orange-900">{stats.inProgressRepairs}</div>
                <div className="text-xs text-orange-600 mt-2">يحتاج متابعة</div>
              </div>
              <div className="bg-orange-600 rounded-full p-4">
                <ClockIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Total Customers */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-green-700 mb-1">العملاء النشطين</div>
                <div className="text-4xl font-bold text-green-900">{stats.activeCustomers}</div>
                <div className="text-xs text-green-600 mt-2">من {stats.totalCustomers} إجمالي</div>
              </div>
              <div className="bg-green-600 rounded-full p-4">
                <UserGroupIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Today Revenue */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-purple-700 mb-1">إيرادات اليوم</div>
                <div className="text-3xl font-bold text-purple-900">
                  {formatMoney(todayStats?.totalRevenue || 0, 'EGP')}
                </div>
                <div className="text-xs text-purple-600 mt-2">
                  {todayStats?.paymentCount || 0} مدفوعات
                </div>
              </div>
              <div className="bg-purple-600 rounded-full p-4">
                <CurrencyDollarIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <ChartBarIcon className="h-6 w-6 text-blue-600" />
          تقدم سير العمل
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'معلق', count: stats?.pendingRepairs || 0, color: 'yellow', icon: ExclamationTriangleIcon },
            { label: 'قيد الإصلاح', count: stats?.inProgressRepairs || 0, color: 'blue', icon: ClockIcon },
            { label: 'مكتمل', count: stats?.completedRepairs || 0, color: 'green', icon: CheckCircleIcon },
            { label: 'تم الاضافة', count: pendingInvoices.length, color: 'purple', icon: DocumentTextIcon },
            { label: 'مسلم', count: stats?.deliveredRepairs || 0, color: 'emerald', icon: CheckCircleIcon }
          ].map((status, idx) => (
            <div key={idx} className="text-center">
              <div className={`bg-${status.color}-100 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-3 border-2 border-${status.color}-200 shadow-sm`}>
                <div>
                  <status.icon className={`h-6 w-6 text-${status.color}-600 mx-auto mb-1`} />
                  <span className={`text-2xl font-bold text-${status.color}-900`}>{status.count}</span>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-700">{status.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Three Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Repairs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <WrenchIcon className="h-5 w-5 text-blue-600" />
              أحدث الطلبات
            </h3>
            <Link to="/repairs" className="text-sm text-blue-600 hover:text-blue-700">
              عرض الكل ←
            </Link>
          </div>
          <div className="space-y-3">
            {recentRepairs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">لا توجد طلبات</p>
            ) : (
              recentRepairs.map((repair) => (
                <Link
                  key={repair.id}
                  to={`/repairs/${repair.id}`}
                  className="block border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 truncate">
                        {repair.customerName || 'عميل غير محدد'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {repair.deviceType || 'غير محدد'}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(repair.status)}`}>
                      {getStatusText(repair.status)}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {new Date(repair.createdAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                    </span>
                    {repair.estimatedCost && (
                      <span className="font-medium text-gray-700">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-purple-600" />
              فواتير معلقة
            </h3>
            <Link to="/invoices" className="text-sm text-purple-600 hover:text-purple-700">
              عرض الكل ←
            </Link>
          </div>
          <div className="space-y-3">
            {pendingInvoices.length === 0 ? (
              <p className="text-gray-500 text-center py-8">لا توجد فواتير معلقة</p>
            ) : (
              pendingInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        فاتورة #{invoice.id}
                      </div>
                      <div className="text-sm text-gray-600">
                        {invoice.customerName || 'عميل غير محدد'}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-gray-900">
                        {formatMoney(invoice.totalAmount || invoice.total || 0, 'EGP')}
                      </div>
                      <div className="text-xs text-red-600">غير مدفوعة</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Recent Payments */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <BanknotesIcon className="h-4 w-4 text-green-600" />
              آخر المدفوعات
            </h4>
            <div className="space-y-2">
              {recentPayments.slice(0, 3).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">فاتورة #{payment.invoiceId}</span>
                  <span className="font-medium text-green-700">
                    {formatMoney(payment.amount, 'EGP')}
                  </span>
                </div>
              ))}
              {recentPayments.length === 0 && (
                <p className="text-gray-400 text-xs">لا توجد مدفوعات اليوم</p>
              )}
            </div>
          </div>
        </div>

        {/* Alerts & Low Stock */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BellAlertIcon className="h-5 w-5 text-red-600" />
              تنبيهات النظام
            </h3>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
              {lowStockItems.length + pendingInvoices.length}
            </span>
          </div>

          {/* Low Stock Alert */}
          {lowStockItems.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2">
                <ArchiveBoxIcon className="h-4 w-4" />
                مخزون منخفض ({lowStockItems.length})
              </h4>
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <div key={item.stockLevelId || item.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">{item.name || item.itemName}</div>
                        <div className="text-xs text-gray-600">{item.sku}</div>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-red-700">{item.quantity}</div>
                        <div className="text-xs text-gray-500">متبقي</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/inventory/stock-alerts"
                className="mt-3 block text-center text-sm text-red-600 hover:text-red-700 font-medium"
              >
                عرض جميع التنبيهات →
              </Link>
            </div>
          )}

          {/* Unpaid Invoices Alert */}
          {pendingInvoices.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-orange-700 mb-3 flex items-center gap-2">
                <DocumentTextIcon className="h-4 w-4" />
                فواتير غير مدفوعة ({pendingInvoices.length})
              </h4>
              <div className="text-sm text-gray-700">
                المبلغ الإجمالي:{' '}
                <span className="font-bold text-orange-700">
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
              <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-600">لا توجد تنبيهات حالياً</p>
              <p className="text-xs text-gray-500 mt-1">النظام يعمل بشكل طبيعي ✨</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            ملخص اليوم
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="text-sm text-blue-700 mb-1">طلبات جديدة</div>
              <div className="text-3xl font-bold text-blue-900">
                {stats?.pendingRepairs || 0}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="text-sm text-green-700 mb-1">طلبات مكتملة</div>
              <div className="text-3xl font-bold text-green-900">
                {stats?.completedRepairs || 0}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <div className="text-sm text-purple-700 mb-1">إيرادات</div>
              <div className="text-xl font-bold text-purple-900">
                {formatMoney(todayStats?.totalRevenue || 0, 'EGP')}
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
              <div className="text-sm text-orange-700 mb-1">مدفوعات</div>
              <div className="text-3xl font-bold text-orange-900">
                {todayStats?.paymentCount || 0}
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Cog6ToothIcon className="h-5 w-5 text-green-600" />
            حالة النظام
          </h3>
          <div className="space-y-4">
            {[
              { label: 'نظام الإصلاحات', status: 'active', count: stats?.totalRepairs || 0 },
              { label: 'إدارة العملاء', status: 'active', count: stats?.totalCustomers || 0 },
              { label: 'المخزون', status: stats?.lowStockCount > 0 ? 'warning' : 'active', count: stats?.totalInventoryItems || 0 },
              { label: 'النظام المالي', status: pendingInvoices.length > 5 ? 'warning' : 'active', count: pendingInvoices.length }
            ].map((system, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    system.status === 'active' ? 'bg-green-500 animate-pulse' : 
                    system.status === 'warning' ? 'bg-yellow-500 animate-pulse' : 
                    'bg-gray-400'
                  }`}></div>
                  <span className="font-medium text-gray-800">{system.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{system.count} عنصر</span>
                  <span className={`text-xs font-bold ${
                    system.status === 'active' ? 'text-green-600' : 
                    system.status === 'warning' ? 'text-yellow-600' : 
                    'text-gray-500'
                  }`}>
                    {system.status === 'active' ? 'نشط' : system.status === 'warning' ? 'تحذير' : 'متوقف'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Performance Indicator */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">الأداء العام</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (stats?.completedRepairs / (stats?.totalRepairs || 1)) * 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-green-700">
                  {Math.round((stats?.completedRepairs / (stats?.totalRepairs || 1)) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Banner */}
      {(stats?.pendingRepairs > 5 || lowStockItems.length > 3) && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border-2 border-red-200 p-6">
          <div className="flex items-start gap-4">
            <div className="bg-red-100 rounded-full p-3">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-2">يحتاج انتباهك!</h3>
              <ul className="space-y-1 text-sm text-red-800">
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
