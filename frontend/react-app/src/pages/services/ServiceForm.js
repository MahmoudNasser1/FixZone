import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, 
  X, 
  Package, 
  DollarSign, 
  Clock, 
  FileText,
  Tag,
  AlertCircle
} from 'lucide-react';
import apiService from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import SimpleButton from '../../components/ui/SimpleButton';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/Select';
import { Loading } from '../../components/ui/Loading';

const ServiceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const notifications = useNotifications();
  const notify = (type, message) => {
    notifications.addNotification({ type, message });
  };
  const isEdit = Boolean(id);

  // Form state
  const [formData, setFormData] = useState({
    serviceName: '',
    description: '',
    basePrice: '',
    category: '',
    estimatedDuration: '',
    isActive: true
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [errors, setErrors] = useState({});

  // Categories options
  const categories = [
    'صيانة عامة',
    'إصلاح الشاشة',
    'إصلاح البطارية',
    'إصلاح الكاميرا',
    'إصلاح السماعات',
    'إصلاح الشاحن',
    'تحديث البرامج',
    'استعادة البيانات',
    'إصلاح الهاردوير',
    'خدمات أخرى'
  ];

  // Load service data for editing
  useEffect(() => {
    if (isEdit) {
      loadServiceData();
    }
  }, [id, isEdit]);

  const loadServiceData = async () => {
    try {
      setInitialLoading(true);
      const service = await apiService.getService(id);
      
      setFormData({
        serviceName: service.name || '',
        description: service.description || '',
        basePrice: service.basePrice || '',
        category: service.category || '',
        estimatedDuration: service.estimatedDuration || '',
        isActive: service.isActive !== undefined ? service.isActive : true
      });
    } catch (error) {
      console.error('Error loading service:', error);
      notify('error', 'خطأ في تحميل بيانات الخدمة');
      navigate('/services');
    } finally {
      setInitialLoading(false);
    }
  };

  // Handle input changes
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
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.serviceName.trim()) {
      newErrors.serviceName = 'اسم الخدمة مطلوب';
    }

    if (!formData.basePrice || formData.basePrice <= 0) {
      newErrors.basePrice = 'السعر الأساسي مطلوب ويجب أن يكون أكبر من صفر';
    }

    if (formData.estimatedDuration && formData.estimatedDuration < 0) {
      newErrors.estimatedDuration = 'المدة المقدرة يجب أن تكون أكبر من أو تساوي صفر';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      notify('error', 'يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    try {
      setLoading(true);

      const serviceData = {
        name: formData.serviceName.trim(),
        description: formData.description.trim(),
        basePrice: parseFloat(formData.basePrice),
        category: formData.category || null,
        estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : null,
        isActive: formData.isActive
      };

      if (isEdit) {
        await apiService.updateService(id, serviceData);
      } else {
        await apiService.createService(serviceData);
      }

      notify('success', `تم ${isEdit ? 'تحديث' : 'إنشاء'} الخدمة بنجاح`);
      navigate('/services');
    } catch (error) {
      console.error('Error saving service:', error);
      notify('error', `خطأ في ${isEdit ? 'تحديث' : 'إنشاء'} الخدمة: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/services');
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="xl" text="جاري تحميل بيانات الخدمة..." />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit ? 'تعديل بيانات الخدمة' : 'أضف خدمة جديدة إلى الكتالوج'}
            </p>
          </div>
          <SimpleButton
            variant="outline"
            onClick={handleCancel}
            className="text-gray-600 border-gray-300"
          >
            <X className="w-4 h-4 ml-2" />
            إلغاء
          </SimpleButton>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اسم الخدمة <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Package className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                value={formData.serviceName}
                onChange={(e) => handleInputChange('serviceName', e.target.value)}
                placeholder="مثال: إصلاح شاشة iPhone"
                className="pr-10"
                required
              />
              {errors.serviceName && (
                <p className="text-red-500 text-sm mt-1">{errors.serviceName}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              وصف الخدمة
            </label>
            <div className="relative">
              <FileText className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="وصف تفصيلي للخدمة..."
                rows={4}
                className="pr-10"
              />
            </div>
          </div>

          {/* Category and Base Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الفئة
              </label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger className="pr-10">
                  <Tag className="absolute right-3 w-4 h-4 text-gray-400" />
                  <SelectValue placeholder="اختر فئة الخدمة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">اختر الفئة</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                السعر الأساسي (ج.م) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => handleInputChange('basePrice', e.target.value)}
                  placeholder="0.00"
                  className="pr-10"
                  min="0"
                  step="0.01"
                  required
                />
                {errors.basePrice && (
                  <p className="text-red-500 text-sm mt-1">{errors.basePrice}</p>
                )}
              </div>
            </div>
          </div>

          {/* Estimated Duration and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المدة المقدرة (دقيقة)
              </label>
              <div className="relative">
                <Clock className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
                  placeholder="60"
                  className="pr-10"
                  min="0"
                />
                {errors.estimatedDuration && (
                  <p className="text-red-500 text-sm mt-1">{errors.estimatedDuration}</p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                المدة المتوقعة لإنجاز هذه الخدمة
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                حالة الخدمة
              </label>
              <Select
                value={formData.isActive ? 'active' : 'inactive'}
                onValueChange={(value) => handleInputChange('isActive', value === 'active')}
              >
                <SelectTrigger className="pr-10">
                  <AlertCircle className="absolute right-3 w-4 h-4 text-gray-400" />
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                الخدمات غير النشطة لن تظهر في القوائم العامة
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 space-x-reverse pt-6 border-t border-gray-200">
            <SimpleButton
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="text-gray-600 border-gray-300"
            >
              <X className="w-4 h-4 ml-2" />
              إلغاء
            </SimpleButton>
            <SimpleButton
              type="submit"
              loading={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="w-4 h-4 ml-2" />
              {isEdit ? 'حفظ التغييرات' : 'إنشاء الخدمة'}
            </SimpleButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceForm;

