// Payment Create Page
// Page for creating new payment

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SimpleCard, SimpleCardContent } from '../../../components/ui/SimpleCard';
import SimpleButton from '../../../components/ui/SimpleButton';
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
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <SimpleButton
            variant="ghost"
            size="sm"
            onClick={() => navigate(invoiceId ? `/financial/invoices/${invoiceId}` : '/financial/payments')}
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            رجوع
          </SimpleButton>
          <h1 className="text-3xl font-bold text-foreground">إضافة دفعة جديدة</h1>
        </div>

        {/* Form */}
        <SimpleCard>
          <SimpleCardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <PaymentForm
                formData={formData}
                errors={errors}
                onChange={handleChange}
                invoiceId={invoiceId}
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <SimpleButton
                  type="button"
                  variant="outline"
                  onClick={() => navigate(invoiceId ? `/financial/invoices/${invoiceId}` : '/financial/payments')}
                >
                  إلغاء
                </SimpleButton>
                <SimpleButton
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ'}
                </SimpleButton>
              </div>
            </form>
          </SimpleCardContent>
        </SimpleCard>
      </div>
    </div>
  );
};

export default PaymentCreatePage;
