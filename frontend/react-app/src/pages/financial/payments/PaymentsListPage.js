// Payments List Page
// Main page for viewing and managing payments

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Receipt } from 'lucide-react';
import { SimpleCard, SimpleCardContent } from '../../../components/ui/SimpleCard';
import SimpleButton from '../../../components/ui/SimpleButton';
import SimpleBadge from '../../../components/ui/SimpleBadge';
import DataView from '../../../components/ui/DataView';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { usePayments } from '../../../hooks/financial/usePayments';
import FinancialSummaryCard from '../../../components/financial/shared/FinancialSummaryCard';

const PaymentsListPage = () => {
  const navigate = useNavigate();
  const {
    payments,
    loading,
    error,
    pagination,
    setPagination,
    stats,
    refetch
  } = usePayments();

  const handleCreate = () => {
    navigate('/financial/payments/create');
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

  const getPaymentMethodLabel = (method) => {
    const methods = {
      cash: 'نقدي',
      card: 'بطاقة',
      bank_transfer: 'تحويل بنكي',
      check: 'شيك',
      other: 'أخرى'
    };
    return methods[method] || method;
  };

  const columns = [
    {
      key: 'date',
      label: 'التاريخ',
      render: (payment) => formatDate(payment.paymentDate || payment.createdAt)
    },
    {
      key: 'invoice',
      label: 'الفاتورة',
      render: (payment) => payment.invoiceNumber || `#${payment.invoiceId}`
    },
    {
      key: 'customer',
      label: 'العميل',
      render: (payment) => payment.customerName || '-'
    },
    {
      key: 'amount',
      label: 'المبلغ',
      render: (payment) => (
        <div className="font-semibold text-foreground">
          {formatCurrency(payment.amount)}
        </div>
      )
    },
    {
      key: 'paymentMethod',
      label: 'طريقة الدفع',
      render: (payment) => (
        <SimpleBadge variant="outline">
          {getPaymentMethodLabel(payment.paymentMethod)}
        </SimpleBadge>
      )
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (payment) => (
        <SimpleBadge variant={payment.invoiceStatus === 'paid' ? 'success' : 'warning'}>
          {payment.invoiceStatus === 'paid' ? 'مدفوعة' : 'جزئية'}
        </SimpleBadge>
      )
    }
  ];

  if (error && !payments.length) {
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
          <h1 className="text-3xl font-bold text-foreground">المدفوعات</h1>
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
              إضافة دفعة جديدة
            </SimpleButton>
          </div>
        </div>

        {/* Summary Card */}
        <FinancialSummaryCard
          title="ملخص المدفوعات"
          data={stats && typeof stats === 'object' && !Array.isArray(stats) ? stats : null}
          loading={loading}
          icon={Receipt}
        />

        {/* Payments Table */}
        {loading && payments.length === 0 ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <DataView
            data={payments}
            columns={columns}
            loading={loading}
            emptyMessage="لا توجد مدفوعات"
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

export default PaymentsListPage;
