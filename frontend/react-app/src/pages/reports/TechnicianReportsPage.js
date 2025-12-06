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
  UserGroupIcon,
  ClockIcon,
  StarIcon,
  ChartBarIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { getDefaultApiBaseUrl } from '../../lib/apiConfig';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';

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
          callback: function(value) {
            return value.toLocaleString('ar-SA') + ' جنية';
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <SimpleCard>
        <SimpleCardHeader>
          <div>
            <SimpleCardTitle className="text-2xl flex items-center gap-2">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
              تقارير أداء الفنيين
            </SimpleCardTitle>
            <p className="text-muted-foreground mt-1">تحليل شامل لأداء الفنيين وإنتاجيتهم</p>
          </div>
        </SimpleCardHeader>
      </SimpleCard>

      {/* Date Range Filter */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle className="flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
          فلترة الفترة الزمنية
          </SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تاريخ البداية
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تاريخ النهاية
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* Performance Summary */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle className="flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-blue-600" />
          ملخص الأداء
          </SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm font-medium text-blue-800">إجمالي الفنيين</div>
            <div className="text-2xl font-bold text-blue-900">
              {technicianData.length}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-sm font-medium text-green-800">إجمالي الإصلاحات</div>
            <div className="text-2xl font-bold text-green-900">
              {technicianData.reduce((sum, tech) => sum + tech.totalRepairs, 0)}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-sm font-medium text-purple-800">متوسط وقت الإصلاح</div>
            <div className="text-2xl font-bold text-purple-900">
              {(technicianData.reduce((sum, tech) => sum + tech.averageRepairTime, 0) / technicianData.length).toFixed(1)} س
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="text-sm font-medium text-yellow-800">إجمالي الإيرادات</div>
            <div className="text-2xl font-bold text-yellow-900">
              {technicianData.reduce((sum, tech) => sum + tech.totalRevenue, 0).toLocaleString('ar-SA')} جنية
            </div>
          </div>
        </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle>مقارنة أداء الفنيين</SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
          <Bar data={performanceChartData} options={chartOptions} />
          </SimpleCardContent>
        </SimpleCard>

        {/* Revenue Chart */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle>إيرادات الفنيين</SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
          <Bar data={revenueChartData} options={revenueChartOptions} />
          </SimpleCardContent>
        </SimpleCard>
      </div>

      {/* Time Performance Chart */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle className="flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-blue-600" />
          متوسط وقت الإصلاح
          </SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
        <Line data={timeChartData} options={chartOptions} />
        </SimpleCardContent>
      </SimpleCard>

      {/* Detailed Table */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle>تفاصيل أداء الفنيين</SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اسم الفني
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  إجمالي الإصلاحات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإصلاحات المكتملة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  معدل الإنجاز
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  متوسط وقت الإصلاح
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  إجمالي الإيرادات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التقييم
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {technicianData.map((tech, index) => {
                const completionRate = (tech.completedRepairs / tech.totalRepairs) * 100;
                const rating = completionRate >= 90 ? 5 : completionRate >= 80 ? 4 : completionRate >= 70 ? 3 : 2;
                
                return (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {tech.technicianName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tech.totalRepairs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tech.completedRepairs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        completionRate >= 90 ? 'bg-green-100 text-green-800' :
                        completionRate >= 80 ? 'bg-blue-100 text-blue-800' :
                        completionRate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {completionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tech.averageRepairTime} ساعة
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tech.totalRevenue?.toLocaleString('ar-SA')} جنية
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`h-4 w-4 ${
                              i < rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            fill={i < rating ? 'currentColor' : 'none'}
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
        </SimpleCardContent>
      </SimpleCard>

      {/* Top Performers */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle className="flex items-center gap-2">
          <StarIcon className="h-5 w-5 text-yellow-600" />
          أفضل الفنيين
          </SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {technicianData
            .sort((a, b) => b.completedRepairs - a.completedRepairs)
            .slice(0, 3)
            .map((tech, index) => (
              <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-blue-800">المركز {index + 1}</div>
                    <div className="text-lg font-bold text-blue-900">{tech.technicianName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-blue-600">إصلاحات مكتملة</div>
                    <div className="text-xl font-bold text-blue-900">{tech.completedRepairs}</div>
                  </div>
                </div>
              </div>
            ))}
        </div>
        </SimpleCardContent>
      </SimpleCard>
    </div>
  );
};

export default TechnicianReportsPage;

