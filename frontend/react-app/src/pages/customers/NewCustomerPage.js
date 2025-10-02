import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Textarea } from '../../components/ui/Textarea';
import { Switch } from '../../components/ui/Switch';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import { 
  Save, X, User, Phone, Mail, MapPin, Building2, 
  AlertCircle, CheckCircle, Star, Users
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/Select";

const NewCustomerPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // بيانات النموذج
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    companyId: '',
    notes: '',
    vipCustomer: false,
    preferredContact: 'phone', // phone, email, whatsapp
    customFields: {}
  });

  // بيانات تجريبية للشركات
  const sampleCompanies = [
    { id: 1, name: 'شركة التقنية المتقدمة' },
    { id: 2, name: 'مؤسسة الخليج للتجارة' },
    { id: 3, name: 'شركة الرياض للاتصالات' },
    { id: 4, name: 'مجموعة الشرق الأوسط' }
  ];

  useEffect(() => {
    // محاكاة تحميل قائمة الشركات
    setCompanies(sampleCompanies);
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // إزالة الخطأ عند التعديل
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // التحقق من الاسم
    if (!formData.name.trim()) {
      newErrors.name = 'اسم العميل مطلوب';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'اسم العميل يجب أن يكون أكثر من حرفين';
    }

    // التحقق من رقم الهاتف
    if (!formData.phone.trim()) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    } else if (!/^05\d{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'رقم الهاتف غير صحيح (يجب أن يبدأ بـ 05 ويتكون من 10 أرقام)';
    }

    // التحقق من البريد الإلكتروني (اختياري)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
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
    setSuccess(false);

    try {
      // تقسيم الاسم إلى firstName و lastName
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0] || formData.name;
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // تحضير بيانات العميل للإرسال
      const customerData = {
        firstName: firstName,
        lastName: lastName,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address || null,
        companyId: formData.companyId || null,
        notes: formData.notes || null,
        customFields: {
          isVip: formData.isVip,
          preferredContact: formData.preferredContact
        }
      };

      // إرسال البيانات إلى Backend
      const result = await apiService.createCustomer(customerData);
      console.log('Customer created successfully:', result);
      
      setSuccess(true);
      
      // الانتقال إلى صفحة العملاء بعد 2 ثانية
      setTimeout(() => {
        navigate('/customers');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating customer:', error);
      setErrors({ submit: 'حدث خطأ أثناء إنشاء العميل. يرجى المحاولة مرة أخرى.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/customers');
  };

  const pageActions = (
    <>
      <Button variant="outline" onClick={handleCancel} disabled={loading}>
        <X className="w-4 h-4 ml-2" />
        إلغاء
      </Button>
      <Button 
        onClick={handleSubmit} 
        disabled={loading}
        className="bg-green-600 hover:bg-green-700"
      >
        <Save className="w-4 h-4 ml-2" />
        {loading ? 'جاري الحفظ...' : 'حفظ العميل'}
      </Button>
    </>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        {/* رسائل النجاح والخطأ */}
        {success && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              تم إنشاء العميل بنجاح! سيتم توجيهك إلى قائمة العملاء...
            </AlertDescription>
          </Alert>
        )}

        {errors.submit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* المعلومات الأساسية */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <User className="w-5 h-5" />
                <span>المعلومات الأساسية</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم العميل *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="أدخل اسم العميل"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="05xxxxxxxx"
                      className={`pr-10 ${errors.phone ? 'border-red-500' : ''}`}
                      dir="ltr"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="example@email.com"
                    className={`pr-10 ${errors.email ? 'border-red-500' : ''}`}
                    dir="ltr"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">العنوان</Label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-3 text-gray-400 w-4 h-4" />
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="أدخل عنوان العميل"
                    className="pr-10"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* معلومات الشركة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Building2 className="w-5 h-5" />
                <span>معلومات الشركة</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">الشركة التابع لها (اختياري)</Label>
                <Select 
                  value={formData.companyId} 
                  onValueChange={(value) => handleInputChange('companyId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الشركة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">عميل فردي</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* الإعدادات المتقدمة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Users className="w-5 h-5" />
                <span>الإعدادات المتقدمة</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preferredContact">طريقة التواصل المفضلة</Label>
                  <Select 
                    value={formData.preferredContact} 
                    onValueChange={(value) => handleInputChange('preferredContact', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">مكالمة هاتفية</SelectItem>
                      <SelectItem value="email">بريد إلكتروني</SelectItem>
                      <SelectItem value="whatsapp">واتساب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-3 space-x-reverse">
                  <Switch
                    id="vip"
                    checked={formData.vipCustomer}
                    onCheckedChange={(checked) => handleInputChange('vipCustomer', checked)}
                  />
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <Label htmlFor="vip">عميل VIP</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="أي ملاحظات إضافية حول العميل..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* أزرار الحفظ والإلغاء */}
          <div className="flex justify-end space-x-4 space-x-reverse">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={loading}
            >
              <X className="w-4 h-4 ml-2" />
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 ml-2" />
              {loading ? 'جاري الحفظ...' : 'حفظ العميل'}
            </Button>
          </div>
        </form>
      </div>
  );
};

export default NewCustomerPage;
