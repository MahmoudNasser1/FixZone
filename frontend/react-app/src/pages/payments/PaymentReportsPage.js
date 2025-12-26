import React, { useState, useEffect } from 'react';
import { SimpleCard, SimpleCardContent, SimpleCardHeader, SimpleCardTitle } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import paymentService from '../../services/paymentService';
import PaymentCharts from '../../components/charts/PaymentCharts';
import { cn } from '../../lib/utils';
import {
  Download, Calendar, Filter, TrendingUp, TrendingDown,
  DollarSign, CreditCard, Banknote, FileText, BarChart3,
  Search, RefreshCw, AlertCircle, ChevronLeft
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

  const renderFilters = () => (
    <SimpleCard className="mb-6">
      <SimpleCardContent className="p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              من تاريخ
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full bg-muted border-border text-foreground rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              إلى تاريخ
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full bg-muted border-border text-foreground rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Banknote className="w-4 h-4 text-primary" />
              طريقة الدفع
            </label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              className="w-full bg-muted border-border text-foreground rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
            >
              <option value="">جميع الطرق</option>
              <option value="cash">نقدي</option>
              <option value="card">بطاقة ائتمان</option>
              <option value="bank_transfer">تحويل بنكي</option>
              <option value="check">شيك</option>
              <option value="other">أخرى</option>
            </select>
          </div>
          <div className="flex gap-2">
            <SimpleButton
              onClick={loadReports}
              className="flex-1 shadow-md hover:shadow-lg transition-all"
            >
              <Filter className="w-4 h-4 ml-2" />
              تحديث النتائج
            </SimpleButton>
            <SimpleButton
              variant="outline"
              onClick={() => setFilters({ dateFrom: '', dateTo: '', paymentMethod: '', customerId: '' })}
              className="px-3"
            >
              <RefreshCw className="w-4 h-4" />
            </SimpleButton>
          </div>
        </div>
      </SimpleCardContent>
    </SimpleCard>
  );

  const renderSummaryCards = () => {
    if (!reports.summary) return null;

    const summaryData = [
      {
        title: 'إجمالي المحصل',
        value: paymentService.formatAmount(reports.summary.totalAmount || 0),
        icon: DollarSign,
        color: 'text-success',
        bgColor: 'bg-success/10'
      },
      {
        title: 'عدد العمليات',
        value: reports.summary.totalPayments || 0,
        icon: CreditCard,
        color: 'text-primary',
        bgColor: 'bg-primary/10'
      },
      {
        title: 'متوسط العملية',
        value: paymentService.formatAmount(reports.summary.averageAmount || 0),
        icon: TrendingUp,
        color: 'text-warning',
        bgColor: 'bg-warning/10'
      },
      {
        title: 'مطالبات متأخرة',
        value: reports.overdue.length,
        icon: AlertCircle,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10'
      }
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryData.map((item, index) => {
          const Icon = item.icon;
          return (
            <SimpleCard key={index} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all">
              <SimpleCardContent className="p-0">
                <div className="flex items-stretch h-24">
                  <div className={cn("w-2", item.bgColor.replace('/10', ''))}></div>
                  <div className="flex-1 flex items-center p-6 bg-card">
                    <div className={cn("p-3 rounded-xl ml-4", item.bgColor)}>
                      <Icon className={cn("w-6 h-6", item.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                      <p className={cn("text-xl font-bold tracking-tight", item.color)}>
                        {item.value}
                      </p>
                    </div>
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
      return <LoadingSpinner message="جاري تحميل التقارير المالية..." />;
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <SimpleCard className="border-none shadow-sm overflow-hidden">
        <SimpleCardHeader className="bg-muted/30 border-b border-border/50">
          <div className="flex justify-between items-center">
            <SimpleCardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              التقرير اليومي للمدفوعات
            </SimpleCardTitle>
            <SimpleButton variant="outline" size="sm" onClick={() => handleExportReport('pdf')}>
              <Download className="w-4 h-4 ml-2" />
              تصدير PDF
            </SimpleButton>
          </div>
        </SimpleCardHeader>
        <SimpleCardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-muted rounded-full">
              <FileText className="w-12 h-12 text-muted-foreground opacity-50" />
            </div>
            <p className="text-lg font-medium text-foreground">التقرير اليومي قيد المعالجة</p>
            <p className="text-sm text-muted-foreground max-w-sm">سيتم عرض تفاصيل العمليات اليومية هنا بمجرد اكتمال تجميع البيانات.</p>
          </div>
        </SimpleCardContent>
      </SimpleCard>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">رسوم بيانية تحليلية</h3>
        </div>
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
    <SimpleCard className="border-none shadow-sm overflow-hidden animate-in fade-in duration-500">
      <SimpleCardHeader className="bg-muted/30 border-b border-border/50">
        <div className="flex justify-between items-center">
          <SimpleCardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            تحليل الأداء الشهري
          </SimpleCardTitle>
          <SimpleButton variant="outline" size="sm" onClick={() => handleExportReport('pdf')}>
            <Download className="w-4 h-4 ml-2" />
            تصدير PDF
          </SimpleButton>
        </div>
      </SimpleCardHeader>
      <SimpleCardContent className="p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-muted rounded-full">
            <BarChart3 className="w-12 h-12 text-muted-foreground opacity-50" />
          </div>
          <p className="text-lg font-medium text-foreground">التقرير الشهري قيد التطوير</p>
          <p className="text-sm text-muted-foreground max-w-sm">نحن نجهز واجهة تفصيلية لعرض نمو الإيرادات الشهرية ومقارنتها.</p>
        </div>
      </SimpleCardContent>
    </SimpleCard>
  );

  const renderYearlyReport = () => (
    <SimpleCard className="border-none shadow-sm overflow-hidden animate-in fade-in duration-500">
      <SimpleCardHeader className="bg-muted/30 border-b border-border/50">
        <div className="flex justify-between items-center">
          <SimpleCardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            الملخص السنوي الشامل
          </SimpleCardTitle>
          <SimpleButton variant="outline" size="sm" onClick={() => handleExportReport('pdf')}>
            <Download className="w-4 h-4 ml-2" />
            تصدير PDF
          </SimpleButton>
        </div>
      </SimpleCardHeader>
      <SimpleCardContent className="p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-muted rounded-full">
            <TrendingUp className="w-12 h-12 text-muted-foreground opacity-50" />
          </div>
          <p className="text-lg font-medium text-foreground">التقرير السنوي قيد الإعداد</p>
          <p className="text-sm text-muted-foreground max-w-sm">سيتم عرض مقارنة سنوية شاملة للأداء المالي هنا.</p>
        </div>
      </SimpleCardContent>
    </SimpleCard>
  );

  const renderOverdueReport = () => (
    <SimpleCard className="border-none shadow-sm overflow-hidden animate-in fade-in duration-500">
      <SimpleCardHeader className="bg-muted/30 border-b border-border/50">
        <div className="flex justify-between items-center">
          <SimpleCardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            المطالبات والمدفوعات المتأخرة
          </SimpleCardTitle>
          <div className="flex items-center gap-2">
            <SimpleBadge variant="destructive">{reports.overdue.length} مطالبة</SimpleBadge>
            <SimpleButton variant="outline" size="sm" onClick={() => handleExportReport('pdf')}>
              <Download className="w-4 h-4 ml-2" />
              تصدير القائمة
            </SimpleButton>
          </div>
        </div>
      </SimpleCardHeader>
      <SimpleCardContent className="p-6">
        {reports.overdue.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingDown className="w-8 h-8" />
            </div>
            <p className="text-lg font-medium text-foreground">لا توجد مطالبات متأخرة حالياً</p>
            <p className="text-sm text-muted-foreground">جميع المدفوعات محصلة في مواعيدها المحددة.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.overdue.map((payment, index) => (
              <div key={index} className="group flex items-center justify-between p-4 rounded-xl border border-destructive/10 bg-destructive/5 hover:bg-destructive/10 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-destructive/20 rounded-lg group-hover:bg-destructive/30 transition-all">
                    <DollarSign className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-destructive">
                      {paymentService.formatAmount(payment.remainingAmount)}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      فاتورة #{payment.invoiceId} - {payment.customerFirstName} {payment.customerLastName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <SimpleBadge variant="outline" className="text-[10px] text-destructive border-destructive/20 bg-destructive/5">
                        متأخرة {payment.daysOverdue} يوم
                      </SimpleBadge>
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">تاريخ الاستحقاق</p>
                  <p className="text-sm font-semibold text-foreground">
                    {paymentService.formatDate(payment.dueDate)}
                  </p>
                  <SimpleButton variant="ghost" size="sm" className="mt-2 text-xs h-8 px-2 hover:bg-destructive/20 text-destructive">
                    <Search className="w-3 h-3 ml-1" />
                    تفاصيل
                  </SimpleButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </SimpleCardContent>
    </SimpleCard>
  );

  const renderReportTabs = () => {
    const tabs = [
      { id: 'daily', label: 'التقرير اليومي', icon: Calendar },
      { id: 'monthly', label: 'التقرير الشهري', icon: TrendingUp },
      { id: 'yearly', label: 'التقرير السنوي', icon: BarChart3 },
      { id: 'overdue', label: 'المطالبات المتأخرة', icon: AlertCircle }
    ];

    return (
      <div className="flex bg-muted/50 p-1.5 rounded-xl border border-border overflow-x-auto no-scrollbar">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = selectedReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedReport(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all min-w-max",
                isActive
                  ? "bg-card text-primary shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'overdue' && reports.overdue.length > 0 && (
                <span className="bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full text-[10px]">
                  {reports.overdue.length}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6 text-right" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">تقارير المدفوعات</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-muted-foreground">مركز التحليل المالي والتحصيل</p>
                <div className="w-1 h-1 bg-muted-foreground/30 rounded-full"></div>
                <SimpleBadge variant="outline" className="text-[10px] py-0">مباشر</SimpleBadge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SimpleButton onClick={loadReports} variant="outline" className="p-2.5">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </SimpleButton>
            <SimpleButton onClick={() => handleExportReport('pdf')} className="shadow-lg shadow-primary/20">
              <Download className="w-4 h-4 ml-2" />
              تصدير التقرير المالي
            </SimpleButton>
          </div>
        </div>

        {/* Dynamic Filters */}
        {renderFilters()}

        {/* Global Summary */}
        {renderSummaryCards()}

        {/* Report Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-4">
            <h2 className="text-xl font-bold text-foreground">عرض النتائج</h2>
            {renderReportTabs()}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderReportContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentReportsPage;
