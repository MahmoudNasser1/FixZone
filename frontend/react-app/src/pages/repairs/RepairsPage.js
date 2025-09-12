import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import apiService from '../../services/api';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleBadge from '../../components/ui/SimpleBadge';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { 
  Search, Plus, Download, Eye, Edit, Trash2, Calendar,
  Wrench, Clock, CheckCircle, Play, XCircle, RefreshCw, User, DollarSign, Filter,
  ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, Check, AlertTriangle, Printer
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import Breadcrumb from '../../components/layout/Breadcrumb';
import QuickStatsCard from '../../components/ui/QuickStatsCard';
import { Input } from '../../components/ui/Input';
import DataView from '../../components/ui/DataView';

const RepairsPage = () => {
  const navigate = useNavigate();
  const { formatMoney } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const notifications = useNotifications();
  
  // State للبيانات والتحميل
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State للبحث والفلترة
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  
  // State للترقيم والفرز
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [pageSize, setPageSize] = useState(Number(searchParams.get('limit')) || 10);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState((searchParams.get('sortOrder') || 'desc').toLowerCase());
  
  // State للواجهة
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef(null);
  const sortMenuPanelRef = useRef(null);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const statusMenuRef = useRef(null);
  const statusMenuPanelRef = useRef(null);
  const [highlightedStatusIndex, setHighlightedStatusIndex] = useState(0);

  const statusOptions = [
    { key: 'all', label: 'الكل' },
    { key: 'pending', label: 'في الانتظار' },
    { key: 'in-progress', label: 'قيد الإصلاح' },
    { key: 'on-hold', label: 'معلق' },
    { key: 'completed', label: 'مكتمل' },
    { key: 'cancelled', label: 'ملغي' },
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
    setPageSize([5,10,20,50,100].includes(ps) ? ps : 10);
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
    const initial = urlStatus || lsStatus || 'all';
    const valid = statusOptions.some(o => o.key === initial) ? initial : 'all';
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

  // مزامنة البحث مع URL (debounced)
  useEffect(() => {
    const id = setTimeout(() => {
      const current = searchParams.get('q') || '';
      if ((search || '') !== current) {
        const next = new URLSearchParams(searchParams);
        if (!search) next.delete('q'); else next.set('q', search);
        setSearchParams(next, { replace: true });
      }
    }, 300);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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

  // جلب البيانات من Backend
  useEffect(() => {
    console.log('useEffect triggered with dependencies:', { customerFilter, page, pageSize, status, search });
    fetchRepairs();
  }, [customerFilter, page, pageSize, status, search]);

  // جلب البيانات عند بدء الصفحة
  useEffect(() => {
    console.log('Initial useEffect triggered - fetching repairs on page load');
    fetchRepairs();
  }, []);

  const fetchCustomerName = async (customerId) => {
    try {
      const customer = await apiService.getCustomer(customerId);
      setCustomerName(customer.name);
    } catch (err) {
      console.error('Error fetching customer name:', err);
      setCustomerName('عميل غير معروف');
    }
  };

  const fetchRepairs = async () => {
    try {
      console.log('fetchRepairs called');
      setLoading(true);
      setError(null);
      
      // بناء معاملات الفلترة والصفحات لإرسالها للخادم (اختياريًا)
      const params = {};
      if (customerFilter) params.customerId = customerFilter;
      if (status && status !== 'all') params.status = status;
      if (search) params.q = search;
      if (page && page > 1) params.page = page;
      if (pageSize && pageSize !== 10) params.pageSize = pageSize;
      if (sortBy && sortBy !== 'createdAt') params.sort = sortBy;
      if (sortOrder && sortOrder !== 'desc') params.order = sortOrder;

      const response = await apiService.getRepairRequests(params);
      console.log('Repairs response:', response);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Repairs data:', data, 'with params:', params);
      
      if (Array.isArray(data)) {
        console.log('Setting repairs as array:', data.length, 'items');
        setRepairs(data);
        setServerTotal(null);
      } else if (data && Array.isArray(data.items)) {
        console.log('Setting repairs from data.items:', data.items.length, 'items');
        setRepairs(data.items);
        setServerTotal(Number.isFinite(data.total) ? data.total : null);
      } else if (data && Array.isArray(data.data)) {
        console.log('Setting repairs from data.data:', data.data.length, 'items');
        setRepairs(data.data);
        setServerTotal(Number.isFinite(data.total) ? data.total : null);
      } else {
        console.warn('Unexpected data format:', data);
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
  };

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
      downloadFile(csv, `repairs_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv;charset=utf-8;');
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
      } catch {}
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
      'id','requestNumber','status','priority','customerName','customerPhone','deviceType','deviceBrand','deviceModel','estimatedCost','createdAt','updatedAt'
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
          await Promise.all(selectedIds.map(id => apiService.updateRepairStatus(id, 'in_progress')));
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
          await Promise.all(selectedIds.map(id => apiService.updateRepairStatus(id, 'completed')));
          await fetchRepairs();
        };
        const withN = notifications?.withNotification;
        if (typeof withN === 'function') {
          await withN(run, {
            loadingMessage: 'تحديث الحالات...',
            successMessage: `تم إنهاء ${selectedIds.length} طلب` ,
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
          await Promise.all(selectedIds.map(id => apiService.updateRepairStatus(id, 'cancelled')));
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
          downloadFile(csv, `repairs_selected_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv;charset=utf-8;');
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
  const filteredRepairs = repairs.filter(repair => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      (repair.requestNumber || '').toLowerCase().includes(searchLower) ||
      (repair.customerName || '').toLowerCase().includes(searchLower) ||
      (repair.customerPhone || '').includes(search) ||
      (repair.deviceType || '').toLowerCase().includes(searchLower) ||
      (repair.deviceBrand || '').toLowerCase().includes(searchLower) ||
      (repair.problemDescription || '').toLowerCase().includes(searchLower);
    
    if (status === 'all') return matchesSearch;
    return matchesSearch && repair.status === status;
  });

  // فرز Client-side مؤقتًا (حتى تفعيل الفرز الخادمي بالكامل)
  const priorityRank = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const statusRank = { pending: 1, 'in-progress': 2, 'on-hold': 1.5, completed: 3, cancelled: 0 };
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
  const clientTotal = sortedRepairs.length;
  const effectiveTotal = Number.isFinite(serverTotal) && serverTotal != null ? serverTotal : clientTotal;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, clientTotal);
  // إذا كانت البيانات قادمة مُقسّمة من الخادم (serverTotal موجود) نعرض كما هي، وإلا نُقسّم Client-side
  const paginatedRepairs = Number.isFinite(serverTotal) && serverTotal != null ? repairs : sortedRepairs.slice(startIdx, endIdx);
  
  // Debug logging
  console.log('Render debug:', {
    repairs: repairs.length,
    sortedRepairs: sortedRepairs.length,
    paginatedRepairs: paginatedRepairs.length,
    serverTotal,
    startIdx,
    endIdx
  });

  // حساب أرقام العرض للصفحة الحالية (تراعي الترقيم الخادمي)
  const pageCount = Number.isFinite(serverTotal) && serverTotal != null ? repairs.length : (endIdx - startIdx);
  const displayedStart = effectiveTotal === 0 ? 0 : startIdx + 1;
  const displayedEnd = effectiveTotal === 0 ? 0 : Math.min(startIdx + pageCount, effectiveTotal);

  // إعادة تعيين الصفحة للأولى عند تغيّر عوامل الفلترة/البحث لتجنّب صفحات فارغة
  useEffect(() => {
    setPage(1);
  }, [search, status, customerFilter, sortBy, sortOrder]);

  // حساب الإحصائيات
  const stats = {
    total: repairs.length,
    pending: repairs.filter(repair => repair.status === 'pending').length,
    inProgress: repairs.filter(repair => repair.status === 'in-progress').length,
    onHold: repairs.filter(repair => repair.status === 'on-hold').length,
    completed: repairs.filter(repair => repair.status === 'completed').length,
    cancelled: repairs.filter(repair => repair.status === 'cancelled').length
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
  const renderClassicItem = (r, visibleKeys = []) => {
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

    return (
      <div className="relative group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition duration-200">
        {/* أزرار العرض/التعديل */}
        <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
          <button onClick={onEditClick} className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:scale-105 shadow">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={onViewClick} className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:scale-105 shadow">
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); window.open(`/api/repairs/${r.id}/print/invoice`, '_blank'); }}
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
    <div className="space-y-6">
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

      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <QuickStatsCard
          title="إجمالي الطلبات"
          value={repairs.length}
          previousValue={Math.floor(repairs.length * 0.85)} // تقدير للفترة السابقة
          icon={Wrench}
          color="blue"
        />
        <QuickStatsCard
          title="قيد الإصلاح"
          value={repairs.filter(r => r.status === 'in-progress').length}
          previousValue={Math.floor(repairs.filter(r => r.status === 'in-progress').length * 0.9)}
          icon={Play}
          color="blue"
        />
        <QuickStatsCard
          title="مكتملة"
          value={repairs.filter(r => r.status === 'completed').length}
          previousValue={Math.floor(repairs.filter(r => r.status === 'completed').length * 0.8)}
          icon={CheckCircle}
          color="green"
        />
        <QuickStatsCard
          title="في الانتظار"
          value={repairs.filter(r => r.status === 'pending').length}
          previousValue={Math.floor(repairs.filter(r => r.status === 'pending').length * 1.2)}
          icon={Clock}
          color="yellow"
        />
        <QuickStatsCard
          title="معلق"
          value={repairs.filter(r => r.status === 'on-hold').length}
          previousValue={Math.floor(repairs.filter(r => r.status === 'on-hold').length * 1.1)}
          icon={AlertTriangle}
          color="gray"
        />
        <QuickStatsCard
          title="إجمالي الإيرادات"
          value={repairs.reduce((sum, r) => sum + (parseFloat(r.estimatedCost) || 0), 0)}
          previousValue={repairs.reduce((sum, r) => sum + (parseFloat(r.estimatedCost) || 0), 0) * 0.85}
          icon={DollarSign}
          color="purple"
          format="currency"
        />
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
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="ابحث..."
              className="pr-8 h-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <SimpleButton variant="outline" size="sm" onClick={handleRefresh} className="whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5 ml-2" /> تحديث
          </SimpleButton>
          {/* فلتر الحالة داخل قائمة */}
          <div className="relative" ref={statusMenuRef}>
            <SimpleButton
              variant="outline"
              size="sm"
              onClick={() => setShowStatusFilter(v => !v)}
              aria-haspopup="menu"
              aria-expanded={showStatusFilter}
              aria-controls="status-filter-menu"
              className="flex items-center gap-1"
              title="تصفية حسب الحالة"
            >
              <Filter className="w-3.5 h-3.5 ml-1" />
              <span className="truncate max-w-[8rem]">
                {`الحالة: ${statusOptions.find(o => o.key === status)?.label || ''}`}
              </span>
              <ChevronDown className="w-3.5 h-3.5" />
            </SimpleButton>
            {showStatusFilter && (
              <div
                id="status-filter-menu"
                role="menu"
                className="absolute right-0 mt-2 w-48 z-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 transform origin-top transition ease-out duration-100 scale-95 opacity-0 data-[open=true]:scale-100 data-[open=true]:opacity-100 focus:outline-none"
                data-open="true"
                ref={statusMenuPanelRef}
                tabIndex={-1}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedStatusIndex((i) => (i + 1) % statusOptions.length);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedStatusIndex((i) => (i - 1 + statusOptions.length) % statusOptions.length);
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const opt = statusOptions[highlightedStatusIndex];
                    if (opt) { setStatus(opt.key); setShowStatusFilter(false); }
                  } else if (e.key === 'Home') {
                    e.preventDefault();
                    setHighlightedStatusIndex(0);
                  } else if (e.key === 'End') {
                    e.preventDefault();
                    setHighlightedStatusIndex(statusOptions.length - 1);
                  }
                }}
              >
                {statusOptions.map((opt, idx) => {
                  const selected = status === opt.key;
                  const highlighted = highlightedStatusIndex === idx;
                  return (
                    <button
                      key={opt.key}
                      role="menuitem"
                        className={`w-full text-right px-3 py-1.5 text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 ${selected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'} ${highlighted ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
                      onClick={() => { setStatus(opt.key); setShowStatusFilter(false); }}
                    >
                      <span>{opt.label}</span>
                      {selected && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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
        </div>
      </div>
      

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
            {[10,20,50,100].map(sz => (
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
