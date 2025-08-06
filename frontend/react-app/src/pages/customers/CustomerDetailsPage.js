import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiService from '../../services/api';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import { 
  ArrowRight, User, Phone, Mail, MapPin, Calendar, 
  Building2, Settings, History, Plus 
} from 'lucide-react';

const CustomerDetailsPage = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getCustomer(id);
      console.log('Customer details:', data);
      setCustomer(data);
    } catch (err) {
      console.error('Error fetching customer:', err);
      setError('حدث خطأ في تحميل بيانات العميل');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل بيانات العميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <Link to="/customers" className="mt-4 inline-block">
          <SimpleButton variant="outline">
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة لقائمة العملاء
          </SimpleButton>
        </Link>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8">
        <p className="text-gray-600">العميل غير موجود</p>
        <Link to="/customers" className="mt-4 inline-block">
          <SimpleButton variant="outline">
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة لقائمة العملاء
          </SimpleButton>
        </Link>
      </div>
    );
  }

  const customFields = (() => {
    try {
      return typeof customer.customFields === 'string' 
        ? JSON.parse(customer.customFields) 
        : customer.customFields || {};
    } catch {
      return {};
    }
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2 space-x-reverse mb-2">
            <Link to="/customers">
              <SimpleButton variant="ghost" size="sm">
                <ArrowRight className="w-4 h-4" />
              </SimpleButton>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              ملف العميل: {customer.name}
            </h1>
            {customFields.isVip && (
              <SimpleBadge variant="default">VIP</SimpleBadge>
            )}
          </div>
          <p className="text-gray-600">
            تاريخ التسجيل: {new Date(customer.createdAt).toLocaleDateString('ar-SA')}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <Link to={`/customers/${customer.id}/edit`}>
            <SimpleButton variant="outline">
              <Settings className="w-4 h-4 ml-2" />
              تعديل البيانات
            </SimpleButton>
          </Link>
          <Link to={`/repairs/new?customerId=${customer.id}`}>
            <SimpleButton>
              <Plus className="w-4 h-4 ml-2" />
              طلب إصلاح جديد
            </SimpleButton>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* معلومات العميل الأساسية */}
        <div className="lg:col-span-2 space-y-6">
          {/* البيانات الشخصية */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle className="flex items-center">
                <User className="w-5 h-5 ml-2" />
                البيانات الشخصية
              </SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الاسم الكامل
                  </label>
                  <p className="text-gray-900">{customer.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم الهاتف
                  </label>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 ml-2" />
                    <p className="text-gray-900 en-text">{customer.phone}</p>
                  </div>
                </div>
                
                {customer.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      البريد الإلكتروني
                    </label>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-400 ml-2" />
                      <p className="text-gray-900 en-text">{customer.email}</p>
                    </div>
                  </div>
                )}
                
                {customer.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      العنوان
                    </label>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 ml-2" />
                      <p className="text-gray-900">{customer.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* معلومات إضافية */}
          {Object.keys(customFields).length > 0 && (
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>معلومات إضافية</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-3">
                  {customFields.preferredContact && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        طريقة التواصل المفضلة
                      </label>
                      <p className="text-gray-900">
                        {customFields.preferredContact === 'phone' ? 'الهاتف' : 'البريد الإلكتروني'}
                      </p>
                    </div>
                  )}
                  
                  {customFields.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ملاحظات
                      </label>
                      <p className="text-gray-900">{customFields.notes}</p>
                    </div>
                  )}
                </div>
              </SimpleCardContent>
            </SimpleCard>
          )}
        </div>

        {/* الشريط الجانبي */}
        <div className="space-y-6">
          {/* إحصائيات سريعة */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle>إحصائيات سريعة</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">إجمالي الطلبات</span>
                  <span className="font-bold text-blue-600">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">الطلبات المكتملة</span>
                  <span className="font-bold text-green-600">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">الطلبات المعلقة</span>
                  <span className="font-bold text-yellow-600">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">إجمالي المدفوعات</span>
                  <span className="font-bold text-gray-900">0 ر.س</span>
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* معلومات الشركة */}
          {customer.companyId && (
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 ml-2" />
                  معلومات الشركة
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <p className="text-gray-600 text-sm">
                  هذا العميل مرتبط بشركة (ID: {customer.companyId})
                </p>
                <SimpleButton variant="outline" size="sm" className="mt-2">
                  عرض تفاصيل الشركة
                </SimpleButton>
              </SimpleCardContent>
            </SimpleCard>
          )}

          {/* إجراءات سريعة */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle>إجراءات سريعة</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="space-y-2">
                <Link to={`/repairs?customerId=${customer.id}`} className="block">
                  <SimpleButton variant="outline" size="sm" className="w-full justify-start">
                    <History className="w-4 h-4 ml-2" />
                    عرض طلبات الإصلاح
                  </SimpleButton>
                </Link>
                <Link to={`/customers/${customer.id}/edit`} className="block">
                  <SimpleButton variant="outline" size="sm" className="w-full justify-start">
                    <Settings className="w-4 h-4 ml-2" />
                    تعديل البيانات
                  </SimpleButton>
                </Link>
              </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsPage;
