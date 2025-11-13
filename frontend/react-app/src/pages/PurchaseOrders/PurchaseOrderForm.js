import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Card } from '../../components/ui/Card';
import { Plus, Trash2, Calculator, Package } from 'lucide-react';
import api from '../../services/api';

const PurchaseOrderForm = ({ order, vendors = [], onSave, onCancel }) => {
  // Ensure vendors is always an array to prevent map errors
  const safeVendors = Array.isArray(vendors) ? vendors : [];
  
  // Helper function to format date to Gregorian (ميلادي) format
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
    orderDate: getCurrentGregorianDate(), // Gregorian date (ميلادي)
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
          inventoryItemId: item.inventoryItemId ? item.inventoryItemId.toString() : ''
        })) : []
      });
    }
  }, [order]);

  const fetchInventoryItems = async () => {
    try {
      const response = await api.getInventoryItems();
      // Handle different response structures
      const items = response?.data?.inventoryItems || response?.inventoryItems || response || [];
      setInventoryItems(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      // Set empty array as fallback to prevent map errors
      setInventoryItems([]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    
    // Clear submit error when user makes any change
    if (errors.submit) {
      setErrors(prev => ({
        ...prev,
        submit: ''
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };

    // Calculate total price if quantity or unit price changed
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = parseFloat(field === 'quantity' ? value : newItems[index].quantity) || 0;
      const unitPrice = parseFloat(field === 'unitPrice' ? value : newItems[index].unitPrice) || 0;
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

    // Validate items
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
    <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات الطلب الأساسية</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="vendorId">المورد *</Label>
            <Select
              value={formData.vendorId}
              onValueChange={(value) => handleInputChange('vendorId', value)}
              options={[
                { value: '', label: 'اختر المورد' },
                ...safeVendors.map(vendor => ({
                  value: vendor.id.toString(),
                  label: vendor.name
                }))
              ]}
              className={errors.vendorId ? 'border-red-500' : ''}
            />
            {errors.vendorId && (
              <p className="mt-1 text-sm text-red-600">{errors.vendorId}</p>
            )}
          </div>

          <div>
            <Label htmlFor="status">الحالة</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
              options={statusOptions}
            />
          </div>

          <div>
            <Label htmlFor="orderNumber">رقم الطلب</Label>
            <Input
              id="orderNumber"
              type="text"
              value={formData.orderNumber}
              onChange={(e) => handleInputChange('orderNumber', e.target.value)}
              placeholder="أدخل رقم الطلب"
            />
          </div>

          <div>
            <Label htmlFor="orderDate">تاريخ الطلب (ميلادي) *</Label>
            <Input
              id="orderDate"
              type="date"
              value={formData.orderDate}
              onChange={(e) => handleInputChange('orderDate', e.target.value)}
              className={errors.orderDate ? 'border-red-500' : ''}
            />
            {errors.orderDate && (
              <p className="mt-1 text-sm text-red-600">{errors.orderDate}</p>
            )}
          </div>

          <div>
            <Label htmlFor="expectedDeliveryDate">تاريخ التسليم المتوقع (ميلادي)</Label>
            <Input
              id="expectedDeliveryDate"
              type="date"
              value={formData.expectedDeliveryDate}
              onChange={(e) => handleInputChange('expectedDeliveryDate', e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="notes">ملاحظات</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="أدخل أي ملاحظات إضافية"
            rows={3}
          />
        </div>
      </Card>

      {/* Items */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">عناصر الطلب</h3>
          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            className="flex items-center bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 transition-colors"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة عنصر
          </Button>
        </div>

        {errors.items && (
          <p className="mb-4 text-sm text-red-600">{errors.items}</p>
        )}

        {formData.items.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-600 mb-2">لا توجد عناصر في الطلب</h4>
            <p className="text-sm text-gray-500 mb-4">ابدأ بإضافة العناصر التي تريد طلبها</p>
            <Button
              type="button"
              onClick={addItem}
              className="flex items-center mx-auto bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة أول عنصر
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {formData.items.map((item, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                {/* Item Header */}
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-medium text-gray-900">عنصر #{index + 1}</h4>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 ml-1" />
                    حذف
                  </Button>
                </div>

                {/* Item Fields */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                  {/* Inventory Item Selection */}
                  <div className="lg:col-span-2">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">الصنف *</Label>
                    <Select
                      value={item.inventoryItemId}
                      onValueChange={(value) => handleItemChange(index, 'inventoryItemId', value)}
                      options={[
                        { value: '', label: 'اختر الصنف' },
                        ...safeInventoryItems.map(invItem => ({
                          value: invItem.id.toString(),
                          label: invItem.name
                        }))
                      ]}
                      className={errors[`item_${index}_inventoryItemId`] ? 'border-red-500' : ''}
                    />
                    {errors[`item_${index}_inventoryItemId`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_inventoryItemId`]}</p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">الكمية *</Label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className={errors[`item_${index}_quantity`] ? 'border-red-500' : ''}
                      placeholder="1"
                    />
                    {errors[`item_${index}_quantity`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_quantity`]}</p>
                    )}
                  </div>

                  {/* Unit Price */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">سعر الوحدة *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className={errors[`item_${index}_unitPrice`] ? 'border-red-500' : ''}
                      placeholder="0.00"
                    />
                    {errors[`item_${index}_unitPrice`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_unitPrice`]}</p>
                    )}
                  </div>
                </div>

                {/* Total Price Display */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">إجمالي العنصر:</span>
                    <div className="flex items-center">
                      <Calculator className="w-4 h-4 text-gray-400 ml-2" />
                      <span className="text-lg font-semibold text-blue-600">
                        {item.totalPrice ? `${item.totalPrice.toLocaleString()} جنية` : '0 جنية'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        {formData.items.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">إجمالي الطلب:</span>
              <span className="text-xl font-bold text-blue-600">
                {calculateTotal().toLocaleString()} جنية
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Submit Error */}
      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 space-x-reverse pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="min-w-[120px]"
        >
          {loading ? 'جاري الحفظ...' : (order ? 'تحديث' : 'إنشاء')}
        </Button>
      </div>
      </form>
    </div>
  );
};

export default PurchaseOrderForm;
