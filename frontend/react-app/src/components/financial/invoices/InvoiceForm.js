// Invoice Form Component
// Reusable form component for creating/editing invoices

import React from 'react';

const InvoiceForm = ({ formData, errors, onChange, customers = [], repairs = [] }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (onChange) {
      onChange(name, value);
    }
  };

  const inputClasses = "w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none bg-background text-foreground text-sm transition-all";
  const labelClasses = "block text-sm font-medium text-foreground mb-1";
  const errorClasses = "text-xs text-destructive mt-1";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className={labelClasses}>رقم طلب الإصلاح</label>
          <input
            name="repairRequestId"
            type="number"
            value={formData.repairRequestId || ''}
            onChange={handleChange}
            className={inputClasses}
            placeholder="اختياري - رقم طلب الإصلاح"
          />
          <p className="text-[10px] text-muted-foreground mt-1">اختياري - إذا كان الفاتورة مرتبطة بطلب إصلاح</p>
        </div>

        <div className="space-y-1">
          <label className={labelClasses}>العميل</label>
          <select
            name="customerId"
            value={formData.customerId || ''}
            onChange={handleChange}
            className={inputClasses}
          >
            <option value="">اختر العميل</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className={labelClasses}>تاريخ الاستحقاق</label>
          <input
            name="dueDate"
            type="date"
            value={formData.dueDate || ''}
            onChange={handleChange}
            className={inputClasses}
          />
        </div>

        <div className="space-y-1">
          <label className={labelClasses}>العملة</label>
          <select
            name="currency"
            value={formData.currency || 'EGP'}
            onChange={handleChange}
            className={inputClasses}
          >
            <option value="EGP">جنيه مصري</option>
            <option value="USD">دولار أمريكي</option>
            <option value="EUR">يورو</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className={labelClasses}>الخصم (%)</label>
          <input
            name="discountPercent"
            type="number"
            value={formData.discountPercent || 0}
            onChange={handleChange}
            className={inputClasses}
            min="0"
            max="100"
            step="0.01"
            placeholder="0"
          />
          <p className="text-[10px] text-muted-foreground mt-1">نسبة الخصم</p>
        </div>
        <div className="space-y-1">
          <label className={labelClasses}>مبلغ الخصم</label>
          <input
            name="discountAmount"
            type="number"
            value={formData.discountAmount || 0}
            onChange={handleChange}
            className={`${inputClasses} ${formData.discountPercent > 0 ? 'bg-muted opacity-70' : ''}`}
            min="0"
            step="0.01"
            placeholder="0.00"
            disabled={formData.discountPercent > 0}
          />
          <p className="text-[10px] text-muted-foreground mt-1">مبلغ الخصم (يتم حسابه تلقائياً من النسبة)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className={labelClasses}>الضريبة (%)</label>
          <input
            name="taxRate"
            type="number"
            value={formData.taxRate || 14}
            onChange={handleChange}
            className={inputClasses}
            min="0"
            max="100"
            step="0.01"
            placeholder="14"
          />
          <p className="text-[10px] text-muted-foreground mt-1">نسبة الضريبة (افتراضي: 14%)</p>
        </div>
      </div>

      <div className="space-y-1">
        <label className={labelClasses}>ملاحظات</label>
        <textarea
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          className={`${inputClasses} min-h-[100px]`}
          placeholder="أدخل أي ملاحظات إضافية هنا..."
        />
      </div>
    </div>
  );
};

export default InvoiceForm;
