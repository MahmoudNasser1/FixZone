import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Users, TrendingUp, DollarSign, Eye, FileText } from 'lucide-react';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import vendorService from '../../services/vendorService';
import VendorForm from './VendorForm';

const VendorsPage = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 10,
    sortBy: 'name',
    order: 'asc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [stats, setStats] = useState({
    totalVendors: 0,
    activeVendors: 0,
    inactiveVendors: 0,
    totalPurchaseOrders: 0
  });

  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchVendors();
    fetchStats();
  }, [filters]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await vendorService.getAllVendors(filters);
      setVendors(response.data?.vendors || []);
      setPagination(response.data?.pagination || {});
    } catch (error) {
      addNotification('error', 'خطأ في جلب قائمة الموردين');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await vendorService.getVendorStats();
      setStats(response.data || {});
    } catch (error) {
      console.error('Error fetching vendor stats:', error);
    }
  };

  const handleCreateVendor = () => {
    setEditingVendor(null);
    setIsModalOpen(true);
  };

  const handleEditVendor = (vendor) => {
    setEditingVendor(vendor);
    setIsModalOpen(true);
  };

  const handleDeleteVendor = async (vendor) => {
    if (!window.confirm(`هل أنت متأكد من حذف المورد "${vendor.name}"؟`)) {
      return;
    }

    try {
      await vendorService.deleteVendor(vendor.id);
      addNotification('success', 'تم حذف المورد بنجاح');
      fetchVendors();
      fetchStats();
    } catch (error) {
      addNotification('error', 'فشل في حذف المورد');
    }
  };

  const handleToggleStatus = async (vendor) => {
    try {
      const newStatus = vendor.status === 'active' ? 'inactive' : 'active';
      await vendorService.updateVendorStatus(vendor.id, newStatus);
      addNotification('success', 'تم تحديث حالة المورد بنجاح');
      fetchVendors();
      fetchStats();
    } catch (error) {
      addNotification('error', 'فشل في تحديث حالة المورد');
    }
  };

  const handleSaveVendor = async (vendorData) => {
    try {
      if (editingVendor) {
        await vendorService.updateVendor(editingVendor.id, vendorData);
        addNotification('success', 'تم تحديث المورد بنجاح');
      } else {
        await vendorService.createVendor(vendorData);
        addNotification('success', 'تم إنشاء المورد بنجاح');
      }
      setIsModalOpen(false);
      fetchVendors();
      fetchStats();
    } catch (error) {
      // عرض رسالة الخطأ الفعلية من API
      const errorMessage = error.message || 'فشل في حفظ بيانات المورد';
      addNotification('error', errorMessage);
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

  const columns = [
    {
      id: 'name',
      header: 'اسم المورد',
      accessorKey: 'name',
      cell: ({ row }) => {
        const vendor = row.original;
        return (
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center ml-3">
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">{vendor.name}</div>
              <div className="text-sm text-gray-500">{vendor.contactPerson}</div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'contact_info',
      header: 'معلومات الاتصال',
      accessorKey: 'phone',
      cell: ({ row }) => {
        const vendor = row.original;
        return (
          <div className="text-sm">
            <div className="text-gray-900">{vendor.phone}</div>
            <div className="text-gray-500">{vendor.email}</div>
          </div>
        );
      }
    },
    {
      id: 'address',
      header: 'العنوان',
      accessorKey: 'address',
      cell: ({ row }) => {
        const vendor = row.original;
        return (
          <div className="text-sm text-gray-600">
            {vendor.address || 'غير محدد'}
          </div>
        );
      }
    },
    {
      id: 'status',
      header: 'الحالة',
      accessorKey: 'status',
      cell: ({ row }) => {
        const vendor = row.original;
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            vendor.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {vendor.status === 'active' ? 'نشط' : 'غير نشط'}
          </span>
        );
      }
    },
    {
      id: 'totalOrders',
      header: 'عدد الطلبات',
      accessorKey: 'totalOrders',
      cell: ({ row }) => {
        const vendor = row.original;
        return (
          <span className="text-sm font-medium text-gray-900">
            {vendor.totalOrders || 0}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: 'الإجراءات',
      cell: ({ row }) => {
        const vendor = row.original;
        return (
          <div className="flex space-x-2 space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/vendors/${vendor.id}`)}
              title="عرض التفاصيل"
            >
              <Eye className="w-4 h-4 ml-1" />
              تفاصيل
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditVendor(vendor)}
            >
              تعديل
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/invoices/new?vendorId=${vendor.id}`)}
              title="إنشاء فاتورة شراء للمورد"
            >
              <FileText className="w-4 h-4 ml-1" />
              فاتورة شراء
            </Button>
            <Button
              variant={vendor.status === 'active' ? 'danger' : 'success'}
              size="sm"
              onClick={() => handleToggleStatus(vendor)}
            >
              {vendor.status === 'active' ? 'إلغاء تفعيل' : 'تفعيل'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDeleteVendor(vendor)}
            >
              حذف
            </Button>
          </div>
        );
      }
    }
  ];

  const filterOptions = [
    {
      key: 'status',
      label: 'الحالة',
      type: 'select',
      options: [
        { value: '', label: 'جميع الحالات' },
        { value: 'active', label: 'نشط' },
        { value: 'inactive', label: 'غير نشط' }
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
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalVendors}
              </div>
              <div className="text-sm text-gray-600">إجمالي الموردين</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">
                {stats.activeVendors}
              </div>
              <div className="text-sm text-gray-600">موردين نشطين</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">
                {stats.inactiveVendors}
              </div>
              <div className="text-sm text-gray-600">موردين غير نشطين</div>
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
                {stats.totalPurchaseOrders}
              </div>
              <div className="text-sm text-gray-600">طلبات الشراء</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">إدارة الموردين</h1>
            <Button onClick={handleCreateVendor} className="flex items-center">
              <Plus className="w-4 h-4 ml-2" />
              مورد جديد
            </Button>
          </div>

          <DataTable
            data={vendors}
            columns={columns}
          >
            {(table) => (
              <div className="space-y-4">
                {/* Search and Filters */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="text"
                      placeholder="البحث في الموردين..."
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
                      <option value="active">نشط</option>
                      <option value="inactive">غير نشط</option>
                    </select>
                  </div>
                  <div className="text-sm text-gray-500">
                    {pagination.totalItems} مورد
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
        title={editingVendor ? 'تعديل مورد' : 'مورد جديد'}
        size="lg"
      >
        <VendorForm
          vendor={editingVendor}
          onSave={handleSaveVendor}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default VendorsPage;
