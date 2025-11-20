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
import SimpleBadge from '../../components/ui/SimpleBadge';
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
      console.log('Warehouses loaded:', parsedWarehouses.length, parsedWarehouses);
      setWarehouses(parsedWarehouses);

      // Parse items
      let parsedItems = [];
      if (Array.isArray(itemsData)) {
        parsedItems = itemsData;
      } else if (itemsData?.data) {
        parsedItems = Array.isArray(itemsData.data) ? itemsData.data : (itemsData.data.items || []);
      }
      console.log('Items loaded:', parsedItems.length);
      setInventoryItems(parsedItems);

      // Parse stock levels
      let parsedLevels = [];
      if (Array.isArray(levelsData)) {
        parsedLevels = levelsData;
      } else if (levelsData?.data) {
        parsedLevels = Array.isArray(levelsData.data) ? levelsData.data : [];
      }
      console.log('Stock levels loaded:', parsedLevels.length);
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
    console.log('getStockLevel called with:', { itemId, warehouseId, stockLevels });
    const level = stockLevels.find(level => 
      level.inventoryItemId === parseInt(itemId) && level.warehouseId === parseInt(warehouseId)
    );
    console.log('Found stock level:', level);
    return level;
  };

  // Handle transfer form changes
  const handleTransferFormChange = (e) => {
    const { name, value } = e.target;
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb 
            items={[
              { label: 'الرئيسية', href: '/' },
              { label: 'إدارة المخزون', href: '/inventory' },
              { label: 'نقل المخزون', href: '/inventory/transfer', active: true }
            ]} 
          />
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">نقل المخزون بين المخازن</h1>
            <p className="text-gray-600 mt-2">إدارة حركة القطع بين المخازن المختلفة</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Transfer Form */}
          <SimpleCard>
            <SimpleCardHeader>
              <h2 className="text-xl font-semibold flex items-center">
                <Truck className="w-5 h-5 ml-2 text-blue-600" />
                نموذج النقل
              </h2>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="space-y-4">
                {/* From Warehouse */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    من مخزن
                  </label>
                  <select
                    name="fromWarehouseId"
                    value={transferForm.fromWarehouseId}
                    onChange={handleTransferFormChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">اختر المخزن المصدر</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* To Warehouse */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    إلى مخزن
                  </label>
                  <select
                    name="toWarehouseId"
                    value={transferForm.toWarehouseId}
                    onChange={handleTransferFormChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">اختر المخزن الهدف</option>
                    {warehouses
                      .filter(w => w.id !== parseInt(transferForm.fromWarehouseId))
                      .map(warehouse => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Inventory Item */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    القطعة
                  </label>
                  <select
                    name="inventoryItemId"
                    value={transferForm.inventoryItemId}
                    onChange={handleTransferFormChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!transferForm.fromWarehouseId}
                  >
                    <option value="">اختر القطعة</option>
                    {getAvailableItems(transferForm.fromWarehouseId).map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} - المتوفر: {item.availableQuantity}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الكمية
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={transferForm.quantity}
                    onChange={handleTransferFormChange}
                    min="1"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!transferForm.inventoryItemId}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ملاحظات (اختياري)
                  </label>
                  <textarea
                    name="notes"
                    value={transferForm.notes}
                    onChange={handleTransferFormChange}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
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
                <CheckCircle className="w-5 h-5 ml-2 text-green-600" />
                ملخص النقل
              </h2>
            </SimpleCardHeader>
            <SimpleCardContent>
              {transferForm.fromWarehouseId && transferForm.toWarehouseId && transferForm.inventoryItemId ? (
                <div className="space-y-4">
                  {/* Source Warehouse Info */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">المخزن المصدر</h3>
                    <div className="text-sm text-blue-700">
                      <p>المخزن: {warehouses.find(w => w.id === parseInt(transferForm.fromWarehouseId))?.name}</p>
                      <p>القطعة: {inventoryItems.find(i => i.id === parseInt(transferForm.inventoryItemId))?.name}</p>
                      <p>الكمية المتوفرة: {getStockLevel(transferForm.inventoryItemId, transferForm.fromWarehouseId)?.quantity || 0}</p>
                      <p>الكمية المطلوبة: {transferForm.quantity}</p>
                    </div>
                  </div>

                  {/* Transfer Arrow */}
                  <div className="flex justify-center">
                    <ArrowRight className="w-8 h-8 text-gray-400" />
                  </div>

                  {/* Destination Warehouse Info */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-900 mb-2">المخزن الهدف</h3>
                    <div className="text-sm text-green-700">
                      <p>المخزن: {warehouses.find(w => w.id === parseInt(transferForm.toWarehouseId))?.name}</p>
                      <p>القطعة: {inventoryItems.find(i => i.id === parseInt(transferForm.inventoryItemId))?.name}</p>
                      <p>المخزون الحالي: {getStockLevel(transferForm.inventoryItemId, transferForm.toWarehouseId)?.quantity || 0}</p>
                      <p>المخزون بعد النقل: {(getStockLevel(transferForm.inventoryItemId, transferForm.toWarehouseId)?.quantity || 0) + parseInt(transferForm.quantity)}</p>
                    </div>
                  </div>

                  {/* Validation */}
                  {(() => {
                    const sourceStock = getStockLevel(transferForm.inventoryItemId, transferForm.fromWarehouseId);
                    const availableQuantity = sourceStock?.quantity || 0;
                    const requestedQuantity = parseInt(transferForm.quantity);
                    
                    if (requestedQuantity > availableQuantity) {
                      return (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                          <AlertTriangle className="w-5 h-5 inline ml-2" />
                          الكمية المطلوبة ({requestedQuantity}) أكبر من المتوفر ({availableQuantity})
                        </div>
                      );
                    }
                    
                    return (
                      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                        <CheckCircle className="w-5 h-5 inline ml-2" />
                        النقل ممكن - الكمية متوفرة
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>اختر المخازن والقطعة لعرض ملخص النقل</p>
                </div>
              )}
            </SimpleCardContent>
          </SimpleCard>
        </div>

        {/* Recent Transfers */}
        <div className="mt-8">
          <SimpleCard>
            <SimpleCardHeader>
              <h2 className="text-xl font-semibold">آخر عمليات النقل</h2>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="text-center text-gray-500 py-8">
                <Truck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>سيتم عرض آخر عمليات النقل هنا</p>
              </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>
      </div>
    </div>
  );
};

export default InventoryTransferPage;
