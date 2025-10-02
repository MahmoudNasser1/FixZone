import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiService from '../../services/api';
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
  
  // State للإحصائيات
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalQuantity: 0,
    potentialProfit: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [itemsRes, warehousesRes, stockLevelsRes] = await Promise.all([
        apiService.request('/inventory'),
        apiService.request('/warehouses'),
        apiService.request('/stock-levels')
      ]);
      
      let itemsData = [];
      if (itemsRes.ok) {
        const result = await itemsRes.json();
        itemsData = Array.isArray(result) ? result : (result.items || []);
      }
      
      let warehousesData = [];
      if (warehousesRes.ok) {
        const result = await warehousesRes.json();
        warehousesData = Array.isArray(result) ? result : (result.items || []);
      }
      
      let stockData = [];
      if (stockLevelsRes.ok) {
        const result = await stockLevelsRes.json();
        stockData = Array.isArray(result) ? result : (result.items || []);
      }
      
      setItems(itemsData);
      setWarehouses(warehousesData);
      setStockLevels(stockData);
      
      // حساب الإحصائيات
      calculateStats(itemsData, stockData);
      
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
        const qty = stock.currentQuantity || 0;
        totalQuantity += qty;
        totalValue += qty * (item.purchasePrice || 0);
        potentialProfit += qty * ((item.sellingPrice || 0) - (item.purchasePrice || 0));
        
        if ((stock.availableQuantity || 0) <= (item.minStockLevel || 0)) {
          lowStockItems++;
        }
        if ((stock.availableQuantity || 0) === 0) {
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
    if (warehouseId) {
      return stockLevels.find(s => s.inventoryItemId === itemId && s.warehouseId === warehouseId);
    }
    // مجموع جميع المخازن
    return stockLevels
      .filter(s => s.inventoryItemId === itemId)
      .reduce((acc, curr) => ({
        currentQuantity: (acc.currentQuantity || 0) + (curr.currentQuantity || 0),
        reservedQuantity: (acc.reservedQuantity || 0) + (curr.reservedQuantity || 0),
        availableQuantity: (acc.availableQuantity || 0) + (curr.availableQuantity || 0)
      }), { currentQuantity: 0, reservedQuantity: 0, availableQuantity: 0 });
  };

  const getFilteredAndSortedItems = () => {
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
        const available = stock.availableQuantity || 0;
        
        if (stockFilter === 'low') {
          return available <= (item.minStockLevel || 0) && available > 0;
        } else if (stockFilter === 'out') {
          return available === 0;
        } else if (stockFilter === 'normal') {
          return available > (item.minStockLevel || 0);
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
        aValue = stockA.availableQuantity || 0;
        bValue = stockB.availableQuantity || 0;
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
    
    return filtered;
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
    const available = stock.availableQuantity || 0;
    
    if (available === 0) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        نفذ
      </span>;
    } else if (available <= (item.minStockLevel || 0)) {
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

      {/* الإحصائيات */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <CardLoadingSkeleton key={i} />)}
        </div>
      ) : (
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
            <span>قائمة الأصناف ({filteredItems.length})</span>
            <div className="flex items-center gap-2">
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
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>لا توجد أصناف</p>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const stock = getStockForItem(item.id);
                      const available = stock.availableQuantity || 0;
                      
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
                            <div className="text-sm text-gray-900">
                              <span className="font-medium">{available}</span> {item.unit}
                            </div>
                            <div className="text-xs text-gray-500">
                              محجوز: {stock.reservedQuantity || 0}
                            </div>
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
                              >
                                <Eye className="w-4 h-4" />
                              </SimpleButton>
                              <SimpleButton
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/inventory/${item.id}/edit`)}
                                className="text-green-600 hover:text-green-800"
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
    </div>
  );
};

export default InventoryPageEnhanced;

