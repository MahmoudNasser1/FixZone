import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, X, User, Mail, Phone, Key, UserCheck, UserX, ArrowRight } from 'lucide-react';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import technicianService from '../../services/technicianService';
import PageTransition from '../../components/ui/PageTransition';
import { Input } from '../../components/ui/Input';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';

const TechnicianForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();
  const isEdit = id && id !== 'new';
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    isActive: true
  });
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      loadTechnician();
    }
  }, [id]);

  const loadTechnician = async () => {
    try {
      setLoading(true);
      const response = await technicianService.getTechnicianById(id);
      
      if (response.success && response.data) {
        const tech = response.data;
        setFormData({
          name: tech.name || '',
          email: tech.email || '',
          phone: tech.phone || '',
          password: '',
          confirmPassword: '',
          isActive: tech.isActive !== undefined ? tech.isActive : true
        });
      } else {
        throw new Error('Technician not found');
      }
    } catch (error) {
      console.error('Error loading technician:', error);
      notifications.error('خطأ في تحميل بيانات الفني', { message: error.message || 'حدث خطأ غير متوقع' });
      navigate('/technicians');
    } finally {
      setLoading(false);
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
    
    if (!isEdit && (!formData.password || formData.password.length < 6)) {
      errors.password = 'كلمة المرور مطلوبة ويجب أن تكون على الأقل 6 أحرف';
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
      
      const submitData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        isActive: formData.isActive
      };
      
      // إضافة كلمة المرور فقط عند الإنشاء أو عند التعديل إذا تم إدخالها
      if (!isEdit || (formData.password && formData.password.trim())) {
        submitData.password = formData.password;
      }
      
      let response;
      if (isEdit) {
        response = await technicianService.updateTechnician(id, submitData);
      } else {
        response = await technicianService.createTechnician(submitData);
      }
      
      if (response.success) {
        notifications.success(`تم ${isEdit ? 'تحديث' : 'إنشاء'} الفني بنجاح`);
        navigate('/technicians');
      } else {
        throw new Error(response.error || `فشل في ${isEdit ? 'تحديث' : 'إنشاء'} الفني`);
      }
    } catch (error) {
      console.error('Error saving technician:', error);
      notifications.error(`فشل في ${isEdit ? 'تحديث' : 'إنشاء'} الفني`, { 
        message: error.message || 'حدث خطأ غير متوقع' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (loading) {
    return (
      <PageTransition className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-4">جاري التحميل...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isEdit ? 'تعديل فني' : 'إضافة فني جديد'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isEdit ? 'تعديل معلومات الفني' : 'إضافة فني جديد للنظام'}
              </p>
            </div>
            <SimpleButton
              variant="outline"
              onClick={() => navigate('/technicians')}
            >
              <X className="w-4 h-4 ml-2" />
              إلغاء
            </SimpleButton>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle>معلومات الفني</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <User className="w-4 h-4 inline ml-1" />
                  الاسم *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="اسم الفني"
                  className={validationErrors.name ? 'border-red-500' : ''}
                  required
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Mail className="w-4 h-4 inline ml-1" />
                  البريد الإلكتروني *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@example.com"
                  className={validationErrors.email ? 'border-red-500' : ''}
                  required
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Phone className="w-4 h-4 inline ml-1" />
                  رقم الهاتف
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="01012345678"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Key className="w-4 h-4 inline ml-1" />
                  كلمة المرور {isEdit ? '(اتركها فارغة إذا لم ترد تغييرها)' : '*'}
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder={isEdit ? 'كلمة المرور الجديدة' : 'كلمة المرور'}
                  className={validationErrors.password ? 'border-red-500' : ''}
                  required={!isEdit}
                />
                {validationErrors.password && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              {(formData.password || !isEdit) && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Key className="w-4 h-4 inline ml-1" />
                    تأكيد كلمة المرور {!isEdit && '*'}
                  </label>
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="تأكيد كلمة المرور"
                    className={validationErrors.confirmPassword ? 'border-red-500' : ''}
                    required={!isEdit}
                  />
                  {validationErrors.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.confirmPassword}</p>
                  )}
                </div>
              )}

              {/* Active Status */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="w-4 h-4 text-primary rounded"
                />
                <label htmlFor="isActive" className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  {formData.isActive ? (
                    <UserCheck className="w-4 h-4 text-green-600" />
                  ) : (
                    <UserX className="w-4 h-4 text-red-600" />
                  )}
                  <span>فني نشط</span>
                </label>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <SimpleButton
              type="button"
              variant="outline"
              onClick={() => navigate('/technicians')}
            >
              إلغاء
            </SimpleButton>
            <SimpleButton
              type="submit"
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEdit ? 'تحديث' : 'إنشاء'}
                </>
              )}
            </SimpleButton>
          </div>
        </form>
      </div>
    </PageTransition>
  );
};

export default TechnicianForm;

