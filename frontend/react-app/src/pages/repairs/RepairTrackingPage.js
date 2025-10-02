import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  QrCode, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Package,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Wrench,
  DollarSign,
  FileText,
  ArrowRight,
  RefreshCw,
  Download,
  Printer,
  Eye,
  Smartphone,
  Monitor,
  Laptop,
  Tablet
} from 'lucide-react';
import apiService from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import SimpleButton from '../../components/ui/SimpleButton';
import { Input } from '../../components/ui/Input';
import { Loading } from '../../components/ui/Loading';

const RepairTrackingPage = () => {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const notify = (type, message) => {
    notifications.addNotification({ type, message });
  };

  // State management
  const [trackingCode, setTrackingCode] = useState('');
  const [requestNumber, setRequestNumber] = useState('');
  const [repairData, setRepairData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState('trackingToken'); // 'trackingToken' or 'requestNumber'

  // Repair status configuration
  const statusConfig = {
    'RECEIVED': {
      label: 'مستلم',
      color: 'bg-blue-100 text-blue-800',
      icon: Package,
      description: 'تم استلام الجهاز في الورشة'
    },
    'INSPECTION': {
      label: 'قيد الفحص',
      color: 'bg-yellow-100 text-yellow-800',
      icon: Eye,
      description: 'يتم فحص الجهاز وتحديد المشكلة'
    },
    'QUOTATION_SENT': {
      label: 'تم إرسال العرض',
      color: 'bg-purple-100 text-purple-800',
      icon: FileText,
      description: 'تم إرسال عرض السعر للعميل'
    },
    'QUOTATION_APPROVED': {
      label: 'تم قبول العرض',
      color: 'bg-indigo-100 text-indigo-800',
      icon: CheckCircle,
      description: 'وافق العميل على السعر'
    },
    'UNDER_REPAIR': {
      label: 'قيد الإصلاح',
      color: 'bg-orange-100 text-orange-800',
      icon: Wrench,
      description: 'يتم إصلاح الجهاز حالياً'
    },
    'READY_FOR_DELIVERY': {
      label: 'جاهز للتسليم',
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle,
      description: 'انتهى الإصلاح والجهاز جاهز'
    },
    'DELIVERED': {
      label: 'تم التسليم',
      color: 'bg-emerald-100 text-emerald-800',
      icon: Package,
      description: 'تم تسليم الجهاز للعميل'
    },
    'COMPLETED': {
      label: 'مكتمل',
      color: 'bg-gray-100 text-gray-800',
      icon: CheckCircle,
      description: 'انتهى الطلب بالكامل'
    }
  };

  // Get device icon based on type
  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'smartphone':
      case 'هاتف':
        return Smartphone;
      case 'laptop':
      case 'لابتوب':
        return Laptop;
      case 'desktop':
      case 'كمبيوتر':
        return Monitor;
      case 'tablet':
      case 'تابلت':
        return Tablet;
      default:
        return Package;
    }
  };

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!trackingCode && !requestNumber) {
      notify('warning', 'يرجى إدخال رمز التتبع أو رقم الطلب');
      return;
    }

    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (searchType === 'trackingToken' && trackingCode) {
        params.append('trackingToken', trackingCode);
      } else if (searchType === 'requestNumber' && requestNumber) {
        params.append('requestNumber', requestNumber);
      }

      const response = await apiService.request(`/repairs/tracking?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setRepairData(data);
        notify('success', 'تم العثور على طلب الإصلاح بنجاح');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'لم يتم العثور على طلب الإصلاح');
      }
    } catch (error) {
      console.error('Error tracking repair:', error);
      notify('error', error.message || 'خطأ في البحث عن طلب الإصلاح');
      setRepairData(null);
    } finally {
      setLoading(false);
    }
  };

  // Clear search
  const handleClear = () => {
    setTrackingCode('');
    setRequestNumber('');
    setRepairData(null);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status progress percentage
  const getStatusProgress = (status) => {
    const statusOrder = [
      'RECEIVED', 'INSPECTION', 'QUOTATION_SENT', 'QUOTATION_APPROVED',
      'UNDER_REPAIR', 'READY_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'
    ];
    const currentIndex = statusOrder.indexOf(status);
    return currentIndex >= 0 ? ((currentIndex + 1) / statusOrder.length) * 100 : 0;
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">تتبع طلب الإصلاح</h1>
            <p className="text-gray-600">ابحث عن طلب الإصلاح باستخدام رمز التتبع أو رقم الطلب</p>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <SimpleButton
              onClick={() => navigate('/repairs')}
              variant="outline"
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة لطلبات الإصلاح
            </SimpleButton>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-4 space-x-reverse mb-4">
          <h2 className="text-lg font-semibold text-gray-900">البحث عن طلب الإصلاح</h2>
          <QrCode className="w-5 h-5 text-blue-600" />
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Type Toggle */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <label className="flex items-center">
              <input
                type="radio"
                name="searchType"
                value="trackingToken"
                checked={searchType === 'trackingToken'}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="mr-2 text-sm font-medium text-gray-700">رمز التتبع</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="searchType"
                value="requestNumber"
                checked={searchType === 'requestNumber'}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="mr-2 text-sm font-medium text-gray-700">رقم الطلب</span>
            </label>
          </div>

          {/* Search Input */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex-1">
              {searchType === 'trackingToken' ? (
                <Input
                  type="text"
                  placeholder="أدخل رمز التتبع (مثال: REP-2025-10-02-001)"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="w-full"
                />
              ) : (
                <Input
                  type="text"
                  placeholder="أدخل رقم الطلب (مثال: REP-20251002-001)"
                  value={requestNumber}
                  onChange={(e) => setRequestNumber(e.target.value)}
                  className="w-full"
                />
              )}
            </div>
            <SimpleButton
              type="submit"
              disabled={loading || (!trackingCode && !requestNumber)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 ml-2" />
              )}
              {loading ? 'جاري البحث...' : 'بحث'}
            </SimpleButton>
            <SimpleButton
              type="button"
              onClick={handleClear}
              variant="outline"
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              مسح
            </SimpleButton>
          </div>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loading size="xl" text="جاري البحث عن طلب الإصلاح..." />
        </div>
      )}

      {/* No Results */}
      {!loading && !repairData && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">ابحث عن طلب الإصلاح</h3>
          <p className="text-gray-600">
            أدخل رمز التتبع أو رقم الطلب للعثور على حالة طلب الإصلاح
          </p>
        </div>
      )}

      {/* Repair Data Display */}
      {repairData && (
        <div className="space-y-6">
          {/* Status Progress */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">حالة الطلب</h2>
              <span className="text-sm text-gray-500">
                {formatDate(repairData.createdAt)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>0%</span>
                <span className="font-medium">{getStatusProgress(repairData.status)}% مكتمل</span>
                <span>100%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getStatusProgress(repairData.status)}%` }}
                ></div>
              </div>
            </div>

            {/* Current Status */}
            <div className="flex items-center justify-center">
              {(() => {
                const config = statusConfig[repairData.status] || statusConfig['RECEIVED'];
                const Icon = config.icon;
                return (
                  <div className="text-center">
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${config.color} mb-2`}>
                      <Icon className="w-4 h-4 mr-2" />
                      {config.label}
                    </div>
                    <p className="text-sm text-gray-600">{config.description}</p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Repair Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Device Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات الجهاز</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    {(() => {
                      const DeviceIcon = getDeviceIcon(repairData.deviceType);
                      return <DeviceIcon className="w-5 h-5 text-blue-600" />;
                    })()}
                    <div>
                      <h4 className="font-medium text-gray-900">نوع الجهاز</h4>
                      <p className="text-gray-600">{repairData.deviceType || 'غير محدد'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Package className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">الماركة</h4>
                      <p className="text-gray-600">{repairData.deviceBrand || 'غير محدد'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Wrench className="w-5 h-5 text-orange-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">الموديل</h4>
                      <p className="text-gray-600">{repairData.deviceModel || 'غير محدد'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 space-x-reverse">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">وصف المشكلة</h4>
                      <p className="text-gray-600">{repairData.problemDescription || 'لا توجد تفاصيل'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات العميل</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <User className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">اسم العميل</h4>
                      <p className="text-gray-600">{repairData.customerName || 'غير محدد'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Phone className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">رقم الهاتف</h4>
                      <p className="text-gray-600">{repairData.customerPhone || 'غير محدد'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Mail className="w-5 h-5 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">البريد الإلكتروني</h4>
                      <p className="text-gray-600">{repairData.customerEmail || 'غير محدد'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Repair Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات الإصلاح</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">تاريخ الاستلام</h4>
                      <p className="text-gray-600">{formatDate(repairData.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">التسليم المتوقع</h4>
                      <p className="text-gray-600">{formatDate(repairData.estimatedCompletionDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 space-x-reverse">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">التكلفة المقدرة</h4>
                      <p className="text-gray-600">
                        {repairData.estimatedCost ? `${repairData.estimatedCost} ج.م` : 'غير محدد'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 space-x-reverse">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">الأولوية</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        repairData.priority === 'high' ? 'bg-red-100 text-red-800' :
                        repairData.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {repairData.priority === 'high' ? 'عالية' :
                         repairData.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tracking Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات التتبع</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <QrCode className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">رمز التتبع</h4>
                      <p className="text-gray-600 font-mono">{repairData.trackingToken || 'غير محدد'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <FileText className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">رقم الطلب</h4>
                      <p className="text-gray-600 font-mono">{repairData.requestNumber || 'غير محدد'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 space-x-reverse">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">الفرع</h4>
                      <p className="text-gray-600">{repairData.branchName || 'غير محدد'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">الإجراءات</h3>
              <div className="flex items-center space-x-2 space-x-reverse">
                <SimpleButton
                  onClick={() => navigate(`/repairs/${repairData.id}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Eye className="w-4 h-4 ml-2" />
                  عرض التفاصيل الكاملة
                </SimpleButton>
                
                <SimpleButton
                  onClick={() => window.print()}
                  variant="outline"
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  <Printer className="w-4 h-4 ml-2" />
                  طباعة
                </SimpleButton>
                
                <SimpleButton
                  onClick={handleClear}
                  variant="outline"
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  بحث جديد
                </SimpleButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairTrackingPage;
