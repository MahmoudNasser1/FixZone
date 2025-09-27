import React, { useEffect, useState } from 'react';
import inventoryService from '../../services/inventoryService';
import apiService from '../../services/api';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import { DataTable } from '../../components/ui/DataTable';
import { DataTableToolbar } from '../../components/ui/DataTableToolbar';
import { DataTablePagination } from '../../components/ui/DataTablePagination';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { Plus, Edit, Trash2, Download, Upload, FileSpreadsheet } from 'lucide-react';


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

  const [activeTab, setActiveTab] = useState('items'); // items | low | levels | warehouse-items
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Import/Export states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  
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
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(Array.isArray(itemsData) ? itemsData : (itemsData?.data?.items || itemsData?.items || []));
      }
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
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(Array.isArray(itemsData) ? itemsData : (itemsData?.data?.items || itemsData?.items || []));
      }
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
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(Array.isArray(itemsRes) ? itemsData : (itemsData?.data?.items || itemsData?.items || []));
      }
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
        
        // Parse responses correctly
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          setItems(Array.isArray(itemsData) ? itemsData : (itemsData?.data?.items || itemsData?.items || []));
        }
        
        if (lowRes.ok) {
          const lowData = await lowRes.json();
          setLowStock(Array.isArray(lowData) ? lowData : []);
        }
        
        if (whRes.ok) {
          const whData = await whRes.json();
          setWarehouses(whData || []);
        }
        
        if (levelsRes.ok) {
          const levelsData = await levelsRes.json();
          setStockLevels(Array.isArray(levelsData) ? levelsData : []);
        }
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

  // Export functions
  const exportToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = ['SKU', 'Name', 'Type', 'Purchase Price', 'Selling Price', 'Serial Number'];
    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        item.sku || '',
        item.name || '',
        item.type || '',
        item.purchasePrice || 0,
        item.sellingPrice || 0,
        item.serialNumber || ''
      ].join(','))
    ].join('\n');
    
    return csvContent;
  };

  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const csvContent = exportToCSV(items);
      downloadFile(csvContent, `inventory_export_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv;charset=utf-8;');
      notifications.success('تم تصدير البيانات بنجاح');
    } catch (error) {
      console.error('Export error:', error);
      notifications.error('فشل في تصدير البيانات');
    } finally {
      setExporting(false);
    }
  };

  const handleExportTemplate = () => {
    const template = 'SKU,Name,Type,Purchase Price,Selling Price,Serial Number\nPART-001,شاشة LCD للهاتف,شاشة,150.00,250.00,SN001\nPART-002,بطارية ليثيوم,بطارية,80.00,120.00,SN002';
    downloadFile(template, 'inventory_template.csv', 'text/csv;charset=utf-8;');
    notifications.success('تم تحميل قالب الاستيراد');
  };

  const handleImport = async (file) => {
    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiService.request('/inventory/import', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        notifications.success('تم استيراد البيانات بنجاح');
        await load(); // Reload data
        setShowImportModal(false);
      } else {
        throw new Error('فشل في استيراد البيانات');
      }
    } catch (error) {
      console.error('Import error:', error);
      notifications.error('فشل في استيراد البيانات');
    } finally {
      setImporting(false);
    }
  };

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
            <SimpleButton 
              variant="outline" 
              onClick={handleExportTemplate}
              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
            >
              <FileSpreadsheet className="w-4 h-4 ml-2" />
              قالب الاستيراد
            </SimpleButton>
            <SimpleButton 
              variant="outline" 
              onClick={() => setShowImportModal(true)}
              className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
            >
              <Upload className="w-4 h-4 ml-2" />
              استيراد
            </SimpleButton>
            <SimpleButton 
              variant="outline" 
              onClick={handleExport}
              disabled={exporting}
              className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
            >
              <Download className="w-4 h-4 ml-2" />
              {exporting ? 'جاري التصدير...' : 'تصدير'}
            </SimpleButton>
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
        <SimpleButton
          variant={activeTab === 'warehouse-items' ? 'info' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('warehouse-items')}
        >
          المنتجات بالمخازن
        </SimpleButton>
        <SimpleButton
          variant={activeTab === 'warehouses' ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('warehouses')}
        >
          المخازن
        </SimpleButton>
      </div>

      {/* Content */}
      {(() => {
        if (loading) {
          return (
        <SimpleCard>
          <SimpleCardContent>
            <div className="p-6 text-center text-gray-500">جاري التحميل...</div>
          </SimpleCardContent>
        </SimpleCard>
          );
        }
        
        if (error) {
          return (
        <SimpleCard>
          <SimpleCardContent>
            <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700">{error}</div>
          </SimpleCardContent>
        </SimpleCard>
          );
        }
        
        if (activeTab === 'items') {
          return (
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
          );
        }
        
        if (activeTab === 'low') {
          return (
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
          );
        }
        
        if (activeTab === 'levels') {
          return (
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
          );
        }
        
        if (activeTab === 'warehouse-items') {
          return (
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>المنتجات في كل مخزن</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-6">
                  {warehouses.map((warehouse) => {
                    const warehouseItems = stockLevels.filter(level => level.warehouseId === warehouse.id);
                    return (
                      <div key={warehouse.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900">{warehouse.name}</h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            warehouse.isActive !== false 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {warehouse.isActive !== false ? 'نشط' : 'معطل'}
                          </span>
                        </div>
                        
                        {warehouseItems.length > 0 ? (
                          <div className="overflow-auto rounded-lg border border-gray-200">
                            <table className="min-w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr className="text-right text-gray-700">
                                  <th className="px-3 py-2">العنصر</th>
                                  <th className="px-3 py-2">الكمية المتاحة</th>
                                  <th className="px-3 py-2">الحد الأدنى</th>
                                  <th className="px-3 py-2">الحد الأقصى</th>
                                  <th className="px-3 py-2">الحالة</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {warehouseItems.map((level) => {
                                  const item = items.find(i => i.id === level.inventoryItemId);
                                  return (
                                    <tr key={level.id} className="hover:bg-gray-50">
                                      <td className="px-3 py-2">
                                        <div>
                                          <div className="font-medium text-gray-900">{item?.name || 'غير محدد'}</div>
                                          <div className="text-xs text-gray-500">{item?.sku || ''}</div>
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 font-medium">{level.quantity || 0}</td>
                                      <td className="px-3 py-2">{level.minLevel || 0}</td>
                                      <td className="px-3 py-2">{level.maxLevel || '-'}</td>
                                      <td className="px-3 py-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          level.isLowStock 
                                            ? 'bg-red-100 text-red-800' 
                                            : 'bg-green-100 text-green-800'
                                        }`}>
                                          {level.isLowStock ? 'منخفض' : 'طبيعي'}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-lg mb-2">لا توجد منتجات في هذا المخزن</div>
                            <div className="text-sm">يمكنك إضافة منتجات من تبويب "مستويات المخازن"</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </SimpleCardContent>
            </SimpleCard>
          );
        }
        
        if (activeTab === 'warehouses') {
          return (
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>المخازن</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {warehouses.map((warehouse) => (
                    <div key={warehouse.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{warehouse.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          warehouse.isActive !== false 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {warehouse.isActive !== false ? 'نشط' : 'معطل'}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>الموقع:</strong> {warehouse.location || 'غير محدد'}</p>
                        {warehouse.address && <p><strong>العنوان:</strong> {warehouse.address}</p>}
                        {warehouse.phone && <p><strong>الهاتف:</strong> {warehouse.phone}</p>}
                        {warehouse.email && <p><strong>البريد:</strong> {warehouse.email}</p>}
                        {warehouse.manager && <p><strong>المدير:</strong> {warehouse.manager}</p>}
                        {warehouse.capacity && <p><strong>السعة:</strong> {warehouse.capacity}</p>}
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">العناصر:</span>
                          <span className="font-medium text-gray-900">
                            {stockLevels.filter(level => level.warehouseId === warehouse.id).length}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {warehouses.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      لا توجد مخازن مضافة
                    </div>
                  )}
                </div>
              </SimpleCardContent>
            </SimpleCard>
          );
        }
        
        return null;
      })()}

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

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">استيراد البيانات</h3>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">تعليمات الاستيراد:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• استخدم ملف CSV بصيغة UTF-8</li>
                  <li>• تأكد من مطابقة أسماء الأعمدة</li>
                  <li>• يمكنك تحميل قالب الاستيراد أولاً</li>
                </ul>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اختر ملف CSV</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleImport(file);
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <SimpleButton
                variant="outline"
                onClick={() => setShowImportModal(false)}
                disabled={importing}
              >
                إلغاء
              </SimpleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
