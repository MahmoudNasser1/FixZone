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
  Clock,
  CheckCircle2
} from 'lucide-react';
import { SimpleCard, SimpleCardContent, SimpleCardHeader } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import { Input } from '../../components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/Select';
import Breadcrumb from '../../components/layout/Breadcrumb';
import apiService from '../../services/api';
import { cn } from '../../lib/utils';

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
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');

  // Load inventory data
  const loadInventoryData = async () => {
    try {
      setLoading(true);
      setError('');

      const [warehousesData, itemsData, levelsData, movementsData] = await Promise.all([
        apiService.request('/warehouses'),
        apiService.request('/inventory'),
        apiService.request('/stocklevels'),
        apiService.request('/stockmovements')
      ]);

      // Parse warehouses
      let parsedWarehouses = [];
      if (Array.isArray(warehousesData)) {
        parsedWarehouses = warehousesData;
      } else if (warehousesData?.data) {
        parsedWarehouses = Array.isArray(warehousesData.data) ? warehousesData.data : [];
      }
      setWarehouses(parsedWarehouses);

      // Parse items
      let parsedItems = [];
      if (Array.isArray(itemsData)) {
        parsedItems = itemsData;
      } else if (itemsData?.data) {
        parsedItems = Array.isArray(itemsData.data) ? itemsData.data : (itemsData.data.items || []);
      }
      setInventoryItems(parsedItems);

      // Parse stock levels
      let parsedLevels = [];
      if (Array.isArray(levelsData)) {
        parsedLevels = levelsData;
      } else if (levelsData?.data) {
        parsedLevels = Array.isArray(levelsData.data) ? levelsData.data : [];
      }
      setStockLevels(parsedLevels);

      // Parse stock movements
      let parsedMovements = [];
      if (Array.isArray(movementsData)) {
        parsedMovements = movementsData;
      } else if (movementsData?.data) {
        parsedMovements = Array.isArray(movementsData.data) ? movementsData.data : [];
      }
      setStockMovements(parsedMovements);

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

      // Add one day to endDate to include the full day
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);

      return movementDate >= startDate && movementDate < adjustedEndDate;
    });

    if (selectedWarehouse && selectedWarehouse !== 'all') {
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
    let items = stockLevels.filter(level =>
      level.isLowStock || (level.quantity <= level.minLevel)
    );

    if (selectedWarehouse && selectedWarehouse !== 'all') {
      items = items.filter(level => level.warehouseId === parseInt(selectedWarehouse));
    }

    return items;
  };

  // Get high value items
  const getHighValueItems = () => {
    return inventoryItems
      .map(item => {
        let relevantLevels = stockLevels.filter(level => level.inventoryItemId === item.id);

        if (selectedWarehouse && selectedWarehouse !== 'all') {
          relevantLevels = relevantLevels.filter(level => level.warehouseId === parseInt(selectedWarehouse));
        }

        const totalStock = relevantLevels.reduce((sum, level) => sum + (level.quantity || 0), 0);
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

  // Export report
  const exportReport = () => {
    const data = {
      reportType: activeReport,
      dateRange,
      warehouse: selectedWarehouse && selectedWarehouse !== 'all' ? warehouses.find(w => w.id === parseInt(selectedWarehouse))?.name : 'جميع المخازن',
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
      default:
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-muted border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">جاري تحميل بيانات التقارير...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Breadcrumb
              items={[
                { label: 'الرئيسية', href: '/' },
                { label: 'إدارة المخزون', href: '/inventory' },
                { label: 'تقارير المخزون', href: '/inventory/reports', active: true }
              ]}
            />
            <h1 className="text-3xl font-bold text-foreground mt-2">تقارير المخزون</h1>
            <p className="text-muted-foreground mt-1">تحليل شامل لمخزون وحركة القطع</p>
          </div>
          <SimpleButton size="lg" variant="outline" onClick={exportReport} className="w-full md:w-auto">
            <Download className="w-4 h-4 ml-2" />
            تصدير التقرير
          </SimpleButton>
        </div>

        {/* Filters */}
        <SimpleCard>
          <SimpleCardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  من تاريخ
                </label>
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  إلى تاريخ
                </label>
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-muted-foreground" />
                  المخزن
                </label>
                <Select
                  value={selectedWarehouse}
                  onValueChange={setSelectedWarehouse}
                >
                  <SelectTrigger className="w-full text-right dir-rtl">
                    <SelectValue placeholder="جميع المخازن" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المخازن</SelectItem>
                    {warehouses.map(warehouse => (
                      <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Report Tabs */}
        <div className="border-b border-border overflow-x-auto">
          <nav className="-mb-px flex space-x-6 space-x-reverse min-w-max px-2">
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
                  className={cn(
                    "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center transition-colors",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
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
                <SimpleCardContent className="text-center p-6">
                  <div className="p-3 bg-blue-500/10 rounded-full w-fit mx-auto mb-3">
                    <Warehouse className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{warehouses.length}</div>
                  <div className="text-sm text-muted-foreground">إجمالي المخازن</div>
                </SimpleCardContent>
              </SimpleCard>

              <SimpleCard>
                <SimpleCardContent className="text-center p-6">
                  <div className="p-3 bg-green-500/10 rounded-full w-fit mx-auto mb-3">
                    <Package className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{inventoryItems.length}</div>
                  <div className="text-sm text-muted-foreground">إجمالي قطع الغيار</div>
                </SimpleCardContent>
              </SimpleCard>

              <SimpleCard>
                <SimpleCardContent className="text-center p-6">
                  <div className="p-3 bg-red-500/10 rounded-full w-fit mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{getLowStockItems().length}</div>
                  <div className="text-sm text-muted-foreground">قطع غيار منخفضة</div>
                </SimpleCardContent>
              </SimpleCard>

              <SimpleCard>
                <SimpleCardContent className="text-center p-6">
                  <div className="p-3 bg-purple-500/10 rounded-full w-fit mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {getFilteredData().length}
                  </div>
                  <div className="text-sm text-muted-foreground">حركات في الفترة</div>
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
                        <div className="text-center p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                          <TrendingUp className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.totalIn}</div>
                          <div className="text-sm text-emerald-600/80 dark:text-emerald-400/80">وارد</div>
                        </div>
                        <div className="text-center p-4 bg-red-500/5 border border-red-500/10 rounded-lg">
                          <TrendingDown className="w-8 h-8 text-red-500 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.totalOut}</div>
                          <div className="text-sm text-red-600/80 dark:text-red-400/80">صادر</div>
                        </div>
                        <div className="text-center p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                          <BarChart3 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalTransfer}</div>
                          <div className="text-sm text-blue-600/80 dark:text-blue-400/80">نقل</div>
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
              <div className="grid gap-4">
                {getLowStockItems().map(level => {
                  const item = inventoryItems.find(i => i.id === level.inventoryItemId);
                  const warehouse = warehouses.find(w => w.id === level.warehouseId);

                  if (!item || !warehouse) return null;

                  return (
                    <div key={`${level.inventoryItemId}-${level.warehouseId}`} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-destructive/5 rounded-lg border border-destructive/10 gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-1" />
                          <div>
                            <h3 className="font-semibold text-foreground">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                            <p className="text-sm text-muted-foreground">المخزن: {warehouse.name}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-row md:flex-col justify-between items-end">
                        <div className="text-lg font-bold text-destructive">
                          {level.quantity}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          الحد الأدنى: <span className="font-medium">{level.minLevel}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {getLowStockItems().length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
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
              <div className="grid gap-4">
                {getHighValueItems().map((item, index) => (
                  <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-card hover:bg-muted/50 rounded-lg border border-border transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-row md:flex-col justify-between items-end">
                      <div className="text-lg font-bold text-primary">
                        {item.totalValue.toFixed(2)} ج.م
                      </div>
                      <div className="text-sm text-muted-foreground">المخزون: {item.totalStock}</div>
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
              <div className="grid gap-4">
                {getFilteredData().map(movement => (
                  <div key={movement.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-card rounded-lg border border-border gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-2 rounded-full",
                          movement.type === 'IN' ? 'bg-emerald-500/10 text-emerald-600' :
                            movement.type === 'OUT' ? 'bg-red-500/10 text-red-600' :
                              'bg-blue-500/10 text-blue-600'
                        )}>
                          {movement.type === 'IN' ? <TrendingUp className="w-4 h-4" /> :
                            movement.type === 'OUT' ? <TrendingDown className="w-4 h-4" /> :
                              <BarChart3 className="w-4 h-4" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {movement.type === 'IN' ? 'وارد' : movement.type === 'OUT' ? 'صادر' : 'نقل'}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:gap-4 text-sm text-muted-foreground mt-1">
                            <span>الكمية: <span className="font-medium text-foreground">{movement.quantity}</span></span>
                            {movement.type === 'TRANSFER' ? (
                              <>
                                <span>من: {warehouses.find(w => w.id === movement.fromWarehouseId)?.name}</span>
                                <span>إلى: {warehouses.find(w => w.id === movement.toWarehouseId)?.name}</span>
                              </>
                            ) : (
                              <span>المخزن: {movement.type === 'IN'
                                ? warehouses.find(w => w.id === movement.toWarehouseId)?.name
                                : warehouses.find(w => w.id === movement.fromWarehouseId)?.name
                              }</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-row md:flex-col justify-between items-end">
                      <div className="text-sm text-muted-foreground">
                        {new Date(movement.createdAt).toLocaleDateString('ar-EG')}
                      </div>
                      {movement.notes && (
                        <p className="text-xs text-muted-foreground/70 max-w-[200px] truncate" title={movement.notes}>
                          {movement.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {getFilteredData().length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
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
