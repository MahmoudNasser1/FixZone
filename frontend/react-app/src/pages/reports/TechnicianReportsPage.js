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
        `http://localhost:3001/api/reports/technician-performance?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        { credentials: 'include' }
      );
      const data = await response.json();
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
              تقارير أداء الفنيين
            </h1>
            <p className="text-gray-600 mt-1">تحليل شامل لأداء الفنيين وإنتاجيتهم</p>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
          فلترة الفترة الزمنية
        </h3>
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
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-blue-600" />
          ملخص الأداء
        </h3>
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
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">مقارنة أداء الفنيين</h3>
          <Bar data={performanceChartData} options={chartOptions} />
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">إيرادات الفنيين</h3>
          <Bar data={revenueChartData} options={revenueChartOptions} />
        </div>
      </div>

      {/* Time Performance Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-blue-600" />
          متوسط وقت الإصلاح
        </h3>
        <Line data={timeChartData} options={chartOptions} />
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">تفاصيل أداء الفنيين</h3>
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
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <StarIcon className="h-5 w-5 text-yellow-600" />
          أفضل الفنيين
        </h3>
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
      </div>
    </div>
  );
};

export default TechnicianReportsPage;

