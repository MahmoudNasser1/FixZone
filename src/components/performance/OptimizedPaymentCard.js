import React, { memo, useMemo, useCallback } from 'react';
import { SimpleCard, SimpleCardContent } from '../ui/SimpleCard';
import SimpleBadge from '../ui/SimpleBadge';
import SimpleButton from '../ui/SimpleButton';
import { 
  DollarSign, Calendar, User, CreditCard, 
  Eye, Edit, Trash2, CheckCircle, AlertTriangle
} from 'lucide-react';

const OptimizedPaymentCard = memo(({ 
  payment, 
  onView, 
  onEdit, 
  onDelete, 
  onSelect,
  isSelected = false,
  showActions = true 
}) => {
  
  // تحسين الأداء: حساب القيم مرة واحدة فقط
  const paymentInfo = useMemo(() => ({
    formattedAmount: payment.amount?.toLocaleString('ar-EG') || '0',
    formattedDate: payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('ar-EG') : '',
    statusColor: getStatusColor(payment.status),
    statusLabel: getStatusLabel(payment.status),
    methodIcon: getMethodIcon(payment.paymentMethod),
    methodLabel: getMethodLabel(payment.paymentMethod)
  }), [payment.amount, payment.paymentDate, payment.status, payment.paymentMethod]);

  // تحسين الأداء: استخدام useCallback للدوال
  const handleView = useCallback(() => {
    onView?.(payment);
  }, [onView, payment]);

  const handleEdit = useCallback(() => {
    onEdit?.(payment);
  }, [onEdit, payment]);

  const handleDelete = useCallback(() => {
    onDelete?.(payment);
  }, [onDelete, payment]);

  const handleSelect = useCallback(() => {
    onSelect?.(payment.id);
  }, [onSelect, payment.id]);

  return (
    <SimpleCard className={`transition-all duration-200 hover:shadow-md ${
      isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
    }`}>
      <SimpleCardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 space-x-reverse">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleSelect}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            )}
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  #{payment.id}
                </h3>
                <SimpleBadge color={paymentInfo.statusColor}>
                  {paymentInfo.statusLabel}
                </SimpleBadge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium">{paymentInfo.formattedAmount} EGP</span>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{paymentInfo.formattedDate}</span>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                  {paymentInfo.methodIcon}
                  <span>{paymentInfo.methodLabel}</span>
                </div>
                
                {payment.customerName && (
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{payment.customerName}</span>
                  </div>
                )}
                
                {payment.referenceNumber && (
                  <div className="text-sm text-gray-500">
                    المرجع: {payment.referenceNumber}
                  </div>
                )}
                
                {payment.notes && (
                  <div className="text-sm text-gray-500 truncate">
                    {payment.notes}
                  </div>
                )}
              </div>
            </div>
          </div>

          {showActions && (
            <div className="flex space-x-2 space-x-reverse">
              <SimpleButton
                size="sm"
                variant="outline"
                onClick={handleView}
                className="text-blue-600 hover:text-blue-800"
              >
                <Eye className="w-4 h-4" />
              </SimpleButton>
              
              <SimpleButton
                size="sm"
                variant="outline"
                onClick={handleEdit}
                className="text-green-600 hover:text-green-800"
              >
                <Edit className="w-4 h-4" />
              </SimpleButton>
              
              <SimpleButton
                size="sm"
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </SimpleButton>
            </div>
          )}
        </div>
      </SimpleCardContent>
    </SimpleCard>
  );
});

// Helper functions
const getStatusColor = (status) => {
  const colors = {
    'pending': 'yellow',
    'completed': 'green',
    'failed': 'red',
    'cancelled': 'gray'
  };
  return colors[status] || 'gray';
};

const getStatusLabel = (status) => {
  const labels = {
    'pending': 'في الانتظار',
    'completed': 'مكتملة',
    'failed': 'فاشلة',
    'cancelled': 'ملغية'
  };
  return labels[status] || 'غير محدد';
};

const getMethodIcon = (method) => {
  const icons = {
    'cash': <DollarSign className="w-4 h-4" />,
    'card': <CreditCard className="w-4 h-4" />,
    'bank_transfer': <CheckCircle className="w-4 h-4" />,
    'check': <AlertTriangle className="w-4 h-4" />,
    'other': <DollarSign className="w-4 h-4" />
  };
  return icons[method] || <DollarSign className="w-4 h-4" />;
};

const getMethodLabel = (method) => {
  const labels = {
    'cash': 'نقدي',
    'card': 'بطاقة ائتمان',
    'bank_transfer': 'تحويل بنكي',
    'check': 'شيك',
    'other': 'أخرى'
  };
  return labels[method] || 'غير محدد';
};

// تعيين اسم للمكون لسهولة التتبع
OptimizedPaymentCard.displayName = 'OptimizedPaymentCard';

export default OptimizedPaymentCard;


