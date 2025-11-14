import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiService from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import { 
  ArrowRight, FileText, Plus, Trash2, Save, X,
  DollarSign, Calculator, User, Building2, Search
} from 'lucide-react';

const CreateInvoicePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { settings, formatMoney } = useSettings();
  const repairRequestId = searchParams.get('repairRequestId');

  const [formData, setFormData] = useState({
    repairRequestId: repairRequestId || '',
    customerId: '',
    vendorId: '',
    invoiceType: 'sale',
    totalAmount: 0,
    taxAmount: 0,
    currency: settings.currency.code || 'EGP',
    notes: ''
  });

  const [invoiceItems, setInvoiceItems] = useState([]);
  const [repairRequest, setRepairRequest] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const [services, setServices] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServices();
    fetchInventoryItems();
    fetchCustomers();
    fetchVendors();
    if (repairRequestId) {
      fetchRepairRequest();
    }
  }, [repairRequestId]);

  useEffect(() => {
    if (customerSearch) {
      fetchCustomers(customerSearch);
    } else {
      fetchCustomers();
    }
  }, [customerSearch]);

  useEffect(() => {
    if (vendorSearch) {
      fetchVendors(vendorSearch);
    } else {
      fetchVendors();
    }
  }, [vendorSearch]);

  const fetchServices = async () => {
    try {
      const response = await apiService.getServices();
      if (response.ok) {
        const data = await response.json();
        setServices(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await apiService.getInventoryItems();
      if (response.ok) {
        const data = await response.json();
        setInventoryItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching inventory items:', err);
    }
  };

  const fetchCustomers = async (search = '') => {
    try {
      const response = await apiService.getCustomers({ search, limit: 50 });
      if (response && Array.isArray(response)) {
        setCustomers(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setCustomers(response.data);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setCustomers([]);
    }
  };

  const fetchVendors = async (search = '') => {
    try {
      const params = search ? { search, limit: 50 } : { limit: 50 };
      const response = await apiService.get('/vendors', params);
      if (response && Array.isArray(response)) {
        setVendors(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setVendors(response.data);
      } else if (response && response.data && response.data.vendors && Array.isArray(response.data.vendors)) {
        setVendors(response.data.vendors);
      } else {
        setVendors([]);
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setVendors([]);
    }
  };

  const fetchRepairRequest = async () => {
    if (!repairRequestId) return;
    
    try {
      const response = await apiService.getRepairRequest(repairRequestId);
      if (response.ok) {
        const data = await response.json();
        setRepairRequest(data);
        // Auto-populate some fields from repair request
        setFormData(prev => ({
          ...prev,
          totalAmount: data.estimatedCost || 0
        }));
      }
    } catch (err) {
      console.error('Error fetching repair request:', err);
    }
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find(c => c.id === parseInt(customerId));
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customerId: customerId || '',
      repairRequestId: '' // إلغاء اختيار طلب الإصلاح عند اختيار عميل
    }));
    setRepairRequest(null);
  };

  const handleInvoiceTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      invoiceType: type,
      repairRequestId: type === 'purchase' ? '' : prev.repairRequestId,
      customerId: type === 'purchase' ? '' : prev.customerId,
      vendorId: type === 'sale' ? '' : prev.vendorId
    }));
    if (type === 'purchase') {
      setSelectedCustomer(null);
      setRepairRequest(null);
    } else {
      setSelectedVendor(null);
    }
  };

  const handleVendorSelect = (vendorId) => {
    const vendor = vendors.find(v => v.id === parseInt(vendorId));
    setSelectedVendor(vendor);
    setFormData(prev => ({
      ...prev,
      vendorId: vendorId || '',
      repairRequestId: '', // إلغاء اختيار طلب الإصلاح عند اختيار مورد
      customerId: '' // إلغاء اختيار العميل عند اختيار مورد
    }));
    setRepairRequest(null);
    setSelectedCustomer(null);
  };

  const handleRepairRequestChange = (value) => {
    setFormData(prev => ({
      ...prev,
      repairRequestId: value || '',
      customerId: '', // إلغاء اختيار العميل عند اختيار طلب إصلاح
      vendorId: '' // إلغاء اختيار المورد عند اختيار طلب إصلاح
    }));
    setSelectedCustomer(null);
    setSelectedVendor(null);
    if (value) {
      fetchRepairRequest();
    } else {
      setRepairRequest(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addInvoiceItem = () => {
    const newItem = {
      id: Date.now(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      itemType: 'service',
      serviceId: null,
      inventoryItemId: null
    };
    setInvoiceItems(prev => [...prev, newItem]);
  };

  const updateInvoiceItem = (index, field, value) => {
    setInvoiceItems(prev => {
      const updated = [...prev];
      const currentItem = updated[index];
      
      // إذا تم تغيير itemType، إعادة ضبط الحقول
      if (field === 'itemType') {
        updated[index] = {
          ...currentItem,
          itemType: value,
          serviceId: value === 'service' ? currentItem.serviceId : null,
          inventoryItemId: value === 'part' ? currentItem.inventoryItemId : null,
          description: '',
          unitPrice: 0
        };
      }
      // إذا تم اختيار inventoryItemId، جلب بيانات الصنف
      else if (field === 'inventoryItemId' && value) {
        const selectedItem = inventoryItems.find(item => item.id === parseInt(value));
        if (selectedItem) {
          updated[index] = {
            ...currentItem,
            inventoryItemId: parseInt(value),
            description: selectedItem.name || '',
            unitPrice: selectedItem.sellingPrice || 0,
            itemType: 'part'
          };
        } else {
          updated[index] = {
            ...currentItem,
            [field]: value
          };
        }
      }
      // إذا تم اختيار serviceId، جلب بيانات الخدمة
      else if (field === 'serviceId' && value) {
        const selectedService = services.find(svc => svc.id === parseInt(value));
        if (selectedService) {
          updated[index] = {
            ...currentItem,
            serviceId: parseInt(value),
            description: selectedService.name || '',
            unitPrice: selectedService.basePrice || 0,
            itemType: 'service'
          };
        } else {
          updated[index] = {
            ...currentItem,
            [field]: value
          };
        }
      }
      else {
        updated[index] = {
          ...currentItem,
          [field]: value
        };
      }

      // Calculate total price
      if (field === 'quantity' || field === 'unitPrice' || field === 'inventoryItemId' || field === 'serviceId') {
        const quantity = parseFloat(updated[index].quantity) || 0;
        const unitPrice = parseFloat(updated[index].unitPrice) || 0;
        updated[index].totalPrice = quantity * unitPrice;
      }

      // Recalculate total amount immediately
      const total = updated.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0);
      setFormData(prevForm => ({
        ...prevForm,
        totalAmount: total
      }));

      return updated;
    });
  };

  const removeInvoiceItem = (index) => {
    setInvoiceItems(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Recalculate total amount immediately
      const total = updated.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0);
      setFormData(prevForm => ({
        ...prevForm,
        totalAmount: total
      }));
      return updated;
    });
  };

  const calculateTotalAmount = () => {
    const total = invoiceItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    setFormData(prev => ({
      ...prev,
      totalAmount: total
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // التحقق من البيانات المطلوبة حسب نوع الفاتورة
    if (formData.invoiceType === 'sale') {
      if (!formData.repairRequestId && !formData.customerId) {
        alert('لفواتير البيع: يرجى تحديد إما طلب إصلاح أو عميل');
        return;
      }
    } else if (formData.invoiceType === 'purchase') {
      if (!formData.vendorId) {
        alert('لفواتير الشراء: يرجى تحديد مورد');
        return;
      }
    }
    
    if (invoiceItems.length === 0) {
      alert('يرجى إضافة عنصر واحد على الأقل للفاتورة');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const invoiceData = {
        ...formData,
        repairRequestId: formData.invoiceType === 'sale' ? (formData.repairRequestId || null) : null,
        customerId: formData.invoiceType === 'sale' ? (formData.customerId || null) : null,
        vendorId: formData.invoiceType === 'purchase' ? (formData.vendorId || null) : null,
        invoiceType: formData.invoiceType,
        totalAmount: parseFloat(formData.totalAmount),
        taxAmount: parseFloat(formData.taxAmount),
        status: 'draft',
        amountPaid: 0
      };

      const createdInvoice = await apiService.createInvoice(invoiceData);
        const invoiceId = createdInvoice.data?.id || createdInvoice.id;
        
        // Add invoice items
        for (const item of invoiceItems) {
          const itemData = {
            description: item.description,
            quantity: parseInt(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            itemType: item.itemType,
            serviceId: item.serviceId || null,
            inventoryItemId: item.inventoryItemId || null
          };
          await apiService.addInvoiceItem(invoiceId, itemData);
        }

        alert('تم إنشاء الفاتورة بنجاح');
        navigate(`/invoices/${invoiceId}`);
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError('حدث خطأ في إنشاء الفاتورة');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = formData.currency || 'EGP') => {
    return formatMoney ? formatMoney(amount || 0, currency) : `${amount || 0} ${currency}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-2 space-x-reverse mb-2">
            <SimpleButton 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/invoices')}
            >
              <ArrowRight className="w-4 h-4" />
            </SimpleButton>
            <h1 className="text-2xl font-bold text-gray-900">إنشاء فاتورة جديدة</h1>
          </div>
          <p className="text-gray-600">إنشاء فاتورة جديدة لطلب إصلاح</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle className="flex items-center">
                  <FileText className="w-5 h-5 ml-2" />
                  معلومات الفاتورة الأساسية
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نوع الفاتورة *
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="invoiceType"
                          value="sale"
                          checked={formData.invoiceType === 'sale'}
                          onChange={(e) => handleInvoiceTypeChange(e.target.value)}
                          className="ml-2"
                        />
                        <span>فاتورة بيع</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="invoiceType"
                          value="purchase"
                          checked={formData.invoiceType === 'purchase'}
                          onChange={(e) => handleInvoiceTypeChange(e.target.value)}
                          className="ml-2"
                        />
                        <span>فاتورة شراء</span>
                      </label>
                    </div>
                  </div>

                  {formData.invoiceType === 'sale' && (
                    <>
                      {!formData.customerId && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            طلب الإصلاح (اختياري)
                          </label>
                          <input
                            type="text"
                            name="repairRequestId"
                            value={formData.repairRequestId}
                            onChange={(e) => handleRepairRequestChange(e.target.value)}
                            placeholder="رقم طلب الإصلاح"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}
                      {!formData.repairRequestId && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            العميل *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={customerSearch}
                              onChange={(e) => setCustomerSearch(e.target.value)}
                              placeholder="ابحث عن عميل..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {customerSearch && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {customers.filter(c => 
                                  !customerSearch || 
                                  c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                                  c.phone?.includes(customerSearch)
                                ).map(customer => (
                                  <div
                                    key={customer.id}
                                    onClick={() => {
                                      handleCustomerSelect(customer.id);
                                      setCustomerSearch(customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim());
                                    }}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                                  >
                                    <div className="font-medium">{customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim()}</div>
                                    {customer.phone && (
                                      <div className="text-sm text-gray-500">{customer.phone}</div>
                                    )}
                                  </div>
                                ))}
                                {customers.length === 0 && (
                                  <div className="px-4 py-2 text-gray-500 text-sm">لا يوجد عملاء</div>
                                )}
                              </div>
                            )}
                          </div>
                          {selectedCustomer && (
                            <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                              <div className="text-sm font-medium text-blue-900">
                                العميل المختار: {selectedCustomer.name || `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim()}
                              </div>
                              {selectedCustomer.phone && (
                                <div className="text-xs text-blue-700">{selectedCustomer.phone}</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {formData.invoiceType === 'purchase' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        المورد *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={vendorSearch}
                          onChange={(e) => setVendorSearch(e.target.value)}
                          placeholder="ابحث عن مورد..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {vendorSearch && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {vendors.filter(v => 
                              !vendorSearch || 
                              v.name?.toLowerCase().includes(vendorSearch.toLowerCase()) ||
                              v.phone?.includes(vendorSearch)
                            ).map(vendor => (
                              <div
                                key={vendor.id}
                                onClick={() => {
                                  handleVendorSelect(vendor.id);
                                  setVendorSearch(vendor.name || '');
                                }}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                              >
                                <div className="font-medium">{vendor.name || 'مورد'}</div>
                                {vendor.phone && (
                                  <div className="text-sm text-gray-500">{vendor.phone}</div>
                                )}
                              </div>
                            ))}
                            {vendors.length === 0 && (
                              <div className="px-4 py-2 text-gray-500 text-sm">لا يوجد موردين</div>
                            )}
                          </div>
                        )}
                      </div>
                      {selectedVendor && (
                        <div className="mt-2 p-2 bg-green-50 rounded-lg">
                          <div className="text-sm font-medium text-green-900">
                            المورد المختار: {selectedVendor.name || 'مورد'}
                          </div>
                          {selectedVendor.phone && (
                            <div className="text-xs text-green-700">{selectedVendor.phone}</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      العملة
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="EGP">جنيه مصري (EGP) - ج.م</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                      <option value="EUR">يورو (EUR)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المبلغ الإجمالي
                    </label>
                    <input
                      type="number"
                      name="totalAmount"
                      value={formData.totalAmount}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      مبلغ الضريبة
                    </label>
                    <input
                      type="number"
                      name="taxAmount"
                      value={formData.taxAmount}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ملاحظات
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="ملاحظات إضافية..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </SimpleCardContent>
            </SimpleCard>

            {/* Invoice Items */}
            <SimpleCard>
              <SimpleCardHeader>
                <div className="flex justify-between items-center">
                  <SimpleCardTitle>عناصر الفاتورة</SimpleCardTitle>
                  <SimpleButton type="button" onClick={addInvoiceItem}>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة عنصر
                  </SimpleButton>
                </div>
              </SimpleCardHeader>
              <SimpleCardContent>
                {invoiceItems.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">لا توجد عناصر في الفاتورة</p>
                    <p className="text-sm text-gray-400">اضغط "إضافة عنصر" لبدء إضافة العناصر</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoiceItems.map((item, index) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              النوع
                            </label>
                            <select
                              value={item.itemType}
                              onChange={(e) => updateInvoiceItem(index, 'itemType', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="service">خدمة</option>
                              <option value="part">صنف من المخزون</option>
                            </select>
                          </div>
                          {item.itemType === 'service' ? (
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                الخدمة
                              </label>
                              <select
                                value={item.serviceId || ''}
                                onChange={(e) => updateInvoiceItem(index, 'serviceId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">اختر خدمة...</option>
                                {services.map(service => (
                                  <option key={service.id} value={service.id}>
                                    {service.name} - {formatCurrency(service.basePrice || 0)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                الصنف من المخزون
                              </label>
                              <select
                                value={item.inventoryItemId || ''}
                                onChange={(e) => updateInvoiceItem(index, 'inventoryItemId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">اختر صنف...</option>
                                {inventoryItems.map(invItem => (
                                  <option key={invItem.id} value={invItem.id}>
                                    {invItem.name} {invItem.sku ? `(${invItem.sku})` : ''} - {formatCurrency(invItem.sellingPrice || 0)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              الوصف
                            </label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                              placeholder="وصف العنصر"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              الكمية
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateInvoiceItem(index, 'quantity', e.target.value)}
                              min="1"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              سعر الوحدة
                            </label>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateInvoiceItem(index, 'unitPrice', e.target.value)}
                              step="0.01"
                              min="0"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div className="flex items-end">
                            <SimpleButton
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeInvoiceItem(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </SimpleButton>
                          </div>
                        </div>
                        <div className="mt-2 text-right">
                          <span className="text-sm text-gray-600">المجموع: </span>
                          <span className="font-semibold">{formatCurrency(item.totalPrice)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SimpleCardContent>
            </SimpleCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Repair Request Info */}
            {repairRequest && (
              <SimpleCard>
                <SimpleCardHeader>
                  <SimpleCardTitle className="flex items-center">
                    <FileText className="w-5 h-5 ml-2" />
                    طلب الإصلاح
                  </SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">رقم الطلب</p>
                    <p className="font-semibold">#{repairRequest.id}</p>
                    <p className="text-sm text-gray-600">التكلفة المقدرة</p>
                    <p className="font-semibold">{formatCurrency(repairRequest.estimatedCost)}</p>
                    <p className="text-sm text-gray-600">الحالة</p>
                    <p className="font-semibold">{repairRequest.status}</p>
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            )}

            {/* Invoice Summary */}
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle className="flex items-center">
                  <Calculator className="w-5 h-5 ml-2" />
                  ملخص الفاتورة
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">عدد العناصر:</span>
                    <span className="font-semibold">{invoiceItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">المجموع الفرعي:</span>
                    <span className="font-semibold">{formatCurrency(formData.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">الضريبة:</span>
                    <span className="font-semibold">{formatCurrency(formData.taxAmount)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">المجموع الإجمالي:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(parseFloat(formData.totalAmount) + parseFloat(formData.taxAmount))}
                      </span>
                    </div>
                  </div>
                </div>
              </SimpleCardContent>
            </SimpleCard>

            {/* Actions */}
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>الإجراءات</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-2">
                  <SimpleButton 
                    type="submit" 
                    className="w-full"
                    disabled={loading || invoiceItems.length === 0}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 ml-2" />
                        حفظ الفاتورة
                      </>
                    )}
                  </SimpleButton>
                  <SimpleButton 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/invoices')}
                  >
                    <X className="w-4 h-4 ml-2" />
                    إلغاء
                  </SimpleButton>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoicePage;
                          </div>
                          {selectedCustomer && (
                            <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                              <div className="text-sm font-medium text-blue-900">
                                العميل المختار: {selectedCustomer.name || `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim()}
                              </div>
                              {selectedCustomer.phone && (
                                <div className="text-xs text-blue-700">{selectedCustomer.phone}</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {formData.invoiceType === 'purchase' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        المورد *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={vendorSearch}
                          onChange={(e) => setVendorSearch(e.target.value)}
                          placeholder="ابحث عن مورد..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {vendorSearch && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {vendors.filter(v => 
                              !vendorSearch || 
                              v.name?.toLowerCase().includes(vendorSearch.toLowerCase()) ||
                              v.phone?.includes(vendorSearch)
                            ).map(vendor => (
                              <div
                                key={vendor.id}
                                onClick={() => {
                                  handleVendorSelect(vendor.id);
                                  setVendorSearch(vendor.name || '');
                                }}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                              >
                                <div className="font-medium">{vendor.name || 'مورد'}</div>
                                {vendor.phone && (
                                  <div className="text-sm text-gray-500">{vendor.phone}</div>
                                )}
                              </div>
                            ))}
                            {vendors.length === 0 && (
                              <div className="px-4 py-2 text-gray-500 text-sm">لا يوجد موردين</div>
                            )}
                          </div>
                        )}
                      </div>
                      {selectedVendor && (
                        <div className="mt-2 p-2 bg-green-50 rounded-lg">
                          <div className="text-sm font-medium text-green-900">
                            المورد المختار: {selectedVendor.name || 'مورد'}
                          </div>
                          {selectedVendor.phone && (
                            <div className="text-xs text-green-700">{selectedVendor.phone}</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      العملة
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="EGP">جنيه مصري (EGP) - ج.م</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                      <option value="EUR">يورو (EUR)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المبلغ الإجمالي
                    </label>
                    <input
                      type="number"
                      name="totalAmount"
                      value={formData.totalAmount}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      مبلغ الضريبة
                    </label>
                    <input
                      type="number"
                      name="taxAmount"
                      value={formData.taxAmount}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ملاحظات
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="ملاحظات إضافية..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </SimpleCardContent>
            </SimpleCard>

            {/* Invoice Items */}
            <SimpleCard>
              <SimpleCardHeader>
                <div className="flex justify-between items-center">
                  <SimpleCardTitle>عناصر الفاتورة</SimpleCardTitle>
                  <SimpleButton type="button" onClick={addInvoiceItem}>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة عنصر
                  </SimpleButton>
                </div>
              </SimpleCardHeader>
              <SimpleCardContent>
                {invoiceItems.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">لا توجد عناصر في الفاتورة</p>
                    <p className="text-sm text-gray-400">اضغط "إضافة عنصر" لبدء إضافة العناصر</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoiceItems.map((item, index) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              النوع
                            </label>
                            <select
                              value={item.itemType}
                              onChange={(e) => updateInvoiceItem(index, 'itemType', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="service">خدمة</option>
                              <option value="part">صنف من المخزون</option>
                            </select>
                          </div>
                          {item.itemType === 'service' ? (
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                الخدمة
                              </label>
                              <select
                                value={item.serviceId || ''}
                                onChange={(e) => updateInvoiceItem(index, 'serviceId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">اختر خدمة...</option>
                                {services.map(service => (
                                  <option key={service.id} value={service.id}>
                                    {service.name} - {formatCurrency(service.basePrice || 0)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                الصنف من المخزون
                              </label>
                              <select
                                value={item.inventoryItemId || ''}
                                onChange={(e) => updateInvoiceItem(index, 'inventoryItemId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">اختر صنف...</option>
                                {inventoryItems.map(invItem => (
                                  <option key={invItem.id} value={invItem.id}>
                                    {invItem.name} {invItem.sku ? `(${invItem.sku})` : ''} - {formatCurrency(invItem.sellingPrice || 0)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              الوصف
                            </label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                              placeholder="وصف العنصر"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              الكمية
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateInvoiceItem(index, 'quantity', e.target.value)}
                              min="1"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              سعر الوحدة
                            </label>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateInvoiceItem(index, 'unitPrice', e.target.value)}
                              step="0.01"
                              min="0"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div className="flex items-end">
                            <SimpleButton
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeInvoiceItem(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </SimpleButton>
                          </div>
                        </div>
                        <div className="mt-2 text-right">
                          <span className="text-sm text-gray-600">المجموع: </span>
                          <span className="font-semibold">{formatCurrency(item.totalPrice)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SimpleCardContent>
            </SimpleCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Repair Request Info */}
            {repairRequest && (
              <SimpleCard>
                <SimpleCardHeader>
                  <SimpleCardTitle className="flex items-center">
                    <FileText className="w-5 h-5 ml-2" />
                    طلب الإصلاح
                  </SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">رقم الطلب</p>
                    <p className="font-semibold">#{repairRequest.id}</p>
                    <p className="text-sm text-gray-600">التكلفة المقدرة</p>
                    <p className="font-semibold">{formatCurrency(repairRequest.estimatedCost)}</p>
                    <p className="text-sm text-gray-600">الحالة</p>
                    <p className="font-semibold">{repairRequest.status}</p>
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            )}

            {/* Invoice Summary */}
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle className="flex items-center">
                  <Calculator className="w-5 h-5 ml-2" />
                  ملخص الفاتورة
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">عدد العناصر:</span>
                    <span className="font-semibold">{invoiceItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">المجموع الفرعي:</span>
                    <span className="font-semibold">{formatCurrency(formData.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">الضريبة:</span>
                    <span className="font-semibold">{formatCurrency(formData.taxAmount)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">المجموع الإجمالي:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(parseFloat(formData.totalAmount) + parseFloat(formData.taxAmount))}
                      </span>
                    </div>
                  </div>
                </div>
              </SimpleCardContent>
            </SimpleCard>

            {/* Actions */}
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>الإجراءات</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-2">
                  <SimpleButton 
                    type="submit" 
                    className="w-full"
                    disabled={loading || invoiceItems.length === 0}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 ml-2" />
                        حفظ الفاتورة
                      </>
                    )}
                  </SimpleButton>
                  <SimpleButton 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/invoices')}
                  >
                    <X className="w-4 h-4 ml-2" />
                    إلغاء
                  </SimpleButton>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoicePage;
                          </div>
                          {selectedCustomer && (
                            <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                              <div className="text-sm font-medium text-blue-900">
                                العميل المختار: {selectedCustomer.name || `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim()}
                              </div>
                              {selectedCustomer.phone && (
                                <div className="text-xs text-blue-700">{selectedCustomer.phone}</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {formData.invoiceType === 'purchase' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        المورد *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={vendorSearch}
                          onChange={(e) => setVendorSearch(e.target.value)}
                          placeholder="ابحث عن مورد..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {vendorSearch && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {vendors.filter(v => 
                              !vendorSearch || 
                              v.name?.toLowerCase().includes(vendorSearch.toLowerCase()) ||
                              v.phone?.includes(vendorSearch)
                            ).map(vendor => (
                              <div
                                key={vendor.id}
                                onClick={() => {
                                  handleVendorSelect(vendor.id);
                                  setVendorSearch(vendor.name || '');
                                }}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                              >
                                <div className="font-medium">{vendor.name || 'مورد'}</div>
                                {vendor.phone && (
                                  <div className="text-sm text-gray-500">{vendor.phone}</div>
                                )}
                              </div>
                            ))}
                            {vendors.length === 0 && (
                              <div className="px-4 py-2 text-gray-500 text-sm">لا يوجد موردين</div>
                            )}
                          </div>
                        )}
                      </div>
                      {selectedVendor && (
                        <div className="mt-2 p-2 bg-green-50 rounded-lg">
                          <div className="text-sm font-medium text-green-900">
                            المورد المختار: {selectedVendor.name || 'مورد'}
                          </div>
                          {selectedVendor.phone && (
                            <div className="text-xs text-green-700">{selectedVendor.phone}</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      العملة
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="EGP">جنيه مصري (EGP) - ج.م</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                      <option value="EUR">يورو (EUR)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المبلغ الإجمالي
                    </label>
                    <input
                      type="number"
                      name="totalAmount"
                      value={formData.totalAmount}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      مبلغ الضريبة
                    </label>
                    <input
                      type="number"
                      name="taxAmount"
                      value={formData.taxAmount}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ملاحظات
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="ملاحظات إضافية..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </SimpleCardContent>
            </SimpleCard>

            {/* Invoice Items */}
            <SimpleCard>
              <SimpleCardHeader>
                <div className="flex justify-between items-center">
                  <SimpleCardTitle>عناصر الفاتورة</SimpleCardTitle>
                  <SimpleButton type="button" onClick={addInvoiceItem}>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة عنصر
                  </SimpleButton>
                </div>
              </SimpleCardHeader>
              <SimpleCardContent>
                {invoiceItems.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">لا توجد عناصر في الفاتورة</p>
                    <p className="text-sm text-gray-400">اضغط "إضافة عنصر" لبدء إضافة العناصر</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoiceItems.map((item, index) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              النوع
                            </label>
                            <select
                              value={item.itemType}
                              onChange={(e) => updateInvoiceItem(index, 'itemType', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="service">خدمة</option>
                              <option value="part">صنف من المخزون</option>
                            </select>
                          </div>
                          {item.itemType === 'service' ? (
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                الخدمة
                              </label>
                              <select
                                value={item.serviceId || ''}
                                onChange={(e) => updateInvoiceItem(index, 'serviceId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">اختر خدمة...</option>
                                {services.map(service => (
                                  <option key={service.id} value={service.id}>
                                    {service.name} - {formatCurrency(service.basePrice || 0)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                الصنف من المخزون
                              </label>
                              <select
                                value={item.inventoryItemId || ''}
                                onChange={(e) => updateInvoiceItem(index, 'inventoryItemId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">اختر صنف...</option>
                                {inventoryItems.map(invItem => (
                                  <option key={invItem.id} value={invItem.id}>
                                    {invItem.name} {invItem.sku ? `(${invItem.sku})` : ''} - {formatCurrency(invItem.sellingPrice || 0)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              الوصف
                            </label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                              placeholder="وصف العنصر"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              الكمية
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateInvoiceItem(index, 'quantity', e.target.value)}
                              min="1"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              سعر الوحدة
                            </label>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateInvoiceItem(index, 'unitPrice', e.target.value)}
                              step="0.01"
                              min="0"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div className="flex items-end">
                            <SimpleButton
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeInvoiceItem(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </SimpleButton>
                          </div>
                        </div>
                        <div className="mt-2 text-right">
                          <span className="text-sm text-gray-600">المجموع: </span>
                          <span className="font-semibold">{formatCurrency(item.totalPrice)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SimpleCardContent>
            </SimpleCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Repair Request Info */}
            {repairRequest && (
              <SimpleCard>
                <SimpleCardHeader>
                  <SimpleCardTitle className="flex items-center">
                    <FileText className="w-5 h-5 ml-2" />
                    طلب الإصلاح
                  </SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">رقم الطلب</p>
                    <p className="font-semibold">#{repairRequest.id}</p>
                    <p className="text-sm text-gray-600">التكلفة المقدرة</p>
                    <p className="font-semibold">{formatCurrency(repairRequest.estimatedCost)}</p>
                    <p className="text-sm text-gray-600">الحالة</p>
                    <p className="font-semibold">{repairRequest.status}</p>
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            )}

            {/* Invoice Summary */}
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle className="flex items-center">
                  <Calculator className="w-5 h-5 ml-2" />
                  ملخص الفاتورة
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">عدد العناصر:</span>
                    <span className="font-semibold">{invoiceItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">المجموع الفرعي:</span>
                    <span className="font-semibold">{formatCurrency(formData.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">الضريبة:</span>
                    <span className="font-semibold">{formatCurrency(formData.taxAmount)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">المجموع الإجمالي:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(parseFloat(formData.totalAmount) + parseFloat(formData.taxAmount))}
                      </span>
                    </div>
                  </div>
                </div>
              </SimpleCardContent>
            </SimpleCard>

            {/* Actions */}
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>الإجراءات</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-2">
                  <SimpleButton 
                    type="submit" 
                    className="w-full"
                    disabled={loading || invoiceItems.length === 0}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 ml-2" />
                        حفظ الفاتورة
                      </>
                    )}
                  </SimpleButton>
                  <SimpleButton 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/invoices')}
                  >
                    <X className="w-4 h-4 ml-2" />
                    إلغاء
                  </SimpleButton>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoicePage;