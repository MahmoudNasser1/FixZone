// Invoices List Page
// Main page for viewing and managing invoices

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Eye, FileText } from 'lucide-react';
import { SimpleCard, SimpleCardContent } from '../../../components/ui/SimpleCard';
import SimpleButton from '../../../components/ui/SimpleButton';
import SimpleBadge from '../../../components/ui/SimpleBadge';
import DataView from '../../../components/ui/DataView';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useInvoices } from '../../../hooks/financial/useInvoices';
import FinancialSummaryCard from '../../../components/financial/shared/FinancialSummaryCard';

const InvoicesListPage = () => {
  const navigate = useNavigate();
  const {
    invoices,
    loading,
    error,
    pagination,
    setPagination,
    stats,
    refetch
  } = useInvoices();

  const handleCreate = () => {
    navigate('/financial/invoices/create');
  };

  const handleView = (id) => {
    navigate(`/financial/invoices/${id}`);
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

  const getStatusLabel = (status) => {
    const statuses = {
      draft: 'مسودة',
      sent: 'مرسلة',
      paid: 'مدفوعة',
      partially_paid: 'مدفوعة جزئياً',
      overdue: 'متأخرة',
      cancelled: 'ملغاة'
    };
    return statuses[status] || status;
  };

  const getStatusVariant = (status) => {
    const variants = {
      draft: 'secondary',
      sent: 'default',
      paid: 'success',
      partially_paid: 'warning',
      overdue: 'destructive',
      cancelled: 'secondary'
    };
    return variants[status] || 'default';
  };

  const columns = [
    {
      key: 'invoiceNumber',
      label: 'رقم الفاتورة',
      render: (invoice) => (
        <div className="font-semibold text-foreground">
          {invoice.invoiceNumber || `#${invoice.id}`}
        </div>
      )
    },
    {
      key: 'customerName',
      label: 'العميل',
      render: (invoice) => invoice.customerName || '-'
    },
    {
      key: 'date',
      label: 'التاريخ',
      render: (invoice) => formatDate(invoice.issueDate || invoice.createdAt)
    },
    {
      key: 'totalAmount',
      label: 'المبلغ الإجمالي',
      render: (invoice) => (
        <div className="font-semibold text-foreground">
          {formatCurrency(invoice.totalAmount)}
        </div>
      )
    },
    {
      key: 'amountPaid',
      label: 'المدفوع',
      render: (invoice) => (
        <div className="text-emerald-600 dark:text-emerald-400">
          {formatCurrency(invoice.amountPaid || 0)}
        </div>
      )
    },
    {
      key: 'amountRemaining',
      label: 'المتبقي',
      render: (invoice) => (
        <div className="text-destructive">
          {formatCurrency(invoice.amountRemaining || 0)}
        </div>
      )
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (invoice) => (
        <SimpleBadge variant={getStatusVariant(invoice.status)}>
          {getStatusLabel(invoice.status)}
        </SimpleBadge>
      )
    },
    {
      key: 'actions',
      label: 'إجراءات',
      render: (invoice) => (
        <SimpleButton
          variant="ghost"
          size="sm"
          onClick={() => handleView(invoice.id)}
        >
          <Eye className="w-4 h-4" />
        </SimpleButton>
      )
    }
  ];

  if (error && !invoices.length) {
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
          <h1 className="text-3xl font-bold text-foreground">الفواتير</h1>
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
              إنشاء فاتورة جديدة
            </SimpleButton>
          </div>
        </div>

        {/* Summary Card */}
        <FinancialSummaryCard
          title="ملخص الفواتير"
          data={stats && typeof stats === 'object' && !Array.isArray(stats) ? stats : null}
          loading={loading}
          icon={FileText}
        />

        {/* Invoices Table */}
        {loading && invoices.length === 0 ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <DataView
            data={invoices}
            columns={columns}
            loading={loading}
            emptyMessage="لا توجد فواتير"
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
      </div>
    </div>
  );
};

export default InvoicesListPage;
