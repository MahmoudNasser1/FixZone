import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import { Input } from '../../components/ui/Input';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import {
  ArrowRight,
  Save,
  AlertCircle,
  CheckCircle,
  UserPlus,
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const NewUserPage = () => {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roleId: '',
    password: '',
    confirmPassword: '',
    isActive: true
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadRoles = async () => {
      try {
        const result = await apiService.listRoles();
        if (!mounted) return;
        const rolesArray = Array.isArray(result) ? result : (result?.items || result?.data || []);
        setRoles(rolesArray);
      } catch (err) {
        console.error('Error loading roles:', err);
        notifications.error('حدث خطأ أثناء تحميل الأدوار');
      } finally {
        if (mounted) {
          setLoadingRoles(false);
        }
      }
    };
    loadRoles();
    return () => {
      mounted = false;
    };
  }, [notifications]);

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
    if (!formData.password || formData.password.length < 6) {
      errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'كلمة المرور غير متطابقة';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      notifications.error('يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        roleId: Number(formData.roleId),
        password: formData.password,
        isActive: Boolean(formData.isActive)
      };
      const result = await apiService.createUser(payload);
      if (result?.success || result?.data) {
        notifications.success('تم إنشاء المستخدم بنجاح');
        navigate('/users');
      } else {
        throw new Error(result?.message || 'فشل إنشاء المستخدم');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      if (err.details && Array.isArray(err.details)) {
        const validationErrors = {};
        err.details.forEach(detail => {
          if (detail?.field) {
            validationErrors[detail.field] = detail.message || 'خطأ في التحقق';
          }
        });
        if (Object.keys(validationErrors).length > 0) {
          setValidationErrors(validationErrors);
        }
      }
      setError(err.message || 'حدث خطأ أثناء إنشاء المستخدم');
      notifications.error('خطأ في إنشاء المستخدم', { message: err.message || '' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  if (loadingRoles) {
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SimpleButton
            variant="ghost"
            size="sm"
            onClick={() => navigate('/users')}
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة
          </SimpleButton>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              إنشاء مستخدم جديد
            </h1>
            <p className="text-sm text-gray-500">أضف مستخدمًا بصلاحيات مخصصة</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle>معلومات المستخدم</SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم <span className="text-red-500">*</span>
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="مثلاً: أحمد عبد الله"
                  className={validationErrors.name ? 'border-red-500' : ''}
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="user@example.com"
                  className={validationErrors.email ? 'border-red-500' : ''}
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهاتف
                </label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="01234567890"
                />
              </div>

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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  كلمة المرور <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="أدخل كلمة مرور من 6 أحرف أو أكثر"
                  className={validationErrors.password ? 'border-red-500' : ''}
                />
                {validationErrors.password && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.password}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تأكيد كلمة المرور <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="أعد إدخال كلمة المرور"
                  className={validationErrors.confirmPassword ? 'border-red-500' : ''}
                />
                {validationErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.confirmPassword}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  المستخدم نشط
                </label>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <div className="flex justify-end gap-3">
          <SimpleButton variant="outline" onClick={() => navigate('/users')}>
            إلغاء
          </SimpleButton>
          <SimpleButton type="submit" disabled={saving || loadingRoles}>
            <Save className="w-4 h-4 ml-2" />
            {saving ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
          </SimpleButton>
        </div>
      </form>

      <div className="flex items-center justify-end gap-2 text-sm text-gray-500">
        <CheckCircle className="w-4 h-4 text-green-500" />
        <span>يمكن تعديل المعلومات لاحقًا من تفاصيل المستخدم.</span>
      </div>
    </div>
  );
};

export default NewUserPage;

