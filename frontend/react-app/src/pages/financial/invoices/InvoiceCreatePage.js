// Invoice Create Page
// Page for creating new invoice

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft as ArrowBackIcon,
  Save as SaveIcon,
  Loader2
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/Alert';
import { Separator } from '../../../components/ui/Separator';
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
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/financial/invoices')}
          className="mr-4"
        >
          <ArrowBackIcon className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <h1 className="text-3xl font-bold">
          إنشاء فاتورة جديدة
        </h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-8">
              <div>
                <InvoiceForm
                  formData={formData}
                  errors={errors}
                  onChange={handleChange}
                  customers={customers}
                  repairs={repairs}
                  loading={loadingData}
                />
              </div>

              <div>
                <Separator className="my-6" />
                <InvoiceItemsForm
                  items={items}
                  onChange={handleItemsChange}
                  errors={errors}
                />
              </div>

              {/* Summary */}
              <div className="md:col-span-2 flex justify-end">
                <div className="w-full max-w-md space-y-4 bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">المجموع الفرعي</span>
                    <span>{formatCurrency(formData.totalAmount)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">الضريبة ({formData.taxRate}%)</span>
                    <span>{formatCurrency(formData.taxAmount)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">الخصم</span>
                    <span className="text-red-500">-{formatCurrency(formData.discountAmount)}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-bold text-lg">
                    <span>الإجمالي النهائي</span>
                    <span className="text-primary">{formatCurrency(finalTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {/* Error Message */}
                {submitError && (
                  <Alert variant="destructive">
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                {/* Repair Info Alert */}
                {repairData && (
                  <Alert className="bg-blue-50 text-blue-900 border-blue-200">
                    <AlertTitle>معلومات الإصلاح</AlertTitle>
                    <AlertDescription>
                      يتم إنشاء الفاتورة لطلب الإصلاح رقم: {repairData.id} - {repairData.reportedProblem || 'لا يوجد وصف'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => navigate('/financial/invoices')}
                  disabled={loading}
                >
                  إلغاء
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={loading || items.length === 0}
                  className="flex items-center gap-2"
                >
                  <SaveIcon className="h-4 w-4" />
                  {loading ? 'جاري الحفظ...' : 'حفظ كمسودة'}
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="min-w-[120px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    'حفظ وإرسال'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceCreatePage;

