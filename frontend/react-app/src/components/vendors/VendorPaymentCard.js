import React from 'react';
import { SimpleCard, SimpleCardContent } from '../ui/SimpleCard';
import SimpleBadge from '../ui/SimpleBadge';
import SimpleButton from '../ui/SimpleButton';
import { Edit2, Trash2, Eye } from 'lucide-react';

const VendorPaymentCard = ({ payment, onEdit, onDelete, onView }) => {
  const formatAmount = (amount) => {
    if (!amount) return '0.00';
    return parseFloat(amount).toLocaleString('ar-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' ج.م';
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      cash: 'نقدي',
      bank_transfer: 'حوالة بنكية',
      check: 'شيك',
      credit_card: 'بطاقة ائتمان'
    };
    return methods[method] || method;
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      cash: '💵',
      bank_transfer: '🏦',
      check: '📝',
      credit_card: '💳'
    };
    return icons[method] || '💰';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'yellow',
      completed: 'green',
      cancelled: 'red'
    };
    return colors[status] || 'gray';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'قيد الانتظار',
      completed: 'مكتمل',
      cancelled: 'ملغي'
    };
    return labels[status] || status;
  };

  return (
    <SimpleCard className="hover:shadow-lg transition-shadow duration-200">
      <SimpleCardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="text-2xl">{getPaymentMethodIcon(payment.paymentMethod)}</span>
            <div>
              <h3 className="font-semibold text-gray-900">
                {formatAmount(payment.amount)}
              </h3>
              <p className="text-sm text-gray-600">
                {payment.paymentNumber && `#${payment.paymentNumber}`}
              </p>
            </div>
          </div>
          <SimpleBadge 
            color={getStatusColor(payment.status)}
            size="sm"
          >
            {getStatusLabel(payment.status)}
          </SimpleBadge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">طريقة الدفع:</span>
            <span className="font-medium">
              {getPaymentMethodLabel(payment.paymentMethod)}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">تاريخ الدفع:</span>
            <span className="font-medium">{formatDate(payment.paymentDate)}</span>
          </div>

          {payment.purchaseOrderNumber && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">طلب الشراء:</span>
              <span className="font-medium">
                {payment.purchaseOrderNumber}
              </span>
            </div>
          )}

          {payment.referenceNumber && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">رقم المرجع:</span>
              <span className="font-medium">{payment.referenceNumber}</span>
            </div>
          )}

          {payment.bankName && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">البنك:</span>
              <span className="font-medium">{payment.bankName}</span>
            </div>
          )}

          {payment.checkNumber && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">رقم الشيك:</span>
              <span className="font-medium">{payment.checkNumber}</span>
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

        <div className="flex justify-between items-center pt-3 border-t">
          <div className="text-xs text-gray-500">
            {payment.createdByName && `بواسطة: ${payment.createdByName}`}
          </div>
          
          <div className="flex space-x-2 rtl:space-x-reverse">
            {onView && (
              <SimpleButton
                variant="ghost"
                size="sm"
                onClick={() => onView(payment)}
                title="عرض التفاصيل"
              >
                <Eye className="w-4 h-4" />
              </SimpleButton>
            )}
            {onEdit && (
              <SimpleButton
                variant="ghost"
                size="sm"
                onClick={() => onEdit(payment)}
                title="تعديل"
              >
                <Edit2 className="w-4 h-4" />
              </SimpleButton>
            )}
            {onDelete && (
              <SimpleButton
                variant="ghost"
                size="sm"
                onClick={() => onDelete(payment)}
                title="حذف"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </SimpleButton>
            )}
          </div>
        </div>
      </SimpleCardContent>
    </SimpleCard>
  );
};

export default VendorPaymentCard;

