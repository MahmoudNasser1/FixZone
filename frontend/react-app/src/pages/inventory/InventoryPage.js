import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import inventoryService from '../../services/inventoryService';
import apiService from '../../services/api';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import { DataTable } from '../../components/ui/DataTable';
import { DataTableToolbar } from '../../components/ui/DataTableToolbar';
import { DataTablePagination } from '../../components/ui/DataTablePagination';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { Plus, Edit, Trash2 } from 'lucide-react';

function StatCard({ title, value, tone = 'default' }) {
  const tones = {
    default: 'bg-slate-800 text-slate-100',
    success: 'bg-emerald-800 text-emerald-50',
    warning: 'bg-amber-800 text-amber-50',
    danger: 'bg-rose-800 text-rose-50',
  };
  return (
    <div className={`rounded-lg p-4 ${tones[tone]}`}>
      <div className="text-sm opacity-80">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

// تعريف أعمدة جدول العناصر - will be created inside component to access functions
const createInventoryColumns = (handleEditItem, handleDeleteItem) => [
  {
    accessorKey: "sku",
    header: "الرمز SKU",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-gray-700">{row.getValue("sku")}</span>
    ),
  },
  {
    accessorKey: "name",
    header: "الاسم",
  },
  {
    accessorKey: "type",
    header: "النوع",
  },
  {
    accessorKey: "purchasePrice",
    header: "سعر الشراء",
    cell: ({ row }) => Number(row.getValue("purchasePrice") ?? 0).toFixed(2),
  },
  {
    accessorKey: "sellingPrice",
    header: "سعر البيع",
    cell: ({ row }) => Number(row.getValue("sellingPrice") ?? 0).toFixed(2),
  },
  {
    accessorKey: "serialNumber",
    header: "رقم تسلسلي",
    cell: ({ row }) => row.getValue("serialNumber") || '-',
  },
  {
    id: "actions",
    header: "إجراءات",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <SimpleButton 
          variant="outline" 
          size="sm"
          onClick={() => handleEditItem(row.original)}
        >
          <Edit className="w-3 h-3 ml-1" />
          تعديل
        </SimpleButton>
        <SimpleButton 
          variant="outline" 
          size="sm"
          onClick={() => handleDeleteItem(row.original.id)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-3 h-3 ml-1" />
          حذف
        </SimpleButton>
      </div>
    ),
  },
];

export default function InventoryPage() {
  const notifications = useNotifications();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [items, setItems] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stockLevels, setStockLevels] = useState([]);

  const [activeTab, setActiveTab] = useState('items'); // items | low | levels
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [itemForm, setItemForm] = useState({
    sku: '',
    name: '',
    type: '',
    purchasePrice: 0,
    sellingPrice: 0,
    serialNumber: '',
    customFields: {}
  });

  // Handle functions
  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      sku: item.sku || '',
      name: item.name || '',
      type: item.type || '',
      purchasePrice: item.purchasePrice || 0,
      sellingPrice: item.sellingPrice || 0,
      serialNumber: item.serialNumber || '',
      customFields: item.customFields || {}
    });
    setShowEditModal(true);
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
    
    try {
      await apiService.request(`/inventoryitems/${itemId}`, { method: 'DELETE' });
      notifications.success('تم حذف العنصر بنجاح');
      // Reload items
      const itemsRes = await inventoryService.listItems();
      setItems(Array.isArray(itemsRes) ? itemsRes : (itemsRes?.data?.items || itemsRes?.items || []));
    } catch (error) {
      console.error('Error deleting item:', error);
      notifications.error('فشل في حذف العنصر');
    }
  };

  const handleCreateItem = async () => {
    if (!itemForm.sku || !itemForm.name) {
      notifications.error('الرمز والاسم مطلوبان');
      return;
    }

    try {
      setSaving(true);
      await apiService.request('/inventoryitems', {
        method: 'POST',
        body: JSON.stringify(itemForm)
      });
      notifications.success('تم إنشاء العنصر بنجاح');
      setShowCreateModal(false);
      resetForm();
      // Reload items
      const itemsRes = await inventoryService.listItems();
      setItems(Array.isArray(itemsRes) ? itemsRes : (itemsRes?.data?.items || itemsRes?.items || []));
    } catch (error) {
      console.error('Error creating item:', error);
      notifications.error('فشل في إنشاء العنصر');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!itemForm.sku || !itemForm.name) {
      notifications.error('الرمز والاسم مطلوبان');
      return;
    }

    try {
      setSaving(true);
      await apiService.request(`/inventoryitems/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(itemForm)
      });
      notifications.success('تم تحديث العنصر بنجاح');
      setShowEditModal(false);
      setEditingItem(null);
      resetForm();
      // Reload items
      const itemsRes = await inventoryService.listItems();
      setItems(Array.isArray(itemsRes) ? itemsRes : (itemsRes?.data?.items || itemsRes?.items || []));
    } catch (error) {
      console.error('Error updating item:', error);
      notifications.error('فشل في تحديث العنصر');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setItemForm({
      sku: '',
      name: '',
      type: '',
      purchasePrice: 0,
      sellingPrice: 0,
      serialNumber: '',
      customFields: {}
    });
  };

  // Create columns with access to handler functions
  const inventoryColumns = createInventoryColumns(handleEditItem, handleDeleteItem);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [itemsRes, lowRes, whRes, levelsRes] = await Promise.all([
          inventoryService.listItems(),
          inventoryService.listLowStock(),
          inventoryService.listWarehouses(),
          inventoryService.listStockLevels(),
        ]);
        if (!mounted) return;
        setItems(Array.isArray(itemsRes) ? itemsRes : (itemsRes?.data?.items || itemsRes?.items || []));
        setLowStock(Array.isArray(lowRes) ? lowRes : []);
        setWarehouses(whRes || []);
        setStockLevels(Array.isArray(levelsRes) ? levelsRes : []);
      } catch (e) {
        console.error(e);
        setError(e?.message || 'حدث خطأ في جلب بيانات المخزون');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);


  return (
    <div className="space-y-6">
      {/* Header with Breadcrumb and Actions */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Breadcrumb items={[
              { label: 'الرئيسية', href: '/' },
              { label: 'المخزون', href: '/inventory' },
            ]} />
            <h1 className="text-2xl font-bold text-gray-900">إدارة المخزون</h1>
            <p className="text-sm text-gray-500">إدارة المخزون والقطع</p>
          </div>
          <div className="flex items-center gap-2">
            <SimpleButton onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة عنصر جديد
            </SimpleButton>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SimpleCard>
          <SimpleCardContent>
            <div className="text-sm text-gray-500">عدد العناصر</div>
            <div className="text-2xl font-bold mt-1 text-gray-900">{items.length}</div>
          </SimpleCardContent>
        </SimpleCard>
        <SimpleCard>
          <SimpleCardContent>
            <div className="text-sm text-gray-500">تنبيهات النقص</div>
            <div className={`text-2xl font-bold mt-1 ${lowStock.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{lowStock.length}</div>
          </SimpleCardContent>
        </SimpleCard>
        <SimpleCard>
          <SimpleCardContent>
            <div className="text-sm text-gray-500">عدد المخازن</div>
            <div className="text-2xl font-bold mt-1 text-gray-900">{warehouses.length}</div>
          </SimpleCardContent>
        </SimpleCard>
        <SimpleCard>
          <SimpleCardContent>
            <div className="text-sm text-gray-500">أنواع مختلفة</div>
            <div className="text-2xl font-bold mt-1 text-gray-900">{new Set(items.map(i => i.type).filter(Boolean)).size}</div>
          </SimpleCardContent>
        </SimpleCard>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl p-2 flex items-center gap-2">
        <SimpleButton
          variant={activeTab === 'items' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('items')}
        >
          العناصر
        </SimpleButton>
        <SimpleButton
          variant={activeTab === 'low' ? 'warning' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('low')}
        >
          تنبيهات النقص
        </SimpleButton>
        <SimpleButton
          variant={activeTab === 'levels' ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('levels')}
        >
          مستويات المخازن
        </SimpleButton>
      </div>

      {/* Content */}
      {loading ? (
        <SimpleCard>
          <SimpleCardContent>
            <div className="p-6 text-center text-gray-500">جاري التحميل...</div>
          </SimpleCardContent>
        </SimpleCard>
      ) : error ? (
        <SimpleCard>
          <SimpleCardContent>
            <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700">{error}</div>
          </SimpleCardContent>
        </SimpleCard>
      ) : activeTab === 'items' ? (
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle>العناصر</SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <DataTable columns={inventoryColumns} data={items || []}>
              {(table) => (
                <>
                  <DataTableToolbar table={table} />
                  <DataTablePagination table={table} />
                </>
              )}
            </DataTable>
          </SimpleCardContent>
        </SimpleCard>
      ) : activeTab === 'low' ? (
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle>عناصر منخفضة المخزون</SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="overflow-auto rounded-lg border border-amber-200">
              <table className="min-w-full text-sm">
                <thead className="bg-amber-50">
                  <tr className="text-right text-amber-900">
                    <th className="px-3 py-2">المخزن</th>
                    <th className="px-3 py-2">العنصر</th>
                    <th className="px-3 py-2">الكمية الحالية</th>
                    <th className="px-3 py-2">الحد الأدنى</th>
                    <th className="px-3 py-2">حالة</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((row) => (
                    <tr key={`${row.stockLevelId}`} className="border-t border-amber-200 hover:bg-amber-50/60">
                      <td className="px-3 py-2 text-gray-900">{row.warehouseName}</td>
                      <td className="px-3 py-2 text-gray-900"><span className="font-mono text-xs opacity-70">{row.sku}</span> — {row.name}</td>
                      <td className="px-3 py-2 text-gray-900">{row.quantity}</td>
                      <td className="px-3 py-2 text-gray-900">{row.minLevel ?? 0}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                          نقص
                        </span>
                      </td>
                    </tr>
                  ))}
                  {lowStock.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>لا توجد عناصر منخفضة المخزون</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      ) : (
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle>مستويات المخزون حسب المخازن</SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="overflow-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-right text-gray-700">
                    <th className="px-3 py-2">المخزن</th>
                    <th className="px-3 py-2">العنصر</th>
                    <th className="px-3 py-2">الكمية المتاحة</th>
                    <th className="px-3 py-2">الحد الأدنى</th>
                    <th className="px-3 py-2">الحد الأقصى</th>
                    <th className="px-3 py-2">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {stockLevels.map((level) => {
                    const isLow = level.quantity <= (level.minLevel || 0);
                    const isHigh = level.maxLevel && level.quantity >= level.maxLevel;
                    return (
                      <tr key={`${level.id}`} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-900">{level.warehouseName || 'غير محدد'}</td>
                        <td className="px-3 py-2 text-gray-900">
                          <span className="font-mono text-xs opacity-70">{level.sku}</span> — {level.itemName}
                        </td>
                        <td className="px-3 py-2 text-gray-900 font-medium">{level.quantity}</td>
                        <td className="px-3 py-2 text-gray-600">{level.minLevel || '-'}</td>
                        <td className="px-3 py-2 text-gray-600">{level.maxLevel || '-'}</td>
                        <td className="px-3 py-2">
                          {isLow ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              نقص
                            </span>
                          ) : isHigh ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              فائض
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              طبيعي
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {stockLevels.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>لا توجد بيانات مستويات المخزون</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      )}

      {/* Create Item Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold mb-4">إضافة عنصر جديد</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الرمز SKU</label>
                  <input 
                    type="text"
                    value={itemForm.sku}
                    onChange={(e) => setItemForm(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SKU-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                  <input 
                    type="text"
                    value={itemForm.type}
                    onChange={(e) => setItemForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="قطعة غيار"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                <input 
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="اسم العنصر"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سعر الشراء</label>
                  <input 
                    type="number"
                    value={itemForm.purchasePrice}
                    onChange={(e) => setItemForm(prev => ({ ...prev, purchasePrice: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سعر البيع</label>
                  <input 
                    type="number"
                    value={itemForm.sellingPrice}
                    onChange={(e) => setItemForm(prev => ({ ...prev, sellingPrice: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الرقم التسلسلي (اختياري)</label>
                <input 
                  type="text"
                  value={itemForm.serialNumber}
                  onChange={(e) => setItemForm(prev => ({ ...prev, serialNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="SN123456"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <SimpleButton 
                variant="outline" 
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                إلغاء
              </SimpleButton>
              <SimpleButton 
                onClick={handleCreateItem}
                disabled={saving || !itemForm.sku || !itemForm.name}
              >
                {saving ? 'جاري الإنشاء...' : 'إنشاء العنصر'}
              </SimpleButton>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold mb-4">تعديل العنصر</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الرمز SKU</label>
                  <input 
                    type="text"
                    value={itemForm.sku}
                    onChange={(e) => setItemForm(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SKU-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                  <input 
                    type="text"
                    value={itemForm.type}
                    onChange={(e) => setItemForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="قطعة غيار"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                <input 
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="اسم العنصر"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سعر الشراء</label>
                  <input 
                    type="number"
                    value={itemForm.purchasePrice}
                    onChange={(e) => setItemForm(prev => ({ ...prev, purchasePrice: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سعر البيع</label>
                  <input 
                    type="number"
                    value={itemForm.sellingPrice}
                    onChange={(e) => setItemForm(prev => ({ ...prev, sellingPrice: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الرقم التسلسلي (اختياري)</label>
                <input 
                  type="text"
                  value={itemForm.serialNumber}
                  onChange={(e) => setItemForm(prev => ({ ...prev, serialNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="SN123456"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <SimpleButton 
                variant="outline" 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                  resetForm();
                }}
              >
                إلغاء
              </SimpleButton>
              <SimpleButton 
                onClick={handleUpdateItem}
                disabled={saving || !itemForm.sku || !itemForm.name}
              >
                {saving ? 'جاري التحديث...' : 'تحديث العنصر'}
              </SimpleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
