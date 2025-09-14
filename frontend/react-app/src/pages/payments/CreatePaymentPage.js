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
      const response = await apiService.get('/invoices?status=sent,partially_paid&limit=100');
      if (response.invoices) {
        setInvoices(response.invoices);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const loadInvoiceDetails = async (invoiceId) => {
    try {
      const response = await apiService.get(`/invoices/${invoiceId}`);
      if (response) {
        setInvoice(response);
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
      
      const response = await paymentService.createPayment({
        ...paymentData,
        invoiceId: selectedInvoiceId,
        createdBy: 1 // TODO: Get from auth context
      });

      if (response.success) {
        addNotification('تم إضافة الدفعة بنجاح', 'success');
        navigate('/payments');
      } else {
        throw new Error(response.error || 'فشل في إضافة الدفعة');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      addNotification(error.message || 'خطأ في إضافة الدفعة', 'error');
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
                      {inv.invoiceNumber} - {inv.customerFirstName} {inv.customerLastName} - 
                      {paymentService.formatAmount(inv.finalAmount, inv.currency)}
                    </option>
                  ))}
                </select>
              </div>

              {invoice && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">تفاصيل الفاتورة</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">رقم الفاتورة:</span>
                      <span className="font-medium">{invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">العميل:</span>
                      <span className="font-medium">
                        {invoice.customerFirstName} {invoice.customerLastName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">إجمالي الفاتورة:</span>
                      <span className="font-medium">
                        {paymentService.formatAmount(invoice.finalAmount, invoice.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">المدفوع:</span>
                      <span className="font-medium text-green-600">
                        {paymentService.formatAmount(invoice.totalPaid || 0, invoice.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">المتبقي:</span>
                      <span className="font-medium text-red-600">
                        {paymentService.formatAmount(invoice.remainingAmount || invoice.finalAmount, invoice.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">تاريخ الاستحقاق:</span>
                      <span className="font-medium">
                        {invoice.dueDate ? paymentService.formatDate(invoice.dueDate) : 'غير محدد'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
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

