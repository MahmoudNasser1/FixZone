import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import apiService from '../../services/api';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import { Input } from '../../components/ui/Input';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { 
  ArrowRight, User, Phone, Mail, Shield, Save, X, AlertCircle,
  CheckCircle, Calendar, Key, UserCheck, UserX
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const EditUserPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roleId: '',
    isActive: true,
    password: '',
    confirmPassword: ''
  });
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (id === 'new') {
      return;
    }
    fetchUserDetails();
    fetchRoles();
  }, [id]);

  if (id === 'new') {
    return <Navigate to="/users/new" replace />;
  }

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // apiService.getUser() يرجع JSON مباشر وليس Response object
      const result = await apiService.getUserById?.(id) || await apiService.request(`/users/${id}`);
      
      // Backend يرجع { success: true, data: {...} } أو { ... } مباشر
      let userData = null;
      if (result?.success && result?.data) {
        userData = result.data;
      } else if (result?.id) {
        userData = result;
      } else {
        throw new Error('User not found');
      }
      
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        roleId: userData.roleId || '',
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        password: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err.message || 'تعذر تحميل بيانات المستخدم');
      notifications.error('خطأ في تحميل بيانات المستخدم', { message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const result = await apiService.listRoles();
      const rolesArray = Array.isArray(result) ? result : (result?.items || result?.data || []);
      setRoles(rolesArray);
    } catch (err) {
      console.error('Error fetching roles:', err);
      notifications.error('خطأ في تحميل الأدوار');
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = 'الاسم مطلوب ويجب أن يكون على الأقل حرفين';
    }
    
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'البريد الإلكتروني غير صحيح';
    }
    
    if (!formData.roleId) {
      errors.roleId = 'الدور مطلوب';
    }
    
    if (formData.password && formData.password.length < 6) {
      errors.password = 'كلمة المرور يجب أن تكون على الأقل 6 أحرف';
    }
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'كلمة المرور غير متطابقة';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      notifications.error('يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      // إعداد البيانات للإرسال (بدون confirmPassword)
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        roleId: Number(formData.roleId),
        isActive: Boolean(formData.isActive) // Ensure boolean
      };
      
      // إضافة كلمة المرور فقط إذا تم إدخالها
      if (formData.password && formData.password.trim()) {
        updateData.password = formData.password;
      }
      
      const result = await apiService.updateUser(id, updateData);
      
      if (result?.success || result?.message) {
        notifications.success('تم تحديث المستخدم بنجاح');
        navigate(`/users/${id}`);
      } else {
        throw new Error(result?.message || 'فشل تحديث المستخدم');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      
      // Handle validation errors with details
      let errorMsg = err.message || 'حدث خطأ في تحديث المستخدم';
      
      // If there are validation error details, show them
      if (err.details && Array.isArray(err.details)) {
        const validationErrors = {};
        err.details.forEach(detail => {
          if (typeof detail === 'object' && detail.field) {
            validationErrors[detail.field] = detail.message || 'خطأ في التحقق';
          }
        });
        
        if (Object.keys(validationErrors).length > 0) {
          setValidationErrors(validationErrors);
          // Build user-friendly error message
          const errorMessages = Object.values(validationErrors).join(', ');
          errorMsg = `خطأ في التحقق من البيانات: ${errorMessages}`;
        }
      }
      
      setError(errorMsg);
      notifications.error('خطأ في تحديث المستخدم', { message: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // مسح خطأ الحقل عند التعديل
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <div className="p-6">
        <SimpleCard>
          <SimpleCardContent>
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل البيانات</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <SimpleButton onClick={() => navigate('/users')} variant="outline">
                <ArrowRight className="w-4 h-4 ml-2" />
                العودة لقائمة المستخدمين
              </SimpleButton>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SimpleButton
            onClick={() => navigate('/users')}
            variant="ghost"
            size="sm"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة
          </SimpleButton>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">تعديل المستخدم</h1>
            <p className="text-sm text-gray-500">تحديث معلومات المستخدم والصلاحيات</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle>معلومات المستخدم</SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="اسم المستخدم"
                  className={validationErrors.name ? 'border-red-500' : ''}
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  className={validationErrors.email ? 'border-red-500' : ''}
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهاتف
                </label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="01123456789"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الدور <span className="text-red-500">*</span>
                </label>
                <select
                  name="roleId"
                  value={formData.roleId}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.roleId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">اختر الدور</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                {validationErrors.roleId && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.roleId}</p>
                )}
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span>المستخدم نشط</span>
                </label>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* Password Section */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle>تغيير كلمة المرور</SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <p className="text-sm text-gray-500 mb-4">اترك الحقول فارغة إذا لم ترد تغيير كلمة المرور</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  كلمة المرور الجديدة
                </label>
                <Input
                  type="password"
                  name="password"
                  lang="en"
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="اتركه فارغاً للحفاظ على كلمة المرور الحالية"
                  className={validationErrors.password ? 'border-red-500' : ''}
                />
                {validationErrors.password && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تأكيد كلمة المرور
                </label>
                <Input
                  type="password"
                  name="confirmPassword"
                  lang="en"
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="أعد إدخال كلمة المرور"
                  className={validationErrors.confirmPassword ? 'border-red-500' : ''}
                />
                {validationErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.confirmPassword}</p>
                )}
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <SimpleButton
            type="button"
            onClick={() => navigate(`/users/${id}`)}
            variant="outline"
          >
            <X className="w-4 h-4 ml-2" />
            إلغاء
          </SimpleButton>
          <SimpleButton
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <>
                <LoadingSpinner className="ml-2" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                حفظ التغييرات
              </>
            )}
          </SimpleButton>
        </div>
      </form>
    </div>
  );
};

export default EditUserPage;

