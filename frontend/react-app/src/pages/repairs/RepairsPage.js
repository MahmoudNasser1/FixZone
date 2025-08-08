import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiService from '../../services/api';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleBadge from '../../components/ui/SimpleBadge';
import RepairTimeline from '../../components/ui/RepairTimeline';
import QuickStatsCard from '../../components/ui/QuickStatsCard';
import { Input } from '../../components/ui/Input';
import { 
  Search, Plus, Download, Eye, Edit, Trash2, Calendar,
  Wrench, Clock, CheckCircle, Play, XCircle, RefreshCw, User, DollarSign
} from 'lucide-react';

const RepairsPage = () => {
  const [searchParams] = useSearchParams();
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [error, setError] = useState(null);
  const [customerFilter, setCustomerFilter] = useState(null);
  const [customerName, setCustomerName] = useState('');

  // معالجة URL parameters
  useEffect(() => {
    const customerId = searchParams.get('customerId');
    if (customerId) {
      setCustomerFilter(customerId);
      // جلب اسم العميل لعرضه في الفلتر
      fetchCustomerName(customerId);
    }
  }, [searchParams]);

  // جلب البيانات من Backend
  useEffect(() => {
    fetchRepairs();
  }, [customerFilter]);

  const fetchCustomerName = async (customerId) => {
    try {
      const customer = await apiService.getCustomer(customerId);
      setCustomerName(customer.name);
    } catch (err) {
      console.error('Error fetching customer name:', err);
      setCustomerName('عميل غير معروف');
    }
  };

  const fetchRepairs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // بناء معاملات الفلترة
      const filters = {};
      if (customerFilter) {
        filters.customerId = customerFilter;
      }
      
      const data = await apiService.getRepairRequests(filters);
      console.log('Repairs loaded:', data, 'with filters:', filters);
      setRepairs(data);
    } catch (err) {
      console.error('Error fetching repairs:', err);
      setError('حدث خطأ في تحميل بيانات طلبات الإصلاح');
      // بيانات تجريبية في حالة الخطأ
      setRepairs([
        {
          id: 1,
          requestNumber: 'REP-2024-001',
          customerName: 'أحمد محمد السعيد',
          customerPhone: '0501234567',
          deviceType: 'لابتوب',
          deviceBrand: 'Dell',
          deviceModel: 'Inspiron 15',
          problemDescription: 'الجهاز لا يعمل عند الضغط على زر التشغيل',
          status: 'pending',
          priority: 'high',
          estimatedCost: 500,
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          requestNumber: 'REP-2024-002',
          customerName: 'فاطمة أحمد',
          customerPhone: '0512345678',
          deviceType: 'هاتف ذكي',
          deviceBrand: 'Samsung',
          deviceModel: 'Galaxy S21',
          problemDescription: 'الشاشة مكسورة',
          status: 'in_progress',
          priority: 'medium',
          estimatedCost: 300,
          createdAt: '2024-01-16T14:20:00Z',
          updatedAt: '2024-01-16T16:45:00Z'
        },
        {
          id: 3,
          requestNumber: 'REP-2024-003',
          customerName: 'محمد علي',
          customerPhone: '0523456789',
          deviceType: 'تابلت',
          deviceBrand: 'iPad',
          deviceModel: 'Air 4',
          problemDescription: 'البطارية لا تشحن',
          status: 'completed',
          priority: 'low',
          estimatedCost: 200,
          createdAt: '2024-01-10T09:15:00Z',
          updatedAt: '2024-01-14T11:30:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRepair = async (repairId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      try {
        await apiService.deleteRepairRequest(repairId);
        setRepairs(repairs.filter(repair => repair.id !== repairId));
        alert('تم حذف الطلب بنجاح');
      } catch (err) {
        console.error('Error deleting repair:', err);
        alert('حدث خطأ في حذف الطلب');
      }
    }
  };

  const handleRefresh = () => {
    fetchRepairs();
  };

  // فلترة الطلبات
  const filteredRepairs = repairs.filter(repair => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (repair.requestNumber || '').toLowerCase().includes(searchLower) ||
      (repair.customerName || '').toLowerCase().includes(searchLower) ||
      (repair.customerPhone || '').includes(searchTerm) ||
      (repair.deviceType || '').toLowerCase().includes(searchLower) ||
      (repair.deviceBrand || '').toLowerCase().includes(searchLower) ||
      (repair.problemDescription || '').toLowerCase().includes(searchLower);
    
    if (selectedFilter === 'all') return matchesSearch;
    return matchesSearch && repair.status === selectedFilter;
  });

  // حساب الإحصائيات
  const stats = {
    total: repairs.length,
    pending: repairs.filter(repair => repair.status === 'pending').length,
    inProgress: repairs.filter(repair => repair.status === 'in_progress').length,
    completed: repairs.filter(repair => repair.status === 'completed').length,
    cancelled: repairs.filter(repair => repair.status === 'cancelled').length
  };

  // دالة لتحديد لون الحالة
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  // دالة لتحديد نص الحالة
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'in_progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  // دالة لتحديد لون الأولوية
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  // دالة لتحديد نص الأولوية
  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return 'عالية';
      case 'medium': return 'متوسطة';
      case 'low': return 'منخفضة';
      default: return priority;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل طلبات الإصلاح...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">طلبات الإصلاح</h1>
        <Link to="/repairs/new">
          <SimpleButton className="flex items-center space-x-2 space-x-reverse">
            <Plus className="w-4 h-4" />
            <span>طلب إصلاح جديد</span>
          </SimpleButton>
        </Link>
      </div>

      {/* رسالة الخطأ */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
          <SimpleButton 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            className="mr-2"
          >
            إعادة المحاولة
          </SimpleButton>
        </div>
      )}

      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <QuickStatsCard
          title="إجمالي الطلبات"
          value={repairs.length}
          previousValue={Math.floor(repairs.length * 0.85)} // تقدير للفترة السابقة
          icon={Wrench}
          color="blue"
        />
        <QuickStatsCard
          title="قيد التنفيذ"
          value={repairs.filter(r => r.status === 'in-progress').length}
          previousValue={Math.floor(repairs.filter(r => r.status === 'in-progress').length * 0.9)}
          icon={Play}
          color="yellow"
        />
        <QuickStatsCard
          title="مكتملة"
          value={repairs.filter(r => r.status === 'completed').length}
          previousValue={Math.floor(repairs.filter(r => r.status === 'completed').length * 0.8)}
          icon={CheckCircle}
          color="green"
        />
        <QuickStatsCard
          title="في الانتظار"
          value={repairs.filter(r => r.status === 'pending').length}
          previousValue={Math.floor(repairs.filter(r => r.status === 'pending').length * 1.2)}
          icon={Clock}
          color="gray"
        />
        <QuickStatsCard
          title="إجمالي الإيرادات"
          value={repairs.reduce((sum, r) => sum + (parseFloat(r.estimatedCost) || 0), 0)}
          previousValue={repairs.reduce((sum, r) => sum + (parseFloat(r.estimatedCost) || 0), 0) * 0.85}
          icon={DollarSign}
          color="purple"
          format="currency"
        />
      </div>

      {/* عرض فلتر العميل */}
      {customerFilter && (
        <SimpleCard className="border-blue-200 bg-blue-50">
          <SimpleCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center ml-3">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">عرض طلبات العميل:</p>
                  <p className="text-blue-800 font-semibold">{customerName || 'جاري التحميل...'}</p>
                </div>
              </div>
              <Link to="/repairs">
                <SimpleButton variant="outline" size="sm">
                  <XCircle className="w-4 h-4 ml-2" />
                  إزالة الفلتر
                </SimpleButton>
              </Link>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      )}

      {/* أدوات البحث والفلترة */}
      <SimpleCard>
        <SimpleCardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في الطلبات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 w-64"
                />
              </div>
              
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الطلبات</option>
                <option value="pending">في الانتظار</option>
                <option value="in_progress">قيد التنفيذ</option>
                <option value="completed">مكتملة</option>
                <option value="cancelled">ملغية</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <SimpleButton variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 ml-2" />
                تحديث
              </SimpleButton>
              <SimpleButton variant="outline" size="sm">
                <Download className="w-4 h-4 ml-2" />
                تصدير
              </SimpleButton>
              <Link to="/repairs/new">
                <SimpleButton size="sm">
                  <Plus className="w-4 h-4 ml-2" />
                  طلب جديد
                </SimpleButton>
              </Link>
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* جدول طلبات الإصلاح */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle>قائمة طلبات الإصلاح ({filteredRepairs.length})</SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          {filteredRepairs.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد طلبات إصلاح</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRepairs.map((repair) => (
                <div key={repair.id} className="bg-white border rounded-lg hover:shadow-lg transition-all duration-200">
                  {/* Header with Timeline */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg text-blue-600">{repair.requestNumber}</h3>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Link to={`/repairs/${repair.id}`}>
                          <SimpleButton variant="outline" size="sm">
                            <Eye className="w-4 h-4 ml-1" />
                            عرض
                          </SimpleButton>
                        </Link>
                        <Link to={`/repairs/${repair.id}/edit`}>
                          <SimpleButton variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </SimpleButton>
                        </Link>
                      </div>
                    </div>
                    
                    {/* Compact Timeline */}
                    <RepairTimeline repair={repair} compact={true} />
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <p><strong>العميل:</strong> {repair.customerName}</p>
                        <p><strong>الهاتف:</strong> <span className="en-text">{repair.customerPhone}</span></p>
                      </div>
                      <div>
                        <p><strong>الجهاز:</strong> {repair.deviceType}</p>
                        <p><strong>الماركة:</strong> {repair.deviceBrand} {repair.deviceModel}</p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-gray-700">
                        <strong>المشكلة:</strong> {repair.problemDescription}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 ml-2" />
                        <span>{new Date(repair.createdAt).toLocaleDateString('ar-SA')}</span>
                      </div>
                      <div className="font-medium text-gray-900">
                        التكلفة: {repair.estimatedCost} ر.س
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SimpleCardContent>
      </SimpleCard>
    </div>
  );
};

export default RepairsPage;
