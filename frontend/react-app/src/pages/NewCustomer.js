import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Form } from '../components/ui/Form';
import { Alert } from '../components/ui/Alert';
import { 
  Save, X, User, Building, Phone, Mail, MapPin, 
  FileText, Calendar, Star, AlertCircle, Check
} from 'lucide-react';

const NewCustomer = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customerType, setCustomerType] = useState('individual'); // individual or company
  const [formData, setFormData] = useState({
    // بيانات أساسية
    name: '',
    email: '',
    phone: '',
    alternativePhone: '',
    
    // العنوان
    city: '',
    district: '',
    street: '',
    buildingNumber: '',
    postalCode: '',
    
    // بيانات إضافية للشركات
    companyName: '',
    contactPerson: '',
    taxNumber: '',
    commercialRegister: '',
    
    // ملاحظات وتفاصيل
    notes: '',
    preferredContactMethod: 'phone', // phone, email, whatsapp
    
    // إعدادات
    allowMarketing: false,
    preferredLanguage: 'ar'
  });

  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // مدن المملكة العربية السعودية
  const saudiCities = [
    'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الظهران',
    'تبوك', 'بريدة', 'خميس مشيط', 'حائل', 'الجبيل', 'الطائف', 'ينبع', 'الأحساء',
    'القطيف', 'عرعر', 'سكاكا', 'جيزان', 'نجران', 'الباحة', 'القنفذة'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // إزالة رسالة الخطأ عند التعديل
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // التحقق من الحقول المطلوبة
    if (!formData.name.trim()) {
      newErrors.name = 'اسم العميل مطلوب';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    } else if (!/^(\+966|966|05)[0-9]{8,9}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'رقم الهاتف غير صحيح';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'المدينة مطلوبة';
    }

    // التحقق من بيانات الشركة إذا كان النوع شركة
    if (customerType === 'company') {
      if (!formData.companyName.trim()) {
        newErrors.companyName = 'اسم الشركة مطلوب';
      }
      if (!formData.contactPerson.trim()) {
        newErrors.contactPerson = 'جهة الاتصال مطلوبة';
      }
    }

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
      // محاكاة إرسال البيانات للخادم
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // إظهار رسالة النجاح
      setShowSuccess(true);
      
      // الانتقال لصفحة العملاء بعد 2 ثانية
      setTimeout(() => {
        navigate('/customers');
      }, 2000);
      
    } catch (error) {
      console.error('خطأ في حفظ العميل:', error);
      setErrors({ submit: 'حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مرة أخرى.' });
    } finally {
      setLoading(false);
    }
  };

  const pageActions = (
    <>
      <Button 
        variant="outline" 
        onClick={() => navigate('/customers')}
        disabled={loading}
      >
        <X className="w-4 h-4 ml-2" />
        إلغاء
      </Button>
      <Button 
        type="submit" 
        form="customer-form"
        disabled={loading}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
            جاري الحفظ...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 ml-2" />
            حفظ العميل
          </>
        )}
      </Button>
    </>
  );

  if (showSuccess) {
    return (
      <MainLayout 
        pageTitle="عميل جديد"
        showBreadcrumb={true}
      >
        <div className="flex items-center justify-center min-h-96">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                تم إضافة العميل بنجاح!
              </h3>
              <p className="text-gray-600 mb-4">
                سيتم توجيهك إلى قائمة العملاء خلال لحظات...
              </p>
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      pageTitle="إضافة عميل جديد"
      pageActions={pageActions}
      showBreadcrumb={true}
    >
      <div className="max-w-4xl mx-auto">
        <form id="customer-form" onSubmit={handleSubmit} className="space-y-6">
          {/* نوع العميل */}
          <Card>
            <CardHeader>
              <CardTitle>نوع العميل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setCustomerType('individual')}
                  className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
                    customerType === 'individual'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2 space-x-reverse">
                    <User className="w-5 h-5" />
                    <span className="font-medium">عميل فردي</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerType('company')}
                  className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
                    customerType === 'company'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2 space-x-reverse">
                    <Building className="w-5 h-5" />
                    <span className="font-medium">شركة</span>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* البيانات الأساسية */}
          <Card>
            <CardHeader>
              <CardTitle>البيانات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {customerType === 'company' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      اسم الشركة *
                    </label>
                    <Input
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      placeholder="أدخل اسم الشركة"
                      error={errors.companyName}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      جهة الاتصال *
                    </label>
                    <Input
                      value={formData.contactPerson}
                      onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                      placeholder="اسم الشخص المسؤول"
                      error={errors.contactPerson}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {customerType === 'company' ? 'اسم جهة الاتصال' : 'الاسم الكامل'} *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder={customerType === 'company' ? 'اسم جهة الاتصال' : 'أدخل الاسم الكامل'}
                    error={errors.name}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    رقم الهاتف *
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+966 50 123 4567"
                    error={errors.phone}
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    البريد الإلكتروني
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="example@email.com"
                    error={errors.email}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    هاتف بديل
                  </label>
                  <Input
                    value={formData.alternativePhone}
                    onChange={(e) => handleInputChange('alternativePhone', e.target.value)}
                    placeholder="+966 50 123 4567"
                    dir="ltr"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* معلومات العنوان */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات العنوان</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    المدينة *
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="">اختر المدينة</option>
                    {saudiCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الحي
                  </label>
                  <Input
                    value={formData.district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    placeholder="اسم الحي"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الشارع
                  </label>
                  <Input
                    value={formData.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    placeholder="اسم الشارع"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    رقم المبنى
                  </label>
                  <Input
                    value={formData.buildingNumber}
                    onChange={(e) => handleInputChange('buildingNumber', e.target.value)}
                    placeholder="123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الرمز البريدي
                  </label>
                  <Input
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    placeholder="12345"
                    dir="ltr"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* معلومات إضافية للشركات */}
          {customerType === 'company' && (
            <Card>
              <CardHeader>
                <CardTitle>معلومات الشركة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      الرقم الضريبي
                    </label>
                    <Input
                      value={formData.taxNumber}
                      onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                      placeholder="123456789012345"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      السجل التجاري
                    </label>
                    <Input
                      value={formData.commercialRegister}
                      onChange={(e) => handleInputChange('commercialRegister', e.target.value)}
                      placeholder="1234567890"
                      dir="ltr"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* الملاحظات والإعدادات */}
          <Card>
            <CardHeader>
              <CardTitle>ملاحظات وإعدادات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ملاحظات
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="أي ملاحظات أو تفاصيل إضافية..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  طريقة التواصل المفضلة
                </label>
                <select
                  value={formData.preferredContactMethod}
                  onChange={(e) => handleInputChange('preferredContactMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="phone">مكالمة هاتفية</option>
                  <option value="whatsapp">واتساب</option>
                  <option value="email">بريد إلكتروني</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* رسائل الخطأ */}
          {errors.submit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.submit}</span>
            </Alert>
          )}
        </form>
      </div>
    </MainLayout>
  );
};

export default NewCustomer;
