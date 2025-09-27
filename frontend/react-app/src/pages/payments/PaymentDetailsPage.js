import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SimpleCard, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import paymentService from '../../services/paymentService';

export default function PaymentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    if (id) {
      loadPaymentDetails();
    }
  }, [id]);

  const loadPaymentDetails = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPaymentById(id);
      setPayment(response);
    } catch (error) {
      console.error('Error loading payment details:', error);
      addNotification('خطأ في تحميل تفاصيل الدفعة', 'error');
      navigate('/payments');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    navigate(`/payments/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الدفعة؟')) {
      return;
    }

    try {
      setLoading(true);
      const response = await paymentService.deletePayment(id);
      
      if (response.success) {
        addNotification('تم حذف الدفعة بنجاح', 'success');
        navigate('/payments');
      } else {
        throw new Error(response.error || 'فشل في حذف الدفعة');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      addNotification(error.message || 'خطأ في حذف الدفعة', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900">الدفعة غير موجودة</h2>
        <SimpleButton
          onClick={() => navigate('/payments')}
          className="mt-4"
        >
          العودة للمدفوعات
        </SimpleButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">تفاصيل الدفعة</h1>
          <p className="text-gray-600">رقم الدفعة: #{payment.id}</p>
        </div>
        <div className="flex space-x-3 rtl:space-x-reverse">
          <SimpleButton
            onClick={handlePrint}
            variant="outline"
          >
            طباعة
          </SimpleButton>
          <SimpleButton
            onClick={handleEdit}
            className="bg-blue-600 hover:bg-blue-700"
          >
            تعديل
          </SimpleButton>
          <SimpleButton
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            حذف
          </SimpleButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Details */}
        <SimpleCard>
          <SimpleCardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">تفاصيل الدفعة</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">المبلغ:</span>
                <span className="font-semibold text-lg text-green-600">
                  {paymentService.formatAmount(payment.amount, payment.currency)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">طريقة الدفع:</span>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <span className="text-xl">{paymentService.getPaymentMethodIcon(payment.paymentMethod)}</span>
                  <span className="font-medium">
                    {paymentService.getPaymentMethods().find(m => m.value === payment.paymentMethod)?.label}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">تاريخ الدفع:</span>
                <span className="font-medium">{paymentService.formatDate(payment.paymentDate)}</span>
              </div>
              
              {payment.referenceNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">رقم المرجع:</span>
                  <span className="font-medium">{payment.referenceNumber}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">تاريخ الإنشاء:</span>
                <span className="font-medium">{paymentService.formatDate(payment.createdAt)}</span>
              </div>
              
              {payment.notes && (
                <div>
                  <span className="text-gray-600 block mb-2">ملاحظات:</span>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {payment.notes}
                  </p>
                </div>
              )}
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* Invoice Details */}
        <SimpleCard>
          <SimpleCardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">تفاصيل الفاتورة</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">رقم الفاتورة:</span>
                <span className="font-medium">{payment.invoiceNumber || 'غير محدد'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">إجمالي الفاتورة:</span>
                <span className="font-medium">
                  {paymentService.formatAmount(payment.invoiceFinal, payment.currency)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">المدفوع:</span>
                <span className="font-medium text-green-600">
                  {paymentService.formatAmount(payment.totalPaid, payment.currency)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">المتبقي:</span>
                <span className={`font-medium ${payment.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {paymentService.formatAmount(payment.remainingAmount, payment.currency)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">حالة الفاتورة:</span>
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                  payment.invoiceStatus === 'paid' ? 'bg-green-100 text-green-800' :
                  payment.invoiceStatus === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
                  payment.invoiceStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {payment.invoiceStatus === 'paid' ? 'مدفوعة' : 
                   payment.invoiceStatus === 'partially_paid' ? 'مدفوعة جزئياً' : 
                   payment.invoiceStatus === 'overdue' ? 'متأخرة' : 'مسودة'}
                </span>
              </div>
              
              {payment.invoiceDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">تاريخ الفاتورة:</span>
                  <span className="font-medium">{paymentService.formatDate(payment.invoiceDate)}</span>
                </div>
              )}
              
              {payment.invoiceDueDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">تاريخ الاستحقاق:</span>
                  <span className="font-medium">{paymentService.formatDate(payment.invoiceDueDate)}</span>
                </div>
              )}
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>

      {/* Customer Details */}
      {payment.customerFirstName && (
        <SimpleCard>
          <SimpleCardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">تفاصيل العميل</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-gray-600 block">الاسم:</span>
                <span className="font-medium">
                  {payment.customerFirstName} {payment.customerLastName}
                </span>
              </div>
              {payment.customerPhone && (
                <div>
                  <span className="text-gray-600 block">الهاتف:</span>
                  <span className="font-medium">{payment.customerPhone}</span>
                </div>
              )}
              {payment.customerEmail && (
                <div>
                  <span className="text-gray-600 block">البريد الإلكتروني:</span>
                  <span className="font-medium">{payment.customerEmail}</span>
                </div>
              )}
            </div>
          </SimpleCardContent>
        </SimpleCard>
      )}

      {/* Created By */}
      {payment.createdByFirstName && (
        <SimpleCard>
          <SimpleCardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات الإنشاء</h2>
            <div className="flex justify-between">
              <span className="text-gray-600">أنشئ بواسطة:</span>
              <span className="font-medium">
                {payment.createdByFirstName} {payment.createdByLastName}
              </span>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      )}

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            font-size: 12px;
          }
          
          .print-break {
            page-break-before: always;
          }
        }
      `}</style>
    </div>
  );
}

