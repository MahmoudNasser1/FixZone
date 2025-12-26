import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import {
  Download,
  FileDown,
  Calendar,
  DollarSign,
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from 'lucide-react';
import { getDefaultApiBaseUrl } from '../../lib/apiConfig';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { cn } from '../../lib/utils';

const API_BASE_URL = getDefaultApiBaseUrl();

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement
);

const FinancialReportsPage = () => {
  const [profitLossData, setProfitLossData] = useState(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchProfitLossReport = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/reports/profit-loss?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      // Backend returns { success: true, ...data }
      setProfitLossData(data.success ? data : data);
    } catch (error) {
      console.error('Error fetching profit-loss report:', error);
    }
  };

  const fetchMonthlyRevenue = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const months = [];

      for (let month = 1; month <= 12; month++) {
        const response = await fetch(
          `${API_BASE_URL}/reports/monthly-revenue?year=${currentYear}&month=${month}`,
          { credentials: 'include' }
        );
        const data = await response.json();
        // Backend returns { success: true, totalRevenue, ... }
        months.push({
          month: month,
          revenue: data.totalRevenue || 0
        });
      }

      setMonthlyRevenue(months);
    } catch (error) {
      console.error('Error fetching monthly revenue:', error);
    }
  };

  const fetchDailyRevenue = async () => {
    try {
      const days = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const response = await fetch(
          `${API_BASE_URL}/reports/daily-revenue?date=${dateStr}`,
          { credentials: 'include' }
        );
        const data = await response.json();
        // Backend returns { success: true, totalRevenue, ... }
        days.push({
          date: dateStr,
          revenue: data.totalRevenue || 0
        });
      }

      setDailyRevenue(days);
    } catch (error) {
      console.error('Error fetching daily revenue:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/reports/expenses?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      // Backend returns { success: true, expenses: [...] }
      setExpenses(data.expenses || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      await Promise.all([
        fetchProfitLossReport(),
        fetchMonthlyRevenue(),
        fetchDailyRevenue(),
        fetchExpenses()
      ]);
      setLoading(false);
    };

    loadReports();
  }, [dateRange]);

  const exportToPDF = () => {
    // Implementation for PDF export
    console.log('Exporting to PDF...');
  };

  const exportToExcel = () => {
    // Implementation for Excel export
    console.log('Exporting to Excel...');
  };

  const monthlyChartData = {
    labels: monthlyRevenue.map(item => {
      const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      return monthNames[item.month - 1];
    }),
    datasets: [
      {
        label: 'الإيرادات الشهرية',
        data: monthlyRevenue.map(item => item.revenue),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const dailyChartData = {
    labels: dailyRevenue.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'الإيرادات اليومية',
        data: dailyRevenue.map(item => item.revenue),
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'التقارير المالية',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return value.toLocaleString('ar-SA') + ' جنية';
          }
        }
      }
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6 text-right" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">التقارير المالية</h1>
            <p className="text-muted-foreground mt-1">تقارير شاملة للإيرادات والمصروفات والأرباح</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SimpleButton onClick={exportToPDF} variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
              <Download className="w-4 h-4 ml-2" />
              تصدير PDF
            </SimpleButton>
            <SimpleButton onClick={exportToExcel} className="bg-success hover:bg-success/90 text-white">
              <FileDown className="w-4 h-4 ml-2" />
              تصدير Excel
            </SimpleButton>
          </div>
        </div>

        {/* Filters */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              فلترة الفترة الزمنية
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground mr-1">تاريخ البداية</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="w-full bg-muted border-border rounded-lg p-2.5 text-foreground focus:ring-2 focus:ring-primary shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground mr-1">تاريخ النهاية</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="w-full bg-muted border-border rounded-lg p-2.5 text-foreground focus:ring-2 focus:ring-primary shadow-sm"
                />
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* Profit & Loss Summary */}
        {profitLossData && (
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-success" />
                ملخص الأرباح والخسائر
              </SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-success/5 rounded-lg p-6 border border-success/10 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-success">إجمالي الإيرادات</p>
                    <div className="p-2 bg-success/10 rounded-full">
                      <TrendingUp className="w-4 h-4 text-success" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    {profitLossData.totalRevenue?.toLocaleString('ar-SA')} ج.م
                  </h3>
                </div>

                <div className="bg-destructive/5 rounded-lg p-6 border border-destructive/10 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-destructive">إجمالي المصروفات</p>
                    <div className="p-2 bg-destructive/10 rounded-full">
                      <TrendingDown className="w-4 h-4 text-destructive" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    {profitLossData.totalExpenses?.toLocaleString('ar-SA')} ج.م
                  </h3>
                </div>

                <div className={cn(
                  "rounded-lg p-6 border shadow-sm transition-all hover:shadow-md",
                  profitLossData.profit >= 0
                    ? "bg-primary/5 border-primary/10"
                    : "bg-danger/5 border-danger/10"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <p className={cn(
                      "text-sm font-medium",
                      profitLossData.profit >= 0 ? "text-primary" : "text-danger"
                    )}>
                      صافي الربح/الخسارة
                    </p>
                    <div className={cn(
                      "p-2 rounded-full",
                      profitLossData.profit >= 0 ? "bg-primary/10" : "bg-danger/10"
                    )}>
                      {profitLossData.profit >= 0 ? <TrendingUp className="w-4 h-4 text-primary" /> : <TrendingDown className="w-4 h-4 text-danger" />}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    {profitLossData.profit?.toLocaleString('ar-SA')} ج.م
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      profitLossData.profit >= 0 ? "bg-primary/10 text-primary" : "bg-danger/10 text-danger"
                    )}>
                      هامش الربح: {profitLossData.profitMargin?.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                الإيرادات الشهرية
              </SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="h-[300px]">
                <Bar data={monthlyChartData} options={chartOptions} />
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                الإيرادات اليومية (آخر 7 أيام)
              </SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="h-[300px]">
                <Line data={dailyChartData} options={chartOptions} />
              </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>

        {/* Expenses Breakdown */}
        {expenses.length > 0 && (
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle className="text-lg flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                توزيع المصروفات حسب الفئة
              </SimpleCardTitle>
            </SimpleCardHeader>
            <div className="overflow-hidden border-t border-border">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-6 py-4 text-sm font-bold text-muted-foreground">الفئة</th>
                    <th className="px-6 py-4 text-sm font-bold text-muted-foreground text-center">عدد المصروفات</th>
                    <th className="px-6 py-4 text-sm font-bold text-muted-foreground">إجمالي المبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expenses.map((expense, index) => (
                    <tr key={index} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          {expense.category}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-muted-foreground">
                        {expense.expenseCount}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-foreground">
                        {expense.totalAmount?.toLocaleString('ar-SA')} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SimpleCard>
        )}
      </div>
    </div>
  );
};

export default FinancialReportsPage;

