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
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const [formData, setFormData] = useState({
    customerId: searchParams.get('customerId') || '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deviceType: '',
    deviceBrand: '',
    deviceModel: '',
    serialNumber: '',
    problemDescription: '',
    priority: 'medium',
    estimatedCost: '',
    notes: ''
  });

  useEffect(() => {
    fetchCustomers();
    if (searchParams.get('customerId')) {
      fetchCustomerDetails(searchParams.get('customerId'));
    }
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await apiService.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
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
        deviceType: formData.deviceType.trim(),
        deviceBrand: formData.deviceBrand.trim() || null,
        deviceModel: formData.deviceModel.trim() || null,
        serialNumber: formData.serialNumber.trim() || null,
        problemDescription: formData.problemDescription.trim(),
        priority: formData.priority,
        estimatedCost: parseFloat(formData.estimatedCost) || 0,
        notes: formData.notes.trim() || null,
        status: 'pending'
      };

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

  const deviceTypes = [
    { value: 'laptop', label: 'لابتوب', icon: Laptop },
    { value: 'smartphone', label: 'هاتف ذكي', icon: Smartphone },
    { value: 'tablet', label: 'تابلت', icon: Tablet },
    { value: 'desktop', label: 'كمبيوتر مكتبي', icon: Laptop },
    { value: 'printer', label: 'طابعة', icon: Wrench },
    { value: 'other', label: 'أخرى', icon: Wrench }
  ];

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
            {/* اختيار عميل موجود */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اختيار عميل موجود (اختياري)
              </label>
              <select
                value={formData.customerId}
                onChange={handleCustomerSelect}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- عميل جديد --</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </select>
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
                  {deviceTypes.map(type => (
                    <option key={type.value} value={type.label}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الماركة/الشركة المصنعة
                </label>
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
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  التكلفة المتوقعة (ر.س)
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
