import React, { useState, useEffect } from 'react';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { cn } from '../../lib/utils';
import {
  TrendingUp,
  Package,
  FileText,
  Calendar,
  Filter,
  BarChart3,
  Search,
  ChevronLeft,
  ArrowRight,
  ClipboardList,
  Wrench,
  Boxes,
  Layers,
  Info,
  RefreshCw,
  Archive
} from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import apiService from '../../services/apiService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorHandler from '../../components/common/ErrorHandler';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const PartsUsageReportPage = () => {
  const [partsUsage, setPartsUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // جلب بيانات PartsUsed
      const response = await apiService.request(`/partsused?startDate=${startDate}&endDate=${endDate}`);
      const partsData = response || [];

      // معالجة البيانات
      const processed = processPartsUsage(partsData);
      setPartsUsage(processed.items);
      setStats(processed.stats);

    } catch (err) {
      setError(err.message || 'حدث خطأ في تحميل البيانات');
      console.error('Error loading parts usage:', err);
    } finally {
      setLoading(false);
    }
  };

  const processPartsUsage = (data) => {
    // تجميع البيانات حسب الصنف
    const itemsMap = new Map();

    data.forEach(usage => {
      const key = usage.inventoryItemId;
      if (!itemsMap.has(key)) {
        itemsMap.set(key, {
          id: usage.inventoryItemId,
          name: usage.itemName || 'غير معروف',
          sku: usage.itemSku || '-',
          totalQuantity: 0,
          usageCount: 0,
          repairsCount: new Set()
        });
      }

      const item = itemsMap.get(key);
      item.totalQuantity += parseInt(usage.quantity || 0);
      item.usageCount += 1;
      if (usage.repairRequestId) {
        item.repairsCount.add(usage.repairRequestId);
      }
    });

    // تحويل Map إلى Array
    const items = Array.from(itemsMap.values()).map(item => ({
      ...item,
      repairsCount: item.repairsCount.size
    })).sort((a, b) => b.totalQuantity - a.totalQuantity);

    // حساب الإحصائيات
    const stats = {
      totalParts: data.length,
      uniqueItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.totalQuantity, 0),
      totalRepairs: new Set(data.map(d => d.repairRequestId)).size
    };

    return { items, stats };
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    const today = new Date();

    switch (newPeriod) {
      case 'week':
        setStartDate(format(subDays(today, 7), 'yyyy-MM-dd'));
        break;
      case 'month':
        setStartDate(format(subMonths(today, 1), 'yyyy-MM-dd'));
        break;
      case '3months':
        setStartDate(format(subMonths(today, 3), 'yyyy-MM-dd'));
        break;
      case '6months':
        setStartDate(format(subMonths(today, 6), 'yyyy-MM-dd'));
        break;
      default:
        break;
    }
    setEndDate(format(today, 'yyyy-MM-dd'));
  };

  if (loading && partsUsage.length === 0) {
    return <LoadingSpinner message="جاري تحميل التقرير..." />;
  }

  if (error) {
    return <ErrorHandler message={error} onRetry={loadData} />;
  }

  // بيانات الرسم البياني - أعلى 10 أصناف
  const chartData = {
    labels: partsUsage.slice(0, 10).map(item =>
      item.name.substring(0, 20) + (item.name.length > 20 ? '...' : '')
    ),
    datasets: [
      {
        label: 'الكمية',
        data: partsUsage.slice(0, 10).map(item => item.totalQuantity),
        backgroundColor: '#8884d8',
      },
      {
        label: 'عدد الصيانات',
        data: partsUsage.slice(0, 10).map(item => item.repairsCount),
        backgroundColor: '#82ca9d',
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
          font: { size: 11 },
          maxRotation: 45,
          minRotation: 45
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6 text-right" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-primary/10 rounded-2xl">
              <Archive className="w-9 h-9 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">تقرير استهلاك القطع</h1>
              <p className="text-muted-foreground mt-1">تحليل حركة واستهلاك قطع الغيار في أعمال الصيانة</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SimpleButton onClick={loadData} className="gap-2 shadow-lg shadow-primary/20">
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
                  الفترة الزمنية
                </label>
                <select
                  value={period}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  className="w-full bg-muted border-border text-foreground rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                >
                  <option value="week">آخر أسبوع</option>
                  <option value="month">آخر شهر</option>
                  <option value="3months">آخر 3 أشهر</option>
                  <option value="6months">آخر 6 أشهر</option>
                  <option value="custom">فترة مخصصة</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  من تاريخ
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
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
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-muted border-border text-foreground rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
              <SimpleButton onClick={loadData} variant="outline" className="w-full h-[46px] gap-2">
                <Filter className="w-4 h-4" />
                تطبيق الفلاتر
              </SimpleButton>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'إجمالي الاستخدامات', value: stats.totalParts, icon: ClipboardList, color: 'primary' },
              { label: 'الأصناف الفريدة', value: stats.uniqueItems, icon: Boxes, color: 'info' },
              { label: 'الكمية الإجمالية', value: stats.totalQuantity, icon: Layers, color: 'success' },
              { label: 'تذاكر الصيانة', value: stats.totalRepairs, icon: Wrench, color: 'warning' },
            ].map((item, idx) => (
              <SimpleCard key={idx} className="overflow-hidden border-none shadow-sm hover:translate-y-[-2px] transition-all duration-300">
                <SimpleCardContent className="p-6 flex items-center gap-5">
                  <div className={cn("p-4 rounded-2xl", `bg-${item.color}/10`, `text-${item.color}`)}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-0.5">{(item.value || 0).toLocaleString()}</p>
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            ))}
          </div>
        )}

        {/* Charts & Table Section */}
        <div className="grid grid-cols-1 gap-8">
          {/* Main Usage Chart */}
          {partsUsage.length > 0 && (
            <SimpleCard className="border-none shadow-md overflow-hidden">
              <SimpleCardHeader className="bg-muted/30 border-b border-border/50">
                <SimpleCardTitle className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  أكثر 10 أصناف استهلاكاً
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent className="p-6">
                <div className="h-[400px]">
                  <Bar data={chartData} options={commonChartOptions} />
                </div>
              </SimpleCardContent>
            </SimpleCard>
          )}

          {/* Detailed Usage Table */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1.5 h-6 bg-primary rounded-full"></div>
              <h3 className="text-xl font-bold text-foreground">تفاصيل استهلاك القطع</h3>
            </div>
            <SimpleCard className="border-none shadow-sm overflow-hidden">
              <SimpleCardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-bold">#</th>
                        <th className="px-6 py-4 font-bold">اسم الصنف</th>
                        <th className="px-6 py-4 font-bold">SKU / الرقم التعريفي</th>
                        <th className="px-6 py-4 font-bold">الكمية المستهلكة</th>
                        <th className="px-6 py-4 font-bold">عدد الاستخدامات</th>
                        <th className="px-6 py-4 font-bold text-left">عدد التذاكر</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {partsUsage.map((item, index) => (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 text-muted-foreground font-mono">{index + 1}</td>
                          <td className="px-6 py-4 font-semibold text-foreground">{item.name}</td>
                          <td className="px-6 py-4">
                            <SimpleBadge variant="outline" className="font-mono text-[10px]">{item.sku}</SimpleBadge>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-primary font-bold">{item.totalQuantity}</span>
                          </td>
                          <td className="px-6 py-4 text-foreground">{item.usageCount}</td>
                          <td className="px-6 py-4 text-left">
                            <SimpleBadge variant="secondary" className="bg-muted text-foreground">
                              {item.repairsCount} تذكرة
                            </SimpleBadge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SimpleCardContent>
            </SimpleCard>

            {partsUsage.length === 0 && !loading && (
              <SimpleCard className="border-dashed border-2 bg-transparent">
                <SimpleCardContent className="py-20 text-center">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <Package className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">لا توجد بيانات استهلاك</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto text-sm leading-relaxed">
                    لا توجد سجلات لاستهلاك قطع الغيار خلال الفترة الزمنية المحددة.
                  </p>
                </SimpleCardContent>
              </SimpleCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartsUsageReportPage;
