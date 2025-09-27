import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// تسجيل مكونات Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// مخطط دائري لطرق الدفع
export const PaymentMethodChart = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.method),
    datasets: [
      {
        data: data.map(item => item.amount),
        backgroundColor: [
          '#10B981', // أخضر للنقد
          '#3B82F6', // أزرق للبطاقة
          '#F59E0B', // أصفر للتحويل
          '#EF4444', // أحمر للشيك
          '#8B5CF6', // بنفسجي لأخرى
        ],
        borderColor: [
          '#059669',
          '#2563EB',
          '#D97706',
          '#DC2626',
          '#7C3AED',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: 'توزيع المدفوعات حسب طريقة الدفع',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

// مخطط أعمدة للمدفوعات الشهرية
export const MonthlyPaymentsChart = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'إجمالي المدفوعات',
        data: data.map(item => item.total),
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: 'عدد المدفوعات',
        data: data.map(item => item.count),
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'الاتجاه الشهري للمدفوعات',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value.toLocaleString('ar-EG');
          },
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Bar data={chartData} options={options} />
    </div>
  );
};

// مخطط خطي للاتجاهات اليومية
export const DailyTrendsChart = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: 'المدفوعات اليومية',
        data: data.map(item => item.amount),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'الاتجاه اليومي للمدفوعات',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value.toLocaleString('ar-EG');
          },
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Line data={chartData} options={options} />
    </div>
  );
};

// مخطط أعمدة للمقارنة بين العملاء
export const CustomerComparisonChart = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.customerName),
    datasets: [
      {
        label: 'إجمالي المدفوعات',
        data: data.map(item => item.totalAmount),
        backgroundColor: '#8B5CF6',
        borderColor: '#7C3AED',
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: 'عدد المدفوعات',
        data: data.map(item => item.paymentCount),
        backgroundColor: '#F59E0B',
        borderColor: '#D97706',
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'مقارنة المدفوعات بين العملاء',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value.toLocaleString('ar-EG');
          },
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Bar data={chartData} options={options} />
    </div>
  );
};

// مكون تجميعي للرسوم البيانية
export const PaymentCharts = ({ 
  paymentMethodData = [],
  monthlyData = [],
  dailyData = [],
  customerData = []
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* مخطط طرق الدفع */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <PaymentMethodChart data={paymentMethodData} />
      </div>

      {/* مخطط الاتجاه الشهري */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <MonthlyPaymentsChart data={monthlyData} />
      </div>

      {/* مخطط الاتجاه اليومي */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <DailyTrendsChart data={dailyData} />
      </div>

      {/* مخطط مقارنة العملاء */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <CustomerComparisonChart data={customerData} />
      </div>
    </div>
  );
};

export default PaymentCharts;


