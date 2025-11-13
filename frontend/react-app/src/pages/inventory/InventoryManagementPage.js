import React, { useState, useEffect } from 'react';
import { 
  Warehouse, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { SimpleCard, SimpleCardContent, SimpleCardHeader } from '../../components/ui/SimpleCard';
import { SimpleButton } from '../../components/ui/SimpleButton';
import { SimpleBadge } from '../../components/ui/SimpleBadge';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import apiService from '../../services/api';
import { notifications } from '../../utils/notifications';

const InventoryManagementPage = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [stockLevels, setStockLevels] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');

  // Load all inventory data
  const loadInventoryData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [warehousesRes, itemsRes, levelsRes, movementsRes] = await Promise.all([
        apiService.request('/warehouses'),
        apiService.request('/inventory'),
        apiService.request('/stocklevels'),
        apiService.request('/stockmovements')
      ]);

      if (warehousesRes.ok) {
        const warehousesData = await warehousesRes.json();
        setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);
      }

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setInventoryItems(Array.isArray(itemsData) ? itemsData : (itemsData.data?.items || []));
      }

      if (levelsRes.ok) {
        const levelsData = await levelsRes.json();
        setStockLevels(Array.isArray(levelsData) ? levelsData : []);
      }

      if (movementsRes.ok) {
        const movementsData = await movementsRes.json();
        setStockMovements(Array.isArray(movementsData) ? movementsData : []);
      }
    } catch (err) {
      setError('تعذر تحميل بيانات المخزون');
      console.error('Error loading inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, []);

  // Filter inventory items by search term and warehouse
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWarehouse = !selectedWarehouse || 
      stockLevels.some(level => level.inventoryItemId === item.id && level.warehouseId === parseInt(selectedWarehouse));
    return matchesSearch && matchesWarehouse;
  });

  // Get stock level for an item in a specific warehouse
  const getStockLevel = (itemId, warehouseId) => {
    return stockLevels.find(level => 
      level.inventoryItemId === itemId && level.warehouseId === warehouseId
    );
  };

  // Get warehouse name by ID
  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse?.name || `مخزن #${warehouseId}`;
  };

  // Calculate total stock for an item across all warehouses
  const getTotalStock = (itemId) => {
    return stockLevels
      .filter(level => level.inventoryItemId === itemId)
      .reduce((total, level) => total + (level.quantity || 0), 0);
  };

  // Get low stock items
  const lowStockItems = stockLevels.filter(level => 
    level.isLowStock || (level.quantity <= level.minLevel)
  );

  // Get recent stock movements
  const recentMovements = stockMovements
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل بيانات المخزون...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb 
            items={[
              { label: 'الرئيسية', href: '/' },
              { label: 'إدارة المخزون', href: '/inventory', active: true }
            ]} 
          />
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">إدارة المخزون</h1>
              <p className="text-gray-600 mt-2">إدارة المخازن وقطع الغيار ومستويات المخزون</p>
            </div>
            <div className="flex gap-3">
              <SimpleButton size="lg" variant="outline">
                <Upload className="w-5 h-5 ml-2" />
                استيراد
              </SimpleButton>
              <SimpleButton size="lg" variant="outline">
                <Download className="w-5 h-5 ml-2" />
                تصدير
              </SimpleButton>
              <SimpleButton size="lg">
                <Plus className="w-5 h-5 ml-2" />
                إضافة عنصر
              </SimpleButton>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في قطع الغيار..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">جميع المخازن</option>
            {warehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-6 space-x-reverse">
            {[
              { key: 'overview', label: 'نظرة عامة', icon: TrendingUp },
              { key: 'warehouses', label: 'المخازن', icon: Warehouse },
              { key: 'items', label: 'قطع الغيار', icon: Package },
              { key: 'movements', label: 'حركة المخزون', icon: TrendingUp },
              { key: 'alerts', label: 'التنبيهات', icon: AlertTriangle }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`${active ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Icon className="w-4 h-4 ml-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Warehouses */}
            <SimpleCard>
              <SimpleCardContent className="text-center">
                <Warehouse className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{warehouses.length}</div>
                <div className="text-sm text-gray-600">إجمالي المخازن</div>
              </SimpleCardContent>
            </SimpleCard>

            {/* Total Items */}
            <SimpleCard>
              <SimpleCardContent className="text-center">
                <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{inventoryItems.length}</div>
                <div className="text-sm text-gray-600">إجمالي قطع الغيار</div>
              </SimpleCardContent>
            </SimpleCard>

            {/* Low Stock Items */}
            <SimpleCard>
              <SimpleCardContent className="text-center">
                <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{lowStockItems.length}</div>
                <div className="text-sm text-gray-600">قطع غيار منخفضة</div>
              </SimpleCardContent>
            </SimpleCard>

            {/* Recent Movements */}
            <SimpleCard>
              <SimpleCardContent className="text-center">
                <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{recentMovements.length}</div>
                <div className="text-sm text-gray-600">حركات حديثة</div>
              </SimpleCardContent>
            </SimpleCard>
          </div>
        )}

        {activeTab === 'warehouses' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {warehouses.map(warehouse => (
              <SimpleCard key={warehouse.id}>
                <SimpleCardHeader>
                  <h3 className="text-lg font-semibold">{warehouse.name}</h3>
                </SimpleCardHeader>
                <SimpleCardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">العناصر:</span>
                      <span className="font-medium">
                        {stockLevels.filter(level => level.warehouseId === warehouse.id).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">إجمالي الكمية:</span>
                      <span className="font-medium">
                        {stockLevels
                          .filter(level => level.warehouseId === warehouse.id)
                          .reduce((total, level) => total + (level.quantity || 0), 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">تاريخ الإنشاء:</span>
                      <span className="font-medium">
                        {new Date(warehouse.createdAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            ))}
          </div>
        )}

        {activeTab === 'items' && (
          <div className="space-y-4">
            {filteredItems.map(item => (
              <SimpleCard key={item.id}>
                <SimpleCardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">سعر البيع: {item.sellingPrice} ج.م</div>
                          <div className="text-sm text-gray-600">سعر الشراء: {item.purchasePrice} ج.م</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {getTotalStock(item.id)}
                      </div>
                      <div className="text-sm text-gray-600">إجمالي المخزون</div>
                    </div>
                  </div>
                  
                  {/* Stock Levels by Warehouse */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">المخزون حسب المخزن:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {warehouses.map(warehouse => {
                        const stockLevel = getStockLevel(item.id, warehouse.id);
                        const quantity = stockLevel?.quantity || 0;
                        const isLow = stockLevel?.isLowStock || (quantity <= (stockLevel?.minLevel || 0));
                        
                        return (
                          <div key={warehouse.id} className="text-center">
                            <div className="text-sm font-medium text-gray-600">{warehouse.name}</div>
                            <div className={`text-lg font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                              {quantity}
                            </div>
                            {isLow && (
                              <SimpleBadge className="bg-red-100 text-red-800 text-xs">
                                منخفض
                              </SimpleBadge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            ))}
          </div>
        )}

        {activeTab === 'movements' && (
          <div className="space-y-4">
            {recentMovements.map(movement => (
              <SimpleCard key={movement.id}>
                <SimpleCardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {movement.type === 'IN' ? 'وارد' : movement.type === 'OUT' ? 'صادر' : 'نقل'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            الكمية: {movement.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            من: {movement.fromWarehouseId ? getWarehouseName(movement.fromWarehouseId) : 'خارجي'}
                          </div>
                          <div className="text-sm text-gray-600">
                            إلى: {movement.toWarehouseId ? getWarehouseName(movement.toWarehouseId) : 'خارجي'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {new Date(movement.createdAt).toLocaleDateString('en-GB')}
                      </div>
                      <SimpleBadge 
                        className={
                          movement.type === 'IN' ? 'bg-green-100 text-green-800' :
                          movement.type === 'OUT' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }
                      >
                        {movement.type === 'IN' ? 'وارد' : movement.type === 'OUT' ? 'صادر' : 'نقل'}
                      </SimpleBadge>
                    </div>
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            ))}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {lowStockItems.map(level => {
              const item = inventoryItems.find(i => i.id === level.inventoryItemId);
              const warehouse = warehouses.find(w => w.id === level.warehouseId);
              
              if (!item || !warehouse) return null;
              
              return (
                <SimpleCard key={`${level.inventoryItemId}-${level.warehouseId}`}>
                  <SimpleCardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                            <p className="text-sm text-gray-600">المخزن: {warehouse.name}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">
                          {level.quantity}
                        </div>
                        <div className="text-sm text-gray-600">المخزون الحالي</div>
                        <div className="text-sm text-gray-600">الحد الأدنى: {level.minLevel}</div>
                      </div>
                    </div>
                  </SimpleCardContent>
                </SimpleCard>
              );
            })}
            
            {lowStockItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                لا توجد تنبيهات للمخزون المنخفض
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryManagementPage;
