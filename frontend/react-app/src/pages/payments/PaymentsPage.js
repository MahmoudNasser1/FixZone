import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import { DataTable } from '../../components/ui/DataTable';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { PaymentCard, PaymentForm, PaymentStats } from '../../components/payments';
import BulkOperations from '../../components/payments/BulkOperations';
import paymentService from '../../services/paymentService';
import exportService from '../../services/exportService';
import apiService from '../../services/api';
import useAuthStore from '../../stores/authStore';

export default function PaymentsPage() {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    paymentMethod: '',
    customerId: ''
  });
  const [stats, setStats] = useState({});
  const [overduePayments, setOverduePayments] = useState([]);
  const [selectedPayments, setSelectedPayments] = useState([]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  useEffect(() => {
    loadPayments();
    loadStats();
    loadOverduePayments();
  }, [pagination.page, filters]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const response = await paymentService.getAllPayments({
        page: pagination.page,
        limit: 10,
        ...filters
      });

      if (response.payments) {
        setPayments(response.payments);
        setPagination(prev => ({
          ...prev,
          totalPages: response.pagination?.totalPages || 1
        }));
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      addNotification('خطأ في تحميل المدفوعات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await paymentService.getPaymentStats(filters);
      setStats(response);
    } catch (error) {
      console.error('Error loading payment stats:', error);
    }
  };

  const loadOverduePayments = async () => {
    try {
      const response = await paymentService.getOverduePayments();
      setOverduePayments(response);
    } catch (error) {
      console.error('Error loading overdue payments:', error);
    }
  };

  const handleAddPayment = async (paymentData) => {
    try {
      setLoading(true);

      const response = await paymentService.createPayment({
        ...paymentData
        // createdBy will be set automatically from req.user.id in backend
      });

      if (response.success) {
        addNotification('تم إضافة الدفعة بنجاح', 'success');
        setShowAddModal(false);
        setSelectedInvoice(null);
        loadPayments();
        loadStats();
      } else {
        throw new Error(response.error || 'فشل في إضافة الدفعة');
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      addNotification(error.message || 'خطأ في إضافة الدفعة', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPayment = async (paymentData) => {
    try {
      setLoading(true);

      const response = await paymentService.updatePayment(selectedPayment.id, paymentData);

      if (response.success) {
        addNotification('تم تحديث الدفعة بنجاح', 'success');
        setShowEditModal(false);
        setSelectedPayment(null);
        loadPayments();
        loadStats();
      } else {
        throw new Error(response.error || 'فشل في تحديث الدفعة');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      addNotification(error.message || 'خطأ في تحديث الدفعة', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (payment) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الدفعة؟')) {
      return;
    }

    try {
      setLoading(true);

      const response = await paymentService.deletePayment(payment.id);

      if (response.success) {
        addNotification('تم حذف الدفعة بنجاح', 'success');
        loadPayments();
        loadStats();
      } else {
        throw new Error(response.error || 'فشل في حذف الدفعة');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      addNotification(error.message || 'خطأ في حذف الدفعة', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Bulk Operations
  const handleSelectPayment = (paymentId) => {
    setSelectedPayments(prev =>
      prev.includes(paymentId)
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPayments.length === payments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(payments.map(p => p.id));
    }
  };

  const handleBulkDelete = async (paymentIds) => {
    try {
      await Promise.all(paymentIds.map(id => paymentService.deletePayment(id)));
      loadPayments();
    } catch (error) {
      console.error('Error in bulk delete:', error);
      throw error;
    }
  };

  const handleBulkExport = async (paymentIds, format) => {
    try {
      const selectedPaymentData = payments.filter(p => paymentIds.includes(p.id));

      if (format === 'pdf') {
        await exportService.exportPaymentsToPDF(selectedPaymentData, 'تقرير المدفوعات المختارة');
      } else if (format === 'excel') {
        await exportService.exportPaymentsToExcel(selectedPaymentData, 'تقرير المدفوعات المختارة');
      }
    } catch (error) {
      console.error('Error in bulk export:', error);
      throw error;
    }
  };

  const handleBulkSendReminder = async (paymentIds) => {
    try {
      // إرسال تذكير للمدفوعات المختارة
      console.log('Sending reminders for payments:', paymentIds);
    } catch (error) {
      console.error('Error in bulk send reminder:', error);
      throw error;
    }
  };

  const handleBulkUpdateStatus = async (paymentIds, status) => {
    try {
      await Promise.all(paymentIds.map(id =>
        paymentService.updatePayment(id, { status })
      ));
      loadPayments();
    } catch (error) {
      console.error('Error in bulk status update:', error);
      throw error;
    }
  };

  const handleViewPayment = (payment) => {
    navigate(`/payments/${payment.id}`);
  };

  const handleEditPaymentClick = (payment) => {
    // Navigate to edit page instead of using modal
    navigate(`/payments/${payment.id}/edit`);
  };

  const handleAddPaymentClick = (invoice = null) => {
    setSelectedInvoice(invoice);
    setShowAddModal(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const paymentMethods = paymentService.getPaymentMethods();

  const tableColumns = [
    {
      accessorKey: 'amount',
      header: 'المبلغ',
      cell: ({ row }) => paymentService.formatAmount(row.original.amount, row.original.currency)
    },
    {
      accessorKey: 'paymentMethod',
      header: 'طريقة الدفع',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <span>{paymentService.getPaymentMethodIcon(row.original.paymentMethod)}</span>
          <span>{paymentMethods.find(m => m.value === row.original.paymentMethod)?.label}</span>
        </div>
      )
    },
    {
      accessorKey: 'paymentDate',
      header: 'تاريخ الدفع',
      cell: ({ row }) => paymentService.formatDate(row.original.paymentDate)
    },
    {
      accessorKey: 'customerName',
      header: 'العميل',
      cell: ({ row }) => row.original.customerName || 'غير محدد'
    },
    {
      accessorKey: 'invoiceNumber',
      header: 'رقم الفاتورة',
      cell: ({ row }) => row.original.invoiceNumber || 'غير محدد'
    },
    {
      id: 'actions',
      header: 'الإجراءات',
      cell: ({ row }) => (
        <div className="flex space-x-2 rtl:space-x-reverse">
          <button
            onClick={() => handleViewPayment(row.original)}
            className="text-primary hover:text-primary/80 text-sm"
          >
            عرض
          </button>
          <button
            onClick={() => handleEditPaymentClick(row.original)}
            className="text-green-600 hover:text-green-800 text-sm"
          >
            تعديل
          </button>
          <button
            onClick={() => handleDeletePayment(row.original)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            حذف
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">إدارة المدفوعات</h1>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <SimpleButton
            onClick={() => navigate('/payments/reports')}
            variant="outline"
            className="flex-1 sm:flex-none"
          >
            التقارير
          </SimpleButton>
          <SimpleButton
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
            variant="outline"
            className="flex-1 sm:flex-none"
          >
            {viewMode === 'grid' ? 'عرض جدولي' : 'عرض بطاقات'}
          </SimpleButton>
          <SimpleButton
            onClick={() => handleAddPaymentClick()}
            className="flex-1 sm:flex-none bg-success hover:bg-success/90 text-white"
          >
            إضافة دفعة جديدة
          </SimpleButton>
        </div>
      </div>

      {/* Stats */}
      <PaymentStats stats={stats} loading={loading} />

      {/* Overdue Payments Alert */}
      {overduePayments.length > 0 && (
        <SimpleCard className="border-error/20 bg-error/5">
          <SimpleCardContent className="p-4">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-error">
                  مدفوعات متأخرة ({overduePayments.length})
                </h3>
                <p className="text-sm text-muted-foreground">
                  يوجد {overduePayments.length} فاتورة متأخرة عن موعد الدفع
                </p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      )}

      {/* Filters */}
      <SimpleCard>
        <SimpleCardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                من تاريخ
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                إلى تاريخ
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                طريقة الدفع
              </label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              >
                <option value="">جميع الطرق</option>
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <SimpleButton
                onClick={() => setFilters({ dateFrom: '', dateTo: '', paymentMethod: '', customerId: '' })}
                variant="outline"
                className="w-full"
              >
                مسح الفلاتر
              </SimpleButton>
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* Payments List */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle>قائمة المدفوعات</SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {payments.map(payment => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                  onView={handleViewPayment}
                  onEdit={handleEditPaymentClick}
                  onDelete={handleDeletePayment}
                />
              ))}
            </div>
          ) : (
            <DataTable
              data={payments}
              columns={tableColumns}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}
        </SimpleCardContent>
      </SimpleCard>

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <SimpleCard className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 text-foreground">
                {selectedInvoice ? 'إضافة دفعة للفاتورة' : 'إضافة دفعة جديدة'}
              </h2>
              <PaymentForm
                invoice={selectedInvoice}
                onSubmit={handleAddPayment}
                onCancel={() => {
                  setShowAddModal(false);
                  setSelectedInvoice(null);
                }}
                loading={loading}
              />
            </div>
          </SimpleCard>
        </div>
      )}

      {/* Edit Payment Modal */}
      {showEditModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <SimpleCard className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 text-foreground">تعديل الدفعة</h2>
              <PaymentForm
                payment={selectedPayment}
                onSubmit={handleEditPayment}
                onCancel={() => {
                  setShowEditModal(false);
                  setSelectedPayment(null);
                }}
                loading={loading}
              />
            </div>
          </SimpleCard>
        </div>
      )}

      {/* Bulk Operations */}
      <BulkOperations
        selectedItems={selectedPayments}
        onClearSelection={() => setSelectedPayments([])}
        onBulkDelete={handleBulkDelete}
        onBulkExport={handleBulkExport}
        onBulkSendReminder={handleBulkSendReminder}
        onBulkUpdateStatus={handleBulkUpdateStatus}
        itemType="payments"
      />
    </div>
  );
}