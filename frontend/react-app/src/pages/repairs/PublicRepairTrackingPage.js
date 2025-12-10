import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  X,
  Image,
  Download,
  Sun,
  Moon
} from 'lucide-react';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import { Input } from '../../components/ui/Input';
import { Loading } from '../../components/ui/Loading';
import { getDefaultApiBaseUrl } from '../../lib/apiConfig';
import { useRepairUpdatesById } from '../../hooks/useWebSocket';
import { ZoomIn, Receipt, Lock } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';

const API_BASE_URL = getDefaultApiBaseUrl();

const PublicRepairTrackingPage = () => {
  const notifications = useNotifications();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const notify = (type, message) => {
    notifications.addNotification({ type, message });
  };

  // State management
  const [trackingCode, setTrackingCode] = useState('');
  const [requestNumber, setRequestNumber] = useState('');
  const [repairData, setRepairData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState('trackingToken'); // 'trackingToken' or 'requestNumber'
  const [hasReports, setHasReports] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [showInvoiceAuth, setShowInvoiceAuth] = useState(false);
  const [invoicePhone, setInvoicePhone] = useState('');
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');

  // Repair status configuration
  const statusConfig = {
    'RECEIVED': {
      label: 'مستلم',
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      icon: Package,
      description: 'تم استلام الجهاز في الورشة'
    },
    'INSPECTION': {
      label: 'قيد الفحص',
      color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      icon: Eye,
      description: 'يتم فحص الجهاز وتحديد المشكلة'
    },
    'QUOTATION_SENT': {
      label: 'تم إرسال العرض',
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      icon: FileText,
      description: 'تم إرسال عرض السعر للعميل'
    },
    'QUOTATION_APPROVED': {
      label: 'تم قبول العرض',
      color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
      icon: CheckCircle,
      description: 'وافق العميل على السعر'
    },
    'UNDER_REPAIR': {
      label: 'قيد الإصلاح',
      color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
      icon: Wrench,
      description: 'يتم إصلاح الجهاز حالياً'
    },
    'WAITING_PARTS': {
      label: 'بانتظار قطع غيار',
      color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
      icon: ShoppingCart,
      description: 'في انتظار وصول قطع الغيار'
    },
    'READY_FOR_PICKUP': {
      label: 'جاهز للاستلام',
      color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      icon: Package,
      description: 'انتهى الإصلاح والجهاز جاهز للاستلام'
    },
    'READY_FOR_DELIVERY': {
      label: 'جاهز للتسليم',
      color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      icon: CheckCircle,
      description: 'انتهى الإصلاح والجهاز جاهز'
    },
    'DELIVERED': {
      label: 'تم التسليم',
      color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
      icon: Package,
      description: 'تم تسليم الجهاز للعميل'
    },
    'COMPLETED': {
      label: 'مكتمل',
      color: 'bg-muted text-foreground',
      icon: CheckCircle,
      description: 'انتهى الطلب بالكامل'
    },
    'ON_HOLD': {
      label: 'معلق',
      color: 'bg-muted text-foreground',
      icon: AlertCircle,
      description: 'الطلب معلق مؤقتاً'
    },
    'REJECTED': {
      label: 'مرفوض',
      color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
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

  // تحديث تلقائي عند focus على الصفحة (للبيانات والتقارير)
  useEffect(() => {
    const handleFocus = () => {
      if (repairData?.id) {
        const isNumeric = /^\d+$/.test(String(repairData.id));
        if (isNumeric) {
          handleAutoSearch(String(repairData.id), 'trackingToken');
        } else if (repairData.trackingToken) {
          handleAutoSearch(repairData.trackingToken, 'trackingToken');
        }
        // إعادة فحص التقارير عند focus (بعد تحديث بيانات الطلب)
        setTimeout(() => {
          console.log('[Focus] Refreshing reports after focus');
          loadReports();
        }, 1000);
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
        console.log('[WebSocket] Repair update received:', message.updateType);
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
            // إعادة فحص التقارير بعد تحديث بيانات الطلب
            setTimeout(() => {
              console.log('[WebSocket] Refreshing reports after repair update');
              loadReports();
            }, 1000); // انتظر ثانية إضافية بعد تحديث بيانات الطلب
          }, 500); // انتظر 500ms ثم حدث
        }
      }
    }
  });


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

  // Check for reports
  const loadReports = async () => {
    if (!repairData?.id) {
      console.log('[Reports] No repair ID available');
      setHasReports(false);
      return;
    }
    
    const repairId = repairData.id;
    console.log('[Reports] Checking for reports for repair ID:', repairId);
    
    try {
      const response = await fetch(`${API_BASE_URL}/inspectionreports/repair/${repairId}`);
      console.log('[Reports] API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Reports] API Response data:', data);
        
        // Handle different response formats
        // API returns: { success: true, data: [...] }
        let reportsList = [];
        if (data.success && data.data) {
          reportsList = Array.isArray(data.data) ? data.data : [];
        } else if (data.data) {
          reportsList = Array.isArray(data.data) ? data.data : [];
        } else if (data.reports) {
          reportsList = Array.isArray(data.reports) ? data.reports : [];
        } else if (Array.isArray(data)) {
          reportsList = data;
        }
        
        console.log('[Reports] Parsed reports list:', reportsList);
        console.log('[Reports] Number of reports:', reportsList.length);
        
        const hasReports = reportsList.length > 0;
        console.log('[Reports] Setting hasReports to:', hasReports);
        setHasReports(hasReports);
      } else if (response.status === 404) {
        // No reports found - this is normal, not an error
        console.log('[Reports] No reports found (404)');
        setHasReports(false);
      } else {
        // Other error - log but don't show error to user
        const errorData = await response.json().catch(() => ({}));
        console.warn('[Reports] Error loading reports:', response.status, errorData);
        setHasReports(false);
      }
    } catch (error) {
      // Network error or other exception
      console.error('[Reports] Exception loading reports:', error);
      setHasReports(false);
    }
  };

  // Check for reports when repair data is loaded or updated
  useEffect(() => {
    if (repairData?.id) {
      console.log('[Reports] useEffect triggered, repair ID:', repairData.id);
      loadReports();
    } else {
      console.log('[Reports] useEffect triggered, no repair ID');
      setHasReports(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repairData?.id]);

  // تحديث دوري للتقارير كل 15 ثانية (للتأكد من ظهور التقارير الجديدة)
  useEffect(() => {
    if (!repairData?.id) return;

    console.log('[Reports] Setting up periodic refresh for repair ID:', repairData.id);
    const intervalId = setInterval(() => {
      console.log('[Reports] Periodic refresh triggered');
      loadReports();
    }, 15000); // كل 15 ثانية

    return () => {
      console.log('[Reports] Clearing periodic refresh');
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repairData?.id]);



  // Load attachments
  const loadAttachments = async () => {
    if (!repairData?.id) {
      console.log('No repair data ID, skipping attachments load');
      return;
    }
    
    try {
      setAttachmentsLoading(true);
      console.log('Loading attachments for repair ID:', repairData.id);
      const response = await fetch(`${API_BASE_URL}/repairsSimple/${repairData.id}/attachments`);
      console.log('Attachments API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        const attachmentsList = data.data || [];
        console.log('Attachments loaded successfully:', attachmentsList.length, 'items');
        console.log('Attachments details:', attachmentsList);
        console.log('Debug info:', data.debug);
        
        if (attachmentsList.length === 0 && data.debug) {
          console.warn('No attachments found. Debug info:', {
            hasAttachmentsField: data.debug.hasAttachmentsField,
            rawAttachmentsCount: data.debug.rawAttachmentsCount,
            uploadRoot: data.debug.uploadRoot
          });
        }
        
        setAttachments(attachmentsList);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Failed to load attachments:', response.status, errorData);
        setAttachments([]);
      }
    } catch (error) {
      console.error('Error loading attachments:', error);
      setAttachments([]);
    } finally {
      setAttachmentsLoading(false);
    }
  };

  // Load attachments when repair data is available (only once, not when opening reports)
  // Note: We load attachments when opening reports modal instead to avoid double loading
  // useEffect(() => {
  //   if (repairData?.id) {
  //     loadAttachments();
  //   }
  // }, [repairData?.id]);

  // Handle invoice authentication and open print page
  const handleInvoiceAuth = async () => {
    if (!invoicePhone.trim()) {
      setInvoiceError('يرجى إدخال رقم الهاتف');
      return;
    }

    if (!repairData?.id) {
      setInvoiceError('لا يوجد طلب إصلاح');
      return;
    }

    try {
      setInvoiceLoading(true);
      setInvoiceError('');

      // Use public verification endpoint that checks phone number
      const response = await fetch(
        `${API_BASE_URL}/invoices/public/verify?repairRequestId=${repairData.id}&phoneNumber=${encodeURIComponent(invoicePhone)}`
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Open the print-ready invoice page in a new window with phone verification
          const invoiceId = result.data.id;
          const printUrl = `${API_BASE_URL}/invoices/public/${invoiceId}/print?phoneNumber=${encodeURIComponent(invoicePhone)}&repairRequestId=${repairData.id}`;
          window.open(printUrl, '_blank');
          
          // Reset form
          setShowInvoiceAuth(false);
          setInvoicePhone('');
          setInvoiceError('');
        } else {
          setInvoiceError(result.error || 'لا توجد فواتير لهذا الطلب');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403) {
          setInvoiceError('رقم الهاتف غير صحيح');
        } else if (response.status === 404) {
          setInvoiceError(errorData.error || 'لا توجد فواتير لهذا الطلب');
        } else {
          setInvoiceError(errorData.error || 'فشل في جلب بيانات الفاتورة');
        }
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setInvoiceError('حدث خطأ أثناء جلب بيانات الفاتورة');
    } finally {
      setInvoiceLoading(false);
    }
  };

  // Get current theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    // For 'system', check the actual system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Update isDarkMode when theme changes
  useEffect(() => {
    if (theme === 'dark') {
      setIsDarkMode(true);
    } else if (theme === 'light') {
      setIsDarkMode(false);
    } else {
      // For 'system', check the actual system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkMode(mediaQuery.matches);
      
      // Listen for system theme changes
      const handleChange = (e) => setIsDarkMode(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 space-x-reverse flex-1 min-w-0">
              <div className="bg-blue-600 dark:bg-blue-700 p-2 sm:p-2.5 md:p-3 rounded-lg flex-shrink-0">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground truncate">تتبع طلب الإصلاح</h1>
                <p className="text-xs sm:text-sm text-foreground/80 dark:text-foreground hidden sm:block">ابحث عن حالة طلب الإصلاح الخاص بك</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse flex-shrink-0">
              {/* Theme Toggle Button */}
              <button
                onClick={() => {
                  const newTheme = isDarkMode ? 'light' : 'dark';
                  setTheme(newTheme);
                }}
                className="relative p-2 rounded-lg hover:bg-muted transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-background"
                aria-label="تبديل المظهر"
                title={isDarkMode ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
              >
                <Sun className="h-5 w-5 sm:h-6 sm:w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
                <Moon className="absolute h-5 w-5 sm:h-6 sm:w-6 top-2 right-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
              </button>
              <img 
                src="/logo.png" 
                alt="FixZone Logo" 
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 object-contain flex-shrink-0"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              {/* <span className="text-xs sm:text-sm font-medium text-foreground">FixZone</span> */}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Welcome Section */}
        <SimpleCard className="mb-4 sm:mb-6 md:mb-8">
          <SimpleCardContent className="p-4 sm:p-6 md:p-8">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-3">
                {repairData?.customerName ? (
                  <>
                    اهلاً <span className="text-blue-600 dark:text-blue-400">{repairData.customerName}</span>
                  </>
                ) : (
                  'تتبع طلب الإصلاح'
                )}
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-foreground/80 dark:text-foreground px-2 max-w-2xl mx-auto">
                {repairData ? (
                  'يمكنك من خلال هذه الصفحة متابعة حالة طلب الإصلاح الخاص بك، عرض التقارير، ومتابعة التحديثات الفورية'
                ) : (
                  'أدخل رمز التتبع أو رقم الطلب لمعرفة حالة طلب الإصلاح الخاص بك'
                )}
              </p>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-48 sm:h-64">
            <Loading size="xl" text="جاري تحميل بيانات الطلب..." />
          </div>
        )}

        {/* Repair Data Display */}
        {repairData && (
          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            {/* Status Progress */}
            <SimpleCard>
              <SimpleCardContent className="p-4 sm:p-6 md:p-8">
                <div className="text-center mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-1 sm:mb-2">حالة الطلب</h2>
                  <p className="text-xs sm:text-sm md:text-base text-foreground/80 dark:text-foreground">
                    تم إنشاء الطلب في {formatDate(repairData.createdAt)}
                  </p>
                </div>

              {/* Progress Bar */}
              <div className="mb-4 sm:mb-6">
                <div className="flex justify-center items-center text-xs sm:text-sm text-foreground/80 dark:text-foreground mb-4">
                  <span className="font-bold text-lg sm:text-xl text-blue-600 dark:text-blue-400">{Math.round(getStatusProgress(repairData.status))}% مكتمل</span>
                </div>
                <div className="relative w-full bg-muted dark:bg-muted/60 rounded-full h-4 sm:h-5">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-blue-400 to-green-500 dark:from-blue-600 dark:via-blue-500 dark:to-green-600 h-4 sm:h-5 rounded-full transition-all duration-700 relative shadow-md"
                    style={{ width: `${getStatusProgress(repairData.status)}%` }}
                  >
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-5 h-5 sm:w-6 sm:h-6 bg-background border-2 border-blue-600 dark:border-blue-400 rounded-full shadow-xl flex items-center justify-center">
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Status and Reports Button */}
              <div className="flex items-center justify-center gap-3 sm:gap-4">
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
                      <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
                        <div className={`inline-flex items-center px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full text-sm sm:text-base md:text-lg font-medium ${config.color}`}>
                          <div className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-background/20 dark:bg-background/30 rounded-full mr-3 sm:mr-4">
                            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-current" />
                          </div>
                          {repairData.statusLabel || config.label}
                        </div>
                        
                      </div>
                      <p className="text-xs sm:text-sm md:text-base text-foreground/80 dark:text-foreground px-2 mt-2 sm:mt-3">{config.description}</p>
                    </div>
                  );
                })()}
              </div>

              {/* Quick Actions - Reports & Invoice Buttons */}
              <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  {/* Reports Button */}
                  {hasReports ? (
                    <button
                      onClick={() => {
                        const token = searchParams.get('trackingToken');
                        const id = repairData?.id;
                        
                        // Always prefer repairId if available, as it's more reliable
                        // Also pass trackingToken if available for fallback
                        if (id) {
                          if (token) {
                            navigate(`/track/reports?repairId=${id}&trackingToken=${encodeURIComponent(token)}`);
                          } else {
                            navigate(`/track/reports?repairId=${id}`);
                          }
                        } else if (token) {
                          navigate(`/track/reports?trackingToken=${encodeURIComponent(token)}`);
                        } else {
                          console.error('No repair ID or tracking token available');
                          notify('error', 'لا يمكن عرض التقارير: بيانات الطلب غير متوفرة');
                        }
                      }}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-3.5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-background active:scale-95 gap-2 sm:gap-3 font-semibold text-base sm:text-lg"
                      aria-label="عرض التقارير"
                    >
                      <FileCheck className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                      <span>عرض التقارير</span>
                    </button>
                  ) : (
                    <div className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-3.5 bg-muted dark:bg-muted/50 text-muted-foreground rounded-lg gap-2 sm:gap-3 font-semibold text-base sm:text-lg cursor-not-allowed">
                      <FileCheck className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                      <span>لا توجد تقارير متاحة</span>
                    </div>
                  )}

                  {/* Invoice Button */}
                  <button
                    onClick={() => setShowInvoiceAuth(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-3.5 bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-background active:scale-95 gap-2 sm:gap-3 font-semibold text-base sm:text-lg"
                    aria-label="عرض الفاتورة"
                  >
                    <Receipt className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                    <span>عرض الفاتورة</span>
                  </button>
                </div>
              </div>
              </SimpleCardContent>
            </SimpleCard>

            {/* Repair Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              {/* Device Information */}
              <SimpleCard className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <SimpleCardHeader className="p-4 sm:p-5 md:p-6 pb-4 border-b">
                  <SimpleCardTitle className="text-lg sm:text-xl mb-0 flex items-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-full ml-3 sm:ml-4">
                      <Package className="w-5 h-5 sm:w-6 sm:h-6 text-foreground flex-shrink-0" />
                    </div>
                    <span className="font-semibold text-foreground">معلومات الجهاز</span>
                  </SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent className="p-4 sm:p-5 md:p-6">
                <div className="space-y-4 sm:space-y-5">
                  <div className="flex items-start space-x-5 sm:space-x-6 space-x-reverse p-4 sm:p-5 rounded-lg bg-muted/30 dark:bg-muted/50 hover:bg-muted/50 dark:hover:bg-muted/70 transition-colors border border-border/50 dark:border-border/30">
                    <div className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-muted dark:bg-muted/80 rounded-full flex-shrink-0">
                      <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2">الموديل</h4>
                      <p className="text-sm sm:text-base text-foreground/90 dark:text-foreground break-words">{repairData.deviceModel || 'غير محدد'}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-5 sm:space-x-6 space-x-reverse p-4 sm:p-5 rounded-lg bg-muted/30 dark:bg-muted/50 hover:bg-muted/50 dark:hover:bg-muted/70 transition-colors border border-border/50 dark:border-border/30">
                    <div className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-muted dark:bg-muted/80 rounded-full flex-shrink-0">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2">وصف المشكلة</h4>
                      <p className="text-sm sm:text-base text-foreground/90 dark:text-foreground break-words leading-relaxed">{repairData.problemDescription || 'لا توجد تفاصيل'}</p>
                    </div>
                  </div>
                </div>
                </SimpleCardContent>
              </SimpleCard>

              {/* Repair Information */}
              <SimpleCard className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <SimpleCardHeader className="p-4 sm:p-5 md:p-6 pb-4 border-b">
                  <SimpleCardTitle className="text-lg sm:text-xl mb-0 flex items-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-full ml-3 sm:ml-4">
                      <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-foreground flex-shrink-0" />
                    </div>
                    <span className="font-semibold text-foreground">معلومات الإصلاح</span>
                  </SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent className="p-4 sm:p-5 md:p-6">
                <div className="space-y-4 sm:space-y-5">
                  <div className="flex items-start space-x-5 sm:space-x-6 space-x-reverse p-4 sm:p-5 rounded-lg bg-muted/30 dark:bg-muted/50 hover:bg-muted/50 dark:hover:bg-muted/70 transition-colors border border-border/50 dark:border-border/30">
                    <div className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-muted dark:bg-muted/80 rounded-full flex-shrink-0">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2">تاريخ الاستلام</h4>
                      <p className="text-sm sm:text-base text-foreground/90 dark:text-foreground break-words">{formatDate(repairData.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-5 sm:space-x-6 space-x-reverse p-4 sm:p-5 rounded-lg bg-muted/30 dark:bg-muted/50 hover:bg-muted/50 dark:hover:bg-muted/70 transition-colors border border-border/50 dark:border-border/30">
                    <div className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-muted dark:bg-muted/80 rounded-full flex-shrink-0">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2">التسليم المتوقع</h4>
                      <p className="text-sm sm:text-base text-foreground/90 dark:text-foreground break-words">{formatDate(repairData.estimatedCompletionDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-5 sm:space-x-6 space-x-reverse p-4 sm:p-5 rounded-lg bg-muted/30 dark:bg-muted/50 hover:bg-muted/50 dark:hover:bg-muted/70 transition-colors border border-border/50 dark:border-border/30">
                    <div className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-muted dark:bg-muted/80 rounded-full flex-shrink-0">
                      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2">التكلفة الفعلية</h4>
                      <p className="text-sm sm:text-base text-foreground/90 dark:text-foreground break-words">
                        {repairData.actualCost ? `${repairData.actualCost} ج.م` : 'غير محدد'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-5 sm:space-x-6 space-x-reverse p-4 sm:p-5 rounded-lg bg-muted/30 dark:bg-muted/50 hover:bg-muted/50 dark:hover:bg-muted/70 transition-colors border border-border/50 dark:border-border/30">
                    <div className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-muted dark:bg-muted/80 rounded-full flex-shrink-0">
                      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2">التكلفة المقدرة</h4>
                      <p className="text-sm sm:text-base text-foreground/90 dark:text-foreground break-words">
                        {repairData.estimatedCost ? `${repairData.estimatedCost} ج.م` : 'غير محدد'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-5 sm:space-x-6 space-x-reverse p-4 sm:p-5 rounded-lg bg-muted/30 dark:bg-muted/50 hover:bg-muted/50 dark:hover:bg-muted/70 transition-colors border border-border/50 dark:border-border/30">
                    <div className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-muted dark:bg-muted/80 rounded-full flex-shrink-0">
                      <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2">الفرع</h4>
                      <p className="text-sm sm:text-base text-foreground/90 dark:text-foreground break-words">{repairData.branchName || 'غير محدد'}</p>
                    </div>
                  </div>
                </div>
                </SimpleCardContent>
              </SimpleCard>
            </div>

            {/* Invoice Authentication Modal - Security Verification */}
            {showInvoiceAuth && (
              <SimpleCard className="mt-4 sm:mt-6 md:mt-8 border-2 border-green-200 dark:border-green-800 shadow-xl">
                <SimpleCardHeader className="p-4 sm:p-5 md:p-6 pb-4 border-b bg-gradient-to-l from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
                  <SimpleCardTitle className="text-lg sm:text-xl mb-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-green-100 dark:bg-green-900/40 rounded-full">
                        <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-green-600 dark:text-green-400 flex-shrink-0" />
                      </div>
                      <div>
                        <span className="font-bold text-foreground block">التحقق من الهوية</span>
                        <span className="text-xs sm:text-sm text-muted-foreground">لحماية بياناتك الحساسة</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowInvoiceAuth(false);
                        setInvoicePhone('');
                        setInvoiceError('');
                      }}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      aria-label="إغلاق"
                    >
                      <X className="w-5 h-5 text-foreground" />
                    </button>
                  </SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent className="p-4 sm:p-5 md:p-6">
                  <div className="space-y-5">
                    {/* Security Notice */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                            حماية البيانات الحساسة
                          </p>
                          <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                            يرجى إدخال <strong>رقم الهاتف المسجل في النظام</strong> للتحقق من هويتك قبل عرض الفاتورة. 
                            هذه الخطوة ضرورية لحماية معلوماتك الشخصية والمالية.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Phone Input */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        رقم الهاتف المسجل في النظام
                      </label>
                      <Input
                        type="tel"
                        value={invoicePhone}
                        onChange={(e) => {
                          setInvoicePhone(e.target.value);
                          setInvoiceError('');
                        }}
                        placeholder="مثال: 01012345678"
                        className="w-full text-lg py-3"
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && invoicePhone.trim() && !invoiceLoading) {
                            handleInvoiceAuth();
                          }
                        }}
                      />
                      {invoiceError && (
                        <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-sm text-red-800 dark:text-red-300 flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            {invoiceError}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                      <SimpleButton
                        onClick={handleInvoiceAuth}
                        disabled={invoiceLoading || !invoicePhone.trim()}
                        className="flex-1 bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600 text-white py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                      >
                        {invoiceLoading ? (
                          <>
                            <RefreshCw className="w-5 h-5 ml-2 animate-spin" />
                            جاري التحقق من الهوية...
                          </>
                        ) : (
                          <>
                            <Lock className="w-5 h-5 ml-2" />
                            التحقق وعرض الفاتورة
                          </>
                        )}
                      </SimpleButton>
                      <SimpleButton
                        onClick={() => {
                          setShowInvoiceAuth(false);
                          setInvoicePhone('');
                          setInvoiceError('');
                        }}
                        variant="ghost"
                        className="sm:w-auto py-3"
                      >
                        إلغاء
                      </SimpleButton>
                    </div>
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default PublicRepairTrackingPage;
