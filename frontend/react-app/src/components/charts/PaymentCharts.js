/**
 * 📊 مكونات الرسوم البيانية للمدفوعات
 * 
 * رسوم بيانية تفاعلية لعرض إحصائيات المدفوعات
 * يشمل: مخطط دائري، مخطط أعمدة، مخطط خطي
 */

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

// تسجيل مكونات Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const PaymentCharts = ({ payments = [], isLoading = false }) => {
  const [chartType, setChartType] = useState('pie');
  const [timeRange, setTimeRange] = useState('month');

  // إعدادات الرسوم البيانية
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: 'Arial, sans-serif'
          }
        }
      },
      title: {
        display: true,
        text: 'إحصائيات المدفوعات',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    }
  };

  // إعدادات المخطط الدائري
  const pieOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: 'توزيع طرق الدفع'
      }
    }
  };

  // إعدادات مخطط الأعمدة
  const barOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: 'الاتجاهات الشهرية'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value.toLocaleString('ar-EG') + ' جنيه';
          }
        }
      }
    }
  };

  // إعدادات المخطط الخطي
  const lineOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: 'الاتجاهات اليومية'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value.toLocaleString('ar-EG') + ' جنيه';
          }
        }
      }
    }
  };

  // حساب بيانات المخطط الدائري
  const getPieData = () => {
    const methodCounts = {};
    payments.forEach(payment => {
      methodCounts[payment.paymentMethod] = (methodCounts[payment.paymentMethod] || 0) + 1;
    });

    const labels = Object.keys(methodCounts).map(method => getPaymentMethodText(method));
    const data = Object.values(methodCounts);
    const backgroundColors = [
      '#3B82F6', // أزرق
      '#10B981', // أخضر
      '#F59E0B', // أصفر
      '#EF4444', // أحمر
      '#8B5CF6', // بنفسجي
      '#06B6D4'  // سماوي
    ];

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  };

  // حساب بيانات مخطط الأعمدة
  const getBarData = () => {
    const monthlyData = getMonthlyData();
    const months = Object.keys(monthlyData);
    const amounts = Object.values(monthlyData);

    return {
      labels: months,
      datasets: [{
        label: 'المبلغ (جنيه)',
        data: amounts,
        backgroundColor: '#3B82F6',
        borderColor: '#1D4ED8',
        borderWidth: 1
      }]
    };
  };

  // حساب بيانات المخطط الخطي
  const getLineData = () => {
    const dailyData = getDailyData();
    const days = Object.keys(dailyData);
    const amounts = Object.values(dailyData);

    return {
      labels: days,
      datasets: [{
        label: 'المبلغ (جنيه)',
        data: amounts,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    };
  };

  // حساب البيانات الشهرية
  const getMonthlyData = () => {
    const monthlyData = {};
    
    payments.forEach(payment => {
      const date = new Date(payment.paymentDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = getMonthName(date.getMonth());
      
      if (!monthlyData[monthName]) {
        monthlyData[monthName] = 0;
      }
      monthlyData[monthName] += payment.amount;
    });

    return monthlyData;
  };

  // حساب البيانات اليومية
  const getDailyData = () => {
    const dailyData = {};
    const last30Days = [];
    
    // إنشاء قائمة آخر 30 يوم
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last30Days.push(date.toISOString().split('T')[0]);
    }

    // تهيئة البيانات اليومية
    last30Days.forEach(date => {
      dailyData[date] = 0;
    });

    // حساب المبالغ اليومية
    payments.forEach(payment => {
      const paymentDate = payment.paymentDate;
      if (dailyData.hasOwnProperty(paymentDate)) {
        dailyData[paymentDate] += payment.amount;
      }
    });

    return dailyData;
  };

  // الحصول على اسم الشهر
  const getMonthName = (monthIndex) => {
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[monthIndex];
  };

  // الحصول على نص طريقة الدفع
  const getPaymentMethodText = (method) => {
    const methods = {
      'cash': 'نقد',
      'card': 'بطاقة ائتمان',
      'transfer': 'تحويل بنكي',
      'check': 'شيك',
      'other': 'أخرى'
    };
    return methods[method] || method;
  };

  // عرض المخطط حسب النوع المحدد
  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (payments.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>لا توجد بيانات لعرضها</p>
        </div>
      );
    }

    // عرض مبسط للرسوم البيانية
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-600">الرسوم البيانية ستكون متاحة قريباً</p>
          <p className="text-sm text-gray-500 mt-2">
            نوع المخطط: {chartType === 'pie' ? 'مخطط دائري' : chartType === 'bar' ? 'مخطط أعمدة' : 'مخطط خطي'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* رأس المكون */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          الرسوم البيانية
        </h3>
        
        <div className="flex items-center space-x-4">
          {/* اختيار نوع المخطط */}
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="pie">مخطط دائري</option>
            <option value="bar">مخطط أعمدة</option>
            <option value="line">مخطط خطي</option>
          </select>

          {/* اختيار الفترة الزمنية */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="week">أسبوع</option>
            <option value="month">شهر</option>
            <option value="quarter">ربع سنة</option>
            <option value="year">سنة</option>
          </select>
        </div>
      </div>

      {/* المخطط */}
      <div className="h-64">
        {renderChart()}
      </div>

      {/* إحصائيات سريعة */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {payments.length}
          </div>
          <div className="text-sm text-blue-800">إجمالي المدفوعات</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {payments.reduce((sum, payment) => sum + payment.amount, 0).toLocaleString('ar-EG')}
          </div>
          <div className="text-sm text-green-800">إجمالي المبلغ (جنيه)</div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {payments.filter(p => p.status === 'completed').length}
          </div>
          <div className="text-sm text-yellow-800">مدفوعات مكتملة</div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {payments.filter(p => p.status === 'pending').length}
          </div>
          <div className="text-sm text-red-800">مدفوعات معلقة</div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCharts;
