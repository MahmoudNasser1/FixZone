import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import invoicesService from '../../services/invoicesService';
import apiService from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

export default function InvoiceDetailsPage() {
  const { id } = useParams();
  const invoiceId = id;
  const notifications = useNotifications();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);

  const [autoSynced, setAutoSynced] = useState(false);
  
  // Item editing states
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItem, setEditingItem] = useState({});
  const [updatingItem, setUpdatingItem] = useState(false);
  
  // Add item states
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    type: 'part', // 'part' or 'service'
    inventoryItemId: '',
    serviceId: '',
    quantity: 1,
    unitPrice: 0,
    description: ''
  });
  const [inventoryItems, setInventoryItems] = useState([]);
  const [services, setServices] = useState([]);
  const [addingItem, setAddingItem] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await invoicesService.getInvoice(invoiceId);
        if (!mounted) return;
        // res expected: { success, data: { ...invoice, items: [] } }
        if (res?.success) {
          setInvoice(res.data || null);
          setItems(Array.isArray(res.data?.items) ? res.data.items : []);
        } else {
          // fallback to legacy
          const legacyItems = Array.isArray(res?.items) ? res.items : [];
          setInvoice(res?.data || null);
          setItems(legacyItems);
        }
      } catch (e) {
        console.error(e);
        setError(e?.message || 'تعذر تحميل عناصر الفاتورة');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (invoiceId) load();
    return () => { mounted = false; };
  }, [invoiceId]);

  // Auto-sync stored totalAmount with calculated subtotal on first load if they differ
  useEffect(() => {
    if (loading) return;
    if (autoSynced) return;
    if (!invoice) return;
    // Only auto-sync when there are items to base calculation on
    const subtotal = (items || []).reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unitPrice || 0), 0);
    if (items.length === 0) return;
    const stored = Number(invoice.totalAmount || 0);
    // Avoid tiny float diffs
    const diff = Math.abs(stored - subtotal);
    if (diff > 0.005) {
      (async () => {
        try {
          const res = await invoicesService.updateInvoice(invoiceId, { totalAmount: Number(subtotal.toFixed(2)) });
          if (res?.success && res?.data) {
            setInvoice(res.data);
          } else {
            setInvoice((prev) => ({ ...(prev || {}), totalAmount: Number(subtotal.toFixed(2)) }));
          }
        } catch (e) {
          console.error(e);
          // لا نعرض خطأ للمستخدم كي لا نزعجه على التحميل الأول
        } finally {
          setAutoSynced(true);
        }
      })();
    } else {
      setAutoSynced(true);
    }
  }, [loading, items, invoice, invoiceId, autoSynced]);

  const totals = useMemo(() => {
    const subtotal = (items || []).reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unitPrice || 0), 0);
    // Prefer stored totalAmount if present; otherwise use calculated subtotal
    const storedTotal = Number(invoice?.totalAmount ?? NaN);
    const finalTotal = Number.isFinite(storedTotal) && storedTotal > 0 ? storedTotal : subtotal;
    return { subtotal, total: finalTotal };
  }, [items, invoice]);



  // Load inventory items and services when add modal opens
  useEffect(() => {
    async function loadData() {
      try {
        const [inventoryData, servicesData] = await Promise.all([
          apiService.getInventoryItems(),
          apiService.getServices()
        ]);
        
        const inventoryArray = Array.isArray(inventoryData) ? inventoryData : inventoryData?.data || [];
        const servicesArray = Array.isArray(servicesData) ? servicesData : servicesData?.data || [];
        
        console.log('Setting inventory items:', inventoryArray);
        console.log('Setting services:', servicesArray);
        
        setInventoryItems(inventoryArray);
        setServices(servicesArray);
      } catch (error) {
        console.error('Error loading inventory and services:', error);
        notifications.error('فشل في تحميل المخزون والخدمات');
      }
    }
    
    if (showAddItem) {
      loadData();
    }
  }, [showAddItem, notifications]);



  // Start editing an item
  function startEditItem(item) {
    setEditingItemId(item.id);
    setEditingItem({
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 0,
      description: item.description || ''
    });
  }

  // Cancel editing
  function cancelEditItem() {
    setEditingItemId(null);
    setEditingItem({});
  }

  // Save edited item
  async function saveEditedItem() {
    try {
      setUpdatingItem(true);
      await invoicesService.updateInvoiceItem(invoiceId, editingItemId, editingItem);
      
      // Reload invoice data
      await loadInvoiceData();
      
      setEditingItemId(null);
      setEditingItem({});
      notifications.success('تم تحديث العنصر بنجاح');
    } catch (error) {
      console.error('Error updating item:', error);
      notifications.error('فشل في تحديث العنصر');
    } finally {
      setUpdatingItem(false);
    }
  }

  // Delete item
  async function deleteItem(itemId) {
    if (!window.confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
      return;
    }

    try {
      await invoicesService.removeItem(invoiceId, itemId);
      await loadInvoiceData();
      notifications.success('تم حذف العنصر بنجاح');
    } catch (error) {
      console.error('Error deleting item:', error);
      notifications.error('فشل في حذف العنصر');
    }
  }

  // Add new item
  async function addNewItem() {
    try {
      setAddingItem(true);
      
      const payload = {
        quantity: newItem.quantity,
        unitPrice: newItem.unitPrice,
        description: newItem.description
      };

      if (newItem.type === 'part') {
        payload.inventoryItemId = newItem.inventoryItemId;
      } else {
        payload.serviceId = newItem.serviceId;
      }

      console.log('Adding item with payload:', payload);
      const result = await invoicesService.addItem(invoiceId, payload);
      console.log('Add item result:', result);
      await loadInvoiceData();
      
      setShowAddItem(false);
      setNewItem({
        type: 'part',
        inventoryItemId: '',
        serviceId: '',
        quantity: 1,
        unitPrice: 0,
        description: ''
      });
      
      notifications.success('تم إضافة العنصر بنجاح');
    } catch (error) {
      console.error('Error adding item:', error);
      notifications.error('فشل في إضافة العنصر');
    } finally {
      setAddingItem(false);
    }
  }

  // Extract loading function for reuse
  async function loadInvoiceData() {
    try {
      const res = await invoicesService.getInvoice(invoiceId);
      console.log('loadInvoiceData response:', res);
      if (res?.success) {
        setInvoice(res.data || null);
        const newItems = Array.isArray(res.data?.items) ? res.data.items : [];
        console.log('Setting items:', newItems);
        setItems(newItems);
      } else {
        const legacyItems = Array.isArray(res?.items) ? res.items : [];
        setInvoice(res?.data || null);
        console.log('Setting legacy items:', legacyItems);
        setItems(legacyItems);
      }
    } catch (e) {
      console.error(e);
      setError(e?.message || 'تعذر تحميل عناصر الفاتورة');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Breadcrumb items={[
              { label: 'الرئيسية', href: '/' },
              { label: 'الفواتير', href: '/invoices' },
              { label: `فاتورة #${invoiceId}`, href: `/invoices/${invoiceId}` },
            ]} />
            <h1 className="text-3xl font-bold">فاتورة #{invoiceId}</h1>
            <p className="text-blue-100">عرض عناصر الفاتورة وإجمالي المبلغ</p>
          </div>
          <div className="flex items-center gap-3">
            <SimpleButton 
              onClick={() => setShowAddItem(true)}
              className="bg-white text-blue-600 hover:bg-blue-50 border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold px-6 py-3"
            >
              <Plus className="w-5 h-5 ml-2" />
              إضافة عنصر
            </SimpleButton>
            <Link to={`/invoices/${invoiceId}/edit`}>
              <SimpleButton 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-blue-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold px-6 py-3"
              >
                <Edit className="w-5 h-5 ml-2" />
                تعديل الفاتورة
              </SimpleButton>
            </Link>
            <Link to="/invoices">
              <SimpleButton 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-blue-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold px-6 py-3"
              >
                رجوع إلى الفواتير
              </SimpleButton>
            </Link>
          </div>
        </div>
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <SimpleCard className="shadow-lg border-0">
              <SimpleCardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b-2 border-blue-200">
                <SimpleCardTitle className="text-xl text-gray-800 flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  عناصر الفاتورة
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent className="p-0">
                <div className="overflow-auto rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                      <tr className="text-right">
                        <th className="px-4 py-3 font-semibold">العنصر</th>
                        <th className="px-4 py-3 font-semibold">الوصف</th>
                        <th className="px-4 py-3 font-semibold">الكمية</th>
                        <th className="px-4 py-3 font-semibold">سعر الوحدة</th>
                        <th className="px-4 py-3 font-semibold">الإجمالي</th>
                        <th className="px-4 py-3 font-semibold">المصدر</th>
                        <th className="px-4 py-3 font-semibold">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                <Plus className="w-6 h-6 text-gray-400" />
                              </div>
                              <p className="text-sm">لا توجد عناصر في هذه الفاتورة</p>
                              <SimpleButton 
                                onClick={() => setShowAddItem(true)}
                                variant="outline"
                                size="sm"
                              >
                                إضافة عنصر أول
                              </SimpleButton>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        items.map((it, index) => (
                          <tr key={it.id} className={`border-t border-gray-100 hover:bg-blue-50 transition-colors duration-200 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}>
                            <td className="px-4 py-3 text-gray-900 font-medium">{it.itemName || '—'}</td>
                            <td className="px-4 py-3 text-gray-700">
                              {editingItemId === it.id ? (
                                <input
                                  type="text"
                                  value={editingItem.description}
                                  onChange={(e) => setEditingItem(prev => ({ ...prev, description: e.target.value }))}
                                  className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                              ) : (
                                it.description || it.itemDescription || '—'
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-900">
                              {editingItemId === it.id ? (
                                <input
                                  type="number"
                                  min="1"
                                  value={editingItem.quantity}
                                  onChange={(e) => setEditingItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                                  className="w-20 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                              ) : (
                                Number(it.quantity ?? 0)
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-900">
                              {editingItemId === it.id ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editingItem.unitPrice}
                                  onChange={(e) => setEditingItem(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                                  className="w-24 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                              ) : (
                                Number(it.unitPrice ?? 0).toFixed(2)
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-900 font-semibold">
                              {editingItemId === it.id ? (
                                (editingItem.quantity * editingItem.unitPrice).toFixed(2)
                              ) : (
                                (Number(it.quantity || 0) * Number(it.unitPrice || 0)).toFixed(2)
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {it.itemType === 'part' ? (
                                <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">قطعة غيار</span>
                              ) : it.itemType === 'service' ? (
                                <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700 font-medium">خدمة صيانة</span>
                              ) : (
                                <span className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700 font-medium">عنصر آخر</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {editingItemId === it.id ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={saveEditedItem}
                                    disabled={updatingItem}
                                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-full transition-colors duration-200 disabled:opacity-50"
                                    title="حفظ"
                                  >
                                    <Save className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={cancelEditItem}
                                    disabled={updatingItem}
                                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors duration-200 disabled:opacity-50"
                                    title="إلغاء"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                                                  <button
                                  onClick={() => startEditItem(it)}
                                  className="p-2.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-all duration-200 hover:scale-110 transform hover:shadow-md border border-transparent hover:border-blue-200"
                                  title="تعديل"
                                >
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => deleteItem(it.id)}
                                  className="p-2.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-all duration-200 hover:scale-110 transform hover:shadow-md border border-transparent hover:border-red-200"
                                  title="حذف"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          </div>

          <div className="lg:col-span-1">
            <SimpleCard className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
              <SimpleCardHeader className="border-b-2 border-blue-200">
                <SimpleCardTitle className="text-lg text-blue-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  ملخص الفاتورة
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-blue-100">
                    <span className="text-gray-600 font-medium">الإجمالي الفرعي</span>
                    <span className="text-gray-900 font-semibold text-lg">{totals.subtotal.toFixed(2)} ج.م</span>
                  </div>
                  {Number(invoice?.discountAmount || 0) > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-blue-100">
                      <span className="text-gray-600 font-medium">الخصم</span>
                      <span className="text-red-600 font-semibold">-{Number(invoice?.discountAmount || 0).toFixed(2)} ج.م</span>
                    </div>
                  )}
                  {Number(invoice?.taxAmount || 0) > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-blue-100">
                      <span className="text-gray-600 font-medium">الضريبة</span>
                      <span className="text-gray-900 font-semibold">{Number(invoice?.taxAmount || 0).toFixed(2)} ج.م</span>
                    </div>
                  )}
                  <div className="pt-3 bg-blue-100 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-800 font-bold text-lg">الإجمالي النهائي</span>
                      <span className="text-blue-600 font-bold text-2xl">{totals.total.toFixed(2)} ج.م</span>
                    </div>
                  </div>
                  {Number(invoice?.amountPaid || 0) > 0 && (
                    <div className="flex justify-between items-center py-2 bg-green-50 rounded-lg p-3 border border-green-200">
                      <span className="text-green-700 font-medium">المدفوع</span>
                      <span className="text-green-800 font-bold text-lg">{Number(invoice?.amountPaid || 0).toFixed(2)} ج.م</span>
                    </div>
                  )}
                </div>
              </SimpleCardContent>
            </SimpleCard>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                إضافة عنصر جديد
              </h3>
              <button
                onClick={() => setShowAddItem(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع العنصر</label>
                <select 
                  value={newItem.type}
                  onChange={(e) => setNewItem(prev => ({ 
                    ...prev, 
                    type: e.target.value,
                    inventoryItemId: '',
                    serviceId: '',
                    unitPrice: 0
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="part">قطعة غيار</option>
                  <option value="service">خدمة صيانة</option>
                </select>
              </div>
              
              {newItem.type === 'part' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">قطعة الغيار</label>
                  <select 
                    value={newItem.inventoryItemId}
                    onChange={(e) => {
                      const selectedItem = inventoryItems.find(item => item.id === parseInt(e.target.value));
                      setNewItem(prev => ({ 
                        ...prev, 
                        inventoryItemId: e.target.value,
                        unitPrice: selectedItem?.sellingPrice || 0
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">اختر قطعة الغيار</option>
                    {Array.isArray(inventoryItems) && inventoryItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} - {item.sku} ({item.sellingPrice} ج.م)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الخدمة</label>
                  <select 
                    value={newItem.serviceId}
                    onChange={(e) => {
                      const selectedService = services.find(service => service.id === parseInt(e.target.value));
                      setNewItem(prev => ({ 
                        ...prev, 
                        serviceId: e.target.value,
                        unitPrice: selectedService?.basePrice || 0
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">اختر الخدمة</option>
                    {Array.isArray(services) && services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name} ({service.basePrice} ج.م)
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
                <input 
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">سعر الوحدة</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={newItem.unitPrice}
                  onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">وصف إضافي (اختياري)</label>
                <textarea 
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex justify-between text-sm">
                  <span>الإجمالي:</span>
                  <span className="font-semibold">{(newItem.quantity * newItem.unitPrice).toFixed(2)} ج.م</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200">
              <SimpleButton 
                variant="outline" 
                onClick={() => {
                  setShowAddItem(false);
                  setNewItem({
                    type: 'part',
                    inventoryItemId: '',
                    serviceId: '',
                    quantity: 1,
                    unitPrice: 0,
                    description: ''
                  });
                }}
                className="px-6 py-3 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                إلغاء
              </SimpleButton>
              <SimpleButton 
                onClick={addNewItem}
                disabled={addingItem || (!newItem.inventoryItemId && !newItem.serviceId)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingItem ? 'جاري الإضافة...' : 'إضافة العنصر'}
              </SimpleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
