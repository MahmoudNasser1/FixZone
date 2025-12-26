// Expense Form Component
// Reusable form component for creating/editing expenses

import React from 'react';

const ExpenseForm = ({ formData, errors, onChange, categories = [], branches = [], vendors = [] }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  const inputClasses = "w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none bg-background text-foreground text-sm transition-all";
  const labelClasses = "block text-sm font-medium text-foreground mb-1";
  const errorClasses = "text-xs text-destructive mt-1";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className={labelClasses}>التصنيف *</label>
          <select
            name="categoryId"
            value={formData.categoryId || ''}
            onChange={handleChange}
            className={`${inputClasses} ${errors.categoryId ? 'border-destructive' : ''}`}
            required
          >
            <option value="">اختر التصنيف</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className={errorClasses}>{errors.categoryId}</p>
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
            required
            placeholder="0.00"
          />
          {errors.amount && (
            <p className={errorClasses}>{errors.amount}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className={labelClasses}>الوصف *</label>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          className={`${inputClasses} min-h-[100px] ${errors.description ? 'border-destructive' : ''}`}
          required
          placeholder="أدخل وصف المصروف هنا..."
        />
        {errors.description && (
          <p className={errorClasses}>{errors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className={labelClasses}>التاريخ *</label>
          <input
            name="date"
            type="date"
            value={formData.date || ''}
            onChange={handleChange}
            className={`${inputClasses} ${errors.date ? 'border-destructive' : ''}`}
            required
          />
          {errors.date && (
            <p className={errorClasses}>{errors.date}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className={labelClasses}>الفرع</label>
          <select
            name="branchId"
            value={formData.branchId || ''}
            onChange={handleChange}
            className={inputClasses}
          >
            <option value="">اختر الفرع</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vendors.length > 0 && (
          <div className="space-y-1">
            <label className={labelClasses}>المورد</label>
            <select
              name="vendorId"
              value={formData.vendorId || ''}
              onChange={handleChange}
              className={inputClasses}
            >
              <option value="">اختر المورد</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1">
          <label className={labelClasses}>رقم المرجع</label>
          <input
            name="referenceNumber"
            type="text"
            value={formData.referenceNumber || ''}
            onChange={handleChange}
            className={inputClasses}
            placeholder="رقم المرجع أو الفاتورة"
          />
          <p className="text-[10px] text-muted-foreground mt-1">رقم المرجع أو الفاتورة من المورد</p>
        </div>
      </div>
    </div>
  );
};

export default ExpenseForm;
