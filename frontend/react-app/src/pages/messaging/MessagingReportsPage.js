// frontend/react-app/src/pages/messaging/MessagingReportsPage.js
// صفحة تقارير وإحصائيات المراسلة

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import { Input } from '../../components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/Select';
import messagingService from '../../services/messagingService';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import {
  TrendingUp, MessageSquare, Mail, AlertCircle, CheckCircle,
  XCircle, Calendar, Download, RefreshCw, BarChart3, PieChart
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const MessagingReportsPage = () => {
  const notifications = useNotifications();

  // State
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // آخر 30 يوم
    dateTo: new Date().toISOString().split('T')[0], // اليوم
    channel: '',
    entityType: ''
  });

  // Load stats
  useEffect(() => {
    loadStats();
  }, [filters]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const statsData = await messagingService.getStats(filters);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
      notifications.error('فشل في تحميل الإحصائيات', {
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = (format) => {
    // TODO: إضافة تصدير PDF/Excel
    notifications.info('قريباً', {
      message: 'ميزة التصدير قيد التطوير'
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p>لا توجد بيانات متاحة</p>
        </div>
      </div>
    );
  }

  const { summary, byChannel = [], byEntity = [], daily = [], hourly = [], failureReasons = [] } = stats || {};

  // Chart data - القنوات
  const channelChartData = {
    labels: (byChannel || []).map(c => c.channel === 'whatsapp' ? 'واتساب' : c.channel === 'email' ? 'بريد إلكتروني' : c.channel),
    datasets: [
      {
        label: 'مرسل',
        data: (byChannel || []).map(c => c.sent || 0),
        backgroundColor: '#10b981',
      },
      {
        label: 'فاشل',
        data: (byChannel || []).map(c => c.failed || 0),
        backgroundColor: '#ef4444',
      }
    ]
  };

  // Chart data - أنواع الكيانات
  const entityChartData = {
    labels: (byEntity || []).map(e => {
      const labels = {
        invoice: 'فواتير',
        repair: 'طلبات إصلاح',
        quotation: 'عروض سعرية',
        payment: 'مدفوعات'
      };
      return labels[e.entityType] || e.entityType;
    }),
    datasets: [
      {
        label: 'مرسل',
        data: (byEntity || []).map(e => e.sent || 0),
        backgroundColor: '#3b82f6',
      },
      {
        label: 'فاشل',
        data: (byEntity || []).map(e => e.failed || 0),
        backgroundColor: '#ef4444',
      }
    ]
  };

  // Chart data - يومي
  const dailyChartData = {
    labels: (daily || []).slice().reverse().map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'مرسل',
        data: (daily || []).slice().reverse().map(d => d.sent || 0),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      },
      {
        label: 'فاشل',
        data: (daily || []).slice().reverse().map(d => d.failed || 0),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4
      }
    ]
  };

  // Chart data - Doughnut للقنوات
  const channelDoughnutData = {
    labels: (byChannel || []).map(c => c.channel === 'whatsapp' ? 'واتساب' : c.channel === 'email' ? 'بريد إلكتروني' : c.channel),
    datasets: [
      {
        data: (byChannel || []).map(c => c.total || 0),
        backgroundColor: [
          '#10b981', // WhatsApp - أخضر
          '#3b82f6', // Email - أزرق
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        rtl: true
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        rtl: true
      }
    }
  };

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">تقارير وإحصائيات المراسلة</h1>
            <p className="text-gray-600 mt-1">متابعة شاملة لأداء المراسلة والإشعارات</p>
          </div>
          <div className="flex gap-2">
            <SimpleButton
              variant="outline"
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تصدير PDF
            </SimpleButton>
            <SimpleButton
              variant="outline"
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تصدير Excel
            </SimpleButton>
            <SimpleButton
              variant="outline"
              onClick={loadStats}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث
            </SimpleButton>
          </div>
        </div>

        {/* Filters */}
        <SimpleCard>
          <SimpleCardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  من تاريخ
                </label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  إلى تاريخ
                </label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  القناة
                </label>
                <Select value={filters.channel} onValueChange={(value) => handleFilterChange('channel', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع القنوات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">جميع القنوات</SelectItem>
                    <SelectItem value="whatsapp">واتساب</SelectItem>
                    <SelectItem value="email">بريد إلكتروني</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع الكيان
                </label>
                <Select value={filters.entityType} onValueChange={(value) => handleFilterChange('entityType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الأنواع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">جميع الأنواع</SelectItem>
                    <SelectItem value="invoice">فواتير</SelectItem>
                    <SelectItem value="repair">طلبات إصلاح</SelectItem>
                    <SelectItem value="quotation">عروض سعرية</SelectItem>
                    <SelectItem value="payment">مدفوعات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">إجمالي الرسائل</p>
                <p className="text-2xl font-bold text-foreground">{(summary?.total || 0).toLocaleString()}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">مرسل</p>
                <p className="text-2xl font-bold text-green-600">{(summary?.sent || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{summary?.successRate || 0}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">فاشل</p>
                <p className="text-2xl font-bold text-red-600">{(summary?.failed || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{summary?.failureRate || 0}%</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">معدل النجاح</p>
                <p className="text-2xl font-bold text-blue-600">{summary?.successRate || 0}%</p>
                <p className="text-xs text-muted-foreground/60 mt-1">من إجمالي المحاولات</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* القنوات - Bar Chart */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              الإحصائيات حسب القناة
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div style={{ height: '300px' }}>
              <Bar data={channelChartData} options={chartOptions} />
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* القنوات - Doughnut Chart */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              التوزيع حسب القناة
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div style={{ height: '300px' }}>
              <Doughnut data={channelDoughnutData} options={doughnutOptions} />
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* أنواع الكيانات */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              الإحصائيات حسب نوع الكيان
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div style={{ height: '300px' }}>
              <Bar data={entityChartData} options={chartOptions} />
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* الإحصائيات اليومية */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              الإحصائيات اليومية (آخر 30 يوم)
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div style={{ height: '300px' }}>
              <Line data={dailyChartData} options={chartOptions} />
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>

      {/* Failure Reasons */}
      {failureReasons && failureReasons.length > 0 && (
        <SimpleCard className="mb-6">
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              أسباب الفشل (أكثر 10)
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="space-y-2">
              {failureReasons.map((reason, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-foreground flex-1">Reason: {reason.reason}</p>
                  <span className="text-sm font-semibold text-red-600">{reason.count}</span>
                </div>
              ))}
            </div>
          </SimpleCardContent>
        </SimpleCard>
      )}

      {/* Detailed Stats Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* إحصائيات القنوات */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle>تفاصيل القنوات</SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-2">القناة</th>
                    <th className="text-right p-2">إجمالي</th>
                    <th className="text-right p-2">مرسل</th>
                    <th className="text-right p-2">فاشل</th>
                    <th className="text-right p-2">معدل النجاح</th>
                  </tr>
                </thead>
                <tbody>
                  {(byChannel || []).map((channel, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">
                        {channel.channel === 'whatsapp' ? 'واتساب' : channel.channel === 'email' ? 'بريد إلكتروني' : channel.channel}
                      </td>
                      <td className="p-2">{channel.total}</td>
                      <td className="p-2 text-green-600">{channel.sent}</td>
                      <td className="p-2 text-red-600">{channel.failed}</td>
                      <td className="p-2">{channel.successRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* إحصائيات أنواع الكيانات */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle>تفاصيل أنواع الكيانات</SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-2">النوع</th>
                    <th className="text-right p-2">إجمالي</th>
                    <th className="text-right p-2">مرسل</th>
                    <th className="text-right p-2">فاشل</th>
                    <th className="text-right p-2">معدل النجاح</th>
                  </tr>
                </thead>
                <tbody>
                  {(byEntity || []).map((entity, index) => {
                    const labels = {
                      invoice: 'فواتير',
                      repair: 'طلبات إصلاح',
                      quotation: 'عروض سعرية',
                      payment: 'مدفوعات'
                    };
                    return (
                      <tr key={index} className="border-b">
                        <td className="p-2">{labels[entity.entityType] || entity.entityType}</td>
                        <td className="p-2">{entity.total}</td>
                        <td className="p-2 text-green-600">{entity.sent}</td>
                        <td className="p-2 text-red-600">{entity.failed}</td>
                        <td className="p-2">{entity.successRate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>
    </div>
  );
};

export default MessagingReportsPage;

