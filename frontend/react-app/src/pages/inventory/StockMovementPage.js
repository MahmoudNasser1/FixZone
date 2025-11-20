import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import inventoryService from '../../services/inventoryService';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleBadge from '../../components/ui/SimpleBadge';
import DataView from '../../components/ui/DataView';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/Select';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import LoadingSpinner, { TableLoadingSkeleton, CardLoadingSkeleton } from '../../components/ui/LoadingSpinner';
import StockMovementForm from './StockMovementForm';
import { 
  Plus, Search, Filter, Download, RefreshCw,
  ArrowUp, ArrowDown, ArrowRightLeft,
  Package, Warehouse, Calendar, Hash,
  Eye, Edit, Trash2, TrendingUp, TrendingDown,
  ArrowUpDown, X, Users, FileText
} from 'lucide-react';

const StockMovementPage = () => {
  const navigate = useNavigate();
  const notifications = useNotifications();
  
  // مساعد تنبيهات بسيط لتقليل الإزعاج
  const notify = useCallback((type, message) => {
    if (notifications?.addNotification) {
      notifications.addNotification({ type, message });
    } else if (notifications?.[type]) {
      notifications[type](message);
    }
  }, [notifications]);

  const [movements, setMovements] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  
  // Multi-select state
  const [selectedMovements, setSelectedMovements] = useState([]);
  
  // Sorting state
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState(null);
  
  // Stats state
  const [stats, setStats] = useState({
    totalMovements: 0,
    counts: { in: 0, out: 0, transfer: 0 },
    totalQuantity: { in: 0, out: 0, transfer: 0 },
    today: { movements: 0, inQuantity: 0, outQuantity: 0, transferQuantity: 0 }
  });

  const isInitialMount = useRef(true);

  // Movement types
  const movementTypes = [
    { value: 'IN', label: 'دخول', icon: ArrowUp, color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-200' },
    { value: 'OUT', label: 'خروج', icon: ArrowDown, color: 'text-red-600', bgColor: 'bg-red-100', borderColor: 'border-red-200' },
    { value: 'TRANSFER', label: 'نقل', icon: ArrowRightLeft, color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-200' }
  ];

  // جلب البيانات
  useEffect(() => {
    loadInitialData();
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    if (isInitialMount.current) return;
    
    const timer = setTimeout(() => {
      fetchMovements();
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timer);
  }, [currentPage, itemsPerPage, selectedType, selectedWarehouse, selectedItem, dateFrom, dateTo, sortField, sortDirection, searchTerm]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadWarehouses(),
        fetchMovements(),
        fetchStats()
      ]);
      isInitialMount.current = false;
    } catch (error) {
      console.error('Error loading initial data:', error);
      notify('error', 'خطأ في تحميل البيانات');
      isInitialMount.current = false;
    }
  };

  const loadWarehouses = async () => {
    try {
      const response = await inventoryService.listWarehouses();
      let warehousesData = [];
      
      if (Array.isArray(response)) {
        warehousesData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        warehousesData = response.data;
      } else if (response?.warehouses && Array.isArray(response.warehouses)) {
        warehousesData = response.warehouses;
      }
      
      setWarehouses(warehousesData);
    } catch (error) {
      console.error('Error loading warehouses:', error);
      setWarehouses([]);
    }
  };

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sort: sortField,
        sortDir: sortDirection === 'asc' ? 'ASC' : 'DESC'
      };

      if (selectedType) {
        params.type = selectedType;
      }

      if (selectedWarehouse) {
        params.warehouseId = selectedWarehouse;
      }

      if (selectedItem) {
        params.inventoryItemId = selectedItem;
      }

      if (dateFrom) {
        params.startDate = dateFrom;
      }

      if (dateTo) {
        params.endDate = dateTo;
      }

      // Search (server-side via 'q' parameter)
      if (searchTerm && searchTerm.trim()) {
        params.q = searchTerm.trim();
      }

      const response = await apiService.getStockMovements(params);
      
      let movementsData = [];
      let totalCount = 0;

      if (response?.success && response?.data && Array.isArray(response.data)) {
        movementsData = response.data;
        totalCount = response.pagination?.total || 0;
      } else if (Array.isArray(response)) {
        movementsData = response;
        totalCount = response.length;
      } else if (response?.data && Array.isArray(response.data)) {
        movementsData = response.data;
        totalCount = response.pagination?.total || 0;
      }

      setMovements(movementsData);
      setTotalItems(totalCount);
    } catch (err) {
      console.error('Error fetching movements:', err);
      setError('حدث خطأ في تحميل بيانات حركات المخزون');
      setMovements([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, selectedType, selectedWarehouse, selectedItem, dateFrom, dateTo, sortField, sortDirection, searchTerm]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const params = {};
      if (selectedType) params.type = selectedType;
      if (selectedWarehouse) params.warehouseId = selectedWarehouse;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const response = await apiService.getStockMovementStats(params);
      
      if (response?.success && response?.data) {
        const summary = response.data.summary || {};
        setStats({
          totalMovements: summary.totalMovements || 0,
          counts: summary.counts || { in: 0, out: 0, transfer: 0 },
          totalQuantity: summary.totalQuantity || { in: 0, out: 0, transfer: 0 },
          today: summary.today || { movements: 0, inQuantity: 0, outQuantity: 0, transferQuantity: 0 }
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Handle create movement
  const handleCreateMovement = () => {
    setEditingMovement(null);
    setIsFormModalOpen(true);
  };

  // Handle edit movement
  const handleEditMovement = (movement) => {
    setEditingMovement(movement);
    setIsFormModalOpen(true);
  };

  // Handle delete movement
  const handleDeleteMovement = async (movementId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الحركة؟ سيتم عكس تأثيرها على المخزون.')) {
      return;
    }

    try {
      await apiService.deleteStockMovement(movementId);
      notify('success', 'تم حذف الحركة بنجاح');
      fetchMovements();
      fetchStats();
    } catch (error) {
      console.error('Error deleting movement:', error);
      notify('error', 'خطأ في حذف الحركة');
    }
  };

  // Handle form success
  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    setEditingMovement(null);
    fetchMovements();
    fetchStats();
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Render sort icon
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-blue-600" /> : 
      <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedWarehouse('');
    setSelectedItem('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  // Get movement type info
  const getMovementTypeInfo = (type) => {
    return movementTypes.find(t => t.value === type) || movementTypes[0];
  };

  // Columns definition for DataView
  const columns = [
    {
      id: 'type',
      key: 'type',
      header: (
        <button
          onClick={() => handleSort('type')}
          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
        >
          نوع الحركة
          {renderSortIcon('type')}
        </button>
      ),
      label: 'نوع الحركة',
      description: 'نوع الحركة',
      defaultVisible: true,
      accessorKey: 'type',
      cell: ({ row }) => {
        const movement = row.original;
        const typeInfo = getMovementTypeInfo(movement.type);
        const IconComponent = typeInfo.icon;
        return (
          <SimpleBadge 
            variant="secondary" 
            className={`flex items-center gap-1.5 ${typeInfo.bgColor} ${typeInfo.color} ${typeInfo.borderColor} border`}
          >
            <IconComponent className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{typeInfo.label}</span>
          </SimpleBadge>
        );
      }
    },
    {
      id: 'itemName',
      key: 'itemName',
      header: (
        <button
          onClick={() => handleSort('itemName')}
          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
        >
          الصنف
          {renderSortIcon('itemName')}
        </button>
      ),
      label: 'الصنف',
      description: 'اسم الصنف',
      defaultVisible: true,
      accessorKey: 'itemName',
      cell: ({ row }) => {
        const movement = row.original;
        return (
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">{movement.itemName || '-'}</p>
              {movement.sku && (
                <p className="text-xs text-gray-500">SKU: {movement.sku}</p>
              )}
            </div>
          </div>
        );
      }
    },
    {
      id: 'quantity',
      key: 'quantity',
      header: (
        <button
          onClick={() => handleSort('quantity')}
          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
        >
          الكمية
          {renderSortIcon('quantity')}
        </button>
      ),
      label: 'الكمية',
      description: 'كمية الحركة',
      defaultVisible: true,
      accessorKey: 'quantity',
      cell: ({ row }) => {
        const movement = row.original;
        const quantity = parseInt(movement.quantity || 0);
        const isIn = movement.type === 'IN';
        const isOut = movement.type === 'OUT';
        return (
          <div className="flex items-center gap-2">
            <Hash className={`w-4 h-4 ${isIn ? 'text-green-600' : isOut ? 'text-red-600' : 'text-blue-600'}`} />
            <span className={`font-semibold ${isIn ? 'text-green-600' : isOut ? 'text-red-600' : 'text-blue-600'}`}>
              {isIn ? '+' : isOut ? '-' : '→'} {quantity}
            </span>
          </div>
        );
      }
    },
    {
      id: 'warehouse',
      key: 'warehouse',
      header: 'المخزن',
      label: 'المخزن',
      description: 'المخزن',
      defaultVisible: true,
      accessorKey: 'warehouseName',
      cell: ({ row }) => {
        const movement = row.original;
        const warehouseName = movement.type === 'IN' 
          ? movement.toWarehouseName 
          : movement.type === 'OUT' 
          ? movement.fromWarehouseName 
          : movement.type === 'TRANSFER'
          ? `${movement.fromWarehouseName || '-'} → ${movement.toWarehouseName || '-'}`
          : '-';
        return (
          <div className="flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">{warehouseName}</span>
          </div>
        );
      }
    },
    {
      id: 'user',
      key: 'user',
      header: 'المستخدم',
      label: 'المستخدم',
      description: 'المستخدم الذي أنشأ الحركة',
      defaultVisible: true,
      accessorKey: 'userName',
      cell: ({ row }) => {
        const movement = row.original;
        return movement.userName ? (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">{movement.userName}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        );
      }
    },
    {
      id: 'notes',
      key: 'notes',
      header: 'الملاحظات',
      label: 'الملاحظات',
      description: 'ملاحظات الحركة',
      defaultVisible: false,
      accessorKey: 'notes',
      cell: ({ row }) => {
        const movement = row.original;
        return (
          <div className="max-w-xs">
            <p className="text-sm text-gray-700 truncate">
              {movement.notes || '-'}
            </p>
          </div>
        );
      }
    },
    {
      id: 'createdAt',
      key: 'createdAt',
      header: (
        <button
          onClick={() => handleSort('createdAt')}
          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
        >
          التاريخ
          {renderSortIcon('createdAt')}
        </button>
      ),
      label: 'التاريخ',
      description: 'تاريخ الحركة',
      defaultVisible: true,
      accessorKey: 'createdAt',
      cell: ({ row }) => {
        const movement = row.original;
        return (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900">
              {movement.createdAt ? new Date(movement.createdAt).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : '-'}
            </span>
          </div>
        );
      }
    },
    {
      id: 'actions',
      key: 'actions',
      header: 'الإجراءات',
      label: 'الإجراءات',
      description: 'إجراءات الحركة',
      defaultVisible: true,
      enableSorting: false,
      cell: ({ row }) => {
        const movement = row.original;
        return (
          <div className="flex items-center gap-1">
            <SimpleButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEditMovement(movement);
              }}
              className="h-8 w-8 p-0"
              title="تعديل"
            >
              <Edit className="w-4 h-4" />
            </SimpleButton>
            <SimpleButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteMovement(movement.id);
              }}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              title="حذف"
            >
              <Trash2 className="w-4 h-4" />
            </SimpleButton>
          </div>
        );
      }
    }
  ];

  // Render card
  const renderCard = (movement) => {
    const quantity = parseInt(movement.quantity || 0);
    const typeInfo = getMovementTypeInfo(movement.type);
    const IconComponent = typeInfo.icon;
    const warehouseName = movement.type === 'IN' 
      ? movement.toWarehouseName 
      : movement.type === 'OUT' 
      ? movement.fromWarehouseName 
      : movement.type === 'TRANSFER'
      ? `${movement.fromWarehouseName || '-'} → ${movement.toWarehouseName || '-'}`
      : '-';
    
    return (
      <SimpleCard className="hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200" onClick={() => handleEditMovement(movement)}>
        <SimpleCardContent className="p-5">
          {/* Header with Type */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <SimpleBadge 
                  variant="secondary" 
                  className={`flex items-center gap-1.5 px-2.5 py-1 ${typeInfo.bgColor} ${typeInfo.color} ${typeInfo.borderColor} border`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{typeInfo.label}</span>
                </SimpleBadge>
              </div>
              
              {/* Quantity */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {movement.type === 'IN' ? '+' : movement.type === 'OUT' ? '-' : '→'} {quantity}
              </h3>
              
              {/* Item Info */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="font-medium">الصنف:</span>
                  <span className="text-gray-900">{movement.itemName || '-'}</span>
                </div>
                {movement.sku && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mr-6">
                    <span>SKU: {movement.sku}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Warehouse className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="font-medium">المخزن:</span>
                  <span className="text-gray-900">{warehouseName}</span>
                </div>
              </div>
              
              {/* Notes */}
              {movement.notes && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2 bg-gray-50 p-2 rounded">
                  {movement.notes}
                </p>
              )}
            </div>
          </div>
          
          {/* Footer with Meta Info */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{movement.createdAt ? new Date(movement.createdAt).toLocaleDateString('ar-EG') : '-'}</span>
              </div>
              {movement.userName && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>{movement.userName}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <SimpleButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditMovement(movement);
                }}
                className="h-6 w-6 p-0"
              >
                <Edit className="w-3 h-3" />
              </SimpleButton>
              <SimpleButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteMovement(movement.id);
                }}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3" />
              </SimpleButton>
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>
    );
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ArrowRightLeft className="w-8 h-8 text-blue-600" />
            إدارة حركات المخزون
          </h1>
          <p className="text-gray-600 mt-1">تتبع جميع حركات المخزون والتحويلات</p>
        </div>
        <SimpleButton onClick={handleCreateMovement}>
          <Plus className="w-5 h-5 ml-2" />
          إضافة حركة جديدة
        </SimpleButton>
      </div>

      {/* Stats Cards */}
      {!loadingStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SimpleCard>
            <SimpleCardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <ArrowRightLeft className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">إجمالي الحركات</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalMovements}</p>
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {movementTypes.map((type) => {
            const count = stats.counts[type.value.toLowerCase()] || 0;
            const quantity = stats.totalQuantity[type.value.toLowerCase()] || 0;
            const IconComponent = type.icon;
            
            return (
              <SimpleCard key={type.value}>
                <SimpleCardContent className="p-6">
                  <div className="flex items-center">
                    <div className={`p-2 ${type.bgColor} rounded-lg`}>
                      <IconComponent className={`w-6 h-6 ${type.color}`} />
                    </div>
                    <div className="mr-4">
                      <p className="text-sm font-medium text-gray-600">{type.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                      <p className="text-xs text-gray-500">{quantity} وحدة</p>
                    </div>
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <SimpleCard>
        <SimpleCardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في الحركات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 w-64"
                />
              </div>

              {/* Type Filter */}
              <Select
                value={selectedType}
                onValueChange={(value) => {
                  setSelectedType(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="جميع الأنواع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع الأنواع</SelectItem>
                  {movementTypes.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className={`w-4 h-4 ${type.color}`} />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Warehouse Filter */}
              <Select
                value={selectedWarehouse}
                onValueChange={(value) => {
                  setSelectedWarehouse(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="جميع المخازن" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع المخازن</SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Item Filter */}
              <Input
                type="number"
                placeholder="معرف الصنف"
                value={selectedItem}
                onChange={(e) => {
                  setSelectedItem(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-32"
              />

              {/* Date From */}
              <Input
                type="date"
                placeholder="تاريخ البداية"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-40"
              />

              {/* Date To */}
              <Input
                type="date"
                placeholder="تاريخ النهاية"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-40"
              />

              {/* Clear Filters */}
              {(selectedType || selectedWarehouse || selectedItem || dateFrom || dateTo || searchTerm) && (
                <SimpleButton
                  variant="outline"
                  onClick={handleClearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  مسح
                </SimpleButton>
              )}
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* Data View */}
      {loading && isInitialMount.current ? (
        <div className="space-y-4">
          <CardLoadingSkeleton count={6} />
        </div>
      ) : error ? (
        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="text-center text-red-600">{error}</div>
          </SimpleCardContent>
        </SimpleCard>
      ) : (
        <DataView
          data={movements}
          columns={columns}
          renderCard={renderCard}
          pagination={{
            currentPage,
            totalPages,
            itemsPerPage,
            totalItems,
            onPageChange: setCurrentPage,
            onItemsPerPageChange: setItemsPerPage
          }}
          emptyMessage="لا توجد حركات مخزون"
          loading={loading && !isInitialMount.current}
        />
      )}

      {/* Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingMovement(null);
        }}
        title={editingMovement ? 'تعديل حركة مخزون' : 'إضافة حركة مخزون جديدة'}
        size="xl"
      >
        <StockMovementForm
          movement={editingMovement}
          onSave={handleFormSuccess}
          onCancel={() => {
            setIsFormModalOpen(false);
            setEditingMovement(null);
          }}
          onSuccess={handleFormSuccess}
        />
      </Modal>
    </div>
  );
};

export default StockMovementPage;
