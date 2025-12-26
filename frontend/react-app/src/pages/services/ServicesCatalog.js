import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  MoreVertical,
  Package,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import apiService from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import SimpleButton from '../../components/ui/SimpleButton';
import { Input } from '../../components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/Select';
import DataView from '../../components/ui/DataView';
import { Loading } from '../../components/ui/Loading';

const ServicesCatalog = () => {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const notify = (type, message) => {
    notifications.addNotification({ type, message });
  };

  // State management
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('serviceName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Multi-select state
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Actions menu
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef(null);

  // Load services
  const loadServices = async () => {
    try {
      setLoading(true);
      const params = {
        q: searchTerm,
        page: currentPage,
        pageSize: pageSize,
        sortBy: sortBy,
        sortDir: sortDirection,
      };

      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter !== '') params.isActive = statusFilter === 'active' ? 'true' : 'false';

      const data = await apiService.getServices(params);

      setServices(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.total || 0);
    } catch (error) {
      console.error('Error loading services:', error);
      notify('error', 'خطأ في تحميل الخدمات');
    } finally {
      setLoading(false);
    }
  };

  // Load services on component mount and when filters change
  useEffect(() => {
    loadServices();
  }, [currentPage, pageSize, sortBy, sortDirection, searchTerm, categoryFilter, statusFilter]);

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page
  };

  // Handle category filter
  const handleCategoryFilter = (value) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  // Handle status filter
  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // Handle sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Multi-select handlers
  const handleSelectService = (serviceId) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedServices([]);
    } else {
      setSelectedServices(services.map(service => service.id));
    }
    setSelectAll(!selectAll);
  };

  // Update selectAll when selectedServices changes
  useEffect(() => {
    if (services.length > 0) {
      setSelectAll(selectedServices.length === services.length);
    } else {
      setSelectAll(false);
    }
  }, [selectedServices, services]);

  // Handle delete service
  const handleDeleteService = async (serviceId) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الخدمة؟')) {
      try {
        await apiService.deleteService(serviceId);
        setServices(prevServices => prevServices.filter(service => service.id !== serviceId));
        notify('success', 'تم حذف الخدمة بنجاح');
      } catch (error) {
        console.error('Error deleting service:', error);
        notify('error', 'خطأ في حذف الخدمة');
      }
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedServices.length === 0) {
      notify('warning', 'يرجى اختيار خدمة واحدة على الأقل');
      return;
    }

    if (window.confirm(`هل أنت متأكد من حذف ${selectedServices.length} خدمة؟`)) {
      try {
        const deletePromises = selectedServices.map(id => apiService.deleteService(id));
        await Promise.all(deletePromises);

        setServices(prevServices =>
          prevServices.filter(service => !selectedServices.includes(service.id))
        );
        setSelectedServices([]);
        notify('success', `تم حذف ${selectedServices.length} خدمة بنجاح`);
      } catch (error) {
        console.error('Error bulk deleting services:', error);
        notify('error', 'خطأ في حذف الخدمات');
      }
    }
  };

  // Toggle service status
  const handleToggleStatus = async (serviceId, currentStatus) => {
    try {
      const service = services.find(s => s.id === serviceId);
      if (!service) return;

      await apiService.updateService(serviceId, {
        name: service.name,
        description: service.description,
        basePrice: service.basePrice,
        category: service.category,
        estimatedDuration: service.estimatedDuration,
        isActive: !currentStatus
      });

      setServices(prevServices =>
        prevServices.map(s =>
          s.id === serviceId ? { ...s, isActive: !currentStatus } : s
        )
      );
      notify('success', 'تم تحديث حالة الخدمة بنجاح');
    } catch (error) {
      console.error('Error toggling service status:', error);
      notify('error', 'خطأ في تحديث حالة الخدمة');
    }
  };

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Load categories from API
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await apiService.getServiceCategories(true); // Get only active categories
      const categoriesData = response.categories || response || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback: get unique categories from services
      const uniqueCategories = [...new Set(services.map(service => service.category).filter(Boolean))];
      setCategories(uniqueCategories.map(name => ({ name })));
    } finally {
      setLoadingCategories(false);
    }
  };

  // Table columns
  const columns = [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={selectAll}
          onChange={handleSelectAll}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />
      ),
      render: (service) => (
        <input
          type="checkbox"
          checked={selectedServices.includes(service.id)}
          onChange={() => handleSelectService(service.id)}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />
      ),
      width: '50px'
    },
    {
      key: 'serviceName',
      title: 'اسم الخدمة',
      sortable: true,
      render: (service) => (
        <div className="flex items-center space-x-3 space-x-reverse">
          <Package className="w-5 h-5 text-blue-600" />
          <div>
            <div className="font-medium text-gray-900">{service.name}</div>
            {service.description && (
              <div className="text-sm text-gray-500 truncate max-w-xs">
                {service.description}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'category',
      title: 'الفئة',
      render: (service) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {service.category || 'غير محدد'}
        </span>
      )
    },
    {
      key: 'basePrice',
      title: 'السعر الأساسي',
      sortable: true,
      render: (service) => (
        <div className="flex items-center space-x-1 space-x-reverse">
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="font-medium text-green-700">
            {service.basePrice ? `${service.basePrice} ج.م` : 'غير محدد'}
          </span>
        </div>
      )
    },
    {
      key: 'estimatedDuration',
      title: 'المدة المقدرة',
      render: (service) => (
        <div className="flex items-center space-x-1 space-x-reverse">
          <Clock className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-600">
            {service.estimatedDuration ? `${service.estimatedDuration} دقيقة` : 'غير محدد'}
          </span>
        </div>
      )
    },
    {
      key: 'isActive',
      title: 'الحالة',
      render: (service) => (
        <button
          onClick={() => handleToggleStatus(service.id, service.isActive)}
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${service.isActive
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-red-100 text-red-800 hover:bg-red-200'
            }`}
        >
          {service.isActive ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1" />
              نشط
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 mr-1" />
              غير نشط
            </>
          )}
        </button>
      )
    },
    {
      key: 'actions',
      title: 'الإجراءات',
      render: (service) => (
        <div className="flex items-center space-x-2 space-x-reverse">
          <SimpleButton
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/services/${service.id}`)}
            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
          >
            <Eye className="w-4 h-4" />
          </SimpleButton>
          <SimpleButton
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/services/${service.id}/edit`)}
            className="h-8 w-8 p-0 text-green-600 hover:text-green-800"
          >
            <Edit2 className="w-4 h-4" />
          </SimpleButton>
          <SimpleButton
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteService(service.id)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
          >
            <Trash2 className="w-4 h-4" />
          </SimpleButton>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">كتالوج الخدمات</h1>
            <p className="text-muted-foreground mt-1">إدارة جميع خدمات الإصلاح المتاحة</p>
          </div>
          <SimpleButton
            onClick={() => navigate('/services/new')}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة خدمة جديدة
          </SimpleButton>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-muted/30 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              البحث
            </label>
            <div className="relative">
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="ابحث في الخدمات..."
                className="pr-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              الفئة
            </label>
            <Select
              value={categoryFilter}
              onValueChange={handleCategoryFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">جميع الفئات</SelectItem>
                {loadingCategories ? (
                  <SelectItem value="" disabled>جاري التحميل...</SelectItem>
                ) : (
                  categories.map(cat => (
                    <SelectItem
                      key={cat.id || cat.name || cat}
                      value={cat.name || cat}
                    >
                      {cat.name || cat}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              الحالة
            </label>
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              ترتيب حسب
            </label>
            <Select
              value={`${sortBy}-${sortDirection}`}
              onValueChange={(value) => {
                const [field, direction] = value.split('-');
                setSortBy(field);
                setSortDirection(direction);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="serviceName-asc">اسم الخدمة (أ-ي)</SelectItem>
                <SelectItem value="serviceName-desc">اسم الخدمة (ي-أ)</SelectItem>
                <SelectItem value="basePrice-asc">السعر (منخفض-عالي)</SelectItem>
                <SelectItem value="basePrice-desc">السعر (عالي-منخفض)</SelectItem>
                <SelectItem value="createdAt-desc">الأحدث أولاً</SelectItem>
                <SelectItem value="createdAt-asc">الأقدم أولاً</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedServices.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <span className="text-sm font-medium text-blue-900">
                تم اختيار {selectedServices.length} خدمة
              </span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <SimpleButton
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 ml-1" />
                حذف المحدد
              </SimpleButton>
              <SimpleButton
                variant="outline"
                size="sm"
                onClick={() => setSelectedServices([])}
              >
                إلغاء الاختيار
              </SimpleButton>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600" />
            <div className="mr-3">
              <p className="text-sm font-medium text-muted-foreground">إجمالي الخدمات</p>
              <p className="text-2xl font-bold text-foreground">{totalItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="mr-3">
              <p className="text-sm font-medium text-muted-foreground">الخدمات النشطة</p>
              <p className="text-2xl font-bold text-foreground">
                {services.filter(s => s.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-600" />
            <div className="mr-3">
              <p className="text-sm font-medium text-muted-foreground">الخدمات غير النشطة</p>
              <p className="text-2xl font-bold text-foreground">
                {services.filter(s => !s.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-yellow-600" />
            <div className="mr-3">
              <p className="text-sm font-medium text-muted-foreground">متوسط السعر</p>
              <p className="text-2xl font-bold text-foreground">
                {services.length > 0
                  ? Math.round(services.reduce((sum, s) => {
                    const price = parseFloat(s.basePrice) || 0;
                    return sum + price;
                  }, 0) / services.length)
                  : 0} ج.م
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Bulk Actions Bar */}
        {selectedServices.length > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                تم اختيار {selectedServices.length} خدمة
              </span>
              <div className="flex items-center space-x-2 space-x-reverse">
                <SimpleButton
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 ml-1" />
                  حذف المحدد
                </SimpleButton>
                <SimpleButton
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedServices([])}
                >
                  إلغاء الاختيار
                </SimpleButton>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loading size="xl" text="جاري تحميل الخدمات..." />
          </div>
        ) : (
          <>
            {/* Services Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      اسم الخدمة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      الفئة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      السعر الأساسي
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      المدة المقدرة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service.id)}
                          onChange={() => handleSelectService(service.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <Package className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-medium text-gray-900">{service.name}</div>
                            {service.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {service.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {service.category || 'غير محدد'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-700">
                            {service.basePrice ? `${service.basePrice} ج.م` : 'غير محدد'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span className="text-gray-900">
                            {service.estimatedDuration ? `${service.estimatedDuration} دقيقة` : 'غير محدد'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(service.id, service.isActive)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${service.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                        >
                          {service.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              نشط
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              غير نشط
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <SimpleButton
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/services/${service.id}`)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </SimpleButton>
                          <SimpleButton
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/services/${service.id}/edit`)}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-800"
                            title="تعديل"
                          >
                            <Edit2 className="w-4 h-4" />
                          </SimpleButton>
                          <SimpleButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteService(service.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </SimpleButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {services.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">لا توجد خدمات متاحة</h3>
                <p className="text-muted-foreground mb-4">ابدأ بإضافة خدمة جديدة لعرضها هنا</p>
                <SimpleButton
                  onClick={() => navigate('/services/new')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة خدمة جديدة
                </SimpleButton>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ServicesCatalog;

