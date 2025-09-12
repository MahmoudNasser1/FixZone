import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Package,
  Warehouse,
  Download,
  Calendar,
  Filter
} from 'lucide-react';
import { SimpleCard, SimpleCardContent, SimpleCardHeader } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import Breadcrumb from '../../components/layout/Breadcrumb';
import apiService from '../../services/api';

const InventoryReportsPage = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [stockLevels, setStockLevels] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeReport, setActiveReport] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedWarehouse, setSelectedWarehouse] = useState('');

  // Load inventory data
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
        setWarehouses(warehousesData);
      }

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setInventoryItems(Array.isArray(itemsData) ? itemsData : (itemsData.data?.items || []));
      }

      if (levelsRes.ok) {
        const levelsData = await levelsRes.json();
        setStockLevels(levelsData);
      }

      if (movementsRes.ok) {
        const movementsData = await movementsRes.json();
        setStockMovements(movementsData);
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

  // Filter data by date range and warehouse
  const getFilteredData = () => {
    let filteredMovements = stockMovements.filter(movement => {
      const movementDate = new Date(movement.createdAt);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      return movementDate >= startDate && movementDate <= endDate;
    });

    if (selectedWarehouse) {
      filteredMovements = filteredMovements.filter(movement => 
        movement.fromWarehouseId === parseInt(selectedWarehouse) || 
        movement.toWarehouseId === parseInt(selectedWarehouse)
      );
    }

    return filteredMovements;
  };

  // Calculate statistics
  const calculateStats = () => {
    const filteredMovements = getFilteredData();
    
    const totalIn = filteredMovements
      .filter(m => m.type === 'IN')
      .reduce((sum, m) => sum + (m.quantity || 0), 0);
    
    const totalOut = filteredMovements
      .filter(m => m.type === 'OUT')
      .reduce((sum, m) => sum + (m.quantity || 0), 0);
    
    const totalTransfer = filteredMovements
      .filter(m => m.type === 'TRANSFER')
      .reduce((sum, m) => sum + (m.quantity || 0), 0);

    return { totalIn, totalOut, totalTransfer };
  };

  // Get low stock items
  const getLowStockItems = () => {
    return stockLevels.filter(level => 
      level.isLowStock || (level.quantity <= level.minLevel)
    );
  };

  // Get high value items
  const getHighValueItems = () => {
    return inventoryItems
      .map(item => {
        const totalStock = stockLevels
          .filter(level => level.inventoryItemId === item.id)
          .reduce((sum, level) => sum + (level.quantity || 0), 0);
        
        const totalValue = totalStock * (item.sellingPrice || 0);
        
        return {
          ...item,
          totalStock,
          totalValue
        };
      })
      .filter(item => item.totalValue > 0)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);
  };

  // Get movement trends
  const getMovementTrends = () => {
    const filteredMovements = getFilteredData();
    const trends = {};
    
    filteredMovements.forEach(movement => {
      const date = new Date(movement.createdAt).toISOString().split('T')[0];
      if (!trends[date]) {
        trends[date] = { in: 0, out: 0, transfer: 0 };
      }
      
      if (movement.type === 'IN') trends[date].in += movement.quantity || 0;
      else if (movement.type === 'OUT') trends[date].out += movement.quantity || 0;
      else if (movement.type === 'TRANSFER') trends[date].transfer += movement.quantity || 0;
    });
    
    return Object.entries(trends)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Export report
  const exportReport = () => {
    const data = {
      reportType: activeReport,
      dateRange,
      warehouse: selectedWarehouse ? warehouses.find(w => w.id === parseInt(selectedWarehouse))?.name : 'جميع المخازن',
      generatedAt: new Date().toISOString(),
      data: {}
    };

    switch (activeReport) {
      case 'overview':
        data.data = {
          totalWarehouses: warehouses.length,
          totalItems: inventoryItems.length,
          lowStockItems: getLowStockItems().length,
          stats: calculateStats()
        };
        break;
      case 'lowStock':
        data.data = getLowStockItems().map(level => {
          const item = inventoryItems.find(i => i.id === level.inventoryItemId);
          const warehouse = warehouses.find(w => w.id === level.warehouseId);
          return {
            itemName: item?.name,
            sku: item?.sku,
            warehouse: warehouse?.name,
            currentStock: level.quantity,
            minLevel: level.minLevel
          };
        });
        break;
      case 'highValue':
        data.data = getHighValueItems().map(item => ({
          name: item.name,
          sku: item.sku,
          totalStock: item.totalStock,
          unitPrice: item.sellingPrice,
          totalValue: item.totalValue
        }));
        break;
      case 'movements':
        data.data = getFilteredData().map(movement => ({
          date: movement.createdAt,
          type: movement.type,
          quantity: movement.quantity,
          fromWarehouse: warehouses.find(w => w.id === movement.fromWarehouseId)?.name,
          toWarehouse: warehouses.find(w => w.id === movement.toWarehouseId)?.name,
          notes: movement.notes
        }));
        break;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-report-${activeReport}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل بيانات التقارير...</p>
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
              { label: 'إدارة المخزون', href: '/inventory' },
              { label: 'تقارير المخزون', href: '/inventory/reports', active: true }
            ]} 
          />
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">تقارير المخزون</h1>
              <p className="text-gray-600 mt-2">تحليل شامل لمخزون وحركة القطع</p>
            </div>
            <div className="flex gap-3">
              <SimpleButton size="lg" variant="outline" onClick={exportReport}>
                <Download className="w-5 h-5 ml-2" />
                تصدير التقرير
              </SimpleButton>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">الفترة الزمنية:</span>
            </div>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <span className="text-gray-500">إلى</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            
            <div className="flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">المخزن:</span>
            </div>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">جميع المخازن</option>
              {warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Report Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-6 space-x-reverse">
            {[
              { key: 'overview', label: 'نظرة عامة', icon: BarChart3 },
              { key: 'lowStock', label: 'المخزون المنخفض', icon: AlertTriangle },
              { key: 'highValue', label: 'أعلى قيمة', icon: TrendingUp },
              { key: 'movements', label: 'حركة المخزون', icon: TrendingDown }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeReport === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveReport(tab.key)}
                  className={`${active ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Icon className="w-4 h-4 ml-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Report Content */}
        {activeReport === 'overview' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <SimpleCard>
                <SimpleCardContent className="text-center">
                  <Warehouse className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{warehouses.length}</div>
                  <div className="text-sm text-gray-600">إجمالي المخازن</div>
                </SimpleCardContent>
              </SimpleCard>

              <SimpleCard>
                <SimpleCardContent className="text-center">
                  <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{inventoryItems.length}</div>
                  <div className="text-sm text-gray-600">إجمالي قطع الغيار</div>
                </SimpleCardContent>
              </SimpleCard>

              <SimpleCard>
                <SimpleCardContent className="text-center">
                  <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{getLowStockItems().length}</div>
                  <div className="text-sm text-gray-600">قطع غيار منخفضة</div>
                </SimpleCardContent>
              </SimpleCard>

              <SimpleCard>
                <SimpleCardContent className="text-center">
                  <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {getFilteredData().length}
                  </div>
                  <div className="text-sm text-gray-600">حركات في الفترة</div>
                </SimpleCardContent>
              </SimpleCard>
            </div>

            {/* Movement Statistics */}
            <SimpleCard>
              <SimpleCardHeader>
                <h2 className="text-xl font-semibold">إحصائيات الحركة</h2>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(() => {
                    const stats = calculateStats();
                    return (
                      <>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-green-700">{stats.totalIn}</div>
                          <div className="text-sm text-green-600">وارد</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <TrendingDown className="w-8 h-8 text-red-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-red-700">{stats.totalOut}</div>
                          <div className="text-sm text-red-600">صادر</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-blue-700">{stats.totalTransfer}</div>
                          <div className="text-sm text-blue-600">نقل</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </SimpleCardContent>
            </SimpleCard>
          </div>
        )}

        {activeReport === 'lowStock' && (
          <SimpleCard>
            <SimpleCardHeader>
              <h2 className="text-xl font-semibold">تقرير المخزون المنخفض</h2>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="space-y-4">
                {getLowStockItems().map(level => {
                  const item = inventoryItems.find(i => i.id === level.inventoryItemId);
                  const warehouse = warehouses.find(w => w.id === level.warehouseId);
                  
                  if (!item || !warehouse) return null;
                  
                  return (
                    <div key={`${level.inventoryItemId}-${level.warehouseId}`} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                          <div>
                            <h3 className="font-semibold text-red-900">{item.name}</h3>
                            <p className="text-sm text-red-700">SKU: {item.sku}</p>
                            <p className="text-sm text-red-700">المخزن: {warehouse.name}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">
                          {level.quantity}
                        </div>
                        <div className="text-sm text-red-700">المخزون الحالي</div>
                        <div className="text-sm text-red-700">الحد الأدنى: {level.minLevel}</div>
                      </div>
                    </div>
                  );
                })}
                
                {getLowStockItems().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد قطع غيار منخفضة المخزون
                  </div>
                )}
              </div>
            </SimpleCardContent>
          </SimpleCard>
        )}

        {activeReport === 'highValue' && (
          <SimpleCard>
            <SimpleCardHeader>
              <h2 className="text-xl font-semibold">أعلى 10 قطع غيار قيمة</h2>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="space-y-4">
                {getHighValueItems().map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-900">{item.name}</h3>
                        <p className="text-sm text-green-700">SKU: {item.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-700">
                        {item.totalValue.toFixed(2)} ج.م
                      </div>
                      <div className="text-sm text-green-600">إجمالي القيمة</div>
                      <div className="text-sm text-green-600">المخزون: {item.totalStock}</div>
                    </div>
                  </div>
                ))}
              </div>
            </SimpleCardContent>
          </SimpleCard>
        )}

        {activeReport === 'movements' && (
          <SimpleCard>
            <SimpleCardHeader>
              <h2 className="text-xl font-semibold">تقرير حركة المخزون</h2>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="space-y-4">
                {getFilteredData().map(movement => (
                  <div key={movement.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
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
                            من: {movement.fromWarehouseId ? warehouses.find(w => w.id === movement.fromWarehouseId)?.name : 'خارجي'}
                          </div>
                          <div className="text-sm text-gray-600">
                            إلى: {movement.toWarehouseId ? warehouses.find(w => w.id === movement.toWarehouseId)?.name : 'خارجي'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {new Date(movement.createdAt).toLocaleDateString('ar-EG')}
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
                ))}
                
                {getFilteredData().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد حركات مخزون في الفترة المحددة
                  </div>
                )}
              </div>
            </SimpleCardContent>
          </SimpleCard>
        )}
      </div>
    </div>
  );
};

export default InventoryReportsPage;
