import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import { DataTable } from '../../components/ui/DataTable';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { PaymentCard, PaymentForm, PaymentStats } from '../../components/payments';
import paymentService from '../../services/paymentService';
import apiService from '../../services/api';

export default function PaymentsPage() {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  
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
        ...paymentData,
        createdBy: 1 // TODO: Get from auth context
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

  const handleViewPayment = (payment) => {
    navigate(`/payments/${payment.id}`);
  };

  const handleEditPaymentClick = (payment) => {
    setSelectedPayment(payment);
    setShowEditModal(true);
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
      key: 'amount',
      label: 'المبلغ',
      render: (payment) => paymentService.formatAmount(payment.amount, payment.currency)
    },
    {
      key: 'paymentMethod',
      label: 'طريقة الدفع',
      render: (payment) => (
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <span>{paymentService.getPaymentMethodIcon(payment.paymentMethod)}</span>
          <span>{paymentMethods.find(m => m.value === payment.paymentMethod)?.label}</span>
        </div>
      )
    },
    {
      key: 'paymentDate',
      label: 'تاريخ الدفع',
      render: (payment) => paymentService.formatDate(payment.paymentDate)
    },
    {
      key: 'customer',
      label: 'العميل',
      render: (payment) => payment.customerFirstName ? 
        `${payment.customerFirstName} ${payment.customerLastName}` : 
        'غير محدد'
    },
    {
      key: 'invoiceNumber',
      label: 'رقم الفاتورة',
      render: (payment) => payment.invoiceNumber || 'غير محدد'
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      render: (payment) => (
        <div className="flex space-x-2 rtl:space-x-reverse">
          <button
            onClick={() => handleViewPayment(payment)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            عرض
          </button>
          <button
            onClick={() => handleEditPaymentClick(payment)}
            className="text-green-600 hover:text-green-800 text-sm"
          >
            تعديل
          </button>
          <button
            onClick={() => handleDeletePayment(payment)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            حذف
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">إدارة المدفوعات</h1>
        <div className="flex space-x-3 rtl:space-x-reverse">
          <SimpleButton
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
            variant="outline"
          >
            {viewMode === 'grid' ? 'عرض جدولي' : 'عرض بطاقات'}
          </SimpleButton>
          <SimpleButton
            onClick={() => handleAddPaymentClick()}
            className="bg-green-600 hover:bg-green-700"
          >
            إضافة دفعة جديدة
          </SimpleButton>
        </div>
      </div>

      {/* Stats */}
      <PaymentStats stats={stats} loading={loading} />

      {/* Overdue Payments Alert */}
      {overduePayments.length > 0 && (
        <SimpleCard className="border-red-200 bg-red-50">
          <SimpleCardContent className="p-4">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-red-900">
                  مدفوعات متأخرة ({overduePayments.length})
                </h3>
                <p className="text-sm text-red-700">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                من تاريخ
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                إلى تاريخ
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                طريقة الدفع
              </label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">جميع الطرق</option>
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.icon} {method.label}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
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
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {showEditModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">تعديل الدفعة</h2>
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
          </div>
        </div>
      )}
    </div>
  );
}