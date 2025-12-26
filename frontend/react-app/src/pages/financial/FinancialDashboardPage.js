import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard,
  DollarSign,
  ArrowRight,
  Download,
  BarChart3
} from 'lucide-react';
import { SimpleCard, SimpleCardContent, SimpleCardHeader } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Breadcrumb from '../../components/layout/Breadcrumb';
import apiService from '../../services/api';
import FinancialSummaryCard from '../../components/financial/shared/FinancialSummaryCard';

const FinancialDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    invoices: null,
    payments: null,
    expenses: null,
    summary: null
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load all stats in parallel
      const [invoicesStats, paymentsStats, expensesStats, summary] = await Promise.all([
        apiService.get('/api/financial/invoices/stats').catch(() => ({ success: false, data: null })),
        apiService.get('/api/financial/payments/stats').catch(() => ({ success: false, data: null })),
        apiService.get('/api/financial/expenses/stats').catch(() => ({ success: false, data: null })),
        apiService.get('/api/financial-integration/financial/dashboard').catch(() => ({ success: false, data: null }))
      ]);

      setStats({
        invoices: invoicesStats.success ? invoicesStats.data : null,
        payments: paymentsStats.success ? paymentsStats.data : null,
        expenses: expensesStats.success ? expensesStats.data : null,
        summary: summary.success ? summary.data : null
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">جاري تحميل البيانات المالية...</p>
        </div>
      </div>
    );
  }

  const summary = stats.summary || {};
  const invoices = stats.invoices || {};
  const payments = stats.payments || {};
  const expenses = stats.expenses || {};

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Breadcrumb
            items={[
              { label: 'الرئيسية', href: '/' },
              { label: 'النظام المالي', href: '/financial', active: true }
            ]}
          />
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-foreground">لوحة التحكم المالية</h1>
            <p className="text-muted-foreground mt-2">نظرة عامة على الوضع المالي للنظام</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Revenue Card */}
          <SimpleCard className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    إجمالي الإيرادات
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    {formatCurrency(summary.revenue?.total || payments.totalAmount || 0)}
                  </h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Expenses Card */}
          <SimpleCard className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    إجمالي المصروفات
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    {formatCurrency(summary.expenses?.total || expenses.totalAmount || 0)}
                  </h3>
                </div>
                <div className="p-3 bg-destructive/10 rounded-full">
                  <TrendingDown className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Net Profit Card */}
          <SimpleCard className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    صافي الربح
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    {formatCurrency(summary.profit?.net || 0)}
                  </h3>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-full">
                  <BarChart3 className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Outstanding Card */}
          <SimpleCard className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    المديونيات المستحقة
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    {formatCurrency(summary.outstanding?.amount || invoices.unpaidAmount || 0)}
                  </h3>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-full">
                  <Receipt className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>

        {/* Quick Actions */}
        <SimpleCard>
          <SimpleCardHeader>
            <h2 className="text-xl font-semibold text-foreground">إجراءات سريعة</h2>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <SimpleButton
                variant="default"
                className="w-full justify-start"
                onClick={() => navigate('/financial/invoices/create')}
              >
                <Receipt className="w-4 h-4 ml-2" />
                إنشاء فاتورة
              </SimpleButton>
              <SimpleButton
                variant="default"
                className="w-full justify-start"
                onClick={() => navigate('/financial/payments/create')}
              >
                <CreditCard className="w-4 h-4 ml-2" />
                تسجيل دفعة
              </SimpleButton>
              <SimpleButton
                variant="default"
                className="w-full justify-start"
                onClick={() => navigate('/financial/expenses/create')}
              >
                <DollarSign className="w-4 h-4 ml-2" />
                إضافة مصروف
              </SimpleButton>
              <SimpleButton
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/reports/financial')}
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                التقارير المالية
              </SimpleButton>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <FinancialSummaryCard
            title="ملخص الفواتير"
            data={invoices}
            loading={false}
            icon={Receipt}
          />
          <FinancialSummaryCard
            title="ملخص المدفوعات"
            data={payments}
            loading={false}
            icon={CreditCard}
          />
          <FinancialSummaryCard
            title="ملخص المصروفات"
            data={expenses}
            loading={false}
            icon={DollarSign}
          />
        </div>

        {/* Links to Detailed Pages */}
        <SimpleCard>
          <SimpleCardHeader>
            <h2 className="text-xl font-semibold text-foreground">صفحات النظام المالي</h2>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <SimpleButton
                variant="outline"
                className="w-full justify-between"
                onClick={() => navigate('/financial/invoices')}
              >
                <div className="flex items-center">
                  <Receipt className="w-4 h-4 ml-2" />
                  الفواتير
                </div>
                <ArrowRight className="w-4 h-4" />
              </SimpleButton>
              <SimpleButton
                variant="outline"
                className="w-full justify-between"
                onClick={() => navigate('/financial/payments')}
              >
                <div className="flex items-center">
                  <CreditCard className="w-4 h-4 ml-2" />
                  المدفوعات
                </div>
                <ArrowRight className="w-4 h-4" />
              </SimpleButton>
              <SimpleButton
                variant="outline"
                className="w-full justify-between"
                onClick={() => navigate('/financial/expenses')}
              >
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 ml-2" />
                  المصروفات
                </div>
                <ArrowRight className="w-4 h-4" />
              </SimpleButton>
              <SimpleButton
                variant="outline"
                className="w-full justify-between"
                onClick={() => navigate('/reports/financial')}
              >
                <div className="flex items-center">
                  <BarChart3 className="w-4 h-4 ml-2" />
                  التقارير
                </div>
                <ArrowRight className="w-4 h-4" />
              </SimpleButton>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>
    </div>
  );
};

export default FinancialDashboardPage;
