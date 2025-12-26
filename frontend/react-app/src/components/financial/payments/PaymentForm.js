// Payment Form Component
// Reusable form component for creating/editing payments

import React, { useState, useEffect } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import invoicesService from '../../../services/financial/invoicesService';

const PaymentForm = ({ formData, errors, onChange, invoiceId: propInvoiceId }) => {
  const [invoice, setInvoice] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const invoiceId = propInvoiceId || formData.invoiceId;

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const fetchInvoice = async () => {
    setLoadingInvoice(true);
    try {
      const response = await invoicesService.getById(invoiceId);
      if (response.success) {
        setInvoice(response.data);
        // Set max amount as remaining amount
        const remaining = (response.data.totalAmount || 0) - (response.data.amountPaid || 0);
        if (remaining > 0 && !formData.amount) {
          onChange('amount', remaining.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount || 0);
  };

  const remainingAmount = invoice
    ? (invoice.totalAmount || 0) - (invoice.amountPaid || 0)
    : null;

  const inputClasses = "w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none bg-background text-foreground text-sm transition-all";
  const labelClasses = "block text-sm font-medium text-foreground mb-1";
  const errorClasses = "text-xs text-destructive mt-1";

  return (
    <div className="space-y-6">
      {invoice && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3 items-start">
          <Info className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="text-sm text-foreground">
            <div className="font-bold mb-1">بيانات الفاتورة:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
              <span><strong>رقم الفاتورة:</strong> {invoice.invoiceNumber || `#${invoice.id}`}</span>
              <span><strong>الإجمالي:</strong> {formatCurrency(invoice.totalAmount)}</span>
              <span><strong>المدفوع:</strong> {formatCurrency(invoice.amountPaid || 0)}</span>
              <span className="text-primary font-bold"><strong>المتبقي:</strong> {formatCurrency(remainingAmount)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className={labelClasses}>رقم الفاتورة *</label>
          <input
            name="invoiceId"
            type="number"
            value={formData.invoiceId || ''}
            onChange={handleChange}
            className={`${inputClasses} ${errors.invoiceId ? 'border-destructive' : ''} ${propInvoiceId ? 'bg-muted opacity-70' : ''}`}
            disabled={!!propInvoiceId}
            required
          />
          {errors.invoiceId && (
            <p className={errorClasses}>{errors.invoiceId}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className={labelClasses}>المبلغ *</label>
          <input
            name="amount"
            type="number"
            value={formData.amount || ''}
            onChange={handleChange}
            className={`${inputClasses} ${errors.amount ? 'border-destructive' : ''}`}
            min="0"
            step="0.01"
            max={remainingAmount || undefined}
            required
            placeholder="0.00"
          />
          <div className="flex justify-between mt-1">
            {errors.amount ? (
              <p className={errorClasses}>{errors.amount}</p>
            ) : (
              remainingAmount !== null && (
                <p className="text-[10px] text-muted-foreground">الحد الأقصى: {formatCurrency(remainingAmount)}</p>
              )
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className={labelClasses}>طريقة الدفع *</label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod || 'cash'}
            onChange={handleChange}
            className={`${inputClasses} ${errors.paymentMethod ? 'border-destructive' : ''}`}
            required
          >
            <option value="cash">نقدي</option>
            <option value="card">بطاقة</option>
            <option value="bank_transfer">تحويل بنكي</option>
            <option value="check">شيك</option>
            <option value="other">أخرى</option>
          </select>
          {errors.paymentMethod && (
            <p className={errorClasses}>{errors.paymentMethod}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className={labelClasses}>تاريخ الدفع *</label>
          <input
            name="paymentDate"
            type="date"
            value={formData.paymentDate || ''}
            onChange={handleChange}
            className={`${inputClasses} ${errors.paymentDate ? 'border-destructive' : ''}`}
            required
          />
          {errors.paymentDate && (
            <p className={errorClasses}>{errors.paymentDate}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className={labelClasses}>رقم المرجع</label>
        <input
          name="referenceNumber"
          type="text"
          value={formData.referenceNumber || ''}
          onChange={handleChange}
          className={inputClasses}
          placeholder="رقم المرجع أو رقم المعاملة"
        />
        <p className="text-[10px] text-muted-foreground mt-1">رقم المرجع أو رقم المعاملة (اختياري)</p>
      </div>

      <div className="space-y-1">
        <label className={labelClasses}>ملاحظات</label>
        <textarea
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          className={`${inputClasses} min-h-[80px]`}
          placeholder="أي ملاحظات إضافية..."
        />
      </div>
    </div>
  );
};

export default PaymentForm;
