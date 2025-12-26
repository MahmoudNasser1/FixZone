import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Package,
  Warehouse,
  Truck,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { SimpleCard, SimpleCardContent, SimpleCardHeader } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/Select';
import Breadcrumb from '../../components/layout/Breadcrumb';
import apiService from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';

const InventoryTransferPage = () => {
  const notifications = useNotifications();
  const [warehouses, setWarehouses] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [stockLevels, setStockLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState('');

  // Transfer form state
  const [transferForm, setTransferForm] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    inventoryItemId: '',
    quantity: 1,
    notes: ''
  });

  // Load inventory data
  const loadInventoryData = async () => {
    try {
      setLoading(true);
      setError('');

      const [warehousesData, itemsData, levelsData] = await Promise.all([
        apiService.request('/warehouses'),
        apiService.request('/inventory'),
        apiService.request('/stocklevels')
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

    } catch (err) {
      setError('تعذر تحميل بيانات المخزون');
      console.error('Error loading inventory data:', err);
      notifications.error('تعذر تحميل بيانات المخزون');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, []);

  // Get available items for a specific warehouse
  const getAvailableItems = (warehouseId) => {
    if (!warehouseId) return [];

    return stockLevels
      .filter(level => level.warehouseId === parseInt(warehouseId) && level.quantity > 0)
      .map(level => {
        const item = inventoryItems.find(i => i.id === level.inventoryItemId);
        return {
          ...item,
          availableQuantity: level.quantity,
          stockLevelId: level.id
        };
      })
      .filter(item => item && item.name);
  };

  // Get stock level for an item in a specific warehouse
  const getStockLevel = (itemId, warehouseId) => {
    const level = stockLevels.find(level =>
      level.inventoryItemId === parseInt(itemId) && level.warehouseId === parseInt(warehouseId)
    );
    return level;
  };

  // Handle transfer form changes
  const handleTransferFormChange = (name, value) => {
    setTransferForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset inventory item when warehouse changes
    if (name === 'fromWarehouseId') {
      setTransferForm(prev => ({
        ...prev,
        [name]: value,
        inventoryItemId: ''
      }));
    }
  };

  // Execute transfer
  const executeTransfer = async () => {
    try {
      const { fromWarehouseId, toWarehouseId, inventoryItemId, quantity, notes } = transferForm;

      if (!fromWarehouseId || !toWarehouseId || !inventoryItemId || !quantity) {
        notifications.error('يرجى ملء جميع الحقول المطلوبة');
        return;
      }

      if (fromWarehouseId === toWarehouseId) {
        notifications.error('لا يمكن النقل لنفس المخزن');
        return;
      }

      const quantityNum = parseInt(quantity);
      if (quantityNum <= 0) {
        notifications.error('الكمية يجب أن تكون أكبر من الصفر');
        return;
      }

      // Check available quantity
      const sourceStock = getStockLevel(inventoryItemId, fromWarehouseId);
      if (!sourceStock || sourceStock.quantity < quantityNum) {
        notifications.error('الكمية المطلوبة غير متوفرة في المخزن المصدر');
        return;
      }

      setTransferring(true);
      setError('');

      // Create stock movement record
      const movementData = {
        type: 'TRANSFER',
        quantity: quantityNum,
        inventoryItemId: parseInt(inventoryItemId),
        fromWarehouseId: parseInt(fromWarehouseId),
        toWarehouseId: parseInt(toWarehouseId),
        notes: notes || 'نقل مخزون بين المخازن',
        userId: 1 // TODO: Get from auth context
      };

      const movementRes = await apiService.request('/stockmovements', {
        method: 'POST',
        body: JSON.stringify(movementData)
      });

      if (!movementRes.ok) {
        throw new Error('فشل في إنشاء حركة المخزون');
      }

      // Update source warehouse stock
      const newSourceQuantity = sourceStock.quantity - quantityNum;
      const sourceUpdateRes = await apiService.request(`/stocklevels/${sourceStock.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          quantity: newSourceQuantity,
          isLowStock: newSourceQuantity <= sourceStock.minLevel
        })
      });

      if (!sourceUpdateRes.ok) {
        throw new Error('فشل في تحديث مخزون المخزن المصدر');
      }

      // Update or create destination warehouse stock
      const destStock = getStockLevel(inventoryItemId, toWarehouseId);
      if (destStock) {
        // Update existing stock level
        const newDestQuantity = destStock.quantity + quantityNum;
        const destUpdateRes = await apiService.request(`/stocklevels/${destStock.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            quantity: newDestQuantity,
            isLowStock: newDestQuantity <= destStock.minLevel
          })
        });

        if (!destUpdateRes.ok) {
          throw new Error('فشل في تحديث مخزون المخزن الهدف');
        }
      } else {
        // Create new stock level
        const newStockLevelRes = await apiService.request('/stocklevels', {
          method: 'POST',
          body: JSON.stringify({
            inventoryItemId: parseInt(inventoryItemId),
            warehouseId: parseInt(toWarehouseId),
            quantity: quantityNum,
            minLevel: 5, // Default minimum level
            isLowStock: quantityNum <= 5
          })
        });

        if (!newStockLevelRes.ok) {
          throw new Error('فشل في إنشاء مستوى مخزون جديد');
        }
      }

      notifications.success('تم النقل بنجاح');

      // Reset form
      setTransferForm({
        fromWarehouseId: '',
        toWarehouseId: '',
        inventoryItemId: '',
        quantity: 1,
        notes: ''
      });

      // Reload data
      await loadInventoryData();

    } catch (err) {
      setError(err.message || 'فشل في تنفيذ النقل');
      notifications.error(err.message || 'فشل في تنفيذ النقل');
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-muted border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">جاري تحميل بيانات المخزون...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Breadcrumb
            items={[
              { label: 'الرئيسية', href: '/' },
              { label: 'إدارة المخزون', href: '/inventory' },
              { label: 'نقل المخزون', href: '/inventory/transfer', active: true }
            ]}
          />
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-foreground">نقل المخزون بين المخازن</h1>
            <p className="text-muted-foreground mt-2">إدارة حركة القطع بين المخازن المختلفة</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Transfer Form */}
          <SimpleCard>
            <SimpleCardHeader>
              <h2 className="text-xl font-semibold flex items-center">
                <Truck className="w-5 h-5 ml-2 text-primary" />
                نموذج النقل
              </h2>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="space-y-4">
                {/* From Warehouse */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    من مخزن
                  </label>
                  <Select
                    value={transferForm.fromWarehouseId}
                    onValueChange={(value) => handleTransferFormChange('fromWarehouseId', value)}
                  >
                    <SelectTrigger className="w-full text-right dir-rtl">
                      <SelectValue placeholder="اختر المخزن المصدر" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(warehouse => (
                        <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* To Warehouse */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    إلى مخزن
                  </label>
                  <Select
                    value={transferForm.toWarehouseId}
                    onValueChange={(value) => handleTransferFormChange('toWarehouseId', value)}
                  >
                    <SelectTrigger className="w-full text-right dir-rtl">
                      <SelectValue placeholder="اختر المخزن الهدف" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses
                        .filter(w => w.id !== parseInt(transferForm.fromWarehouseId))
                        .map(warehouse => (
                          <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Inventory Item */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    القطعة
                  </label>
                  <Select
                    value={transferForm.inventoryItemId}
                    onValueChange={(value) => handleTransferFormChange('inventoryItemId', value)}
                    disabled={!transferForm.fromWarehouseId}
                  >
                    <SelectTrigger className="w-full text-right dir-rtl">
                      <SelectValue placeholder="اختر القطعة" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableItems(transferForm.fromWarehouseId).map(item => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.name} - المتوفر: {item.availableQuantity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    الكمية
                  </label>
                  <Input
                    type="number"
                    value={transferForm.quantity}
                    onChange={(e) => handleTransferFormChange('quantity', e.target.value)}
                    min="1"
                    disabled={!transferForm.inventoryItemId}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    ملاحظات (اختياري)
                  </label>
                  <Textarea
                    value={transferForm.notes}
                    onChange={(e) => handleTransferFormChange('notes', e.target.value)}
                    rows={3}
                    placeholder="أضف ملاحظات حول النقل..."
                  />
                </div>

                {/* Execute Transfer Button */}
                <SimpleButton
                  onClick={executeTransfer}
                  disabled={transferring || !transferForm.fromWarehouseId || !transferForm.toWarehouseId || !transferForm.inventoryItemId}
                  className="w-full"
                  size="lg"
                >
                  {transferring ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current ml-2"></div>
                      جاري النقل...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-5 h-5 ml-2" />
                      تنفيذ النقل
                    </>
                  )}
                </SimpleButton>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Transfer Summary */}
          <SimpleCard>
            <SimpleCardHeader>
              <h2 className="text-xl font-semibold flex items-center">
                <CheckCircle className="w-5 h-5 ml-2 text-emerald-500" />
                ملخص النقل
              </h2>
            </SimpleCardHeader>
            <SimpleCardContent>
              {transferForm.fromWarehouseId && transferForm.toWarehouseId && transferForm.inventoryItemId ? (
                <div className="space-y-4">
                  {/* Source Warehouse Info */}
                  <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-lg">
                    <h3 className="font-medium text-foreground mb-2">المخزن المصدر</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>المخزن: <span className="font-medium text-foreground">{warehouses.find(w => w.id === parseInt(transferForm.fromWarehouseId))?.name}</span></p>
                      <p>القطعة: <span className="font-medium text-foreground">{inventoryItems.find(i => i.id === parseInt(transferForm.inventoryItemId))?.name}</span></p>
                      <p>الكمية المتوفرة: <span className="font-medium text-foreground">{getStockLevel(transferForm.inventoryItemId, transferForm.fromWarehouseId)?.quantity || 0}</span></p>
                      <p>الكمية المطلوبة: <span className="font-medium text-foreground">{transferForm.quantity}</span></p>
                    </div>
                  </div>

                  {/* Transfer Arrow */}
                  <div className="flex justify-center">
                    <ArrowRight className="w-8 h-8 text-muted-foreground" />
                  </div>

                  {/* Destination Warehouse Info */}
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-lg">
                    <h3 className="font-medium text-foreground mb-2">المخزن الهدف</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>المخزن: <span className="font-medium text-foreground">{warehouses.find(w => w.id === parseInt(transferForm.toWarehouseId))?.name}</span></p>
                      <p>القطعة: <span className="font-medium text-foreground">{inventoryItems.find(i => i.id === parseInt(transferForm.inventoryItemId))?.name}</span></p>
                      <p>المخزون الحالي: <span className="font-medium text-foreground">{getStockLevel(transferForm.inventoryItemId, transferForm.toWarehouseId)?.quantity || 0}</span></p>
                      <p>المخزون بعد النقل: <span className="font-medium text-foreground">{(getStockLevel(transferForm.inventoryItemId, transferForm.toWarehouseId)?.quantity || 0) + parseInt(transferForm.quantity)}</span></p>
                    </div>
                  </div>

                  {/* Validation */}
                  {(() => {
                    const sourceStock = getStockLevel(transferForm.inventoryItemId, transferForm.fromWarehouseId);
                    const availableQuantity = sourceStock?.quantity || 0;
                    const requestedQuantity = parseInt(transferForm.quantity);

                    if (requestedQuantity > availableQuantity) {
                      return (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 shrink-0" />
                          <span>الكمية المطلوبة ({requestedQuantity}) أكبر من المتوفر ({availableQuantity})</span>
                        </div>
                      );
                    }

                    return (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 shrink-0" />
                        <span>النقل ممكن - الكمية متوفرة</span>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p>اختر المخازن والقطعة لعرض ملخص النقل</p>
                </div>
              )}
            </SimpleCardContent>
          </SimpleCard>
        </div>

        {/* Recent Transfers */}
        <SimpleCard>
          <SimpleCardHeader>
            <h2 className="text-xl font-semibold">آخر عمليات النقل</h2>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="text-center text-muted-foreground py-12">
              <Truck className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <p>سيتم عرض آخر عمليات النقل هنا</p>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>
    </div>
  );
};

export default InventoryTransferPage;
