import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleBadge from '../../components/ui/SimpleBadge';
import CustomerStatsCard from '../../components/ui/CustomerStatsCard';
import DataView from '../../components/ui/DataView';
import { Input } from '../../components/ui/Input';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { 
  Plus, Search, Filter, Download, RefreshCw, Building2,
  User, Phone, Mail, MapPin, Calendar, MoreHorizontal,
  Eye, Edit, Trash2, Users, UserCheck, UserX, History,
  Upload, File
} from 'lucide-react';

const CustomersPage = () => {
  const navigate = useNavigate();
  const notifications = useNotifications();
  // مساعد تنبيهات بسيط لتقليل الإزعاج وتجنب التكرار السريع
  const notify = (() => {
    let last = { msg: null, ts: 0 };
    return (type, message, { dedupeMs = 1500, options = {} } = {}) => {
      const now = Date.now();
      if (message === last.msg && now - last.ts < dedupeMs) return;
      // استخدم المساعدات إن وجدت، وإلا fallback إلى addNotification({})
      const fn = notifications?.[type];
      if (typeof fn === 'function') {
        fn(message, options);
      } else if (typeof notifications?.addNotification === 'function') {
        notifications.addNotification({ type, message, ...options });
      }
      last = { msg: message, ts: now };
    };
  })();
  const [customers, setCustomers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [error, setError] = useState(null);

  // جلب البيانات من Backend
  useEffect(() => {
    fetchCustomers();
    fetchCompanies();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getCustomers();
      console.log('Customers response:', response);
      
      // التأكد من أن البيانات هي array
      let customersData = [];
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          customersData = data;
        } else if (data && Array.isArray(data.data)) {
          customersData = data.data;
        } else if (data && data.customers && Array.isArray(data.customers)) {
          customersData = data.customers;
        }
      } else {
        throw new Error('Failed to fetch customers');
      }
      
      console.log('Customers loaded:', customersData);
      setCustomers(customersData);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('حدث خطأ في تحميل بيانات العملاء');
      setCustomers([]); // تأكد من أن customers هو array فارغ في حالة الخطأ
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await apiService.getCompanies();
      if (response.ok) {
        const companiesData = await response.json();
        setCompanies(companiesData);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  // قالب CSV للتنزيل
  const handleDownloadCSVTemplate = () => {
    const headers = ['name','phone','email','company','status','address'];
    const csv = headers.join(',') + '\n';
    downloadFile(csv, 'customers_template.csv', 'text/csv;charset=utf-8;');
    // لا حاجة لتنبيه هنا لتقليل الضوضاء
  };

  // قائمة إجراءات الشريط
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef(null);
  const toggleActions = () => setActionsOpen(v => !v);
  const closeActions = () => setActionsOpen(false);

  // حذف عميل
  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      try {
        await apiService.delete(`/customers/${customerId}`);
        setCustomers(prevCustomers => (prevCustomers || []).filter(customer => customer.id !== customerId));
        notify('success', 'تم حذف العميل بنجاح');
      } catch (error) {
        console.error('Error deleting customer:', error);
        notify('error', 'خطأ في حذف العميل');
      }
    }
  };

  // تعديل عميل
  const handleEditCustomer = (customer) => {
    navigate(`/customers/${customer.id}/edit`);
  };

  // عرض تفاصيل عميل
  const handleViewCustomer = (customer) => {
    navigate(`/customers/${customer.id}`);
  };

  // نقر على عميل
  const handleCustomerClick = (customer) => {
    navigate(`/customers/${customer.id}`);
  };

  const handleRefresh = () => {
    fetchCustomers();
  };
  // إغلاق قائمة الإجراءات عند النقر خارجها
  useEffect(() => {
    const handler = (e) => {
      if (actionsRef?.current && !actionsRef.current.contains(e.target)) {
        closeActions();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // تصدير العملاء
  const downloadFile = (content, filename, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = (rows) => {
    const headers = ['id','name','phone','email','company','status','address','createdAt'];
    const escape = (v) => {
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const lines = [headers.join(',')].concat(
      rows.map(r => headers.map(h => escape(r[h])).join(','))
    );
    return lines.join('\n');
  };

  const handleExportCSV = () => {
    try {
      const csv = exportToCSV(filteredCustomers);
      downloadFile(csv, `customers_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv;charset=utf-8;');
      // تصدير ناجح بلا تنبيه لتقليل الإزعاج
    } catch (e) {
      console.error(e);
      notify('error', 'فشل تصدير CSV');
    }
  };

  const handleExportJSON = () => {
    try {
      const data = JSON.stringify(filteredCustomers, null, 2);
      downloadFile(data, `customers_${new Date().toISOString().slice(0,10)}.json`, 'application/json');
      // تصدير ناجح بلا تنبيه لتقليل الإزعاج
    } catch (e) {
      console.error(e);
      notify('error', 'فشل تصدير JSON');
    }
  };

  // استيراد العملاء
  const fileInputRef = useRef(null);
  const handleImportClick = () => fileInputRef.current?.click();

  const parseCSV = async (file) => {
    const text = await file.text();
    const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
    const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g,''));
    return lines.map(line => {
      // naive CSV split (supports quoted values)
      const values = [];
      let cur = '', inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i+1] === '"') { cur += '"'; i++; }
          else { inQuotes = !inQuotes; }
        } else if (ch === ',' && !inQuotes) {
          values.push(cur); cur = '';
        } else {
          cur += ch;
        }
      }
      values.push(cur);
      const obj = {};
      headers.forEach((h, idx) => obj[h] = values[idx]?.replace(/^\s*|\s*$/g,'') || null);
      return obj;
    });
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      let items = [];
      if (file.name.endsWith('.json')) {
        items = JSON.parse(await file.text());
      } else if (file.name.endsWith('.csv')) {
        items = await parseCSV(file);
      } else {
        notify('warning', 'نوع الملف غير مدعوم. استخدم CSV أو JSON');
        return;
      }

      // إنشاء العملاء عبر API إن أمكن، وإلا تحديث الحالة محلياً
      let created = 0;
      let failed = 0;
      for (const it of items) {
        try {
          // تجهيز الحقول الأساسية فقط
          const payload = {
            name: it.name || it.fullName || 'بدون اسم',
            phone: it.phone || it.mobile || '',
            email: it.email || '',
            company: it.company || '',
            status: it.status === 'inactive' ? 'inactive' : 'active',
            address: it.address || '',
          };
          if (apiService?.post) {
            await apiService.post('/customers', payload);
          }
          created++;
        } catch (err) {
          console.warn('Import item failed', err);
          failed++;
        }
      }
      notify('success', `تم استيراد ${created} عميل`);
      if (failed > 0) {
        notify('warning', `تعذر استيراد ${failed} سجل`);
      }
      await fetchCustomers();
    } catch (err) {
      console.error(err);
      notify('error', 'فشل استيراد العملاء');
    } finally {
      e.target.value = '';
    }
  };

  // تعريف الأعمدة للجدول
  const columns = [
    {
      id: 'name',
      key: 'name',
      header: 'الاسم',
      label: 'الاسم',
      description: 'اسم العميل',
      defaultVisible: true,
      accessorKey: 'name',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">{customer.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{customer.company || 'عميل فردي'}</div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'contact',
      key: 'contact',
      header: 'معلومات الاتصال',
      label: 'معلومات الاتصال',
      description: 'رقم الهاتف والبريد الإلكتروني',
      defaultVisible: true,
      accessorKey: 'phone',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-3 h-3 text-gray-400" />
              <span className="text-gray-900 dark:text-gray-100">{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-3 h-3 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">{customer.email}</span>
              </div>
            )}
          </div>
        );
      }
    },
    {
      id: 'address',
      key: 'address',
      header: 'العنوان',
      label: 'العنوان',
      description: 'عنوان العميل',
      defaultVisible: false,
      accessorKey: 'address',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-3 h-3" />
            <span>{customer.address || 'غير محدد'}</span>
          </div>
        );
      }
    },
    {
      id: 'status',
      key: 'status',
      header: 'الحالة',
      label: 'الحالة',
      description: 'حالة العميل',
      defaultVisible: true,
      accessorKey: 'status',
      cell: ({ row }) => {
        const customer = row.original;
        const customFields = (() => {
          try {
            return typeof customer.customFields === 'string' 
              ? JSON.parse(customer.customFields) 
              : customer.customFields || {};
          } catch {
            return {};
          }
        })();
        
        return (
          <div className="flex items-center gap-2">
            <SimpleBadge 
              variant={customer.status === 'active' ? 'success' : 'secondary'}
              className="text-xs"
            >
              {customer.status === 'active' ? 'نشط' : 'غير نشط'}
            </SimpleBadge>
            {customFields.isVip && (
              <SimpleBadge variant="warning" className="text-xs">
                VIP
              </SimpleBadge>
            )}
          </div>
        );
      }
    },
    {
      id: 'createdAt',
      key: 'createdAt',
      header: 'تاريخ التسجيل',
      label: 'تاريخ التسجيل',
      description: 'تاريخ إنشاء الحساب',
      defaultVisible: false,
      accessorKey: 'createdAt',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>{new Date(customer.createdAt).toLocaleDateString('ar-SA')}</span>
          </div>
        );
      }
    },
    {
      id: 'actions',
      key: 'actions',
      header: 'الإجراءات',
      label: 'الإجراءات',
      description: 'إجراءات العميل',
      defaultVisible: true,
      enableSorting: false,
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center gap-1">
            <SimpleButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/customers/${customer.id}`);
              }}
              className="h-8 w-8 p-0"
            >
              <Eye className="w-4 h-4" />
            </SimpleButton>
            <SimpleButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/customers/${customer.id}/edit`);
              }}
              className="h-8 w-8 p-0"
            >
              <Edit className="w-4 h-4" />
            </SimpleButton>
            <SimpleButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCustomer(customer.id);
              }}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
            >
              <Trash2 className="w-4 h-4" />
            </SimpleButton>
          </div>
        );
      }
    }
  ];

  // الإجراءات المجمعة
  const bulkActions = [
    {
      key: 'activate',
      type: 'approve',
      label: 'تفعيل',
      handler: (selectedIds) => {
        if (!selectedIds || selectedIds.length === 0) {
          notify('warning', 'لم تقم بتحديد أي عميل');
          return;
        }
        notify('success', `تم تفعيل ${selectedIds.length} عميل`);
        console.log('تفعيل العملاء:', selectedIds);
      }
    },
    {
      key: 'deactivate',
      type: 'reject',
      label: 'إلغاء التفعيل',
      handler: (selectedIds) => {
        if (!selectedIds || selectedIds.length === 0) {
          notify('warning', 'لم تقم بتحديد أي عميل');
          return;
        }
        notify('warning', `تم إلغاء تفعيل ${selectedIds.length} عميل`);
        console.log('إلغاء تفعيل العملاء:', selectedIds);
      }
    },
    {
      key: 'export',
      type: 'export',
      label: 'تصدير',
      handler: (selectedIds) => {
        try {
          if (!selectedIds || selectedIds.length === 0) {
            notify('warning', 'لم تقم بتحديد أي عميل');
            return;
          }
          const rows = Array.isArray(customers) ? customers.filter(c => selectedIds.includes(c.id)) : [];
          const csv = exportToCSV(rows);
          downloadFile(csv, `customers_selected_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv;charset=utf-8;');
          // تصدير المحددين: بدون تنبيه لتقليل الإزعاج
        } catch (e) {
          console.error(e);
          notify('error', 'فشل تصدير العملاء المحددين');
        }
      }
    },
    {
      key: 'delete',
      type: 'delete',
      label: 'حذف',
      requiresConfirmation: true,
      confirmMessage: 'هل أنت متأكد من حذف العملاء المحددين؟ هذا الإجراء لا يمكن التراجع عنه.',
      confirmLabel: 'حذف',
      handler: (selectedIds) => {
        if (!selectedIds || selectedIds.length === 0) {
          notify('warning', 'لم تقم بتحديد أي عميل');
          return;
        }
        notify('success', `تم حذف ${selectedIds.length} عميل`);
        // هنا يمكن إضافة منطق الحذف الفعلي
        console.log('حذف العملاء:', selectedIds);
      }
    }
  ];

  // دوال عرض البيانات
  const renderCard = (customer, { columns } = {}) => {
    const customFields = (() => {
      try {
        return typeof customer.customFields === 'string' 
          ? JSON.parse(customer.customFields) 
          : customer.customFields || {};
      } catch {
        return {};
      }
    })();
    
    // احترم الأعمدة المرئية القادمة من DataView عند توفرها
    const visibleKeys = Array.isArray(columns)
      ? columns.map(c => c.accessorKey || c.key)
      : null;
    const show = (key) => !visibleKeys || visibleKeys.includes(key);

    // بطاقة مخصصة تعرض الاسم ورقم الجوال بشكل واضح
    return (
      <div
        className="flex items-start justify-between w-full"
        onClick={() => navigate(`/customers/${customer.id}`)}
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mt-0.5">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            {show('name') && (
              <div className="font-medium text-gray-900 dark:text-gray-100 text-base">
                {customer.name || 'بدون اسم'}
              </div>
            )}
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
              {show('contact') && customer.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {customer.phone}
                </span>
              )}
              {show('contact') && customer.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {customer.email}
                </span>
              )}
            </div>
            {show('name') && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {customer.companyId ? 
                  (companies.find(c => c.id.toString() === customer.companyId.toString())?.name || `شركة (ID: ${customer.companyId})`) 
                  : 'عميل فردي'
                }
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {show('status') && (
            <SimpleBadge 
              variant={customer.status === 'active' ? 'success' : 'secondary'}
              className="text-xs"
            >
              {customer.status === 'active' ? 'نشط' : 'غير نشط'}
            </SimpleBadge>
          )}
          {customFields.isVip && (
            <SimpleBadge variant="warning" className="text-xs">
              VIP
            </SimpleBadge>
          )}
        </div>
      </div>
    );
  };

  const renderListItem = (customer) => {
    const customFields = (() => {
      try {
        return typeof customer.customFields === 'string' 
          ? JSON.parse(customer.customFields) 
          : customer.customFields || {};
      } catch {
        return {};
      }
    })();

    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{customer.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {customer.phone} • {customer.company || 'عميل فردي'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <SimpleBadge 
              variant={customer.status === 'active' ? 'success' : 'secondary'}
              className="text-xs"
            >
              {customer.status === 'active' ? 'نشط' : 'غير نشط'}
            </SimpleBadge>
            {customFields.isVip && (
              <SimpleBadge variant="warning" className="text-xs">
                VIP
              </SimpleBadge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <SimpleButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/customers/${customer.id}`);
              }}
              className="h-8 w-8 p-0"
            >
              <Eye className="w-4 h-4" />
            </SimpleButton>
            <SimpleButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/customers/${customer.id}/edit`);
              }}
              className="h-8 w-8 p-0"
            >
              <Edit className="w-4 h-4" />
            </SimpleButton>
          </div>
        </div>
      </div>
    );
  };

  const renderGridItem = (customer) => {
    const customFields = (() => {
      try {
        return typeof customer.customFields === 'string' 
          ? JSON.parse(customer.customFields) 
          : customer.customFields || {};
      } catch {
        return {};
      }
    })();

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
            <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="font-medium text-gray-900 dark:text-gray-100 mb-1 truncate">
            {customer.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
            {customer.phone}
          </div>
          <div className="flex items-center justify-center gap-1">
            <SimpleBadge 
              variant={customer.status === 'active' ? 'success' : 'secondary'}
              className="text-xs"
            >
              {customer.status === 'active' ? 'نشط' : 'غير نشط'}
            </SimpleBadge>
            {customFields.isVip && (
              <SimpleBadge variant="warning" className="text-xs">
                VIP
              </SimpleBadge>
            )}
          </div>
        </div>
      </div>
    );
  };

  // فلترة العملاء
        const filteredCustomers = Array.isArray(customers) ? customers.filter(customer => {
    const customerName = customer.name || (customer.firstName && customer.lastName ? `${customer.firstName} ${customer.lastName}` : '');
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer.phone && customer.phone.includes(searchTerm)) ||
                         (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'vip') {
      const customFields = (() => {
        try {
          return typeof customer.customFields === 'string' 
            ? JSON.parse(customer.customFields) 
            : customer.customFields || {};
        } catch {
          return {};
        }
      })();
      return matchesSearch && customFields.isVip;
    }
    if (selectedFilter === 'active') return matchesSearch && customer.status === 'active';
    if (selectedFilter === 'inactive') return matchesSearch && customer.status === 'inactive';
    
    return matchesSearch;
  }) : [];

  // حساب الإحصائيات
  const stats = {
          total: Array.isArray(customers) ? customers.length : 0,
            vip: Array.isArray(customers) ? customers.filter(customer => {
      const customFields = (() => {
        try {
          return typeof customer.customFields === 'string' 
            ? JSON.parse(customer.customFields) 
            : customer.customFields || {};
        } catch {
          return {};
        }
      })();
      return customFields.isVip;
    }).length : 0,
          active: Array.isArray(customers) ? customers.filter(customer => customer.status === 'active').length : 0,
      inactive: Array.isArray(customers) ? customers.filter(customer => customer.status === 'inactive').length : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل بيانات العملاء...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">إدارة العملاء</h1>
        <Link to="/customers/new">
          <SimpleButton className="flex items-center space-x-2 space-x-reverse">
            <Plus className="w-4 h-4" />
            <span>عميل جديد</span>
          </SimpleButton>
        </Link>
      </div>

      {/* رسالة الخطأ */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي العملاء</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">عملاء VIP</p>
                <p className="text-2xl font-bold text-gray-900">{stats.vip}</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">نشط</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">غير نشط</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>

      {/* أدوات البحث والفلترة */}
      <SimpleCard>
        <SimpleCardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في العملاء... (الاسم، الهاتف، البريد الإلكتروني)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 w-64"
                />
              </div>
              
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع العملاء</option>
                <option value="vip">عملاء VIP</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
            <div className="relative" ref={actionsRef}>
              <input
                type="file"
                accept=".csv,.json"
                ref={fileInputRef}
                onChange={handleImportFile}
                className="hidden"
              />
              <SimpleButton variant="outline" size="sm" onClick={toggleActions}>
                <MoreHorizontal className="w-4 h-4 ml-2" />
                الإجراءات
              </SimpleButton>
              {actionsOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                  <button className="w-full flex items-center px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => { handleRefresh(); closeActions(); }}>
                    <RefreshCw className="w-4 h-4 ml-2" /> تحديث
                  </button>
                  <button className="w-full flex items-center px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => { handleImportClick(); closeActions(); }}>
                    <Upload className="w-4 h-4 ml-2" /> استيراد CSV/JSON
                  </button>
                  <button className="w-full flex items-center px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => { handleExportCSV(); closeActions(); }}>
                    <Download className="w-4 h-4 ml-2" /> تصدير CSV (المعروض)
                  </button>
                  <button className="w-full flex items-center px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => { handleExportJSON(); closeActions(); }}>
                    <File className="w-4 h-4 ml-2" /> تصدير JSON (المعروض)
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700" />
                  <button className="w-full flex items-center px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => { handleDownloadCSVTemplate(); closeActions(); }}>
                    <Download className="w-4 h-4 ml-2" /> تنزيل قالب CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* عرض البيانات بأنماط مختلفة */}
      <DataView
        data={filteredCustomers}
        columns={columns}
        viewModes={['cards', 'table', 'list', 'grid']}
        defaultViewMode="cards"
        enableBulkActions={true}
        enableColumnToggle={true}
        bulkActions={bulkActions}
        storageKey="customers"
        renderCard={renderCard}
        renderListItem={renderListItem}
        renderGridItem={renderGridItem}
        onItemClick={handleCustomerClick}
        onEdit={handleEditCustomer}
        onView={handleViewCustomer}
        loading={loading}
        emptyState={
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">لا توجد عملاء</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">ابدأ بإضافة عميل جديد للنظام</p>
            <Link to="/customers/new">
              <SimpleButton>
                <Plus className="w-4 h-4 ml-2" />
                إضافة عميل جديد
              </SimpleButton>
            </Link>
          </div>
        }
      />
    </div>
  );
};

export default CustomersPage;
