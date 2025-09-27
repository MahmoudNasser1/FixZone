import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleBadge from '../../components/ui/SimpleBadge';
import { 
  ArrowRight, Building2, Phone, Mail, MapPin, Globe, 
  Edit, Trash2, Users, Calendar, Briefcase, FileText,
  AlertCircle, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { useNotifications } from '../../components/notifications/NotificationSystem';

const CompanyDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();
  const [company, setCompany] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCompanyDetails();
      fetchCompanyCustomers();
    }
  }, [id]);

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getCompany(id);
      if (response.ok) {
        const data = await response.json();
        setCompany(data);
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

  const fetchCompanyCustomers = async () => {
    try {
      const response = await apiService.request(`/companies/${id}/customers`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching company customers:', err);
    }
  };

  const handleDeleteCompany = async () => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الشركة؟ سيتم حذف جميع البيانات المرتبطة بها.')) {
      return;
    }

    try {
      setDeleting(true);
      const response = await apiService.deleteCompany(id);
      if (response.ok) {
        notifications.success('تم حذف الشركة بنجاح');
        navigate('/companies');
      } else {
        throw new Error('Failed to delete company');
      }
    } catch (err) {
      console.error('Error deleting company:', err);
      notifications.error('تعذر حذف الشركة');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'active':
        return { color: 'success', text: 'نشطة', icon: CheckCircle };
      case 'inactive':
        return { color: 'secondary', text: 'غير نشطة', icon: XCircle };
      case 'suspended':
        return { color: 'danger', text: 'معلقة', icon: Clock };
      default:
        return { color: 'secondary', text: 'غير محدد', icon: AlertCircle };
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

  if (error || !company) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل البيانات</h3>
        <p className="text-gray-500 mb-6">{error || 'الشركة غير موجودة'}</p>
        <Link to="/companies">
          <SimpleButton>
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للقائمة
          </SimpleButton>
        </Link>
      </div>
    );
  }

  const statusInfo = getStatusInfo(company.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Link to="/companies">
            <SimpleButton variant="ghost" size="sm">
              <ArrowRight className="w-4 h-4" />
            </SimpleButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <p className="text-gray-600">تفاصيل الشركة</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <Link to={`/companies/${id}/edit`}>
            <SimpleButton variant="outline">
              <Edit className="w-4 h-4 ml-2" />
              تعديل
            </SimpleButton>
          </Link>
          <SimpleButton 
            variant="outline" 
            color="danger"
            onClick={handleDeleteCompany}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 ml-2"></div>
                جاري الحذف...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 ml-2" />
                حذف
              </>
            )}
          </SimpleButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* المعلومات الأساسية */}
        <div className="lg:col-span-2 space-y-6">
          {/* بيانات الشركة */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle className="flex items-center">
                <Building2 className="w-5 h-5 ml-2" />
                بيانات الشركة
              </SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">اسم الشركة</label>
                  <p className="text-lg font-medium text-gray-900">{company.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">الحالة</label>
                  <div className="flex items-center">
                    <StatusIcon className="w-4 h-4 ml-2 text-gray-400" />
                    <SimpleBadge color={statusInfo.color} size="sm">
                      {statusInfo.text}
                    </SimpleBadge>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">القطاع</label>
                  <div className="flex items-center">
                    <Briefcase className="w-4 h-4 ml-2 text-gray-400" />
                    <span className="text-gray-900">{company.industry || 'غير محدد'}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">الرقم الضريبي</label>
                  <span className="text-gray-900">{company.taxNumber || 'غير محدد'}</span>
                </div>
              </div>
              
              {company.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">الوصف</label>
                  <p className="text-gray-900">{company.description}</p>
                </div>
              )}
            </SimpleCardContent>
          </SimpleCard>

          {/* معلومات الاتصال */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle>معلومات الاتصال</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {company.phone && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-400 ml-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">الهاتف</p>
                      <p className="text-gray-900">{company.phone}</p>
                    </div>
                  </div>
                )}
                
                {company.email && (
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-400 ml-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">البريد الإلكتروني</p>
                      <p className="text-gray-900">{company.email}</p>
                    </div>
                  </div>
                )}
                
                {company.website && (
                  <div className="flex items-center">
                    <Globe className="w-5 h-5 text-gray-400 ml-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">الموقع الإلكتروني</p>
                      <a 
                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {company.website}
                      </a>
                    </div>
                  </div>
                )}
                
                {company.address && (
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-gray-400 ml-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">العنوان</p>
                      <p className="text-gray-900">{company.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* العملاء المرتبطين */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle className="flex items-center">
                <Users className="w-5 h-5 ml-2" />
                العملاء المرتبطين ({customers.length})
              </SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              {customers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">لا يوجد عملاء مرتبطين بهذه الشركة</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="mr-3">
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <p className="text-sm text-gray-500">{customer.phone}</p>
                        </div>
                      </div>
                      <Link to={`/customers/${customer.id}`}>
                        <SimpleButton variant="ghost" size="sm">
                          عرض
                        </SimpleButton>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </SimpleCardContent>
          </SimpleCard>
        </div>

        {/* الشريط الجانبي */}
        <div className="space-y-6">
          {/* الإحصائيات */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle>الإحصائيات</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">إجمالي العملاء</span>
                <span className="text-lg font-bold text-gray-900">{customers.length}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">تاريخ الإنشاء</span>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-400 ml-2" />
                  <span className="text-sm text-gray-900">
                    {new Date(company.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">آخر تحديث</span>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-400 ml-2" />
                  <span className="text-sm text-gray-900">
                    {new Date(company.updatedAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* الحقول المخصصة */}
          {company.customFields && Object.keys(company.customFields).length > 0 && (
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>معلومات إضافية</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent className="space-y-3">
                {Object.entries(company.customFields).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-gray-500">{key}</span>
                    <span className="text-sm text-gray-900">{value}</span>
                  </div>
                ))}
              </SimpleCardContent>
            </SimpleCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailsPage;
