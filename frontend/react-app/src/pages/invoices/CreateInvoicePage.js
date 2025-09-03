import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import invoicesService from '../../services/invoicesService';
import apiService from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { Plus } from 'lucide-react';

export default function CreateInvoicePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notifications = useNotifications();
  
  // Form state
  const [form, setForm] = useState({
    customerId: '',
    repairRequestId: searchParams.get('repairId') || '',
    totalAmount: 0,
    currency: 'EGP',
    taxAmount: 0,
    discountAmount: 0,
    notes: '',
    dueDate: '',
    status: 'draft'
  });

  // Data loading states
  const [customers, setCustomers] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Customer search
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Invoice items
  const [items, setItems] = useState([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    type: 'part',
    inventoryItemId: '',
    serviceId: '',
    quantity: 1,
    unitPrice: 0,
    description: ''
  });

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [customersData, repairsData, inventoryData, servicesData] = await Promise.all([
          apiService.getCustomers(),
          apiService.getRepairRequests(),
          apiService.getInventoryItems(),
          apiService.request('/services')
        ]);

        setCustomers(Array.isArray(customersData) ? customersData : customersData?.data || []);
        setRepairs(Array.isArray(repairsData) ? repairsData : repairsData?.data?.repairs || []);
        setInventoryItems(Array.isArray(inventoryData) ? inventoryData : inventoryData?.data || []);
        setServices(Array.isArray(servicesData) ? servicesData : servicesData?.data || []);
      } catch (error) {
        console.error('Error loading initial data:', error);
        notifications.error('فشل في تحميل البيانات الأولية');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [notifications]);

  // Pre-select repair if provided in URL
  useEffect(() => {
    if (searchParams.get('repairId')) {
      setForm(prev => ({ ...prev, repairRequestId: searchParams.get('repairId') }));
    }
  }, [searchParams]);

  // Update customer when repair is selected
  useEffect(() => {
    if (form.repairRequestId) {
      const selectedRepair = repairs.find(r => r.id === parseInt(form.repairRequestId));
      if (selectedRepair && selectedRepair.customerId) {
        setForm(prev => ({ ...prev, customerId: selectedRepair.customerId }));
      }
    }
  }, [form.repairRequestId, repairs]);



  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const total = subtotal + form.taxAmount - form.discountAmount;

  // Add item to invoice
  function addItem() {
    if (!newItem.inventoryItemId && !newItem.serviceId) {
      notifications.error('يجب اختيار قطعة غيار أو خدمة');
      return;
    }

    const item = {
      id: Date.now(), // Temporary ID for frontend
      type: newItem.type,
      inventoryItemId: newItem.type === 'part' ? newItem.inventoryItemId : null,
      serviceId: newItem.type === 'service' ? newItem.serviceId : null,
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      description: newItem.description,
      itemName: newItem.type === 'part' 
        ? inventoryItems.find(i => i.id === parseInt(newItem.inventoryItemId))?.name 
        : services.find(s => s.id === parseInt(newItem.serviceId))?.name
    };

    setItems(prev => [...prev, item]);
    setNewItem({
      type: 'part',
      inventoryItemId: '',
      serviceId: '',
      quantity: 1,
      unitPrice: 0,
      description: ''
    });
    setShowAddItem(false);
  }

  // Remove item
  function removeItem(index) {
    setItems(prev => prev.filter((_, i) => i !== index));
  }

  // Create invoice
  async function createInvoice() {
    try {
      if (!form.customerId && !form.repairRequestId) {
        notifications.error('يجب اختيار عميل أو طلب إصلاح');
        return;
      }

      setCreating(true);

      // Create invoice
      const invoiceData = {
        ...form,
        totalAmount: total,
        customerId: form.customerId || null,
        repairRequestId: form.repairRequestId || null
      };

      const response = await invoicesService.createInvoice(invoiceData);
      const invoiceId = response?.data?.id || response?.id;

      if (!invoiceId) {
        throw new Error('لم يتم إرجاع معرف الفاتورة');
      }

      // Add items to invoice
      for (const item of items) {
        const itemPayload = {
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          description: item.description
        };

        if (item.type === 'part') {
          itemPayload.inventoryItemId = item.inventoryItemId;
        } else {
          itemPayload.serviceId = item.serviceId;
        }

        await invoicesService.addItem(invoiceId, itemPayload);
      }

      notifications.success('تم إنشاء الفاتورة بنجاح');
      navigate(`/invoices/${invoiceId}`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      notifications.error('فشل في إنشاء الفاتورة: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setCreating(false);
    }
  }

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone?.includes(customerSearch) ||
    customer.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-center py-8">
            <div className="text-gray-500">جاري التحميل...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Breadcrumb items={[
              { label: 'الرئيسية', href: '/' },
              { label: 'الفواتير', href: '/invoices' },
              { label: 'إنشاء فاتورة جديدة', href: '/invoices/create' },
            ]} />
            <h1 className="text-2xl font-bold text-gray-900">إنشاء فاتورة جديدة</h1>
            <p className="text-sm text-gray-500">إنشاء فاتورة جديدة مع إضافة العناصر والخدمات</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle>تفاصيل الفاتورة</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">العميل *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ابحث عن عميل..."
                    />
                    {showCustomerDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map(customer => (
                            <button
                              key={customer.id}
                              type="button"
                              className="w-full text-right px-3 py-2 hover:bg-gray-50 border-b border-gray-100"
                              onClick={() => {
                                setForm(prev => ({ ...prev, customerId: customer.id }));
                                setCustomerSearch(customer.name);
                                setShowCustomerDropdown(false);
                              }}
                            >
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-gray-500">{customer.phone || customer.email}</div>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-gray-500">لا توجد نتائج</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">طلب الإصلاح (اختياري)</label>
                  <select
                    value={form.repairRequestId}
                    onChange={(e) => setForm(prev => ({ ...prev, repairRequestId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">بدون طلب إصلاح</option>
                    {repairs.map(repair => (
                      <option key={repair.id} value={repair.id}>
                        #{repair.id} - {repair.deviceType || 'جهاز'} ({repair.customerName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">حالة الفاتورة</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">مسودة</option>
                    <option value="sent">مرسلة</option>
                    <option value="paid">مدفوعة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="ملاحظات إضافية..."
                />
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Invoice Items */}
          <SimpleCard>
            <SimpleCardHeader>
              <div className="flex items-center justify-between">
                <SimpleCardTitle>عناصر الفاتورة</SimpleCardTitle>
                <SimpleButton onClick={() => setShowAddItem(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة عنصر
                </SimpleButton>
              </div>
            </SimpleCardHeader>
            <SimpleCardContent>
              {items.length > 0 ? (
                <div className="overflow-auto rounded-lg border border-gray-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-right text-gray-600">
                        <th className="px-3 py-2">العنصر</th>
                        <th className="px-3 py-2">الوصف</th>
                        <th className="px-3 py-2">الكمية</th>
                        <th className="px-3 py-2">سعر الوحدة</th>
                        <th className="px-3 py-2">الإجمالي</th>
                        <th className="px-3 py-2">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={item.id} className="border-t border-gray-200">
                          <td className="px-3 py-2 text-gray-900">{item.itemName}</td>
                          <td className="px-3 py-2 text-gray-700">{item.description || '—'}</td>
                          <td className="px-3 py-2 text-gray-900">{item.quantity}</td>
                          <td className="px-3 py-2 text-gray-900">{item.unitPrice.toFixed(2)}</td>
                          <td className="px-3 py-2 text-gray-900">{(item.quantity * item.unitPrice).toFixed(2)}</td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  لم يتم إضافة أي عناصر بعد
                </div>
              )}
            </SimpleCardContent>
          </SimpleCard>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle>ملخص الفاتورة</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>الإجمالي الفرعي:</span>
                  <span>{subtotal.toFixed(2)} ج.م</span>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">الضريبة</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.taxAmount}
                    onChange={(e) => setForm(prev => ({ ...prev, taxAmount: Number(e.target.value) }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">الخصم</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.discountAmount}
                    onChange={(e) => setForm(prev => ({ ...prev, discountAmount: Number(e.target.value) }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold">
                    <span>الإجمالي:</span>
                    <span>{total.toFixed(2)} ج.م</span>
                  </div>
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Actions */}
          <SimpleCard>
            <SimpleCardContent>
              <div className="space-y-3">
                <SimpleButton
                  onClick={createInvoice}
                  disabled={creating || (!form.customerId && !form.repairRequestId)}
                  className="w-full"
                >
                  {creating ? 'جاري الإنشاء...' : 'إنشاء الفاتورة'}
                </SimpleButton>
                <SimpleButton
                  variant="outline"
                  onClick={() => navigate('/invoices')}
                  className="w-full"
                >
                  إلغاء
                </SimpleButton>
              </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">إضافة عنصر جديد</h3>
            
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
                    {inventoryItems.map(item => (
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
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name} ({service.basePrice} ج.م)
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
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
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">وصف إضافي</label>
                <textarea 
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <SimpleButton 
                variant="outline" 
                onClick={() => setShowAddItem(false)}
              >
                إلغاء
              </SimpleButton>
              <SimpleButton 
                onClick={addItem}
                disabled={!newItem.inventoryItemId && !newItem.serviceId}
              >
                إضافة العنصر
              </SimpleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
