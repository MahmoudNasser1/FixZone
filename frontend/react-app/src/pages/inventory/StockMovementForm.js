import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import inventoryService from '../../services/inventoryService';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import SimpleButton from '../../components/ui/SimpleButton';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/Select';
import { 
  Save, 
  X, 
  ArrowUp, 
  ArrowDown,
  ArrowRightLeft,
  Package,
  Warehouse,
  Hash,
  FileText
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const StockMovementForm = ({ movement, onSave, onCancel, onSuccess }) => {
  const notifications = useNotifications();
  const notify = (type, message) => {
    if (notifications?.addNotification) {
      notifications.addNotification({ type, message });
    } else if (notifications?.[type]) {
      notifications[type](message);
    }
  };

  const [formData, setFormData] = useState({
    type: 'IN',
    inventoryItemId: '',
    quantity: '',
    fromWarehouseId: '',
    toWarehouseId: '',
    notes: ''
  });

  const [inventoryItems, setInventoryItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState({});

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load movement data if editing
  useEffect(() => {
    if (movement) {
      setFormData({
        type: movement.type || 'IN',
        inventoryItemId: movement.inventoryItemId || '',
        quantity: movement.quantity || '',
        fromWarehouseId: movement.fromWarehouseId || '',
        toWarehouseId: movement.toWarehouseId || '',
        notes: movement.notes || ''
      });
    }
  }, [movement]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      await Promise.all([
        loadInventoryItems(),
        loadWarehouses()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      notify('error', 'خطأ في تحميل البيانات');
    } finally {
      setLoadingData(false);
    }
  };

  const loadInventoryItems = async () => {
    try {
      const response = await apiService.getInventoryItems({ limit: 500 });
      let itemsData = [];
      
      if (Array.isArray(response)) {
        itemsData = response;
      } else if (response?.success && response?.data) {
        itemsData = Array.isArray(response.data) ? response.data : response.data.items || [];
      } else if (response?.data && Array.isArray(response.data)) {
        itemsData = response.data;
      } else if (response?.items && Array.isArray(response.items)) {
        itemsData = response.items;
      }
      
      setInventoryItems(itemsData);
    } catch (error) {
      console.error('Error loading inventory items:', error);
      setInventoryItems([]);
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Clear warehouse fields when type changes
    if (field === 'type') {
      setFormData(prev => ({
        ...prev,
        type: value,
        fromWarehouseId: value === 'IN' ? '' : prev.fromWarehouseId,
        toWarehouseId: value === 'OUT' ? '' : prev.toWarehouseId
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.type) {
      newErrors.type = 'نوع الحركة مطلوب';
    }

    if (!formData.inventoryItemId) {
      newErrors.inventoryItemId = 'الصنف مطلوب';
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'الكمية مطلوبة ويجب أن تكون أكبر من صفر';
    }

    if (formData.type === 'IN' && !formData.toWarehouseId) {
      newErrors.toWarehouseId = 'المخزن المستقبل مطلوب لحركات IN';
    }

    if (formData.type === 'OUT' && !formData.fromWarehouseId) {
      newErrors.fromWarehouseId = 'المخزن المصدر مطلوب لحركات OUT';
    }

    if (formData.type === 'TRANSFER') {
      if (!formData.fromWarehouseId) {
        newErrors.fromWarehouseId = 'المخزن المصدر مطلوب لحركات TRANSFER';
      }
      if (!formData.toWarehouseId) {
        newErrors.toWarehouseId = 'المخزن المستقبل مطلوب لحركات TRANSFER';
      }
      if (formData.fromWarehouseId && formData.toWarehouseId && 
          formData.fromWarehouseId === formData.toWarehouseId) {
        newErrors.toWarehouseId = 'المخزن المصدر والمستقبل لا يمكن أن يكونا نفس المخزن';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      notify('error', 'يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    try {
      setLoading(true);

      const movementData = {
        type: formData.type,
        inventoryItemId: parseInt(formData.inventoryItemId),
        quantity: parseInt(formData.quantity),
        fromWarehouseId: formData.fromWarehouseId ? parseInt(formData.fromWarehouseId) : null,
        toWarehouseId: formData.toWarehouseId ? parseInt(formData.toWarehouseId) : null,
        notes: formData.notes.trim() || null
      };

      let response;
      if (movement) {
        response = await apiService.updateStockMovement(movement.id, movementData);
        notify('success', 'تم تحديث الحركة بنجاح');
      } else {
        response = await apiService.createStockMovement(movementData);
        notify('success', 'تم إنشاء الحركة بنجاح');
      }

      if (onSuccess) {
        onSuccess(response);
      }
      
      if (onSave) {
        onSave(response);
      }
    } catch (error) {
      console.error('Error saving movement:', error);
      const errorMessage = error?.message || error?.details || 'خطأ في حفظ الحركة';
      notify('error', errorMessage);
      
      // Handle validation errors
      if (error?.details && Array.isArray(error.details)) {
        const validationErrors = {};
        error.details.forEach(err => {
          if (err.field) {
            validationErrors[err.field] = err.message || err;
          }
        });
        setErrors(validationErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const getMovementIcon = () => {
    switch (formData.type) {
      case 'IN':
        return <ArrowUp className="w-5 h-5 text-green-600" />;
      case 'OUT':
        return <ArrowDown className="w-5 h-5 text-red-600" />;
      case 'TRANSFER':
        return <ArrowRightLeft className="w-5 h-5 text-blue-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getMovementLabel = () => {
    switch (formData.type) {
      case 'IN':
        return 'دخول';
      case 'OUT':
        return 'خروج';
      case 'TRANSFER':
        return 'نقل';
      default:
        return 'اختر النوع';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          نوع الحركة <span className="text-red-500">*</span>
        </label>
        <Select
          value={formData.type}
          onValueChange={(value) => handleInputChange('type', value)}
        >
          <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
            <div className="flex items-center gap-2">
              {getMovementIcon()}
              <SelectValue placeholder="اختر نوع الحركة" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="IN">
              <div className="flex items-center gap-2">
                <ArrowUp className="w-4 h-4 text-green-600" />
                <span>دخول (IN)</span>
              </div>
            </SelectItem>
            <SelectItem value="OUT">
              <div className="flex items-center gap-2">
                <ArrowDown className="w-4 h-4 text-red-600" />
                <span>خروج (OUT)</span>
              </div>
            </SelectItem>
            <SelectItem value="TRANSFER">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                <span>نقل (TRANSFER)</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="mt-1 text-sm text-red-600">{errors.type}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {formData.type === 'IN' && 'إضافة كمية للمخزن'}
          {formData.type === 'OUT' && 'خصم كمية من المخزن'}
          {formData.type === 'TRANSFER' && 'نقل كمية بين مخزنين'}
        </p>
      </div>

      {/* Inventory Item */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          الصنف <span className="text-red-500">*</span>
        </label>
        <Select
          value={formData.inventoryItemId.toString()}
          onValueChange={(value) => handleInputChange('inventoryItemId', value)}
          disabled={!!movement}
        >
          <SelectTrigger className={errors.inventoryItemId ? 'border-red-500' : ''}>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <SelectValue placeholder="اختر الصنف" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {inventoryItems.map((item) => (
              <SelectItem key={item.id} value={item.id.toString()}>
                <div className="flex flex-col">
                  <span className="font-medium">{item.name}</span>
                  {item.sku && (
                    <span className="text-xs text-gray-500">SKU: {item.sku}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.inventoryItemId && (
          <p className="mt-1 text-sm text-red-600">{errors.inventoryItemId}</p>
        )}
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          الكمية <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Hash className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="number"
            min="1"
            step="1"
            value={formData.quantity}
            onChange={(e) => handleInputChange('quantity', e.target.value)}
            className={`pr-10 ${errors.quantity ? 'border-red-500' : ''}`}
            placeholder="أدخل الكمية"
            required
          />
        </div>
        {errors.quantity && (
          <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
        )}
      </div>

      {/* Warehouses - Dynamic based on type */}
      {formData.type === 'IN' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            المخزن المستقبل <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.toWarehouseId.toString()}
            onValueChange={(value) => handleInputChange('toWarehouseId', value)}
          >
            <SelectTrigger className={errors.toWarehouseId ? 'border-red-500' : ''}>
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-gray-400" />
                <SelectValue placeholder="اختر المخزن المستقبل" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                  {warehouse.name}
                  {warehouse.location && (
                    <span className="text-xs text-gray-500 mr-2">- {warehouse.location}</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.toWarehouseId && (
            <p className="mt-1 text-sm text-red-600">{errors.toWarehouseId}</p>
          )}
        </div>
      )}

      {formData.type === 'OUT' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            المخزن المصدر <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.fromWarehouseId.toString()}
            onValueChange={(value) => handleInputChange('fromWarehouseId', value)}
          >
            <SelectTrigger className={errors.fromWarehouseId ? 'border-red-500' : ''}>
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-gray-400" />
                <SelectValue placeholder="اختر المخزن المصدر" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                  {warehouse.name}
                  {warehouse.location && (
                    <span className="text-xs text-gray-500 mr-2">- {warehouse.location}</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.fromWarehouseId && (
            <p className="mt-1 text-sm text-red-600">{errors.fromWarehouseId}</p>
          )}
        </div>
      )}

      {formData.type === 'TRANSFER' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المخزن المصدر <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.fromWarehouseId.toString()}
              onValueChange={(value) => handleInputChange('fromWarehouseId', value)}
            >
              <SelectTrigger className={errors.fromWarehouseId ? 'border-red-500' : ''}>
                <div className="flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-gray-400" />
                  <SelectValue placeholder="اختر المخزن المصدر" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                    {warehouse.name}
                    {warehouse.location && (
                      <span className="text-xs text-gray-500 mr-2">- {warehouse.location}</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.fromWarehouseId && (
              <p className="mt-1 text-sm text-red-600">{errors.fromWarehouseId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المخزن المستقبل <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.toWarehouseId.toString()}
              onValueChange={(value) => handleInputChange('toWarehouseId', value)}
            >
              <SelectTrigger className={errors.toWarehouseId ? 'border-red-500' : ''}>
                <div className="flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-gray-400" />
                  <SelectValue placeholder="اختر المخزن المستقبل" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {warehouses
                  .filter(w => w.id.toString() !== formData.fromWarehouseId.toString())
                  .map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name}
                      {warehouse.location && (
                        <span className="text-xs text-gray-500 mr-2">- {warehouse.location}</span>
                      )}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.toWarehouseId && (
              <p className="mt-1 text-sm text-red-600">{errors.toWarehouseId}</p>
            )}
          </div>
        </>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          الملاحظات
        </label>
        <div className="relative">
          <FileText className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
          <Textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="pr-10 min-h-[100px]"
            placeholder="أدخل ملاحظات حول الحركة (اختياري)"
            maxLength={2000}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {formData.notes.length}/2000 حرف
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <SimpleButton
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          إلغاء
        </SimpleButton>
        <SimpleButton
          type="submit"
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              جارٍ الحفظ...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {movement ? 'تحديث' : 'حفظ'}
            </>
          )}
        </SimpleButton>
      </div>
    </form>
  );
};

export default StockMovementForm;

