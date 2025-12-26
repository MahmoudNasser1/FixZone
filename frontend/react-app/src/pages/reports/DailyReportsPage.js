import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  DoughnutController,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Calendar,
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Target,
  Wrench,
  Package,
  Download,
  Filter
} from 'lucide-react';
import { getDefaultApiBaseUrl } from '../../lib/apiConfig';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { cn } from '../../lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  DoughnutController,
  ArcElement
);

const API_BASE_URL = getDefaultApiBaseUrl();

const DailyReportsPage = () => {
  const [dailyData, setDailyData] = useState(null);
  const [repairStats, setRepairStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchDailyRevenue = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/reports/daily-revenue?date=${selectedDate}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      // Backend returns { success: true, totalRevenue, paymentCount, ... }
      setDailyData(data);
    } catch (error) {
      console.error('Error fetching daily revenue:', error);
    }
  };

  const fetchRepairStats = async () => {
    try {
      // Mock data for repair statistics - replace with actual API call
      const mockRepairStats = {
        totalRepairs: 12,
        newRepairs: 3,
        inProgress: 5,
        completed: 4,
        pending: 2,
        averageRepairTime: 2.5,
        totalRevenue: 4500
      };
      setRepairStats(mockRepairStats);
    } catch (error) {
      console.error('Error fetching repair stats:', error);
    }
  };

  useEffect(() => {
    const loadDailyReports = async () => {
      setLoading(true);
      await Promise.all([
        fetchDailyRevenue(),
        fetchRepairStats()
      ]);
      setLoading(false);
    };

    loadDailyReports();
  }, [selectedDate]);

  const revenueChartData = {
    labels: ['الإيرادات اليومية'],
    datasets: [
      {
        label: 'الإيرادات',
        data: [dailyData?.totalRevenue || 0],
        backgroundColor: ['rgba(59, 130, 246, 0.5)'],
        borderColor: ['rgba(59, 130, 246, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const repairStatusData = {
    labels: ['جديد', 'قيد الإصلاح', 'مكتمل', 'معلق'],
    datasets: [
      {
        data: [
          repairStats?.newRepairs || 0,
          repairStats?.inProgress || 0,
          repairStats?.completed || 0,
          repairStats?.pending || 0
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.5)',
          'rgba(59, 130, 246, 0.5)',
          'rgba(16, 185, 129, 0.5)',
          'rgba(245, 158, 11, 0.5)'
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
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

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">التقرير اليومي</h1>
          <p className="text-muted-foreground mt-1">ملخص شامل لأداء وتدفق العمل لليوم</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-card border border-border rounded-lg p-1 shadow-sm">
            <SimpleButton
              variant="ghost"
              size="sm"
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </SimpleButton>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-foreground font-medium px-2 text-center text-sm md:text-base cursor-pointer"
            />
            <SimpleButton
              variant="ghost"
              size="sm"
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </SimpleButton>
          </div>
          <SimpleButton variant="outline" onClick={() => window.print()}>
            <Download className="w-4 h-4 ml-2" />
            تصدير PDF
          </SimpleButton>
        </div>
      </div>


      {/* Revenue Summary */}
      {dailyData && (
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-success" />
              ملخص الإيرادات
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-success/5 rounded-lg p-4 border border-success/10">
                <div className="text-sm font-medium text-success">إجمالي الإيرادات</div>
                <div className="text-2xl font-bold text-foreground">
                  {dailyData.totalRevenue?.toLocaleString('ar-SA')} جنية
                </div>
              </div>
              <div className="bg-blue-500/5 rounded-lg p-4 border border-blue-500/10">
                <div className="text-sm font-medium text-blue-600">عدد المدفوعات</div>
                <div className="text-2xl font-bold text-foreground">
                  {dailyData.paymentCount || 0}
                </div>
              </div>
              <div className="bg-purple-500/5 rounded-lg p-4 border border-purple-500/10">
                <div className="text-sm font-medium text-purple-600">متوسط المدفوعات</div>
                <div className="text-2xl font-bold text-foreground">
                  {dailyData.averagePayment?.toLocaleString('ar-SA')} جنية
                </div>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      )}

      {/* Repair Statistics */}
      {repairStats && (
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              إحصائيات الإصلاحات
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-500/5 rounded-lg p-4 border border-blue-500/10">
                <div className="text-sm font-medium text-blue-600">إجمالي الطلبات</div>
                <div className="text-2xl font-bold text-foreground">
                  {repairStats.totalRepairs}
                </div>
              </div>
              <div className="bg-success/5 rounded-lg p-4 border border-success/10">
                <div className="text-sm font-medium text-success">طلبات جديدة</div>
                <div className="text-2xl font-bold text-foreground">
                  {repairStats.newRepairs}
                </div>
              </div>
              <div className="bg-warning/5 rounded-lg p-4 border border-warning/10">
                <div className="text-sm font-medium text-warning">قيد الإصلاح</div>
                <div className="text-2xl font-bold text-foreground">
                  {repairStats.inProgress}
                </div>
              </div>
              <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/10">
                <div className="text-sm font-medium text-emerald-600">مكتمل</div>
                <div className="text-2xl font-bold text-foreground">
                  {repairStats.completed}
                </div>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle>الإيرادات اليومية</SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <Bar data={revenueChartData} options={chartOptions} />
          </SimpleCardContent>
        </SimpleCard>

        {/* Repair Status Chart */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle>توزيع حالة الإصلاحات</SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <Doughnut data={repairStatusData} options={doughnutOptions} />
          </SimpleCardContent>
        </SimpleCard>
      </div>

      {/* Performance Metrics */}
      {repairStats && (
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              مؤشرات الأداء
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm font-medium text-muted-foreground">متوسط وقت الإصلاح</div>
                <div className="text-xl font-bold text-foreground">
                  {repairStats.averageRepairTime} ساعات
                </div>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm font-medium text-muted-foreground">معدل الإنجاز</div>
                <div className="text-xl font-bold text-foreground">
                  {((repairStats.completed / repairStats.totalRepairs) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      )}

      {/* Alerts */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            تنبيهات اليوم
          </SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-warning/5 border border-warning/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-warning ml-3" />
              <span className="text-warning">يوجد {repairStats?.pending || 0} طلبات إصلاح معلقة</span>
            </div>
            {repairStats?.averageRepairTime > 3 && (
              <div className="flex items-center p-3 bg-orange-500/5 border border-orange-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600 ml-3" />
                <span className="text-orange-900 dark:text-orange-400">متوسط وقت الإصلاح أعلى من المعتاد</span>
              </div>
            )}
          </div>
        </SimpleCardContent>
      </SimpleCard>
    </div>
  );
};

export default DailyReportsPage;

