import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, Package, Check, X } from 'lucide-react';
import { SimpleCard, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import api from '../../services/api';

const PurchaseOrderForm = ({ order, vendors = [], onSave, onCancel }) => {
  // Ensure vendors is always an array to prevent map errors
  const safeVendors = Array.isArray(vendors) ? vendors : [];

  // Helper function to format date to Gregorian format
  const formatGregorianDate = (date) => {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  // Helper function to get current Gregorian date
  const getCurrentGregorianDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    status: 'draft',
    vendorId: '',
    orderNumber: '',
    orderDate: getCurrentGregorianDate(),
    expectedDeliveryDate: '',
    notes: '',
    items: []
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);

  // Ensure inventory items is always an array to prevent map errors
  const safeInventoryItems = Array.isArray(inventoryItems) ? inventoryItems : [];

  useEffect(() => {
    fetchInventoryItems();

    if (order) {
      setFormData({
        status: order.status || 'draft',
        vendorId: order.vendorId ? order.vendorId.toString() : '',
        orderNumber: order.orderNumber || '',
        orderDate: order.orderDate ? formatGregorianDate(order.orderDate) : getCurrentGregorianDate(),
        expectedDeliveryDate: order.expectedDeliveryDate ? formatGregorianDate(order.expectedDeliveryDate) : '',
        notes: order.notes || '',
        items: order.items ? order.items.map(item => ({
          ...item,
          inventoryItemId: item.inventoryItemId ? item.inventoryItemId.toString() : '',
          quantity: parseFloat(item.quantity) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          totalPrice: (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)
        })) : []
      });
    }
  }, [order]);

  const fetchInventoryItems = async () => {
    try {
      const response = await api.getInventoryItems();
      const items = response?.data?.inventoryItems || response?.inventoryItems || response || [];
      setInventoryItems(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      setInventoryItems([]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    const updatedValue = (field === 'quantity' || field === 'unitPrice') ? parseFloat(value) || 0 : value;

    newItems[index] = {
      ...newItems[index],
      [field]: updatedValue
    };

    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? updatedValue : (newItems[index].quantity || 0);
      const unitPrice = field === 'unitPrice' ? updatedValue : (newItems[index].unitPrice || 0);
      newItems[index].totalPrice = quantity * unitPrice;
    }

    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        inventoryItemId: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0
      }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vendorId) {
      newErrors.vendorId = 'المورد مطلوب';
    }

    if (!formData.orderDate) {
      newErrors.orderDate = 'تاريخ الطلب مطلوب';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'يجب إضافة عنصر واحد على الأقل';
    }

    formData.items.forEach((item, index) => {
      if (!item.inventoryItemId) {
        newErrors[`item_${index}_inventoryItemId`] = 'الصنف مطلوب';
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'الكمية يجب أن تكون أكبر من صفر';
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        newErrors[`item_${index}_unitPrice`] = 'السعر يجب أن يكون أكبر من صفر';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving purchase order:', error);
      setErrors({ submit: 'حدث خطأ أثناء حفظ الطلب. يرجى المحاولة مرة أخرى.' });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => total + (item.totalPrice || 0), 0);
  };

  const statusOptions = [
    { value: 'draft', label: 'مسودة' },
    { value: 'pending', label: 'في الانتظار' },
    { value: 'approved', label: 'موافق عليه' },
    { value: 'completed', label: 'مكتمل' },
    { value: 'cancelled', label: 'ملغي' }
  ];

  return (
    <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-1 text-right" dir="rtl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <SimpleCard>
          <SimpleCardContent className="p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 border-b pb-2">معلومات الطلب الأساسية</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">المورد *</label>
                <select
                  value={formData.vendorId}
                  onChange={(e) => handleInputChange('vendorId', e.target.value)}
                  className={`w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground ${errors.vendorId ? 'border-destructive' : 'border-input'}`}
                >
                  <option value="">اختر المورد</option>
                  {safeVendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id.toString()}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
                {errors.vendorId && (
                  <p className="text-xs text-destructive mt-1">{errors.vendorId}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">الحالة</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">رقم الطلب</label>
                <input
                  type="text"
                  value={formData.orderNumber}
                  onChange={(e) => handleInputChange('orderNumber', e.target.value)}
                  placeholder="أدخل رقم الطلب"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">تاريخ الطلب *</label>
                <input
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) => handleInputChange('orderDate', e.target.value)}
                  className={`w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground ${errors.orderDate ? 'border-destructive' : 'border-input'}`}
                />
                {errors.orderDate && (
                  <p className="text-xs text-destructive mt-1">{errors.orderDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">تاريخ التسليم المتوقع</label>
                <input
                  type="date"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) => handleInputChange('expectedDeliveryDate', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium text-foreground">ملاحظات</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="أدخل أي ملاحظات إضافية"
                rows={3}
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
              />
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* Items */}
        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-foreground">عناصر الطلب</h3>
              <SimpleButton
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="flex items-center text-primary"
              >
                <Plus className="w-4 h-4 ml-1" />
                إضافة عنصر
              </SimpleButton>
            </div>

            {errors.items && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                {errors.items}
              </div>
            )}

            {formData.items.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed border-border group hover:bg-muted/50 transition-colors">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h4 className="text-lg font-medium text-foreground mb-2">لا توجد عناصر في الطلب</h4>
                <p className="text-sm text-muted-foreground mb-6">ابدأ بإضافة العناصر التي تريد طلبها</p>
                <SimpleButton
                  type="button"
                  onClick={addItem}
                >
                  <Plus className="w-4 h-4 ml-1" />
                  إضافة أول عنصر
                </SimpleButton>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="bg-muted/20 border border-border rounded-lg p-4 relative group">
                    <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <SimpleButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-destructive h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </SimpleButton>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* Inventory Item Selection */}
                      <div className="lg:col-span-12 xl:col-span-6 space-y-2">
                        <label className="text-xs font-medium text-foreground">الصنف *</label>
                        <select
                          value={item.inventoryItemId}
                          onChange={(e) => handleItemChange(index, 'inventoryItemId', e.target.value)}
                          className={`w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm ${errors[`item_${index}_inventoryItemId`] ? 'border-destructive' : 'border-input'}`}
                        >
                          <option value="">اختر الصنف</option>
                          {safeInventoryItems.map(invItem => (
                            <option key={invItem.id} value={invItem.id.toString()}>
                              {invItem.name}
                            </option>
                          ))}
                        </select>
                        {errors[`item_${index}_inventoryItemId`] && (
                          <p className="text-[10px] text-destructive">{errors[`item_${index}_inventoryItemId`]}</p>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="lg:col-span-4 xl:col-span-2 space-y-2">
                        <label className="text-xs font-medium text-foreground">الكمية *</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className={`w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm ${errors[`item_${index}_quantity`] ? 'border-destructive' : 'border-input'}`}
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="lg:col-span-4 xl:col-span-2 space-y-2">
                        <label className="text-xs font-medium text-foreground">سعر الوحدة *</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                          className={`w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm ${errors[`item_${index}_unitPrice`] ? 'border-destructive' : 'border-input'}`}
                        />
                      </div>

                      {/* Total Price Display */}
                      <div className="lg:col-span-4 xl:col-span-2 flex flex-col justify-end pb-1">
                        <div className="bg-primary/5 rounded px-3 py-2 border border-primary/10 flex items-center justify-between">
                          <span className="text-[10px] font-medium text-muted-foreground">الإجمالي:</span>
                          <span className="text-sm font-bold text-primary">
                            {item.totalPrice ? `${item.totalPrice.toLocaleString()} جنية` : '0 جنية'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Total Summary */}
                <div className="mt-6 flex justify-between items-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-primary" />
                    <span className="text-lg font-bold text-foreground">إجمالي طلب الشراء</span>
                  </div>
                  <span className="text-2xl font-black text-primary">
                    {calculateTotal().toLocaleString()} جنية
                  </span>
                </div>
              </div>
            )}
          </SimpleCardContent>
        </SimpleCard>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-6 border-t border-border">
          <SimpleButton
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            إلغاء
          </SimpleButton>
          <SimpleButton
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto min-w-[150px]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري الحفظ...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {order ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {order ? 'تحديث الطلب' : 'إنشاء الطلب'}
              </span>
            )}
          </SimpleButton>
        </div>

        {errors.submit && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 text-destructive">
            <X className="w-5 h-5" />
            <p className="text-sm font-medium">{errors.submit}</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default PurchaseOrderForm;
