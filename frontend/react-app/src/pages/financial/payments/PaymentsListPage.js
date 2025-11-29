// Payments List Page
// Main page for viewing and managing payments

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { usePayments } from '../../../hooks/financial/usePayments';
import FinancialSummaryCard from '../../../components/financial/shared/FinancialSummaryCard';

const PaymentsListPage = () => {
  const navigate = useNavigate();
  const {
    payments,
    loading,
    error,
    pagination,
    setPagination,
    stats,
    refetch
  } = usePayments();

  const handleCreate = () => {
    navigate('/financial/payments/create');
  };

  const handlePageChange = (event, newPage) => {
    setPagination({ ...pagination, page: newPage + 1 });
  };

  const handleRowsPerPageChange = (event) => {
    setPagination({ ...pagination, limit: parseInt(event.target.value, 10), page: 1 });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-EG');
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      cash: 'نقدي',
      card: 'بطاقة',
      bank_transfer: 'تحويل بنكي',
      check: 'شيك',
      other: 'أخرى'
    };
    return methods[method] || method;
  };

  if (error && !payments.length) {
    const errorMessage = typeof error === 'string' 
      ? error 
      : error?.message || error?.title || 'حدث خطأ غير متوقع';
    return (
      <Box p={3}>
        <Typography color="error">خطأ: {errorMessage}</Typography>
        <Button onClick={refetch} variant="outlined" sx={{ mt: 2 }}>
          إعادة المحاولة
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          المدفوعات
        </Typography>
        <Box>
          <Tooltip title="تحديث">
            <IconButton onClick={refetch} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            sx={{ ml: 1 }}
          >
            إضافة دفعة جديدة
          </Button>
        </Box>
      </Box>

      {/* Summary Card */}
      <Box mb={3}>
        <FinancialSummaryCard
          title="ملخص المدفوعات"
          data={stats && typeof stats === 'object' && !Array.isArray(stats) ? stats : null}
          loading={loading}
          icon={ReceiptIcon}
        />
      </Box>

      {/* Payments Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>التاريخ</TableCell>
              <TableCell>الفاتورة</TableCell>
              <TableCell>العميل</TableCell>
              <TableCell>المبلغ</TableCell>
              <TableCell>طريقة الدفع</TableCell>
              <TableCell>الحالة</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  لا توجد مدفوعات
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id} hover>
                  <TableCell>{formatDate(payment.paymentDate || payment.createdAt)}</TableCell>
                  <TableCell>
                    {payment.invoiceNumber || `#${payment.invoiceId}`}
                  </TableCell>
                  <TableCell>{payment.customerName || '-'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(payment.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getPaymentMethodLabel(payment.paymentMethod)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={payment.invoiceStatus === 'paid' ? 'مدفوعة' : 'جزئية'}
                      size="small"
                      color={payment.invoiceStatus === 'paid' ? 'success' : 'warning'}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page - 1}
          onPageChange={handlePageChange}
          rowsPerPage={pagination.limit}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="عدد الصفوف:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} من ${count !== -1 ? count : `أكثر من ${to}`}`
          }
        />
      </TableContainer>
    </Box>
  );
};

export default PaymentsListPage;


