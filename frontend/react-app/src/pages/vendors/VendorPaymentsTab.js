import React, { useState, useEffect } from 'react';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/Select';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import VendorPaymentCard from '../../components/vendors/VendorPaymentCard';
import VendorPaymentForm from '../../components/vendors/VendorPaymentForm';
import vendorPaymentService from '../../services/vendorPaymentService';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { Plus, DollarSign, TrendingUp } from 'lucide-react';
import SimpleBadge from '../../components/ui/SimpleBadge';

const VendorPaymentsTab = ({ vendorId }) => {
  const { addNotification } = useNotifications();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(null);
  const [stats, setStats] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    paymentMethod: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0
  });

  useEffect(() => {
    if (vendorId) {
      fetchPayments();
      fetchBalance();
      fetchStats();
    }
  }, [vendorId, filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await vendorPaymentService.getVendorPayments(vendorId, filters);
      setPayments(response.data?.payments || []);
      setPagination(response.data?.pagination || {});
    } catch (error) {
      addNotification('error', 'خطأ في جلب مدفوعات المورد');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await vendorPaymentService.getVendorBalance(vendorId);
      setBalance(response.data);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await vendorPaymentService.getVendorPaymentStats(vendorId);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreatePayment = () => {
    setEditingPayment(null);
    setIsModalOpen(true);
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setIsModalOpen(true);
  };

  const handleDeletePayment = async (payment) => {
    if (!window.confirm(`هل أنت متأكد من حذف الدفعة #${payment.paymentNumber}؟`)) {
      return;
    }

    try {
      await vendorPaymentService.deleteVendorPayment(vendorId, payment.id);
      addNotification('success', 'تم حذف الدفعة بنجاح');
      fetchPayments();
      fetchBalance();
      fetchStats();
    } catch (error) {
      addNotification('error', 'فشل في حذف الدفعة');
    }
  };

  const handleSavePayment = async (paymentData) => {
    try {
      if (editingPayment) {
        await vendorPaymentService.updateVendorPayment(vendorId, editingPayment.id, paymentData);
        addNotification('success', 'تم تحديث الدفعة بنجاح');
      } else {
        await vendorPaymentService.createVendorPayment(vendorId, paymentData);
        addNotification('success', 'تم تسجيل الدفعة بنجاح');
      }
      setIsModalOpen(false);
      setEditingPayment(null);
      fetchPayments();
      fetchBalance();
      fetchStats();
    } catch (error) {
      addNotification('error', error.message || 'فشل في حفظ الدفعة');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const formatAmount = (amount) => {
    if (!amount) return '0.00';
    return parseFloat(amount).toLocaleString('ar-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' ج.م';
  };

  return (
    <div className="space-y-4">
      {/* Balance & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SimpleCard>
          <SimpleCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">الرصيد المستحق</p>
                <p className={`text-2xl font-bold ${balance?.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatAmount(balance?.balance)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المدفوعات</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatAmount(stats?.overview?.completedAmount)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">عدد المدفوعات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.overview?.totalPayments || 0}
                </p>
              </div>
              <SimpleBadge color={balance?.isOverLimit ? 'red' : 'green'} size="sm">
                {balance?.isOverLimit ? 'تجاوز الحد' : 'ضمن الحد'}
              </SimpleBadge>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>

      {/* Filters & Actions */}
      <SimpleCard>
        <SimpleCardHeader>
          <div className="flex justify-between items-center">
            <SimpleCardTitle>مدفوعات المورد</SimpleCardTitle>
            <SimpleButton onClick={handleCreatePayment} variant="default">
              <Plus className="w-4 h-4 ml-2" />
              دفعة جديدة
            </SimpleButton>
          </div>
        </SimpleCardHeader>
        <SimpleCardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label>الحالة</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع الحالات</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>طريقة الدفع</Label>
              <Select value={filters.paymentMethod} onValueChange={(value) => handleFilterChange('paymentMethod', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الطرق" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع الطرق</SelectItem>
                  <SelectItem value="cash">نقدي</SelectItem>
                  <SelectItem value="bank_transfer">حوالة بنكية</SelectItem>
                  <SelectItem value="check">شيك</SelectItem>
                  <SelectItem value="credit_card">بطاقة ائتمان</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>من تاريخ</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div>
              <Label>إلى تاريخ</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>

          {/* Payments List */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">لا توجد مدفوعات</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {payments.map(payment => (
                <VendorPaymentCard
                  key={payment.id}
                  payment={payment}
                  onEdit={handleEditPayment}
                  onDelete={handleDeletePayment}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-600">
                صفحة {pagination.page} من {pagination.totalPages}
              </p>
              <div className="flex space-x-2 rtl:space-x-reverse">
                <SimpleButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  السابق
                </SimpleButton>
                <SimpleButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  التالي
                </SimpleButton>
              </div>
            </div>
          )}
        </SimpleCardContent>
      </SimpleCard>

      {/* Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPayment(null);
        }}
        title={editingPayment ? 'تعديل دفعة' : 'دفعة جديدة'}
        size="lg"
      >
        <VendorPaymentForm
          vendorId={vendorId}
          payment={editingPayment}
          onSubmit={handleSavePayment}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingPayment(null);
          }}
          loading={loading}
        />
      </Modal>
    </div>
  );
};

export default VendorPaymentsTab;

