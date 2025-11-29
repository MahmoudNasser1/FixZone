import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import apiService from '../../services/api';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleBadge from '../../components/ui/SimpleBadge';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { useRepairUpdates, useWebSocketStatus } from '../../hooks/useWebSocket';
import {
  Search, Plus, Download, Eye, Edit, Trash2, Calendar,
  Wrench, Clock, CheckCircle, Play, XCircle, RefreshCw, User, DollarSign, Filter,
  ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Check, AlertTriangle, Printer,
  Wifi, WifiOff, Package, ShoppingCart
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import Breadcrumb from '../../components/layout/Breadcrumb';
import QuickStatsCard from '../../components/ui/QuickStatsCard';
import { Input } from '../../components/ui/Input';
import DataView from '../../components/ui/DataView';
import { getDefaultApiBaseUrl } from '../../lib/apiConfig';

// Helper function to open print pages with authentication
const handlePrintRepair = (repairId, type = 'invoice') => {
  if (!repairId) {
    console.error('Repair ID is missing');
    alert('خطأ: رقم الطلب غير موجود');
    return;
  }

  const API_BASE_URL = getDefaultApiBaseUrl();
  const printUrl = `${API_BASE_URL}/repairs/${repairId}/print/${type}`;

  // Open print page in new window
  // Authentication will be handled via cookies from the main window
  const printWindow = window.open(printUrl, '_blank', 'width=800,height=600');

  if (!printWindow) {
    console.error('Failed to open print window. Popup blocked?');
    alert('فشل فتح نافذة الطباعة. يرجى التحقق من إعدادات منع النوافذ المنبثقة.');
    return;
  }

  // Focus the print window
  printWindow.focus();
};

const RepairsPage = () => {
  const navigate = useNavigate();
  const { formatMoney } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const notifications = useNotifications();

  // WebSocket status
  const { status: wsStatus } = useWebSocketStatus();

  // Real-time repair updates
  useRepairUpdates((message) => {
    console.log('Real-time repair update received:', message);

    switch (message.updateType) {
      case 'created':
        // إضافة طلب إصلاح جديد إلى القائمة
        setRepairs(prev => [message.data, ...prev]);
        notifications.success(`تم إنشاء طلب إصلاح جديد: ${message.data.requestNumber}`);
        break;

      case 'updated':
        // تحديث طلب إصلاح موجود
        setRepairs(prev => prev.map(repair =>
          repair.id === message.data.id ? { ...repair, ...message.data } : repair
        ));
        notifications.info(`تم تحديث طلب الإصلاح: ${message.data.requestNumber}`);
        break;

      case 'deleted':
        // حذف طلب إصلاح من القائمة
        setRepairs(prev => prev.filter(repair => repair.id !== message.data.id));
        notifications.warning(`تم حذف طلب الإصلاح: ${message.data.requestNumber}`);
        break;
    }
  });

  // State للبيانات والتحميل
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State للبحث والفلترة
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'pending');
  
  // State لفلتر نوع البحث - الافتراضي: الاسم أو رقم الموبايل
  const [searchField, setSearchField] = useState(() => {
    const saved = localStorage.getItem('repairs_search_field');
    return saved || 'nameOrPhone'; // الافتراضي: الاسم أو رقم الموبايل
  });

  // State للترقيم والفرز
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [pageSize, setPageSize] = useState(Number(searchParams.get('limit')) || 10);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState((searchParams.get('sortOrder') || 'desc').toLowerCase());

  // Advanced Filters State
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [technicianId, setTechnicianId] = useState(searchParams.get('technicianId') || '');
  const [priority, setPriority] = useState(searchParams.get('priority') || '');
  const [technicians, setTechnicians] = useState([]);

  // Fetch technicians for filter
  useEffect(() => {
    const loadTechnicians = async () => {
      try {
        const res = await apiService.listTechnicians();
        if (res.success) setTechnicians(res.data || []);
      } catch (e) {
        console.error('Failed to load technicians', e);
      }
    };
    loadTechnicians();
  }, []);

  // State للواجهة
  const [globalStats, setGlobalStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    inProgressRequests: 0,
    waitingPartsRequests: 0,
    readyForPickupRequests: 0,
    completedRequests: 0,
    onHoldRequests: 0
  });

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const response = await apiService.getDashboardStats();
        if (response.success && response.data) {
          const { requestsByStatus, totalRequests } = response.data;

          // Helper to safely get count by status (case-insensitive)
          const getCount = (statusKey) => {
            const found = requestsByStatus.find(item =>
              item.status.toLowerCase() === statusKey.toLowerCase()
            );
            return found ? found.count : 0;
          };

          setGlobalStats({
            totalRequests: totalRequests,
            pendingRequests: getCount('pending') + getCount('received'),
            inProgressRequests: getCount('in_progress') + getCount('under_repair'),
            waitingPartsRequests: getCount('waiting_parts') + getCount('waiting-parts'),
            readyForPickupRequests: getCount('ready_for_pickup') + getCount('ready-for-pickup'),
            completedRequests: getCount('completed') + getCount('delivered'),
            onHoldRequests: getCount('on_hold') + getCount('on-hold')
          });
        }
      } catch (error) {
        console.error('Error fetching global stats:', error);
      }
    };

    fetchGlobalStats();
  }, [repairs]);

  // Reset filters
  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setTechnicianId('');
    setPriority('');
    setPage(1);
    // لا نعيد تعيين searchField - يبقى كما اختاره المستخدم
  };
  
  // حفظ searchField في localStorage عند التغيير
  useEffect(() => {
    localStorage.setItem('repairs_search_field', searchField);
  }, [searchField]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef(null);
  const sortMenuPanelRef = useRef(null);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const statusMenuRef = useRef(null);
  const statusMenuPanelRef = useRef(null);
  const [highlightedStatusIndex, setHighlightedStatusIndex] = useState(0);
  // Ref لتخزين timeout البحث
  const searchTimeoutRef = useRef(null);

  const statusOptions = [
    { key: 'all', label: 'الكل' },
    { key: 'pending', label: 'في الانتظار' },
    { key: 'in-progress', label: 'قيد الإصلاح' },
    { key: 'waiting-parts', label: 'بانتظار قطع غيار' },
    { key: 'ready-for-pickup', label: 'جاهز للاستلام' },
    { key: 'completed', label: 'مكتمل' },
    { key: 'on-hold', label: 'معلق' },
  ];

  // خيارات نوع البحث (فلتر البحث)
  const searchFieldOptions = [
    { key: 'nameOrPhone', label: 'الاسم أو رقم الموبايل', fields: ['customerName', 'customerPhone'] },
    { key: 'customerName', label: ' اسم العميل', fields: ['customerName'] },
    { key: 'customerPhone', label: 'رقم الموبايل', fields: ['customerPhone'] },
    { key: 'requestNumber', label: 'رقم طلب الإصلاح', fields: ['requestNumber'] },
    { key: 'problemDescription', label: 'وصف المشكلة', fields: ['problemDescription'] },
    { key: 'deviceType', label: 'نوع الجهاز', fields: ['deviceType'] },
    { key: 'deviceBrand', label: 'الماركة', fields: ['deviceBrand'] },
    { key: 'deviceModel', label: 'الموديل', fields: ['deviceModel'] },
    { key: 'all', label: 'جميع الحقول', fields: ['customerName', 'customerPhone', 'requestNumber', 'problemDescription', 'deviceType', 'deviceBrand', 'deviceModel'] },
  ];

  const sortFields = [
    { key: 'createdAt', label: 'تاريخ الإنشاء' },
    { key: 'updatedAt', label: 'تاريخ التحديث' },
    { key: 'priority', label: 'الأولوية' },
    { key: 'status', label: 'الحالة' },
    { key: 'estimatedCost', label: 'التكلفة' },
    { key: 'customerName', label: 'العميل' },
  ];

  // تهيئة page/pageSize من URL مرة واحدة
  useEffect(() => {
    const p = parseInt(searchParams.get('page') || '1', 10);
    const ps = parseInt(searchParams.get('limit') || '10', 10);
    setPage(Number.isFinite(p) && p > 0 ? p : 1);
    setPageSize([5, 10, 20, 50, 100].includes(ps) ? ps : 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // تهيئة البحث من URL (?q=)
  useEffect(() => {
    const q = searchParams.get('q');
    if (q != null) setSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // تهيئة الفرز من URL (?sort=&order=)
  useEffect(() => {
    const s = searchParams.get('sort');
    const o = searchParams.get('order');
    if (s && sortFields.some(f => f.key === s)) setSortBy(s);
    if (o && (o === 'asc' || o === 'desc')) setSortOrder(o);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // مزامنة page/pageSize مع URL
  useEffect(() => {
    // لا نحدث URL أثناء الكتابة
    if (isTypingRef.current) {
      return;
    }
    const next = new URLSearchParams(searchParams);
    if (page && page !== 1) next.set('page', String(page)); else next.delete('page');
    if (pageSize && pageSize !== 10) next.set('pageSize', String(pageSize)); else next.delete('pageSize');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  // تهيئة فلتر الحالة من URL أو localStorage
  useEffect(() => {
    const urlStatus = searchParams.get('status');
    const lsStatus = localStorage.getItem('repairs_status_filter');
    const initial = urlStatus || lsStatus || 'pending';
    const valid = statusOptions.some(o => o.key === initial) ? initial : 'pending';
    setStatus(valid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // مزامنة فلتر الحالة مع URL و localStorage
  useEffect(() => {
    const current = searchParams.get('status');
    if (status && status !== current) {
      const next = new URLSearchParams(searchParams);
      if (status === 'all') next.delete('status'); else next.set('status', status);
      setSearchParams(next, { replace: true });
    }
    localStorage.setItem('repairs_status_filter', status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // handleSearchChange - مثل NewRepairPageEnhanced (بحث محلي تماماً - بدون reload)
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('q') || '');
  const isTypingRef = useRef(false);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value); // تحديث البحث محلياً فوراً

    // إلغاء timeout السابق
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    const trimmedValue = (value || '').trim();

    // إذا كان البحث فارغاً، تحديث debouncedSearch فوراً بدون debounce
    // هذا يسمح بجلب جميع الطلبات فوراً عند مسح البحث
    if (!trimmedValue) {
      isTypingRef.current = false;
      setDebouncedSearch('');
      return;
    }

    // تحديد أننا في حالة كتابة - يمنع fetchRepairs أثناء الكتابة
    isTypingRef.current = true;

    // تحديث debouncedSearch بعد debounce - زيادة الوقت إلى 1000 لإعطاء المستخدم وقت كافي لإكمال الكتابة
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(trimmedValue);
      // انهاء حالة الكتابة بعد تحديث debouncedSearch مباشرة
      isTypingRef.current = false;
      searchTimeoutRef.current = null;
    }, 1000);
  };

  // تنظيف timeout عند unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // مزامنة الفرز مع URL
  useEffect(() => {
    const currentSort = searchParams.get('sort') || '';
    const currentOrder = searchParams.get('order') || '';
    const next = new URLSearchParams(searchParams);
    if ((sortBy || '') !== currentSort) {
      if (!sortBy || sortBy === 'createdAt') next.delete('sort'); else next.set('sort', sortBy);
    }
    if ((sortOrder || 'desc') !== (currentOrder || 'desc')) {
      if (!sortOrder || sortOrder === 'desc') next.delete('order'); else next.set('order', sortOrder);
    }
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortOrder]);

  // إغلاق قائمة الحالة عند النقر خارجها أو الضغط على Escape
  useEffect(() => {
    if (!showStatusFilter) return;
    const onDown = (e) => {
      if (e.key === 'Escape') setShowStatusFilter(false);
    };
    const onClick = (e) => {
      if (!statusMenuRef.current) return;
      if (!statusMenuRef.current.contains(e.target)) setShowStatusFilter(false);
    };
    document.addEventListener('keydown', onDown);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onDown);
      document.removeEventListener('mousedown', onClick);
    };
  }, [showStatusFilter]);

  // إغلاق قائمة الفرز عند النقر خارجها أو الضغط على Escape
  useEffect(() => {
    if (!showSortMenu) return;
    const onDown = (e) => {
      if (e.key === 'Escape') setShowSortMenu(false);
    };
    const onClick = (e) => {
      if (!sortMenuRef.current) return;
      if (!sortMenuRef.current.contains(e.target)) setShowSortMenu(false);
    };
    document.addEventListener('keydown', onDown);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onDown);
      document.removeEventListener('mousedown', onClick);
    };
  }, [showSortMenu]);

  // إغلاق قائمة الحالة عند تغيير الروت
  useEffect(() => {
    setShowStatusFilter(false);
  }, [location.pathname, location.search]);

  const [customerFilter, setCustomerFilter] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [serverTotal, setServerTotal] = useState(null); // يدعم total القادم من الخادم

  // مساعد للإشعارات مع تقليل الإزعاج
  const notify = (() => {
    let last = { msg: null, ts: 0 };
    return (type, message, { dedupeMs = 1500, options = {} } = {}) => {
      const now = Date.now();
      if (message === last.msg && now - last.ts < dedupeMs) return;
      const fn = notifications?.[type];
      if (typeof fn === 'function') {
        fn(message, options);
      } else if (typeof notifications?.addNotification === 'function') {
        notifications.addNotification({ type, message, ...options });
      }
      last = { msg: message, ts: now };
    };
  })();

  // معالجة URL parameters
  useEffect(() => {
    const customerId = searchParams.get('customerId');
    if (customerId) {
      setCustomerFilter(customerId);
      // جلب اسم العميل لعرضه في الفلتر
      fetchCustomerName(customerId);
    }
  }, [searchParams]);

  const fetchCustomerName = async (customerId) => {
    try {
      const customer = await apiService.getCustomer(customerId);
      setCustomerName(customer.name);
    } catch (err) {
      console.error('Error fetching customer name:', err);
      setCustomerName('عميل غير معروف');
    }
  };

  // fetchRepairs مع useCallback لتجنب re-render غير ضروري
  const fetchRepairs = useCallback(async () => {
    try {
      console.log('fetchRepairs called');
      setLoading(true);
      setError(null);

      // بناء معاملات الفلترة والصفحات لإرسالها للخادم
      const params = {};
      const hasSearch = debouncedSearch && debouncedSearch.trim();
      
      // عند البحث، نبحث في جميع الطلبات بدون فلاتر (إلا إذا كان هناك فلتر محدد)
      if (hasSearch) {
        params.search = debouncedSearch.trim();
        params.searchField = searchField; // إرسال نوع البحث إلى Backend
        // عند البحث، نستخدم limit كبير لجلب جميع النتائج
        params.limit = 5000; // جلب حتى 5000 نتيجة للبحث في جميع الطلبات
        params.page = 1; // دائماً نبدأ من الصفحة الأولى عند البحث
        console.log('🔍 [FRONTEND SEARCH] Searching with:', { search: params.search, searchField: params.searchField, limit: params.limit });
      } else {
        // بدون بحث، نطبق الفلاتر العادية
        if (customerFilter) params.customerId = customerFilter;
        if (status && status !== 'all') params.status = status;
        if (page && page > 1) params.page = page;
        if (pageSize && pageSize !== 10) params.limit = pageSize;
      }
      
      // هذه المعاملات تعمل دائماً (مع أو بدون بحث)
      if (sortBy && sortBy !== 'createdAt') params.sort = sortBy;
      if (sortOrder && sortOrder !== 'desc') params.order = sortOrder;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      
      // الفلاتر التالية تطبق فقط بدون بحث
      if (!hasSearch) {
        if (technicianId) params.technicianId = technicianId;
        if (priority) params.priority = priority;
      }

      // لا نحدث URL هنا - يتم التعامل معه في useEffect منفصلة
      // هذا يمنع reload الصفحة عند البحث

      const response = await apiService.getRepairRequests(params);
      console.log('Repairs response:', response);
      console.log('Repairs data:', response, 'with params:', params);

      if (Array.isArray(response)) {
        console.log('Setting repairs as array:', response.length, 'items');
        setRepairs(response);
        setServerTotal(null);
      } else if (response && response.success && response.data && Array.isArray(response.data.repairs)) {
        // Backend returns: {success: true, data: {repairs: [...], pagination: {...}}}
        console.log('Setting repairs from data.data.repairs:', response.data.repairs.length, 'items');
        setRepairs(response.data.repairs);
        setServerTotal(response.data.pagination?.totalItems || response.data.pagination?.total || null);
      } else if (response && Array.isArray(response.items)) {
        console.log('Setting repairs from data.items:', response.items.length, 'items');
        setRepairs(response.items);
        setServerTotal(Number.isFinite(response.total) ? response.total : null);
      } else if (response && Array.isArray(response.data)) {
        console.log('Setting repairs from data.data:', response.data.length, 'items');
        setRepairs(response.data);
        setServerTotal(Number.isFinite(response.total) ? response.total : null);
      } else {
        console.warn('Unexpected data format:', response);
        setRepairs([]);
        setServerTotal(null);
      }
    } catch (err) {
      console.error('Error fetching repairs:', err);
      setError('حدث خطأ في تحميل بيانات طلبات الإصلاح');
      // بيانات تجريبية في حالة الخطأ
      setRepairs([
        {
          id: 1,
          requestNumber: 'REP-2024-001',
          customerName: 'أحمد محمد السعيد',
          customerPhone: '0501234567',
          deviceType: 'لابتوب',
          deviceBrand: 'Dell',
          deviceModel: 'Inspiron 15',
          problemDescription: 'الجهاز لا يعمل عند الضغط على زر التشغيل',
          status: 'pending',
          priority: 'HIGH',
          estimatedCost: 500,
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          requestNumber: 'REP-2024-002',
          customerName: 'فاطمة أحمد',
          customerPhone: '0512345678',
          deviceType: 'هاتف ذكي',
          deviceBrand: 'Samsung',
          deviceModel: 'Galaxy S21',
          problemDescription: 'الشاشة مكسورة',
          status: 'in_progress',
          priority: 'MEDIUM',
          estimatedCost: 300,
          createdAt: '2024-01-16T14:20:00Z',
          updatedAt: '2024-01-16T16:45:00Z'
        },
        {
          id: 3,
          requestNumber: 'REP-2024-003',
          customerName: 'محمد علي',
          customerPhone: '0523456789',
          deviceType: 'تابلت',
          deviceBrand: 'iPad',
          deviceModel: 'Air 4',
          problemDescription: 'البطارية لا تشحن',
          status: 'completed',
          priority: 'LOW',
          estimatedCost: 200,
          createdAt: '2024-01-10T09:15:00Z',
          updatedAt: '2024-01-14T11:30:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [customerFilter, page, pageSize, status, debouncedSearch, searchField, sortBy, sortOrder, dateFrom, dateTo, technicianId, priority]);

  // جلب البيانات عند تغيير debouncedSearch (مباشرة)
  useEffect(() => {
    // عندما يتغير debouncedSearch، نستدعي fetchRepairs مباشرة
    // بغض النظر عن isTypingRef لأن debouncedSearch يتم تحديثه بعد انتهاء الكتابة
    console.log('useEffect debouncedSearch changed:', debouncedSearch);
    fetchRepairs();
  }, [debouncedSearch, fetchRepairs]);

  // جلب البيانات من Backend عند تغيير الفلاتر الأخرى
  useEffect(() => {
    // لا نستدعي fetchRepairs أثناء الكتابة
    if (isTypingRef.current) {
      return;
    }
    // لا نستدعي إذا كان debouncedSearch موجود - لأن useEffect السابق سيستدعي
    if (debouncedSearch && debouncedSearch.trim()) {
      return;
    }
    console.log('useEffect triggered with dependencies:', { customerFilter, page, pageSize, status });
    fetchRepairs();
  }, [customerFilter, page, pageSize, status, technicianId, priority, dateFrom, dateTo, sortBy, sortOrder, fetchRepairs, debouncedSearch]);

  // جلب البيانات عند بدء الصفحة
  useEffect(() => {
    console.log('Initial useEffect triggered - fetching repairs on page load');
    fetchRepairs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteRepair = async (repairId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      try {
        await apiService.deleteRepairRequest(repairId);
        setRepairs(repairs.filter(repair => repair.id !== repairId));
        alert('تم حذف الطلب بنجاح');
      } catch (err) {
        console.error('Error deleting repair:', err);
        alert('حدث خطأ في حذف الطلب');
      }
    }
  };

  const handleRefresh = () => {
    fetchRepairs();
  };

  // التنقل لعرض/تعديل طلب الإصلاح
  const handleViewRepair = (id) => {
    if (!id) return;
    navigate(`/repairs/${id}`);
  };
  const handleEditRepair = (id) => {
    if (!id) return;
    navigate(`/repairs/${id}`);
  };

  // تصدير كل النتائج المفلترة من الشريط العلوي
  const handleExportFiltered = () => {
    try {
      const csv = exportToCSV(filteredRepairs);
      if (!csv) {
        notify('warning', 'لا توجد بيانات لتصديرها');
        return;
      }
      downloadFile(csv, `repairs_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
      // لا إشعار نجاح لتقليل الضوضاء
    } catch (e) {
      console.error(e);
      notify('error', 'فشل تصدير البيانات');
    }
  };

  // استيراد CSV/JSON مع تلخيص
  const fileInputRef = useRef(null);
  const handleImportClick = () => fileInputRef.current?.click();
  const handleImportFiles = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const run = async () => {
      const text = await file.text();
      let rows = [];
      try {
        if (file.name.endsWith('.json')) {
          rows = JSON.parse(text);
        } else {
          // CSV بسيط
          const lines = text.split(/\r?\n/).filter(Boolean);
          if (lines.length < 2) return [];
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          for (let i = 1; i < lines.length; i++) {
            const parts = [];
            let cur = '';
            let inQ = false;
            const line = lines[i];
            for (let ch of line) {
              if (ch === '"') { inQ = !inQ; cur += ch; }
              else if (ch === ',' && !inQ) { parts.push(cur); cur = ''; }
              else { cur += ch; }
            }
            parts.push(cur);
            const clean = parts.map(p => p.replace(/^"|"$/g, '').replace(/""/g, '"'));
            const obj = {};
            headers.forEach((h, idx) => obj[h] = clean[idx]);
            rows.push(obj);
          }
        }
      } catch (err) {
        console.error('parse error', err);
        throw new Error('تعذر قراءة الملف');
      }

      let success = 0, failed = 0;
      for (const r of rows) {
        try {
          // تحويلات بسيطة إن وجدت
          const payload = { ...r };
          if (!payload.requestNumber) continue;
          await apiService.createRepairRequest(payload);
          success++;
        } catch {
          failed++;
        }
      }
      await fetchRepairs();
      return { success, failed };
    };

    const withN = notifications?.withNotification;
    if (typeof withN === 'function') {
      try {
        const { success, failed } = await withN(run, {
          loadingMessage: 'جاري الاستيراد...',
          successMessage: 'تم الاستيراد',
          errorMessage: 'فشل الاستيراد',
          dedupeKey: 'repairs-import'
        });
        notifications?.info?.(`تم الاستيراد: ناجحة ${success} / فاشلة ${failed}`, { dedupeKey: 'repairs-import-summary' });
      } catch { }
    } else {
      try {
        const { success, failed } = await run();
        notify('info', `تم الاستيراد: ناجحة ${success} / فاشلة ${failed}`);
      } catch (e) {
        notify('error', e?.message || 'فشل الاستيراد');
      }
    }
  };

  // أعمدة DataView لطلبات الإصلاح
  const columns = [
    { key: 'requestNumber', label: 'رقم الطلب', defaultVisible: true },
    { key: 'status', label: 'الحالة', defaultVisible: true },
    { key: 'priority', label: 'الأولوية', defaultVisible: true },
    { key: 'customerName', label: 'العميل', defaultVisible: true },
    { key: 'customerPhone', label: 'الهاتف', defaultVisible: false },
    { key: 'deviceType', label: 'نوع الجهاز', defaultVisible: true },
    { key: 'deviceBrand', label: 'الماركة', defaultVisible: false },
    { key: 'deviceModel', label: 'الموديل', defaultVisible: false },
    { key: 'estimatedCost', label: 'التكلفة التقديرية', defaultVisible: true },
    { key: 'createdAt', label: 'تاريخ الإنشاء', defaultVisible: true },
  ];

  // Helpers للتصدير
  const exportToCSV = (rows) => {
    if (!rows || rows.length === 0) return '';
    const headers = [
      'id', 'requestNumber', 'status', 'priority', 'customerName', 'customerPhone', 'deviceType', 'deviceBrand', 'deviceModel', 'estimatedCost', 'createdAt', 'updatedAt'
    ];
    const escape = (v) => {
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const lines = [headers.join(',')];
    rows.forEach(r => {
      lines.push(headers.map(h => escape(r[h])).join(','));
    });
    return lines.join('\n');
  };

  const downloadFile = (content, filename, mime) => {
    const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };

  // BulkActions مخصصة لطلبات الإصلاح
  const bulkActions = [
    {
      key: 'start',
      type: 'approve',
      label: 'بدء التنفيذ',
      handler: async (selectedIds) => {
        if (!selectedIds || selectedIds.length === 0) {
          notify('warning', 'لم تقم بتحديد أي طلب');
          return;
        }
        const run = async () => {
          await apiService.updateBulkRepairStatus(selectedIds, 'in_progress');
          await fetchRepairs();
        };
        const withN = notifications?.withNotification;
        if (typeof withN === 'function') {
          await withN(run, {
            loadingMessage: 'تحديث الحالات...',
            successMessage: `تم وضع ${selectedIds.length} طلب كـ قيد التنفيذ`,
            errorMessage: 'فشل تحديث الحالات',
            dedupeKey: 'repairs-bulk-status'
          });
        } else {
          try {
            await run();
            notify('success', `تم وضع ${selectedIds.length} طلب كـ قيد التنفيذ`);
          } catch {
            notify('error', 'فشل تحديث الحالات');
          }
        }
      }
    },
    {
      key: 'complete',
      type: 'approve',
      label: 'تحديد كمكتمل',
      handler: async (selectedIds) => {
        if (!selectedIds || selectedIds.length === 0) {
          notify('warning', 'لم تقم بتحديد أي طلب');
          return;
        }
        const run = async () => {
          await apiService.updateBulkRepairStatus(selectedIds, 'completed');
          await fetchRepairs();
        };
        const withN = notifications?.withNotification;
        if (typeof withN === 'function') {
          await withN(run, {
            loadingMessage: 'تحديث الحالات...',
            successMessage: `تم إنهاء ${selectedIds.length} طلب`,
            errorMessage: 'فشل تحديث الحالات',
            dedupeKey: 'repairs-bulk-status'
          });
        } else {
          try { await run(); notify('success', `تم إنهاء ${selectedIds.length} طلب`); }
          catch { notify('error', 'فشل تحديث الحالات'); }
        }
      }
    },
    {
      key: 'cancel',
      type: 'reject',
      label: 'إلغاء الطلب',
      handler: async (selectedIds) => {
        if (!selectedIds || selectedIds.length === 0) {
          notify('warning', 'لم تقم بتحديد أي طلب');
          return;
        }
        const run = async () => {
          await apiService.updateBulkRepairStatus(selectedIds, 'cancelled');
          await fetchRepairs();
        };
        const withN = notifications?.withNotification;
        if (typeof withN === 'function') {
          await withN(run, {
            loadingMessage: 'تحديث الحالات...',
            successMessage: `تم إلغاء ${selectedIds.length} طلب`,
            errorMessage: 'فشل تحديث الحالات',
            dedupeKey: 'repairs-bulk-status'
          });
        } else {
          try { await run(); notify('warning', `تم إلغاء ${selectedIds.length} طلب`); }
          catch { notify('error', 'فشل تحديث الحالات'); }
        }
      }
    },
    {
      key: 'print_invoices',
      type: 'print',
      label: 'طباعة الفواتير',
      handler: (selectedIds) => {
        if (!selectedIds || selectedIds.length === 0) return;
        selectedIds.forEach(id => handlePrintRepair(id, 'invoice'));
        notify('info', `جاري فتح ${selectedIds.length} فاتورة للطباعة...`);
      }
    },
    {
      key: 'delete_bulk',
      type: 'delete',
      label: 'حذف المحدد',
      requiresConfirmation: true,
      confirmLabel: 'حذف نهائي',
      confirmMessage: 'هل أنت متأكد من حذف الطلبات المحددة؟ لا يمكن التراجع عن هذا الإجراء.',
      handler: async (selectedIds) => {
        if (!selectedIds || selectedIds.length === 0) return;

        const run = async () => {
          // Note: Ideally backend should support bulk delete too, but for now loop is safer for delete
          // or implement bulk delete endpoint if needed. For now let's use loop as delete is less frequent.
          // Actually, let's stick to loop for delete as it's critical/destructive
          await Promise.all(selectedIds.map(id => apiService.deleteRepairRequest(id)));
          await fetchRepairs();
        };

        try {
          await run();
          notify('success', `تم حذف ${selectedIds.length} طلب بنجاح`);
        } catch (err) {
          console.error(err);
          notify('error', 'فشل حذف بعض الطلبات');
        }
      }
    },
    {
      key: 'export',
      type: 'export',
      label: 'تصدير المحدد (CSV)',
      handler: (selectedIds) => {
        try {
          if (!selectedIds || selectedIds.length === 0) {
            notify('warning', 'لم تقم بتحديد أي طلب');
            return;
          }
          const rows = repairs.filter(r => selectedIds.includes(r.id));
          const csv = exportToCSV(rows);
          downloadFile(csv, `repairs_selected_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
          // بدون إشعار نجاح لتقليل الضوضاء
        } catch (e) {
          console.error(e);
          notify('error', 'فشل تصدير الطلبات المحددة');
        }
      }
    },
    {
      key: 'delete',
      type: 'delete',
      label: 'حذف',
      requiresConfirmation: true,
      confirmMessage: 'هل أنت متأكد من حذف الطلبات المحددة؟ هذا الإجراء لا يمكن التراجع عنه.',
      confirmLabel: 'حذف',
      handler: async (selectedIds) => {
        if (!selectedIds || selectedIds.length === 0) {
          notify('warning', 'لم تقم بتحديد أي طلب');
          return;
        }
        const run = async () => {
          await Promise.all(selectedIds.map(id => apiService.deleteRepairRequest(id)));
          await fetchRepairs();
        };
        const withN = notifications?.withNotification;
        if (typeof withN === 'function') {
          await withN(run, {
            loadingMessage: 'حذف الطلبات...',
            successMessage: `تم حذف ${selectedIds.length} طلب`,
            errorMessage: 'فشل حذف الطلبات المحددة',
            dedupeKey: 'repairs-bulk-delete'
          });
        } else {
          try { await run(); notify('success', `تم حذف ${selectedIds.length} طلب`); }
          catch { notify('error', 'فشل حذف الطلبات المحددة'); }
        }
      }
    }
  ];

  // فلترة الطلبات
  // عند وجود debouncedSearch، السيرفر قام بالبحث بالفعل في جميع الطلبات - نعرض نتائج السيرفر مباشرة
  // عند عدم وجود بحث، نستخدم search للبحث الفوري في البيانات المحلية
  const filteredRepairs = useMemo(() => {
    const hasDebouncedSearch = debouncedSearch && debouncedSearch.trim();
    
    // عند وجود debouncedSearch، السيرفر قام بالبحث في جميع الطلبات بالفعل
    // نعرض نتائج السيرفر مباشرة بدون أي فلترة محلية - السيرفر قام بالبحث بالفعل
    if (hasDebouncedSearch) {
      // نتائج السيرفر - تم البحث فيها بالفعل في جميع الطلبات
      // نعرضها مباشرة بدون فلترة محلية - البحث تم في السيرفر
      return repairs;
    }
    
    // بدون debouncedSearch - البحث الفوري في البيانات المحلية فقط
    const searchLower = (search || '').toLowerCase();
    const hasSearch = search && search.trim();
    
    // الحصول على الحقول التي يجب البحث فيها حسب searchField
    const currentSearchField = searchFieldOptions.find(opt => opt.key === searchField) || searchFieldOptions[0];
    const fieldsToSearch = currentSearchField.fields;
    
    return repairs.filter(repair => {
      // البحث الفوري - يعمل على الحقول المحددة في searchField
      let matchesSearch = !hasSearch;
      
      if (hasSearch) {
        matchesSearch = fieldsToSearch.some(field => {
          const value = repair[field] || '';
          // للأرقام (customerPhone)، نبحث بدون lowercase
          if (field === 'customerPhone') {
            return value.includes(search);
          }
          // لباقي الحقول، نبحث مع lowercase
          return value.toLowerCase().includes(searchLower);
        });
      }

      // عند وجود بحث محلي، نبحث في جميع الطلبات بغض النظر عن الفلاتر
      if (hasSearch) {
        return matchesSearch;
      }

      // بدون بحث، نطبق الفلاتر العادية
      const matchesStatus = (status === 'all' || repair.status === status);
      const matchesTechnician = (!technicianId || repair.technicianId === technicianId);
      const matchesPriority = (!priority || repair.priority.toLowerCase() === priority.toLowerCase());

      const repairDate = repair.createdAt ? new Date(repair.createdAt).getTime() : 0;
      const fromDate = dateFrom ? new Date(dateFrom).getTime() : 0;
      const toDate = dateTo ? new Date(dateTo).getTime() : Infinity;
      const matchesDate = repairDate >= fromDate && repairDate <= toDate;

      return matchesStatus && matchesTechnician && matchesPriority && matchesDate;
    });
  }, [repairs, search, debouncedSearch, searchField, status, technicianId, priority, dateFrom, dateTo]);

  // فرز Client-side مؤقتًا (حتى تفعيل الفرز الخادمي بالكامل)
  const priorityRank = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const statusRank = { 
    pending: 1, 
    'in-progress': 2, 
    'waiting-parts': 2.5, 
    'ready-for-pickup': 3, 
    completed: 4, 
    'on-hold': 1.5 
  };
  const sortedRepairs = [...filteredRepairs].sort((a, b) => {
    const dir = sortOrder === 'asc' ? 1 : -1;
    const getVal = (r) => {
      switch (sortBy) {
        case 'createdAt': return r.createdAt ? new Date(r.createdAt).getTime() : 0;
        case 'updatedAt': return r.updatedAt ? new Date(r.updatedAt).getTime() : 0;
        case 'priority': return priorityRank[r.priority] || 0;
        case 'status': return statusRank[r.status] || 0;
        case 'estimatedCost': return Number(r.estimatedCost) || 0;
        case 'customerName': return (r.customerName || '').toLowerCase();
        default: return 0;
      }
    };
    const va = getVal(a);
    const vb = getVal(b);
    if (typeof va === 'string' && typeof vb === 'string') return dir * va.localeCompare(vb, 'ar');
    return dir * (va - vb);
  });

  // حساب ترقيم الصفحات
  // عندما يكون serverTotal موجود، البيانات قادمة من السيرفر ومقسمة بالفعل
  // عندما لا يكون موجود، نستخدم clientTotal من filteredRepairs
  const clientTotal = filteredRepairs.length;
  const effectiveTotal = Number.isFinite(serverTotal) && serverTotal != null ? serverTotal : clientTotal;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  
  // تقسيم النتائج إلى صفحات - دائماً نستخدم sortedRepairs (التي تحتوي على filteredRepairs المفروزة)
  // البحث الفوري يعمل على filteredRepairs باستخدام search مباشرة
  const paginatedRepairs = sortedRepairs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Debug logging - only in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('Render debug:', {
      repairs: repairs.length,
      sortedRepairs: sortedRepairs.length,
      paginatedRepairs: paginatedRepairs.length,
      serverTotal,
      currentPage,
      pageSize
    });
  }

  // حساب أرقام العرض للصفحة الحالية (تراعي الترقيم الخادمي)
  const pageCount = Number.isFinite(serverTotal) && serverTotal != null ? repairs.length : sortedRepairs.slice((currentPage - 1) * pageSize, currentPage * pageSize).length;
  const displayedStart = effectiveTotal === 0 ? 0 : ((currentPage - 1) * pageSize) + 1;
  const displayedEnd = effectiveTotal === 0 ? 0 : Math.min((currentPage - 1) * pageSize + pageCount, effectiveTotal);

  // إعادة تعيين الصفحة للأولى عند تغيّر عوامل الفلترة/البحث لتجنّب صفحات فارغة
  // استخدام debouncedSearch بدلاً من search - وهذا يمنع reload أثناء الكتابة
  useEffect(() => {
    // لا نحدث page أثناء الكتابة
    if (isTypingRef.current) {
      return;
    }
    setPage(1);
  }, [debouncedSearch, status, customerFilter, sortBy, sortOrder, dateFrom, dateTo, technicianId, priority]);

  // حساب الإحصائيات
  const stats = {
    total: repairs.length,
    pending: repairs.filter(repair => repair.status === 'pending').length,
    inProgress: repairs.filter(repair => repair.status === 'in-progress').length,
    waitingParts: repairs.filter(repair => repair.status === 'waiting-parts').length,
    readyForPickup: repairs.filter(repair => repair.status === 'ready-for-pickup').length,
    onHold: repairs.filter(repair => repair.status === 'on-hold').length,
    completed: repairs.filter(repair => repair.status === 'completed').length
  };

  // دالة لتحديد لون الحالة
  const getStatusColor = (status) => {
    let color;
    switch (status) {
      case 'pending':
        color = 'warning'; // أصفر للانتظار
        break;
      case 'in-progress':
        color = 'info'; // أزرق للإصلاح
        break;
      case 'waiting-parts':
        color = 'secondary'; // رمادي لبانتظار قطع غيار
        break;
      case 'ready-for-pickup':
        color = 'success'; // أخضر لجاهز للاستلام
        break;
      case 'on-hold':
        color = 'secondary'; // رمادي للمعلق
        break;
      case 'completed':
        color = 'success'; // أخضر للمكتمل
        break;
      case 'cancelled':
        color = 'danger'; // أحمر للملغي
        break;
      default:
        color = 'secondary';
    }
    return color;
  };

  // دالة لتحديد نص الحالة
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'في الانتظار';
      case 'in-progress':
        return 'قيد الإصلاح';
      case 'waiting-parts':
        return 'بانتظار قطع غيار';
      case 'ready-for-pickup':
        return 'جاهز للاستلام';
      case 'on-hold':
        return 'معلق';
      case 'completed':
        return 'مكتمل';
      case 'cancelled':
        return 'ملغي';
      default: return status;
    }
  };

  // دالة لتحديد لون الأولوية
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'danger';
      case 'URGENT': return 'danger';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'secondary';
    }
  };

  // دالة لتحديد نص الأولوية
  const getPriorityText = (priority) => {
    switch (priority) {
      case 'HIGH': return 'عالية';
      case 'URGENT': return 'عاجلة';
      case 'MEDIUM': return 'متوسطة';
      case 'LOW': return 'منخفضة';
      default: return priority;
    }
  };



  // عرض كلاسيكي (الأول سابقاً) كبطاقة تفصيلية
  const renderClassicItem = (r, visibleKeys = [], selectedItems = [], onItemSelect = null) => {
    if (!r) return null;
    const isVisible = (key) => (visibleKeys?.length ? visibleKeys.includes(key) : true);
    const statusColor = getStatusColor(r.status);
    const statusText = getStatusText(r.status);
    const priorityColor = getPriorityColor(r.priority);
    const priorityText = getPriorityText(r.priority);
    const created = r.createdAt ? new Date(r.createdAt).toLocaleString('ar-EG') : '-';
    const updated = r.updatedAt ? new Date(r.updatedAt).toLocaleString('ar-EG') : '-';
    const onEditClick = (e) => { e.stopPropagation(); handleEditRepair(r.id); };
    const onViewClick = (e) => { e.stopPropagation(); handleViewRepair(r.id); };
    const isSelected = selectedItems?.includes(r.id) || false;

    return (
      <div className={`relative group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition duration-200 ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}>
        {/* Checkbox للتحديد المتعدد */}
        {onItemSelect && (
          <div className="absolute top-3 left-3 z-20" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onItemSelect?.(r.id, e.target.checked);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all cursor-pointer hover:border-blue-400"
              title={isSelected ? 'إلغاء التحديد' : 'تحديد'}
            />
          </div>
        )}

        {/* أزرار العرض/التعديل */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition z-20">
          <button onClick={onEditClick} className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:scale-105 shadow">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={onViewClick} className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:scale-105 shadow">
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrintRepair(r.id, 'invoice');
            }}
            title="طباعة الفاتورة"
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center hover:scale-105 shadow"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>

        {/* العنوان */}
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-gray-900 dark:text-gray-100">{(isVisible('requestNumber') && (r.requestNumber || `#${r.id}`)) || `#${r.id}`}</div>
          {isVisible('status') && (
            <SimpleBadge color={statusColor}>{statusText}</SimpleBadge>
          )}
        </div>

        {/* معلومات أساسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {(isVisible('customerName') || isVisible('customerPhone')) && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              {isVisible('customerName') && (
                <span className="text-gray-600 dark:text-gray-300">{r.customerName || '-'}</span>
              )}
              {isVisible('customerPhone') && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">{r.customerPhone || '-'}</span>
                </>
              )}
            </div>
          )}
          {(isVisible('deviceType') || isVisible('deviceBrand') || isVisible('deviceModel')) && (
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-gray-400" />
              {isVisible('deviceType') && (
                <span className="text-gray-600 dark:text-gray-300">{r.deviceType || '-'}</span>
              )}
              {isVisible('deviceBrand') && (
                <>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-600 dark:text-gray-300">{r.deviceBrand || '-'}</span>
                </>
              )}
              {isVisible('deviceModel') && (
                <>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-600 dark:text-gray-300">{r.deviceModel || '-'}</span>
                </>
              )}
            </div>
          )}
          {(isVisible('estimatedCost') || isVisible('priority')) && (
            <div className="flex items-center gap-2">
              {isVisible('estimatedCost') && (
                <>
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-200 font-medium">{r.estimatedCost != null ? formatMoney(Number(r.estimatedCost) || 0) : '-'}</span>
                </>
              )}
              {isVisible('priority') && (
                <>
                  <span className="text-gray-400">•</span>
                  <SimpleBadge color={priorityColor}>{priorityText}</SimpleBadge>
                </>
              )}
            </div>
          )}
          {(isVisible('createdAt')) && (
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>إنشاء: {created}</span>
              <span className="text-gray-400">•</span>
              <span>تحديث: {updated}</span>
            </div>
          )}
        </div>

        {/* وصف المشكلة */}
        {r.problemDescription && (
          <div className="mt-3 text-sm text-gray-700 dark:text-gray-200 line-clamp-3">
            {r.problemDescription}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل طلبات الإصلاح...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">طلبات الإصلاح</h1>
        <Link to="/repairs/new">
          <SimpleButton className="flex items-center space-x-2 space-x-reverse">
            <Plus className="w-4 h-4" />
            <span>طلب إصلاح جديد</span>
          </SimpleButton>
        </Link>
      </div>

      {/* رسالة الخطأ */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center justify-between">
          <span>{error}</span>
          <SimpleButton
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="mr-2"
          >
            إعادة المحاولة
          </SimpleButton>
        </div>
      )}



      {/* بطاقات الفلترة - QuickStatsCard كأزرار */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* الكل */}
        <button
          onClick={() => setStatus('all')}
          className={`
            text-right transition-all duration-200 transform hover:scale-105
            ${status === 'all' ? 'ring-2 ring-gray-600 shadow-lg scale-105' : 'hover:shadow-md'}
          `}
        >
          <QuickStatsCard
            title="إجمالي الطلبات"
            value={globalStats.totalRequests}
            icon={Wrench}
            color="blue"
          />
        </button>

        {/* في الانتظار */}
        <button
          onClick={() => setStatus('pending')}
          className={`
            text-right transition-all duration-200 transform hover:scale-105
            ${status === 'pending' ? 'ring-2 ring-yellow-500 shadow-lg scale-105' : 'hover:shadow-md'}
          `}
        >
          <QuickStatsCard
            title="في الانتظار"
            value={globalStats.pendingRequests}
            icon={Clock}
            color="yellow"
          />
        </button>

        {/* قيد الإصلاح */}
        <button
          onClick={() => setStatus('in-progress')}
          className={`
            text-right transition-all duration-200 transform hover:scale-105
            ${status === 'in-progress' ? 'ring-2 ring-blue-600 shadow-lg scale-105' : 'hover:shadow-md'}
          `}
        >
          <QuickStatsCard
            title="قيد الإصلاح"
            value={globalStats.inProgressRequests}
            icon={Play}
            color="blue"
          />
        </button>

        {/* بانتظار قطع غيار */}
        <button
          onClick={() => setStatus('waiting-parts')}
          className={`
            text-right transition-all duration-200 transform hover:scale-105
            ${status === 'waiting-parts' ? 'ring-2 ring-orange-500 shadow-lg scale-105' : 'hover:shadow-md'}
          `}
        >
          <QuickStatsCard
            title="بانتظار قطع غيار"
            value={globalStats.waitingPartsRequests}
            icon={ShoppingCart}
            color="orange"
          />
        </button>

        {/* جاهز للاستلام */}
        <button
          onClick={() => setStatus('ready-for-pickup')}
          className={`
            text-right transition-all duration-200 transform hover:scale-105
            ${status === 'ready-for-pickup' ? 'ring-2 ring-green-500 shadow-lg scale-105' : 'hover:shadow-md'}
          `}
        >
          <QuickStatsCard
            title="جاهز للاستلام"
            value={globalStats.readyForPickupRequests}
            icon={Package}
            color="green"
          />
        </button>

        {/* مكتملة */}
        <button
          onClick={() => setStatus('completed')}
          className={`
            text-right transition-all duration-200 transform hover:scale-105
            ${status === 'completed' ? 'ring-2 ring-green-600 shadow-lg scale-105' : 'hover:shadow-md'}
          `}
        >
          <QuickStatsCard
            title="مكتملة"
            value={globalStats.completedRequests}
            icon={CheckCircle}
            color="green"
          />
        </button>
      </div>

      {/* عرض فلتر العميل */}
      {customerFilter && (
        <SimpleCard className="border-blue-200 bg-blue-50">
          <SimpleCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center ml-3">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">عرض طلبات العميل:</p>
                  <p className="text-blue-800 font-semibold">{customerName || 'جاري التحميل...'}</p>
                </div>
              </div>
              <Link to="/repairs">
                <SimpleButton variant="outline" size="sm">
                  <XCircle className="w-4 h-4 ml-2" />
                  إزالة الفلتر
                </SimpleButton>
              </Link>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      )}

      {/* شريط الأدوات */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* فلتر نوع البحث */}
          <div className="relative">
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="h-8 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 pr-8 appearance-none cursor-pointer hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              title="اختر نوع البحث"
            >
              {searchFieldOptions.map(option => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder={(() => {
                const current = searchFieldOptions.find(opt => opt.key === searchField);
                if (current?.key === 'nameOrPhone') return 'ابحث بالاسم أو رقم الموبايل...';
                if (current?.key === 'all') return 'ابحث في جميع الحقول...';
                return `ابحث في ${current?.label || '...'}`;
              })()}
              className="pr-8 h-8 text-sm"
              value={search}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                // عند الضغط Enter، تحديث البحث فوراً
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current);
                  }
                  const current = searchParams.get('q') || '';
                  const searchValue = (search || '').trim();
                  if (searchValue !== current) {
                    const next = new URLSearchParams(searchParams);
                    if (!searchValue) {
                      next.delete('q');
                    } else {
                      next.set('q', searchValue);
                    }
                    // لا نحدث URL أثناء الكتابة - البحث محلي تماماً
                  // setSearchParams(next, { replace: true });
                  }
                  // تحديث debouncedSearch فوراً - هذا يمنع reload
                  const trimmedSearch = search.trim();
                  isTypingRef.current = false;
                  setDebouncedSearch(trimmedSearch);
                }
              }}
            />
          </div>
          {/* WebSocket Status Indicator */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${wsStatus === 'connected'
            ? 'bg-green-100 text-green-800'
            : wsStatus === 'connecting'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
            }`}>
            {wsStatus === 'connected' ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            <span className="hidden sm:inline">
              {wsStatus === 'connected' ? 'متصل' :
                wsStatus === 'connecting' ? 'جاري الاتصال' : 'غير متصل'}
            </span>
          </div>

          <SimpleButton variant="outline" size="sm" onClick={handleRefresh} className="whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5 ml-2" /> تحديث
          </SimpleButton>
          {/* قائمة الفرز */}
          <div className="relative" ref={sortMenuRef}>
            <SimpleButton
              variant="outline"
              size="sm"
              onClick={() => setShowSortMenu(v => !v)}
              aria-haspopup="menu"
              aria-expanded={showSortMenu}
              aria-controls="sort-menu"
              className="flex items-center gap-1"
              title="فرز"
            >
              <ArrowUpDown className="w-3.5 h-3.5 ml-1" />
              <span className="truncate max-w-[8rem]">
                {`${sortFields.find(f => f.key === sortBy)?.label || ''} • ${sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}`}
              </span>
              <ChevronDown className="w-3.5 h-3.5" />
            </SimpleButton>
            {showSortMenu && (
              <div
                id="sort-menu"
                role="menu"
                className="absolute right-0 mt-2 w-56 z-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1"
                ref={sortMenuPanelRef}
              >
                <div className="px-3 py-2 text-xs text-gray-500 flex items-center justify-between">
                  <span>ترتيب</span>
                  <div className="flex items-center gap-1">
                    <SimpleButton size="xs" variant={sortOrder === 'asc' ? 'primary' : 'ghost'} onClick={() => setSortOrder('asc')}>تصاعدي</SimpleButton>
                    <SimpleButton size="xs" variant={sortOrder === 'desc' ? 'primary' : 'ghost'} onClick={() => setSortOrder('desc')}>تنازلي</SimpleButton>
                  </div>
                </div>
                <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                {sortFields.map((f) => {
                  const selected = sortBy === f.key;
                  return (
                    <button
                      key={f.key}
                      role="menuitemradio"
                      aria-checked={selected}
                      className={`w-full text-right px-3 py-1.5 text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 ${selected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}
                      onClick={() => { setSortBy(f.key); setShowSortMenu(false); }}
                    >
                      <span>{f.label}</span>
                      {selected && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SimpleButton variant="outline" size="sm" onClick={handleExportFiltered}>
            <Download className="w-3.5 h-3.5 ml-2" /> تصدير النتائج
          </SimpleButton>
          <SimpleButton variant="outline" size="sm" onClick={handleImportClick}>استيراد</SimpleButton>
          <SimpleButton
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(v => !v)}
            className="flex items-center gap-1"
          >
            <Filter className="w-3.5 h-3.5 ml-1" />
            <span>فلاتر متقدمة</span>
            {showAdvancedFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </SimpleButton>
        </div>
      </div>

      {/* Advanced Filters Section */}
      {showAdvancedFilters && (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">من تاريخ</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">إلى تاريخ</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Technician Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الفني المسؤول</label>
              <select
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">الكل</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>{tech.name}</option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الأولوية</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">الكل</option>
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
                <option value="urgent">طارئة</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4 gap-2">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              إعادة تعيين
            </button>
          </div>
        </div>
      )}


      {/* Skeleton أثناء التحميل */}
      {loading ? (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: Math.min(pageSize || 10, 8) }).map((_, i) => (
            <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse bg-white dark:bg-gray-800">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="space-y-2">
                <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 w-4/5 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* DataView */}
          <DataView
            data={paginatedRepairs}
            columns={columns}
            storageKey="repairs_dataview"
            viewModes={['classic', 'cards', 'table', 'list', 'grid']}
            defaultViewMode="classic"
            controlsInDropdown
            enableBulkActions
            bulkActions={bulkActions}
            loading={loading}
            onItemClick={(item) => handleViewRepair(item?.id)}
            onView={(item) => handleViewRepair(item?.id)}
            onEdit={(item) => handleEditRepair(item?.id)}
            renderClassicItem={renderClassicItem}
            emptyState={(
              <div className="text-center py-12">
                <div className="text-gray-500 mb-3">لا توجد طلبات إصلاح مطابقة للمعايير الحالية</div>
                <Link to="/repairs/new">
                  <SimpleButton>
                    <Plus className="w-4 h-4 ml-2" /> إنشاء طلب جديد
                  </SimpleButton>
                </Link>
              </div>
            )}
            className="mt-2"
          />
        </>
      )}

      {/* عناصر تحكم الترقيم */}
      <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          عرض {displayedStart}–{displayedEnd} من {effectiveTotal}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">عدد الصفوف:</label>
          <select
            className="h-8 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 bg-white dark:bg-gray-800"
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value, 10) || 10)}
          >
            {[10, 20, 50, 100].map(sz => (
              <option key={sz} value={sz}>{sz}</option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <SimpleButton
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              title="السابق"
            >
              <ChevronRight className="w-4 h-4 ml-1" /> السابق
            </SimpleButton>
            <div className="min-w-[4rem] text-center text-sm">{currentPage} / {totalPages}</div>
            <SimpleButton
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              title="التالي"
            >
              التالي <ChevronLeft className="w-4 h-4 mr-1" />
            </SimpleButton>
          </div>
        </div>
      </div>

      {/* مُدخل الملفات المخفي للاستيراد */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv,.json"
        className="hidden"
        onChange={handleImportFiles}
      />
    </div>
  );
};

export default RepairsPage;
