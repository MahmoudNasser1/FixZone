// Expenses List Page
// Main page for viewing and managing expenses

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Edit, Trash2, DollarSign } from 'lucide-react';
import apiService from '../../../services/api';
import { SimpleCard, SimpleCardContent } from '../../../components/ui/SimpleCard';
import SimpleButton from '../../../components/ui/SimpleButton';
import SimpleBadge from '../../../components/ui/SimpleBadge';
import DataView from '../../../components/ui/DataView';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useExpenses } from '../../../hooks/financial/useExpenses';
import FinancialSummaryCard from '../../../components/financial/shared/FinancialSummaryCard';
import FinancialFilters from '../../../components/financial/shared/FinancialFilters';
import { ConfirmModal } from '../../../components/ui/Modal';

const ExpensesListPage = () => {
  const navigate = useNavigate();
  const {
    expenses,
    loading,
    error,
    filters,
    setFilters,
    pagination,
    setPagination,
    stats,
    deleteExpense,
    refetch
  } = useExpenses();

  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });

  const handleCreate = () => {
    navigate('/financial/expenses/create');
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination({ ...pagination, page: 1 });
  };

  const handleResetFilters = () => {
    setFilters({});
    setPagination({ ...pagination, page: 1 });
  };

  const handleEdit = (id) => {
    navigate(`/financial/expenses/${id}/edit`);
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirm({ open: true, id });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteExpense(deleteConfirm.id);
      setDeleteConfirm({ open: false, id: null });
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-EG');
  };

  // Load categories and branches on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const categoriesResponse = await apiService.request('/expense-categories');
        if (categoriesResponse?.success && categoriesResponse?.data) {
          setCategories(categoriesResponse.data);
        } else if (Array.isArray(categoriesResponse)) {
          setCategories(categoriesResponse);
        }

        const branchesResponse = await apiService.request('/branches');
        if (branchesResponse?.success && branchesResponse?.data) {
          setBranches(branchesResponse.data);
        } else if (Array.isArray(branchesResponse)) {
          setBranches(branchesResponse);
        }
      } catch (error) {
        console.error('Error loading filter data:', error);
      }
    };

    loadData();
  }, []);

  const columns = [
    {
      key: 'date',
      label: 'التاريخ',
      render: (expense) => formatDate(expense.date)
    },
    {
      key: 'description',
      label: 'الوصف',
      render: (expense) => expense.description
    },
    {
      key: 'category',
      label: 'التصنيف',
      render: (expense) => (
        <SimpleBadge variant="secondary">
          {expense.categoryName || '-'}
        </SimpleBadge>
      )
    },
    {
      key: 'amount',
      label: 'المبلغ',
      render: (expense) => (
        <div className="font-semibold text-foreground">
          {formatCurrency(expense.amount)}
        </div>
      )
    },
    {
      key: 'branch',
      label: 'الفرع',
      render: (expense) => expense.branchName || '-'
    },
    {
      key: 'actions',
      label: 'إجراءات',
      render: (expense) => (
        <div className="flex items-center gap-2">
          <SimpleButton
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(expense.id)}
          >
            <Edit className="w-4 h-4" />
          </SimpleButton>
          <SimpleButton
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteClick(expense.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </SimpleButton>
        </div>
      )
    }
  ];

  if (error && !expenses.length) {
    const errorMessage = typeof error === 'string'
      ? error
      : error?.message || error?.title || 'حدث خطأ غير متوقع';
    return (
      <div className="p-6">
        <SimpleCard>
          <SimpleCardContent className="p-6">
            <p className="text-destructive mb-4">خطأ: {errorMessage}</p>
            <SimpleButton onClick={refetch} variant="outline">
              إعادة المحاولة
            </SimpleButton>
          </SimpleCardContent>
        </SimpleCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-foreground">النفقات</h1>
          <div className="flex items-center gap-2">
            <SimpleButton
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </SimpleButton>
            <SimpleButton onClick={handleCreate}>
              <Plus className="w-4 h-4 ml-1" />
              إضافة نفقة جديدة
            </SimpleButton>
          </div>
        </div>

        {/* Summary Card */}
        <FinancialSummaryCard
          title="ملخص النفقات"
          data={stats && typeof stats === 'object' && !Array.isArray(stats) ? stats : null}
          loading={loading}
          icon={DollarSign}
        />

        {/* Filters */}
        <FinancialFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          showDateRange={true}
          showCategory={true}
          showBranch={true}
          categories={categories}
          branches={branches}
        />

        {/* Expenses Table */}
        {loading && expenses.length === 0 ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <DataView
            data={expenses}
            columns={columns}
            loading={loading}
            emptyMessage="لا توجد نفقات"
            pagination={{
              currentPage: pagination.page,
              totalPages: Math.ceil(pagination.total / pagination.limit),
              pageSize: pagination.limit,
              totalItems: pagination.total,
              onPageChange: (page) => setPagination({ ...pagination, page }),
              onPageSizeChange: (limit) => setPagination({ ...pagination, limit, page: 1 })
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteConfirm.open}
          onClose={() => setDeleteConfirm({ open: false, id: null })}
          onConfirm={handleDeleteConfirm}
          title="تأكيد الحذف"
          message="هل أنت متأكد من حذف هذه النفقة؟ لا يمكن التراجع عن هذا الإجراء."
          confirmText="حذف"
          cancelText="إلغاء"
        />
      </div>
    </div>
  );
};

export default ExpensesListPage;
