import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import apiService from '../../services/api';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import { Input } from '../../components/ui/Input';
import {
  ArrowRight, Wrench, User, Phone, Mail, Search, Loader2,
  Smartphone, Laptop, Tablet, Save, X, AlertCircle, CheckCircle,
  Building2, Calendar, DollarSign, FileText, Shield, Clock
} from 'lucide-react';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import './NewRepairPageEnhanced.css';

const NewRepairPageEnhanced = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notifications = useNotifications();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [brandOptions, setBrandOptions] = useState([
    { id: 1, label: 'Apple', value: 'APPLE' },
    { id: 2, label: 'Samsung', value: 'SAMSUNG' },
    { id: 3, label: 'Huawei', value: 'HUAWEI' },
    { id: 4, label: 'Dell', value: 'DELL' },
    { id: 5, label: 'HP', value: 'HP' },
    { id: 6, label: 'Microsoft', value: 'MICROSOFT' },
    { id: 7, label: 'Lenovo', value: 'LENOVO' },
    { id: 8, label: 'Acer', value: 'ACER' },
    { id: 9, label: 'Xiaomi', value: 'XIAOMI' },
    { id: 10, label: 'OnePlus', value: 'ONEPLUS' },
    { id: 11, label: 'Google', value: 'GOOGLE' },
    { id: 12, label: 'Fitbit', value: 'FITBIT' },
    { id: 13, label: 'Garmin', value: 'GARMIN' },
    { id: 14, label: 'Sony', value: 'SONY' },
    { id: 15, label: 'Bose', value: 'BOSE' },
    { id: 16, label: 'JBL', value: 'JBL' },
    { id: 17, label: 'Sennheiser', value: 'SENNHEISER' }
  ]);
  const [allBrandOptions, setAllBrandOptions] = useState([
    { id: 1, label: 'Apple', value: 'APPLE' },
    { id: 2, label: 'Samsung', value: 'SAMSUNG' },
    { id: 3, label: 'Huawei', value: 'HUAWEI' },
    { id: 4, label: 'Dell', value: 'DELL' },
    { id: 5, label: 'HP', value: 'HP' },
    { id: 6, label: 'Microsoft', value: 'MICROSOFT' },
    { id: 7, label: 'Lenovo', value: 'LENOVO' },
    { id: 8, label: 'Acer', value: 'ACER' },
    { id: 9, label: 'Xiaomi', value: 'XIAOMI' },
    { id: 10, label: 'OnePlus', value: 'ONEPLUS' },
    { id: 11, label: 'Google', value: 'GOOGLE' },
    { id: 12, label: 'Fitbit', value: 'FITBIT' },
    { id: 13, label: 'Garmin', value: 'GARMIN' },
    { id: 14, label: 'Sony', value: 'SONY' },
    { id: 15, label: 'Bose', value: 'BOSE' },
    { id: 16, label: 'JBL', value: 'JBL' },
    { id: 17, label: 'Sennheiser', value: 'SENNHEISER' }
  ]); // Store all brands for filtering
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

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // تحميل البيانات الأساسية عند بدء الصفحة
  useEffect(() => {
    loadInitialData();

    // إذا كان هناك customerId في الـ URL، جلب بيانات العميل
    const customerId = searchParams.get('customerId');
    if (customerId) {
      fetchCustomerDetails(customerId);
    }
  }, []);

  const loadInitialData = async () => {
    try {
      // تحميل الماركات والملحقات الأساسية
      const brandsResponse = await apiService.getVariables({ category: 'BRAND', active: true });
      let allBrands = [];
      if (Array.isArray(brandsResponse) && brandsResponse.length > 0) {
        allBrands = brandsResponse;
      } else {
        allBrands = [
          { id: 1, label: 'Apple', value: 'APPLE' },
          { id: 2, label: 'Samsung', value: 'SAMSUNG' },
          { id: 3, label: 'Huawei', value: 'HUAWEI' },
          { id: 4, label: 'Dell', value: 'DELL' },
          { id: 5, label: 'HP', value: 'HP' },
          { id: 6, label: 'Microsoft', value: 'MICROSOFT' },
          { id: 7, label: 'Lenovo', value: 'LENOVO' },
          { id: 8, label: 'Acer', value: 'ACER' },
          { id: 9, label: 'Xiaomi', value: 'XIAOMI' },
          { id: 10, label: 'OnePlus', value: 'ONEPLUS' },
          { id: 11, label: 'Google', value: 'GOOGLE' },
          { id: 12, label: 'Fitbit', value: 'FITBIT' },
          { id: 13, label: 'Garmin', value: 'GARMIN' },
          { id: 14, label: 'Sony', value: 'SONY' },
          { id: 15, label: 'Bose', value: 'BOSE' },
          { id: 16, label: 'JBL', value: 'JBL' },
          { id: 17, label: 'Sennheiser', value: 'SENNHEISER' }
        ];
      }

      setAllBrandOptions(allBrands);
      setBrandOptions(allBrands); // Initially show all brands

      const accessoriesResponse = await apiService.getVariables({ category: 'ACCESSORY', active: true });
      if (accessoriesResponse.ok) {
        const accessories = await accessoriesResponse.json();
        setAccessoryOptions(Array.isArray(accessories) ? accessories : []);
      } else {
        setAccessoryOptions([
          { id: 1, label: 'شاحن الجهاز', value: 'CHARGER' },
          { id: 2, label: 'كابل USB', value: 'USB_CABLE' },
          { id: 3, label: 'سماعات', value: 'EARPHONES' },
          { id: 4, label: 'حافظة', value: 'CASE' },
          { id: 5, label: 'حامي الشاشة', value: 'SCREEN_PROTECTOR' }
        ]);
      }

      const deviceTypesResponse = await apiService.getVariables({ category: 'DEVICE_TYPE', active: true });
      if (deviceTypesResponse.ok) {
        const deviceTypes = await deviceTypesResponse.json();
        setDeviceTypeOptions(Array.isArray(deviceTypes) ? deviceTypes : []);
      } else {
        setDeviceTypeOptions([
          { id: 1, label: 'هاتف ذكي', value: 'SMARTPHONE' },
          { id: 2, label: 'لابتوب', value: 'LAPTOP' },
          { id: 3, label: 'تابلت', value: 'TABLET' },
          { id: 4, label: 'ساعة ذكية', value: 'SMARTWATCH' },
          { id: 5, label: 'سماعات', value: 'EARPHONES' }
        ]);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
      notifications.error('حدث خطأ في تحميل البيانات الأساسية');
    }
  };

  const searchCustomers = async (value) => {
    if (!value || value.trim().length < 2) {
      setCustomers([]);
      setShowCustomerResults(false);
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
        setShowCustomerResults(true);
      } else {
        console.error('Search failed:', response.status);
        setCustomers([]);
        setShowCustomerResults(false);
      }
    } catch (err) {
      console.error('Error searching customers:', err);
      setCustomers([]);
      setShowCustomerResults(false);
      notifications.error('حدث خطأ في البحث عن العملاء');
    } finally {
      setSearchingCustomers(false);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    try {
      const response = await apiService.getCustomer(customerId);
      if (response.ok) {
        const customer = await response.json();
        setSelectedCustomer(customer);
        setFormData(prev => ({
          ...prev,
          customerId: customer.id,
          customerName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
          customerPhone: customer.phone || '',
          customerEmail: customer.email || ''
        }));
        setCustomerSearch(`${customer.firstName || ''} ${customer.lastName || ''}`.trim());
        setShowCustomerResults(false);
      }
    } catch (err) {
      console.error('Error fetching customer details:', err);
      notifications.error('حدث خطأ في جلب بيانات العميل');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Filter brands based on device type
    if (name === 'deviceType') {
      filterBrandsByDeviceType(value);
    }
  };

  // Filter brands based on device type
  const filterBrandsByDeviceType = (deviceType) => {
    const deviceBrandMap = {
      'LAPTOP': ['DELL', 'HP', 'MICROSOFT', 'LENOVO', 'ACER', 'APPLE'],
      'SMARTPHONE': ['APPLE', 'SAMSUNG', 'HUAWEI', 'XIAOMI', 'ONEPLUS', 'GOOGLE'],
      'TABLET': ['APPLE', 'SAMSUNG', 'HUAWEI', 'MICROSOFT', 'LENOVO'],
      'SMARTWATCH': ['APPLE', 'SAMSUNG', 'HUAWEI', 'FITBIT', 'GARMIN'],
      'EARPHONES': ['APPLE', 'SAMSUNG', 'SONY', 'BOSE', 'JBL', 'SENNHEISER']
    };

    const allowedBrands = deviceBrandMap[deviceType] || [];

    // If no device type selected or device type not in map, show all brands
    if (!deviceType || !deviceBrandMap[deviceType]) {
      setBrandOptions(allBrandOptions);
      return;
    }

    const filteredBrands = allBrandOptions.filter(brand =>
      allowedBrands.includes(brand.value)
    );

    setBrandOptions(filteredBrands);

    // Clear device brand if it's not available for the selected device type
    if (formData.deviceBrand && !allowedBrands.includes(formData.deviceBrand)) {
      setFormData(prev => ({
        ...prev,
        deviceBrand: ''
      }));
    }
  };

  const handleCustomerSearchChange = (e) => {
    const value = e.target.value;
    setCustomerSearch(value);

    // البحث مع تأخير لتجنب البحث المستمر
    const timeoutId = setTimeout(() => {
      searchCustomers(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
      customerPhone: customer.phone || '',
      customerEmail: customer.email || ''
    }));
    setCustomerSearch(customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim());
    setShowCustomerResults(false);
    setCustomers([]);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setFormData(prev => ({
      ...prev,
      customerId: '',
      customerName: '',
      customerPhone: '',
      customerEmail: ''
    }));
    setCustomerSearch('');
    setShowCustomerResults(false);
    setCustomers([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCustomer && !formData.customerName.trim()) {
      setError('يرجى اختيار عميل أو إدخال بيانات العميل');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // تحضير بيانات طلب الإصلاح
      const repairData = {
        customerId: selectedCustomer?.id || null,
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail.trim() || null,
        deviceType: formData.deviceType, // Device type options already have correct English values
        deviceBrand: formData.deviceBrand, // Brand options already have correct English values
        deviceModel: formData.deviceModel.trim(),
        serialNumber: formData.serialNumber.trim() || null,
        devicePassword: formData.devicePassword.trim() || null,
        cpu: formData.cpu.trim() || null,
        gpu: formData.gpu.trim() || null,
        ram: formData.ram.trim() || null,
        storage: formData.storage.trim() || null,
        accessories: formData.accessories.map(a => a.label || a.value || a.name || a),
        problemDescription: formData.problemDescription.trim(), // Backend expects problemDescription
        customerNotes: formData.notes.trim() || null,
        priority: formData.priority === 'عالية' ? 'high' : formData.priority === 'متوسطة' ? 'medium' : formData.priority === 'منخفضة' ? 'low' : 'normal', // Convert Arabic to English
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null,
        expectedDeliveryDate: formData.expectedDeliveryDate || null
      };

      console.log('Submitting repair request:', repairData);

      const result = await apiService.createRepairRequest(repairData);

      if (result && result.id) {
        notifications.success('تم إنشاء طلب الإصلاح بنجاح');
        navigate(`/repairs/${result.id}`);
      } else {
        throw new Error('Failed to create repair request');
      }

    } catch (err) {
      console.error('Error creating repair request:', err);
      setError('حدث خطأ في إنشاء طلب الإصلاح: ' + err.message);
      notifications.error('حدث خطأ في إنشاء طلب الإصلاح');
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }, (_, index) => (
        <React.Fragment key={index}>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep > index + 1
              ? 'bg-green-500 border-green-500 text-white'
              : currentStep === index + 1
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'bg-gray-200 border-gray-300 text-gray-500'
            }`}>
            {currentStep > index + 1 ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <span className="font-semibold">{index + 1}</span>
            )}
          </div>
          {index < totalSteps - 1 && (
            <div className={`w-16 h-1 mx-2 ${currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-200'
              }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">معلومات العميل</h2>
        <p className="text-gray-600">ابحث عن العميل أو أدخل بياناته الجديدة</p>
      </div>

      {/* البحث عن العميل */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <User className="w-4 h-4 inline ml-1" />
          البحث عن العميل
        </label>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            value={customerSearch}
            onChange={handleCustomerSearchChange}
            placeholder="ابحث بالاسم أو رقم الهاتف..."
            className="pr-10"
          />
          {searchingCustomers && (
            <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 animate-spin" />
          )}
        </div>

        {/* نتائج البحث */}
        {showCustomerResults && customers.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {customers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => selectCustomer(customer)}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-600">{customer.phone}</p>
                  </div>
                  <Phone className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* رسالة عدم وجود نتائج */}
        {showCustomerResults && customers.length === 0 && customerSearch.length >= 2 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
            <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>لم يتم العثور على عملاء</p>
          </div>
        )}
      </div>

      {/* العميل المختار */}
      {selectedCustomer && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
              <div>
                <p className="font-medium text-green-900">{selectedCustomer.name}</p>
                <p className="text-sm text-green-700">{selectedCustomer.phone}</p>
              </div>
            </div>
            <SimpleButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearCustomer}
              className="text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </SimpleButton>
          </div>
        </div>
      )}

      {/* بيانات العميل الجديد */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            اسم العميل *
          </label>
          <Input
            type="text"
            name="customerName"
            value={formData.customerName}
            onChange={handleInputChange}
            placeholder="أدخل اسم العميل"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            رقم الهاتف *
          </label>
          <Input
            type="tel"
            name="customerPhone"
            value={formData.customerPhone}
            onChange={handleInputChange}
            placeholder="أدخل رقم الهاتف"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            البريد الإلكتروني
          </label>
          <Input
            type="email"
            name="customerEmail"
            value={formData.customerEmail}
            onChange={handleInputChange}
            placeholder="أدخل البريد الإلكتروني (اختياري)"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">معلومات الجهاز</h2>
        <p className="text-gray-600">أدخل تفاصيل الجهاز المراد إصلاحه</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Smartphone className="w-4 h-4 inline ml-1" />
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
            {deviceTypeOptions.map((type) => (
              <option key={type.id} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building2 className="w-4 h-4 inline ml-1" />
            الماركة *
          </label>
          <select
            name="deviceBrand"
            value={formData.deviceBrand}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">اختر الماركة</option>
            {brandOptions.map((brand) => (
              <option key={brand.id} value={brand.value}>
                {brand.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الموديل *
          </label>
          <Input
            type="text"
            name="deviceModel"
            value={formData.deviceModel}
            onChange={handleInputChange}
            placeholder="أدخل موديل الجهاز"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الرقم التسلسلي
          </label>
          <Input
            type="text"
            name="serialNumber"
            value={formData.serialNumber}
            onChange={handleInputChange}
            placeholder="أدخل الرقم التسلسلي (اختياري)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Shield className="w-4 h-4 inline ml-1" />
            كلمة مرور الجهاز (اختياري)
          </label>
          <Input
            type="text"
            name="devicePassword"
            value={formData.devicePassword}
            onChange={handleInputChange}
            placeholder="أدخل كلمة مرور الجهاز (اختياري)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline ml-1" />
            تاريخ التسليم المتوقع
          </label>
          <Input
            type="date"
            name="expectedDeliveryDate"
            value={formData.expectedDeliveryDate}
            onChange={handleInputChange}
            min={new Date().toISOString().split('T')[0]} // Set minimum date to today
            required
          />
        </div>
      </div>

      {/* مواصفات إضافية للابتوب */}
      {formData.deviceType === 'LAPTOP' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="md:col-span-2 text-lg font-semibold text-gray-900 mb-2">المواصفات التقنية</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">المعالج (CPU)</label>
            <Input
              type="text"
              name="cpu"
              value={formData.cpu}
              onChange={handleInputChange}
              placeholder="أدخل نوع المعالج"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">كارت الرسوميات (GPU)</label>
            <Input
              type="text"
              name="gpu"
              value={formData.gpu}
              onChange={handleInputChange}
              placeholder="أدخل نوع كارت الرسوميات"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الذاكرة (RAM)</label>
            <Input
              type="text"
              name="ram"
              value={formData.ram}
              onChange={handleInputChange}
              placeholder="أدخل حجم الذاكرة"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">التخزين (Storage)</label>
            <Input
              type="text"
              name="storage"
              value={formData.storage}
              onChange={handleInputChange}
              placeholder="أدخل حجم التخزين"
            />
          </div>
        </div>
      )}

      {/* قسم المتعلقات المستلمة */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 ml-2" />
          المتعلقات المستلمة من العميل
        </h3>
        <p className="text-sm text-gray-600 mb-4">اختر المتعلقات التي استلمتها من العميل مع الجهاز</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {accessoryOptions.map((option) => (
            <label key={option.id} className="flex items-center space-x-2 space-x-reverse p-3 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.accessories.some(a => a.id === option.id || a.label === option.label)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData(prev => ({
                      ...prev,
                      accessories: [...prev.accessories, { id: option.id, label: option.label, value: option.value }]
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      accessories: prev.accessories.filter(a => a.id !== option.id && a.label !== option.label)
                    }));
                  }
                }}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>

        {formData.accessories.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">المتعلقات المختارة:</h4>
            <div className="flex flex-wrap gap-2">
              {formData.accessories.map((accessory, index) => (
                <span key={accessory.id || index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {accessory.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">وصف المشكلة</h2>
        <p className="text-gray-600">أدخل تفاصيل المشكلة والأولوية</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FileText className="w-4 h-4 inline ml-1" />
          وصف المشكلة *
        </label>
        <textarea
          name="problemDescription"
          value={formData.problemDescription}
          onChange={handleInputChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="اشرح المشكلة بالتفصيل..."
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline ml-1" />
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
            <DollarSign className="w-4 h-4 inline ml-1" />
            التكلفة المتوقعة
          </label>
          <Input
            type="number"
            name="estimatedCost"
            value={formData.estimatedCost}
            onChange={handleInputChange}
            placeholder="0.00"
            step="0.01"
            min="0"
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
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="أي ملاحظات إضافية..."
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">مراجعة البيانات</h2>
        <p className="text-gray-600">تأكد من صحة جميع البيانات قبل الإرسال</p>
      </div>

      <div className="space-y-4">
        {/* بيانات العميل */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center">
              <User className="w-5 h-5 ml-2" />
              بيانات العميل
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">الاسم:</span>
                <p className="text-gray-900">{formData.customerName || 'غير محدد'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">الهاتف:</span>
                <p className="text-gray-900">{formData.customerPhone || 'غير محدد'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">البريد الإلكتروني:</span>
                <p className="text-gray-900">{formData.customerEmail || 'غير محدد'}</p>
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
          <SimpleCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">النوع:</span>
                <p className="text-gray-900">{formData.deviceType || 'غير محدد'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">الماركة:</span>
                <p className="text-gray-900">{formData.deviceBrand || 'غير محدد'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">الموديل:</span>
                <p className="text-gray-900">{formData.deviceModel || 'غير محدد'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">الرقم التسلسلي:</span>
                <p className="text-gray-900">{formData.serialNumber || 'غير محدد'}</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* المتعلقات المستلمة */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center">
              <FileText className="w-5 h-5 ml-2" />
              المتعلقات المستلمة
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            {formData.accessories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formData.accessories.map((accessory, index) => (
                  <span key={accessory.id || index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {accessory.label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">لا توجد متعلقات مستلمة</p>
            )}
          </SimpleCardContent>
        </SimpleCard>

        {/* المشكلة */}
        <SimpleCard>
          <SimpleCardHeader>
            <SimpleCardTitle className="flex items-center">
              <FileText className="w-5 h-5 ml-2" />
              وصف المشكلة
            </SimpleCardTitle>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">الوصف:</span>
                <p className="text-gray-900">{formData.problemDescription || 'غير محدد'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">الأولوية:</span>
                <p className="text-gray-900">{formData.priority || 'غير محدد'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">التكلفة المتوقعة:</span>
                <p className="text-gray-900">{formData.estimatedCost ? `${formData.estimatedCost} ج.م` : 'غير محدد'}</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>
    </div>
  );

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

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 ml-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <SimpleCard>
          <SimpleCardContent className="p-6">
            {/* Step Content */}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <SimpleButton
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                السابق
              </SimpleButton>

              <div className="flex items-center space-x-2 space-x-reverse">
                {currentStep < totalSteps ? (
                  <SimpleButton
                    type="button"
                    onClick={nextStep}
                    disabled={
                      (currentStep === 1 && !formData.customerName.trim() && !selectedCustomer) ||
                      (currentStep === 2 && (!formData.deviceType || !formData.deviceBrand || !formData.deviceModel.trim())) ||
                      (currentStep === 3 && !formData.problemDescription.trim())
                    }
                  >
                    التالي
                  </SimpleButton>
                ) : (
                  <SimpleButton
                    type="submit"
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 ml-2" />
                        إنشاء طلب الإصلاح
                      </>
                    )}
                  </SimpleButton>
                )}
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </form>
    </div>
  );
};

export default NewRepairPageEnhanced;
