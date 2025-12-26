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
    <SimpleCard className="hover:shadow-lg transition-shadow duration-200 border-border">
      <SimpleCardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="text-2xl">{getPaymentMethodIcon(payment.paymentMethod)}</span>
            <div>
              <h3 className="font-semibold text-foreground">
                {formatAmount(payment.amount, payment.currency)}
              </h3>
              <p className="text-sm text-muted-foreground">
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
            <span className="text-muted-foreground">طريقة الدفع:</span>
            <span className="font-medium text-foreground">
              {paymentService.getPaymentMethods().find(m => m.value === payment.paymentMethod)?.label}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">تاريخ الدفع:</span>
            <span className="font-medium text-foreground">{formatDate(payment.paymentDate)}</span>
          </div>

          {payment.customerName && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">العميل:</span>
              <span className="font-medium text-foreground">
                {payment.customerName}
              </span>
            </div>
          )}

          {payment.referenceNumber && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">رقم المرجع:</span>
              <span className="font-medium text-foreground">{payment.referenceNumber}</span>
            </div>
          )}

          {payment.remainingAmount !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">المتبقي:</span>
              <span className={`font-medium ${payment.remainingAmount > 0 ? 'text-error' : 'text-success'}`}>
                {formatAmount(payment.remainingAmount, payment.currency)}
              </span>
            </div>
          )}
        </div>

        {payment.notes && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
              {payment.notes}
            </p>
          </div>
        )}

        <div className="flex flex-col items-center pt-3 border-t border-border">
          {payment.createdByFirstName && (
            <div className="text-xs text-muted-foreground mb-3">
              بواسطة: {payment.createdByFirstName} {payment.createdByLastName}
            </div>
          )}

          <div className="flex justify-center items-center gap-3 w-full">
            {onView && (
              <button
                onClick={() => onView(payment)}
                className="px-4 py-2 text-primary hover:bg-primary/10 border border-primary/30 rounded-full text-sm font-medium transition-colors duration-200"
              >
                عرض
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(payment)}
                className="px-4 py-2 text-success hover:bg-success/10 border border-success/30 rounded-full text-sm font-medium transition-colors duration-200"
              >
                تعديل
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(payment)}
                className="px-4 py-2 text-error hover:bg-error/10 border border-error/30 rounded-full text-sm font-medium transition-colors duration-200"
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

