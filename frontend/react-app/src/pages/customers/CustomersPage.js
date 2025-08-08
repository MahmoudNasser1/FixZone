import React, { useState, useEffect } from 'react';
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
  Eye, Edit, Trash2, Users, UserCheck, UserX, History
} from 'lucide-react';

const CustomersPage = () => {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [error, setError] = useState(null);

  // جلب البيانات من Backend
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getCustomers();
      console.log('Customers loaded:', data);
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('حدث خطأ في تحميل بيانات العملاء');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      try {
        await apiService.deleteCustomer(customerId);
        setCustomers(customers.filter(customer => customer.id !== customerId));
        alert('تم حذف العميل بنجاح');
      } catch (err) {
        console.error('Error deleting customer:', err);
        alert('حدث خطأ في حذف العميل');
      }
    }
  };

  const handleRefresh = () => {
    fetchCustomers();
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
        notifications.success(`تم تفعيل ${selectedIds.length} عميل`, {
          title: 'تم التفعيل'
        });
        console.log('تفعيل العملاء:', selectedIds);
      }
    },
    {
      key: 'deactivate',
      type: 'reject',
      label: 'إلغاء التفعيل',
      handler: (selectedIds) => {
        notifications.warning(`تم إلغاء تفعيل ${selectedIds.length} عميل`, {
          title: 'تم إلغاء التفعيل'
        });
        console.log('إلغاء تفعيل العملاء:', selectedIds);
      }
    },
    {
      key: 'export',
      type: 'export',
      label: 'تصدير',
      handler: (selectedIds) => {
        notifications.info(`جاري تصدير بيانات ${selectedIds.length} عميل...`, {
          title: 'جاري التصدير'
        });
        console.log('تصدير العملاء:', selectedIds);
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
        notifications.success(`تم حذف ${selectedIds.length} عميل`, {
          title: 'تم الحذف'
        });
        // هنا يمكن إضافة منطق الحذف الفعلي
        console.log('حذف العملاء:', selectedIds);
      }
    }
  ];

  // دوال عرض البيانات
  const renderCard = (customer) => {
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
      <CustomerStatsCard
        customer={customer}
        onClick={() => navigate(`/customers/${customer.id}`)}
        className="cursor-pointer hover:shadow-md transition-shadow"
      />
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
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
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
  });

  // حساب الإحصائيات
  const stats = {
    total: customers.length,
    vip: customers.filter(customer => {
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
    }).length,
    active: customers.filter(customer => customer.status === 'active').length,
    inactive: customers.filter(customer => customer.status === 'inactive').length
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

            <div className="flex items-center space-x-2 space-x-reverse">
              <SimpleButton variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 ml-2" />
                تحديث
              </SimpleButton>
              <SimpleButton variant="outline" size="sm">
                <Download className="w-4 h-4 ml-2" />
                تصدير
              </SimpleButton>
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
        onItemClick={(customer) => navigate(`/customers/${customer.id}`)}
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
