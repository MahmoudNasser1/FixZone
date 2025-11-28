import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import { DataTable } from '../../components/ui/DataTable';
import apiService from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import Breadcrumb from '../../components/layout/Breadcrumb';
import {
  Search, Plus, Eye, Edit, Filter, RefreshCw
} from 'lucide-react';

const RepairsPageEnhanced = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notifications = useNotifications();

  // State للبيانات والتحميل
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // State للبحث والفلترة
  // تهيئة search من URL فقط عند أول تحميل
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [customerId, setCustomerId] = useState(searchParams.get('customerId') || '');
  const [technicianId, setTechnicianId] = useState(searchParams.get('technicianId') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');

  // State للترقيم والفرز
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'DESC');

  // State للواجهة
  const [showFilters, setShowFilters] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  
  // Ref لتتبع آخر URL parameters لتجنب تحديثات غير ضرورية
  const lastParamsRef = useRef(searchParams.toString());
  // Ref لتخزين timeout البحث
  const searchTimeoutRef = useRef(null);
  // Ref لتتبع إذا كنا في حالة كتابة لتجنب تحديث URL و loadRepairs
  const isTypingRef = useRef(false);

  // خيارات الحالة
  const statusOptions = [
    { value: '', label: 'جميع الحالات' },
    { value: 'pending', label: 'في الانتظار' },
    { value: 'in_progress', label: 'قيد التنفيذ' },
    { value: 'completed', label: 'مكتمل' },
    { value: 'delivered', label: 'تم التسليم' },
    { value: 'cancelled', label: 'ملغي' }
  ];

  // أعمدة الجدول
  const repairColumns = [
    {
      accessorKey: "requestNumber",
      header: "رقم الطلب",
      cell: ({ row }) => (
        <Link
          to={`/repairs/${row.getValue("id")}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          #{row.getValue("requestNumber") || row.getValue("id")}
        </Link>
      ),
    },
    {
      accessorKey: "customerName",
      header: "العميل",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("customerName") || 'غير محدد'}</div>
          <div className="text-sm text-gray-500">{row.original.customerPhone}</div>
        </div>
      ),
    },
    {
      accessorKey: "deviceType",
      header: "نوع الجهاز",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("deviceType") || 'غير محدد'}</div>
          <div className="text-sm text-gray-500">{row.original.brand} {row.original.model}</div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => {
        const status = row.getValue("status");
        const statusColors = {
          pending: 'bg-yellow-100 text-yellow-800',
          in_progress: 'bg-blue-100 text-blue-800',
          completed: 'bg-green-100 text-green-800',
          delivered: 'bg-purple-100 text-purple-800',
          cancelled: 'bg-red-100 text-red-800',
        };
        return (
          <SimpleBadge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
            {row.original.statusText || status}
          </SimpleBadge>
        );
      },
    },
    {
      accessorKey: "technicianName",
      header: "الفني",
      cell: ({ row }) => row.getValue("technicianName") || 'غير مُعيَّن',
    },
    {
      accessorKey: "createdAt",
      header: "تاريخ الإنشاء",
      cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString('en-GB'),
    },
    {
      id: "actions",
      header: "إجراءات",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <SimpleButton
            variant="outline"
            size="sm"
            onClick={() => navigate(`/repairs/${row.getValue("id")}`)}
          >
            <Eye className="w-4 h-4" />
          </SimpleButton>
          <SimpleButton
            variant="outline"
            size="sm"
            onClick={() => navigate(`/repairs/${row.getValue("id")}/edit`)}
          >
            <Edit className="w-4 h-4" />
          </SimpleButton>
        </div>
      ),
    },
  ];

  // handleSearchChange - مثل NewRepairPageEnhanced (بحث محلي تماماً - بدون أي reload)
  const handleSearchChange = (e) => {
    const value = e.target.value;
    
    // تحديث البحث محلياً فقط - لا يسبب reload
    setSearch(value);
    
    // إلغاء timeout السابق
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    // تحديد أننا في حالة كتابة - يمنع loadRepairs و URL updates
    isTypingRef.current = true;

    // البحث مع debounce - تماماً مثل NewRepairPageEnhanced
    searchTimeoutRef.current = setTimeout(() => {
      const trimmedValue = value.trim();
      // تحديث state فقط - بدون setPage
      setDebouncedSearch(trimmedValue);
      // انهاء حالة الكتابة بعد تأخير صغير
      setTimeout(() => {
        isTypingRef.current = false;
      }, 100);
      searchTimeoutRef.current = null;
    }, 400);
  };

  // loadRepairs مع useCallback لتجنب re-render غير ضروري
  const loadRepairs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        sortOrder
      });

      if (debouncedSearch) params.set('search', debouncedSearch);
      if (status) params.set('status', status);
      if (customerId) params.set('customerId', customerId);
      if (technicianId) params.set('technicianId', technicianId);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const response = await apiService.request(`/repairs?${params}`);

      if (response.success) {
        setRepairs(response.data.repairs || []);
        setTotalItems(response.data.pagination?.totalItems || 0);
        setStats(response.data.stats || null);
      } else {
        throw new Error(response.error || 'فشل في تحميل البيانات');
      }
    } catch (err) {
      console.error('Error loading repairs:', err);
      setError(err.message || 'حدث خطأ في تحميل الإصلاحات');
      notifications.error('فشل في تحميل الإصلاحات');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, status, customerId, technicianId, dateFrom, dateTo, sortBy, sortOrder, notifications]);

  // تحديث page عند تغيير debouncedSearch - فقط بعد debounce
  // نزيل هذا useEffect تماماً - لا نحدث page للبحث
  // useEffect(() => {
  //   // لا نحدث page أثناء الكتابة
  //   if (isTypingRef.current) {
  //     return;
  //   }
  //   
  //   // تحديث page فقط عند تغيير debouncedSearch
  //   if (debouncedSearch !== searchParams.get('search')) {
  //     setPage(1);
  //   }
  // }, [debouncedSearch, searchParams]);

  // تحميل البيانات عند تغيير الفلاتر
  // لا نستدعي loadRepairs أثناء الكتابة
  useEffect(() => {
    // لا نستدعي loadRepairs أثناء الكتابة
    if (isTypingRef.current) {
      return;
    }
    
    // تأخير loadRepairs أكثر لتجنب reload
    const timeoutId = setTimeout(() => {
      if (!isTypingRef.current) {
        loadRepairs();
      }
    }, 200);
    
    return () => clearTimeout(timeoutId);
  }, [loadRepairs]);

  // تحديث URL فقط عند تغيير الفلاتر (ليس البحث) - البحث محلي تماماً
  // نزيل debouncedSearch من dependencies - البحث لا يحدث URL
  useEffect(() => {
    // لا تحدث URL أثناء الكتابة
    if (isTypingRef.current) {
      return;
    }

    // تحديث URL فقط عند تغيير فلاتر أخرى - البحث محلي تماماً
    const newParams = new URLSearchParams();
    if (page > 1) newParams.set('page', String(page));
    if (limit !== 10) newParams.set('limit', String(limit));
    // البحث لا يحدث URL - محلي تماماً مثل NewRepairPageEnhanced
    // if (debouncedSearch) newParams.set('search', debouncedSearch);
    if (status) newParams.set('status', status);
    if (customerId) newParams.set('customerId', customerId);
    if (technicianId) newParams.set('technicianId', technicianId);
    if (dateFrom) newParams.set('dateFrom', dateFrom);
    if (dateTo) newParams.set('dateTo', dateTo);
    if (sortBy !== 'createdAt') newParams.set('sortBy', sortBy);
    if (sortOrder !== 'DESC') newParams.set('sortOrder', sortOrder);

    const newParamsString = newParams.toString();
    
    // تحديث URL فقط إذا تغيرت القيم فعلياً
    if (lastParamsRef.current !== newParamsString) {
      lastParamsRef.current = newParamsString;
      // لا نحدث URL أثناء الكتابة - هذا يمنع reload
    }
  }, [page, limit, status, customerId, technicianId, dateFrom, dateTo, sortBy, sortOrder]);

  // تحميل العملاء والفنيين للفلاتر
  useEffect(() => {
    loadFiltersData();
  }, []);

  // تنظيف timeout عند unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const loadFiltersData = async () => {
    try {
      const [customersRes, techniciansRes] = await Promise.all([
        apiService.getCustomers(),
        apiService.getUsers({ role: 'technician' })
      ]);

      setCustomers(Array.isArray(customersRes) ? customersRes : customersRes.data || []);
      setTechnicians(Array.isArray(techniciansRes) ? techniciansRes : techniciansRes.data || []);
    } catch (err) {
      console.warn('Error loading filter data:', err);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setCustomerId('');
    setTechnicianId('');
    setDateFrom('');
    setDateTo('');
    setSortBy('createdAt');
    setSortOrder('DESC');
    setPage(1);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Breadcrumb items={[
                { label: 'الرئيسية', href: '/' },
                { label: 'الإصلاحات', href: '/repairs' },
              ]} />
              <h1 className="text-2xl font-bold text-gray-900">الإصلاحات</h1>
            </div>
          </div>
        </div>
        <SimpleCard>
          <SimpleCardContent>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">جاري تحميل الإصلاحات...</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Breadcrumb items={[
              { label: 'الرئيسية', href: '/' },
              { label: 'الإصلاحات', href: '/repairs' },
            ]} />
            <h1 className="text-2xl font-bold text-gray-900">الإصلاحات</h1>
            <p className="text-sm text-gray-500">إدارة طلبات الإصلاح</p>
          </div>
          <SimpleButton onClick={() => navigate('/repairs/new')}>
            <Plus className="w-4 h-4 ml-2" />
            طلب إصلاح جديد
          </SimpleButton>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">الإجمالي</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-500">في الانتظار</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-500">قيد التنفيذ</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-500">مكتمل</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">{stats.delivered}</div>
            <div className="text-sm text-gray-500">تم التسليم</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <div className="text-sm text-gray-500">ملغي</div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <SimpleCard>
        <SimpleCardHeader>
          <div className="flex items-center justify-between">
            <SimpleCardTitle>قائمة الإصلاحات</SimpleCardTitle>
            <div className="flex items-center gap-2">
              <SimpleButton
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 ml-2" />
                فلاتر
              </SimpleButton>
              <SimpleButton variant="outline" onClick={resetFilters}>
                <RefreshCw className="w-4 h-4 ml-2" />
                إعادة ضبط
              </SimpleButton>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="بحث في الإصلاحات..."
                value={search}
                onChange={handleSearchChange}
                onKeyDown={(e) => {
                  // عند الضغط Enter، تحديث البحث فوراً
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    // إلغاء timeout السابق
                    if (searchTimeoutRef.current) {
                      clearTimeout(searchTimeoutRef.current);
                      searchTimeoutRef.current = null;
                    }
                    // تحديث البحث فوراً - بدون setPage
                    const trimmedSearch = search.trim();
                    isTypingRef.current = false;
                    setDebouncedSearch(trimmedSearch);
                  }
                }}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العميل</label>
                <select
                  value={customerId}
                  onChange={(e) => { setCustomerId(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">جميع العملاء</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الفني</label>
                <select
                  value={technicianId}
                  onChange={(e) => { setTechnicianId(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">جميع الفنيين</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </SimpleCardHeader>

        <SimpleCardContent>
          <DataTable columns={repairColumns} data={repairs}>
            {() => (
              <div className="flex items-center justify-between px-2 mt-4">
                <div className="text-sm text-gray-600">
                  صفحة {page} من {Math.max(1, Math.ceil(totalItems / limit))} - إجمالي {totalItems} عنصر
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={limit}
                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <button
                    className="border rounded px-3 py-1 text-sm disabled:opacity-50"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    السابق
                  </button>
                  <button
                    className="border rounded px-3 py-1 text-sm disabled:opacity-50"
                    disabled={page >= Math.ceil(totalItems / limit)}
                    onClick={() => setPage(p => p + 1)}
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </DataTable>
        </SimpleCardContent>
      </SimpleCard>
    </div>
  );
};

export default RepairsPageEnhanced;
