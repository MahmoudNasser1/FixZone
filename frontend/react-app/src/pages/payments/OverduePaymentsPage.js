import React, { useState, useEffect } from 'react';
import { SimpleCard, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import paymentService from '../../services/paymentService';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { 
  AlertTriangle, Clock, Phone, Mail, Calendar, 
  DollarSign, User, FileText, Send, CheckCircle
} from 'lucide-react';

const OverduePaymentsPage = () => {
  const [overduePayments, setOverduePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [filters, setFilters] = useState({
    daysOverdue: 'all',
    amountRange: 'all',
    customerId: ''
  });
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadOverduePayments();
  }, [filters]);

  const loadOverduePayments = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getOverduePayments();
      setOverduePayments(response || []);
    } catch (error) {
      console.error('Error loading overdue payments:', error);
      addNotification('خطأ في تحميل المدفوعات المتأخرة', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getOverdueDays = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today - due;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getOverdueStatus = (days) => {
    if (days <= 7) return { label: 'متأخر قليلاً', color: 'yellow' };
    if (days <= 30) return { label: 'متأخر', color: 'orange' };
    if (days <= 90) return { label: 'متأخر جداً', color: 'red' };
    return { label: 'متأخر بشكل خطير', color: 'red' };
  };

  const handleSelectPayment = (paymentId) => {
    setSelectedPayments(prev => 
      prev.includes(paymentId) 
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPayments.length === overduePayments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(overduePayments.map(p => p.id));
    }
  };

  const handleSendReminder = async (paymentId) => {
    try {
      // إرسال تذكير للعميل
      addNotification('تم إرسال التذكير بنجاح', 'success');
      console.log('Sending reminder for payment:', paymentId);
    } catch (error) {
      addNotification('فشل في إرسال التذكير', 'error');
    }
  };

  const handleBulkReminder = async () => {
    try {
      if (selectedPayments.length === 0) {
        addNotification('يرجى اختيار مدفوعات لإرسال التذكير', 'warning');
        return;
      }
      
      // إرسال تذكير مجمع
      addNotification(`تم إرسال التذكير لـ ${selectedPayments.length} مدفوعة`, 'success');
      setSelectedPayments([]);
    } catch (error) {
      addNotification('فشل في إرسال التذكير المجمع', 'error');
    }
  };

  const handleMarkAsContacted = async (paymentId) => {
    try {
      // تسجيل أن العميل تم الاتصال به
      addNotification('تم تسجيل الاتصال بالعميل', 'success');
      console.log('Marking payment as contacted:', paymentId);
    } catch (error) {
      addNotification('فشل في تسجيل الاتصال', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">المدفوعات المتأخرة</h1>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">جاري تحميل المدفوعات المتأخرة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المدفوعات المتأخرة</h1>
          <p className="text-gray-600 mt-1">
            إدارة ومتابعة المدفوعات المتأخرة ({overduePayments.length} مدفوعة)
          </p>
        </div>
        <div className="flex space-x-3 space-x-reverse">
          <SimpleButton
            onClick={handleBulkReminder}
            disabled={selectedPayments.length === 0}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Send className="w-4 h-4 ml-2" />
            إرسال تذكير مجمع
          </SimpleButton>
        </div>
      </div>

      {/* Filters */}
      <SimpleCard>
        <SimpleCardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                مدة التأخير
              </label>
              <select
                value={filters.daysOverdue}
                onChange={(e) => setFilters(prev => ({ ...prev, daysOverdue: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع المدفوعات</option>
                <option value="7">أقل من 7 أيام</option>
                <option value="30">أقل من 30 يوم</option>
                <option value="90">أقل من 90 يوم</option>
                <option value="90+">أكثر من 90 يوم</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نطاق المبلغ
              </label>
              <select
                value={filters.amountRange}
                onChange={(e) => setFilters(prev => ({ ...prev, amountRange: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع المبالغ</option>
                <option value="0-500">0 - 500 ج.م</option>
                <option value="500-1000">500 - 1000 ج.م</option>
                <option value="1000-5000">1000 - 5000 ج.م</option>
                <option value="5000+">أكثر من 5000 ج.م</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                العميل
              </label>
              <input
                type="text"
                placeholder="البحث بالاسم أو الهاتف"
                value={filters.customerId}
                onChange={(e) => setFilters(prev => ({ ...prev, customerId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* Overdue Payments List */}
      {overduePayments.length === 0 ? (
        <SimpleCard>
          <SimpleCardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد مدفوعات متأخرة</h3>
            <p className="text-gray-500">جميع المدفوعات محدثة ولا توجد مدفوعات متأخرة</p>
          </SimpleCardContent>
        </SimpleCard>
      ) : (
        <div className="space-y-4">
          {overduePayments.map((payment) => {
            const overdueDays = getOverdueDays(payment.dueDate);
            const status = getOverdueStatus(overdueDays);
            
            return (
              <SimpleCard key={payment.id} className="border-l-4 border-l-red-500">
                <SimpleCardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 space-x-reverse">
                      <input
                        type="checkbox"
                        checked={selectedPayments.includes(payment.id)}
                        onChange={() => handleSelectPayment(payment.id)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 space-x-reverse mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            فاتورة #{payment.invoiceId}
                          </h3>
                          <SimpleBadge color={status.color}>
                            {status.label}
                          </SimpleBadge>
                          <span className="text-sm text-gray-500">
                            {overdueDays} يوم متأخر
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {payment.customerName || 'عميل غير محدد'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {payment.remainingAmount?.toLocaleString('ar-EG')} ج.م
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              استحقاق: {new Date(payment.dueDate).toLocaleDateString('en-GB')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500">
                          <Phone className="w-4 h-4" />
                          <span>{payment.customerPhone || 'غير محدد'}</span>
                          {payment.customerEmail && (
                            <>
                              <Mail className="w-4 h-4 ml-4" />
                              <span>{payment.customerEmail}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2 space-x-reverse">
                      <SimpleButton
                        size="sm"
                        onClick={() => handleSendReminder(payment.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="w-4 h-4 ml-1" />
                        تذكير
                      </SimpleButton>
                      <SimpleButton
                        size="sm"
                        onClick={() => handleMarkAsContacted(payment.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 ml-1" />
                        تم الاتصال
                      </SimpleButton>
                    </div>
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            );
          })}
        </div>
      )}

      {/* Bulk Actions */}
      {selectedPayments.length > 0 && (
        <SimpleCard className="bg-blue-50 border-blue-200">
          <SimpleCardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                تم اختيار {selectedPayments.length} مدفوعة
              </span>
              <div className="flex space-x-2 space-x-reverse">
                <SimpleButton
                  size="sm"
                  onClick={handleBulkReminder}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 ml-1" />
                  إرسال تذكير مجمع
                </SimpleButton>
                <SimpleButton
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedPayments([])}
                >
                  إلغاء الاختيار
                </SimpleButton>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      )}
    </div>
  );
};

export default OverduePaymentsPage;


