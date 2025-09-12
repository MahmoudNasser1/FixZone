import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Save, X, Settings, 
  Tag, Smartphone, Laptop, Tablet, Package,
  ChevronDown, ChevronRight, AlertTriangle
} from 'lucide-react';
import { SimpleCard, SimpleCardContent, SimpleCardHeader, SimpleCardTitle } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import Breadcrumb from '../../components/layout/Breadcrumb';
import apiService from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';

const SystemVariablesPage = () => {
  const notifications = useNotifications();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State للفئات
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  
  // State للخيارات
  const [options, setOptions] = useState({});
  const [editingOption, setEditingOption] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // State للنماذج
  const [categoryForm, setCategoryForm] = useState({
    code: '',
    name: '',
    scope: 'GLOBAL'
  });
  
  const [optionForm, setOptionForm] = useState({
    label: '',
    value: '',
    deviceType: '',
    isActive: true,
    sortOrder: 0
  });

  // تحميل البيانات
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // تحميل الفئات
      const categoriesResponse = await apiService.request('/variable-categories');
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      }
      
      // تحميل الخيارات لكل فئة
      const optionsData = {};
      for (const category of categories) {
        const optionsResponse = await apiService.request(`/variables?category=${category.code}`);
        if (optionsResponse.ok) {
          const categoryOptions = await optionsResponse.json();
          optionsData[category.id] = Array.isArray(categoryOptions) ? categoryOptions : [];
        }
      }
      setOptions(optionsData);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('تعذر تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // إدارة الفئات
  const handleCreateCategory = async () => {
    try {
      const response = await apiService.request('/variable-categories', {
        method: 'POST',
        body: JSON.stringify(categoryForm)
      });
      
      if (response.ok) {
        notifications.success('تم إنشاء الفئة بنجاح');
        setCategoryForm({ code: '', name: '', scope: 'GLOBAL' });
        await loadData();
      } else {
        throw new Error('Failed to create category');
      }
    } catch (err) {
      notifications.error('تعذر إنشاء الفئة');
    }
  };

  const handleUpdateCategory = async (id) => {
    try {
      const response = await apiService.request(`/variable-categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(categoryForm)
      });
      
      if (response.ok) {
        notifications.success('تم تحديث الفئة بنجاح');
        setEditingCategory(null);
        setCategoryForm({ code: '', name: '', scope: 'GLOBAL' });
        await loadData();
      } else {
        throw new Error('Failed to update category');
      }
    } catch (err) {
      notifications.error('تعذر تحديث الفئة');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الفئة؟ سيتم حذف جميع الخيارات المرتبطة بها.')) {
      return;
    }
    
    try {
      const response = await apiService.request(`/variable-categories/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        notifications.success('تم حذف الفئة بنجاح');
        await loadData();
      } else {
        throw new Error('Failed to delete category');
      }
    } catch (err) {
      notifications.error('تعذر حذف الفئة');
    }
  };

  // إدارة الخيارات
  const handleCreateOption = async (categoryId) => {
    try {
      const response = await apiService.request('/variable-options', {
        method: 'POST',
        body: JSON.stringify({
          ...optionForm,
          categoryId
        })
      });
      
      if (response.ok) {
        notifications.success('تم إنشاء الخيار بنجاح');
        setOptionForm({ label: '', value: '', deviceType: '', isActive: true, sortOrder: 0 });
        await loadData();
      } else {
        throw new Error('Failed to create option');
      }
    } catch (err) {
      notifications.error('تعذر إنشاء الخيار');
    }
  };

  const handleUpdateOption = async (id) => {
    try {
      const response = await apiService.request(`/variable-options/${id}`, {
        method: 'PUT',
        body: JSON.stringify(optionForm)
      });
      
      if (response.ok) {
        notifications.success('تم تحديث الخيار بنجاح');
        setEditingOption(null);
        setOptionForm({ label: '', value: '', deviceType: '', isActive: true, sortOrder: 0 });
        await loadData();
      } else {
        throw new Error('Failed to update option');
      }
    } catch (err) {
      notifications.error('تعذر تحديث الخيار');
    }
  };

  const handleDeleteOption = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الخيار؟')) {
      return;
    }
    
    try {
      const response = await apiService.request(`/variable-options/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        notifications.success('تم حذف الخيار بنجاح');
        await loadData();
      } else {
        throw new Error('Failed to delete option');
      }
    } catch (err) {
      notifications.error('تعذر حذف الخيار');
    }
  };

  // تبديل توسيع الفئة
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // الحصول على أيقونة الفئة
  const getCategoryIcon = (code) => {
    switch (code) {
      case 'BRAND': return Tag;
      case 'DEVICE_TYPE': return Smartphone;
      case 'ACCESSORY': return Package;
      default: return Settings;
    }
  };

  // الحصول على لون الفئة
  const getCategoryColor = (code) => {
    switch (code) {
      case 'BRAND': return 'blue';
      case 'DEVICE_TYPE': return 'green';
      case 'ACCESSORY': return 'purple';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Breadcrumb items={[
            { label: 'الرئيسية', href: '/' },
            { label: 'الإعدادات', href: '/settings' },
            { label: 'متغيرات النظام' }
          ]} />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">متغيرات النظام</h1>
          <p className="text-gray-600">إدارة العلامات التجارية وأنواع الأجهزة والمتعلقات</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 ml-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* قائمة الفئات */}
      <div className="space-y-4">
        {categories.map((category) => {
          const CategoryIcon = getCategoryIcon(category.code);
          const isExpanded = expandedCategories[category.id];
          const categoryOptions = options[category.id] || [];
          
          return (
            <SimpleCard key={category.id}>
              <SimpleCardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <CategoryIcon className="w-5 h-5 text-gray-600" />
                    <div>
                      <SimpleCardTitle className="text-lg">{category.name}</SimpleCardTitle>
                      <p className="text-sm text-gray-500">{category.code} • {categoryOptions.length} خيار</p>
                    </div>
                    <SimpleBadge color={getCategoryColor(category.code)}>
                      {category.scope}
                    </SimpleBadge>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <SimpleButton
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingCategory(category.id);
                        setCategoryForm({
                          code: category.code,
                          name: category.name,
                          scope: category.scope
                        });
                      }}
                    >
                      <Edit className="w-4 h-4 ml-1" />
                      تعديل
                    </SimpleButton>
                    <SimpleButton
                      size="sm"
                      variant="outline"
                      color="danger"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="w-4 h-4 ml-1" />
                      حذف
                    </SimpleButton>
                  </div>
                </div>
              </SimpleCardHeader>
              
              {isExpanded && (
                <SimpleCardContent>
                  {/* خيارات الفئة */}
                  <div className="space-y-3">
                    {categoryOptions.map((option) => (
                      <div key={option.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div>
                            <p className="font-medium">{option.label}</p>
                            <p className="text-sm text-gray-500">
                              {option.value} {option.deviceType && `• ${option.deviceType}`}
                            </p>
                          </div>
                          <SimpleBadge color={option.isActive ? 'success' : 'secondary'}>
                            {option.isActive ? 'نشط' : 'معطل'}
                          </SimpleBadge>
                        </div>
                        
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <SimpleButton
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingOption(option.id);
                              setOptionForm({
                                label: option.label,
                                value: option.value,
                                deviceType: option.deviceType || '',
                                isActive: option.isActive,
                                sortOrder: option.sortOrder
                              });
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </SimpleButton>
                          <SimpleButton
                            size="sm"
                            variant="ghost"
                            color="danger"
                            onClick={() => handleDeleteOption(option.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </SimpleButton>
                        </div>
                      </div>
                    ))}
                    
                    {/* إضافة خيار جديد */}
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                      <h4 className="font-medium mb-3">إضافة خيار جديد</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="الاسم"
                          value={optionForm.label}
                          onChange={(e) => setOptionForm(prev => ({ ...prev, label: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="القيمة"
                          value={optionForm.value}
                          onChange={(e) => setOptionForm(prev => ({ ...prev, value: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="نوع الجهاز (اختياري)"
                          value={optionForm.deviceType}
                          onChange={(e) => setOptionForm(prev => ({ ...prev, deviceType: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          placeholder="ترتيب العرض"
                          value={optionForm.sortOrder}
                          onChange={(e) => setOptionForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse mt-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={optionForm.isActive}
                            onChange={(e) => setOptionForm(prev => ({ ...prev, isActive: e.target.checked }))}
                            className="ml-2"
                          />
                          نشط
                        </label>
                        <SimpleButton
                          size="sm"
                          onClick={() => handleCreateOption(category.id)}
                          disabled={!optionForm.label || !optionForm.value}
                        >
                          <Plus className="w-4 h-4 ml-1" />
                          إضافة
                        </SimpleButton>
                      </div>
                    </div>
                  </div>
                </SimpleCardContent>
              )}
            </SimpleCard>
          );
        })}
      </div>

      {/* إضافة فئة جديدة */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle>إضافة فئة جديدة</SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="رمز الفئة (مثل: BRAND)"
              value={categoryForm.code}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="اسم الفئة"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={categoryForm.scope}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, scope: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="GLOBAL">عام</option>
              <option value="DEVICE">جهاز</option>
              <option value="REPAIR">إصلاح</option>
              <option value="CUSTOMER">عميل</option>
            </select>
          </div>
          <div className="mt-4">
            <SimpleButton
              onClick={handleCreateCategory}
              disabled={!categoryForm.code || !categoryForm.name}
            >
              <Plus className="w-4 h-4 ml-1" />
              إضافة فئة
            </SimpleButton>
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* نماذج التعديل */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">تعديل الفئة</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="رمز الفئة"
                value={categoryForm.code}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="اسم الفئة"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={categoryForm.scope}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, scope: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="GLOBAL">عام</option>
                <option value="DEVICE">جهاز</option>
                <option value="REPAIR">إصلاح</option>
                <option value="CUSTOMER">عميل</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse mt-6">
              <SimpleButton onClick={() => handleUpdateCategory(editingCategory)}>
                <Save className="w-4 h-4 ml-1" />
                حفظ
              </SimpleButton>
              <SimpleButton variant="ghost" onClick={() => setEditingCategory(null)}>
                <X className="w-4 h-4 ml-1" />
                إلغاء
              </SimpleButton>
            </div>
          </div>
        </div>
      )}

      {editingOption && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">تعديل الخيار</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="الاسم"
                value={optionForm.label}
                onChange={(e) => setOptionForm(prev => ({ ...prev, label: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="القيمة"
                value={optionForm.value}
                onChange={(e) => setOptionForm(prev => ({ ...prev, value: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="نوع الجهاز (اختياري)"
                value={optionForm.deviceType}
                onChange={(e) => setOptionForm(prev => ({ ...prev, deviceType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="ترتيب العرض"
                value={optionForm.sortOrder}
                onChange={(e) => setOptionForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={optionForm.isActive}
                  onChange={(e) => setOptionForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="ml-2"
                />
                نشط
              </label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse mt-6">
              <SimpleButton onClick={() => handleUpdateOption(editingOption)}>
                <Save className="w-4 h-4 ml-1" />
                حفظ
              </SimpleButton>
              <SimpleButton variant="ghost" onClick={() => setEditingOption(null)}>
                <X className="w-4 h-4 ml-1" />
                إلغاء
              </SimpleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemVariablesPage;
