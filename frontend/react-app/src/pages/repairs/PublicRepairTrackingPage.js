
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
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
  Cpu,
  HardDrive,
  Database,
  Hash,
  Layers,
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
  Moon,
  ShoppingBag
} from 'lucide-react';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import { Input } from '../../components/ui/Input';
import { Loading } from '../../components/ui/Loading';
import { getDefaultApiBaseUrl } from '../../lib/apiConfig';
import { useRepairUpdatesById } from '../../hooks/useWebSocket';
import { ZoomIn, Receipt, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';

const API_BASE_URL = getDefaultApiBaseUrl();

const PublicRepairTrackingPage = () => {
  const notifications = useNotifications();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { id: urlId } = useParams(); // دعم URL parameter مثل /track/:id
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
  const [inspectionReports, setInspectionReports] = useState([]);
  const [inspectionReportsLoading, setInspectionReportsLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [showInvoiceAuth, setShowInvoiceAuth] = useState(false);
  const [invoicePhone, setInvoicePhone] = useState('');
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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

  // قراءة trackingToken أو ID من URL query parameters أو URL parameter عند تحميل الصفحة
  useEffect(() => {
    // أولوية لـ URL parameter (مثل /track/123)
    if (urlId) {
      handleAutoSearch(urlId, 'trackingToken');
      return;
    }

    // ثم query parameter (مثل /track?trackingToken=xxx)
    const tokenFromUrl = searchParams.get('trackingToken');
    if (tokenFromUrl) {
      handleAutoSearch(tokenFromUrl, 'trackingToken');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, urlId]);

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

  // Load inspection reports
  const loadInspectionReports = async () => {
    if (!repairData?.id) {
      console.log('[Reports] No repair ID available');
      setHasReports(false);
      setInspectionReports([]);
      return;
    }

    const repairId = repairData.id;
    console.log('[Reports] Loading reports for repair ID:', repairId);

    try {
      setInspectionReportsLoading(true);
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

        setInspectionReports(reportsList);
        setHasReports(reportsList.length > 0);
      } else if (response.status === 404) {
        // No reports found - this is normal, not an error
        console.log('[Reports] No reports found (404)');
        setInspectionReports([]);
        setHasReports(false);
      } else {
        // Other error - log but don't show error to user
        const errorData = await response.json().catch(() => ({}));
        console.warn('[Reports] Error loading reports:', response.status, errorData);
        setInspectionReports([]);
        setHasReports(false);
      }
    } catch (error) {
      // Network error or other exception
      console.error('[Reports] Exception loading reports:', error);
      setInspectionReports([]);
      setHasReports(false);
    } finally {
      setInspectionReportsLoading(false);
    }
  };

  // Keep the old function name for backward compatibility
  const loadReports = loadInspectionReports;

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

  // Lightbox Handlers
  const openLightbox = (index) => {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'unset';
  };

  const nextImage = (e) => {
    e.stopPropagation();
    if (repairData?.attachments?.length) {
      setSelectedImageIndex((prev) => (prev + 1) % repairData.attachments.length);
    }
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (repairData?.attachments?.length) {
      setSelectedImageIndex((prev) => (prev - 1 + repairData.attachments.length) % repairData.attachments.length);
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage(e);
      if (e.key === 'ArrowLeft') prevImage(e);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, repairData?.attachments]);

  // Handle invoice authentication and open print page
  const handleInvoiceAuth = async () => {
    if (!invoicePhone.trim()) {
      setInvoiceError('يرجى إدخال آخر 4 أرقام من الهاتف');
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
          // Navigate to the new public invoice page using the trackingToken
          const trackingToken = result.data.trackingToken;
          if (trackingToken) {
            navigate(`/invoice/view/${trackingToken}`);
          } else {
            // Fallback to print if token is missing
            const invoiceId = result.data.id;
            const printUrl = `${API_BASE_URL}/invoices/public/${invoiceId}/print?phoneNumber=${encodeURIComponent(invoicePhone)}&repairRequestId=${repairData.id}`;
            window.open(printUrl, '_blank');
          }

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
          setInvoiceError(errorData.error || 'رقم الهاتف غير صحيح');
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

  // Animation state
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className={`min-h-screen bg-muted/30 dark:bg-background transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-md border-b border-border shadow-sm sticky top-0 z-10 transition-all duration-300">
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
                src="/Fav.png"
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
        <SimpleCard className="mb-6 sm:mb-8 border-none bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>

          <SimpleCardContent className="p-6 sm:p-8 md:p-10 relative z-10">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 drop-shadow-md">
                {repairData?.customerName ? (
                  <>
                    <span className="opacity-90 font-light">اهلاً</span> <span className="text-white">{repairData.customerName}</span>
                  </>
                ) : (
                  'تتبع طلب الإصلاح'
                )}
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-blue-50/90 max-w-2xl mx-auto leading-relaxed">
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
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Status Progress */}
            <SimpleCard className="border border-border/50 dark:border-border/20 shadow-xl shadow-blue-500/5 bg-background/50 backdrop-blur-sm overflow-hidden">
              <SimpleCardContent className="p-6 sm:p-8 md:p-10">
                <div className="text-center mb-8 sm:mb-10">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3">حالة الطلب</h2>
                  <p className="text-sm sm:text-base text-muted-foreground bg-muted/50 inline-block px-5 py-1.5 rounded-full border border-border/30">
                    تم إنشاء الطلب في {formatDate(repairData.createdAt)}
                  </p>
                </div>

                {/* Progress Bar Container */}
                <div className="mb-10 sm:mb-14 relative px-2 sm:px-4">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-sm font-medium text-muted-foreground">التقدم المحرز</span>
                    <span className="font-black text-3xl sm:text-4xl text-blue-600 dark:text-blue-400 drop-shadow-sm tracking-tighter">
                      {Math.round(getStatusProgress(repairData.status))}%
                      <span className="text-sm sm:text-base font-normal text-muted-foreground mr-2 opacity-70">مكتمل</span>
                    </span>
                  </div>
                  <div className="relative w-full bg-muted/50 dark:bg-muted/20 rounded-full h-4 sm:h-6 shadow-inner overflow-hidden border border-border/20">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out relative shadow-lg"
                      style={{
                        width: `${getStatusProgress(repairData.status)}%`,
                        background: 'linear-gradient(90deg, #3b82f6, #6366f1, #10b981)'
                      }}
                    >
                      {/* Pulsing light effect on the progress tip */}
                      <div className="absolute right-0 top-0 h-full w-4 bg-white/30 blur-sm animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Status Display Block */}
                <div className="flex flex-col items-center">
                  {(() => {
                    const statusKey = repairData.status || 'RECEIVED';
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
                      <div className="w-full max-w-lg mx-auto">
                        <div className={`flex items-center justify-between p-4 sm:p-6 rounded-2xl ${config.color} border border-current/10 shadow-lg mb-4`}>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-background/30 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm">
                              <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                            </div>
                            <div>
                              <span className="text-xs sm:text-sm font-bold opacity-70 uppercase tracking-widest block mb-0.5">الحالة الحالية</span>
                              <span className="text-xl sm:text-2xl font-black">{repairData.statusLabel || config.label}</span>
                            </div>
                          </div>
                          <CheckCircle className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-center text-sm sm:text-base text-muted-foreground leading-relaxed px-4">
                          {config.description}
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* Quick Actions - Reports & Invoice Buttons */}
                <div className="mt-10 sm:mt-12 pt-8 sm:pt-10 border-t border-border/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {/* Reports Button */}
                    <button
                      onClick={() => {
                        const token = searchParams.get('trackingToken');
                        const id = repairData?.id;
                        if (id) {
                          navigate(token ? `/track/reports?repairId=${id}&trackingToken=${encodeURIComponent(token)}` : `/track/reports?repairId=${id}`);
                        } else if (token) {
                          navigate(`/track/reports?trackingToken=${encodeURIComponent(token)}`);
                        } else {
                          notify('error', 'لا يمكن عرض التقارير: بيانات الطلب غير متوفرة');
                        }
                      }}
                      disabled={!hasReports && (!repairData.attachments || repairData.attachments.length === 0)}
                      className={`group relative flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 overflow-hidden ${hasReports || (repairData.attachments && repairData.attachments.length > 0)
                        ? 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400 text-white'
                        : 'bg-muted dark:bg-muted/50 text-muted-foreground cursor-not-allowed'
                        }`}
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                      <FileCheck className={`w-6 h-6 relative z-10 ${hasReports ? 'animate-bounce-slow' : ''}`} />
                      <span className="relative z-10">
                        {hasReports || (repairData.attachments && repairData.attachments.length > 0)
                          ? 'عرض التقارير والمرفقات'
                          : 'لا توجد تقارير حالياً'}
                      </span>

                      {/* Notification Badge */}
                      {(hasReports || (repairData.attachments && repairData.attachments.length > 0)) && (
                        <span className="absolute top-2 left-2 w-6 h-6 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full shadow-md animate-bounce z-20 border-2 border-white/20">
                          {(inspectionReports.length || 0) + (repairData.attachments?.length || 0)}
                        </span>
                      )}
                    </button>

                    {/* Invoice Button */}
                    <button
                      onClick={() => setShowInvoiceAuth(true)}
                      className="group relative flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-lg bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 text-white transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95"
                    >
                      <Receipt className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                      <span>عرض وتحميل الفاتورة</span>
                    </button>
                  </div>
                </div>
              </SimpleCardContent>
            </SimpleCard>



            {/* Repair Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              {/* Device Information */}
              <SimpleCard className="border border-border/50 dark:border-border/20 shadow-lg bg-background/50 backdrop-blur-sm group hover:border-blue-500/30 transition-all duration-300">
                <SimpleCardHeader className="p-6 pb-4 border-b border-border/30">
                  <SimpleCardTitle className="text-xl font-bold flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span>معلومات الجهاز</span>
                  </SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent className="p-6">
                  <div className="space-y-4">
                    {/* Model & Header */}
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/20 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Monitor className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-bold text-muted-foreground uppercase">الموديل</span>
                        </div>
                        {repairData.serialNumber && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border border-border/50 text-[10px] text-muted-foreground font-mono">
                            <Hash className="w-3 h-3" />
                            <span>{repairData.serialNumber}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-lg font-semibold text-foreground break-words">{repairData.deviceModel || 'غير محدد'}</p>
                    </div>

                    {/* Specs Grid */}
                    {(repairData.cpu || repairData.ram || repairData.storage) && (
                      <div className="grid grid-cols-3 gap-2">
                        {repairData.cpu && (
                          <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20 text-center">
                            <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400 mx-auto mb-1.5" />
                            <span className="text-[10px] text-muted-foreground block mb-0.5">المعالج</span>
                            <p className="text-xs font-bold text-foreground truncate" title={repairData.cpu}>{repairData.cpu}</p>
                          </div>
                        )}
                        {repairData.ram && (
                          <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/20 text-center">
                            <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400 mx-auto mb-1.5" />
                            <span className="text-[10px] text-muted-foreground block mb-0.5">الرام</span>
                            <p className="text-xs font-bold text-foreground truncate" title={repairData.ram}>{repairData.ram}</p>
                          </div>
                        )}
                        {repairData.storage && (
                          <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/20 text-center">
                            <HardDrive className="w-4 h-4 text-amber-600 dark:text-amber-400 mx-auto mb-1.5" />
                            <span className="text-[10px] text-muted-foreground block mb-0.5">التخزين</span>
                            <p className="text-xs font-bold text-foreground truncate" title={repairData.storage}>{repairData.storage}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Accessories */}
                    {repairData.accessories && repairData.accessories.length > 0 && (
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/20 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-bold text-muted-foreground uppercase">الملحقات المستلمة</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {repairData.accessories.map((acc, index) => (
                            <span key={index} className="px-2.5 py-1 rounded-full bg-background border border-border text-xs font-medium text-foreground">
                              {acc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-4 rounded-xl bg-muted/30 border border-border/20 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-muted-foreground uppercase">وصف المشكلة</span>
                      </div>
                      <p className="text-base text-foreground/90 break-words leading-relaxed">{repairData.problemDescription || 'لا توجد تفاصيل إضافية'}</p>
                    </div>
                  </div>
                </SimpleCardContent>
              </SimpleCard>



              {/* Repair Progress & Costs */}
              <SimpleCard className="border border-border/50 dark:border-border/20 shadow-lg bg-background/50 backdrop-blur-sm group hover:border-emerald-500/30 transition-all duration-300">
                <SimpleCardHeader className="p-6 pb-4 border-b border-border/30">
                  <SimpleCardTitle className="text-xl font-bold flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Wrench className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span>تفاصيل الإصلاح</span>
                  </SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent className="p-6">
                  {/* Accessories Section */}
                  {repairData.accessories && repairData.accessories.length > 0 && (
                    <div className="mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-3">
                        <ShoppingBag className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">المتعلقات المستلمة</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {repairData.accessories.map((acc, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm"
                          >
                            {acc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/20">
                      <Calendar className="w-4 h-4 text-emerald-600 mb-2" />
                      <span className="text-xs font-bold text-muted-foreground block mb-1">تاريخ الاستلام</span>
                      <p className="text-sm font-semibold">{formatDate(repairData.createdAt)}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/30 border border-border/20">
                      <Clock className="w-4 h-4 text-emerald-600 mb-2" />
                      <span className="text-xs font-bold text-muted-foreground block mb-1">التسليم المتوقع</span>
                      <p className="text-sm font-semibold">{formatDate(repairData.estimatedCompletionDate)}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 sm:col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">التكلفة</span>
                        </div>
                        {repairData.actualCost && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">
                            نهائية
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {/* Actual Cost (if exists) */}
                        {repairData.actualCost ? (
                          <div className="flex items-baseline justify-between">
                            <div>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-500 block mb-0.5">التكلفة النهائية</span>
                              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                                {Math.floor(parseFloat(repairData.actualCost))} ج.م
                              </p>
                            </div>
                            {repairData.amountPaid > 0 && (
                              <div className="text-right">
                                <span className="text-[10px] text-muted-foreground block">المدفوع</span>
                                <span className="text-sm font-bold text-emerald-600">{Math.floor(parseFloat(repairData.amountPaid))} ج.م</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Estimated Cost (if no actual cost) */
                          <div>
                            <span className="text-[10px] text-yellow-600 dark:text-yellow-500 block mb-0.5">التكلفة التقديرية</span>
                            <p className="text-2xl font-black text-yellow-700 dark:text-yellow-400">
                              {repairData.estimatedCostMin && repairData.estimatedCostMax && parseFloat(repairData.estimatedCostMin) !== parseFloat(repairData.estimatedCostMax)
                                ? `${Math.floor(parseFloat(repairData.estimatedCostMin))} - ${Math.floor(parseFloat(repairData.estimatedCostMax))} ج.م`
                                : (repairData.estimatedCost && parseFloat(repairData.estimatedCost) > 0
                                  ? `${Math.floor(parseFloat(repairData.estimatedCost))} ج.م`
                                  : 'قيد التقدير')}
                            </p>
                          </div>
                        )}

                        {/* Show estimated cost as reference if actual cost exists */}
                        {/* Show estimated cost as reference if actual cost exists */}
                        {repairData.actualCost && (
                          (repairData.estimatedCostMin && repairData.estimatedCostMax && parseFloat(repairData.estimatedCostMin) !== parseFloat(repairData.estimatedCostMax)) ||
                          (repairData.estimatedCost && parseFloat(repairData.estimatedCost) > 0)
                        ) && (
                            <div className="pt-2 border-t border-emerald-200/30">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">التكلفة التقديرية الأولية:</span>
                                <span className="font-semibold text-foreground">
                                  {repairData.estimatedCostMin && repairData.estimatedCostMax && parseFloat(repairData.estimatedCostMin) !== parseFloat(repairData.estimatedCostMax)
                                    ? `${Math.floor(parseFloat(repairData.estimatedCostMin))} - ${Math.floor(parseFloat(repairData.estimatedCostMax))} ج.م`
                                    : `${Math.floor(parseFloat(repairData.estimatedCost))} ج.م`
                                  }
                                </span>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/30 border border-border/20 sm:col-span-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mb-2" />
                      <span className="text-xs font-bold text-muted-foreground block mb-1">الفرع</span>
                      <p className="text-sm font-semibold">{repairData.branchName || 'غير محدد'}</p>
                    </div>
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            </div>

            {/* Invoice Authentication Modal - Security Verification Pop-up */}
            {showInvoiceAuth && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowInvoiceAuth(false);
                    setInvoicePhone('');
                    setInvoiceError('');
                  }
                }}
              >
                <SimpleCard className="w-full max-w-xl border-2 border-green-200 dark:border-green-800 shadow-[0_0_50px_-12px_rgba(34,197,94,0.3)] relative overflow-hidden bg-background animate-in zoom-in-95 duration-300 slide-in-from-bottom-5">
                  {/* Decorative background element */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                  <SimpleCardHeader className="p-6 pb-4 border-b bg-gradient-to-l from-green-50/50 to-blue-50/50 dark:from-green-900/10 dark:to-blue-900/10">
                    <SimpleCardTitle className="text-xl mb-0 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-green-600 dark:bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
                          <Lock className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <span className="font-extrabold text-foreground text-xl block">تحقق أمني مطلوب</span>
                          <span className="text-sm text-muted-foreground font-medium">الرجاء تأكيد هويتك للعرض</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowInvoiceAuth(false);
                          setInvoicePhone('');
                          setInvoiceError('');
                        }}
                        className="p-2 sm:p-3 hover:bg-muted rounded-xl transition-all duration-200 hover:rotate-90"
                        aria-label="إغلاق"
                      >
                        <X className="w-6 h-6 text-foreground" />
                      </button>
                    </SimpleCardTitle>
                  </SimpleCardHeader>
                  <SimpleCardContent className="p-6 sm:p-8">
                    <div className="max-w-md mx-auto space-y-6">
                      {/* Security Notice */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200/50 dark:border-blue-800/30 rounded-2xl p-5 flex items-start gap-4">
                        <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400 shrink-0" />
                        <div>
                          <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-1">خصوصيتك أولويتنا</h4>
                          <p className="text-sm text-blue-800/70 dark:text-blue-400/70 leading-relaxed font-medium">
                            لضمان عدم اطلاع أي شخص غير مخول على فواتيرك، نطلب منك إدخال آخر 4 أرقام من رقم الهاتف المسجل لدينا.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="relative group">
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600">
                            <Phone className="h-6 w-6" />
                          </div>
                          <input
                            type="tel"
                            maxLength={4}
                            placeholder="أدخل آخر 4 أرقام من رقم الهاتف"
                            className={`w-full pr-12 pl-4 py-4 rounded-xl border-2 bg-background font-bold text-center text-lg transition-all duration-300 focus:outline-none focus:ring-4 ${invoiceError
                              ? 'border-red-500 ring-red-500/10'
                              : 'border-border focus:border-blue-600 focus:ring-blue-600/10 hover:border-blue-300'
                              }`}
                            value={invoicePhone}
                            onChange={(e) => {
                              setInvoicePhone(e.target.value);
                              setInvoiceError('');
                            }}
                            onKeyPress={(e) => e.key === 'Enter' && handleInvoiceAuth()}
                            dir="ltr"
                          />
                        </div>

                        {invoiceError && (
                          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-bold bg-red-50 dark:bg-red-900/20 px-4 py-2.5 rounded-lg animate-shake">
                            <AlertCircle className="h-4 w-4" />
                            <span>{invoiceError}</span>
                          </div>
                        )}

                        <button
                          onClick={handleInvoiceAuth}
                          disabled={invoiceLoading || !invoicePhone}
                          className={`w-full py-4 rounded-xl font-black text-lg transition-all duration-300 shadow-xl active:scale-95 flex items-center justify-center gap-3 ${invoiceLoading || !invoicePhone
                            ? 'bg-muted text-muted-foreground cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-green-500/20'
                            }`}
                        >
                          {invoiceLoading ? (
                            <>
                              <Loading size="sm" />
                              <span>جاري التحقق...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-6 h-6" />
                              <span>تأكيد وعرض الفاتورة</span>
                            </>
                          )}
                        </button>

                        <p className="text-center text-xs text-muted-foreground font-medium">
                          في حال واجهت مشكلة، يرجى التواصل مع الدعم الفني للفرع.
                        </p>
                      </div>
                    </div>
                  </SimpleCardContent>
                </SimpleCard>
              </div>
            )}
            {/* Lightbox Modal */}
            {lightboxOpen && repairData?.attachments && (
              <div
                className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300"
                onClick={(e) => e.target === e.currentTarget && closeLightbox()}
              >
                {/* Lightbox Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 text-white bg-gradient-to-b from-black/50 to-transparent">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium opacity-80">
                      {selectedImageIndex + 1} / {repairData.attachments.length}
                    </span>
                    <h3 className="text-lg font-bold">
                      {repairData.attachments[selectedImageIndex]?.title || 'معرض الصور'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={repairData.attachments[selectedImageIndex]?.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      title="تحميل الصورة"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                    <button
                      onClick={closeLightbox}
                      className="p-3 rounded-full bg-white/10 hover:bg-red-500/80 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Main Image Area */}
                <div className="flex-1 flex items-center justify-center relative p-4 overflow-hidden">
                  <button
                    onClick={prevImage}
                    className="absolute left-4 p-4 rounded-full bg-black/50 hover:bg-white/20 text-white transition-all hover:scale-110 z-10"
                  >
                    <div className="rotate-180">➜</div> {/* Simple arrow or use Lucide ArrowRight rotated */}
                  </button>

                  <img
                    src={repairData.attachments[selectedImageIndex]?.url}
                    alt={repairData.attachments[selectedImageIndex]?.title || 'Full view'}
                    className="max-h-full max-w-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300 select-none"
                    onClick={(e) => e.stopPropagation()}
                  />

                  <button
                    onClick={nextImage}
                    className="absolute right-4 p-4 rounded-full bg-black/50 hover:bg-white/20 text-white transition-all hover:scale-110 z-10"
                  >
                    <div>➜</div>
                  </button>
                </div>

                {/* Lightbox Footer (thumbnails) */}
                <div className="p-4 bg-black/80 overflow-x-auto">
                  <div className="flex justify-center gap-2 min-w-max px-4">
                    {repairData.attachments.map((att, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(idx); }}
                        className={`relative w-16 h-16 rounded-lg overflow-hidden transition-all duration-300 ${idx === selectedImageIndex ? 'ring-2 ring-blue-500 scale-110 z-10' : 'opacity-50 hover:opacity-100 hover:scale-105'
                          }`}
                      >
                        <img
                          src={att.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Adding custom keyframes using a style tag */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shine {
          animation: shine 2.5s infinite linear;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out 0s 2;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}} />
    </div>
  );
};

export default PublicRepairTrackingPage;
