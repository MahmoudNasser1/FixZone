import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SimpleCard, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import { PaymentForm } from '../../components/payments';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import paymentService from '../../services/paymentService';
import apiService from '../../services/api';

export default function CreatePaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addNotification } = useNotifications();
  
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');

  useEffect(() => {
    const invoiceId = searchParams.get('invoiceId');
    if (invoiceId) {
      setSelectedInvoiceId(invoiceId);
      loadInvoiceDetails(invoiceId);
    }
    loadInvoices();
  }, [searchParams]);

  const loadInvoices = async () => {
    try {
      // Load all invoices and filter on frontend, or load invoices without status filter
      // The backend doesn't support comma-separated status values
      const response = await apiService.getInvoices({ limit: 100 });
      let invoicesArray = [];
      
      if (response && response.success && response.data && response.data.invoices) {
        invoicesArray = response.data.invoices;
      } else if (response && Array.isArray(response.data)) {
        invoicesArray = response.data;
      } else if (response && Array.isArray(response.invoices)) {
        invoicesArray = response.invoices;
      } else if (Array.isArray(response)) {
        invoicesArray = response;
      }
      
      // Filter invoices on frontend for status: sent, partially_paid, or paid
      const filteredInvoices = invoicesArray.filter(inv => 
        inv.status === 'sent' || inv.status === 'partially_paid' || inv.status === 'paid'
      );
      
      setInvoices(filteredInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
      setInvoices([]);
    }
  };

  const loadInvoiceDetails = async (invoiceId) => {
    try {
      const response = await apiService.getInvoiceById(invoiceId);
      console.log('Invoice details response:', response);
      if (response) {
        // Handle different response structures
        const invoiceData = response.data || response;
        setInvoice(invoiceData);
      }
    } catch (error) {
      console.error('Error loading invoice details:', error);
      addNotification('خطأ في تحميل تفاصيل الفاتورة', 'error');
    }
  };

  const handleInvoiceSelect = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    if (invoiceId) {
      loadInvoiceDetails(invoiceId);
    } else {
      setInvoice(null);
    }
  };

  const handleSubmit = async (paymentData) => {
    try {
      setLoading(true);
      
      // Check if invoice is fully paid before submitting
      if (invoice) {
        const isFullyPaid = (invoice.amountPaid || 0) >= (invoice.totalAmount || invoice.finalAmount || 0);
        if (isFullyPaid) {
          addNotification('لا يمكن إضافة دفعة للفاتورة - الفاتورة مدفوعة بالكامل', 'warning');
          setLoading(false);
          return;
        }
      }
      
      console.log('Payment data being sent:', {
        ...paymentData,
        invoiceId: selectedInvoiceId || paymentData.invoiceId,
        createdBy: 2
      });
      
      // Get current user ID from auth context or local storage
      let currentUserId = null;
      try {
        const authUser = await apiService.request('/auth/me').catch(() => null);
        currentUserId = authUser?.id || authUser?.userId || 2; // Fallback to user 2 if not available
      } catch (e) {
        console.warn('Could not get current user, using default:', e);
        currentUserId = 2; // Default fallback
      }
      
      const response = await paymentService.createPayment({
        ...paymentData,
        invoiceId: selectedInvoiceId || paymentData.invoiceId,
        createdBy: currentUserId
      });

      if (response.success) {
        addNotification('تم إضافة الدفعة بنجاح', 'success');
        navigate('/payments');
      } else {
        throw new Error(response.error || 'فشل في إضافة الدفعة');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      
      // Parse error message from backend
      let errorMessage = 'خطأ في إضافة الدفعة';
      
      if (error.message) {
        if (error.message.includes('already fully paid')) {
          errorMessage = 'الفاتورة مدفوعة بالكامل - لا يمكن إضافة دفعة جديدة';
        } else if (error.message.includes('exceeds remaining balance')) {
          errorMessage = 'مبلغ الدفعة يتجاوز المبلغ المتبقي في الفاتورة';
        } else if (error.message.includes('Invoice not found')) {
          errorMessage = 'الفاتورة غير موجودة';
        } else {
          errorMessage = error.message;
        }
      }
      
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/payments');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">إضافة دفعة جديدة</h1>
        <SimpleButton
          onClick={handleCancel}
          variant="outline"
        >
          إلغاء
        </SimpleButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Selection */}
        <div className="lg:col-span-1">
          <SimpleCard>
            <SimpleCardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">اختيار الفاتورة</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الفاتورة
                </label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر الفاتورة</option>
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber || inv.id} - {inv.customerName || 'عميل غير محدد'} - 
                      {paymentService.formatAmount(inv.totalAmount || inv.finalAmount || 0, inv.currency)}
                    </option>
                  ))}
                </select>
              </div>

              {invoice && (() => {
                const isFullyPaid = (invoice.amountPaid || 0) >= (invoice.totalAmount || invoice.finalAmount || 0);
                const bgColor = isFullyPaid ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200';
                const titleColor = isFullyPaid ? 'text-green-900' : 'text-blue-900';
                const labelColor = isFullyPaid ? 'text-green-700' : 'text-blue-700';
                
                return (
                  <div className={`${bgColor} p-4 rounded-lg`}>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`font-semibold ${titleColor}`}>تفاصيل الفاتورة</h3>
                      {isFullyPaid && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-semibold text-green-800">مدفوعة بالكامل</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className={labelColor}>رقم الفاتورة:</span>
                        <span className="font-medium">{invoice.invoiceNumber || invoice.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={labelColor}>العميل:</span>
                        <span className="font-medium">
                          {invoice.customerName || 'عميل غير محدد'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={labelColor}>إجمالي الفاتورة:</span>
                        <span className="font-medium">
                          {paymentService.formatAmount(invoice.totalAmount || invoice.finalAmount || 0, invoice.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={labelColor}>المدفوع:</span>
                        <span className="font-medium text-green-600">
                          {paymentService.formatAmount(invoice.amountPaid || 0, invoice.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={labelColor}>المتبقي:</span>
                        <span className={`font-medium ${isFullyPaid ? 'text-green-600' : 'text-red-600'}`}>
                          {paymentService.formatAmount((invoice.totalAmount || invoice.finalAmount || 0) - (invoice.amountPaid || 0), invoice.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={labelColor}>تاريخ الاستحقاق:</span>
                        <span className="font-medium">
                          {invoice.dueDate ? paymentService.formatDate(invoice.dueDate) : 'غير محدد'}
                        </span>
                      </div>
                    </div>
                    {isFullyPaid && (
                      <div className="mt-3 p-2 bg-green-100 rounded text-sm text-green-800">
                        <strong>تنبيه:</strong> هذه الفاتورة مدفوعة بالكامل ولا يمكن إضافة دفعات جديدة.
                      </div>
                    )}
                  </div>
                );
              })()}
            </SimpleCardContent>
          </SimpleCard>
        </div>

        {/* Payment Form */}
        <div className="lg:col-span-2">
          <PaymentForm
            invoice={invoice}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

