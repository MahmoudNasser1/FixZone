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
  CalendarDaysIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

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

const DailyReportsPage = () => {
  const [dailyData, setDailyData] = useState(null);
  const [repairStats, setRepairStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchDailyRevenue = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/reports/daily-revenue?date=${selectedDate}`,
        { credentials: 'include' }
      );
      const data = await response.json();
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
          callback: function(value) {
            return value.toLocaleString('ar-SA') + ' ر.س';
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
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              التقرير اليومي
            </h1>
            <p className="text-gray-600 mt-1">ملخص شامل لأداء اليوم</p>
          </div>
        </div>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
          اختيار التاريخ
        </h3>
        <div className="max-w-md">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Revenue Summary */}
      {dailyData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
            ملخص الإيرادات
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm font-medium text-green-800">إجمالي الإيرادات</div>
              <div className="text-2xl font-bold text-green-900">
                {dailyData.totalRevenue?.toLocaleString('ar-SA')} ر.س
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm font-medium text-blue-800">عدد المدفوعات</div>
              <div className="text-2xl font-bold text-blue-900">
                {dailyData.paymentCount || 0}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-sm font-medium text-purple-800">متوسط المدفوعات</div>
              <div className="text-2xl font-bold text-purple-900">
                {dailyData.averagePayment?.toLocaleString('ar-SA')} ر.س
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Repair Statistics */}
      {repairStats && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-blue-600" />
            إحصائيات الإصلاحات
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm font-medium text-blue-800">إجمالي الطلبات</div>
              <div className="text-2xl font-bold text-blue-900">
                {repairStats.totalRepairs}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm font-medium text-green-800">طلبات جديدة</div>
              <div className="text-2xl font-bold text-green-900">
                {repairStats.newRepairs}
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="text-sm font-medium text-yellow-800">قيد الإصلاح</div>
              <div className="text-2xl font-bold text-yellow-900">
                {repairStats.inProgress}
              </div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <div className="text-sm font-medium text-emerald-800">مكتمل</div>
              <div className="text-2xl font-bold text-emerald-900">
                {repairStats.completed}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">الإيرادات اليومية</h3>
          <Bar data={revenueChartData} options={chartOptions} />
        </div>

        {/* Repair Status Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">توزيع حالة الإصلاحات</h3>
          <Doughnut data={repairStatusData} options={doughnutOptions} />
        </div>
      </div>

      {/* Performance Metrics */}
      {repairStats && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-blue-600" />
            مؤشرات الأداء
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-800">متوسط وقت الإصلاح</div>
              <div className="text-xl font-bold text-gray-900">
                {repairStats.averageRepairTime} ساعات
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-800">معدل الإنجاز</div>
              <div className="text-xl font-bold text-gray-900">
                {((repairStats.completed / repairStats.totalRepairs) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
          تنبيهات اليوم
        </h3>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-3" />
            <span className="text-yellow-800">يوجد {repairStats?.pending || 0} طلبات إصلاح معلقة</span>
          </div>
          {repairStats?.averageRepairTime > 3 && (
            <div className="flex items-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <ClockIcon className="h-5 w-5 text-orange-600 mr-3" />
              <span className="text-orange-800">متوسط وقت الإصلاح أعلى من المعتاد</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyReportsPage;

