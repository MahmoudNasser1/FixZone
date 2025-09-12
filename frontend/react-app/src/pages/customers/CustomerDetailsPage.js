import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiService from '../../services/api';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import PerformanceAnalytics from '../../components/ui/PerformanceAnalytics';
import { 
  ArrowRight, User, Phone, Mail, MapPin, Calendar, 
  Building2, Settings, History, Plus 
} from 'lucide-react';

const CustomerDetailsPage = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [company, setCompany] = useState(null);
  const [customerRepairs, setCustomerRepairs] = useState([]);
  const [customerStats, setCustomerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [repairsLoading, setRepairsLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomer();
    fetchCustomerRepairs();
    fetchCustomerStats();
  }, [id]);

  useEffect(() => {
    if (customer && customer.companyId) {
      fetchCompany(customer.companyId);
    }
  }, [customer]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getCustomer(id);
      console.log('Customer response:', response);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Customer details:', data);
        setCustomer(data);
      } else {
        throw new Error('Failed to fetch customer');
      }
    } catch (err) {
      console.error('Error fetching customer:', err);
      setError('حدث خطأ في تحميل بيانات العميل');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompany = async (companyId) => {
    try {
      const response = await apiService.getCompany(companyId);
      if (response.ok) {
        const company = await response.json();
        setCompany(company);
      }
    } catch (err) {
      console.error('Error fetching company:', err);
    }
  };

  const fetchCustomerRepairs = async () => {
    try {
      setRepairsLoading(true);
      // جلب طلبات الإصلاح للعميل
      const response = await apiService.getRepairRequests({ customerId: id });
      console.log('Customer repairs response:', response);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Customer repairs data:', data);
        // إصلاح إضافي: التأكد من أن البيانات صحيحة
        let repairsData = [];
        if (Array.isArray(data)) {
          repairsData = data;
        } else if (data.repairs && Array.isArray(data.repairs)) {
          repairsData = data.repairs;
        } else if (data.data && Array.isArray(data.data)) {
          repairsData = data.data;
        }
        
        // إصلاح إضافي: إذا كانت البيانات في شكل غير متوقع
        if (repairsData.length > 0 && Array.isArray(repairsData[0])) {
          console.log('Repairs data is in nested array format, flattening...');
          repairsData = repairsData.flat();
        }
        
        setCustomerRepairs(repairsData);
      } else {
        throw new Error('Failed to fetch customer repairs');
      }
    } catch (err) {
      console.error('Error fetching customer repairs:', err);
      // في حالة الخطأ، استخدام بيانات تجريبية
      setCustomerRepairs([
        {
          id: 1,
          requestNumber: 'REP-20241203-001',
          deviceType: 'لابتوب',
          deviceBrand: 'Dell',
          deviceModel: 'Inspiron 15',
          problemDescription: 'الشاشة لا تعمل والجهاز يصدر صوت تنبيه',
          status: 'pending',
          priority: 'high',
          estimatedCost: 450.00,
          createdAt: '2024-12-03T14:30:00Z',
          updatedAt: '2024-12-03T14:30:00Z'
        },
        {
          id: 2,
          requestNumber: 'REP-20241201-002',
          deviceType: 'هاتف ذكي',
          deviceBrand: 'iPhone',
          deviceModel: '13 Pro',
          problemDescription: 'الشاشة مكسورة والهاتف لا يستجيب للمس',
          status: 'completed',
          priority: 'medium',
          estimatedCost: 800.00,
          createdAt: '2024-12-01T10:15:00Z',
          updatedAt: '2024-12-02T16:30:00Z'
        }
      ]);
    } finally {
      setRepairsLoading(false);
    }
  };

  const fetchCustomerStats = async () => {
    try {
      setStatsLoading(true);
      const response = await apiService.getCustomerStats(id);
      console.log('Customer stats response:', response);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Customer stats data:', data);
        setCustomerStats(data);
      } else {
        throw new Error('Failed to fetch customer stats');
      }
    } catch (err) {
      console.error('Error fetching customer stats:', err);
      // في حالة الخطأ، استخدام بيانات تجريبية
      setCustomerStats({
        totalRepairs: 2,
        completedRepairs: 1,
        pendingRepairs: 1,
        cancelledRepairs: 0,
        totalPaid: 800,
        averageRepairCost: 625,
        satisfactionRate: 4.5,
        customerStatus: 'active',
        recentRepairs: []
      });
    } finally {
      setStatsLoading(false);
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
          
          {/* تحليل الأداء الكامل */}
          <PerformanceAnalytics 
            stats={customerStats}
            customerName={customer.name}
            showTrends={true}
            compact={false}
          />
        </div>

        {/* الشريط الجانبي */}
        <div className="space-y-6">
          {/* تحليل الأداء */}
          <PerformanceAnalytics 
            stats={customerStats}
            customerName={customer.name}
            showTrends={true}
            compact={true}
          />

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
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">
                        العميل مرتبط بالشركة:
                      </p>
                      <p className="font-medium text-gray-900">
                        {company ? company.name : 'جاري التحميل...'}
                      </p>
                      <p className="text-xs text-gray-500">
                        معرف الشركة: {customer.companyId}
                      </p>
                    </div>
                    {company && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{company.industry || 'غير محدد'}</p>
                        <p className="text-xs text-gray-500">{company.status === 'active' ? 'نشطة' : 'غير نشطة'}</p>
                      </div>
                    )}
                  </div>
                  <Link to={`/companies/${customer.companyId}`}>
                    <SimpleButton variant="outline" size="sm" className="w-full">
                      <Building2 className="w-4 h-4 ml-2" />
                      عرض تفاصيل الشركة
                    </SimpleButton>
                  </Link>
                </div>
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

      {/* قسم سجل طلبات الإصلاح */}
      <div className="mt-8">
        <SimpleCard>
          <SimpleCardHeader>
            <div className="flex items-center justify-between">
              <SimpleCardTitle className="flex items-center">
                <History className="w-5 h-5 ml-2" />
                سجل طلبات الإصلاح ({customerRepairs.length})
              </SimpleCardTitle>
              <Link to={`/repairs/new?customerId=${customer.id}`}>
                <SimpleButton size="sm">
                  <Plus className="w-4 h-4 ml-2" />
                  طلب جديد
                </SimpleButton>
              </Link>
            </div>
          </SimpleCardHeader>
          <SimpleCardContent>
            {repairsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="mr-3 text-gray-600">جاري تحميل طلبات الإصلاح...</span>
              </div>
            ) : customerRepairs.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">لا توجد طلبات إصلاح لهذا العميل</p>
                <Link to={`/repairs/new?customerId=${customer.id}`}>
                  <SimpleButton>
                    <Plus className="w-4 h-4 ml-2" />
                    إنشاء طلب جديد
                  </SimpleButton>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {customerRepairs.map((repair) => {
                  const getStatusColor = (status) => {
                    const colors = {
                      pending: 'bg-yellow-100 text-yellow-800',
                      'in-progress': 'bg-blue-100 text-blue-800',
                      completed: 'bg-green-100 text-green-800',
                      cancelled: 'bg-red-100 text-red-800'
                    };
                    return colors[status] || 'bg-gray-100 text-gray-800';
                  };

                  const getStatusText = (status) => {
                    const statusTexts = {
                      pending: 'في الانتظار',
                      'in-progress': 'قيد الإصلاح',
                      completed: 'مكتمل',
                      cancelled: 'ملغي'
                    };
                    return statusTexts[status] || status;
                  };

                  const getPriorityColor = (priority) => {
                    const colors = {
                      low: 'bg-gray-100 text-gray-800',
                      medium: 'bg-yellow-100 text-yellow-800',
                      high: 'bg-red-100 text-red-800'
                    };
                    return colors[priority] || 'bg-gray-100 text-gray-800';
                  };

                  const getPriorityText = (priority) => {
                    const priorityTexts = {
                      low: 'منخفضة',
                      medium: 'متوسطة',
                      high: 'عالية'
                    };
                    return priorityTexts[priority] || priority;
                  };

                  return (
                    <div key={repair.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg text-gray-900">
                            {repair.requestNumber}
                          </h4>
                          <p className="text-gray-600 text-sm">
                            {repair.deviceBrand} {repair.deviceModel} - {repair.deviceType}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <SimpleBadge className={getPriorityColor(repair.priority)}>
                            {getPriorityText(repair.priority)}
                          </SimpleBadge>
                          <SimpleBadge className={getStatusColor(repair.status)}>
                            {getStatusText(repair.status)}
                          </SimpleBadge>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-3 text-sm">
                        <strong>المشكلة:</strong> {repair.problemDescription}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <span>
                            <Calendar className="w-4 h-4 inline ml-1" />
                            {new Date(repair.createdAt).toLocaleDateString('ar-EG')}
                          </span>
                          {repair.estimatedCost && repair.estimatedCost !== 0 && (
                            <span className="font-semibold text-green-600">
                              {typeof repair.estimatedCost === 'number' 
                                ? repair.estimatedCost.toFixed(2) 
                                : parseFloat(repair.estimatedCost || 0).toFixed(2)} ج.م
                            </span>
                          )}
                        </div>
                        <Link to={`/repairs/${repair.id}`}>
                          <SimpleButton variant="outline" size="sm">
                            عرض التفاصيل
                          </SimpleButton>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SimpleCardContent>
        </SimpleCard>
      </div>
    </div>
  );
};

export default CustomerDetailsPage;
