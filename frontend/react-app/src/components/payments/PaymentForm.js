import React, { useState, useEffect } from 'react';
import { SimpleCard, SimpleCardContent } from '../ui/SimpleCard';
import SimpleButton from '../ui/SimpleButton';
import paymentService from '../../services/paymentService';

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
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [remainingAmount, setRemainingAmount] = useState(0);

  useEffect(() => {
    if (payment) {
      setFormData({
        amount: payment.amount || '',
        paymentMethod: payment.paymentMethod || 'cash',
        paymentDate: payment.paymentDate || new Date().toISOString().split('T')[0],
        referenceNumber: payment.referenceNumber || '',
        notes: payment.notes || ''
      });
    } else if (invoice) {
      setFormData(prev => ({
        ...prev,
        amount: invoice.remainingAmount || invoice.finalAmount || ''
      }));
      setRemainingAmount(invoice.remainingAmount || invoice.finalAmount || 0);
    }
  }, [payment, invoice]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validation = paymentService.validatePaymentData({
      ...formData,
      invoiceId: invoice?.id || payment?.invoiceId
    });
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Check if amount exceeds remaining balance
    if (invoice && parseFloat(formData.amount) > remainingAmount) {
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
          {/* Invoice Information */}
          {invoice && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">معلومات الفاتورة</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">رقم الفاتورة:</span>
                  <span className="font-medium mr-2">{invoice.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-blue-700">إجمالي الفاتورة:</span>
                  <span className="font-medium mr-2">
                    {paymentService.formatAmount(invoice.finalAmount, invoice.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">المدفوع:</span>
                  <span className="font-medium mr-2">
                    {paymentService.formatAmount(invoice.totalPaid || 0, invoice.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">المتبقي:</span>
                  <span className="font-medium mr-2 text-red-600">
                    {paymentService.formatAmount(remainingAmount, invoice.currency)}
                  </span>
                </div>
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
              max={remainingAmount}
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

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4">
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
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
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

