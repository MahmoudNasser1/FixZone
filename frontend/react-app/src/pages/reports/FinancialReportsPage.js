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
  DocumentArrowDownIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ChartBarIcon
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
        `${process.env.REACT_APP_API_URL || 'http://localhost:4000/api'}/reports/profit-loss?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
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
        `${process.env.REACT_APP_API_URL || 'http://localhost:4000/api'}/reports/monthly-revenue?year=${currentYear}&month=${month}`,
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
          `${process.env.REACT_APP_API_URL || 'http://localhost:4000/api'}/reports/daily-revenue?date=${dateStr}`,
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
        `${process.env.REACT_APP_API_URL || 'http://localhost:4000/api'}/reports/expenses?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
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
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              التقارير المالية
            </h1>
            <p className="text-gray-600 mt-1">تقارير شاملة للإيرادات والمصروفات والأرباح</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToPDF}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              تصدير PDF
            </button>
            <button
              onClick={exportToExcel}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              تصدير Excel
            </button>
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

      {/* Profit & Loss Summary */}
      {profitLossData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
            ملخص الأرباح والخسائر
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm font-medium text-green-800">إجمالي الإيرادات</div>
              <div className="text-2xl font-bold text-green-900">
                {profitLossData.totalRevenue?.toLocaleString('ar-SA')} جنية
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-sm font-medium text-red-800">إجمالي المصروفات</div>
              <div className="text-2xl font-bold text-red-900">
                {profitLossData.totalExpenses?.toLocaleString('ar-SA')} جنية
              </div>
            </div>
            <div className={`rounded-lg p-4 border ${
              profitLossData.profit >= 0 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className={`text-sm font-medium ${
                profitLossData.profit >= 0 ? 'text-green-800' : 'text-red-800'
              }`}>
                صافي الربح/الخسارة
              </div>
              <div className={`text-2xl font-bold ${
                profitLossData.profit >= 0 ? 'text-green-900' : 'text-red-900'
              }`}>
                {profitLossData.profit?.toLocaleString('ar-SA')} جنية
              </div>
              <div className={`text-sm ${
                profitLossData.profit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                هامش الربح: {profitLossData.profitMargin?.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">الإيرادات الشهرية</h3>
          <Bar data={monthlyChartData} options={chartOptions} />
        </div>

        {/* Daily Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">الإيرادات اليومية (آخر 7 أيام)</h3>
          <Line data={dailyChartData} options={chartOptions} />
        </div>
      </div>

      {/* Expenses Breakdown */}
      {expenses.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">توزيع المصروفات حسب الفئة</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الفئة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    عدد المصروفات
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    إجمالي المبلغ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {expense.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.expenseCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.totalAmount?.toLocaleString('ar-SA')} جنية
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialReportsPage;

