import React, { useState, useEffect } from 'react';
import { Plus, ShoppingCart, CheckCircle, XCircle, Clock, DollarSign, RefreshCw } from 'lucide-react';
import { SimpleCard, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import DataView from '../../components/ui/DataView';
import { Modal } from '../../components/ui/Modal';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import purchaseOrderService from '../../services/purchaseOrderService';
import PurchaseOrderForm from './PurchaseOrderForm';

const PurchaseOrdersPage = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    vendorId: '',
    approvalStatus: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    order: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingApproval: 0,
    approved: 0,
    totalValue: 0
  });
  const [vendors, setVendors] = useState([]);

  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchPurchaseOrders();
    fetchStats();
    fetchVendors();
  }, [filters]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const response = await purchaseOrderService.getAllPurchaseOrders(filters);
      setPurchaseOrders(response.data?.purchaseOrders || []);
      setPagination(response.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'خطأ في جلب قائمة طلبات الشراء'
      });
      console.error('Error fetching purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await purchaseOrderService.getPurchaseOrderStats();
      setStats(response.data || {});
    } catch (error) {
      console.error('Error fetching purchase order stats:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await purchaseOrderService.getVendors();
      setVendors(response.data?.vendors || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setVendors([]);
    }
  };

  const handleCreateOrder = () => {
    setEditingOrder(null);
    setIsModalOpen(true);
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setIsModalOpen(true);
  };

  const handleApproveOrder = async (order) => {
    if (!window.confirm(`هل أنت متأكد من الموافقة على طلب الشراء "${order.orderNumber || order.id}"؟`)) {
      return;
    }

    try {
      await purchaseOrderService.approvePurchaseOrder(order.id);
      addNotification({
        type: 'success',
        message: 'تم الموافقة على طلب الشراء بنجاح'
      });
      fetchPurchaseOrders();
      fetchStats();
    } catch (error) {
      const errorMessage = error?.message || 'فشل في الموافقة على طلب الشراء';
      addNotification({
        type: 'error',
        message: errorMessage
      });
      console.error('Error approving purchase order:', error);
    }
  };

  const handleRejectOrder = async (order) => {
    if (!window.confirm(`هل أنت متأكد من رفض طلب الشراء "${order.orderNumber || order.id}"؟`)) {
      return;
    }

    try {
      await purchaseOrderService.rejectPurchaseOrder(order.id);
      addNotification({
        type: 'success',
        message: 'تم رفض طلب الشراء بنجاح'
      });
      fetchPurchaseOrders();
      fetchStats();
    } catch (error) {
      const errorMessage = error?.message || 'فشل في رفض طلب الشراء';
      addNotification({
        type: 'error',
        message: errorMessage
      });
      console.error('Error rejecting purchase order:', error);
    }
  };

  const handleDeleteOrder = async (order) => {
    if (!window.confirm(`هل أنت متأكد من حذف طلب الشراء "${order.orderNumber || order.id}"؟`)) {
      return;
    }

    try {
      await purchaseOrderService.deletePurchaseOrder(order.id);
      addNotification({
        type: 'success',
        message: 'تم حذف طلب الشراء بنجاح'
      });
      fetchPurchaseOrders();
      fetchStats();
    } catch (error) {
      const errorMessage = error?.message || 'فشل في حذف طلب الشراء';
      addNotification({
        type: 'error',
        message: errorMessage
      });
      console.error('Error deleting purchase order:', error);
    }
  };

  const handleSaveOrder = async (orderData) => {
    try {
      if (editingOrder) {
        await purchaseOrderService.updatePurchaseOrder(editingOrder.id, orderData);
        addNotification({
          type: 'success',
          message: 'تم تحديث طلب الشراء بنجاح'
        });
      } else {
        await purchaseOrderService.createPurchaseOrder(orderData);
        addNotification({
          type: 'success',
          message: 'تم إنشاء طلب الشراء بنجاح'
        });
      }
      setIsModalOpen(false);
      fetchPurchaseOrders();
      fetchStats();
    } catch (error) {
      const errorMessage = error?.message || 'فشل في حفظ بيانات طلب الشراء';
      addNotification({
        type: 'error',
        message: errorMessage
      });
      console.error('Error saving purchase order:', error);
    }
  };

  const handleSearch = (searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { variant: 'secondary', label: 'مسودة' },
      pending: { variant: 'warning', label: 'في الانتظار' },
      approved: { variant: 'success', label: 'موافق عليه' },
      completed: { variant: 'info', label: 'مكتمل' },
      cancelled: { variant: 'destructive', label: 'ملغي' }
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <SimpleBadge variant={config.variant}>{config.label}</SimpleBadge>;
  };

  const getApprovalBadge = (approvalStatus) => {
    const approvalConfig = {
      PENDING: { variant: 'warning', label: 'في الانتظار' },
      APPROVED: { variant: 'success', label: 'موافق عليه' },
      REJECTED: { variant: 'destructive', label: 'مرفوض' }
    };
    const config = approvalConfig[approvalStatus] || approvalConfig.PENDING;
    return <SimpleBadge variant={config.variant}>{config.label}</SimpleBadge>;
  };

  const columns = [
    {
      key: 'orderNumber',
      label: 'رقم الطلب',
      render: (order) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-right">
            <div className="font-medium text-foreground">
              {order.orderNumber || `#${order.id}`}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString('ar-SA')}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'vendorName',
      label: 'المورد',
      render: (order) => (
        <div className="text-sm text-right">
          <div className="font-medium text-foreground">{order.vendorName}</div>
          <div className="text-xs text-muted-foreground">{order.vendorEmail}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (order) => getStatusBadge(order.status)
    },
    {
      key: 'approvalStatus',
      label: 'حالة الموافقة',
      render: (order) => getApprovalBadge(order.approvalStatus)
    },
    {
      key: 'totalAmount',
      label: 'إجمالي المبلغ',
      render: (order) => (
        <span className="font-medium text-foreground">
          {order.totalAmount ? `${order.totalAmount.toLocaleString()} جنية` : '0 جنية'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      render: (order) => (
        <div className="flex items-center gap-2 justify-end">
          <SimpleButton
            variant="ghost"
            size="sm"
            onClick={() => handleEditOrder(order)}
          >
            تعديل
          </SimpleButton>
          {order.approvalStatus === 'PENDING' && (
            <>
              <SimpleButton
                variant="outline"
                size="sm"
                onClick={() => handleApproveOrder(order)}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <CheckCircle className="w-3 h-3 ml-1" />
                موافقة
              </SimpleButton>
              <SimpleButton
                variant="outline"
                size="sm"
                onClick={() => handleRejectOrder(order)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <XCircle className="w-3 h-3 ml-1" />
                رفض
              </SimpleButton>
            </>
          )}
          <SimpleButton
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteOrder(order)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            حذف
          </SimpleButton>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6 text-right" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-foreground">طلبات الشراء</h1>
          <div className="flex items-center gap-2">
            <SimpleButton
              variant="outline"
              size="sm"
              onClick={fetchPurchaseOrders}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </SimpleButton>
            <SimpleButton onClick={handleCreateOrder}>
              <Plus className="w-4 h-4 ml-1" />
              طلب شراء جديد
            </SimpleButton>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SimpleCard>
            <SimpleCardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <div className="text-22xl font-bold text-foreground">
                    {stats.totalOrders || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">إجمالي الطلبات</div>
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {stats.pendingApproval || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">في انتظار الموافقة</div>
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {stats.approved || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">موافق عليها</div>
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {stats.totalValue ? `${stats.totalValue.toLocaleString()}` : '0'}
                  </div>
                  <div className="text-sm text-muted-foreground">إجمالي القيمة (جنية)</div>
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>

        {/* Search and Filters */}
        <SimpleCard>
          <SimpleCardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="البحث في طلبات الشراء..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-right"
                  dir="rtl"
                />
              </div>
              <div className="min-w-[150px]">
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-right"
                  dir="rtl"
                >
                  <option value="">جميع الحالات</option>
                  <option value="draft">مسودة</option>
                  <option value="pending">في الانتظار</option>
                  <option value="approved">موافق عليه</option>
                  <option value="completed">مكتمل</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </div>
              <div className="min-w-[150px]">
                <select
                  value={filters.approvalStatus}
                  onChange={(e) => handleFilterChange('approvalStatus', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-right"
                  dir="rtl"
                >
                  <option value="">جميع حالات الموافقة</option>
                  <option value="PENDING">في الانتظار</option>
                  <option value="APPROVED">موافق عليه</option>
                  <option value="REJECTED">مرفوض</option>
                </select>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* Data View */}
        <DataView
          data={purchaseOrders}
          columns={columns}
          loading={loading}
          emptyMessage="لا توجد طلبات شراء للعرض"
          pagination={{
            currentPage: pagination.page,
            totalPages: pagination.totalPages,
            pageSize: pagination.limit,
            totalItems: pagination.total,
            onPageChange: (page) => setFilters(prev => ({ ...prev, page })),
            onPageSizeChange: (limit) => setFilters(prev => ({ ...prev, limit, page: 1 }))
          }}
        />

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingOrder ? 'تعديل طلب شراء' : 'طلب شراء جديد'}
          size="xl"
        >
          <PurchaseOrderForm
            order={editingOrder}
            vendors={vendors}
            onSave={handleSaveOrder}
            onCancel={() => setIsModalOpen(false)}
          />
        </Modal>
      </div>
    </div>
  );
};

export default PurchaseOrdersPage;
