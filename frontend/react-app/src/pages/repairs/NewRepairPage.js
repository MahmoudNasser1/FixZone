import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import apiService from '../../services/api';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import { Input } from '../../components/ui/Input';
import { 
  ArrowRight, Wrench, User, Phone, Mail, 
  Smartphone, Laptop, Tablet, Save, X, AlertCircle
} from 'lucide-react';

const NewRepairPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [brandOptions, setBrandOptions] = useState([]);
  const [accessoryOptions, setAccessoryOptions] = useState([]);
  const [deviceTypeOptions, setDeviceTypeOptions] = useState([]);
  
  const [formData, setFormData] = useState({
    customerId: searchParams.get('customerId') || '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deviceType: '',
    deviceBrand: '',
    brandId: '',
    deviceModel: '',
    serialNumber: '',
    devicePassword: '',
    cpu: '',
    gpu: '',
    ram: '',
    storage: '',
    accessories: [],
    problemDescription: '',
    priority: 'MEDIUM',
    estimatedCost: '',
    actualCost: '',
    expectedDeliveryDate: '',
    notes: ''
  });

  // تحميل البيانات الأساسية عند بدء الصفحة
  useEffect(() => {
    console.log('Initial useEffect triggered');
    
    const loadInitialData = async () => {
      try {
        console.log('Loading initial variables...');
        
        // تحميل الماركات والملحقات الأساسية
        const brandsResponse = await apiService.getVariables({ category: 'BRAND', active: true });
        console.log('Brands response:', brandsResponse);
        if (brandsResponse.ok) {
          const brands = await brandsResponse.json();
          console.log('Brands loaded:', brands);
          setBrandOptions(Array.isArray(brands) ? brands : []);
        } else {
          console.log('Brands response not ok, using fallback data');
          setBrandOptions([
            { id: 1, label: 'Apple', value: 'APPLE' },
            { id: 2, label: 'Samsung', value: 'SAMSUNG' },
            { id: 3, label: 'Huawei', value: 'HUAWEI' },
            { id: 4, label: 'Dell', value: 'DELL' },
            { id: 5, label: 'HP', value: 'HP' }
          ]);
        }
        
        const accessoriesResponse = await apiService.getVariables({ category: 'ACCESSORY', active: true });
        console.log('Accessories response:', accessoriesResponse);
        if (accessoriesResponse && accessoriesResponse.ok && Array.isArray(accessoriesResponse)) {
          console.log('Accessories loaded:', accessoriesResponse);
          setAccessoryOptions(accessoriesResponse);
        } else if (Array.isArray(accessoriesResponse)) {
          console.log('Accessories loaded (direct array):', accessoriesResponse);
          setAccessoryOptions(accessoriesResponse);
        } else {
          console.log('Accessories response not ok, using fallback data');
          setAccessoryOptions([
            { id: 1, label: 'شاحن', value: 'CHARGER' },
            { id: 2, label: 'كابل باور', value: 'POWER_CABLE' },
            { id: 3, label: 'شنطة', value: 'BAG' },
            { id: 4, label: 'بطارية خارجية', value: 'POWER_BANK' }
          ]);
        }

        // تحميل أنواع الأجهزة
        const deviceTypesResponse = await apiService.getVariables({ category: 'DEVICE_TYPE', active: true });
        console.log('Device types response:', deviceTypesResponse);
        if (deviceTypesResponse.ok) {
          const deviceTypes = await deviceTypesResponse.json();
          console.log('Device types loaded:', deviceTypes);
          setDeviceTypeOptions(Array.isArray(deviceTypes) ? deviceTypes : []);
        } else {
          console.log('Device types response not ok, using fallback data');
          setDeviceTypeOptions([
            { id: 1, label: 'هاتف ذكي', value: 'SMARTPHONE' },
            { id: 2, label: 'لابتوب', value: 'LAPTOP' },
            { id: 3, label: 'تابلت', value: 'TABLET' },
            { id: 4, label: 'ساعة ذكية', value: 'SMARTWATCH' },
            { id: 5, label: 'سماعات', value: 'HEADPHONES' }
          ]);
        }
      } catch (e) {
        console.warn('Failed to load initial variables', e);
        setBrandOptions([]);
        setAccessoryOptions([]);
        setDeviceTypeOptions([]);
      }
    };
    
    fetchCustomers();
    loadInitialData();
    
    if (searchParams.get('customerId')) {
      fetchCustomerDetails(searchParams.get('customerId'));
    }
  }, []);

  // جلب الماركات والملحقات عند تغيير نوع الجهاز
  useEffect(() => {
    if (!formData.deviceType) return; // لا نحتاج إعادة تحميل إذا لم يكن هناك نوع جهاز
    
    const loadVariables = async () => {
      try {
        console.log('Loading variables for device type:', formData.deviceType);
        
        // الماركات حسب نوع الجهاز
        const brandsResponse = await apiService.getVariables({ category: 'BRAND', deviceType: formData.deviceType, active: true });
        console.log('Brands for device type response:', brandsResponse);
        if (brandsResponse.ok) {
          const brands = await brandsResponse.json();
          console.log('Brands for device type loaded:', brands);
          setBrandOptions(Array.isArray(brands) ? brands : []);
        } else {
          console.log('Brands response not ok, using fallback data for device type:', formData.deviceType);
          // إضافة بيانات تجريبية حسب نوع الجهاز
          const deviceBrands = {
            'SMARTPHONE': [
              { id: 1, label: 'Apple', value: 'APPLE' },
              { id: 2, label: 'Samsung', value: 'SAMSUNG' },
              { id: 3, label: 'Huawei', value: 'HUAWEI' },
              { id: 4, label: 'Xiaomi', value: 'XIAOMI' }
            ],
            'LAPTOP': [
              { id: 5, label: 'Dell', value: 'DELL' },
              { id: 6, label: 'HP', value: 'HP' },
              { id: 7, label: 'Lenovo', value: 'LENOVO' },
              { id: 8, label: 'ASUS', value: 'ASUS' }
            ],
            'TABLET': [
              { id: 9, label: 'iPad', value: 'IPAD' },
              { id: 10, label: 'Samsung Galaxy Tab', value: 'SAMSUNG_TAB' },
              { id: 11, label: 'Huawei MediaPad', value: 'HUAWEI_TAB' }
            ]
          };
          setBrandOptions(deviceBrands[formData.deviceType] || []);
        }
      } catch (e) {
        console.warn('Failed to load brand options', e);
        setBrandOptions([]);
      }
    };
    loadVariables();
  }, [formData.deviceType]);

  const fetchCustomers = async () => {
    try {
      const data = await apiService.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const handleCustomerSearchChange = async (e) => {
    const value = e.target.value;
    setCustomerSearch(value);
    if (!value || value.trim().length < 2) {
      setCustomers([]);
      return;
    }
    try {
      setSearchingCustomers(true);
      console.log('Searching for customers with query:', value);
      
      const response = await apiService.searchCustomers(value.trim(), 1, 20);
      console.log('Search response:', response);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Search result:', result);
        setCustomers(result?.data || []);
      } else {
        console.error('Search failed:', response.status);
        setCustomers([]);
      }
    } catch (err) {
      console.error('Error searching customers:', err);
      setCustomers([]);
    } finally {
      setSearchingCustomers(false);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    try {
      const customer = await apiService.getCustomer(customerId);
      setSelectedCustomer(customer);
      setFormData(prev => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email || ''
      }));
    } catch (err) {
      console.error('Error fetching customer details:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCustomerSelect = (e) => {
    const customerId = e.target.value;
    if (customerId) {
      const customer = customers.find(c => c.id.toString() === customerId);
      if (customer) {
        setSelectedCustomer(customer);
        setFormData(prev => ({
          ...prev,
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerEmail: customer.email || ''
        }));
      }
    } else {
      setSelectedCustomer(null);
      setFormData(prev => ({
        ...prev,
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerEmail: ''
      }));
    }
  };

  // اختيار عميل من نتائج البحث (Autocomplete)
  const pickCustomerFromSearch = (customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email || ''
    }));
    setCustomerSearch(`${customer.name} - ${customer.phone} (#${customer.id})`);
  };

  const generateRequestNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    return `REP-${year}${month}${day}-${time}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // التحقق من البيانات المطلوبة
    if (!formData.customerName.trim() || !formData.customerPhone.trim() || 
        !formData.deviceType.trim() || !formData.problemDescription.trim()) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // تحضير البيانات للإرسال
      const repairData = {
        requestNumber: generateRequestNumber(),
        customerId: formData.customerId || null,
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail.trim() || null,
        deviceType: formData.deviceType,
        deviceBrand: formData.deviceBrand.trim() || null,
        brandId: formData.brandId || null,
        deviceModel: formData.deviceModel.trim() || null,
        serialNumber: formData.serialNumber.trim() || null,
        devicePassword: formData.devicePassword.trim() || null,
        cpu: formData.cpu.trim() || null,
        gpu: formData.gpu.trim() || null,
        ram: formData.ram.trim() || null,
        storage: formData.storage.trim() || null,
        accessories: (formData.accessories || []).map(id => {
          // البحث في accessoryOptions عن id المطابق
          const accessory = accessoryOptions.find(a => a.id === Number(id) || a.value === id);
          // إذا وجدنا accessory، نعيد label، وإلا نعيد القيمة الأصلية
          if (accessory) {
            return accessory.label || accessory.value || id;
          }
          // إذا لم نجد accessory، نعيد القيمة كما هي (هذا للمتعلقات المخصصة)
          return id;
        }).filter(Boolean),
        problemDescription: formData.problemDescription.trim(), // Backend expects problemDescription
        customerNotes: formData.notes ? formData.notes.trim() : null,
        priority: formData.priority.toLowerCase(), // Convert to lowercase for backend
        estimatedCost: parseFloat(formData.estimatedCost || 0) || 0,
        expectedDeliveryDate: formData.expectedDeliveryDate ? new Date(formData.expectedDeliveryDate).toISOString() : null
      };

      console.log('Sending repair data:', repairData);
      console.log('Accessories being sent:', repairData.accessories);
      console.log('Accessory options available:', accessoryOptions);
      const newRepair = await apiService.createRepairRequest(repairData);
      
      // إظهار رسالة نجاح والانتقال لصفحة الطلبات
      alert(`تم إنشاء طلب الإصلاح بنجاح\nرقم الطلب: ${repairData.requestNumber}`);
      navigate('/repairs');
      
    } catch (err) {
      console.error('Error creating repair request:', err);
      setError('حدث خطأ في إنشاء طلب الإصلاح');
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Link to="/repairs">
            <SimpleButton variant="ghost" size="sm">
              <ArrowRight className="w-4 h-4" />
            </SimpleButton>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">طلب إصلاح جديد</h1>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <Link to="/repairs">
            <SimpleButton variant="outline">
              <X className="w-4 h-4 ml-2" />
              إلغاء
            </SimpleButton>
          </Link>
        </div>
      </div>

      {/* رسالة الخطأ */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
          <AlertCircle className="w-5 h-5 ml-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* بيانات العميل */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center">
              <User className="w-5 h-5 ml-2" />
              بيانات العميل
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent className="space-y-4">
            {/* بحث ديناميكي عن العملاء */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                بحث عن عميل بالاسم أو الهاتف
              </label>
              <Input
                value={customerSearch}
                onChange={handleCustomerSearchChange}
                placeholder="اكتب 2 حروف على الأقل..."
              />
              {searchingCustomers && (
                <div className="text-sm text-gray-500 mt-1">جاري البحث...</div>
              )}
              {/* نتائج البحث (Autocomplete) */}
              {customerSearch.trim().length >= 2 && customers.length > 0 && (
                <div className="mt-2 max-h-56 overflow-auto border border-gray-200 rounded-md bg-white shadow-sm divide-y">
                  {customers.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => pickCustomerFromSearch(c)}
                      className="w-full text-right px-3 py-2 hover:bg-gray-50 focus:bg-gray-50"
                    >
                      <div className="text-sm font-medium text-gray-900">{c.name} <span className="text-xs text-gray-500">#{c.id}</span></div>
                      <div className="text-xs text-gray-600">{c.phone || '—'}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم العميل *
                </label>
                <Input
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="أدخل اسم العميل"
                  required
                  disabled={!!selectedCustomer}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهاتف *
                </label>
                <Input
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  placeholder="01xxxxxxxxx"
                  required
                  disabled={!!selectedCustomer}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني
                </label>
                <Input
                  name="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  placeholder="example@email.com"
                  disabled={!!selectedCustomer}
                />
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* بيانات الجهاز */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center">
              <Wrench className="w-5 h-5 ml-2" />
              بيانات الجهاز
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع الجهاز *
                </label>
                <select
                  name="deviceType"
                  value={formData.deviceType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">اختر نوع الجهاز</option>
                  {deviceTypeOptions.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الماركة/الشركة المصنعة (ديناميكي)
                </label>
                <select
                  name="brandId"
                  value={formData.brandId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر الماركة</option>
                  {(() => {
                    console.log('Rendering brandOptions:', brandOptions, 'Type:', typeof brandOptions, 'IsArray:', Array.isArray(brandOptions));
                    return Array.isArray(brandOptions) ? brandOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    )) : null;
                  })()}
                </select>
                <div className="text-xs text-gray-500 mt-1">أو أدخل ماركة مخصصة:</div>
                <Input
                  name="deviceBrand"
                  value={formData.deviceBrand}
                  onChange={handleInputChange}
                  placeholder="مثل: Apple, Samsung, Dell"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الموديل
                </label>
                <Input
                  name="deviceModel"
                  value={formData.deviceModel}
                  onChange={handleInputChange}
                  placeholder="مثل: iPhone 13, Galaxy S21"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الرقم التسلسلي
                </label>
                <Input
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleInputChange}
                  placeholder="الرقم التسلسلي للجهاز"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  كلمة مرور الجهاز
                </label>
                <Input
                  name="devicePassword"
                  value={formData.devicePassword}
                  onChange={handleInputChange}
                  placeholder="كلمة المرور إن وجدت"
                />
              </div>
            </div>

            {/* مواصفات الجهاز */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المعالج (CPU)</label>
                <Input name="cpu" value={formData.cpu} onChange={handleInputChange} placeholder="Intel i5 / Ryzen 5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">كرت الشاشة (GPU)</label>
                <Input name="gpu" value={formData.gpu} onChange={handleInputChange} placeholder="NVIDIA / AMD / Intel" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الذاكرة (RAM)</label>
                <Input name="ram" value={formData.ram} onChange={handleInputChange} placeholder="8GB / 16GB" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">التخزين (Storage)</label>
                <Input name="storage" value={formData.storage} onChange={handleInputChange} placeholder="256GB SSD / 1TB HDD" />
              </div>
            </div>

            {/* الملحقات */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">المتعلقات المستلمة</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(() => {
                  console.log('Rendering accessoryOptions:', accessoryOptions, 'Type:', typeof accessoryOptions, 'IsArray:', Array.isArray(accessoryOptions));
                  return Array.isArray(accessoryOptions) ? accessoryOptions.map((opt) => (
                    <label key={opt.id} className="flex items-center space-x-2 space-x-reverse">
                      <input
                        type="checkbox"
                        checked={formData.accessories.includes(String(opt.id)) || formData.accessories.includes(Number(opt.id))}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData((prev) => {
                            const idStr = String(opt.id);
                            const current = new Set((prev.accessories || []).map(String));
                            if (checked) current.add(idStr); else current.delete(idStr);
                            return { ...prev, accessories: Array.from(current) };
                          });
                        }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  )) : null;
                })()}
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* تفاصيل المشكلة */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle>تفاصيل المشكلة</SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وصف المشكلة *
              </label>
              <textarea
                name="problemDescription"
                value={formData.problemDescription}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="اشرح المشكلة بالتفصيل..."
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الأولوية
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">منخفضة</option>
                  <option value="MEDIUM">متوسطة</option>
                  <option value="HIGH">عالية</option>
                  <option value="URGENT">عاجلة</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  التكلفة المتوقعة
                </label>
                <Input
                  name="estimatedCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.estimatedCost}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  التكلفة الفعلية - اختياري
                </label>
                <Input
                  name="actualCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.actualCost}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  موعد التسليم المتوقع
                </label>
                <input
                  name="expectedDeliveryDate"
                  type="datetime-local"
                  value={formData.expectedDeliveryDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ملاحظات إضافية
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="أي ملاحظات إضافية..."
              />
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* أزرار الحفظ */}
        <div className="flex justify-end space-x-4 space-x-reverse">
          <Link to="/repairs">
            <SimpleButton type="button" variant="outline">
              إلغاء
            </SimpleButton>
          </Link>
          <SimpleButton 
            type="submit" 
            disabled={saving}
            className="flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                إنشاء طلب الإصلاح
              </>
            )}
          </SimpleButton>
        </div>
      </form>
    </div>
  );
};

export default NewRepairPage;
