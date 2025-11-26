import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import { Input } from '../../components/ui/Input';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { ArrowLeft, Save, X } from 'lucide-react';
import inventoryService from '../../services/inventoryService';
import { getDefaultApiBaseUrl } from '../../lib/apiConfig';

const API_BASE_URL = getDefaultApiBaseUrl();

const NewInventoryItemPage = () => {
  const navigate = useNavigate();
  const notifications = useNotifications();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    purchasePrice: 0,
    sellingPrice: 0,
    unit: 'قطعة'
  });

  const categories = [
    'شاشات',
    'بطاريات',
    'أزرار',
    'كاميرات',
    'سماعات',
    'شواحن',
    'كابلات',
    'لوحات المفاتيح',
    'إكسسوارات',
    'أخرى'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Price')
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      notifications.error('اسم الصنف مطلوب');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        notifications.success('تم إضافة الصنف بنجاح');
        navigate('/inventory');
      } else {
        notifications.error(data.message || 'فشل في إضافة الصنف');
      }
    } catch (error) {
      console.error('Error adding inventory item:', error);
      notifications.error('حدث خطأ أثناء إضافة الصنف');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SimpleButton
            variant="ghost"
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </SimpleButton>
          <h1 className="text-2xl font-bold text-gray-900">إضافة صنف جديد</h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle>معلومات الصنف الأساسية</SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent className="space-y-6">
            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رمز المنتج (SKU) <span className="text-gray-400">(اختياري)</span>
              </label>
              <Input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                placeholder="مثال: LCD-15-001"
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم الصنف <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="مثال: شاشة LCD 15.6 بوصة"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الوصف <span className="text-gray-400">(اختياري)</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="وصف مفصل للصنف..."
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الفئة
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">اختر الفئة</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وحدة القياس
              </label>
              <Input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                placeholder="مثال: قطعة، متر، كيلوغرام"
              />
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* Pricing */}
        <SimpleCard className="mt-6">
          <SimpleCardHeader>
            <SimpleCardTitle>الأسعار</SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  سعر الشراء
                </label>
                <Input
                  type="number"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  سعر البيع
                </label>
                <Input
                  type="number"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>



        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-4">
          <SimpleButton
            type="button"
            variant="outline"
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            إلغاء
          </SimpleButton>
          <SimpleButton
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'جاري الحفظ...' : 'حفظ الصنف'}
          </SimpleButton>
        </div>
      </form>
    </div>
  );
};

export default NewInventoryItemPage;
