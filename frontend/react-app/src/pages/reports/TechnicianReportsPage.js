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
  Users,
  Clock,
  Star,
  BarChart3,
  Calendar,
  TrendingUp,
  Award,
  Filter,
  CheckCircle,
  Activity,
  Download
} from 'lucide-react';
import { getDefaultApiBaseUrl } from '../../lib/apiConfig';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { cn } from '../../lib/utils';
import SimpleBadge from '../../components/ui/SimpleBadge';

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

const TechnicianReportsPage = () => {
  const [technicianData, setTechnicianData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchTechnicianPerformance = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/reports/technician-performance?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      // Backend returns { success: true, technicians: [...] }
      setTechnicianData(data.technicians || []);
    } catch (error) {
      console.error('Error fetching technician performance:', error);
      // Mock data for demonstration
      setTechnicianData([
        {
          technicianName: 'أحمد محمد',
          totalRepairs: 25,
          completedRepairs: 22,
          averageRepairTime: 2.5,
          totalRevenue: 12500
        },
        {
          technicianName: 'سارة أحمد',
          totalRepairs: 20,
          completedRepairs: 18,
          averageRepairTime: 3.2,
          totalRevenue: 9800
        },
        {
          technicianName: 'محمد علي',
          totalRepairs: 18,
          completedRepairs: 16,
          averageRepairTime: 2.8,
          totalRevenue: 8700
        }
      ]);
    }
  };

  useEffect(() => {
    const loadTechnicianReports = async () => {
      setLoading(true);
      await fetchTechnicianPerformance();
      setLoading(false);
    };

    loadTechnicianReports();
  }, [dateRange]);

  const performanceChartData = {
    labels: technicianData.map(tech => tech.technicianName),
    datasets: [
      {
        label: 'إجمالي الإصلاحات',
        data: technicianData.map(tech => tech.totalRepairs),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'الإصلاحات المكتملة',
        data: technicianData.map(tech => tech.completedRepairs),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
    ],
  };

  const revenueChartData = {
    labels: technicianData.map(tech => tech.technicianName),
    datasets: [
      {
        label: 'الإيرادات',
        data: technicianData.map(tech => tech.totalRevenue),
        backgroundColor: 'rgba(168, 85, 247, 0.5)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 1,
      },
    ],
  };

  const timeChartData = {
    labels: technicianData.map(tech => tech.technicianName),
    datasets: [
      {
        label: 'متوسط وقت الإصلاح (ساعات)',
        data: technicianData.map(tech => tech.averageRepairTime),
        borderColor: 'rgba(245, 158, 11, 1)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
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
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };

  const revenueChartOptions = {
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6 text-right" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">تقارير أداء الفنيين</h1>
            <p className="text-muted-foreground mt-1">تحليل شامل لإنتاجية وجودة عمل الفريق</p>
          </div>
          <div className="flex items-center gap-3">
            <SimpleButton variant="outline" onClick={() => window.print()}>
              <Download className="w-4 h-4 ml-2" />
              تصدير التقرير
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

        {/* Performance Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SimpleCard>
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي الفنيين</p>
                  <h3 className="text-2xl font-bold text-foreground mt-1">{technicianData.length}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي الإصلاحات</p>
                  <h3 className="text-2xl font-bold text-foreground mt-1">
                    {technicianData.reduce((sum, tech) => sum + tech.totalRepairs, 0)}
                  </h3>
                </div>
                <div className="p-3 bg-success/10 rounded-full">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">متوسط الوقت</p>
                  <h3 className="text-2xl font-bold text-foreground mt-1">
                    {(technicianData.reduce((sum, tech) => sum + tech.averageRepairTime, 0) / (technicianData.length || 1)).toFixed(1)} س
                  </h3>
                </div>
                <div className="p-3 bg-warning/10 rounded-full">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</p>
                  <h3 className="text-2xl font-bold text-foreground mt-1">
                    {technicianData.reduce((sum, tech) => sum + tech.totalRevenue, 0).toLocaleString('ar-SA')} ج.م
                  </h3>
                </div>
                <div className="p-3 bg-secondary/10 rounded-full">
                  <TrendingUp className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>

        {/* Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                مقارنة أداء الفنيين
              </SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="h-[300px]">
                <Bar data={performanceChartData} options={chartOptions} />
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-warning" />
                متوسط وقت الإصلاح
              </SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="h-[300px]">
                <Line data={timeChartData} options={chartOptions} />
              </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>

        {/* Detailed Table */}
        <SimpleCard>
          <SimpleCardHeader>
            <div className="flex items-center justify-between">
              <SimpleCardTitle className="text-lg">تفاصيل أداء الفريق</SimpleCardTitle>
              <SimpleBadge variant="outline">{technicianData.length} فنيين</SimpleBadge>
            </div>
          </SimpleCardHeader>
          <div className="overflow-x-auto border-t border-border">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-6 py-4 text-sm font-bold text-muted-foreground">الفني</th>
                  <th className="px-6 py-4 text-sm font-bold text-muted-foreground text-center">الإصلاحات</th>
                  <th className="px-6 py-4 text-sm font-bold text-muted-foreground text-center">المكتملة</th>
                  <th className="px-6 py-4 text-sm font-bold text-muted-foreground text-center">معدل الإنجاز</th>
                  <th className="px-6 py-4 text-sm font-bold text-muted-foreground text-center">المتوسط</th>
                  <th className="px-6 py-4 text-sm font-bold text-muted-foreground">الإيرادات</th>
                  <th className="px-6 py-4 text-sm font-bold text-muted-foreground">التقييم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {technicianData.map((tech, index) => {
                  const completionRate = (tech.completedRepairs / (tech.totalRepairs || 1)) * 100;
                  const rating = completionRate >= 90 ? 5 : completionRate >= 80 ? 4 : completionRate >= 70 ? 3 : 2;

                  return (
                    <tr key={index} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{tech.technicianName}</div>
                      </td>
                      <td className="px-6 py-4 text-center text-muted-foreground">{tech.totalRepairs}</td>
                      <td className="px-6 py-4 text-center text-muted-foreground">{tech.completedRepairs}</td>
                      <td className="px-6 py-4 text-center">
                        <SimpleBadge
                          variant={completionRate >= 90 ? 'success' : completionRate >= 75 ? 'primary' : 'warning'}
                        >
                          {completionRate.toFixed(1)}%
                        </SimpleBadge>
                      </td>
                      <td className="px-6 py-4 text-center text-muted-foreground">{tech.averageRepairTime} س</td>
                      <td className="px-6 py-4 font-bold text-foreground">
                        {tech.totalRevenue?.toLocaleString('ar-SA')} ج.م
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "w-3.5 h-3.5",
                                i < rating ? "text-warning fill-warning" : "text-muted-foreground/30"
                              )}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SimpleCard>

        {/* Top Performers Section */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-warning" />
              نجوم الفريق
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {technicianData
                .sort((a, b) => b.completedRepairs - a.completedRepairs)
                .slice(0, 3)
                .map((tech, index) => (
                  <div key={index} className={cn(
                    "rounded-xl p-5 border flex items-center gap-4 transition-all hover:scale-[1.02]",
                    index === 0 ? "bg-primary/10 border-primary/20" : "bg-card border-border"
                  )}>
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold bg-background shadow-sm",
                      index === 0 ? "text-primary border-primary/20" : "text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{tech.technicianName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <CheckCircle className="w-3 h-3 text-success" />
                        {tech.completedRepairs} إصلاح مكتمل
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>
    </div>
  );
};

export default TechnicianReportsPage;

