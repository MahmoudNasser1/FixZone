import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiService from '../../services/api';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import { Input } from '../../components/ui/Input';
import { 
  ArrowRight, Building2, Phone, Mail, MapPin, 
  Globe, Save, X, AlertCircle, Briefcase
} from 'lucide-react';
import { useNotifications } from '../../components/notifications/NotificationSystem';

const EditCompanyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    industry: '',
    description: '',
    status: 'active',
    taxNumber: '',
    customFields: {}
  });

  useEffect(() => {
    if (id) {
      fetchCompanyData();
    }
  }, [id]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getCompany(id);
      if (response.ok) {
        const company = await response.json();
        setFormData({
          name: company.name || '',
          phone: company.phone || '',
          email: company.email || '',
          address: company.address || '',
          website: company.website || '',
          industry: company.industry || '',
          description: company.description || '',
          status: company.status || 'active',
          taxNumber: company.taxNumber || '',
          customFields: company.customFields || {}
        });
      } else {
        throw new Error('Company not found');
      }
    } catch (err) {
      console.error('Error fetching company:', err);
      setError('تعذر تحميل بيانات الشركة');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      setError('اسم الشركة ورقم الهاتف مطلوبان');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      // تحضير البيانات للإرسال مع تحويل status إلى isActive
      const companyData = {
        ...formData,
        isActive: formData.status === 'active'
      };
      
      const response = await apiService.updateCompany(id, companyData);
      if (response.ok) {
        notifications.success('تم تحديث الشركة بنجاح');
        navigate(`/companies/${id}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update company');
      }
    } catch (err) {
      console.error('Error updating company:', err);
      setError(err.message || 'حدث خطأ في تحديث الشركة');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل بيانات الشركة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Link to={`/companies/${id}`}>
            <SimpleButton variant="ghost" size="sm">
              <ArrowRight className="w-4 h-4" />
            </SimpleButton>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">تعديل الشركة</h1>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <Link to={`/companies/${id}`}>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الرقم الضريبي
                </label>
                <Input
                  name="taxNumber"
                  value={formData.taxNumber}
                  onChange={handleInputChange}
                  placeholder="123456789"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  حالة الشركة
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">نشطة</option>
                  <option value="inactive">غير نشطة</option>
                  <option value="suspended">معلقة</option>
                </select>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* أزرار الحفظ */}
        <div className="flex justify-end space-x-4 space-x-reverse">
          <Link to={`/companies/${id}`}>
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
                حفظ التغييرات
              </>
            )}
          </SimpleButton>
        </div>
      </form>
    </div>
  );
};

export default EditCompanyPage;
