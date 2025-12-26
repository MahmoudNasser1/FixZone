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
  CheckCircle2,
  Activity,
  ArrowLeft,
  RefreshCw,
  PackageSearch
} from 'lucide-react';
import { SimpleCard, SimpleCardContent, SimpleCardHeader, SimpleCardTitle } from '../../components/ui/SimpleCard';
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
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SimpleBadge from '../../components/ui/SimpleBadge';

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
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6 text-right" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
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
            <p className="text-muted-foreground mt-1">تحليل شامل للمخزون وحركة القطع والقيمة المالية</p>
          </div>
          <div className="flex items-center gap-2">
            <SimpleButton onClick={exportReport} variant="outline" className="w-full md:w-auto">
              <Download className="w-4 h-4 ml-2" />
              تصدير التقرير
            </SimpleButton>
          </div>
        </div>

        {/* Filters */}
        <SimpleCard>
          <SimpleCardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  من تاريخ
                </label>
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full bg-muted border-border"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  إلى تاريخ
                </label>
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full bg-muted border-border"
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Warehouse className="w-4 h-4" />
                  المخزن المستهدف
                </label>
                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                  <SelectTrigger className="w-full text-right bg-muted border-border" dir="rtl">
                    <SelectValue placeholder="اختر المخزن" />
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

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-border overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
            { id: 'lowStock', label: 'المخزون المنخفض', icon: AlertTriangle, color: 'text-danger' },
            { id: 'highValue', label: 'أعلى قيمة', icon: TrendingUp, color: 'text-primary' },
            { id: 'movements', label: 'حركة المخزون', icon: TrendingDown }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeReport === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative min-w-max",
                  isActive
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
                )}
              >
                <Icon className={cn("w-4 h-4", tab.color)} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Report Content Areas */}
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeReport === 'overview' && (
            <div className="space-y-8">
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'إجمالي المخازن', value: warehouses.length, icon: Warehouse, color: 'text-primary', bg: 'bg-primary/10' },
                  { label: 'إجمالي القطع', value: inventoryItems.length, icon: Package, color: 'text-success', bg: 'bg-success/10' },
                  { label: 'قطع منخفضة', value: getLowStockItems().length, icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10' },
                  { label: 'حركات الفترة', value: getFilteredData().length, icon: Activity, color: 'text-warning', bg: 'bg-warning/10' }
                ].map((stat, i) => (
                  <SimpleCard key={i} className="hover:shadow-md transition-shadow">
                    <SimpleCardContent className="p-6 flex flex-col items-center text-center">
                      <div className={cn("p-3 rounded-2xl mb-4", stat.bg)}>
                        <stat.icon className={cn("w-6 h-6", stat.color)} />
                      </div>
                      <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                      <p className="text-sm font-medium text-muted-foreground mt-1">{stat.label}</p>
                    </SimpleCardContent>
                  </SimpleCard>
                ))}
              </div>

              {/* Movement Summary breakdown */}
              <SimpleCard>
                <SimpleCardHeader>
                  <SimpleCardTitle className="text-lg">إجمالي حركات المخزون</SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(() => {
                      const stats = calculateStats();
                      return (
                        <>
                          <div className="flex items-center gap-4 p-5 bg-success/5 border border-success/10 rounded-2xl">
                            <div className="p-3 bg-success/10 rounded-xl">
                              <TrendingUp className="w-6 h-6 text-success" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-success/80">إجمالي الوارد</p>
                              <h4 className="text-2xl font-bold text-foreground">{stats.totalIn}</h4>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 p-5 bg-destructive/5 border border-destructive/10 rounded-2xl">
                            <div className="p-3 bg-destructive/10 rounded-xl">
                              <TrendingDown className="w-6 h-6 text-destructive" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-destructive/80">إجمالي الصادر</p>
                              <h4 className="text-2xl font-bold text-foreground">{stats.totalOut}</h4>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 p-5 bg-primary/5 border border-primary/10 rounded-2xl">
                            <div className="p-3 bg-primary/10 rounded-xl">
                              <BarChart3 className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-primary/80">إجمالي النقل</p>
                              <h4 className="text-2xl font-bold text-foreground">{stats.totalTransfer}</h4>
                            </div>
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
                <div className="flex items-center justify-between">
                  <SimpleCardTitle>نقص المخزون الحرج</SimpleCardTitle>
                  <SimpleBadge variant="warning">{getLowStockItems().length} قطعة</SimpleBadge>
                </div>
              </SimpleCardHeader>
              <div className="divide-y divide-border border-t border-border">
                {getLowStockItems().map(level => {
                  const item = inventoryItems.find(i => i.id === level.inventoryItemId);
                  const warehouse = warehouses.find(w => w.id === level.warehouseId);
                  if (!item || !warehouse) return null;
                  return (
                    <div key={`${level.inventoryItemId}-${level.warehouseId}`} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                      <div className="flex gap-4">
                        <div className="p-2 bg-danger/10 rounded-lg h-fit">
                          <AlertTriangle className="w-5 h-5 text-danger" />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground">{item.name}</h4>
                          <p className="text-sm text-muted-foreground mt-0.5">SKU: {item.sku}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <SimpleBadge variant="outline" className="text-[10px]">{warehouse.name}</SimpleBadge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8 w-full sm:w-auto justify-between border-t sm:border-t-0 pt-4 sm:pt-0">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">الحالي</p>
                          <p className="text-xl font-bold text-danger">{level.quantity}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">الحد الأدنى</p>
                          <p className="text-xl font-bold text-foreground/50">{level.minLevel}</p>
                        </div>
                        <SimpleButton variant="outline" size="sm" className="hidden sm:flex">تفاصيل</SimpleButton>
                      </div>
                    </div>
                  );
                })}
                {getLowStockItems().length === 0 && (
                  <div className="py-20 text-center space-y-4">
                    <CheckCircle2 className="w-16 h-16 text-success/20 mx-auto" />
                    <p className="text-muted-foreground font-medium">المخزون في حالة ممتازة حالياً</p>
                  </div>
                )}
              </div>
            </SimpleCard>
          )}

          {activeReport === 'highValue' && (
            <SimpleCard>
              <SimpleCardHeader>
                <div className="flex items-center justify-between">
                  <SimpleCardTitle>أعلى 10 قطع غيار قيمة</SimpleCardTitle>
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
              </SimpleCardHeader>
              <div className="overflow-x-auto border-t border-border">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-6 py-4 text-sm font-bold text-muted-foreground">الرتبة</th>
                      <th className="px-6 py-4 text-sm font-bold text-muted-foreground">القطعة</th>
                      <th className="px-6 py-4 text-sm font-bold text-muted-foreground text-center">المخزون</th>
                      <th className="px-6 py-4 text-sm font-bold text-muted-foreground">سعر الوحدة</th>
                      <th className="px-6 py-4 text-sm font-bold text-muted-foreground">إجمالي القيمة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {getHighValueItems().map((item, index) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs",
                            index < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground">
                          {item.name}
                          <p className="text-xs text-muted-foreground font-normal">{item.sku}</p>
                        </td>
                        <td className="px-6 py-4 text-center text-muted-foreground">{item.totalStock}</td>
                        <td className="px-6 py-4 text-muted-foreground">{(item.sellingPrice || 0).toLocaleString('ar-SA')} ج.م</td>
                        <td className="px-6 py-4 font-bold text-primary">{item.totalValue.toLocaleString('ar-SA')} ج.م</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SimpleCard>
          )}

          {activeReport === 'movements' && (
            <SimpleCard>
              <SimpleCardHeader>
                <div className="flex items-center justify-between">
                  <SimpleCardTitle>سجل حركة المخزون المفصل</SimpleCardTitle>
                  <SimpleBadge variant="outline">{getFilteredData().length} حركة</SimpleBadge>
                </div>
              </SimpleCardHeader>
              <div className="divide-y divide-border border-t border-border">
                {getFilteredData().map(movement => (
                  <div key={movement.id} className="p-6 flex flex-col md:flex-row gap-6 relative group hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={cn(
                        "p-3 rounded-xl transition-transform group-hover:scale-110",
                        movement.type === 'IN' ? 'bg-success/10 text-success' :
                          movement.type === 'OUT' ? 'bg-danger/10 text-danger' :
                            'bg-primary/10 text-primary'
                      )}>
                        {movement.type === 'IN' ? <TrendingUp className="w-5 h-5" /> :
                          movement.type === 'OUT' ? <TrendingDown className="w-5 h-5" /> :
                            <RefreshCw className="w-5 h-5" />}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-foreground">
                          {movement.type === 'IN' ? 'عملية توريد (وارد)' :
                            movement.type === 'OUT' ? 'صرف مبيعات/إصلاح (صادر)' :
                              'تحويل بين المخازن'}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(movement.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-foreground font-bold">{movement.quantity}</span> قطعة
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-xs font-medium">
                          {movement.type === 'TRANSFER' ? (
                            <div className="flex items-center gap-2 text-primary">
                              <span>{warehouses.find(w => w.id === movement.fromWarehouseId)?.name}</span>
                              <ArrowLeft className="w-3 h-3" />
                              <span>{warehouses.find(w => w.id === movement.toWarehouseId)?.name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Package className="w-3.5 h-3.5" />
                              <span>المخزن: {movement.type === 'IN'
                                ? warehouses.find(w => w.id === movement.toWarehouseId)?.name
                                : warehouses.find(w => w.id === movement.fromWarehouseId)?.name
                              }</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {movement.notes && (
                      <div className="md:w-64 bg-muted/50 p-3 rounded-lg border border-border/50 self-start">
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                          "{movement.notes}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                {getFilteredData().length === 0 && (
                  <div className="py-20 text-center space-y-4">
                    <PackageSearch className="w-16 h-16 text-muted-foreground/20 mx-auto" />
                    <p className="text-muted-foreground font-medium">لا توجد سجلات حركة للفترة المحددة</p>
                  </div>
                )}
              </div>
            </SimpleCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryReportsPage;
