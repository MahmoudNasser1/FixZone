import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SimpleCard, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import PaymentForm from '../../components/payments/PaymentForm';
import paymentService from '../../services/paymentService';
import { useNotifications } from '../../components/notifications/NotificationSystem';

const EditPaymentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPayment();
  }, [id]);

  const loadPayment = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPaymentById(id);
      // Handle different response structures
      const paymentData = response.payment || response.data || response;
      setPayment(paymentData);
    } catch (error) {
      console.error('Error loading payment:', error);
      addNotification({ type: 'error', message: 'فشل في تحميل بيانات المدفوعة' });
      navigate('/payments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setSaving(true);
      await paymentService.updatePayment(id, formData);
      addNotification({ type: 'success', message: 'تم تحديث المدفوعة بنجاح' });
      navigate('/payments');
    } catch (error) {
      console.error('Error updating payment:', error);
      addNotification({ type: 'error', message: 'فشل في تحديث المدفوعة' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/payments');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل بيانات المدفوعة...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">المدفوعة غير موجودة</h2>
          <SimpleButton onClick={() => navigate('/payments')}>
            العودة للمدفوعات
          </SimpleButton>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">تعديل المدفوعة</h1>
              <p className="text-muted-foreground mt-1">
                تعديل مدفوعة #{payment.id} - {paymentService.formatAmount(payment.amount)}
              </p>
            </div>
            <SimpleButton
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
            >
              إلغاء
            </SimpleButton>
          </div>
        </div>

        {/* Payment Info Card */}
        <SimpleCard className="mb-6">
          <SimpleCardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">معلومات المدفوعة الحالية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">رقم المدفوعة:</span>
                <p className="font-medium">#{payment.id}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">المبلغ:</span>
                <p className="font-medium text-emerald-600 dark:text-emerald-400">
                  {paymentService.formatAmount(payment.amount)}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">طريقة الدفع:</span>
                <p className="font-medium">
                  {paymentService.getPaymentMethods().find(m => m.value === payment.paymentMethod)?.label}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">تاريخ الدفع:</span>
                <p className="font-medium">{paymentService.formatDate(payment.paymentDate)}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">رقم المرجع:</span>
                <p className="font-medium">{payment.referenceNumber || 'غير محدد'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">تاريخ الإنشاء:</span>
                <p className="font-medium">{paymentService.formatDate(payment.createdAt)}</p>
              </div>
            </div>
            {payment.notes && (
              <div className="mt-4">
                <span className="text-sm text-muted-foreground">الملاحظات:</span>
                <p className="font-medium mt-1">{payment.notes}</p>
              </div>
            )}
          </SimpleCardContent>
        </SimpleCard>

        {/* Edit Form */}
        <SimpleCard>
          <SimpleCardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">تعديل المدفوعة</h3>
            <PaymentForm
              payment={payment}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={saving}
            />
          </SimpleCardContent>
        </SimpleCard>
      </div>
    </div>
  );
};

export default EditPaymentPage;
