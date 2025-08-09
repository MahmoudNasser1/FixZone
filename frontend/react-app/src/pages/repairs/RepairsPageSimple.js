import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleBadge from '../../components/ui/SimpleBadge';
import { Search, Plus, Download, Filter, Eye, Edit, Trash2, Calendar, Wrench, Clock, CheckCircle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

const RepairsPageSimple = () => {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { formatMoney } = useSettings();

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
      // بيانات تجريبية
      setRepairs([
        {
          id: 1,
          requestNumber: 'REP-2024-001',
          customerName: 'أحمد محمد السعيد',
          customerPhone: '0501234567',
          deviceType: 'لابتوب',
          deviceBrand: 'Dell',
          problemDescription: 'الجهاز لا يعمل',
          status: 'pending',
          priority: 'high',
          estimatedCost: 500,
          createdAt: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          requestNumber: 'REP-2024-002',
          customerName: 'فاطمة أحمد',
          customerPhone: '0512345678',
          deviceType: 'هاتف ذكي',
          deviceBrand: 'Samsung',
          problemDescription: 'الشاشة مكسورة',
          status: 'completed',
          priority: 'medium',
          estimatedCost: 300,
          createdAt: '2024-01-16T14:20:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'in_progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
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

  const stats = {
    total: repairs.length,
    pending: repairs.filter(r => r.status === 'pending').length,
    completed: repairs.filter(r => r.status === 'completed').length
  };

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
        </div>
      )}

      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      {/* قائمة الطلبات */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle>قائمة طلبات الإصلاح ({repairs.length})</SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          {repairs.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد طلبات إصلاح</p>
            </div>
          ) : (
            <div className="space-y-4">
              {repairs.map((repair) => (
                <div key={repair.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 space-x-reverse mb-2">
                        <h3 className="font-bold text-lg">{repair.requestNumber}</h3>
                        <SimpleBadge variant={getStatusVariant(repair.status)} size="sm">
                          {getStatusText(repair.status)}
                        </SimpleBadge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p><strong>العميل:</strong> {repair.customerName}</p>
                          <p><strong>الهاتف:</strong> {repair.customerPhone}</p>
                        </div>
                        <div>
                          <p><strong>الجهاز:</strong> {repair.deviceType} - {repair.deviceBrand}</p>
                          <p><strong>التكلفة:</strong> {formatMoney(repair.estimatedCost || 0)}</p>
                        </div>
                      </div>
                      
                      <p className="mt-2 text-gray-700">
                        <strong>المشكلة:</strong> {repair.problemDescription}
                      </p>
                      
                      <p className="mt-2 text-sm text-gray-500">
                        <strong>تاريخ الإنشاء:</strong> {new Date(repair.createdAt).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Link to={`/repairs/${repair.id}`}>
                        <SimpleButton variant="outline" size="sm">
                          عرض التفاصيل
                        </SimpleButton>
                      </Link>
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

export default RepairsPageSimple;
