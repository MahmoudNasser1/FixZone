import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import { DataTable } from '../../components/ui/DataTable';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import paymentService from '../../services/paymentService';

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
  const [summary, setSummary] = useState({});
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    invoiceId: '',
    amount: '',
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    notes: ''
  });

  useEffect(() => {
    loadPayments();
    loadDailyReport();
  }, [pagination.page, filters]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const response = await paymentService.getAllPayments({
        page: pagination.page,
        limit: 10,
        ...filters
      });
      
      if (response.success) {
        setPayments(response.data.payments);
        setPagination(response.data.pagination);
        setSummary(response.data.summary);
      }
    } catch (error) {
      addNotification('خطأ في تحميل المدفوعات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDailyReport = async () => {
    try {
      const response = await paymentService.getDailyPaymentsReport();
      if (response.success) {
        console.log('Daily report:', response.data);
      }
    } catch (error) {
      console.error('Error loading daily report:', error);
    }
  };

  const handleAddPayment = async () => {
    try {
      setLoading(true);
      
      const response = await paymentService.addPayment({
        ...paymentForm,
        amount: parseFloat(paymentForm.amount)
      });

      if (response.success) {
        addNotification('تم إضافة الدفعة بنجاح', 'success');
        setShowAddModal(false);
        resetForm();
        loadPayments();
      } else {
        addNotification(response.message || 'خطأ في إضافة الدفعة', 'error');
      }
    } catch (error) {
      addNotification('خطأ في إضافة الدفعة', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPayment = async () => {
    try {
      setLoading(true);
      
      const response = await paymentService.updatePayment(selectedPayment.id, {
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        referenceNumber: paymentForm.referenceNumber,
        notes: paymentForm.notes
      });

      if (response.success) {
        addNotification('تم تحديث الدفعة بنجاح', 'success');
        setShowEditModal(false);
        resetForm();
        loadPayments();
      } else {
        addNotification(response.message || 'خطأ في تحديث الدفعة', 'error');
      }
    } catch (error) {
      addNotification('خطأ في تحديث الدفعة', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الدفعة؟')) return;
    
    try {
      setLoading(true);
      
      const response = await paymentService.deletePayment(paymentId);
      
      if (response.success) {
        addNotification('تم حذف الدفعة بنجاح', 'success');
        loadPayments();
      } else {
        addNotification(response.message || 'خطأ في حذف الدفعة', 'error');
      }
    } catch (error) {
      addNotification('خطأ في حذف الدفعة', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPaymentForm({
      invoiceId: '',
      amount: '',
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString().split('T')[0],
      referenceNumber: '',
      notes: ''
    });
    setSelectedPayment(null);
  };

  const openEditModal = (payment) => {
    setSelectedPayment(payment);
    setPaymentForm({
      invoiceId: payment.invoiceId,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate ? payment.paymentDate.split('T')[0] : '',
      referenceNumber: payment.referenceNumber || '',
      notes: payment.notes || ''
    });
    setShowEditModal(true);
  };

  // أعمدة جدول المدفوعات
  const columns = [
    {
      id: 'id',
      accessorKey: 'id',
      header: 'رقم الدفعة',
      cell: ({ getValue }) => `#${getValue()}`
    },
    {
      id: 'invoiceNumber',
      accessorKey: 'invoiceNumber',
      header: 'رقم الفاتورة',
      cell: ({ getValue, row }) => (
        <button
          className="text-blue-600 hover:underline"
          onClick={() => navigate(`/invoices/${row.original.invoiceId}`)}
        >
          {getValue() || `INV-${row.original.invoiceId}`}
        </button>
      )
    },
    {
      id: 'customerName',
      accessorKey: 'customerName',
      header: 'العميل'
    },
    {
      id: 'amount',
      accessorKey: 'amount',
      header: 'المبلغ',
      cell: ({ getValue }) => `${getValue()} ريال`
    },
    {
      id: 'paymentMethod',
      accessorKey: 'paymentMethod',
      header: 'طريقة الدفع',
      cell: ({ getValue }) => {
        const methods = {
          cash: 'نقدي',
          card: 'بطاقة ائتمان',
          transfer: 'تحويل بنكي',
          check: 'شيك'
        };
        return methods[getValue()] || getValue();
      }
    },
    {
      id: 'paymentDate',
      accessorKey: 'paymentDate',
      header: 'تاريخ الدفع',
      cell: ({ getValue }) => getValue() ? new Date(getValue()).toLocaleDateString('ar-SA') : '-'
    },
    {
      id: 'referenceNumber',
      accessorKey: 'referenceNumber',
      header: 'المرجع',
      cell: ({ getValue }) => getValue() || '-'
    },
    {
      id: 'createdByName',
      accessorKey: 'createdByName',
      header: 'المضاف بواسطة',
      cell: ({ getValue }) => getValue() || '-'
    },
    {
      id: 'actions',
      header: 'الإجراءات',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <SimpleButton
            variant="outline"
            size="sm"
            onClick={() => openEditModal(row.original)}
          >
            تعديل
          </SimpleButton>
          <SimpleButton
            variant="danger"
            size="sm"
            onClick={() => handleDeletePayment(row.original.id)}
          >
            حذف
          </SimpleButton>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المدفوعات</h1>
          <p className="text-gray-600 mt-1">مراقبة وإدارة جميع المدفوعات</p>
        </div>
        <div className="flex gap-2">
          <SimpleButton
            variant="primary"
            onClick={() => setShowAddModal(true)}
          >
            إضافة دفعة جديدة
          </SimpleButton>
          <SimpleButton
            variant="outline"
            onClick={() => navigate('/delivery')}
          >
            إدارة التسليم
          </SimpleButton>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SimpleCard>
          <SimpleCardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {summary.totalAmount?.toLocaleString() || 0} ريال
            </div>
            <div className="text-sm text-gray-600">إجمالي المدفوعات</div>
          </SimpleCardContent>
        </SimpleCard>
        
        <SimpleCard>
          <SimpleCardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {summary.totalInvoices || 0}
            </div>
            <div className="text-sm text-gray-600">عدد الفواتير المدفوعة</div>
          </SimpleCardContent>
        </SimpleCard>
        
        <SimpleCard>
          <SimpleCardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {payments.length || 0}
            </div>
            <div className="text-sm text-gray-600">عدد المعاملات</div>
          </SimpleCardContent>
        </SimpleCard>
      </div>

      {/* Filters */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle>البحث والفلترة</SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                من تاريخ
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md p-2"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                إلى تاريخ
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md p-2"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                طريقة الدفع
              </label>
              <select
                className="w-full border border-gray-300 rounded-md p-2"
                value={filters.paymentMethod}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
              >
                <option value="">الكل</option>
                <option value="cash">نقدي</option>
                <option value="card">بطاقة ائتمان</option>
                <option value="transfer">تحويل بنكي</option>
                <option value="check">شيك</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <SimpleButton
                variant="outline"
                onClick={() => setFilters({ dateFrom: '', dateTo: '', paymentMethod: '', customerId: '' })}
                className="w-full"
              >
                مسح الفلاتر
              </SimpleButton>
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* Payments Table */}
      <SimpleCard>
        <SimpleCardContent>
          <DataTable
            data={payments}
            columns={columns}
            loading={loading}
            pagination={{
              ...pagination,
              onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
            }}
            emptyMessage="لا توجد مدفوعات"
          />
        </SimpleCardContent>
      </SimpleCard>

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">إضافة دفعة جديدة</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الفاتورة *
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={paymentForm.invoiceId}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, invoiceId: e.target.value }))}
                  placeholder="أدخل رقم الفاتورة"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المبلغ *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  طريقة الدفع
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                >
                  <option value="cash">نقدي</option>
                  <option value="card">بطاقة ائتمان</option>
                  <option value="transfer">تحويل بنكي</option>
                  <option value="check">شيك</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ الدفع
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم المرجع
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={paymentForm.referenceNumber}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                  placeholder="رقم الشيك أو المرجع البنكي"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-2"
                  rows="2"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <SimpleButton
                variant="primary"
                onClick={handleAddPayment}
                disabled={loading || !paymentForm.invoiceId || !paymentForm.amount}
              >
                {loading ? 'جاري الإضافة...' : 'إضافة الدفعة'}
              </SimpleButton>
              <SimpleButton
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                إلغاء
              </SimpleButton>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">تعديل الدفعة</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المبلغ *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  طريقة الدفع
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                >
                  <option value="cash">نقدي</option>
                  <option value="card">بطاقة ائتمان</option>
                  <option value="transfer">تحويل بنكي</option>
                  <option value="check">شيك</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم المرجع
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={paymentForm.referenceNumber}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-2"
                  rows="2"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <SimpleButton
                variant="primary"
                onClick={handleEditPayment}
                disabled={loading || !paymentForm.amount}
              >
                {loading ? 'جاري التحديث...' : 'حفظ التعديلات'}
              </SimpleButton>
              <SimpleButton
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                إلغاء
              </SimpleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
