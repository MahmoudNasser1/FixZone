import React, { useState, useEffect } from 'react';
import { SimpleCard, SimpleCardContent } from '../ui/SimpleCard';
import SimpleButton from '../ui/SimpleButton';
import paymentService from '../../services/paymentService';
import apiService from '../../services/api';

const PaymentForm = ({ 
  payment = null, 
  invoice = null, 
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    notes: '',
    invoiceId: ''
  });
  
  const [errors, setErrors] = useState({});
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [availableInvoices, setAvailableInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Helper function to convert date to YYYY-MM-DD format
  const formatDateForInput = (date) => {
    if (!date) return new Date().toISOString().split('T')[0];
    
    try {
      // If already in YYYY-MM-DD format, return as is
      if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date;
      }
      
      // Try to parse the date
      const dateObj = new Date(date);
      
      // Check if valid date
      if (isNaN(dateObj.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      
      // Convert to YYYY-MM-DD format
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error, 'Date:', date);
      return new Date().toISOString().split('T')[0];
    }
  };

  useEffect(() => {
    if (payment) {
      setFormData({
        amount: payment.amount || '',
        paymentMethod: payment.paymentMethod || 'cash',
        paymentDate: formatDateForInput(payment.paymentDate),
        referenceNumber: payment.referenceNumber || '',
        notes: payment.notes || '',
        invoiceId: payment.invoiceId || ''
      });
    } else if (invoice) {
      // Calculate remaining amount from backend data
      const totalAmount = invoice.totalAmount || invoice.finalAmount || 0;
      const amountPaid = invoice.amountPaid || 0;
      const remaining = totalAmount - amountPaid;
      
      setFormData(prev => ({
        ...prev,
        amount: remaining > 0 ? remaining.toString() : '',
        invoiceId: invoice.id || '',
        paymentDate: prev.paymentDate || new Date().toISOString().split('T')[0]
      }));
      setRemainingAmount(remaining);
      setSelectedInvoice(invoice);
    } else {
      // Load available invoices for new payment
      loadAvailableInvoices();
    }
  }, [payment, invoice]);

  const loadAvailableInvoices = async () => {
    try {
      setLoadingInvoices(true);
      console.log('Loading available invoices...');
      const response = await apiService.getInvoices({ limit: 100 });
      console.log('Invoices response:', response);
      
      // Handle different response structures
      const invoices = response.invoices || response.data || response || [];
      setAvailableInvoices(Array.isArray(invoices) ? invoices : []);
    } catch (error) {
      console.error('Error loading invoices:', error);
      console.log('Failed to load invoices:', error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleInvoiceSelect = async (invoiceId) => {
    if (!invoiceId) {
      setSelectedInvoice(null);
      setRemainingAmount(0);
      return;
    }

    try {
      console.log('Loading invoice details for ID:', invoiceId);
      const response = await apiService.getInvoiceById(invoiceId);
      console.log('Invoice details response:', response);
      
      // Handle different response structures
      const invoice = response.data || response;
      setSelectedInvoice(invoice);
      
      // Calculate remaining amount
      const totalPaid = invoice.amountPaid || 0;
      const remaining = (invoice.totalAmount || 0) - totalPaid;
      setRemainingAmount(remaining);
      
      // Auto-fill amount with remaining balance
      setFormData(prev => ({
        ...prev,
        amount: remaining > 0 ? remaining.toString() : '',
        invoiceId: invoiceId
      }));
    } catch (error) {
      console.error('Error loading invoice details:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validation = paymentService.validatePaymentData({
      ...formData,
      invoiceId: formData.invoiceId || invoice?.id || payment?.invoiceId
    });
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Check if invoice is fully paid
    const inv = selectedInvoice || invoice;
    const invoiceTotalAmount = inv?.totalAmount || inv?.finalAmount || 0;
    const invoiceAmountPaid = inv?.amountPaid || 0;
    const invoiceRemaining = invoiceTotalAmount - invoiceAmountPaid;
    
    if (inv && invoiceRemaining <= 0) {
      setErrors({
        amount: 'الفاتورة مدفوعة بالكامل ولا يمكن إضافة دفعات جديدة'
      });
      return;
    }

    // Check if amount exceeds remaining balance
    if (selectedInvoice && parseFloat(formData.amount) > remainingAmount) {
      setErrors({
        amount: `المبلغ يتجاوز المتبقي (${paymentService.formatAmount(remainingAmount)})`
      });
      return;
    }

    onSubmit(formData);
  };

  const paymentMethods = paymentService.getPaymentMethods();

  // Calculate if invoice is fully paid
  const inv = selectedInvoice || invoice;
  const totalAmount = inv?.totalAmount || inv?.finalAmount || 0;
  const amountPaid = inv?.amountPaid || 0;
  const remaining = totalAmount - amountPaid;
  const isFullyPaid = remaining <= 0;

  return (
    <SimpleCard>
      <SimpleCardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invoice Selection */}
          {!payment && !invoice && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اختيار الفاتورة <span className="text-red-500">*</span>
              </label>
              <select
                name="invoiceId"
                value={formData.invoiceId}
                onChange={(e) => {
                  handleInputChange(e);
                  handleInvoiceSelect(e.target.value);
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.invoiceId ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loadingInvoices}
              >
                <option value="">اختر الفاتورة...</option>
                {availableInvoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    فاتورة #{inv.id} - {paymentService.formatAmount(inv.totalAmount)} - {inv.customerName || 'عميل غير محدد'}
                  </option>
                ))}
              </select>
              {errors.invoiceId && (
                <p className="text-red-500 text-sm mt-1">{errors.invoiceId}</p>
              )}
              {loadingInvoices && (
                <p className="text-gray-500 text-sm mt-1">جاري تحميل الفواتير...</p>
              )}
            </div>
          )}

          {/* Invoice Information */}
          {(invoice || selectedInvoice) && (() => {
            const inv = selectedInvoice || invoice;
            const totalAmount = inv?.totalAmount || inv?.finalAmount || 0;
            const amountPaid = inv?.amountPaid || 0;
            const remaining = totalAmount - amountPaid;
            const isFullyPaid = remaining <= 0;
            
            return (
              <div className={`p-4 rounded-lg mb-4 ${isFullyPaid ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className={`font-semibold ${isFullyPaid ? 'text-green-900' : 'text-blue-900'}`}>
                    معلومات الفاتورة
                  </h3>
                  {isFullyPaid && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-semibold text-green-800">مدفوعة بالكامل</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={isFullyPaid ? 'text-green-700' : 'text-blue-700'}>رقم الفاتورة:</span>
                    <span className="font-medium mr-2">#{inv?.id}</span>
                  </div>
                  <div>
                    <span className={isFullyPaid ? 'text-green-700' : 'text-blue-700'}>إجمالي الفاتورة:</span>
                    <span className="font-medium mr-2">
                      {paymentService.formatAmount(totalAmount, inv?.currency || 'EGP')}
                    </span>
                  </div>
                  <div>
                    <span className={isFullyPaid ? 'text-green-700' : 'text-blue-700'}>المدفوع:</span>
                    <span className="font-medium mr-2 text-green-600">
                      {paymentService.formatAmount(amountPaid, inv?.currency || 'EGP')}
                    </span>
                  </div>
                  <div>
                    <span className={isFullyPaid ? 'text-green-700' : 'text-blue-700'}>المتبقي:</span>
                    <span className={`font-medium mr-2 ${isFullyPaid ? 'text-green-600' : 'text-red-600'}`}>
                      {paymentService.formatAmount(remaining, inv?.currency || 'EGP')}
                    </span>
                  </div>
                  {inv?.customerName && (
                    <div className="col-span-2">
                      <span className={isFullyPaid ? 'text-green-700' : 'text-blue-700'}>العميل:</span>
                      <span className="font-medium mr-2">{inv.customerName}</span>
                    </div>
                  )}
                </div>
                {isFullyPaid && (
                  <div className="mt-3 p-2 bg-green-100 rounded text-sm text-green-800">
                    <strong>تنبيه:</strong> هذه الفاتورة مدفوعة بالكامل ولا يمكن إضافة دفعات جديدة.
                  </div>
                )}
              </div>
            );
          })()}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              المبلغ <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.amount ? 'border-red-500' : 'border-gray-300'
              } ${isFullyPaid ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="أدخل المبلغ"
              step="0.01"
              min="0"
              max={remainingAmount || undefined}
              disabled={isFullyPaid}
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
            )}
            {isFullyPaid && (
              <p className="text-gray-500 text-sm mt-1">لا يمكن إضافة دفعة للفاتورة المدفوعة بالكامل</p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              طريقة الدفع <span className="text-red-500">*</span>
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.paymentMethod ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {paymentMethods.map(method => (
                <option key={method.value} value={method.value}>
                  {method.icon} {method.label}
                </option>
              ))}
            </select>
            {errors.paymentMethod && (
              <p className="text-red-500 text-sm mt-1">{errors.paymentMethod}</p>
            )}
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تاريخ الدفع <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.paymentDate ? 'border-red-500' : 'border-gray-300'
              }`}
              max="2025-12-31"
              min="2020-01-01"
            />
            {errors.paymentDate && (
              <p className="text-red-500 text-sm mt-1">{errors.paymentDate}</p>
            )}
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              رقم المرجع
            </label>
            <input
              type="text"
              name="referenceNumber"
              value={formData.referenceNumber}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="رقم المرجع أو المعاملة"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ملاحظات
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ملاحظات إضافية..."
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 space-x-reverse pt-4">
            <SimpleButton
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              إلغاء
            </SimpleButton>
            <SimpleButton
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={loading || remainingAmount <= 0 || isFullyPaid}
            >
              {loading ? 'جاري الحفظ...' : (payment ? 'تحديث الدفعة' : 'إضافة الدفعة')}
            </SimpleButton>
          </div>
        </form>
      </SimpleCardContent>
    </SimpleCard>
  );
};

export default PaymentForm;