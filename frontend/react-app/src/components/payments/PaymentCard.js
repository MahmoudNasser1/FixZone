import React from 'react';
import { SimpleCard, SimpleCardContent } from '../ui/SimpleCard';
import SimpleBadge from '../ui/SimpleBadge';
import paymentService from '../../services/paymentService';

const PaymentCard = ({ payment, onEdit, onDelete, onView }) => {
  const formatAmount = (amount, currency) => {
    return paymentService.formatAmount(amount, currency);
  };

  const formatDate = (date) => {
    return paymentService.formatDate(date);
  };

  const getPaymentMethodIcon = (method) => {
    return paymentService.getPaymentMethodIcon(method);
  };

  const getStatusColor = (status) => {
    return paymentService.getPaymentStatusColor(status);
  };

  return (
    <SimpleCard className="hover:shadow-lg transition-shadow duration-200">
      <SimpleCardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="text-2xl">{getPaymentMethodIcon(payment.paymentMethod)}</span>
            <div>
              <h3 className="font-semibold text-gray-900">
                {formatAmount(payment.amount, payment.currency)}
              </h3>
              <p className="text-sm text-gray-600">
                {payment.invoiceNumber && `فاتورة: ${payment.invoiceNumber}`}
              </p>
            </div>
          </div>
          <SimpleBadge 
            color={getStatusColor(payment.invoiceStatus || 'draft')}
            size="sm"
          >
            {payment.invoiceStatus === 'paid' ? 'مدفوعة' : 
             payment.invoiceStatus === 'partially_paid' ? 'مدفوعة جزئياً' : 
             payment.invoiceStatus === 'overdue' ? 'متأخرة' : 'مسودة'}
          </SimpleBadge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">طريقة الدفع:</span>
            <span className="font-medium">
              {paymentService.getPaymentMethods().find(m => m.value === payment.paymentMethod)?.label}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">تاريخ الدفع:</span>
            <span className="font-medium">{formatDate(payment.paymentDate)}</span>
          </div>

          {payment.customerName && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">العميل:</span>
              <span className="font-medium">
                {payment.customerName}
              </span>
            </div>
          )}

          {payment.referenceNumber && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">رقم المرجع:</span>
              <span className="font-medium">{payment.referenceNumber}</span>
            </div>
          )}

          {payment.remainingAmount !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">المتبقي:</span>
              <span className={`font-medium ${payment.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatAmount(payment.remainingAmount, payment.currency)}
              </span>
            </div>
          )}
        </div>

        {payment.notes && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {payment.notes}
            </p>
          </div>
        )}

        <div className="flex flex-col items-center pt-3 border-t">
          {payment.createdByFirstName && (
            <div className="text-xs text-gray-500 mb-3">
              بواسطة: {payment.createdByFirstName} {payment.createdByLastName}
            </div>
          )}
          
          <div className="flex justify-center items-center gap-3 w-full">
            {onView && (
              <button
                onClick={() => onView(payment)}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-300 rounded-full text-sm font-medium transition-colors duration-200"
              >
                عرض
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(payment)}
                className="px-4 py-2 text-green-600 hover:text-green-800 hover:bg-green-50 border border-green-300 rounded-full text-sm font-medium transition-colors duration-200"
              >
                تعديل
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(payment)}
                className="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-300 rounded-full text-sm font-medium transition-colors duration-200"
              >
                حذف
              </button>
            )}
          </div>
        </div>
      </SimpleCardContent>
    </SimpleCard>
  );
};

export default PaymentCard;

