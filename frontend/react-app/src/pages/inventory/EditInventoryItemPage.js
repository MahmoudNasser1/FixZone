import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import { Input } from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { ArrowLeft, Save, X } from 'lucide-react';
import { getDefaultApiBaseUrl } from '../../lib/apiConfig';

const API_BASE_URL = getDefaultApiBaseUrl();

const EditInventoryItemPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const notifications = useNotifications();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data || result;
        setFormData({
          sku: data.sku || '',
          name: data.name || '',
          description: data.description || '',
          category: data.type || data.category || '',
          purchasePrice: data.purchasePrice || 0,
          sellingPrice: data.sellingPrice || 0,
          unit: data.unit || 'قطعة'
        });
      } else {
        notifications.error('فشل في تحميل بيانات الصنف');
        navigate('/inventory');
      }
    } catch (error) {
      console.error('Error loading inventory item:', error);
      notifications.error('حدث خطأ أثناء تحميل بيانات الصنف');
      navigate('/inventory');
    } finally {
      setLoading(false);
    }
  };

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
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        notifications.success('تم تحديث الصنف بنجاح');
        navigate('/inventory');
      } else {
        notifications.error(data.message || 'فشل في تحديث الصنف');
      }
    } catch (error) {
      console.error('Error updating inventory item:', error);
      notifications.error('حدث خطأ أثناء تحديث الصنف');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">تعديل صنف</h1>
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
        
        {/* Stock Management Note */}
        <SimpleCard className="mt-6 bg-blue-50 border-blue-200">
          <SimpleCardContent className="p-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">إدارة الكمية</h3>
                <p className="text-sm text-blue-800">
                  لإدارة الكمية المتاحة، يرجى الانتقال إلى قسم المخازن وإضافة الكمية المطلوبة لكل مخزن.
                </p>
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
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </SimpleButton>
        </div>
      </form>
    </div>
  );
};

export default EditInventoryItemPage;
