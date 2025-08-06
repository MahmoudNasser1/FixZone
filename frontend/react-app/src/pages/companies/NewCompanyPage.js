import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiService from '../../services/api';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import { Input } from '../../components/ui/Input';
import { 
  ArrowRight, Building2, Phone, Mail, MapPin, 
  Globe, Save, X, AlertCircle, Briefcase
} from 'lucide-react';

const NewCompanyPage = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    industry: '',
    description: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // التحقق من البيانات المطلوبة
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError('اسم الشركة ورقم الهاتف مطلوبان');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // تحضير البيانات للإرسال
      const companyData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        website: formData.website.trim() || null,
        industry: formData.industry.trim() || null,
        description: formData.description.trim() || null,
        status: 'active'
      };

      const newCompany = await apiService.createCompany(companyData);
      
      // إظهار رسالة نجاح والانتقال لصفحة الشركات
      alert('تم إنشاء الشركة بنجاح');
      navigate('/companies');
      
    } catch (err) {
      console.error('Error creating company:', err);
      setError('حدث خطأ في إنشاء الشركة');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Link to="/companies">
            <SimpleButton variant="ghost" size="sm">
              <ArrowRight className="w-4 h-4" />
            </SimpleButton>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">إضافة شركة جديدة</h1>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <Link to="/companies">
            <SimpleButton variant="outline">
              <X className="w-4 h-4 ml-2" />
              إلغاء
            </SimpleButton>
          </Link>
        </div>
      </div>

      {/* رسالة الخطأ */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
          <AlertCircle className="w-5 h-5 ml-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* البيانات الأساسية */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center">
              <Building2 className="w-5 h-5 ml-2" />
              البيانات الأساسية
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الشركة *
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="أدخل اسم الشركة"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهاتف *
                </label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="011xxxxxxx"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني
                </label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="info@company.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الموقع الإلكتروني
                </label>
                <Input
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="www.company.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العنوان
              </label>
              <Input
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="العنوان الكامل للشركة"
              />
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* معلومات إضافية */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center">
              <Briefcase className="w-5 h-5 ml-2" />
              معلومات إضافية
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                القطاع/المجال
              </label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">اختر القطاع</option>
                <option value="تقنية المعلومات">تقنية المعلومات</option>
                <option value="الإنشاءات">الإنشاءات</option>
                <option value="التجارة">التجارة</option>
                <option value="الصناعة">الصناعة</option>
                <option value="الخدمات">الخدمات</option>
                <option value="الطب">الطب</option>
                <option value="التعليم">التعليم</option>
                <option value="النقل">النقل</option>
                <option value="السياحة">السياحة</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وصف الشركة
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="وصف مختصر عن نشاط الشركة وخدماتها..."
              />
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* أزرار الحفظ */}
        <div className="flex justify-end space-x-4 space-x-reverse">
          <Link to="/companies">
            <SimpleButton type="button" variant="outline">
              إلغاء
            </SimpleButton>
          </Link>
          <SimpleButton 
            type="submit" 
            disabled={saving}
            className="flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                إنشاء الشركة
              </>
            )}
          </SimpleButton>
        </div>
      </form>
    </div>
  );
};

export default NewCompanyPage;
