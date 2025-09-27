import React, { useState } from 'react';
import { X, CreditCard, Banknote, Smartphone, FileText } from 'lucide-react';
import SimpleButton from '../ui/SimpleButton';
import paymentsService from '../../services/paymentsService';
import { useNotifications } from '../notifications/NotificationSystem';

const PaymentModal = ({ isOpen, onClose, invoiceId, invoiceTotal, onPaymentAdded }) => {
  const notifications = useNotifications();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'cash',
    currency: 'EGP',
    notes: ''
  });

  const paymentMethods = [
    { value: 'cash', label: 'نقدي', icon: Banknote, color: 'text-green-600' },
    { value: 'card', label: 'بطاقة ائتمان', icon: CreditCard, color: 'text-blue-600' },
    { value: 'transfer', label: 'تحويل بنكي', icon: Smartphone, color: 'text-purple-600' },
    { value: 'check', label: 'شيك', icon: FileText, color: 'text-orange-600' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      notifications.error('يرجى إدخال مبلغ صحيح');
      return;
    }

    if (parseFloat(formData.amount) > invoiceTotal) {
      notifications.error('المبلغ المدفوع لا يمكن أن يكون أكبر من إجمالي الفاتورة');
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
        ...formData,
        amount: parseFloat(formData.amount),
        invoiceId: parseInt(invoiceId),
        userId: parseInt(localStorage.getItem('userId') || 1) // Get from auth context
      };

      await paymentsService.createPayment(paymentData);
      notifications.success('تم تسجيل الدفعة بنجاح');
      
      // Reset form
      setFormData({
        amount: '',
        paymentMethod: 'cash',
        currency: 'EGP',
        notes: ''
      });
      
      onPaymentAdded?.();
      onClose();
    } catch (error) {
      console.error('Error creating payment:', error);
      notifications.error('فشل في تسجيل الدفعة');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">تسجيل دفعة جديدة</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المبلغ المدفوع
            </label>
            <div className="relative">
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                max={invoiceTotal}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
              <span className="absolute left-3 top-2 text-gray-500 text-sm">ج.م</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              إجمالي الفاتورة: {invoiceTotal.toFixed(2)} ج.م
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              طريقة الدفع
            </label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const IconComponent = method.icon;
                return (
                  <label
                    key={method.value}
                    className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.paymentMethod === method.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={formData.paymentMethod === method.value}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <IconComponent className={`w-5 h-5 ${method.color} mr-2`} />
                    <span className="text-sm font-medium text-gray-700">
                      {method.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات (اختياري)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="أي ملاحظات إضافية..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <SimpleButton
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              إلغاء
            </SimpleButton>
            <SimpleButton
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'جاري الحفظ...' : 'تسجيل الدفعة'}
            </SimpleButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
