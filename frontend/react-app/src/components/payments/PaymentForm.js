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

  useEffect(() => {
    if (payment) {
      setFormData({
        amount: payment.amount || '',
        paymentMethod: payment.paymentMethod || 'cash',
        paymentDate: payment.paymentDate || new Date().toISOString().split('T')[0],
        referenceNumber: payment.referenceNumber || '',
        notes: payment.notes || '',
        invoiceId: payment.invoiceId || ''
      });
    } else if (invoice) {
      setFormData(prev => ({
        ...prev,
        amount: invoice.remainingAmount || invoice.finalAmount || '',
        invoiceId: invoice.id || ''
      }));
      setRemainingAmount(invoice.remainingAmount || invoice.finalAmount || 0);
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
      const response = await apiService.request('/invoices?limit=100');
      console.log('Invoices response:', response);
      if (response.ok) {
        const data = await response.json();
        console.log('Invoices data:', data);
        // Handle different response structures
        const invoices = data.invoices || data.data?.invoices || data || [];
        setAvailableInvoices(Array.isArray(invoices) ? invoices : []);
      } else {
        console.error('Failed to load invoices:', response.status);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
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
      const response = await apiService.request(`/invoices/${invoiceId}`);
      console.log('Invoice details response:', response);
      if (response.ok) {
        const invoiceData = await response.json();
        console.log('Invoice details data:', invoiceData);
        
        // Handle different response structures
        const invoice = invoiceData.data || invoiceData;
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
      } else {
        console.error('Failed to load invoice details:', response.status);
      }
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
          {(invoice || selectedInvoice) && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">معلومات الفاتورة</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">رقم الفاتورة:</span>
                  <span className="font-medium mr-2">#{selectedInvoice?.id || invoice?.id}</span>
                </div>
                <div>
                  <span className="text-blue-700">إجمالي الفاتورة:</span>
                  <span className="font-medium mr-2">
                    {paymentService.formatAmount(selectedInvoice?.totalAmount || invoice?.finalAmount, 'EGP')}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">المدفوع:</span>
                  <span className="font-medium mr-2">
                    {paymentService.formatAmount(selectedInvoice?.amountPaid || invoice?.totalPaid || 0, 'EGP')}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">المتبقي:</span>
                  <span className="font-medium mr-2 text-red-600">
                    {paymentService.formatAmount(remainingAmount, 'EGP')}
                  </span>
                </div>
                {selectedInvoice?.customerName && (
                  <div className="col-span-2">
                    <span className="text-blue-700">العميل:</span>
                    <span className="font-medium mr-2">{selectedInvoice.customerName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

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
              }`}
              placeholder="أدخل المبلغ"
              step="0.01"
              min="0"
              max={remainingAmount || undefined}
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
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
              disabled={loading}
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