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
        const data = Array.isArray(categoriesData) ? categoriesData : [];
        setCategories(data);

        // تحميل الخيارات لكل فئة
        const optionsData = {};
        for (const category of data) {
          const optionsResponse = await apiService.request(`/variables?category=${category.code}`);
          if (optionsResponse.ok) {
            const categoryOptions = await optionsResponse.json();
            optionsData[category.id] = Array.isArray(categoryOptions) ? categoryOptions : [];
          }
        }
        setOptions(optionsData);
      }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full">
          <Breadcrumb items={[
            { label: 'الرئيسية', href: '/' },
            { label: 'الإعدادات', href: '/settings' },
            { label: 'متغيرات النظام' }
          ]} />
          <h1 className="text-2xl font-bold text-foreground mt-2">متغيرات النظام</h1>
          <p className="text-muted-foreground">إدارة العلامات التجارية وأنواع الأجهزة والمتعلقات</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-destructive ml-2" />
            <p className="text-destructive-foreground text-sm font-medium">{error}</p>
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
            <SimpleCard key={category.id} className="overflow-hidden">
              <SimpleCardHeader className="bg-muted/30">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 space-x-reverse flex-1">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="p-1.5 hover:bg-background rounded-md transition-colors border border-border"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-foreground" />
                      )}
                    </button>
                    <CategoryIcon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <SimpleCardTitle className="text-lg text-foreground">{category.name}</SimpleCardTitle>
                      <p className="text-xs text-muted-foreground">{category.code} • {categoryOptions.length} خيار</p>
                    </div>
                    <SimpleBadge variant="outline" className="text-[10px] sm:text-xs">
                      {category.scope}
                    </SimpleBadge>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse w-full sm:w-auto">
                    <SimpleButton
                      size="sm"
                      variant="outline"
                      className="flex-1 sm:flex-none"
                      onClick={() => {
                        setEditingCategory(category.id);
                        setCategoryForm({
                          code: category.code,
                          name: category.name,
                          scope: category.scope
                        });
                      }}
                    >
                      <Edit className="w-4 h-4 ml-1.5" />
                      تعديل
                    </SimpleButton>
                    <SimpleButton
                      size="sm"
                      variant="outline"
                      className="flex-1 sm:flex-none text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="w-4 h-4 ml-1.5" />
                      حذف
                    </SimpleButton>
                  </div>
                </div>
              </SimpleCardHeader>

              {isExpanded && (
                <SimpleCardContent className="p-0 border-t border-border">
                  <div className="divide-y divide-border">
                    {categoryOptions.map((option) => (
                      <div key={option.id} className="flex items-center justify-between p-4 bg-background/50 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div>
                            <p className="font-semibold text-foreground">{option.label}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {option.value} {option.deviceType && `• ${option.deviceType}`}
                            </p>
                          </div>
                          <SimpleBadge variant={option.isActive ? 'success' : 'secondary'} className="text-[10px]">
                            {option.isActive ? 'نشط' : 'معطل'}
                          </SimpleBadge>
                        </div>

                        <div className="flex items-center space-x-1 space-x-reverse">
                          <SimpleButton
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
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
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteOption(option.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </SimpleButton>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-muted/20">
                    <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-primary" />
                      إضافة خيار جديد لـ {category.name}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground mr-1">الاسم</label>
                        <input
                          type="text"
                          placeholder="الاسم الشائع"
                          value={optionForm.label}
                          onChange={(e) => setOptionForm(prev => ({ ...prev, label: e.target.value }))}
                          className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground mr-1">القيمة (Unique Code)</label>
                        <input
                          type="text"
                          placeholder="القيمة التقنية"
                          value={optionForm.value}
                          onChange={(e) => setOptionForm(prev => ({ ...prev, value: e.target.value }))}
                          className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground font-mono focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground mr-1">نوع الجهاز (اختياري)</label>
                        <input
                          type="text"
                          placeholder="مثل: MOBILE"
                          value={optionForm.deviceType}
                          onChange={(e) => setOptionForm(prev => ({ ...prev, deviceType: e.target.value }))}
                          className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground mr-1">ترتيب العرض</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={optionForm.sortOrder}
                          onChange={(e) => setOptionForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-10 h-5 rounded-full transition-all duration-300 relative group-hover:scale-105 ${optionForm.isActive ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]' : 'bg-muted border border-border'}`}>
                          <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${optionForm.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <input
                          type="checkbox"
                          checked={optionForm.isActive}
                          onChange={(e) => setOptionForm(prev => ({ ...prev, isActive: e.target.checked }))}
                          className="hidden"
                        />
                        <span className="text-sm font-medium text-foreground">نشط</span>
                      </label>
                      <SimpleButton
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => handleCreateOption(category.id)}
                        disabled={!optionForm.label || !optionForm.value}
                      >
                        <Plus className="w-4 h-4 ml-1.5" />
                        إضافة الخيار
                      </SimpleButton>
                    </div>
                  </div>
                </SimpleCardContent>
              )}
            </SimpleCard>
          );
        })}
      </div>

      {/* إضافة فئة جديدة */}
      <SimpleCard className="border-primary/20 bg-primary/5">
        <SimpleCardHeader>
          <SimpleCardTitle className="text-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة فئة نظام جديدة
          </SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground mr-1">رمز الفئة (Capital)</label>
              <input
                type="text"
                placeholder="مثل: BRAND"
                value={categoryForm.code}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground mr-1">اسم الفئة (العرض)</label>
              <input
                type="text"
                placeholder="اسم الفئة"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground mr-1">نطاق الاستخدام</label>
              <select
                value={categoryForm.scope}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, scope: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="GLOBAL">عام (GLOBAL)</option>
                <option value="DEVICE">جهاز (DEVICE)</option>
                <option value="REPAIR">إصلاح (REPAIR)</option>
                <option value="CUSTOMER">عميل (CUSTOMER)</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <SimpleButton
              onClick={handleCreateCategory}
              disabled={!categoryForm.code || !categoryForm.name}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 ml-1.5" />
              إنشاء الفئة
            </SimpleButton>
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* نماذج التعديل */}
      {editingCategory && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border bg-muted/30">
              <h3 className="text-lg font-bold text-foreground">تعديل فئة النظام</h3>
              <p className="text-xs text-muted-foreground mt-1">تعديل بيانات {categoryForm.name}</p>
            </div>
            <div className="p-6 space-y-4 font-arabic">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground mr-1">رمز الفئة</label>
                <input
                  type="text"
                  placeholder="رمز الفئة"
                  value={categoryForm.code}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground mr-1">اسم الفئة</label>
                <input
                  type="text"
                  placeholder="اسم الفئة"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground mr-1">النطاق</label>
                <select
                  value={categoryForm.scope}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, scope: e.target.value }))}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="GLOBAL">عام</option>
                  <option value="DEVICE">جهاز</option>
                  <option value="REPAIR">إصلاح</option>
                  <option value="CUSTOMER">عميل</option>
                </select>
              </div>
            </div>
            <div className="p-6 bg-muted/30 border-t border-border flex items-center justify-end gap-3 font-arabic">
              <SimpleButton variant="ghost" onClick={() => setEditingCategory(null)}>
                إلغاء
              </SimpleButton>
              <SimpleButton onClick={() => handleUpdateCategory(editingCategory)}>
                <Save className="w-4 h-4 ml-1.5" />
                حفظ التعديلات
              </SimpleButton>
            </div>
          </div>
        </div>
      )}

      {editingOption && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border bg-muted/30">
              <h3 className="text-lg font-bold text-foreground">تعديل خيار النظام</h3>
              <p className="text-xs text-muted-foreground mt-1">تعديل بيانات {optionForm.label}</p>
            </div>
            <div className="p-6 space-y-4 font-arabic">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground mr-1">الاسم</label>
                <input
                  type="text"
                  placeholder="الاسم"
                  value={optionForm.label}
                  onChange={(e) => setOptionForm(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground mr-1">القيمة (Unique Code)</label>
                <input
                  type="text"
                  placeholder="القيمة"
                  value={optionForm.value}
                  onChange={(e) => setOptionForm(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground font-mono outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground mr-1">نوع الجهاز</label>
                  <input
                    type="text"
                    placeholder="مثل: MOBILE"
                    value={optionForm.deviceType}
                    onChange={(e) => setOptionForm(prev => ({ ...prev, deviceType: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground mr-1">الترتيب</label>
                  <input
                    type="number"
                    placeholder="الترتيب"
                    value={optionForm.sortOrder}
                    onChange={(e) => setOptionForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer group mt-2">
                <div className={`w-10 h-5 rounded-full transition-all duration-300 relative group-hover:scale-105 ${optionForm.isActive ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]' : 'bg-muted border border-border'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${optionForm.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <input
                  type="checkbox"
                  checked={optionForm.isActive}
                  onChange={(e) => setOptionForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="hidden"
                />
                <span className="text-sm font-medium text-foreground">نشط</span>
              </label>
            </div>
            <div className="p-6 bg-muted/30 border-t border-border flex items-center justify-end gap-3 font-arabic">
              <SimpleButton variant="ghost" onClick={() => setEditingOption(null)}>
                إلغاء
              </SimpleButton>
              <SimpleButton onClick={() => handleUpdateOption(editingOption)}>
                <Save className="w-4 h-4 ml-1.5" />
                حفظ التعديلات
              </SimpleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemVariablesPage;
