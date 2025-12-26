import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Users, TrendingUp, DollarSign, Eye, FileText, Edit, Trash2, Power } from 'lucide-react';
import { SimpleCard, SimpleCardContent, SimpleCardHeader } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import DataView from '../../components/ui/DataView';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/Select';
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
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center ml-3">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="font-medium text-foreground">{vendor.name}</div>
              <div className="text-sm text-muted-foreground">{vendor.contactPerson}</div>
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
            <div className="text-foreground">{vendor.phone}</div>
            <div className="text-muted-foreground">{vendor.email}</div>
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
          <div className="text-sm text-muted-foreground">
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
          <SimpleBadge variant={vendor.status === 'active' ? 'success' : 'destructive'}>
            {vendor.status === 'active' ? 'نشط' : 'غير نشط'}
          </SimpleBadge>
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
          <span className="text-sm font-medium text-foreground">
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
          <div className="flex flex-wrap gap-2">
            <SimpleButton
              variant="outline"
              size="sm"
              onClick={() => navigate(`/vendors/${vendor.id}`)}
              title="عرض التفاصيل"
            >
              <Eye className="w-4 h-4 ml-1" />
              تفاصيل
            </SimpleButton>
            <SimpleButton
              variant="outline"
              size="sm"
              onClick={() => handleEditVendor(vendor)}
            >
              <Edit className="w-4 h-4 ml-1" />
              تعديل
            </SimpleButton>
            <SimpleButton
              variant="outline"
              size="sm"
              onClick={() => navigate(`/invoices/new?vendorId=${vendor.id}`)}
              title="إنشاء فاتورة شراء للمورد"
            >
              <FileText className="w-4 h-4 ml-1" />
              فاتورة
            </SimpleButton>
            <SimpleButton
              variant={vendor.status === 'active' ? 'destructive' : 'default'}
              size="sm"
              onClick={() => handleToggleStatus(vendor)}
            >
              <Power className="w-4 h-4 ml-1" />
              {vendor.status === 'active' ? 'إلغاء' : 'تفعيل'}
            </SimpleButton>
            <SimpleButton
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteVendor(vendor)}
            >
              <Trash2 className="w-4 h-4 ml-1" />
              حذف
            </SimpleButton>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-blue-500/10 rounded-full">
                <Building2 className="h-6 w-6 text-blue-500" />
              </div>
              <div className="mr-4">
                <div className="text-2xl font-bold text-foreground">
                  {stats.totalVendors}
                </div>
                <div className="text-sm text-muted-foreground">إجمالي الموردين</div>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-green-500/10 rounded-full">
                <Users className="h-6 w-6 text-green-500" />
              </div>
              <div className="mr-4">
                <div className="text-2xl font-bold text-foreground">
                  {stats.activeVendors}
                </div>
                <div className="text-sm text-muted-foreground">موردين نشطين</div>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-yellow-500/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="mr-4">
                <div className="text-2xl font-bold text-foreground">
                  {stats.inactiveVendors}
                </div>
                <div className="text-sm text-muted-foreground">موردين غير نشطين</div>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-purple-500/10 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-500" />
              </div>
              <div className="mr-4">
                <div className="text-2xl font-bold text-foreground">
                  {stats.totalPurchaseOrders}
                </div>
                <div className="text-sm text-muted-foreground">طلبات الشراء</div>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>

      {/* Main Content */}
      <SimpleCard>
        <SimpleCardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">إدارة الموردين</h1>
            <SimpleButton onClick={handleCreateVendor} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 ml-2" />
              مورد جديد
            </SimpleButton>
          </div>
        </SimpleCardHeader>
        <SimpleCardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
              <Input
                type="text"
                placeholder="البحث في الموردين..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-full sm:w-48 text-right dir-rtl">
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {pagination.totalItems} مورد
            </div>
          </div>

          {/* Data Table */}
          <DataView
            data={vendors}
            columns={columns}
            loading={loading}
            emptyMessage="لا توجد موردين"
            defaultView="table"
          />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-border">
              <div className="text-sm text-muted-foreground">
                صفحة {pagination.page} من {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <SimpleButton
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  السابق
                </SimpleButton>
                <SimpleButton
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  التالي
                </SimpleButton>
              </div>
            </div>
          )}
        </SimpleCardContent>
      </SimpleCard>

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
