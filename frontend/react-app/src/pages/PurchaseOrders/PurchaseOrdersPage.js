import React, { useState, useEffect } from 'react';
import { Plus, ShoppingCart, CheckCircle, XCircle, Clock, TrendingUp, DollarSign } from 'lucide-react';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
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
    draftOrders: 0,
    pendingOrders: 0,
    approvedOrders: 0,
    completedOrders: 0,
    pendingApproval: 0,
    approved: 0,
    rejected: 0,
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
      setPagination(response.data?.pagination || {});
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
      // Extract vendors array from the nested data structure
      setVendors(response.data?.vendors || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      // Set empty array as fallback to prevent map errors
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

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'مسودة' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'في الانتظار' },
      approved: { color: 'bg-green-100 text-green-800', label: 'موافق عليه' },
      completed: { color: 'bg-blue-100 text-blue-800', label: 'مكتمل' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'ملغي' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getApprovalBadge = (approvalStatus) => {
    const approvalConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'في الانتظار' },
      APPROVED: { color: 'bg-green-100 text-green-800', label: 'موافق عليه' },
      REJECTED: { color: 'bg-red-100 text-red-800', label: 'مرفوض' }
    };

    const config = approvalConfig[approvalStatus] || approvalConfig.PENDING;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const columns = [
    {
      id: 'orderNumber',
      header: 'رقم الطلب',
      accessorKey: 'orderNumber',
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center ml-3">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {order.orderNumber || `#${order.id}`}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleDateString('ar-SA')}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'vendorName',
      header: 'المورد',
      accessorKey: 'vendorName',
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="text-sm">
            <div className="font-medium text-gray-900">{order.vendorName}</div>
            <div className="text-gray-500">{order.vendorEmail}</div>
          </div>
        );
      }
    },
    {
      id: 'status',
      header: 'الحالة',
      accessorKey: 'status',
      cell: ({ row }) => {
        const order = row.original;
        return getStatusBadge(order.status);
      }
    },
    {
      id: 'approvalStatus',
      header: 'حالة الموافقة',
      accessorKey: 'approvalStatus',
      cell: ({ row }) => {
        const order = row.original;
        return getApprovalBadge(order.approvalStatus);
      }
    },
    {
      id: 'totalAmount',
      header: 'إجمالي المبلغ',
      accessorKey: 'totalAmount',
      cell: ({ row }) => {
        const order = row.original;
        return (
          <span className="text-sm font-medium text-gray-900">
            {order.totalAmount ? `${order.totalAmount.toLocaleString()} ر.س` : '0 ر.س'}
          </span>
        );
      }
    },
    {
      id: 'itemCount',
      header: 'عدد العناصر',
      accessorKey: 'itemCount',
      cell: ({ row }) => {
        const order = row.original;
        return (
          <span className="text-sm font-medium text-gray-900">
            {order.itemCount || 0}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: 'الإجراءات',
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex space-x-2 space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditOrder(order)}
            >
              تعديل
            </Button>
            
            {order.approvalStatus === 'PENDING' && (
              <>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleApproveOrder(order)}
                  className="flex items-center"
                >
                  <CheckCircle className="w-3 h-3 ml-1" />
                  موافقة
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleRejectOrder(order)}
                  className="flex items-center"
                >
                  <XCircle className="w-3 h-3 ml-1" />
                  رفض
                </Button>
              </>
            )}
            
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDeleteOrder(order)}
            >
              حذف
            </Button>
          </div>
        );
      }
    }
  ];

  const getFilterOptions = () => [
    {
      key: 'status',
      label: 'الحالة',
      type: 'select',
      options: [
        { value: '', label: 'جميع الحالات' },
        { value: 'draft', label: 'مسودة' },
        { value: 'pending', label: 'في الانتظار' },
        { value: 'approved', label: 'موافق عليه' },
        { value: 'completed', label: 'مكتمل' },
        { value: 'cancelled', label: 'ملغي' }
      ]
    },
    {
      key: 'approvalStatus',
      label: 'حالة الموافقة',
      type: 'select',
      options: [
        { value: '', label: 'جميع حالات الموافقة' },
        { value: 'PENDING', label: 'في الانتظار' },
        { value: 'APPROVED', label: 'موافق عليه' },
        { value: 'REJECTED', label: 'مرفوض' }
      ]
    },
    {
      key: 'vendorId',
      label: 'المورد',
      type: 'select',
      options: [
        { value: '', label: 'جميع الموردين' },
        ...(Array.isArray(vendors) ? vendors : []).map(vendor => ({
          value: vendor.id,
          label: vendor.name
        }))
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalOrders}
              </div>
              <div className="text-sm text-gray-600">إجمالي الطلبات</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">
                {stats.pendingApproval}
              </div>
              <div className="text-sm text-gray-600">في انتظار الموافقة</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">
                {stats.approved}
              </div>
              <div className="text-sm text-gray-600">موافق عليها</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalValue ? `${stats.totalValue.toLocaleString()}` : '0'}
              </div>
              <div className="text-sm text-gray-600">إجمالي القيمة (ر.س)</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">إدارة طلبات الشراء</h1>
            <Button onClick={handleCreateOrder} className="flex items-center">
              <Plus className="w-4 h-4 ml-2" />
              طلب شراء جديد
            </Button>
          </div>

          <DataTable
            data={purchaseOrders}
            columns={columns}
          >
            {(table) => (
              <div className="space-y-4">
                {/* Search and Filters */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="text"
                      placeholder="البحث في طلبات الشراء..."
                      value={filters.search}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">جميع الحالات</option>
                      <option value="draft">مسودة</option>
                      <option value="pending">في الانتظار</option>
                      <option value="approved">موافق عليه</option>
                      <option value="completed">مكتمل</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                    <select
                      value={filters.approvalStatus}
                      onChange={(e) => handleFilterChange('approvalStatus', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">جميع حالات الموافقة</option>
                      <option value="PENDING">في الانتظار</option>
                      <option value="APPROVED">موافق عليه</option>
                      <option value="REJECTED">مرفوض</option>
                    </select>
                  </div>
                  <div className="text-sm text-gray-500">
                    {pagination.totalItems} طلب شراء
                  </div>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      صفحة {pagination.page} من {pagination.totalPages}
                    </div>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                      >
                        السابق
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                      >
                        التالي
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DataTable>
        </div>
      </Card>

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
  );
};

export default PurchaseOrdersPage;
