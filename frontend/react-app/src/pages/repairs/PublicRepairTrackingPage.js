import React, { useState } from 'react';
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
  RefreshCw,
  Printer,
  Eye,
  Smartphone,
  Monitor,
  Laptop,
  Tablet,
  Building2,
  Shield
} from 'lucide-react';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import SimpleButton from '../../components/ui/SimpleButton';
import { Input } from '../../components/ui/Input';
import { Loading } from '../../components/ui/Loading';
import { getDefaultApiBaseUrl } from '../../lib/apiConfig';

const API_BASE_URL = getDefaultApiBaseUrl();

const PublicRepairTrackingPage = () => {
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

      const response = await fetch(`${API_BASE_URL}/repairs/tracking?${params.toString()}`);
      
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
    return new Date(dateString).toLocaleDateString('en-GB', {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="bg-blue-600 p-3 rounded-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">تتبع طلب الإصلاح</h1>
                <p className="text-gray-600">ابحث عن حالة طلب الإصلاح الخاص بك</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">FixZone</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <QrCode className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">تتبع طلب الإصلاح</h2>
            <p className="text-gray-600">أدخل رمز التتبع أو رقم الطلب لمعرفة حالة طلب الإصلاح</p>
          </div>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto space-y-6">
            {/* Search Type Toggle */}
            <div className="flex items-center justify-center space-x-6 space-x-reverse">
              <label className="flex items-center cursor-pointer">
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
              <label className="flex items-center cursor-pointer">
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
                    className="w-full text-center text-lg py-4"
                  />
                ) : (
                  <Input
                    type="text"
                    placeholder="أدخل رقم الطلب (مثال: REP-20251002-001)"
                    value={requestNumber}
                    onChange={(e) => setRequestNumber(e.target.value)}
                    className="w-full text-center text-lg py-4"
                  />
                )}
              </div>
              <SimpleButton
                type="submit"
                disabled={loading || (!trackingCode && !requestNumber)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 ml-2 animate-spin" />
                ) : (
                  <Search className="w-5 h-5 ml-2" />
                )}
                {loading ? 'جاري البحث...' : 'بحث'}
              </SimpleButton>
            </div>

            {(!trackingCode && !requestNumber) && (
              <SimpleButton
                type="button"
                onClick={handleClear}
                variant="outline"
                className="w-full text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                مسح
              </SimpleButton>
            )}
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
          <div className="space-y-8">
            {/* Status Progress */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">حالة الطلب</h2>
                <p className="text-gray-600">
                  تم إنشاء الطلب في {formatDate(repairData.createdAt)}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>0%</span>
                  <span className="font-medium">{Math.round(getStatusProgress(repairData.status))}% مكتمل</span>
                  <span>100%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
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
                      <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-medium ${config.color} mb-3`}>
                        <Icon className="w-6 h-6 mr-3" />
                        {config.label}
                      </div>
                      <p className="text-gray-600">{config.description}</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Repair Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Device Information */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Package className="w-6 h-6 ml-3 text-blue-600" />
                  معلومات الجهاز
                </h3>
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

              {/* Repair Information */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Wrench className="w-6 h-6 ml-3 text-orange-600" />
                  معلومات الإصلاح
                </h3>
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
                    <MapPin className="w-5 h-5 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">الفرع</h4>
                      <p className="text-gray-600">{repairData.branchName || 'غير محدد'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Information */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <QrCode className="w-6 h-6 ml-3 text-blue-600" />
                معلومات التتبع
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">رمز التتبع</h4>
                  <p className="text-gray-600 font-mono text-lg">{repairData.trackingToken || 'غير محدد'}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">رقم الطلب</h4>
                  <p className="text-gray-600 font-mono text-lg">{repairData.requestNumber || 'غير محدد'}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-center space-x-4 space-x-reverse">
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
        )}
      </div>
    </div>
  );
};

export default PublicRepairTrackingPage;
