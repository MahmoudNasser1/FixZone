import React, { useState, useEffect } from 'react';
import { SimpleCard, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import paymentService from '../../services/paymentService';
import PaymentCharts from '../../components/charts/PaymentCharts';
import { 
  Download, Calendar, Filter, TrendingUp, TrendingDown,
  DollarSign, CreditCard, Banknote, FileText, BarChart3
} from 'lucide-react';

const PaymentReportsPage = () => {
  const [reports, setReports] = useState({
    daily: [],
    monthly: [],
    yearly: [],
    overdue: [],
    summary: null
  });
  const [chartData, setChartData] = useState({
    paymentMethods: [],
    monthlyTrends: [],
    dailyTrends: [],
    customerComparison: []
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    paymentMethod: '',
    customerId: ''
  });
  const [selectedReport, setSelectedReport] = useState('daily');

  useEffect(() => {
    loadReports();
  }, [filters]);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      // Load different types of reports
      const [dailyReport, monthlyReport, yearlyReport, overdueReport, summaryReport] = await Promise.all([
        loadDailyReport(),
        loadMonthlyReport(),
        loadYearlyReport(),
        loadOverdueReport(),
        loadSummaryReport()
      ]);

      setReports({
        daily: dailyReport,
        monthly: monthlyReport,
        yearly: yearlyReport,
        overdue: overdueReport,
        summary: summaryReport
      });

      // Load chart data
      await loadChartData();
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      // تحميل بيانات طرق الدفع
      const paymentMethodsData = [
        { method: 'نقدي', amount: 1500 },
        { method: 'بطاقة ائتمان', amount: 800 },
        { method: 'تحويل بنكي', amount: 1200 },
        { method: 'شيك', amount: 300 },
        { method: 'أخرى', amount: 100 }
      ];

      // تحميل بيانات الاتجاه الشهري
      const monthlyTrendsData = [
        { month: 'يناير', total: 2500, count: 15 },
        { month: 'فبراير', total: 3200, count: 18 },
        { month: 'مارس', total: 2800, count: 16 },
        { month: 'أبريل', total: 3500, count: 20 },
        { month: 'مايو', total: 4000, count: 22 },
        { month: 'يونيو', total: 3800, count: 21 }
      ];

      // تحميل بيانات الاتجاه اليومي
      const dailyTrendsData = [
        { date: '2024-01-01', amount: 500 },
        { date: '2024-01-02', amount: 750 },
        { date: '2024-01-03', amount: 300 },
        { date: '2024-01-04', amount: 900 },
        { date: '2024-01-05', amount: 600 },
        { date: '2024-01-06', amount: 1200 },
        { date: '2024-01-07', amount: 800 }
      ];

      // تحميل بيانات مقارنة العملاء
      const customerComparisonData = [
        { customerName: 'أحمد محمد', totalAmount: 2500, paymentCount: 8 },
        { customerName: 'فاطمة علي', totalAmount: 1800, paymentCount: 5 },
        { customerName: 'محمد أحمد', totalAmount: 3200, paymentCount: 12 },
        { customerName: 'سارة محمد', totalAmount: 1500, paymentCount: 4 }
      ];

      setChartData({
        paymentMethods: paymentMethodsData,
        monthlyTrends: monthlyTrendsData,
        dailyTrends: dailyTrendsData,
        customerComparison: customerComparisonData
      });
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const loadDailyReport = async () => {
    try {
      const response = await paymentService.getPaymentStats({
        dateFrom: filters.dateFrom || new Date().toISOString().split('T')[0],
        dateTo: filters.dateTo || new Date().toISOString().split('T')[0]
      });
      return response.daily || [];
    } catch (error) {
      console.error('Error loading daily report:', error);
      return [];
    }
  };

  const loadMonthlyReport = async () => {
    try {
      const response = await paymentService.getPaymentStats({
        dateFrom: filters.dateFrom || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        dateTo: filters.dateTo || new Date().toISOString().split('T')[0]
      });
      return response.monthly || [];
    } catch (error) {
      console.error('Error loading monthly report:', error);
      return [];
    }
  };

  const loadYearlyReport = async () => {
    try {
      const response = await paymentService.getPaymentStats({
        dateFrom: filters.dateFrom || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        dateTo: filters.dateTo || new Date().toISOString().split('T')[0]
      });
      return response.yearly || [];
    } catch (error) {
      console.error('Error loading yearly report:', error);
      return [];
    }
  };

  const loadOverdueReport = async () => {
    try {
      const overduePayments = await paymentService.getOverduePayments();
      return overduePayments || [];
    } catch (error) {
      console.error('Error loading overdue report:', error);
      return [];
    }
  };

  const loadSummaryReport = async () => {
    try {
      const response = await paymentService.getPaymentStats({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo
      });
      return response;
    } catch (error) {
      console.error('Error loading summary report:', error);
      return null;
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExportReport = async (format = 'pdf') => {
    try {
      // Implementation for exporting reports
      console.log(`Exporting ${selectedReport} report as ${format}`);
      // This would typically call an API endpoint to generate and download the report
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const renderReportTabs = () => {
    const tabs = [
      { id: 'daily', label: 'التقرير اليومي', icon: Calendar },
      { id: 'monthly', label: 'التقرير الشهري', icon: TrendingUp },
      { id: 'yearly', label: 'التقرير السنوي', icon: BarChart3 },
      { id: 'overdue', label: 'المدفوعات المتأخرة', icon: TrendingDown }
    ];

    return (
      <div className="flex space-x-1 space-x-reverse bg-gray-100 p-1 rounded-lg">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedReport(tab.id)}
              className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedReport === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          من تاريخ
        </label>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          إلى تاريخ
        </label>
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          طريقة الدفع
        </label>
        <select
          value={filters.paymentMethod}
          onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">جميع الطرق</option>
          <option value="cash">نقدي</option>
          <option value="card">بطاقة ائتمان</option>
          <option value="bank_transfer">تحويل بنكي</option>
          <option value="check">شيك</option>
          <option value="other">أخرى</option>
        </select>
      </div>
      <div className="flex items-end">
        <SimpleButton
          onClick={loadReports}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Filter className="w-4 h-4 ml-2" />
          تطبيق الفلاتر
        </SimpleButton>
      </div>
    </div>
  );

  const renderSummaryCards = () => {
    if (!reports.summary) return null;

    const summaryData = [
      {
        title: 'إجمالي المدفوعات',
        value: paymentService.formatAmount(reports.summary.totalAmount || 0),
        icon: DollarSign,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        title: 'عدد المدفوعات',
        value: reports.summary.totalPayments || 0,
        icon: CreditCard,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        title: 'متوسط المدفوعات',
        value: paymentService.formatAmount(reports.summary.averageAmount || 0),
        icon: TrendingUp,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      },
      {
        title: 'المدفوعات المتأخرة',
        value: reports.overdue.length,
        icon: TrendingDown,
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryData.map((item, index) => {
          const Icon = item.icon;
          return (
            <SimpleCard key={index}>
              <SimpleCardContent className="p-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${item.bgColor}`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div className="mr-3 rtl:mr-0 rtl:ml-3">
                    <p className="text-sm font-medium text-gray-600">{item.title}</p>
                    <p className={`text-lg font-semibold ${item.color}`}>
                      {item.value}
                    </p>
                  </div>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          );
        })}
      </div>
    );
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل التقرير...</p>
          </div>
        </div>
      );
    }

    switch (selectedReport) {
      case 'daily':
        return renderDailyReport();
      case 'monthly':
        return renderMonthlyReport();
      case 'yearly':
        return renderYearlyReport();
      case 'overdue':
        return renderOverdueReport();
      default:
        return null;
    }
  };

  const renderDailyReport = () => (
    <div className="space-y-6">
      <SimpleCard>
        <SimpleCardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">التقرير اليومي</h3>
            <SimpleButton onClick={() => handleExportReport('pdf')}>
              <Download className="w-4 h-4 ml-2" />
              تصدير PDF
            </SimpleButton>
          </div>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">التقرير اليومي قيد التطوير</p>
          </div>
        </SimpleCardContent>
      </SimpleCard>
      
      {/* الرسوم البيانية */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">الرسوم البيانية</h3>
        <PaymentCharts 
          paymentMethodData={chartData.paymentMethods}
          monthlyData={chartData.monthlyTrends}
          dailyData={chartData.dailyTrends}
          customerData={chartData.customerComparison}
        />
      </div>
    </div>
  );

  const renderMonthlyReport = () => (
    <SimpleCard>
      <SimpleCardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">التقرير الشهري</h3>
          <SimpleButton onClick={() => handleExportReport('pdf')}>
            <Download className="w-4 h-4 ml-2" />
            تصدير PDF
          </SimpleButton>
        </div>
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">التقرير الشهري قيد التطوير</p>
        </div>
      </SimpleCardContent>
    </SimpleCard>
  );

  const renderYearlyReport = () => (
    <SimpleCard>
      <SimpleCardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">التقرير السنوي</h3>
          <SimpleButton onClick={() => handleExportReport('pdf')}>
            <Download className="w-4 h-4 ml-2" />
            تصدير PDF
          </SimpleButton>
        </div>
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">التقرير السنوي قيد التطوير</p>
        </div>
      </SimpleCardContent>
    </SimpleCard>
  );

  const renderOverdueReport = () => (
    <SimpleCard>
      <SimpleCardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">المدفوعات المتأخرة</h3>
          <SimpleButton onClick={() => handleExportReport('pdf')}>
            <Download className="w-4 h-4 ml-2" />
            تصدير PDF
          </SimpleButton>
        </div>
        {reports.overdue.length === 0 ? (
          <div className="text-center py-8">
            <TrendingDown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد مدفوعات متأخرة</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.overdue.map((payment, index) => (
              <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-red-900">
                      {paymentService.formatAmount(payment.remainingAmount)}
                    </p>
                    <p className="text-sm text-red-700">
                      فاتورة #{payment.invoiceId} - {payment.customerFirstName} {payment.customerLastName}
                    </p>
                    <p className="text-xs text-red-600">
                      متأخرة {payment.daysOverdue} يوم
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-red-600">
                      تاريخ الاستحقاق: {paymentService.formatDate(payment.dueDate)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SimpleCardContent>
    </SimpleCard>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">تقارير المدفوعات</h1>
          <p className="text-gray-600 mt-1">تقارير شاملة ومفصلة للمدفوعات</p>
        </div>

        {/* Filters */}
        {renderFilters()}

        {/* Summary Cards */}
        {renderSummaryCards()}

        {/* Report Tabs */}
        <div className="mb-6">
          {renderReportTabs()}
        </div>

        {/* Report Content */}
        {renderReportContent()}
      </div>
    </div>
  );
};

export default PaymentReportsPage;
