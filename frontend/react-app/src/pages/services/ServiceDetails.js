import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Edit2,
  Trash2,
  ArrowRight,
  Package,
  DollarSign,
  Clock,
  FileText,
  Tag,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import apiService from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import SimpleButton from '../../components/ui/SimpleButton';
import { Loading } from '../../components/ui/Loading';

const ServiceDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const notifications = useNotifications();
  const notify = (type, message) => {
    notifications.addNotification({ type, message });
  };

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usageStats, setUsageStats] = useState(null);
  const [recentUsage, setRecentUsage] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Load service data
  useEffect(() => {
    loadServiceData();
    loadUsageStats();
  }, [id]);

  const loadServiceData = async () => {
    try {
      setLoading(true);
      const serviceData = await apiService.getService(id);
      setService(serviceData);
    } catch (error) {
      console.error('Error loading service:', error);
      notify('error', 'خطأ في تحميل بيانات الخدمة');
      navigate('/services');
    } finally {
      setLoading(false);
    }
  };

  const loadUsageStats = async () => {
    try {
      setLoadingStats(true);
      const data = await apiService.getServiceStats(id);
      setUsageStats(data.stats);
      setRecentUsage(data.recentUsage || []);
    } catch (error) {
      console.error('Error loading usage stats:', error);
      notify('error', 'خطأ في تحميل إحصائيات الاستخدام');
      // Fallback to default stats
      setUsageStats({
        totalUsage: 0,
        completedUsage: 0,
        totalRevenue: 0,
        avgPrice: service?.basePrice || 0,
        lastUsed: null,
        firstUsed: null
      });
      setRecentUsage([]);
    } finally {
      setLoadingStats(false);
    }
  };

  // Handle delete service
  const handleDelete = async () => {
    if (window.confirm('هل أنت متأكد من حذف هذه الخدمة؟')) {
      try {
        await apiService.deleteService(id);
        notify('success', 'تم حذف الخدمة بنجاح');
        navigate('/services');
      } catch (error) {
        console.error('Error deleting service:', error);
        notify('error', 'خطأ في حذف الخدمة');
      }
    }
  };

  // Handle edit
  const handleEdit = () => {
    navigate(`/services/${id}/edit`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="xl" text="جاري تحميل بيانات الخدمة..." />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-6 bg-background min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">الخدمة غير موجودة</h2>
          <p className="text-muted-foreground">الخدمة المطلوبة غير موجودة أو تم حذفها</p>
          <SimpleButton onClick={() => navigate('/services')}>
            العودة إلى قائمة الخدمات
          </SimpleButton>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <SimpleButton
              variant="ghost"
              onClick={() => navigate('/services')}
              className="text-gray-600"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة
            </SimpleButton>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{service.name}</h1>
              <p className="text-gray-600">تفاصيل الخدمة</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <SimpleButton
              variant="outline"
              onClick={handleEdit}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <Edit2 className="w-4 h-4 ml-2" />
              تعديل
            </SimpleButton>
            <SimpleButton
              variant="outline"
              onClick={handleDelete}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 ml-2" />
              حذف
            </SimpleButton>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Details */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">تفاصيل الخدمة</h2>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 space-x-reverse">
                <Package className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-foreground">اسم الخدمة</h3>
                  <p className="text-gray-600">{service.name}</p>
                </div>
              </div>

              {service.description && (
                <div className="flex items-start space-x-3 space-x-reverse">
                  <FileText className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-foreground">الوصف</h3>
                    <p className="text-gray-600">{service.description}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3 space-x-reverse">
                <DollarSign className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-foreground">السعر الأساسي</h3>
                  <p className="text-gray-600">{service.basePrice ? `${service.basePrice} ج.م` : 'غير محدد'}</p>
                </div>
              </div>

              {service.category && (
                <div className="flex items-start space-x-3 space-x-reverse">
                  <Tag className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-foreground">الفئة</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {service.category}
                    </span>
                  </div>
                </div>
              )}

              {service.estimatedDuration && (
                <div className="flex items-start space-x-3 space-x-reverse">
                  <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-foreground">المدة المقدرة</h3>
                    <p className="text-gray-600">{service.estimatedDuration} دقيقة</p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3 space-x-reverse">
                {service.isActive ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div>
                  <h3 className="font-medium text-foreground">الحالة</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${service.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {service.isActive ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">إحصائيات الاستخدام</h2>

            {loadingStats ? (
              <div className="flex justify-center items-center h-32">
                <Loading size="lg" text="جاري تحميل الإحصائيات..." />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{usageStats?.totalUsage || 0}</div>
                    <span className="text-sm text-muted-foreground">إجمالي الاستخدام</span>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{usageStats?.completedUsage || 0}</div>
                    <span className="text-sm text-muted-foreground">المكتمل</span>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {usageStats?.totalRevenue ? `${parseFloat(usageStats.totalRevenue).toFixed(2)} ج.م` : '0 ج.م'}
                    </div>
                    <span className="text-sm text-muted-foreground">إجمالي الإيرادات</span>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {usageStats?.avgPrice ? `${parseFloat(usageStats.avgPrice).toFixed(2)} ج.م` : '0 ج.م'}
                    </div>
                    <span className="text-sm text-muted-foreground">متوسط السعر</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-sm font-medium text-foreground">
                        {usageStats?.lastUsed ? new Date(usageStats.lastUsed).toLocaleDateString('en-GB') : 'لم يتم الاستخدام'}
                      </div>
                      <span className="text-sm text-muted-foreground">آخر استخدام</span>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-foreground">
                        {usageStats?.firstUsed ? new Date(usageStats.firstUsed).toLocaleDateString('en-GB') : 'لم يتم الاستخدام'}
                      </div>
                      <span className="text-sm text-muted-foreground">أول استخدام</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Recent Usage */}
          {
            recentUsage && recentUsage.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">آخر الاستخدامات</h2>

                <div className="space-y-3">
                  {recentUsage.map((usage, index) => (
                    <div
                      key={usage.id || index}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => usage.id && navigate(`/repairs/${usage.id}`)}
                    >
                      <div className="flex items-center space-x-3 space-x-reverse flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <span className="text-sm font-medium text-gray-900">
                              {usage.customerName || 'عميل غير محدد'}
                            </span>
                            {usage.status && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${usage.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : usage.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {usage.status === 'completed' ? 'مكتمل' :
                                  usage.status === 'cancelled' ? 'ملغي' :
                                    usage.status === 'delivered' ? 'تم التسليم' :
                                      'قيد التنفيذ'}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center space-x-3 space-x-reverse text-xs text-gray-600">
                            {usage.deviceType && usage.deviceBrand && (
                              <span>{usage.deviceBrand} {usage.deviceType}</span>
                            )}
                            {usage.createdAt && (
                              <span>{new Date(usage.createdAt).toLocaleDateString('ar-EG', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {usage.price && (
                        <div className="flex-shrink-0 mr-3">
                          <span className="text-sm font-semibold text-green-600">
                            {parseFloat(usage.price).toFixed(2)} ج.م
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {recentUsage.length >= 5 && (
                  <div className="mt-4 text-center">
                    <SimpleButton
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/repairs?serviceId=${id}`)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      عرض جميع الاستخدامات
                    </SimpleButton>
                  </div>
                )}
              </div>
            )
          }
        </div >

        {/* Sidebar */}
        < div className="space-y-6" >
          {/* Quick Actions */}
          < div className="bg-card border border-border rounded-lg p-6" >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">الإجراءات السريعة</h3>

            <div className="space-y-3">
              <SimpleButton
                onClick={handleEdit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit2 className="w-4 h-4 ml-2" />
                تعديل الخدمة
              </SimpleButton>

              <SimpleButton
                onClick={() => navigate('/repairs/new')}
                variant="outline"
                className="w-full text-green-600 border-green-300 hover:bg-green-50"
              >
                <Package className="w-4 h-4 ml-2" />
                إنشاء طلب إصلاح
              </SimpleButton>

              <SimpleButton
                onClick={() => navigate('/services')}
                variant="outline"
                className="w-full text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                العودة للقائمة
              </SimpleButton>
            </div>
          </div >

          {/* Service Info */}
          < div className="bg-card border border-border rounded-lg p-6" >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات الخدمة</h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">معرف الخدمة</span>
                <span className="text-sm font-medium text-gray-900">#{service.id}</span>
              </div>

              {service.createdAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">تاريخ الإنشاء</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(service.createdAt).toLocaleDateString('en-GB')}
                  </span>
                </div>
              )}

              {service.updatedAt && service.updatedAt !== service.createdAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">آخر تحديث</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(service.updatedAt).toLocaleDateString('en-GB')}
                  </span>
                </div>
              )}
            </div>
          </div >

          {/* Status Card */}
          < div className={`border rounded-lg p-6 ${service.isActive
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
            }`}>
            <div className="flex items-center space-x-2 space-x-reverse">
              {service.isActive ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <div>
                <h4 className="font-medium text-gray-900">
                  {service.isActive ? 'الخدمة نشطة' : 'الخدمة غير نشطة'}
                </h4>
                <p className="text-sm text-gray-600">
                  {service.isActive
                    ? 'الخدمة متاحة للاستخدام في طلبات الإصلاح'
                    : 'الخدمة غير متاحة حالياً'
                  }
                </p>
              </div>
            </div>
          </div >
        </div >
      </div >
    </div >
  );
};

export default ServiceDetails;

