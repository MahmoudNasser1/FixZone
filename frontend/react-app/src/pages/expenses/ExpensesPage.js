import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleBadge from '../../components/ui/SimpleBadge';
import DataView from '../../components/ui/DataView';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/Select';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import LoadingSpinner, { TableLoadingSkeleton, CardLoadingSkeleton } from '../../components/ui/LoadingSpinner';
import ExpenseForm from './ExpenseForm';
import {
  Plus, Search, Filter, Download, RefreshCw,
  DollarSign, Calendar, Tag, Building2, Receipt,
  Eye, Edit, Trash2, TrendingUp, TrendingDown,
  ArrowUpDown, ArrowUp, ArrowDown, FileText, X,
  Wrench, MapPin
} from 'lucide-react';

const ExpensesPage = () => {
  const navigate = useNavigate();
  const notifications = useNotifications();

  // مساعد تنبيهات بسيط لتقليل الإزعاج
  const notify = useCallback((type, message) => {
    if (notifications?.addNotification) {
      notifications.addNotification({ type, message });
    } else if (notifications?.[type]) {
      notifications[type](message);
    }
  }, [notifications]);

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Sorting state
  const [sortField, setSortField] = useState('expenseDate');
  const [sortDirection, setSortDirection] = useState('desc');

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Stats state
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalAmount: 0,
    averageAmount: 0,
    todayExpenses: 0,
    todayAmount: 0
  });

  // جلب البيانات
  useEffect(() => {
    loadInitialData();
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    fetchExpenses();
  }, [currentPage, itemsPerPage, selectedCategory, selectedVendor, dateFrom, dateTo, sortField, sortDirection, searchTerm]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadCategories(),
        loadVendors(),
        fetchExpenses(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      notify('error', 'خطأ في تحميل البيانات');
    }
  };

  const loadCategories = async () => {
    try {
      const data = await apiService.getExpenseCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading categories:', error);
      notify('error', 'خطأ في تحميل الفئات');
    }
  };

  const loadVendors = async () => {
    try {
      // Try multiple API methods
      let response;
      try {
        response = await apiService.request('/vendors?status=active&limit=100');
      } catch (e) {
        // Fallback: try vendorService if available
        try {
          const vendorService = await import('../../services/vendorService');
          const result = await vendorService.default.getAllVendors({ status: 'active', limit: 100 });
          response = result?.data || result;
        } catch (e2) {
          response = null;
        }
      }

      if (Array.isArray(response)) {
        setVendors(response);
      } else if (response?.vendors) {
        setVendors(response.vendors);
      } else if (response?.data?.vendors) {
        setVendors(response.data.vendors);
      } else if (response?.data && Array.isArray(response.data)) {
        setVendors(response.data);
      }
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: itemsPerPage
      };

      if (selectedCategory) {
        params.categoryId = selectedCategory;
      }

      if (selectedVendor) {
        params.vendorId = selectedVendor;
      }

      if (dateFrom) {
        params.dateFrom = dateFrom;
      }

      if (dateTo) {
        params.dateTo = dateTo;
      }

      // Search in description (server-side via 'q' parameter)
      if (searchTerm && searchTerm.trim()) {
        params.q = searchTerm.trim();
      }

      const response = await apiService.getExpenses(params);

      let expensesData = [];
      let totalCount = 0;

      if (response?.success && response?.data && Array.isArray(response.data)) {
        expensesData = response.data;
        totalCount = response.pagination?.total || 0;
      } else if (Array.isArray(response)) {
        expensesData = response;
        totalCount = response.length;
      } else if (response?.data && Array.isArray(response.data)) {
        expensesData = response.data;
        totalCount = response.pagination?.total || 0;
      }

      // Note: Search is now handled server-side via 'q' parameter
      // Client-side search is removed to use backend search instead

      // Client-side sorting
      if (sortField) {
        expensesData.sort((a, b) => {
          let aValue = a[sortField];
          let bValue = b[sortField];

          if (sortField === 'amount') {
            aValue = parseFloat(aValue) || 0;
            bValue = parseFloat(bValue) || 0;
          } else if (sortField === 'expenseDate') {
            aValue = new Date(aValue || 0).getTime();
            bValue = new Date(bValue || 0).getTime();
          } else if (typeof aValue === 'string' && typeof bValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
          }

          if (aValue < bValue) {
            return sortDirection === 'asc' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortDirection === 'asc' ? 1 : -1;
          }
          return 0;
        });
      }

      setExpenses(expensesData);
      setTotalItems(totalCount);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('حدث خطأ في تحميل بيانات المصروفات');
      setExpenses([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const params = {};
      if (selectedCategory) params.categoryId = selectedCategory;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const response = await apiService.getExpenseStats(params);

      if (response?.success && response?.data) {
        const summary = response.data.summary || {};
        setStats({
          totalExpenses: summary.totalExpenses || 0,
          totalAmount: parseFloat(summary.totalAmount || 0),
          averageAmount: parseFloat(summary.averageAmount || 0),
          todayExpenses: summary.todayExpenses || 0,
          todayAmount: parseFloat(summary.todayAmount || 0)
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Handle create expense
  const handleCreateExpense = () => {
    setEditingExpense(null);
    setIsFormModalOpen(true);
  };

  // Handle edit expense
  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setIsFormModalOpen(true);
  };

  // Handle delete expense
  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      return;
    }

    try {
      await apiService.deleteExpense(expenseId);
      notify('success', 'تم حذف المصروف بنجاح');
      fetchExpenses();
      fetchStats();
    } catch (error) {
      console.error('Error deleting expense:', error);
      notify('error', 'خطأ في حذف المصروف');
    }
  };

  // Handle form success
  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    setEditingExpense(null);
    fetchExpenses();
    fetchStats();
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Render sort icon
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ?
      <ArrowUp className="w-4 h-4 text-blue-600" /> :
      <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedVendor('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  // Columns definition for DataView
  const columns = [
    {
      id: 'expenseDate',
      key: 'expenseDate',
      header: (
        <button
          onClick={() => handleSort('expenseDate')}
          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
        >
          التاريخ
          {renderSortIcon('expenseDate')}
        </button>
      ),
      label: 'التاريخ',
      description: 'تاريخ المصروف',
      defaultVisible: true,
      accessorKey: 'expenseDate',
      cell: ({ row }) => {
        const expense = row.original;
        return (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">
              {expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString('ar-EG') : '-'}
            </span>
          </div>
        );
      }
    },
    {
      id: 'category',
      key: 'category',
      header: (
        <button
          onClick={() => handleSort('categoryName')}
          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
        >
          الفئة
          {renderSortIcon('categoryName')}
        </button>
      ),
      label: 'الفئة',
      description: 'فئة المصروف',
      defaultVisible: true,
      accessorKey: 'categoryName',
      cell: ({ row }) => {
        const expense = row.original;
        return (
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <SimpleBadge variant="secondary" className="text-xs">
              {expense.categoryName || 'غير محدد'}
            </SimpleBadge>
          </div>
        );
      }
    },
    {
      id: 'amount',
      key: 'amount',
      header: (
        <button
          onClick={() => handleSort('amount')}
          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
        >
          المبلغ
          {renderSortIcon('amount')}
        </button>
      ),
      label: 'المبلغ',
      description: 'مبلغ المصروف',
      defaultVisible: true,
      accessorKey: 'amount',
      cell: ({ row }) => {
        const expense = row.original;
        const amount = parseFloat(expense.amount || 0);
        return (
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-error" />
            <span className="font-semibold text-error">
              {amount.toFixed(2)} ج.م
            </span>
          </div>
        );
      }
    },
    {
      id: 'vendor',
      key: 'vendor',
      header: 'المورد',
      label: 'المورد',
      description: 'المورد',
      defaultVisible: true,
      accessorKey: 'vendorName',
      cell: ({ row }) => {
        const expense = row.original;
        return expense.vendorName ? (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{expense.vendorName}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        );
      }
    },
    {
      id: 'description',
      key: 'description',
      header: 'الوصف',
      label: 'الوصف',
      description: 'وصف المصروف',
      defaultVisible: true,
      accessorKey: 'description',
      cell: ({ row }) => {
        const expense = row.original;
        return (
          <div className="max-w-xs">
            <p className="text-sm text-muted-foreground truncate">
              {expense.description || 'لا يوجد وصف'}
            </p>
          </div>
        );
      }
    },
    {
      id: 'invoice',
      key: 'invoice',
      header: 'فاتورة الشراء',
      label: 'فاتورة الشراء',
      description: 'فاتورة الشراء المرتبطة',
      defaultVisible: false,
      accessorKey: 'invoiceNumber',
      cell: ({ row }) => {
        const expense = row.original;
        return expense.invoiceNumber ? (
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">#{expense.invoiceNumber}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        );
      }
    },
    {
      id: 'repair',
      key: 'repair',
      header: 'طلب الإصلاح',
      label: 'طلب الإصلاح',
      description: 'طلب الإصلاح المرتبط',
      defaultVisible: false,
      accessorKey: 'repairRequestId',
      cell: ({ row }) => {
        const expense = row.original;
        return expense.repairRequestId ? (
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-400" />
            <button
              className="text-sm text-blue-600 hover:underline cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/repairs/${expense.repairRequestId}`);
              }}
            >
              {expense.repairTrackingToken || `طلب #${expense.repairRequestId}`}
            </button>
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        );
      }
    },
    {
      id: 'branch',
      key: 'branch',
      header: 'الفرع',
      label: 'الفرع',
      description: 'الفرع المرتبط',
      defaultVisible: false,
      accessorKey: 'branchName',
      cell: ({ row }) => {
        const expense = row.original;
        return expense.branchName ? (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-success/70" />
            <span className="text-sm text-foreground">{expense.branchName}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        );
      }
    },
    {
      id: 'createdBy',
      key: 'createdBy',
      header: 'أنشئ بواسطة',
      label: 'أنشئ بواسطة',
      description: 'المستخدم الذي أنشأ المصروف',
      defaultVisible: false,
      accessorKey: 'createdByName',
      cell: ({ row }) => {
        const expense = row.original;
        return expense.createdByName ? (
          <span className="text-sm text-foreground">{expense.createdByName}</span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        );
      }
    },
    {
      id: 'actions',
      key: 'actions',
      header: 'الإجراءات',
      label: 'الإجراءات',
      description: 'إجراءات المصروف',
      defaultVisible: true,
      enableSorting: false,
      cell: ({ row }) => {
        const expense = row.original;
        return (
          <div className="flex items-center gap-1">
            <SimpleButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEditExpense(expense);
              }}
              className="h-8 w-8 p-0"
              title="تعديل"
            >
              <Edit className="w-4 h-4" />
            </SimpleButton>
            <SimpleButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteExpense(expense.id);
              }}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              title="حذف"
            >
              <Trash2 className="w-4 h-4" />
            </SimpleButton>
          </div>
        );
      }
    }
  ];

  // Render card
  const renderCard = (expense) => {
    const amount = parseFloat(expense.amount || 0);
    return (
      <SimpleCard className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleEditExpense(expense)}>
        <SimpleCardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <SimpleBadge variant="secondary" className="text-xs">
                  {expense.categoryName || 'غير محدد'}
                </SimpleBadge>
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                {amount.toFixed(2)} ج.م
              </h3>
              {expense.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {expense.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString('ar-EG') : '-'}</span>
              </div>
              {expense.vendorName && (
                <div className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span>{expense.vendorName}</span>
                </div>
              )}
              {expense.repairRequestId && (
                <div className="flex items-center gap-1">
                  <Wrench className="w-3 h-3 text-blue-600" />
                  <a
                    href={`/repairs/${expense.repairRequestId}`}
                    className="text-xs text-blue-600 hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      navigate(`/repairs/${expense.repairRequestId}`);
                    }}
                  >
                    {expense.repairTrackingToken || `طلب #${expense.repairRequestId}`}
                  </a>
                </div>
              )}
              {expense.branchName && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-green-600" />
                  <span className="text-xs">{expense.branchName}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <SimpleButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditExpense(expense);
                }}
                className="h-6 w-6 p-0"
              >
                <Edit className="w-3 h-3" />
              </SimpleButton>
              <SimpleButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteExpense(expense.id);
                }}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3" />
              </SimpleButton>
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>
    );
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة المصروفات</h1>
          <p className="text-muted-foreground mt-1">تسجيل وإدارة جميع المصروفات</p>
        </div>
        <SimpleButton onClick={handleCreateExpense} className="w-full sm:w-auto">
          <Plus className="w-5 h-5 ml-2" />
          إضافة مصروف جديد
        </SimpleButton>
      </div>

      {/* Stats Cards */}
      {!loadingStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SimpleCard>
            <SimpleCardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-500" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-muted-foreground">إجمالي المصروفات</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalExpenses}</p>
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-error/10 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-error" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-muted-foreground">إجمالي المبلغ</p>
                  <p className="text-2xl font-bold text-error">{stats.totalAmount.toFixed(2)} ج.م</p>
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-success/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-muted-foreground">المتوسط</p>
                  <p className="text-2xl font-bold text-success">{stats.averageAmount.toFixed(2)} ج.م</p>
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Calendar className="w-6 h-6 text-orange-500" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-muted-foreground">اليوم</p>
                  <p className="text-2xl font-bold text-orange-500">{stats.todayAmount.toFixed(2)} ج.م</p>
                  <p className="text-xs text-muted-foreground">{stats.todayExpenses} مصروف</p>
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>
      )}

      {/* Filters */}
      <SimpleCard>
        <SimpleCardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative lg:col-span-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="البحث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 w-full"
                />
              </div>

              {/* Category Filter */}
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع الفئات</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Vendor Filter */}
              <Select
                value={selectedVendor}
                onValueChange={(value) => {
                  setSelectedVendor(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="المورد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع الموردين</SelectItem>
                  {vendors.map(vendor => (
                    <SelectItem key={vendor.id} value={vendor.id.toString()}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date From */}
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full"
              />

              {/* Date To */}
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              {/* Refresh */}
              <SimpleButton
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchExpenses();
                  fetchStats();
                }}
                title="تحديث"
              >
                <RefreshCw className="w-4 h-4" />
              </SimpleButton>

              {/* Clear Filters */}
              {(selectedCategory || selectedVendor || dateFrom || dateTo || searchTerm) && (
                <SimpleButton
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-muted-foreground"
                >
                  <X className="w-4 h-4 ml-1" />
                  مسح الفلاتر
                </SimpleButton>
              )}
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* Expenses List */}
      {loading ? (
        <TableLoadingSkeleton rows={10} columns={6} />
      ) : error ? (
        <SimpleCard>
          <SimpleCardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
            <SimpleButton onClick={fetchExpenses} className="mt-4">
              <RefreshCw className="w-4 h-4 ml-2" />
              إعادة المحاولة
            </SimpleButton>
          </SimpleCardContent>
        </SimpleCard>
      ) : (
        <DataView
          data={expenses}
          columns={columns}
          viewModes={['table', 'cards']}
          defaultViewMode="table"
          enableBulkActions={false}
          renderCard={renderCard}
          loading={loading}
          emptyState={{
            title: 'لا توجد مصروفات',
            description: 'ابدأ بإضافة مصروف جديد',
            action: (
              <SimpleButton onClick={handleCreateExpense}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة مصروف جديد
              </SimpleButton>
            )
          }}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <SimpleCard>
          <SimpleCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                صفحة {currentPage} من {totalPages} ({totalItems} مصروف)
              </div>
              <div className="flex items-center gap-2">
                <SimpleButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  السابق
                </SimpleButton>
                <SimpleButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  التالي
                </SimpleButton>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">عناصر في الصفحة:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingExpense(null);
        }}
        title={editingExpense ? 'تعديل مصروف' : 'إضافة مصروف جديد'}
        size="xl"
      >
        <ExpenseForm
          expense={editingExpense}
          onSave={() => { }}
          onCancel={() => {
            setIsFormModalOpen(false);
            setEditingExpense(null);
          }}
          onSuccess={handleFormSuccess}
        />
      </Modal>
    </div>
  );
};

export default ExpensesPage;

