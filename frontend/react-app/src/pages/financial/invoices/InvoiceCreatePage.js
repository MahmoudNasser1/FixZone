// Invoice Create Page
// Page for creating new invoice

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import { useInvoices } from '../../../hooks/financial/useInvoices';
import InvoiceForm from '../../../components/financial/invoices/InvoiceForm';
import InvoiceItemsForm from '../../../components/financial/invoices/InvoiceItemsForm';
import apiService from '../../../services/api';
import { useNotifications } from '../../../components/notifications/NotificationSystem';

const InvoiceCreatePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const repairId = searchParams.get('repairId');
  const { createInvoice, createFromRepair, loading } = useInvoices();
  const notifications = useNotifications();
  const notify = (type, message) => {
    if (notifications?.addNotification) {
      notifications.addNotification({ type, message });
    }
  };

  const [formData, setFormData] = useState({
    repairRequestId: repairId || '',
    customerId: '',
    totalAmount: 0,
    taxAmount: 0,
    discountAmount: 0,
    discountPercent: 0,
    dueDate: '',
    notes: '',
    currency: 'EGP',
    status: 'draft',
    taxRate: 14 // نسبة الضريبة
  });

  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [customers, setCustomers] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [repairData, setRepairData] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = (name, value) => {
    // Handle both direct calls and event objects
    const fieldName = typeof name === 'string' ? name : name?.target?.name || name?.name;
    const fieldValue = typeof name === 'string' ? value : name?.target?.value || name?.value || value;
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: fieldValue
    }));
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  const handleItemsChange = (updatedItems) => {
    setItems(updatedItems);
    // Recalculate total
    const newTotal = updatedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const newTaxAmount = (newTotal * (formData.taxRate || 14)) / 100;
    setFormData(prev => ({
      ...prev,
      totalAmount: newTotal,
      taxAmount: newTaxAmount
    }));
  };

  // Calculate discount amount from percentage
  const calculatedDiscountAmount = useMemo(() => {
    if (formData.discountPercent > 0 && formData.totalAmount > 0) {
      return (formData.totalAmount * formData.discountPercent) / 100;
    }
    return formData.discountAmount || 0;
  }, [formData.discountPercent, formData.totalAmount, formData.discountAmount]);

  // Calculate final total
  const finalTotal = useMemo(() => {
    return formData.totalAmount + formData.taxAmount - calculatedDiscountAmount;
  }, [formData.totalAmount, formData.taxAmount, calculatedDiscountAmount]);

  // Auto-calculate discount amount when discountPercent changes
  useEffect(() => {
    if (formData.discountPercent > 0 && formData.totalAmount > 0) {
      const calculatedDiscount = (formData.totalAmount * formData.discountPercent) / 100;
      if (Math.abs(calculatedDiscount - (formData.discountAmount || 0)) > 0.01) {
        setFormData(prev => ({
          ...prev,
          discountAmount: calculatedDiscount
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.discountPercent, formData.totalAmount]);

  // Auto-calculate tax when total or discount changes
  useEffect(() => {
    const newTaxAmount = (formData.totalAmount * (formData.taxRate || 14)) / 100;
    if (Math.abs(newTaxAmount - formData.taxAmount) > 0.01) {
      setFormData(prev => ({
        ...prev,
        taxAmount: newTaxAmount
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.totalAmount, formData.taxRate]);

  const validate = () => {
    const newErrors = {};

    if (items.length === 0) {
      newErrors.items = 'يجب إضافة عنصر واحد على الأقل';
    }

    if (!formData.customerId && !formData.repairRequestId) {
      newErrors.customerId = 'يجب اختيار عميل أو طلب إصلاح';
    }

    // Validate items
    items.forEach((item, index) => {
      if (!item.description || item.description.trim().length === 0) {
        newErrors[`item_${index}_description`] = 'وصف العنصر مطلوب';
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'الكمية يجب أن تكون أكبر من صفر';
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        newErrors[`item_${index}_unitPrice`] = 'السعر يجب أن يكون أكبر من صفر';
      }
    });

    if (formData.discountAmount < 0) {
      newErrors.discountAmount = 'الخصم لا يمكن أن يكون سالباً';
    }

    if (formData.discountAmount > formData.totalAmount) {
      newErrors.discountAmount = 'الخصم لا يمكن أن يكون أكبر من المجموع';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      notify('warning', 'يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    try {
      let invoice;
      // Prepare invoice data - Backend will recalculate totals from items
      const invoiceData = {
        customerId: formData.customerId || null,
        repairRequestId: formData.repairRequestId || null,
        currency: formData.currency || 'EGP',
        discountAmount: calculatedDiscountAmount,
        discountPercent: formData.discountPercent || 0,
        dueDate: formData.dueDate || null,
        notes: formData.notes || null,
        status: formData.status || 'draft',
        taxRate: formData.taxRate || 14, // Send tax rate to backend
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          inventoryItemId: item.inventoryItemId || null,
          serviceId: item.serviceId || null
        }))
      };

      if (formData.repairRequestId) {
        invoice = await createFromRepair(formData.repairRequestId, invoiceData);
      } else {
        invoice = await createInvoice(invoiceData);
      }

      notify('success', 'تم إنشاء الفاتورة بنجاح');
      navigate(`/financial/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'حدث خطأ أثناء إنشاء الفاتورة';
      setSubmitError(errorMessage);
      notify('error', errorMessage);
    }
  };

  const handleSaveDraft = async () => {
    setSubmitError(null);

    if (items.length === 0) {
      notify('warning', 'يجب إضافة عنصر واحد على الأقل لحفظ المسودة');
      return;
    }

    try {
      const invoiceData = {
        customerId: formData.customerId || null,
        repairRequestId: formData.repairRequestId || null,
        currency: formData.currency || 'EGP',
        discountAmount: formData.discountAmount || 0,
        dueDate: formData.dueDate || null,
        notes: formData.notes || null,
        status: 'draft',
        taxRate: formData.taxRate || 14,
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          inventoryItemId: item.inventoryItemId || null,
          serviceId: item.serviceId || null
        }))
      };

      let invoice;
      if (formData.repairRequestId) {
        invoice = await createFromRepair(formData.repairRequestId, invoiceData);
      } else {
        invoice = await createInvoice(invoiceData);
      }

      notify('success', 'تم حفظ الفاتورة كمسودة بنجاح');
      navigate(`/financial/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Error saving draft:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'حدث خطأ أثناء حفظ المسودة';
      setSubmitError(errorMessage);
      notify('error', errorMessage);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount || 0);
  };

  // Load customers and repairs on mount
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        // Load customers
        const customersData = await apiService.getCustomers({ limit: 100 });
        setCustomers(Array.isArray(customersData) ? customersData : customersData?.data || []);

        // Load repairs (only completed ones for invoice creation)
        const repairsResponse = await apiService.request('/repairs?status=completed&limit=100');
        if (repairsResponse?.success && repairsResponse?.data?.repairs) {
          setRepairs(repairsResponse.data.repairs);
        } else if (Array.isArray(repairsResponse)) {
          setRepairs(repairsResponse);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        notify('error', 'خطأ في تحميل البيانات');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load repair data if repairId is provided
  useEffect(() => {
    const loadRepairData = async () => {
      if (!repairId) return;

      try {
        setLoadingData(true);
        const repairResponse = await apiService.request(`/repairs/${repairId}`);
        if (repairResponse?.success && repairResponse?.data) {
          const repair = repairResponse.data;
          setRepairData(repair);
          
          // Auto-fill customer if repair has customer
          if (repair.customerId) {
            setFormData(prev => ({
              ...prev,
              customerId: repair.customerId
            }));
          }
        }
      } catch (error) {
        console.error('Error loading repair data:', error);
        notify('warning', 'لم يتم العثور على طلب الإصلاح');
      } finally {
        setLoadingData(false);
      }
    };

    loadRepairData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repairId]);

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/financial/invoices')}
          sx={{ mr: 2 }}
        >
          رجوع
        </Button>
        <Typography variant="h4" component="h1">
          إنشاء فاتورة جديدة
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <InvoiceForm
                formData={formData}
                errors={errors}
                onChange={handleChange}
                customers={customers}
                repairs={repairs}
                loading={loadingData}
              />
            </Grid>

            <Grid item xs={12}>
              <InvoiceItemsForm
                items={items}
                onChange={handleItemsChange}
                errors={errors}
              />
            </Grid>

            {/* Summary */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end">
                <Grid container spacing={2} sx={{ maxWidth: 400 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      المجموع الفرعي
                    </Typography>
                  </Grid>
                  <Grid item xs={6} align="right">
                    <Typography variant="body1">
                      {formatCurrency(formData.totalAmount)}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      الضريبة (14%)
                    </Typography>
                  </Grid>
                  <Grid item xs={6} align="right">
                    <Typography variant="body1">
                      {formatCurrency(formData.taxAmount)}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      الخصم
                    </Typography>
                  </Grid>
                  <Grid item xs={6} align="right">
                    <Typography variant="body1" color="error">
                      -{formatCurrency(formData.discountAmount)}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="h6">
                      الإجمالي النهائي
                    </Typography>
                  </Grid>
                  <Grid item xs={6} align="right">
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      {formatCurrency(finalTotal)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {/* Error Message */}
            {submitError && (
              <Grid item xs={12}>
                <Alert severity="error" onClose={() => setSubmitError(null)}>
                  {submitError}
                </Alert>
              </Grid>
            )}

            {/* Repair Info Alert */}
            {repairData && (
              <Grid item xs={12}>
                <Alert severity="info">
                  يتم إنشاء الفاتورة لطلب الإصلاح رقم: {repairData.id} - {repairData.reportedProblem || 'لا يوجد وصف'}
                </Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/financial/invoices')}
                  disabled={loading}
                >
                  إلغاء
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleSaveDraft}
                  disabled={loading || items.length === 0}
                  startIcon={<SaveIcon />}
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ كمسودة'}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      جاري الحفظ...
                    </>
                  ) : (
                    'حفظ وإرسال'
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default InvoiceCreatePage;

