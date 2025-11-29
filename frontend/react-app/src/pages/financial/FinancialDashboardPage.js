// Financial Dashboard Page
// Main dashboard for financial overview

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Button
} from '@mui/material';
import {
  AttachMoney,
  Receipt,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  CalendarToday,
  ArrowForward
} from '@mui/icons-material';
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const summary = stats.summary || {};
  const invoices = stats.invoices || {};
  const payments = stats.payments || {};
  const expenses = stats.expenses || {};

  return (
    <Box p={3}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          لوحة التحكم المالية
        </Typography>
        <Typography variant="body1" color="textSecondary">
          نظرة عامة على الوضع المالي للنظام
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    إجمالي الإيرادات
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(summary.revenue?.total || payments.totalAmount || 0)}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.main', color: 'white' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    إجمالي المصروفات
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(summary.expenses?.total || expenses.totalAmount || 0)}
                  </Typography>
                </Box>
                <TrendingDown sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    صافي الربح
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(summary.profit?.net || 0)}
                  </Typography>
                </Box>
                <AccountBalance sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    المديونيات المستحقة
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(summary.outstanding?.amount || invoices.unpaidAmount || 0)}
                  </Typography>
                </Box>
                <Receipt sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          إجراءات سريعة
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Receipt />}
              onClick={() => navigate('/financial/invoices/create')}
              sx={{ py: 1.5 }}
            >
              إنشاء فاتورة
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<CreditCard />}
              onClick={() => navigate('/financial/payments/create')}
              sx={{ py: 1.5 }}
            >
              تسجيل دفعة
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AttachMoney />}
              onClick={() => navigate('/financial/expenses/create')}
              sx={{ py: 1.5 }}
            >
              إضافة مصروف
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ArrowForward />}
              onClick={() => navigate('/reports/financial')}
              sx={{ py: 1.5 }}
            >
              التقارير المالية
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Detailed Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <FinancialSummaryCard
            title="ملخص الفواتير"
            data={invoices}
            loading={false}
            icon={Receipt}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FinancialSummaryCard
            title="ملخص المدفوعات"
            data={payments}
            loading={false}
            icon={CreditCard}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FinancialSummaryCard
            title="ملخص المصروفات"
            data={expenses}
            loading={false}
            icon={AttachMoney}
          />
        </Grid>
      </Grid>

      {/* Links to Detailed Pages */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          صفحات النظام المالي
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Receipt />}
              endIcon={<ArrowForward />}
              onClick={() => navigate('/financial/invoices')}
            >
              الفواتير
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<CreditCard />}
              endIcon={<ArrowForward />}
              onClick={() => navigate('/financial/payments')}
            >
              المدفوعات
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AttachMoney />}
              endIcon={<ArrowForward />}
              onClick={() => navigate('/financial/expenses')}
            >
              المصروفات
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<CalendarToday />}
              endIcon={<ArrowForward />}
              onClick={() => navigate('/reports/financial')}
            >
              التقارير
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default FinancialDashboardPage;

