import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiService from '../../services/api';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import { Input } from '../../components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/Select';
import {
  ArrowRight, User, Phone, Mail, MapPin,
  Building2, Save, X, AlertCircle, CheckCircle,
  Star, MessageSquare, Settings, UserCheck,
  Calendar, Clock, Shield, Eye
} from 'lucide-react';

const EditCustomerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    companyId: '',
    status: 'active',
    isVip: false,
    preferredContact: 'phone',
    notes: ''
  });
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchCustomer();
    fetchCompanies();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getCustomer(id);

      console.log('Customer data received:', response);

      // التحقق من وجود البيانات
      let customer;
      if (response && response.id) {
        customer = response;
      } else if (response && response.success && response.data) {
        customer = response.data;
      } else {
        throw new Error('العميل غير موجود أو البيانات غير صحيحة');
      }

      // تحليل customFields
      const customFields = (() => {
        try {
          return typeof customer.customFields === 'string'
            ? JSON.parse(customer.customFields)
            : customer.customFields || {};
        } catch {
          console.warn('Failed to parse customFields:', customer.customFields);
          return {};
        }
      })();

      console.log('Parsed custom fields:', customFields);

      const newFormData = {
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        companyId: customer.companyId ? customer.companyId.toString() : '',
        status: customer.status || 'active',
        isVip: Boolean(customFields.isVip),
        preferredContact: customFields.preferredContact || 'phone',
        notes: customFields.notes || ''
      };

      console.log('Setting form data:', newFormData);
      console.log('Customer companyId:', customer.companyId);

      setFormData(newFormData);

      console.log('Form data set:', {
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        companyId: customer.companyId ? customer.companyId.toString() : '',
        isVip: Boolean(customFields.isVip),
        preferredContact: customFields.preferredContact || 'phone',
        notes: customFields.notes || ''
      });
    } catch (err) {
      console.error('Error fetching customer:', err);
      setError('حدث خطأ في تحميل بيانات العميل: ' + err.message);

      // إضافة بيانات تجريبية في حالة الخطأ
      setFormData({
        name: 'عميل تجريبي',
        phone: '0500000000',
        email: 'test@example.com',
        address: 'عنوان تجريبي',
        companyId: '',
        status: 'active',
        isVip: false,
        preferredContact: 'phone',
        notes: 'هذه بيانات تجريبية - حدث خطأ في تحميل البيانات'
      });

      console.log('Using fallback data due to error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await apiService.getCompanies();
      console.log('Companies data received:', response);
      if (Array.isArray(response)) {
        setCompanies(response);
      } else if (response && Array.isArray(response.data)) {
        setCompanies(response.data);
      } else {
        console.error('Failed to fetch companies:', response.status);
        // إضافة شركات تجريبية في حالة الخطأ
        setCompanies([
          { id: 1, name: 'شركة تجريبية 1', industry: 'تقنية المعلومات' },
          { id: 2, name: 'شركة تجريبية 2', industry: 'الإنشاءات' }
        ]);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
      // إضافة شركات تجريبية في حالة الخطأ
      setCompanies([
        { id: 1, name: 'شركة تجريبية 1', industry: 'تقنية المعلومات' },
        { id: 2, name: 'شركة تجريبية 2', industry: 'الإنشاءات' }
      ]);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'الاسم مطلوب';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'الاسم يجب أن يكون أكثر من حرفين';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'رقم الهاتف مطلوب';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.phone.trim())) {
      errors.phone = 'رقم الهاتف غير صحيح';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'البريد الإلكتروني غير صحيح';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log('Input change:', { name, value, type, checked });
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // مسح خطأ التحقق عند التعديل
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSelectChange = (name, value) => {
    console.log('Select change:', { name, value });
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setError('يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // تحضير البيانات للإرسال
      const customerData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        companyId: formData.companyId ? Number(formData.companyId) : null,
        status: formData.status || 'active',
        customFields: {
          isVip: formData.isVip,
          preferredContact: formData.preferredContact,
          notes: formData.notes.trim()
        }
      };

      console.log('Sending customer data:', customerData);
      console.log('Company ID being sent:', customerData.companyId);

      const response = await apiService.updateCustomer(id, customerData);
      console.log('Update response:', response);

      if (response && response.success) {
        console.log('Customer updated successfully:', response);
      } else {
        throw new Error('فشل في تحديث بيانات العميل');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate(`/customers/${id}`);
      }, 1500);

    } catch (err) {
      console.error('Error updating customer:', err);
      setError('حدث خطأ في تحديث بيانات العميل: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-lg text-muted-foreground">جاري تحميل بيانات العميل...</p>
          <p className="mt-2 text-sm text-muted-foreground/60">يرجى الانتظار</p>
        </div>
      </div>
    );
  }

  // التحقق من وجود البيانات
  if (!formData.name && !formData.phone && !error && !loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">لا توجد بيانات للعرض</p>
          <p className="mt-2 text-sm text-gray-500">يرجى المحاولة مرة أخرى</p>
          <SimpleButton
            onClick={() => fetchCustomer()}
            className="mt-4"
          >
            إعادة المحاولة
          </SimpleButton>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Link to={`/customers/${id}`}>
              <SimpleButton variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <ArrowRight className="w-5 h-5" />
              </SimpleButton>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">تعديل بيانات العميل</h1>
              <p className="text-blue-100 mt-1">تحديث معلومات العميل وإعداداته</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 space-x-reverse">
            <Link to={`/customers/${id}`}>
              <SimpleButton variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <X className="w-4 h-4 ml-2" />
                إلغاء
              </SimpleButton>
            </Link>
          </div>
        </div>
      </div>

      {/* رسائل الحالة */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 ml-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">حدث خطأ</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-400 ml-3" />
            <div>
              <h3 className="text-sm font-medium text-green-800">تم التحديث بنجاح</h3>
              <p className="text-sm text-green-700 mt-1">سيتم توجيهك لصفحة العميل خلال لحظات...</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* البيانات الأساسية */}
        <SimpleCard className="shadow-lg">
          <SimpleCardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <SimpleCardTitle className="flex items-center text-lg">
              <User className="w-6 h-6 text-blue-600 ml-3" />
              البيانات الأساسية
              <span className="text-sm text-muted-foreground mr-2">(مطلوب)</span>
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-muted-foreground">
                  الاسم الكامل *
                </label>
                <Input
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  placeholder="أدخل الاسم الكامل للعميل"
                  className={`${validationErrors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                  required
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 ml-1" />
                    {validationErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-muted-foreground">
                  رقم الهاتف *
                </label>
                <Input
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  placeholder="05xxxxxxxx أو +966xxxxxxxxx"
                  className={`${validationErrors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
                  required
                />
                {validationErrors.phone && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 ml-1" />
                    {validationErrors.phone}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-muted-foreground">
                  البريد الإلكتروني
                </label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  placeholder="example@email.com"
                  className={`${validationErrors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 ml-1" />
                    {validationErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-muted-foreground">
                  العنوان
                </label>
                <Input
                  name="address"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                  placeholder="العنوان الكامل للعميل"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-muted-foreground">
                  حالة العميل
                </label>
                <Select
                  value={formData.status || 'active'}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
                        نشط
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full ml-2"></div>
                        غير نشط
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* معلومات الشركة */}
        <SimpleCard className="shadow-lg">
          <SimpleCardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <SimpleCardTitle className="flex items-center text-lg">
              <Building2 className="w-6 h-6 text-green-600 ml-3" />
              معلومات الشركة
              <span className="text-sm text-gray-500 mr-2">(اختياري)</span>
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-muted-foreground">
                  الشركة التابع لها
                </label>
                <Select
                  value={formData.companyId || ''}
                  onValueChange={(value) => handleSelectChange('companyId', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر الشركة أو اتركه فارغاً للعميل الفردي" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">عميل فردي (غير مرتبط بشركة)</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{company.name}</span>
                          <span className="text-xs text-gray-500 mr-2">
                            {company.industry || 'غير محدد'}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  يمكنك ربط العميل بشركة معينة أو تركه كعميل فردي
                </p>
              </div>

              {/* عرض معلومات الشركة المختارة */}
              {formData.companyId && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Building2 className="w-5 h-5 text-blue-600 ml-2" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          العميل مرتبط بالشركة: {companies.find(c => c.id.toString() === formData.companyId)?.name || 'غير معروف'}
                        </p>
                        <p className="text-xs text-blue-700">
                          معرف الشركة: {formData.companyId}
                        </p>
                      </div>
                    </div>
                    <Link to={`/companies/${formData.companyId}`}>
                      <SimpleButton variant="outline" size="sm" className="text-blue-600 border-blue-300 hover:bg-blue-50">
                        <Eye className="w-4 h-4 ml-2" />
                        عرض تفاصيل الشركة
                      </SimpleButton>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* الإعدادات المتقدمة */}
        <SimpleCard className="shadow-lg">
          <SimpleCardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <SimpleCardTitle className="flex items-center text-lg">
              <Settings className="w-6 h-6 text-purple-600 ml-3" />
              الإعدادات المتقدمة
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-muted-foreground">
                  طريقة التواصل المفضلة
                </label>
                <Select
                  value={formData.preferredContact || 'phone'}
                  onValueChange={(value) => handleSelectChange('preferredContact', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 ml-2" />
                        الهاتف
                      </div>
                    </SelectItem>
                    <SelectItem value="email">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 ml-2" />
                        البريد الإلكتروني
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-semibold text-muted-foreground">
                  نوع العميل
                </label>
                <div className="flex items-center space-x-3 space-x-reverse p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <input
                    type="checkbox"
                    name="isVip"
                    checked={formData.isVip || false}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded border-input text-primary focus:ring-primary"
                  />
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-600 ml-2" />
                    <span className="text-sm font-medium text-foreground">عميل VIP</span>
                  </div>
                  <Shield className="w-4 h-4 text-yellow-600" />
                </div>
                <p className="text-xs text-muted-foreground">
                  العملاء VIP يحصلون على معاملة خاصة وأولوية في الخدمة
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                ملاحظات إضافية
              </label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background text-foreground"
                placeholder="أي ملاحظات إضافية عن العميل، تفضيلاته، أو معلومات مهمة..."
              />
              <p className="text-xs text-gray-500">
                يمكنك إضافة أي معلومات إضافية مفيدة عن العميل
              </p>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* أزرار الحفظ */}
        <div className="flex justify-between items-center bg-muted/30 p-6 rounded-lg">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="w-4 h-4 ml-2" />
            آخر تحديث: {new Date().toLocaleDateString('en-GB')}
          </div>

          <div className="flex items-center space-x-4 space-x-reverse">
            <Link to={`/customers/${id}`}>
              <SimpleButton type="button" variant="outline" size="lg">
                <X className="w-4 h-4 ml-2" />
                إلغاء
              </SimpleButton>
            </Link>
            <SimpleButton
              type="submit"
              disabled={saving}
              className="flex items-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              size="lg"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent ml-2"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 ml-2" />
                  حفظ التغييرات
                </>
              )}
            </SimpleButton>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditCustomerPage;