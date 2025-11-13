import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { CreditCard, CheckCircle, Clock, AlertCircle, Calendar, DollarSign } from 'lucide-react';

const PaymentHistory = ({ payments = [] }) => {
  const { formatMoney } = useSettings();
  
  const formatCurrency = (amount, currency = 'EGP') => {
    return formatMoney(amount || 0, currency);
  };

  const formatDate = (date) => {
    if (!date) return 'غير محدد';
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'تاريخ غير صحيح';
      return dateObj.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'Date value:', date);
      return 'تاريخ غير صحيح';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'cash':
        return '💵';
      case 'card':
        return '💳';
      case 'bank_transfer':
        return '🏦';
      case 'check':
        return '📄';
      default:
        return '💰';
    }
  };

  const getPaymentMethodText = (method) => {
    const methods = {
      'cash': 'نقداً',
      'card': 'بطاقة ائتمان',
      'bank_transfer': 'تحويل بنكي',
      'check': 'شيك',
      'online': 'دفع إلكتروني'
    };
    return methods[method?.toLowerCase()] || method || 'غير محدد';
  };

  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مدفوعات</h3>
        <p className="text-gray-500">لم يتم تسجيل أي مدفوعات لهذه الفاتورة بعد</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">تاريخ المدفوعات</h3>
        <span className="text-sm text-gray-500">
          {payments.length} دفعة
        </span>
      </div>

      {payments.map((payment, index) => (
        <div key={payment.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Payment Icon */}
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">{getPaymentMethodIcon(payment.paymentMethod)}</span>
              </div>

              {/* Payment Details */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">
                    {formatCurrency(payment.amount, payment.currency)}
                  </h4>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <CreditCard className="w-4 h-4" />
                    <span>{getPaymentMethodText(payment.paymentMethod)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(payment.createdAt)}</span>
                  </div>
                </div>

                {payment.reference && (
                  <div className="mt-1 text-xs text-gray-500">
                    المرجع: {payment.reference}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Status */}
            <div className="text-right">
              <div className="flex items-center gap-1 text-green-600 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">مكتمل</span>
              </div>
              <div className="text-xs text-gray-500">
                بواسطة: {payment.userName || 'نظام'}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">إجمالي المدفوعات:</span>
            <span className="font-semibold">
              {formatCurrency(payments.reduce((sum, payment) => sum + (payment.amount || 0), 0), 'EGP')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">عدد المدفوعات:</span>
            <span className="font-semibold">{payments.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
