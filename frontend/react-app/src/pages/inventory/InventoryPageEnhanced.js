import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiService from '../../services/api';
import inventoryService from '../../services/inventoryService';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { useSettings } from '../../context/SettingsContext';
import { 
  Package, Warehouse, TrendingUp, TrendingDown, AlertTriangle,
  Search, Plus, Edit, Trash2, Eye, RefreshCw, Download,
  ArrowUpDown, ArrowUp, ArrowDown, Filter, Box, DollarSign
} from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner, TableLoadingSkeleton, CardLoadingSkeleton } from '../../components/ui/LoadingSpinner';
import StatsDashboard from '../../components/inventory/StatsDashboard';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '../../components/ui/Modal';

const InventoryPageEnhanced = () => {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const { formatMoney } = useSettings();
  
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stockLevels, setStockLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State للبحث والفلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // all | low | normal | high
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // State للـ Multi-Select و Pagination
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // State للإحصائيات
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalQuantity: 0,
    potentialProfit: 0
  });

  // State لإدارة المخزون
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [stockForm, setStockForm] = useState({ warehouseId: '', quantity: '', minLevel: '' });
  const [savingStock, setSavingStock] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [itemsRes, warehousesRes, stockLevelsRes, statsRes] = await Promise.all([
        inventoryService.listItems(),
        inventoryService.listWarehouses(),
        inventoryService.listStockLevels(),
        inventoryService.getStatistics()
      ]);
      
      // Parse Enhanced APIs responses
      let itemsData = [];
      if (itemsRes && itemsRes.success) {
        itemsData = itemsRes.data?.items || itemsRes.data || [];
      } else if (Array.isArray(itemsRes)) {
        itemsData = itemsRes;
      }
      
      console.log('Items data loaded:', itemsData.length, 'items');
      
      let warehousesData = [];
      if (warehousesRes) {
        if (Array.isArray(warehousesRes)) {
          warehousesData = warehousesRes;
        } else if (warehousesRes.data) {
          warehousesData = Array.isArray(warehousesRes.data) ? warehousesRes.data : [];
        }
      }
      console.log('Warehouses loaded:', warehousesData.length, 'warehouses');
      
      let stockData = [];
      if (stockLevelsRes) {
        if (Array.isArray(stockLevelsRes)) {
          stockData = stockLevelsRes;
        } else if (stockLevelsRes.data) {
          stockData = Array.isArray(stockLevelsRes.data) ? stockLevelsRes.data : [];
        }
      }
      console.log('Stock levels loaded:', stockData.length, 'levels');
      
      setItems(itemsData);
      setWarehouses(warehousesData);
      setStockLevels(stockData);
      
      // Use Enhanced Stats API
      if (statsRes && statsRes.success) {
        const enhancedStats = statsRes.data;
        console.log('Enhanced stats:', enhancedStats);
        setStats({
          totalItems: enhancedStats.overview?.totalItems || 0,
          totalValue: enhancedStats.overview?.totalCostValue || 0,
          lowStockItems: enhancedStats.overview?.lowStockItems || 0,
          outOfStockItems: enhancedStats.overview?.outOfStockItems || 0,
          totalQuantity: enhancedStats.overview?.totalQuantity || 0,
          potentialProfit: (enhancedStats.overview?.totalSellingValue || 0) - (enhancedStats.overview?.totalCostValue || 0)
        });
      } else {
        // Fallback to manual calculation
        calculateStats(itemsData, stockData);
      }
      
    } catch (err) {
      console.error('Error loading inventory data:', err);
      setError('حدث خطأ في تحميل البيانات');
      notifications.error('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (itemsData, stockData) => {
    const totalItems = itemsData.length;
    
    let totalValue = 0;
    let totalQuantity = 0;
    let potentialProfit = 0;
    let lowStockItems = 0;
    let outOfStockItems = 0;
    
    stockData.forEach(stock => {
      const item = itemsData.find(i => i.id === stock.inventoryItemId);
      if (item) {
        const qty = stock.quantity || 0;
        totalQuantity += qty;
        totalValue += qty * (item.purchasePrice || 0);
        potentialProfit += qty * ((item.sellingPrice || 0) - (item.purchasePrice || 0));
        
        if (qty <= (stock.minLevel || 0)) {
          lowStockItems++;
        }
        if (qty === 0) {
          outOfStockItems++;
        }
      }
    });
    
    setStats({
      totalItems,
      totalValue,
      totalQuantity,
      potentialProfit,
      lowStockItems,
      outOfStockItems
    });
  };

  const getStockForItem = (itemId, warehouseId = null) => {
    // Try to get from StockLevel table
    if (warehouseId) {
      const stockLevel = stockLevels.find(s => s.inventoryItemId === itemId && s.warehouseId === warehouseId);
      if (stockLevel) {
        return {
          quantity: stockLevel.quantity || 0,
          minLevel: stockLevel.minLevel || 0,
          isLowStock: stockLevel.isLowStock || false,
          warehouseId: stockLevel.warehouseId,
          warehouseName: stockLevel.warehouseName
        };
      }
    }
    
    // Fallback to StockLevel aggregation across all warehouses
    const stockData = stockLevels.filter(s => s.inventoryItemId === itemId);
    if (stockData.length > 0) {
      const total = stockData.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
      return {
        quantity: total,
        warehouses: stockData.map(s => ({
          warehouseId: s.warehouseId,
          warehouseName: s.warehouseName,
          quantity: s.quantity || 0,
          minLevel: s.minLevel || 0
        }))
      };
    }
    
    // No stock level found - return error state
    return { 
      quantity: 0, 
      error: 'No stock level found. Please add stock to warehouses.',
      warehouses: []
    };
  };

  const getFilteredAndSortedItems = () => {
    console.log('getFilteredAndSortedItems - items:', items.length, items);
    let filtered = [...items];
    
    // البحث
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        (item.name || '').toLowerCase().includes(search) ||
        (item.sku || '').toLowerCase().includes(search) ||
        (item.description || '').toLowerCase().includes(search) ||
        (item.category || '').toLowerCase().includes(search)
      );
    }
    
    // فلترة حسب الفئة
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    // فلترة حسب حالة المخزون
    if (stockFilter !== 'all') {
      filtered = filtered.filter(item => {
        const stock = getStockForItem(item.id);
        const available = stock.quantity || 0;
        
        if (stockFilter === 'low') {
          return available > 0 && available <= (stock.minLevel || 5); // Consider low if at or below min level
        } else if (stockFilter === 'out') {
          return available === 0;
        } else if (stockFilter === 'normal') {
          return available > (stock.minLevel || 5);
        }
        return true;
      });
    }
    
    // الترتيب
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      if (sortField === 'name') {
        aValue = (a.name || '').toLowerCase();
        bValue = (b.name || '').toLowerCase();
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue, 'ar')
          : bValue.localeCompare(aValue, 'ar');
      } else if (sortField === 'sku') {
        aValue = (a.sku || '').toLowerCase();
        bValue = (b.sku || '').toLowerCase();
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (sortField === 'category') {
        aValue = (a.category || '').toLowerCase();
        bValue = (b.category || '').toLowerCase();
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue, 'ar')
          : bValue.localeCompare(aValue, 'ar');
      } else if (sortField === 'price') {
        aValue = a.sellingPrice || 0;
        bValue = b.sellingPrice || 0;
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      } else if (sortField === 'stock') {
        const stockA = getStockForItem(a.id);
        const stockB = getStockForItem(b.id);
        aValue = stockA.quantity || 0;
        bValue = stockB.quantity || 0;
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
    
    return filtered;
  };

  // Multi-Select handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = getCurrentPageItems().map(item => item.id);
      setSelectedItems(allIds);
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId, checked) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`هل أنت متأكد من حذف ${selectedItems.length} صنف؟`)) {
      return;
    }

    try {
      await Promise.all(selectedItems.map(id => 
        apiService.request(`/inventory/${id}`, { method: 'DELETE' })
      ));
      
      notifications.success(`تم حذف ${selectedItems.length} صنف بنجاح`);
      setSelectedItems([]);
      loadData();
    } catch (err) {
      console.error('Error bulk deleting:', err);
      notifications.error('فشل في حذف بعض الأصناف');
    }
  };

  // Pagination helpers
  const getCurrentPageItems = () => {
    const filtered = getFilteredAndSortedItems();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filtered = getFilteredAndSortedItems();
    return Math.ceil(filtered.length / itemsPerPage);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  const getStockStatusBadge = (item) => {
    const stock = getStockForItem(item.id);
    const available = stock.quantity || 0;
    
    if (available === 0) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        نفذ
      </span>;
    } else if (available <= (stock.minLevel || 5)) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <AlertTriangle className="w-3 h-3 ml-1" />
        منخفض
      </span>;
    } else {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        متوفر
      </span>;
    }
  };

  const handleManageStock = (item) => {
    setSelectedItem(item);
    setStockForm({ warehouseId: '', quantity: '', minLevel: '' });
    setShowStockModal(true);
  };

  const handleCloseStockModal = () => {
    setShowStockModal(false);
    setSelectedItem(null);
    setStockForm({ warehouseId: '', quantity: '', minLevel: '' });
  };

  const handleSaveStock = async () => {
    if (!stockForm.warehouseId || stockForm.quantity === '') {
      notifications.error('يرجى اختيار المخزن وإدخال الكمية');
      return;
    }

    try {
      setSavingStock(true);
      
      const payload = {
        inventoryItemId: selectedItem.id,
        warehouseId: parseInt(stockForm.warehouseId),
        quantity: parseInt(stockForm.quantity),
        minLevel: stockForm.minLevel ? parseInt(stockForm.minLevel) : 0,
        notes: 'تحديث من واجهة إدارة المخزون'
      };

      const response = await inventoryService.createStockLevel(payload);
      
      if (response.success || response.data) {
        notifications.success('تم تحديث المخزون بنجاح');
        await loadData(); // إعادة تحميل البيانات
        handleCloseStockModal();
      } else {
        notifications.error('حدث خطأ في تحديث المخزون');
      }
    } catch (error) {
      console.error('Error saving stock:', error);
      notifications.error('حدث خطأ في تحديث المخزون: ' + (error.message || 'Unknown error'));
    } finally {
      setSavingStock(false);
    }
  };

  const getItemStockLevels = () => {
    if (!selectedItem) return [];
    return stockLevels.filter(s => s.inventoryItemId === selectedItem.id);
  };

  const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
  const filteredItems = getFilteredAndSortedItems();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-8 h-8 text-blue-600" />
            إدارة المخزون
          </h1>
          <p className="text-gray-600 mt-1">إدارة الأصناف والمستودعات ومستويات المخزون</p>
        </div>
        
        <div className="flex items-center gap-2">
          <SimpleButton
            variant="outline"
            onClick={loadData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </SimpleButton>
          <SimpleButton
            variant="outline"
            onClick={() => navigate('/inventory/warehouses')}
            className="flex items-center gap-2"
          >
            <Warehouse className="w-4 h-4" />
            المخازن
          </SimpleButton>
          <SimpleButton
            onClick={() => navigate('/inventory/new')}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة صنف جديد
          </SimpleButton>
        </div>
      </div>

      {/* Stats Dashboard */}
      <StatsDashboard 
        stats={{
          overview: {
            totalItems: stats.totalItems,
            totalCostValue: stats.totalValue,
            totalQuantity: stats.totalQuantity
          },
          alerts: {
            lowStockItems: stats.lowStockItems,
            outOfStockItems: stats.outOfStockItems
          }
        }} 
        loading={loading} 
      />

      {/* Old Stats Section (Fallback) */}
      {false && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SimpleCard className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">إجمالي الأصناف</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{stats.totalItems}</p>
                  <p className="text-xs text-blue-700 mt-1">{stats.totalQuantity} قطعة</p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                  <Box className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">قيمة المخزون</p>
                  <p className="text-2xl font-bold text-green-900 mt-2">{formatMoney(stats.totalValue)}</p>
                  <p className="text-xs text-green-700 mt-1">سعر الشراء</p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">الربح المتوقع</p>
                  <p className="text-2xl font-bold text-purple-900 mt-2">{formatMoney(stats.potentialProfit)}</p>
                  <p className="text-xs text-purple-700 mt-1">من المخزون الحالي</p>
                </div>
                <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-700" />
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">تنبيهات المخزون</p>
                  <p className="text-3xl font-bold text-red-900 mt-2">{stats.lowStockItems}</p>
                  <p className="text-xs text-red-700 mt-1">أصناف منخفضة</p>
                </div>
                <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-700" />
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>
      )}

      {/* الفلاتر والبحث */}
      <SimpleCard>
        <SimpleCardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline ml-1" />
                البحث
              </label>
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث بالاسم، SKU، أو الوصف..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline ml-1" />
                الفئة
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">الكل</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <AlertTriangle className="w-4 h-4 inline ml-1" />
                حالة المخزون
              </label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">الكل</option>
                <option value="normal">متوفر</option>
                <option value="low">منخفض</option>
                <option value="out">نفذ</option>
              </select>
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* جدول المخزون */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>قائمة الأصناف ({getFilteredAndSortedItems().length})</span>
              {selectedItems.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">({selectedItems.length} محدد)</span>
                  <SimpleButton
                    variant="danger"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف المحدد
                  </SimpleButton>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="10">10 صفوف</option>
                <option value="25">25 صف</option>
                <option value="50">50 صف</option>
                <option value="100">100 صف</option>
              </select>
              <SimpleButton
                variant="outline"
                size="sm"
                onClick={() => navigate('/inventory/movements')}
                className="flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                الحركات
              </SimpleButton>
              <SimpleButton
                variant="outline"
                size="sm"
                onClick={() => navigate('/inventory/alerts')}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                التنبيهات
              </SimpleButton>
            </div>
          </SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent className="p-0">
          {loading ? (
            <TableLoadingSkeleton />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === getCurrentPageItems().length && getCurrentPageItems().length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        الاسم
                        {renderSortIcon('name')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('sku')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        SKU
                        {renderSortIcon('sku')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('category')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        الفئة
                        {renderSortIcon('category')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('stock')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        المخزون
                        {renderSortIcon('stock')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('price')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        السعر
                        {renderSortIcon('price')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getCurrentPageItems().length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>لا توجد أصناف</p>
                      </td>
                    </tr>
                  ) : (
                    getCurrentPageItems().map((item, index) => {
                      const stock = getStockForItem(item.id);
                      const available = stock.quantity || 0;
                      const warehouses = stock.warehouses || [];
                      
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {item.id}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            {item.description && (
                              <div className="text-xs text-gray-500">{item.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">{item.sku}</code>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {item.category || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {stock.error ? (
                              <div className="text-sm text-red-600">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  لا يوجد مخزون
                                </span>
                              </div>
                            ) : (
                              <>
                                <div className="text-sm text-gray-900">
                                  <span className="font-medium">{available}</span> {item.unit || 'قطعة'}
                                </div>
                                {warehouses.length > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {warehouses.length} مخزن{warehouses.length > 1 ? 'ات' : ''}
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatMoney(item.sellingPrice)}</div>
                            <div className="text-xs text-gray-500">شراء: {formatMoney(item.purchasePrice)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStockStatusBadge(item)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <SimpleButton
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/inventory/${item.id}`)}
                                className="text-blue-600 hover:text-blue-800"
                                title="عرض التفاصيل"
                              >
                                <Eye className="w-4 h-4" />
                              </SimpleButton>
                              <SimpleButton
                                variant="ghost"
                                size="sm"
                                onClick={() => handleManageStock(item)}
                                className="text-purple-600 hover:text-purple-800"
                                title="إدارة المخزون"
                              >
                                <Warehouse className="w-4 h-4" />
                              </SimpleButton>
                              <SimpleButton
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/inventory/${item.id}/edit`)}
                                className="text-green-600 hover:text-green-800"
                                title="تعديل"
                              >
                                <Edit className="w-4 h-4" />
                              </SimpleButton>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {getTotalPages() > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-700">
                عرض {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, getFilteredAndSortedItems().length)} من {getFilteredAndSortedItems().length}
              </div>
              <div className="flex items-center gap-2">
                <SimpleButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  الأولى
                </SimpleButton>
                <SimpleButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  السابق
                </SimpleButton>
                <span className="px-3 py-1 text-sm text-gray-700">
                  صفحة {currentPage} من {getTotalPages()}
                </span>
                <SimpleButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(getTotalPages(), prev + 1))}
                  disabled={currentPage === getTotalPages()}
                >
                  التالي
                </SimpleButton>
                <SimpleButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(getTotalPages())}
                  disabled={currentPage === getTotalPages()}
                >
                  الأخيرة
                </SimpleButton>
              </div>
            </div>
          )}
        </SimpleCardContent>
      </SimpleCard>

      {/* روابط سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SimpleCard 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/inventory/warehouses')}
        >
          <SimpleCardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Warehouse className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">إدارة المخازن</p>
                <p className="text-sm text-gray-600">{warehouses.length} مخازن</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/inventory/movements')}
        >
          <SimpleCardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">حركات المخزون</p>
                <p className="text-sm text-gray-600">سجل الحركات</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/inventory/alerts')}
        >
          <SimpleCardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">تنبيهات المخزون</p>
                <p className="text-sm text-gray-600">{stats.lowStockItems} تنبيه</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>

      {/* Modal إدارة المخزون */}
      <Modal open={showStockModal} onOpenChange={setShowStockModal}>
        <ModalContent size="lg">
          <ModalHeader>
            <ModalTitle>إدارة المخزون - {selectedItem?.name}</ModalTitle>
            <ModalDescription>
              إضافة أو تحديث الكمية في المخازن المختلفة
            </ModalDescription>
          </ModalHeader>
          
          <div className="space-y-4 py-4">
            {/* المخازن الموجودة */}
            {getItemStockLevels().length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">المخازن الحالية:</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {getItemStockLevels().map((level) => (
                    <div key={level.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{level.warehouseName}</div>
                        <div className="text-sm text-gray-500">
                          الكمية: {level.quantity} | الحد الأدنى: {level.minLevel || 0}
                        </div>
                      </div>
                      <SimpleButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setStockForm({
                            warehouseId: level.warehouseId,
                            quantity: level.quantity || '',
                            minLevel: level.minLevel || ''
                          });
                        }}
                        className="text-blue-600"
                      >
                        تعديل
                      </SimpleButton>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* نموذج إضافة/تحديث */}
            <div className="border-t pt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المخزن <span className="text-red-500">*</span>
                </label>
                <select
                  value={stockForm.warehouseId}
                  onChange={(e) => setStockForm({ ...stockForm, warehouseId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">اختر المخزن</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الكمية <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={stockForm.quantity}
                    onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                    placeholder="أدخل الكمية"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الحد الأدنى
                  </label>
                  <Input
                    type="number"
                    value={stockForm.minLevel}
                    onChange={(e) => setStockForm({ ...stockForm, minLevel: e.target.value })}
                    placeholder="الحد الأدنى للمخزون"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>

          <ModalFooter>
            <SimpleButton
              variant="outline"
              onClick={handleCloseStockModal}
              disabled={savingStock}
            >
              إلغاء
            </SimpleButton>
            <SimpleButton
              onClick={handleSaveStock}
              disabled={savingStock || !stockForm.warehouseId || stockForm.quantity === ''}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {savingStock ? 'جاري الحفظ...' : 'حفظ'}
            </SimpleButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default InventoryPageEnhanced;


