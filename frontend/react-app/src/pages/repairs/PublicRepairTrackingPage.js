import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Shield,
  ShoppingCart,
  FileCheck,
  X
} from 'lucide-react';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import SimpleButton from '../../components/ui/SimpleButton';
import { Input } from '../../components/ui/Input';
import { Loading } from '../../components/ui/Loading';
import { getDefaultApiBaseUrl } from '../../lib/apiConfig';
import { useRepairUpdatesById } from '../../hooks/useWebSocket';

const API_BASE_URL = getDefaultApiBaseUrl();

const PublicRepairTrackingPage = () => {
  const notifications = useNotifications();
  const [searchParams] = useSearchParams();
  const notify = (type, message) => {
    notifications.addNotification({ type, message });
  };

  // State management
  const [trackingCode, setTrackingCode] = useState('');
  const [requestNumber, setRequestNumber] = useState('');
  const [repairData, setRepairData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState('trackingToken'); // 'trackingToken' or 'requestNumber'
  const [reportsOpen, setReportsOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

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
    'WAITING_PARTS': {
      label: 'بانتظار قطع غيار',
      color: 'bg-orange-100 text-orange-800',
      icon: ShoppingCart,
      description: 'في انتظار وصول قطع الغيار'
    },
    'READY_FOR_PICKUP': {
      label: 'جاهز للاستلام',
      color: 'bg-green-100 text-green-800',
      icon: Package,
      description: 'انتهى الإصلاح والجهاز جاهز للاستلام'
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
    },
    'ON_HOLD': {
      label: 'معلق',
      color: 'bg-gray-100 text-gray-800',
      icon: AlertCircle,
      description: 'الطلب معلق مؤقتاً'
    },
    'REJECTED': {
      label: 'مرفوض',
      color: 'bg-red-100 text-red-800',
      icon: XCircle,
      description: 'تم رفض الطلب'
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

  // دالة البحث التلقائي (للاستخدام من useEffect)
  const handleAutoSearch = async (value, type) => {
    if (!value) return;

    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (type === 'trackingToken') {
        // إذا كان trackingToken رقم فقط، نستخدم id بدلاً منه
        const isNumeric = /^\d+$/.test(value);
        if (isNumeric) {
          params.append('id', value);
        } else {
          params.append('trackingToken', value);
        }
      } else if (type === 'requestNumber') {
        params.append('requestNumber', value);
      }

      // إضافة timestamp لمنع cache
      const cacheBuster = `&_t=${Date.now()}`;
      const response = await fetch(`${API_BASE_URL}/repairsSimple/tracking?${params.toString()}${cacheBuster}`, {
        cache: 'no-cache',
        // لا نضيف Cache-Control header لأنه يسبب CORS error
        // cache: 'no-cache' في fetch options كافٍ لمنع cache
      });
      
      if (response.ok) {
        const data = await response.json();
        setRepairData(data);
        // لا نعرض إشعار عند البحث التلقائي
      } else {
        // إذا كان 404، لا نعرض خطأ في console (الطلب ببساطة غير موجود)
        if (response.status === 404) {
          setRepairData(null);
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'لم يتم العثور على طلب الإصلاح');
      }
    } catch (error) {
      // لا نعرض خطأ في console عند البحث التلقائي - المستخدم يمكنه البحث يدوياً
      // فقط في حالة أخطاء غير 404
      if (error.message && !error.message.includes('404') && !error.message.includes('not found')) {
        console.error('Error tracking repair:', error);
      }
      setRepairData(null);
    } finally {
      setLoading(false);
    }
  };

  // Ref لتخزين آخر repairId تم تحميله
  const currentRepairIdRef = useRef(null);
  
  // قراءة trackingToken من URL query parameters عند تحميل الصفحة
  useEffect(() => {
    const tokenFromUrl = searchParams.get('trackingToken');
    if (tokenFromUrl) {
      setTrackingCode(tokenFromUrl);
      setSearchType('trackingToken');
      // البحث تلقائياً عن الطلب
      handleAutoSearch(tokenFromUrl, 'trackingToken');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // تحديث تلقائي للحالة كل 30 ثانية
  useEffect(() => {
    if (!repairData || !repairData.id) return;

    currentRepairIdRef.current = repairData.id;
    
    // تحديث تلقائي كل 30 ثانية
    const intervalId = setInterval(() => {
      if (currentRepairIdRef.current) {
        const isNumeric = /^\d+$/.test(String(currentRepairIdRef.current));
        if (isNumeric) {
          handleAutoSearch(String(currentRepairIdRef.current), 'trackingToken');
        } else if (repairData.trackingToken) {
          handleAutoSearch(repairData.trackingToken, 'trackingToken');
        }
      }
    }, 30000); // 30 ثانية

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repairData?.id]);

  // تحديث تلقائي عند focus على الصفحة
  useEffect(() => {
    const handleFocus = () => {
      if (repairData?.id) {
        const isNumeric = /^\d+$/.test(String(repairData.id));
        if (isNumeric) {
          handleAutoSearch(String(repairData.id), 'trackingToken');
        } else if (repairData.trackingToken) {
          handleAutoSearch(repairData.trackingToken, 'trackingToken');
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repairData?.id]);

  // استخدام WebSocket للتحديث التلقائي (إذا كان متاحاً)
  useRepairUpdatesById(repairData?.id, (message) => {
    if (message && message.data) {
      const messageRepairId = message.data.id || message.data.repairRequestId;
      if (messageRepairId === repairData?.id) {
        // تحديث البيانات عند استلام تحديث من WebSocket
        if (message.updateType === 'updated' || message.updateType === 'status_changed' || message.type === 'repair_update') {
          // إعادة جلب البيانات فوراً
          setTimeout(() => {
            const isNumeric = /^\d+$/.test(String(repairData.id));
            if (isNumeric) {
              handleAutoSearch(String(repairData.id), 'trackingToken');
            } else if (repairData.trackingToken) {
              handleAutoSearch(repairData.trackingToken, 'trackingToken');
            }
          }, 500); // انتظر 500ms ثم حدث
        }
      }
    }
  });

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
        // إذا كان trackingToken رقم فقط، نستخدم id بدلاً منه
        const isNumeric = /^\d+$/.test(trackingCode);
        if (isNumeric) {
          params.append('id', trackingCode);
        } else {
          params.append('trackingToken', trackingCode);
        }
      } else if (searchType === 'requestNumber' && requestNumber) {
        params.append('requestNumber', requestNumber);
      }

      // إضافة timestamp لمنع cache
      const cacheBuster = `&_t=${Date.now()}`;
      const response = await fetch(`${API_BASE_URL}/repairsSimple/tracking?${params.toString()}${cacheBuster}`, {
        cache: 'no-cache',
        // لا نضيف Cache-Control header لأنه يسبب CORS error
        // cache: 'no-cache' في fetch options كافٍ لمنع cache
      });
      
      if (response.ok) {
        const data = await response.json();
        setRepairData(data);
        notify('success', 'تم العثور على طلب الإصلاح بنجاح');
      } else {
        // معالجة 404 بشكل خاص
        if (response.status === 404) {
          notify('error', 'لم يتم العثور على طلب الإصلاح');
          setRepairData(null);
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'لم يتم العثور على طلب الإصلاح');
      }
    } catch (error) {
      // لا نعرض خطأ في console إذا كان 404
      if (!error.message || (!error.message.includes('404') && !error.message.includes('not found'))) {
        console.error('Error tracking repair:', error);
      }
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
    // تحويل الحالة العربية إلى إنجليزية إذا لزم الأمر
    const statusMap = {
      'تم الاستلام': 'RECEIVED',
      'قيد الفحص': 'INSPECTION',
      'في انتظار الموافقة': 'AWAITING_APPROVAL',
      'قيد الإصلاح': 'UNDER_REPAIR',
      'جاهز للتسليم': 'READY_FOR_DELIVERY',
      'جاهز للاستلام': 'READY_FOR_PICKUP',
      'تم التسليم': 'DELIVERED',
      'مرفوض': 'REJECTED',
      'في انتظار القطع': 'WAITING_PARTS',
      'معلق': 'ON_HOLD',
      'مكتمل': 'COMPLETED'
    };
    const englishStatus = statusMap[status] || status;
    
    const statusOrder = [
      'RECEIVED', 'INSPECTION', 'QUOTATION_SENT', 'QUOTATION_APPROVED',
      'UNDER_REPAIR', 'WAITING_PARTS', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 
      'DELIVERED', 'COMPLETED'
    ];
    const currentIndex = statusOrder.indexOf(englishStatus);
    return currentIndex >= 0 ? ((currentIndex + 1) / statusOrder.length) * 100 : 0;
  };

  // Load inspection reports
  const loadReports = async () => {
    if (!repairData?.id) return;
    
    try {
      setReportsLoading(true);
      const response = await fetch(`${API_BASE_URL}/inspectionreports/repair/${repairData.id}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.data || []);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  };

  // Handle open reports modal
  const handleOpenReports = () => {
    setReportsOpen(true);
    loadReports();
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
                  // استخدام الحالة الإنجليزية من Backend أو statusLabel العربية
                  const statusKey = repairData.status || 'RECEIVED';
                  // تحويل الحالة العربية إلى إنجليزية إذا لزم الأمر
                  const statusMap = {
                    'تم الاستلام': 'RECEIVED',
                    'قيد الفحص': 'INSPECTION',
                    'في انتظار الموافقة': 'AWAITING_APPROVAL',
                    'قيد الإصلاح': 'UNDER_REPAIR',
                    'جاهز للتسليم': 'READY_FOR_DELIVERY',
                    'جاهز للاستلام': 'READY_FOR_PICKUP',
                    'تم التسليم': 'DELIVERED',
                    'مرفوض': 'REJECTED',
                    'في انتظار القطع': 'WAITING_PARTS',
                    'معلق': 'ON_HOLD',
                    'مكتمل': 'COMPLETED'
                  };
                  const englishStatus = statusMap[statusKey] || statusKey;
                  const config = statusConfig[englishStatus] || statusConfig['RECEIVED'];
                  const Icon = config.icon;
                  return (
                    <div className="text-center">
                      <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-medium ${config.color} mb-3`}>
                        <Icon className="w-6 h-6 mr-3" />
                        {repairData.statusLabel || config.label}
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
                  <p className="text-gray-600 font-mono text-lg">
                    {repairData.trackingToken || repairData.id || 'غير محدد'}
                  </p>
                  {!repairData.trackingToken && repairData.id && (
                    <p className="text-xs text-gray-500 mt-1">(رقم الطلب)</p>
                  )}
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">رقم الطلب</h4>
                  <p className="text-gray-600 font-mono text-lg">{repairData.requestNumber || 'غير محدد'}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-center space-x-4 space-x-reverse flex-wrap gap-4">
                <SimpleButton
                  onClick={handleOpenReports}
                  variant="outline"
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  disabled={!repairData}
                >
                  <FileCheck className="w-4 h-4 ml-2" />
                  عرض التقارير
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
                  onClick={() => {
                    if (repairData?.id) {
                      const isNumeric = /^\d+$/.test(String(repairData.id));
                      if (isNumeric) {
                        handleAutoSearch(String(repairData.id), 'trackingToken');
                      } else if (repairData.trackingToken) {
                        handleAutoSearch(repairData.trackingToken, 'trackingToken');
                      }
                    }
                  }}
                  variant="outline"
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                  disabled={!repairData || loading}
                >
                  <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
                  تحديث
                </SimpleButton>
                
                <SimpleButton
                  onClick={handleClear}
                  variant="outline"
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  بحث جديد
                </SimpleButton>
              </div>
            </div>

            {/* Reports Modal */}
            {reportsOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                      <FileCheck className="w-6 h-6 ml-3 text-blue-600" />
                      تقارير الفحص
                    </h2>
                    <button
                      onClick={() => setReportsOpen(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {reportsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loading size="lg" text="جاري تحميل التقارير..." />
                      </div>
                    ) : reports.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد تقارير</h3>
                        <p className="text-gray-600">لا توجد تقارير فحص مرتبطة بهذا الطلب</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {reports.map((report) => (
                          <div key={report.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                  {report.inspectionTypeName || 'تقرير فحص'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {formatDate(report.reportDate)}
                                </p>
                              </div>
                              {report.technicianName && (
                                <div className="text-left">
                                  <p className="text-sm text-gray-600">الفني</p>
                                  <p className="text-sm font-medium text-gray-900">{report.technicianName}</p>
                                </div>
                              )}
                            </div>

                            {report.summary && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">الملخص</h4>
                                <p className="text-gray-600 bg-white p-3 rounded border">{report.summary}</p>
                              </div>
                            )}

                            {report.result && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">النتيجة</h4>
                                <p className="text-gray-600 bg-white p-3 rounded border">{report.result}</p>
                              </div>
                            )}

                            {report.recommendations && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">التوصيات</h4>
                                <p className="text-gray-600 bg-white p-3 rounded border">{report.recommendations}</p>
                              </div>
                            )}

                            {report.notes && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">ملاحظات</h4>
                                <p className="text-gray-600 bg-white p-3 rounded border">{report.notes}</p>
                              </div>
                            )}

                            {report.branchName && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">الفرع:</span> {report.branchName}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-end p-6 border-t">
                    <SimpleButton
                      onClick={() => setReportsOpen(false)}
                      variant="outline"
                      className="text-gray-600 border-gray-300 hover:bg-gray-50"
                    >
                      إغلاق
                    </SimpleButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicRepairTrackingPage;
