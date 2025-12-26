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
import SendButton from '../../components/messaging/SendButton';

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
    // سيتم التعامل معه عبر SendButton
    console.log('Send reminder for payment:', paymentId);
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
          <h1 className="text-2xl font-bold text-foreground">المدفوعات المتأخرة</h1>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري تحميل المدفوعات المتأخرة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">المدفوعات المتأخرة</h1>
          <p className="text-muted-foreground mt-1">
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
              <label className="block text-sm font-medium text-foreground mb-1">
                مدة التأخير
              </label>
              <select
                value={filters.daysOverdue}
                onChange={(e) => setFilters(prev => ({ ...prev, daysOverdue: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">جميع المدفوعات</option>
                <option value="7">أقل من 7 أيام</option>
                <option value="30">أقل من 30 يوم</option>
                <option value="90">أقل من 90 يوم</option>
                <option value="90+">أكثر من 90 يوم</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                نطاق المبلغ
              </label>
              <select
                value={filters.amountRange}
                onChange={(e) => setFilters(prev => ({ ...prev, amountRange: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">جميع المبالغ</option>
                <option value="0-500">0 - 500 ج.م</option>
                <option value="500-1000">500 - 1000 ج.م</option>
                <option value="1000-5000">1000 - 5000 ج.م</option>
                <option value="5000+">أكثر من 5000 ج.م</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                العميل
              </label>
              <input
                type="text"
                placeholder="البحث بالاسم أو الهاتف"
                value={filters.customerId}
                onChange={(e) => setFilters(prev => ({ ...prev, customerId: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
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
            <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد مدفوعات متأخرة</h3>
            <p className="text-muted-foreground">جميع المدفوعات محدثة ولا توجد مدفوعات متأخرة</p>
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
                        className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 space-x-reverse mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            فاتورة #{payment.invoiceId}
                          </h3>
                          <SimpleBadge color={status.color}>
                            {status.label}
                          </SimpleBadge>
                          <span className="text-sm text-muted-foreground">
                            {overdueDays} يوم متأخر
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {payment.customerName || 'عميل غير محدد'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {payment.remainingAmount?.toLocaleString('ar-EG')} ج.م
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              استحقاق: {new Date(payment.dueDate).toLocaleDateString('en-GB')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 space-x-reverse text-sm text-muted-foreground">
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
                      {payment.customerPhone && (
                        <SendButton
                          entityType="payment"
                          entityId={payment.id}
                          customerId={payment.customerId}
                          recipient={payment.customerPhone}
                          template="paymentReminderMessage"
                          showChannelSelector={false}
                          variant="default"
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                        />
                      )}
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
        <SimpleCard className="bg-primary/10 border-primary/20">
          <SimpleCardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary">
                تم اختيار {selectedPayments.length} مدفوعة
              </span>
              <div className="flex space-x-2 space-x-reverse">
                <SimpleButton
                  size="sm"
                  onClick={handleBulkReminder}
                  className="bg-primary hover:bg-primary/90"
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


