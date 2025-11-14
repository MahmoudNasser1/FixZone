import React, { useState, useEffect } from 'react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsRightLeftIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import inventoryService from '../../services/inventoryService';
import { useNotifications } from '../../components/notifications/NotificationSystem';

const StockMovementPage = () => {
  const notifications = useNotifications();
  const [movements, setMovements] = useState([]);
  const [filteredMovements, setFilteredMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    startDate: '',
    endDate: '',
    itemId: ''
  });

  const movementTypes = [
    { value: 'IN', label: 'دخول', icon: ArrowUpIcon, color: 'text-green-600' },
    { value: 'OUT', label: 'خروج', icon: ArrowDownIcon, color: 'text-red-600' },
    { value: 'TRANSFER', label: 'نقل', icon: ArrowsRightLeftIcon, color: 'text-blue-600' }
  ];

  const fetchStockMovements = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      
      if (filters.type) params.type = filters.type;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.itemId) params.inventoryItemId = filters.itemId;
      
      const response = await inventoryService.listMovements(params);
      
      // معالجة الاستجابة بشكل صحيح
      let movementsData = [];
      if (Array.isArray(response)) {
        movementsData = response;
      } else if (response && response.success) {
        movementsData = response.data || [];
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else if (response && response.data && Array.isArray(response.data)) {
        movementsData = response.data;
      }
      
      // معالجة البيانات لاستخدام نفس البنية
      const processedMovements = movementsData.map(m => ({
        ...m,
        // استخدام type من الـ API (IN/OUT/TRANSFER)
        type: m.type || 'IN',
        // استخدام warehouseName من fromWarehouseName أو toWarehouseName
        warehouseName: m.type === 'IN' ? m.toWarehouseName : 
                       m.type === 'OUT' ? m.fromWarehouseName : 
                       `${m.fromWarehouseName || ''} → ${m.toWarehouseName || ''}`.trim()
      }));
      
      setMovements(processedMovements);
      setFilteredMovements(processedMovements);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      notifications.error('حدث خطأ في تحميل حركات المخزون');
      setMovements([]);
      setFilteredMovements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockMovements();
  }, [pagination.page, filters.type, filters.startDate, filters.endDate, filters.itemId]);

  useEffect(() => {
    // Filter locally for search term only (other filters are handled server-side)
    let filtered = movements;

    if (filters.search) {
      filtered = filtered.filter(movement =>
        movement.itemName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        movement.userName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        movement.sku?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredMovements(filtered);
  }, [filters.search, movements]);

  const getMovementIcon = (type) => {
    const movementType = movementTypes.find(t => t.value === type);
    if (!movementType) return null;
    
    const IconComponent = movementType.icon;
    return <IconComponent className={`h-5 w-5 ${movementType.color}`} />;
  };

  const getMovementLabel = (type) => {
    const movementType = movementTypes.find(t => t.value === type);
    return movementType ? movementType.label : type;
  };

  const getMovementColor = (type) => {
    const movementType = movementTypes.find(t => t.value === type);
    switch (type) {
      case 'IN':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'OUT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'TRANSFER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ArrowsRightLeftIcon className="h-8 w-8 text-blue-600" />
              حركة المخزون
            </h1>
            <p className="text-gray-600 mt-1">تتبع جميع حركات المخزون والتحويلات</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            إضافة حركة جديدة
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-blue-600" />
          فلاتر البحث
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              البحث
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في الحركات..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع الحركة
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">جميع الأنواع</option>
              {movementTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              صنف محدد (ID)
            </label>
            <input
              type="number"
              placeholder="معرف الصنف"
              value={filters.itemId}
              onChange={(e) => setFilters({...filters, itemId: e.target.value, page: 1})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تاريخ البداية
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value, page: 1})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تاريخ النهاية
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value, page: 1})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({
                  search: '',
                  type: '',
                  startDate: '',
                  endDate: '',
                  itemId: ''
                });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              مسح الفلاتر
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {movementTypes.map((type) => {
          const count = Array.isArray(movements) ? movements.filter(m => m.type === type.value).length : 0;
          const IconComponent = type.icon;
          
          return (
            <div key={type.value} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <IconComponent className={`h-8 w-8 ${type.color}`} />
                <div className="mr-3">
                  <div className="text-sm font-medium text-gray-800">{type.label}</div>
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-700">
            عرض {((pagination.page - 1) * pagination.limit) + 1} إلى {Math.min(pagination.page * pagination.limit, pagination.total)} من {pagination.total} حركة
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
              disabled={pagination.page === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              السابق
            </button>
            <span className="px-3 py-2 text-sm text-gray-700">
              صفحة {pagination.page} من {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: Math.min(pagination.totalPages, pagination.page + 1) })}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              التالي
            </button>
          </div>
        </div>
      )}

      {/* Movements Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            سجل حركة المخزون ({filteredMovements.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  نوع الحركة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اسم القطعة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الكمية
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المخزن
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المستخدم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  السبب
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    لا توجد حركات مخزون
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getMovementColor(movement.type)}`}>
                        {getMovementIcon(movement.type)}
                        <span className="mr-1">{getMovementLabel(movement.type)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {movement.itemName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`font-medium ${
                        movement.type === 'in' ? 'text-green-600' : 
                        movement.type === 'out' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : ''}{movement.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.warehouseName || movement.fromWarehouseName || movement.toWarehouseName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.userName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.reason || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(movement.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockMovementPage;

