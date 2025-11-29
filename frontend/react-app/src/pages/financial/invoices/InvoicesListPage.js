// Invoices List Page
// Main page for viewing and managing invoices

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
  Visibility as VisibilityIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { useInvoices } from '../../../hooks/financial/useInvoices';
import FinancialSummaryCard from '../../../components/financial/shared/FinancialSummaryCard';

const InvoicesListPage = () => {
  const navigate = useNavigate();
  const {
    invoices,
    loading,
    error,
    pagination,
    setPagination,
    stats,
    refetch
  } = useInvoices();

  const handleCreate = () => {
    navigate('/financial/invoices/create');
  };

  const handleView = (id) => {
    navigate(`/financial/invoices/${id}`);
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

  const getStatusLabel = (status) => {
    const statuses = {
      draft: 'مسودة',
      sent: 'مرسلة',
      paid: 'مدفوعة',
      partially_paid: 'مدفوعة جزئياً',
      overdue: 'متأخرة',
      cancelled: 'ملغاة'
    };
    return statuses[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      sent: 'info',
      paid: 'success',
      partially_paid: 'warning',
      overdue: 'error',
      cancelled: 'default'
    };
    return colors[status] || 'default';
  };

  if (error && !invoices.length) {
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
          الفواتير
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
            إنشاء فاتورة جديدة
          </Button>
        </Box>
      </Box>

      {/* Summary Card */}
      <Box mb={3}>
        <FinancialSummaryCard
          title="ملخص الفواتير"
          data={stats && typeof stats === 'object' && !Array.isArray(stats) ? stats : null}
          loading={loading}
          icon={DescriptionIcon}
        />
      </Box>

      {/* Invoices Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>رقم الفاتورة</TableCell>
              <TableCell>العميل</TableCell>
              <TableCell>التاريخ</TableCell>
              <TableCell>المبلغ الإجمالي</TableCell>
              <TableCell>المدفوع</TableCell>
              <TableCell>المتبقي</TableCell>
              <TableCell>الحالة</TableCell>
              <TableCell>إجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  لا توجد فواتير
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {invoice.invoiceNumber || `#${invoice.id}`}
                    </Typography>
                  </TableCell>
                  <TableCell>{invoice.customerName || '-'}</TableCell>
                  <TableCell>{formatDate(invoice.issueDate || invoice.createdAt)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(invoice.totalAmount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="success.main">
                      {formatCurrency(invoice.amountPaid || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="error.main">
                      {formatCurrency(invoice.amountRemaining || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(invoice.status)}
                      size="small"
                      color={getStatusColor(invoice.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="عرض التفاصيل">
                      <IconButton
                        size="small"
                        onClick={() => handleView(invoice.id)}
                        color="primary"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
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

export default InvoicesListPage;


