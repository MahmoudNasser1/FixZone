import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleBadge from '../../components/ui/SimpleBadge';
import { Input } from '../../components/ui/Input';
import { 
  Search, Plus, Download, Eye, Edit, Trash2, Calendar,
  Wrench, Clock, CheckCircle, Play, XCircle, RefreshCw
} from 'lucide-react';

const RepairsPage = () => {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [error, setError] = useState(null);

  // جلب البيانات من Backend
  useEffect(() => {
    fetchRepairs();
  }, []);

  const fetchRepairs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getRepairRequests();
      console.log('Repairs loaded:', data);
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
        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wrench className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">في الانتظار</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Play className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">قيد التنفيذ</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">مكتملة</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">ملغية</p>
                <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>

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
                <div key={repair.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 space-x-reverse mb-2">
                        <h3 className="font-bold text-lg text-blue-600">{repair.requestNumber}</h3>
                        <SimpleBadge variant={getStatusColor(repair.status)} size="sm">
                          {getStatusText(repair.status)}
                        </SimpleBadge>
                        <SimpleBadge variant={getPriorityColor(repair.priority)} size="sm">
                          {getPriorityText(repair.priority)}
                        </SimpleBadge>
                      </div>
                      
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
                    
                    <div className="flex items-center space-x-2 space-x-reverse mr-4">
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
                      <SimpleButton 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteRepair(repair.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </SimpleButton>
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
