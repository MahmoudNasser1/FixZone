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
    totalAmount: 0,
    taxAmount: 0,
    currency: settings.currency.code || 'EGP',
    notes: ''
  });

  const [invoiceItems, setInvoiceItems] = useState([]);
  const [repairRequest, setRepairRequest] = useState(null);
  const [services, setServices] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServices();
    fetchInventoryItems();
    if (repairRequestId) {
      fetchRepairRequest();
    }
  }, [repairRequestId]);

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
      updated[index] = {
        ...updated[index],
        [field]: value
      };

      // Calculate total price
      if (field === 'quantity' || field === 'unitPrice') {
        const quantity = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(updated[index].quantity) || 0;
        const unitPrice = field === 'unitPrice' ? parseFloat(value) || 0 : parseFloat(updated[index].unitPrice) || 0;
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
    
    if (invoiceItems.length === 0) {
      alert('يرجى إضافة عنصر واحد على الأقل للفاتورة');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const invoiceData = {
        ...formData,
        totalAmount: parseFloat(formData.totalAmount),
        taxAmount: parseFloat(formData.taxAmount),
        status: 'draft',
        amountPaid: 0
      };

      const response = await apiService.createInvoice(invoiceData);
      
      if (response.ok) {
        const createdInvoice = await response.json();
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
      } else {
        throw new Error('Failed to create invoice');
      }
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
                      طلب الإصلاح
                    </label>
                    <input
                      type="text"
                      name="repairRequestId"
                      value={formData.repairRequestId}
                      onChange={handleInputChange}
                      placeholder="رقم طلب الإصلاح"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
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
                      <option value="EGP">جنيه مصري (EGP)</option>
                      <option value="SAR">ريال سعودي (SAR)</option>
                      <option value="USD">دولار أمريكي (USD)</option>
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
                              النوع
                            </label>
                            <select
                              value={item.itemType}
                              onChange={(e) => updateInvoiceItem(index, 'itemType', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="service">خدمة</option>
                              <option value="part">قطعة</option>
                            </select>
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