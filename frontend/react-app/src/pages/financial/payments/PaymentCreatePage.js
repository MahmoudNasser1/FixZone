// Payment Create Page
// Page for creating new payment

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { usePayments } from '../../../hooks/financial/usePayments';
import PaymentForm from '../../../components/financial/payments/PaymentForm';

const PaymentCreatePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoiceId');
  const { createPayment, loading } = usePayments();

  const [formData, setFormData] = useState({
    invoiceId: invoiceId || '',
    amount: '',
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (invoiceId) {
      setFormData(prev => ({ ...prev, invoiceId }));
    }
  }, [invoiceId]);

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.invoiceId) {
      newErrors.invoiceId = 'الفاتورة مطلوبة';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'المبلغ يجب أن يكون موجب';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'طريقة الدفع مطلوبة';
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'تاريخ الدفع مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const payment = await createPayment({
        ...formData,
        amount: parseFloat(formData.amount),
        invoiceId: parseInt(formData.invoiceId)
      });

      navigate(`/financial/invoices/${formData.invoiceId}`);
    } catch (error) {
      console.error('Error creating payment:', error);
    }
  };


  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(invoiceId ? `/financial/invoices/${invoiceId}` : '/financial/payments')}
          sx={{ mr: 2 }}
        >
          رجوع
        </Button>
        <Typography variant="h4" component="h1">
          إضافة دفعة جديدة
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <PaymentForm
            formData={formData}
            errors={errors}
            onChange={handleChange}
            invoiceId={invoiceId}
          />

          <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
            <Button
              variant="outlined"
              onClick={() => navigate(invoiceId ? `/financial/invoices/${invoiceId}` : '/financial/payments')}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default PaymentCreatePage;

