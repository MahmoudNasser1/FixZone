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

const StockMovementPage = () => {
  const [movements, setMovements] = useState([]);
  const [filteredMovements, setFilteredMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    startDate: '',
    endDate: '',
    itemId: ''
  });

  const movementTypes = [
    { value: 'in', label: 'دخول', icon: ArrowUpIcon, color: 'text-green-600' },
    { value: 'out', label: 'خروج', icon: ArrowDownIcon, color: 'text-red-600' },
    { value: 'transfer', label: 'نقل', icon: ArrowsRightLeftIcon, color: 'text-blue-600' },
    { value: 'adjustment', label: 'تسوية', icon: AdjustmentsHorizontalIcon, color: 'text-purple-600' }
  ];

  const fetchStockMovements = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/inventory-enhanced/movements', {
        credentials: 'include'
      });
      const data = await response.json();
      console.log('Stock movements data:', data);
      
      // معالجة الاستجابة بشكل صحيح
      const movementsData = Array.isArray(data) ? data : (data.data?.movements || data.movements || []);
      setMovements(movementsData);
      setFilteredMovements(movementsData);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      // Mock data for demonstration
      const mockMovements = [
        {
          id: 1,
          type: 'in',
          quantity: 50,
          inventoryItemId: 1,
          itemName: 'شاشة LCD 15.6 بوصة',
          fromWarehouseId: null,
          toWarehouseId: 1,
          warehouseName: 'المخزن الرئيسي',
          userId: 1,
          userName: 'أحمد محمد',
          createdAt: new Date().toISOString(),
          reason: 'شراء جديد'
        },
        {
          id: 2,
          type: 'out',
          quantity: 2,
          inventoryItemId: 2,
          itemName: 'بطارية لابتوب',
          fromWarehouseId: 1,
          toWarehouseId: null,
          warehouseName: 'المخزن الرئيسي',
          userId: 2,
          userName: 'سارة أحمد',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          reason: 'استخدام في إصلاح'
        },
        {
          id: 3,
          type: 'transfer',
          quantity: 10,
          inventoryItemId: 3,
          itemName: 'لوحة مفاتيح',
          fromWarehouseId: 1,
          toWarehouseId: 2,
          warehouseName: 'مخزن الفرع',
          userId: 1,
          userName: 'أحمد محمد',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          reason: 'نقل بين المخازن'
        }
      ];
      setMovements(mockMovements);
      setFilteredMovements(mockMovements);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadMovements = async () => {
      setLoading(true);
      await fetchStockMovements();
      setLoading(false);
    };

    loadMovements();
  }, []);

  useEffect(() => {
    let filtered = movements;

    if (filters.search) {
      filtered = filtered.filter(movement =>
        movement.itemName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        movement.userName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        movement.reason?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.type) {
      filtered = filtered.filter(movement => movement.type === filters.type);
    }

    if (filters.startDate) {
      filtered = filtered.filter(movement => 
        new Date(movement.createdAt) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(movement => 
        new Date(movement.createdAt) <= new Date(filters.endDate)
      );
    }

    if (filters.itemId) {
      filtered = filtered.filter(movement => movement.inventoryItemId == filters.itemId);
    }

    setFilteredMovements(filtered);
  }, [filters, movements]);

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
      case 'in':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'out':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'transfer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'adjustment':
        return 'bg-purple-100 text-purple-800 border-purple-200';
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
              تاريخ البداية
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
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
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                search: '',
                type: '',
                startDate: '',
                endDate: '',
                itemId: ''
              })}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              مسح الفلاتر
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                      {movement.warehouseName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.reason}
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

