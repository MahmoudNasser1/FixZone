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
import messagingService from '../../services/messagingService';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import { cn } from '../../lib/utils';
import {
  TrendingUp, MessageSquare, Mail, AlertCircle, CheckCircle,
  XCircle, Calendar, Download, RefreshCw, BarChart3, PieChart,
  Search, ExternalLink, Filter, ChevronLeft, Send, AlertTriangle
} from 'lucide-react';

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

  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        rtl: true,
        labels: {
          color: 'oklch(var(--muted-foreground))',
          font: { size: 12, weight: '500' },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        rtl: true,
        backgroundColor: 'oklch(var(--card))',
        titleColor: 'oklch(var(--foreground))',
        bodyColor: 'oklch(var(--muted-foreground))',
        borderColor: 'oklch(var(--border))',
        borderWidth: 1,
        padding: 12,
        boxPadding: 8,
        usePointStyle: true
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          color: 'oklch(var(--border) / 0.1)'
        },
        ticks: {
          color: 'oklch(var(--muted-foreground))',
          font: { size: 11 }
        }
      },
      y: {
        grid: {
          color: 'oklch(var(--border) / 0.1)',
          drawBorder: false
        },
        ticks: {
          color: 'oklch(var(--muted-foreground))',
          font: { size: 11 },
          padding: 8
        },
        beginAtZero: true
      }
    }
  };

  const doughnutOptions = {
    ...commonChartOptions,
    scales: undefined, // Doughnut doesn't use scales
    cutout: '70%',
    plugins: {
      ...commonChartOptions.plugins,
      legend: {
        ...commonChartOptions.plugins.legend,
        position: 'bottom'
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6 text-right" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-primary/10 rounded-2xl">
              <MessageSquare className="w-9 h-9 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">تقارير المراسلة</h1>
              <p className="text-muted-foreground mt-1">رؤية تحليلية شاملة لنظام الإشعارات والتواصل</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SimpleButton variant="outline" onClick={() => handleExport('pdf')} className="gap-2">
              <Download className="w-4 h-4" />
              تصدير PDF
            </SimpleButton>
            <SimpleButton variant="outline" onClick={() => handleExport('excel')} className="gap-2">
              <Download className="w-4 h-4" />
              تصدير Excel
            </SimpleButton>
            <SimpleButton onClick={loadStats} className="gap-2 shadow-lg shadow-primary/20">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              تحديث البيانات
            </SimpleButton>
          </div>
        </div>

        {/* Filters Card */}
        <SimpleCard className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <SimpleCardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  من تاريخ
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full bg-muted border-border text-foreground rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  إلى تاريخ
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full bg-muted border-border text-foreground rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Filter className="w-4 h-4 text-primary" />
                  القناة
                </label>
                <select
                  value={filters.channel}
                  onChange={(e) => handleFilterChange('channel', e.target.value)}
                  className="w-full bg-muted border-border text-foreground rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                >
                  <option value="">جميع القنوات</option>
                  <option value="whatsapp">واتساب</option>
                  <option value="email">بريد إلكتروني</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  نوع الكيان
                </label>
                <select
                  value={filters.entityType}
                  onChange={(e) => handleFilterChange('entityType', e.target.value)}
                  className="w-full bg-muted border-border text-foreground rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                >
                  <option value="">جميع الأنواع</option>
                  <option value="invoice">فواتير</option>
                  <option value="repair">طلبات إصلاح</option>
                  <option value="quotation">عروض سعرية</option>
                  <option value="payment">مدفوعات</option>
                </select>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* Summary Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الرسائل', value: summary?.total, icon: Send, color: 'primary', suffix: '' },
            { label: 'رسائل ناجحة', value: summary?.sent, icon: CheckCircle, color: 'success', suffix: `${summary?.successRate || 0}%` },
            { label: 'رسائل فاشلة', value: summary?.failed, icon: AlertTriangle, color: 'destructive', suffix: `${summary?.failureRate || 0}%` },
            { label: 'معدل الوصول', value: summary?.successRate, icon: TrendingUp, color: 'info', suffix: '%' },
          ].map((item, idx) => (
            <SimpleCard key={idx} className="overflow-hidden border-none shadow-sm hover:translate-y-[-2px] transition-all duration-300">
              <SimpleCardContent className="p-6 flex items-center gap-5">
                <div className={cn("p-4 rounded-2xl", `bg-${item.color}/10`, `text-${item.color}`)}>
                  <item.icon className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-bold text-foreground">
                      {(item.value || 0).toLocaleString()}
                      {item.color === 'info' && '%'}
                    </span>
                    {item.suffix && item.color !== 'info' && (
                      <SimpleBadge variant={item.color === 'success' ? 'success' : 'destructive'} className="text-[10px] py-0">
                        {item.suffix}
                      </SimpleBadge>
                    )}
                  </div>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Trends Line Chart */}
          <SimpleCard className="lg:col-span-2 border-none shadow-md overflow-hidden">
            <SimpleCardHeader className="bg-muted/30 border-b border-border/50">
              <div className="flex items-center justify-between">
                <SimpleCardTitle className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  تحليل الاتجاه اليومي (آخر 30 يوم)
                </SimpleCardTitle>
              </div>
            </SimpleCardHeader>
            <SimpleCardContent className="p-6">
              <div className="h-[350px]">
                <Line data={dailyChartData} options={commonChartOptions} />
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Channels Bar Chart */}
          <SimpleCard className="border-none shadow-md overflow-hidden">
            <SimpleCardHeader className="bg-muted/30 border-b border-border/50">
              <SimpleCardTitle className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-primary" />
                أداء القنوات المتاحة
              </SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent className="p-6">
              <div className="h-[300px]">
                <Bar data={channelChartData} options={commonChartOptions} />
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Channels Distribution Doughnut */}
          <SimpleCard className="border-none shadow-md overflow-hidden">
            <SimpleCardHeader className="bg-muted/30 border-b border-border/50">
              <SimpleCardTitle className="flex items-center gap-3">
                <PieChart className="w-5 h-5 text-primary" />
                توزيع حجم التراسل حسب القناة
              </SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent className="p-6">
              <div className="h-[300px]">
                <Doughnut data={channelDoughnutData} options={doughnutOptions} />
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Entity Type Bar Chart */}
          <SimpleCard className="lg:col-span-2 border-none shadow-md overflow-hidden">
            <SimpleCardHeader className="bg-muted/30 border-b border-border/50">
              <SimpleCardTitle className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                توزيع الإشعارات حسب نوع المعاملة
              </SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent className="p-6">
              <div className="h-[350px]">
                <Bar data={entityChartData} options={commonChartOptions} />
              </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>

        {/* Failure Reasons Section */}
        {failureReasons && failureReasons.length > 0 && (
          <SimpleCard className="border-none shadow-lg border-t-4 border-t-destructive overflow-hidden">
            <SimpleCardHeader className="bg-destructive/5">
              <SimpleCardTitle className="flex items-center gap-3 text-destructive">
                <AlertCircle className="w-6 h-6" />
                أبرز أسباب فشل الإرسال (Top 10)
              </SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {failureReasons.map((reason, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-destructive/5 rounded-2xl border border-destructive/10 hover:bg-destructive/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center text-[10px] font-bold text-destructive">
                        {index + 1}
                      </div>
                      <p className="text-sm font-semibold text-foreground truncate max-w-[200px] md:max-w-xs" title={reason.reason}>
                        {reason.reason}
                      </p>
                    </div>
                    <SimpleBadge variant="destructive">{reason.count}</SimpleBadge>
                  </div>
                ))}
              </div>
            </SimpleCardContent>
          </SimpleCard>
        )}

        {/* Detailed Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
          {/* Detailed Channels Table */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1.5 h-6 bg-primary rounded-full"></div>
              <h3 className="text-xl font-bold text-foreground">تحليل القنوات التفصيلي</h3>
            </div>
            <SimpleCard className="border-none shadow-sm overflow-hidden">
              <SimpleCardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-bold">القناة</th>
                        <th className="px-6 py-4 font-bold">إجمالي الرسائل</th>
                        <th className="px-6 py-4 font-bold">ناجحة</th>
                        <th className="px-6 py-4 font-bold">فاشلة</th>
                        <th className="px-6 py-4 font-bold text-left">معدل النجاح</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(byChannel || []).map((channel, index) => (
                        <tr key={index} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-6 py-4 font-semibold text-foreground flex items-center gap-3">
                            <div className={cn("w-2 h-2 rounded-full", channel.channel === 'whatsapp' ? 'bg-success' : 'bg-primary')}></div>
                            {channel.channel === 'whatsapp' ? 'واتساب' : channel.channel === 'email' ? 'بريد إلكتروني' : channel.channel}
                          </td>
                          <td className="px-6 py-4 text-foreground">{(channel.total || 0).toLocaleString()}</td>
                          <td className="px-6 py-4 text-success font-medium">{(channel.sent || 0).toLocaleString()}</td>
                          <td className="px-6 py-4 text-destructive font-medium">{(channel.failed || 0).toLocaleString()}</td>
                          <td className="px-6 py-4 text-left">
                            <SimpleBadge variant={channel.successRate >= 90 ? 'success' : channel.successRate >= 70 ? 'warning' : 'destructive'}>
                              {channel.successRate}%
                            </SimpleBadge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          </div>

          {/* Detailed Entities Table */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1.5 h-6 bg-primary rounded-full"></div>
              <h3 className="text-xl font-bold text-foreground">تحليل المعاملات التفصيلي</h3>
            </div>
            <SimpleCard className="border-none shadow-sm overflow-hidden">
              <SimpleCardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-bold">نوع المعاملة</th>
                        <th className="px-6 py-4 font-bold">إجمالي</th>
                        <th className="px-6 py-4 font-bold">ناجحة</th>
                        <th className="px-6 py-4 font-bold text-left">معدل النجاح</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(byEntity || []).map((entity, index) => {
                        const labels = {
                          invoice: 'فواتير',
                          repair: 'طلبات إصلاح',
                          quotation: 'عروض سعرية',
                          payment: 'مدفوعات'
                        };
                        return (
                          <tr key={index} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 font-semibold text-foreground">
                              {labels[entity.entityType] || entity.entityType}
                            </td>
                            <td className="px-6 py-4 text-foreground">{(entity.total || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-success font-medium">{(entity.sent || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-left">
                              <SimpleBadge variant="outline" className="border-primary/20 text-primary bg-primary/5">
                                {entity.successRate}%
                              </SimpleBadge>
                            </td>
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
      </div>
    </div>
  );
};

export default MessagingReportsPage;

