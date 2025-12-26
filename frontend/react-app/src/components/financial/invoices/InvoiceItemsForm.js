// Invoice Items Form Component
// Component for managing invoice items

import React, { useState } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import { SimpleCard, SimpleCardContent } from '../../ui/SimpleCard';
import SimpleButton from '../../ui/SimpleButton';

const InvoiceItemsForm = ({ items = [], onChange, errors }) => {
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    unitPrice: 0
  });

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'unitPrice' ? parseFloat(value) || 0 : value
    }));
  };

  const handleAddItem = () => {
    if (!newItem.description || newItem.quantity <= 0 || newItem.unitPrice <= 0) {
      return;
    }

    const item = {
      ...newItem,
      id: Date.now(),
      totalPrice: newItem.quantity * newItem.unitPrice
    };

    const updatedItems = [...items, item];
    onChange(updatedItems);

    // Reset form
    setNewItem({
      description: '',
      quantity: 1,
      unitPrice: 0
    });
  };

  const handleRemoveItem = (itemId) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    onChange(updatedItems);
  };

  const handleUpdateItem = (itemId, field, value) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.totalPrice = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    });
    onChange(updatedItems);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount || 0);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  const inputClasses = "w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none bg-background text-foreground text-sm transition-all";
  const labelClasses = "block text-sm font-medium text-foreground mb-1";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-foreground">عناصر الفاتورة</h3>
      </div>

      {errors?.items && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md p-3 mb-4 text-right">
          {errors.items}
        </div>
      )}

      {/* Add Item Form */}
      <SimpleCard className="mb-6">
        <SimpleCardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-5 space-y-1">
              <label className={labelClasses}>الوصف</label>
              <input
                type="text"
                name="description"
                value={newItem.description}
                onChange={handleItemChange}
                className={inputClasses}
                placeholder="وصف العنصر..."
                required
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className={labelClasses}>الكمية</label>
              <input
                type="number"
                name="quantity"
                value={newItem.quantity}
                onChange={handleItemChange}
                className={inputClasses}
                min="1"
                required
              />
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className={labelClasses}>سعر الوحدة</label>
              <input
                type="number"
                name="unitPrice"
                value={newItem.unitPrice}
                onChange={handleItemChange}
                className={inputClasses}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="md:col-span-2">
              <SimpleButton
                onClick={handleAddItem}
                disabled={!newItem.description || newItem.quantity <= 0 || newItem.unitPrice <= 0}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة</span>
              </SimpleButton>
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* Items Table */}
      {items.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm text-right">
            <thead className="bg-muted text-muted-foreground font-medium text-right">
              <tr>
                <th className="px-4 py-3 text-right">الوصف</th>
                <th className="px-4 py-3 w-24 text-center">الكمية</th>
                <th className="px-4 py-3 w-32 text-center">سعر الوحدة</th>
                <th className="px-4 py-3 w-32 text-left">الإجمالي</th>
                <th className="px-4 py-3 w-16 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.id} className="bg-card hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-primary rounded px-2 py-1 text-right"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-primary rounded px-2 py-1 text-center"
                      min="1"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-primary rounded px-2 py-1 text-center"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="px-4 py-2 font-bold text-foreground text-left">
                    {formatCurrency(item.totalPrice)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 bg-muted/20 rounded-lg border border-dashed border-border text-center">
          <Info className="w-10 h-10 text-muted-foreground mb-2 opacity-20" />
          <p className="text-muted-foreground">لا توجد عناصر. أضف عنصراً على الأقل.</p>
        </div>
      )}

      {/* Summary */}
      {items.length > 0 && (
        <div className="flex justify-end pt-4">
          <div className="w-full max-w-[300px] space-y-2">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>المجموع الفرعي</span>
              <span className="font-bold text-foreground">{formatCurrency(subtotal)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceItemsForm;
