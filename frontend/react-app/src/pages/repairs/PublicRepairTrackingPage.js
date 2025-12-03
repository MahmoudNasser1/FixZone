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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 space-x-reverse flex-1 min-w-0">
              <div className="bg-blue-600 p-2 sm:p-2.5 md:p-3 rounded-lg flex-shrink-0">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 truncate">تتبع طلب الإصلاح</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">ابحث عن حالة طلب الإصلاح الخاص بك</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 space-x-reverse flex-shrink-0">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">FixZone</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8">
          <div className="text-center mb-4 sm:mb-6 md:mb-8">
            <QrCode className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-blue-600 mx-auto mb-3 sm:mb-4" />
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">تتبع طلب الإصلاح</h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 px-2">أدخل رمز التتبع أو رقم الطلب لمعرفة حالة طلب الإصلاح</p>
          </div>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
            {/* Search Type Toggle */}
            <div className="flex items-center justify-center space-x-4 sm:space-x-6 space-x-reverse flex-wrap gap-2">
              <label className="flex items-center cursor-pointer px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="searchType"
                  value="trackingToken"
                  checked={searchType === 'trackingToken'}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
                />
                <span className="mr-2 text-xs sm:text-sm font-medium text-gray-700">رمز التتبع</span>
              </label>
              <label className="flex items-center cursor-pointer px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="searchType"
                  value="requestNumber"
                  checked={searchType === 'requestNumber'}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
                />
                <span className="mr-2 text-xs sm:text-sm font-medium text-gray-700">رقم الطلب</span>
              </label>
            </div>

            {/* Search Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 space-x-reverse gap-2">
              <div className="flex-1">
                {searchType === 'trackingToken' ? (
                  <Input
                    type="text"
                    placeholder="أدخل رمز التتبع"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    className="w-full text-center sm:text-right text-sm sm:text-base md:text-lg py-3 sm:py-3.5 md:py-4"
                  />
                ) : (
                  <Input
                    type="text"
                    placeholder="أدخل رقم الطلب"
                    value={requestNumber}
                    onChange={(e) => setRequestNumber(e.target.value)}
                    className="w-full text-center sm:text-right text-sm sm:text-base md:text-lg py-3 sm:py-3.5 md:py-4"
                  />
                )}
              </div>
              <SimpleButton
                type="submit"
                disabled={loading || (!trackingCode && !requestNumber)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 md:px-8 py-3 sm:py-3.5 md:py-4 min-h-[44px] sm:min-h-[48px] text-sm sm:text-base"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 ml-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                )}
                <span className="hidden sm:inline">{loading ? 'جاري البحث...' : 'بحث'}</span>
                <span className="sm:hidden">{loading ? '...' : 'بحث'}</span>
              </SimpleButton>
            </div>

            {(!trackingCode && !requestNumber) && (
              <SimpleButton
                type="button"
                onClick={handleClear}
                variant="outline"
                className="w-full text-gray-600 border-gray-300 hover:bg-gray-50 py-2.5 sm:py-3 text-sm sm:text-base"
              >
                مسح
              </SimpleButton>
            )}
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-48 sm:h-64">
            <Loading size="xl" text="جاري البحث عن طلب الإصلاح..." />
          </div>
        )}

        {/* No Results */}
        {!loading && !repairData && (
          <div className="text-center py-8 sm:py-12">
            <Search className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">ابحث عن طلب الإصلاح</h3>
            <p className="text-sm sm:text-base text-gray-600 px-4">
              أدخل رمز التتبع أو رقم الطلب للعثور على حالة طلب الإصلاح
            </p>
          </div>
        )}

        {/* Repair Data Display */}
        {repairData && (
          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            {/* Status Progress */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
              <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">حالة الطلب</h2>
                <p className="text-xs sm:text-sm md:text-base text-gray-600">
                  تم إنشاء الطلب في {formatDate(repairData.createdAt)}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-4 sm:mb-6">
                <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
                  <span>0%</span>
                  <span className="font-medium">{Math.round(getStatusProgress(repairData.status))}% مكتمل</span>
                  <span>100%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 sm:h-3 rounded-full transition-all duration-500"
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
                      <div className={`inline-flex items-center px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full text-sm sm:text-base md:text-lg font-medium ${config.color} mb-2 sm:mb-3`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 sm:mr-3" />
                        {repairData.statusLabel || config.label}
                      </div>
                      <p className="text-xs sm:text-sm md:text-base text-gray-600 px-2">{config.description}</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Repair Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              {/* Device Information */}
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-5 md:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-5 md:mb-6 flex items-center">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3 text-blue-600 flex-shrink-0" />
                  <span>معلومات الجهاز</span>
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 space-x-reverse">
                    {(() => {
                      const DeviceIcon = getDeviceIcon(repairData.deviceType);
                      return <DeviceIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5 sm:mt-0" />;
                    })()}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-0.5">نوع الجهاز</h4>
                      <p className="text-xs sm:text-sm text-gray-600 break-words">{repairData.deviceType || 'غير محدد'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 space-x-reverse">
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-0.5">الماركة</h4>
                      <p className="text-xs sm:text-sm text-gray-600 break-words">{repairData.deviceBrand || 'غير محدد'}</p>
                    </div>
                  </div>

                  <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 space-x-reverse">
                    <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-0.5">الموديل</h4>
                      <p className="text-xs sm:text-sm text-gray-600 break-words">{repairData.deviceModel || 'غير محدد'}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 sm:space-x-3 space-x-reverse">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-0.5">وصف المشكلة</h4>
                      <p className="text-xs sm:text-sm text-gray-600 break-words">{repairData.problemDescription || 'لا توجد تفاصيل'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Repair Information */}
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-5 md:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-5 md:mb-6 flex items-center">
                  <Wrench className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3 text-orange-600 flex-shrink-0" />
                  <span>معلومات الإصلاح</span>
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 space-x-reverse">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-0.5">تاريخ الاستلام</h4>
                      <p className="text-xs sm:text-sm text-gray-600 break-words">{formatDate(repairData.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 space-x-reverse">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-0.5">التسليم المتوقع</h4>
                      <p className="text-xs sm:text-sm text-gray-600 break-words">{formatDate(repairData.estimatedCompletionDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 space-x-reverse">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-0.5">التكلفة المقدرة</h4>
                      <p className="text-xs sm:text-sm text-gray-600 break-words">
                        {repairData.estimatedCost ? `${repairData.estimatedCost} ج.م` : 'غير محدد'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 space-x-reverse">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-0.5">الفرع</h4>
                      <p className="text-xs sm:text-sm text-gray-600 break-words">{repairData.branchName || 'غير محدد'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Information */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-5 md:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-5 md:mb-6 flex items-center">
                <QrCode className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3 text-blue-600 flex-shrink-0" />
                <span>معلومات التتبع</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-1 sm:mb-2">رمز التتبع</h4>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 font-mono break-all">
                    {repairData.trackingToken || repairData.id || 'غير محدد'}
                  </p>
                  {!repairData.trackingToken && repairData.id && (
                    <p className="text-xs text-gray-500 mt-1">(رقم الطلب)</p>
                  )}
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-1 sm:mb-2">رقم الطلب</h4>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 font-mono break-all">{repairData.requestNumber || 'غير محدد'}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-5 md:p-6">
              <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-center gap-2 sm:gap-3 md:gap-4 sm:space-x-4 space-x-reverse">
                <SimpleButton
                  onClick={handleOpenReports}
                  variant="outline"
                  className="text-blue-600 border-blue-300 hover:bg-blue-50 min-h-[44px] sm:min-h-[48px] text-xs sm:text-sm md:text-base py-2.5 sm:py-3"
                  disabled={!repairData}
                >
                  <FileCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
                  <span className="hidden sm:inline">عرض التقارير</span>
                  <span className="sm:hidden">التقارير</span>
                </SimpleButton>
                
                <SimpleButton
                  onClick={() => window.print()}
                  variant="outline"
                  className="text-gray-600 border-gray-300 hover:bg-gray-50 min-h-[44px] sm:min-h-[48px] text-xs sm:text-sm md:text-base py-2.5 sm:py-3"
                >
                  <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
                  <span className="hidden sm:inline">طباعة</span>
                  <span className="sm:hidden">طباعة</span>
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
                  className="text-gray-600 border-gray-300 hover:bg-gray-50 min-h-[44px] sm:min-h-[48px] text-xs sm:text-sm md:text-base py-2.5 sm:py-3"
                  disabled={!repairData || loading}
                >
                  <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">تحديث</span>
                  <span className="sm:hidden">تحديث</span>
                </SimpleButton>
                
                <SimpleButton
                  onClick={handleClear}
                  variant="outline"
                  className="text-gray-600 border-gray-300 hover:bg-gray-50 min-h-[44px] sm:min-h-[48px] text-xs sm:text-sm md:text-base py-2.5 sm:py-3"
                >
                  <span className="hidden sm:inline">بحث جديد</span>
                  <span className="sm:hidden">جديد</span>
                </SimpleButton>
              </div>
            </div>

            {/* Reports Modal */}
            {reportsOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-4 sm:p-5 md:p-6 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center">
                      <FileCheck className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3 text-blue-600" />
                      <span>تقارير الفحص</span>
                    </h2>
                    <button
                      onClick={() => setReportsOpen(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mr-1"
                      aria-label="إغلاق"
                    >
                      <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
                    {reportsLoading ? (
                      <div className="flex items-center justify-center py-8 sm:py-12">
                        <Loading size="lg" text="جاري تحميل التقارير..." />
                      </div>
                    ) : reports.length === 0 ? (
                      <div className="text-center py-8 sm:py-12">
                        <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">لا توجد تقارير</h3>
                        <p className="text-sm sm:text-base text-gray-600 px-4">لا توجد تقارير فحص مرتبطة بهذا الطلب</p>
                      </div>
                    ) : (
                      <div className="space-y-4 sm:space-y-6">
                        {reports.map((report) => (
                          <div key={report.id} className="bg-gray-50 rounded-lg p-4 sm:p-5 md:p-6 border border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4 gap-2">
                              <div className="flex-1">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                                  {report.inspectionTypeName || 'تقرير فحص'}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  {formatDate(report.reportDate)}
                                </p>
                              </div>
                              {report.technicianName && (
                                <div className="text-right sm:text-left">
                                  <p className="text-xs sm:text-sm text-gray-600">الفني</p>
                                  <p className="text-xs sm:text-sm font-medium text-gray-900">{report.technicianName}</p>
                                </div>
                              )}
                            </div>

                            {report.summary && (
                              <div className="mb-3 sm:mb-4">
                                <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">الملخص</h4>
                                <p className="text-xs sm:text-sm text-gray-600 bg-white p-2 sm:p-3 rounded border break-words">{report.summary}</p>
                              </div>
                            )}

                            {report.result && (
                              <div className="mb-3 sm:mb-4">
                                <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">النتيجة</h4>
                                <p className="text-xs sm:text-sm text-gray-600 bg-white p-2 sm:p-3 rounded border break-words">{report.result}</p>
                              </div>
                            )}

                            {report.recommendations && (
                              <div className="mb-3 sm:mb-4">
                                <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">التوصيات</h4>
                                <p className="text-xs sm:text-sm text-gray-600 bg-white p-2 sm:p-3 rounded border break-words">{report.recommendations}</p>
                              </div>
                            )}

                            {report.notes && (
                              <div className="mb-3 sm:mb-4">
                                <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">ملاحظات</h4>
                                <p className="text-xs sm:text-sm text-gray-600 bg-white p-2 sm:p-3 rounded border break-words">{report.notes}</p>
                              </div>
                            )}

                            {report.branchName && (
                              <div className="text-xs sm:text-sm text-gray-600">
                                <span className="font-medium">الفرع:</span> {report.branchName}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-end p-4 sm:p-5 md:p-6 border-t sticky bottom-0 bg-white">
                    <SimpleButton
                      onClick={() => setReportsOpen(false)}
                      variant="outline"
                      className="text-gray-600 border-gray-300 hover:bg-gray-50 min-h-[44px] sm:min-h-[48px] text-sm sm:text-base w-full sm:w-auto px-6"
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
