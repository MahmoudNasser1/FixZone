import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Form } from '../../components/ui/Form';
import { Alert } from '../../components/ui/Alert';
import apiService from '../../services/api';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Building2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Eye,
  Download
} from 'lucide-react';

const ChartOfAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    accountType: '',
    isActive: ''
  });

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, [filters]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });

      const data = await apiService.request(`/accounting/accounts?${queryParams}`);
      
      if (data.success) {
        setAccounts(data.data.accounts || []);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await apiService.request('/accounting/account-categories');
      
      if (data.success) {
        setCategories(data.data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreateAccount = async (formData) => {
    try {
      const data = await apiService.request('/accounting/accounts', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      
      if (data.success) {
        setShowForm(false);
        fetchAccounts();
        // إشعار نجاح
      } else {
        // إشعار خطأ
        console.error('Error creating account:', data.error);
      }
    } catch (error) {
      console.error('Error creating account:', error);
    }
  };

  const handleUpdateAccount = async (formData) => {
    try {
      const data = await apiService.request(`/accounting/accounts/${editingAccount.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      
      if (data.success) {
        setShowForm(false);
        setEditingAccount(null);
        fetchAccounts();
        // إشعار نجاح
      } else {
        // إشعار خطأ
        console.error('Error updating account:', data.error);
      }
    } catch (error) {
      console.error('Error updating account:', error);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الحساب؟')) {
      return;
    }

    try {
      const data = await apiService.request(`/accounting/accounts/${accountId}`, {
        method: 'DELETE',
      });
      
      if (data.success) {
        fetchAccounts();
        // إشعار نجاح
      } else {
        // إشعار خطأ
        alert(data.error.message);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const accountTypeLabels = {
    asset: 'أصول',
    liability: 'خصوم',
    equity: 'حقوق ملكية',
    revenue: 'إيرادات',
    expense: 'مصروفات',
    cogs: 'تكلفة البضاعة المباعة'
  };

  const accountTypeIcons = {
    asset: Building2,
    liability: TrendingDown,
    equity: Target,
    revenue: TrendingUp,
    expense: TrendingDown,
    cogs: DollarSign
  };

  const accountTypeColors = {
    asset: 'bg-blue-100 text-blue-800',
    liability: 'bg-red-100 text-red-800',
    equity: 'bg-purple-100 text-purple-800',
    revenue: 'bg-green-100 text-green-800',
    expense: 'bg-orange-100 text-orange-800',
    cogs: 'bg-yellow-100 text-yellow-800'
  };

  const columns = [
    {
      accessorKey: 'code',
      header: 'كود الحساب',
      cell: ({ getValue }) => (
        <div className="font-mono font-medium">{getValue()}</div>
      )
    },
    {
      accessorKey: 'name',
      header: 'اسم الحساب',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          {row.original.nameEn && (
            <div className="text-sm text-gray-500">{row.original.nameEn}</div>
          )}
        </div>
      )
    },
    {
      accessorKey: 'accountType',
      header: 'نوع الحساب',
      cell: ({ getValue }) => {
        const value = getValue();
        const Icon = accountTypeIcons[value];
        return (
          <Badge className={accountTypeColors[value]}>
            {Icon ? <Icon className="w-3 h-3 ml-1" /> : null}
            {accountTypeLabels[value]}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'categoryName',
      header: 'الفئة',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">{getValue()}</span>
      )
    },
    {
      accessorKey: 'normalBalance',
      header: 'الرصيد الطبيعي',
      cell: ({ getValue }) => {
        const value = getValue();
        return (
          <Badge variant={value === 'debit' ? 'default' : 'secondary'}>
            {value === 'debit' ? 'مدين' : 'دائن'}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'currentBalance',
      header: 'الرصيد الحالي',
      cell: ({ getValue }) => (
        <div className="text-left font-mono">
          {parseFloat(getValue() || 0).toLocaleString()} ج.م
        </div>
      )
    },
    {
      accessorKey: 'isActive',
      header: 'الحالة',
      cell: ({ getValue }) => {
        const value = !!getValue();
        return (
          <Badge variant={value ? 'success' : 'secondary'}>
            {value ? 'نشط' : 'غير نشط'}
          </Badge>
        );
      }
    }
  ];

  const actions = [
    {
      label: 'عرض',
      icon: Eye,
      onClick: (row) => {
        // فتح صفحة تفاصيل الحساب
        console.log('View account:', row);
      },
      variant: 'ghost'
    },
    {
      label: 'تعديل',
      icon: Edit,
      onClick: (row) => {
        setEditingAccount(row);
        setShowForm(true);
      },
      variant: 'ghost'
    },
    {
      label: 'حذف',
      icon: Trash2,
      onClick: (row) => handleDeleteAccount(row.id),
      variant: 'ghost',
      className: 'text-red-600 hover:text-red-700'
    }
  ];

  const formFields = [
    {
      name: 'code',
      label: 'كود الحساب',
      type: 'text',
      required: true,
      placeholder: 'مثال: 1001'
    },
    {
      name: 'name',
      label: 'اسم الحساب (عربي)',
      type: 'text',
      required: true,
      placeholder: 'مثال: النقدية بالصندوق'
    },
    {
      name: 'nameEn',
      label: 'اسم الحساب (إنجليزي)',
      type: 'text',
      placeholder: 'Cash on Hand'
    },
    {
      name: 'categoryId',
      label: 'فئة الحساب',
      type: 'select',
      required: true,
      options: categories.map(cat => ({
        value: cat.id,
        label: cat.name
      }))
    },
    {
      name: 'accountType',
      label: 'نوع الحساب',
      type: 'select',
      required: true,
      options: Object.keys(accountTypeLabels).map(key => ({
        value: key,
        label: accountTypeLabels[key]
      }))
    },
    {
      name: 'normalBalance',
      label: 'الرصيد الطبيعي',
      type: 'select',
      required: true,
      options: [
        { value: 'debit', label: 'مدين' },
        { value: 'credit', label: 'دائن' }
      ]
    },
    {
      name: 'parentId',
      label: 'الحساب الأب',
      type: 'select',
      options: accounts
        .filter(acc => acc.id !== editingAccount?.id)
        .map(acc => ({
          value: acc.id,
          label: `${acc.code} - ${acc.name}`
        }))
    },
    {
      name: 'isActive',
      label: 'نشط',
      type: 'checkbox',
      defaultValue: true
    },
    {
      name: 'description',
      label: 'الوصف',
      type: 'textarea',
      placeholder: 'وصف اختياري للحساب'
    }
  ];

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">دليل الحسابات</h1>
          <p className="text-gray-600 mt-1">إدارة شجرة الحسابات المحاسبية</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 ml-2" />
            تصدير
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 ml-2" />
            حساب جديد
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="البحث في الحسابات..."
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.categoryId}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            >
              <option value="">جميع الفئات</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.accountType}
              onChange={(e) => setFilters({ ...filters, accountType: e.target.value })}
            >
              <option value="">جميع الأنواع</option>
              {Object.keys(accountTypeLabels).map(type => (
                <option key={type} value={type}>
                  {accountTypeLabels[type]}
                </option>
              ))}
            </select>

            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
            >
              <option value="">جميع الحالات</option>
              <option value="true">نشط</option>
              <option value="false">غير نشط</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="w-5 h-5 ml-2" />
            الحسابات ({accounts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={accounts}
            columns={columns}
            actions={actions}
            loading={loading}
            emptyMessage="لا توجد حسابات"
            searchable={false}
            pagination={true}
          />
        </CardContent>
      </Card>

      {/* Account Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {editingAccount ? 'تعديل الحساب' : 'إضافة حساب جديد'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setEditingAccount(null);
                }}
              >
                ×
              </Button>
            </div>

            <Form
              fields={formFields}
              initialData={editingAccount}
              onSubmit={editingAccount ? handleUpdateAccount : handleCreateAccount}
              submitLabel={editingAccount ? 'تحديث' : 'إضافة'}
              cancelLabel="إلغاء"
              onCancel={() => {
                setShowForm(false);
                setEditingAccount(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccounts;
