// Invoice Details Page
// Page for viewing invoice details

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useInvoices } from '../../../hooks/financial/useInvoices';
import { usePayments } from '../../../hooks/financial/usePayments';

const InvoiceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getById, generatePDF, loading: invoiceLoading } = useInvoices();
  const { getByInvoice, loading: paymentsLoading } = usePayments();

  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentsSummary, setPaymentsSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const invoiceData = await getById(id);
        setInvoice(invoiceData);

        // Fetch payments
        try {
          const paymentsData = await getByInvoice(id);
          setPayments(paymentsData.payments || []);
          setPaymentsSummary(paymentsData.summary || null);
        } catch (err) {
          console.error('Error fetching payments:', err);
        }
      } catch (error) {
        console.error('Error fetching invoice:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, getById, getByInvoice]);

  const handlePrint = async () => {
    try {
      const pdfBlob = await generatePDF(id);
      const url = window.URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handleEdit = () => {
    navigate(`/financial/invoices/${id}/edit`);
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

  if (loading) {
    return (
      <Box p={3}>
        <Typography>جاري التحميل...</Typography>
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box p={3}>
        <Typography color="error">الفاتورة غير موجودة</Typography>
        <Button onClick={() => navigate('/financial/invoices')} sx={{ mt: 2 }}>
          رجوع
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/financial/invoices')}
            sx={{ mr: 2 }}
          >
            رجوع
          </Button>
          <Typography variant="h4" component="h1">
            فاتورة #{invoice.invoiceNumber || invoice.id}
          </Typography>
        </Box>
        <Box>
          <Tooltip title="طباعة">
            <IconButton onClick={handlePrint} color="primary">
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="تعديل">
            <IconButton onClick={handleEdit} color="primary">
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Invoice Info */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              معلومات الفاتورة
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  رقم الفاتورة
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {invoice.invoiceNumber || `#${invoice.id}`}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  الحالة
                </Typography>
                <Chip
                  label={getStatusLabel(invoice.status)}
                  color={getStatusColor(invoice.status)}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  العميل
                </Typography>
                <Typography variant="body1">
                  {invoice.customerName || '-'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  تاريخ الإصدار
                </Typography>
                <Typography variant="body1">
                  {formatDate(invoice.issueDate || invoice.createdAt)}
                </Typography>
              </Grid>

              {invoice.dueDate && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    تاريخ الاستحقاق
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(invoice.dueDate)}
                  </Typography>
                </Grid>
              )}

              {invoice.notes && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    ملاحظات
                  </Typography>
                  <Typography variant="body1">
                    {invoice.notes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Invoice Items */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              عناصر الفاتورة
            </Typography>
            <Divider sx={{ my: 2 }} />

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>الوصف</TableCell>
                    <TableCell align="right">الكمية</TableCell>
                    <TableCell align="right">سعر الوحدة</TableCell>
                    <TableCell align="right">الإجمالي</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, index) => (
                      <TableRow key={item.id || index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.totalPrice)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        لا توجد عناصر
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box mt={3} display="flex" justifyContent="flex-end">
              <Grid container spacing={2} sx={{ maxWidth: 400 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    المجموع الفرعي
                  </Typography>
                </Grid>
                <Grid item xs={6} align="right">
                  <Typography variant="body1">
                    {formatCurrency(invoice.subtotal)}
                  </Typography>
                </Grid>

                {invoice.taxAmount > 0 && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        الضريبة (14%)
                      </Typography>
                    </Grid>
                    <Grid item xs={6} align="right">
                      <Typography variant="body1">
                        {formatCurrency(invoice.taxAmount)}
                      </Typography>
                    </Grid>
                  </>
                )}

                {invoice.discountAmount > 0 && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        الخصم
                      </Typography>
                    </Grid>
                    <Grid item xs={6} align="right">
                      <Typography variant="body1" color="error">
                        -{formatCurrency(invoice.discountAmount)}
                      </Typography>
                    </Grid>
                  </>
                )}

                <Grid item xs={6}>
                  <Typography variant="h6">
                    الإجمالي
                  </Typography>
                </Grid>
                <Grid item xs={6} align="right">
                  <Typography variant="h6" fontWeight="bold">
                    {formatCurrency(invoice.totalAmount)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Payments Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              المدفوعات
            </Typography>
            <Divider sx={{ my: 2 }} />

            {paymentsSummary && (
              <Box mb={3}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      المدفوع
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(paymentsSummary.totalPaid)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      المتبقي
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {formatCurrency(paymentsSummary.remaining)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}

            {paymentsLoading ? (
              <Typography>جاري التحميل...</Typography>
            ) : payments.length > 0 ? (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  سجل المدفوعات
                </Typography>
                {payments.map((payment) => (
                  <Box key={payment.id} mb={2} p={1} bgcolor="grey.50" borderRadius={1}>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(payment.amount)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formatDate(payment.paymentDate || payment.createdAt)} - {payment.paymentMethod}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">
                لا توجد مدفوعات
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InvoiceDetailsPage;


