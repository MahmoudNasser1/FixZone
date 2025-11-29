// Payment Form Component
// Reusable form component for creating/editing payments

import React, { useState, useEffect } from 'react';
import {
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Alert,
  Box
} from '@mui/material';
import invoicesService from '../../../services/financial/invoicesService';

const PaymentForm = ({ formData, errors, onChange, invoiceId: propInvoiceId }) => {
  const [invoice, setInvoice] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const invoiceId = propInvoiceId || formData.invoiceId;

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const fetchInvoice = async () => {
    setLoadingInvoice(true);
    try {
      const response = await invoicesService.getById(invoiceId);
      if (response.success) {
        setInvoice(response.data);
        // Set max amount as remaining amount
        const remaining = (response.data.totalAmount || 0) - (response.data.amountPaid || 0);
        if (remaining > 0 && !formData.amount) {
          onChange('amount', remaining.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount || 0);
  };

  const remainingAmount = invoice 
    ? (invoice.totalAmount || 0) - (invoice.amountPaid || 0)
    : null;

  return (
    <Grid container spacing={3}>
      {invoice && (
        <Grid item xs={12}>
          <Alert severity="info">
            <Box>
              <strong>الفاتورة:</strong> {invoice.invoiceNumber || `#${invoice.id}`} | 
              <strong> الإجمالي:</strong> {formatCurrency(invoice.totalAmount)} | 
              <strong> المدفوع:</strong> {formatCurrency(invoice.amountPaid || 0)} | 
              <strong> المتبقي:</strong> {formatCurrency(remainingAmount)}
            </Box>
          </Alert>
        </Grid>
      )}

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="رقم الفاتورة *"
          name="invoiceId"
          type="number"
          value={formData.invoiceId || ''}
          onChange={handleChange}
          error={!!errors.invoiceId}
          helperText={errors.invoiceId}
          disabled={!!propInvoiceId}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="المبلغ *"
          name="amount"
          type="number"
          value={formData.amount || ''}
          onChange={handleChange}
          error={!!errors.amount}
          helperText={errors.amount || (remainingAmount !== null && `الحد الأقصى: ${formatCurrency(remainingAmount)}`)}
          inputProps={{ 
            min: 0, 
            step: 0.01,
            max: remainingAmount || undefined
          }}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth error={!!errors.paymentMethod} required>
          <InputLabel>طريقة الدفع *</InputLabel>
          <Select
            name="paymentMethod"
            value={formData.paymentMethod || 'cash'}
            onChange={handleChange}
            label="طريقة الدفع *"
          >
            <MenuItem value="cash">نقدي</MenuItem>
            <MenuItem value="card">بطاقة</MenuItem>
            <MenuItem value="bank_transfer">تحويل بنكي</MenuItem>
            <MenuItem value="check">شيك</MenuItem>
            <MenuItem value="other">أخرى</MenuItem>
          </Select>
          {errors.paymentMethod && (
            <FormHelperText>{errors.paymentMethod}</FormHelperText>
          )}
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="تاريخ الدفع *"
          name="paymentDate"
          type="date"
          value={formData.paymentDate || ''}
          onChange={handleChange}
          error={!!errors.paymentDate}
          helperText={errors.paymentDate}
          InputLabelProps={{ shrink: true }}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="رقم المرجع"
          name="referenceNumber"
          value={formData.referenceNumber || ''}
          onChange={handleChange}
          helperText="رقم المرجع أو رقم المعاملة"
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="ملاحظات"
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          multiline
          rows={3}
        />
      </Grid>
    </Grid>
  );
};

export default PaymentForm;


