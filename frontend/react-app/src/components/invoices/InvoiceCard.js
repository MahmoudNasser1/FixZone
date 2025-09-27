import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import SimpleButton from '../ui/SimpleButton';
import SimpleBadge from '../ui/SimpleBadge';
import { 
  FileText, DollarSign, Calendar, User, Eye, Edit, Trash2,
  CheckCircle, XCircle, Clock, AlertCircle, Download, Send
} from 'lucide-react';

const InvoiceCard = ({ invoice, onDelete, onPrint, onSend }) => {
  const { formatMoney } = useSettings();
  const getStatusBadge = (status) => {
    const statusConfig = {
      'paid': { variant: 'default', icon: CheckCircle, text: 'مدفوعة', color: 'text-green-600' },
      'unpaid': { variant: 'destructive', icon: XCircle, text: 'غير مدفوعة', color: 'text-red-600' },
      'partial': { variant: 'secondary', icon: Clock, text: 'مدفوعة جزئياً', color: 'text-yellow-600' },
      'overdue': { variant: 'destructive', icon: AlertCircle, text: 'متأخرة', color: 'text-red-600' },
      'cancelled': { variant: 'outline', icon: XCircle, text: 'ملغاة', color: 'text-gray-600' }
    };

    const config = statusConfig[status] || statusConfig['unpaid'];
    const Icon = config.icon;

    return (
      <SimpleBadge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </SimpleBadge>
    );
  };

  const formatCurrency = (amount, currency = 'EGP') => {
    return formatMoney(amount || 0, currency);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ar-SA');
  };

  const getPaymentProgress = () => {
    if (!invoice.totalAmount) return 0;
    return Math.round((invoice.amountPaid / invoice.totalAmount) * 100);
  };

  const getRemainingAmount = () => {
    return (invoice.totalAmount || 0) - (invoice.amountPaid || 0);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              فاتورة #{invoice.id}
            </h3>
            <p className="text-sm text-gray-600">
              {formatDate(invoice.createdAt)}
            </p>
          </div>
        </div>
        {getStatusBadge(invoice.status)}
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <DollarSign className="w-4 h-4" />
          <span>المبلغ: {formatCurrency(invoice.totalAmount, invoice.currency)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>طلب الإصلاح: #{invoice.repairRequestId}</span>
        </div>
        {invoice.customerName && (
          <div className="flex items-center gap-2 text-sm text-gray-600 md:col-span-2">
            <User className="w-4 h-4" />
            <span>العميل: {invoice.customerName}</span>
          </div>
        )}
      </div>

      {/* Payment Progress */}
      {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">تقدم الدفع</span>
            <span className="text-sm font-medium">{getPaymentProgress()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getPaymentProgress()}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
            <span>مدفوع: {formatCurrency(invoice.amountPaid, invoice.currency)}</span>
            <span>متبقي: {formatCurrency(getRemainingAmount(), invoice.currency)}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
        <Link to={`/invoices/${invoice.id}`} className="flex-1">
          <SimpleButton variant="outline" size="sm" className="w-full">
            <Eye className="w-4 h-4 ml-2" />
            عرض
          </SimpleButton>
        </Link>
        <Link to={`/invoices/${invoice.id}/edit`}>
          <SimpleButton variant="outline" size="sm">
            <Edit className="w-4 h-4" />
          </SimpleButton>
        </Link>
        <SimpleButton 
          variant="outline" 
          size="sm"
          onClick={() => onPrint && onPrint(invoice.id)}
          title="طباعة"
        >
          <Download className="w-4 h-4" />
        </SimpleButton>
        <SimpleButton 
          variant="outline" 
          size="sm"
          onClick={() => onSend && onSend(invoice.id)}
          title="إرسال"
        >
          <Send className="w-4 h-4" />
        </SimpleButton>
        <SimpleButton 
          variant="outline" 
          size="sm"
          onClick={() => onDelete && onDelete(invoice.id)}
          className="text-red-600 hover:text-red-700"
          title="حذف"
        >
          <Trash2 className="w-4 h-4" />
        </SimpleButton>
      </div>
    </div>
  );
};

export default InvoiceCard;
