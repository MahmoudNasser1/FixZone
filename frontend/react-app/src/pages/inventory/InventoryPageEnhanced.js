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
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="w-4 h-4 text-blue-500" />
      : <ArrowDown className="w-4 h-4 text-blue-500" />;
  };

  const getStockStatusBadge = (item) => {
    const stock = getStockForItem(item.id);
    const available = stock.quantity || 0;

    if (available === 0) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
        نفذ
      </span>;
    } else if (available <= (stock.minLevel || 5)) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
        <AlertTriangle className="w-3 h-3 ml-1" />
        منخفض
      </span>;
    } else {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            إدارة المخزون
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">إدارة الأصناف والمستودعات ومستويات المخزون</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SimpleButton
            variant="outline"
            size="sm"
            onClick={loadData}
            className="flex items-center gap-2 h-9"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden xs:inline">تحديث</span>
          </SimpleButton>
          <SimpleButton
            variant="outline"
            size="sm"
            onClick={() => navigate('/inventory/warehouses')}
            className="flex items-center gap-1 h-9"
          >
            <Warehouse className="w-4 h-4" />
            <span>المخازن</span>
          </SimpleButton>
          <SimpleButton
            size="sm"
            onClick={() => navigate('/inventory/new')}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1 h-9"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة صنف</span>
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

      {/* الفلاتر والبحث */}
      <SimpleCard>
        <SimpleCardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                <Search className="w-3.5 h-3.5 inline ml-1" />
                البحث
              </label>
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث بالاسم، SKU، أو الوصف..."
                className="h-9 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                <Filter className="w-3.5 h-3.5 inline ml-1" />
                الفئة
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-9 px-3 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
              >
                <option value="">الكل</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 inline ml-1" />
                حالة المخزون
              </label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-full h-9 px-3 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
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
        <SimpleCardHeader className="px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-sm sm:text-base text-foreground">قائمة الأصناف ({getFilteredAndSortedItems().length})</span>
              {selectedItems.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs text-muted-foreground">({selectedItems.length} محدد)</span>
                  <SimpleButton
                    variant="danger"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1 h-7 px-2 text-[10px] sm:text-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                    حذف المحدد
                  </SimpleButton>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2 py-0 border border-border rounded-md text-xs bg-background text-foreground"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <SimpleButton
                variant="outline"
                size="sm"
                onClick={() => navigate('/inventory/movements')}
                className="flex items-center gap-1 h-8 px-2 text-xs"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>الحركات</span>
              </SimpleButton>
              <SimpleButton
                variant="outline"
                size="sm"
                onClick={() => navigate('/inventory/alerts')}
                className="flex items-center gap-1 h-8 px-2 text-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                <span>التنبيهات</span>
              </SimpleButton>
            </div>
          </div>
        </SimpleCardHeader>
        <SimpleCardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <TableLoadingSkeleton className="hidden sm:block" />
              <CardLoadingSkeleton className="sm:hidden" />
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedItems.length === getCurrentPageItems().length && getCurrentPageItems().length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-border rounded focus:ring-blue-500 cursor-pointer bg-background"
                        />
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-1 hover:text-foreground font-bold"
                        >
                          الاسم
                          {renderSortIcon('name')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('sku')}
                          className="flex items-center gap-1 hover:text-foreground font-bold"
                        >
                          SKU
                          {renderSortIcon('sku')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('category')}
                          className="flex items-center gap-1 hover:text-foreground font-bold"
                        >
                          الفئة
                          {renderSortIcon('category')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('stock')}
                          className="flex items-center gap-1 hover:text-foreground font-bold"
                        >
                          المخزون
                          {renderSortIcon('stock')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('price')}
                          className="flex items-center gap-1 hover:text-foreground font-bold"
                        >
                          السعر
                          {renderSortIcon('price')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider font-bold">
                        الحالة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider font-bold">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {getCurrentPageItems().length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-6 py-12 text-center text-muted-foreground">
                          <Package className="w-12 h-12 mx-auto mb-3 text-muted" />
                          <p className="text-lg">لا توجد أصناف تطابق معايير البحث</p>
                        </td>
                      </tr>
                    ) : (
                      getCurrentPageItems().map((item) => {
                        const stock = getStockForItem(item.id);
                        const available = stock.quantity || 0;
                        const warehousesCount = (stock.warehouses || []).length;

                        return (
                          <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(item.id)}
                                onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-border rounded focus:ring-blue-500 cursor-pointer bg-background"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-xs font-mono text-muted-foreground">#{item.id}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-foreground">{item.name}</div>
                              {item.description && (
                                <div className="text-xs text-muted-foreground truncate max-w-xs">{item.description}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border text-foreground">{item.sku || 'N/A'}</code>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                {item.category || 'غير مصنف'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {stock.error ? (
                                <span className="text-[10px] text-red-500 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">غير مضاف للمخازن</span>
                              ) : (
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-foreground">{available} {item.unit || 'قطعة'}</span>
                                  {warehousesCount > 0 && <span className="text-[10px] text-muted-foreground">{warehousesCount} مخازن</span>}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-blue-500">{formatMoney(item.sellingPrice)}</div>
                              <div className="text-[10px] text-muted-foreground">التكلفة: {formatMoney(item.purchasePrice)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStockStatusBadge(item)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-1">
                                <SimpleButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/inventory/${item.id}`)}
                                  className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-500/10"
                                  title="عرض"
                                >
                                  <Eye className="w-4 h-4" />
                                </SimpleButton>
                                <SimpleButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleManageStock(item)}
                                  className="h-8 w-8 p-0 text-purple-500 hover:bg-purple-500/10"
                                  title="تعديل المخزون"
                                >
                                  <Warehouse className="w-4 h-4" />
                                </SimpleButton>
                                <SimpleButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/inventory/${item.id}/edit`)}
                                  className="h-8 w-8 p-0 text-green-500 hover:bg-green-500/10"
                                  title="تعديل البيانات"
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

              {/* Mobile Card View */}
              <div className="sm:hidden divide-y divide-border">
                {getCurrentPageItems().length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Package className="w-10 h-10 mx-auto mb-2 text-muted" />
                    <p className="text-sm">لا توجد أصناف</p>
                  </div>
                ) : (
                  getCurrentPageItems().map((item) => {
                    const stock = getStockForItem(item.id);
                    const available = stock.quantity || 0;

                    return (
                      <div key={item.id} className="p-4 active:bg-muted/50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(item.id)}
                              onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                              className="mt-1 w-4 h-4 text-blue-600 border-border rounded bg-background"
                            />
                            <div>
                              <h3 className="text-sm font-bold text-foreground leading-tight">{item.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">#{item.id}</span>
                                <span className="text-[10px] text-muted-foreground">{item.sku}</span>
                              </div>
                            </div>
                          </div>
                          {getStockStatusBadge(item)}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-3 bg-muted/30 rounded-lg p-2 border border-border">
                          <div>
                            <span className="text-[10px] text-muted-foreground block mb-0.5">المخزون</span>
                            <span className="text-sm font-bold text-foreground">{available} {item.unit || 'قطعة'}</span>
                          </div>
                          <div className="text-left">
                            <span className="text-[10px] text-muted-foreground block mb-0.5">السعر</span>
                            <span className="text-sm font-bold text-blue-500">{formatMoney(item.sellingPrice)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <span className="text-[10px] text-white bg-indigo-600 px-2 py-0.5 rounded-full">{item.category || 'عام'}</span>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => navigate(`/inventory/${item.id}`)}
                              className="text-blue-500 text-xs font-medium flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              عرض
                            </button>
                            <button
                              onClick={() => handleManageStock(item)}
                              className="text-purple-500 text-xs font-medium flex items-center gap-1"
                            >
                              <Warehouse className="w-3.5 h-3.5" />
                              المخزون
                            </button>
                            <button
                              onClick={() => navigate(`/inventory/${item.id}/edit`)}
                              className="text-green-500 text-xs font-medium flex items-center gap-1"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              تعديل
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* Pagination */}
          {getTotalPages() > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 sm:px-6 border-t border-border bg-muted/10">
              <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                عرض {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, getFilteredAndSortedItems().length)} من {getFilteredAndSortedItems().length}
              </div>
              <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                <SimpleButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 px-2 text-[10px] sm:text-xs"
                >
                  <span className="sm:hidden">&laquo;</span>
                  <span className="hidden sm:inline">الأولى</span>
                </SimpleButton>
                <SimpleButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2 text-[10px] sm:text-xs"
                >
                  السابق
                </SimpleButton>
                <span className="px-2 py-1 text-[10px] sm:text-xs text-muted-foreground font-medium">
                  {currentPage} / {getTotalPages()}
                </span>
                <SimpleButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(getTotalPages(), prev + 1))}
                  disabled={currentPage === getTotalPages()}
                  className="h-8 px-2 text-[10px] sm:text-xs"
                >
                  التالي
                </SimpleButton>
                <SimpleButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(getTotalPages())}
                  disabled={currentPage === getTotalPages()}
                  className="h-8 px-2 text-[10px] sm:text-xs"
                >
                  <span className="sm:hidden">&raquo;</span>
                  <span className="hidden sm:inline">الأخيرة</span>
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
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Warehouse className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">إدارة المخازن</p>
                <p className="text-sm text-muted-foreground">{warehouses.length} مخازن</p>
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
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">حركات المخزون</p>
                <p className="text-sm text-muted-foreground">سجل الحركات</p>
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
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">تنبيهات المخزون</p>
                <p className="text-sm text-muted-foreground">{stats.lowStockItems} تنبيه</p>
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
                <h4 className="text-sm font-medium text-muted-foreground mb-3">المخازن الحالية:</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {getItemStockLevels().map((level) => (
                    <div key={level.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                      <div>
                        <div className="font-medium text-foreground">{level.warehouseName}</div>
                        <div className="text-sm text-muted-foreground">
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
                        className="text-blue-500 hover:bg-blue-500/10"
                      >
                        تعديل
                      </SimpleButton>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* نموذج إضافة/تحديث */}
            <div className="border-t border-border pt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  المخزن <span className="text-red-500">*</span>
                </label>
                <select
                  value={stockForm.warehouseId}
                  onChange={(e) => setStockForm({ ...stockForm, warehouseId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
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
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
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
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
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


