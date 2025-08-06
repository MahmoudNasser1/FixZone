import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleBadge from '../../components/ui/SimpleBadge';
import { Input } from '../../components/ui/Input';
import { 
  Plus, Search, Filter, Download, RefreshCw, Building2,
  User, Phone, Mail, MapPin, Calendar, MoreHorizontal,
  Eye, Edit, Trash2, Users, UserCheck, UserX
} from 'lucide-react';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [error, setError] = useState(null);

  // جلب البيانات من Backend
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getCustomers();
      console.log('Customers loaded:', data);
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('حدث خطأ في تحميل بيانات العملاء');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      try {
        await apiService.deleteCustomer(customerId);
        setCustomers(customers.filter(customer => customer.id !== customerId));
        alert('تم حذف العميل بنجاح');
      } catch (err) {
        console.error('Error deleting customer:', err);
        alert('حدث خطأ في حذف العميل');
      }
    }
  };

  const handleRefresh = () => {
    fetchCustomers();
  };

  // فلترة العملاء
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
                         (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'vip') {
      const customFields = (() => {
        try {
          return typeof customer.customFields === 'string' 
            ? JSON.parse(customer.customFields) 
            : customer.customFields || {};
        } catch {
          return {};
        }
      })();
      return matchesSearch && customFields.isVip;
    }
    if (selectedFilter === 'active') return matchesSearch && customer.status === 'active';
    if (selectedFilter === 'inactive') return matchesSearch && customer.status === 'inactive';
    
    return matchesSearch;
  });

  // حساب الإحصائيات
  const stats = {
    total: customers.length,
    vip: customers.filter(customer => {
      const customFields = (() => {
        try {
          return typeof customer.customFields === 'string' 
            ? JSON.parse(customer.customFields) 
            : customer.customFields || {};
        } catch {
          return {};
        }
      })();
      return customFields.isVip;
    }).length,
    active: customers.filter(customer => customer.status === 'active').length,
    inactive: customers.filter(customer => customer.status === 'inactive').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل بيانات العملاء...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">إدارة العملاء</h1>
        <Link to="/customers/new">
          <SimpleButton className="flex items-center space-x-2 space-x-reverse">
            <Plus className="w-4 h-4" />
            <span>عميل جديد</span>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي العملاء</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">عملاء VIP</p>
                <p className="text-2xl font-bold text-gray-900">{stats.vip}</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">نشط</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">غير نشط</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
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
                  placeholder="البحث في العملاء... (الاسم، الهاتف، البريد الإلكتروني)"
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
                <option value="all">جميع العملاء</option>
                <option value="vip">عملاء VIP</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
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
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* جدول العملاء */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle>قائمة العملاء ({filteredCustomers.length})</SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد عملاء</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 font-medium text-gray-700">العميل</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">معلومات الاتصال</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">الحالة</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">تاريخ التسجيل</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => {
                    const customFields = (() => {
                      try {
                        return typeof customer.customFields === 'string' 
                          ? JSON.parse(customer.customFields) 
                          : customer.customFields || {};
                      } catch {
                        return {};
                      }
                    })();

                    return (
                      <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="mr-3">
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <p className="font-medium text-gray-900">{customer.name}</p>
                                {customFields.isVip && (
                                  <SimpleBadge variant="default" size="sm">VIP</SimpleBadge>
                                )}
                              </div>
                              {customer.companyId && (
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <Building2 className="w-3 h-3 ml-1" />
                                  شركة
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-3 h-3 ml-2" />
                              <span className="en-text">{customer.phone}</span>
                            </div>
                            {customer.email && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="w-3 h-3 ml-2" />
                                <span className="en-text">{customer.email}</span>
                              </div>
                            )}
                            {customer.address && (
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="w-3 h-3 ml-2" />
                                <span>{customer.address}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <SimpleBadge 
                            variant={customer.status === 'active' ? 'success' : 'secondary'}
                            size="sm"
                          >
                            {customer.status === 'active' ? 'نشط' : 'غير نشط'}
                          </SimpleBadge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-3 h-3 ml-2" />
                            {new Date(customer.createdAt).toLocaleDateString('ar-SA')}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Link to={`/customers/${customer.id}`}>
                              <SimpleButton variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </SimpleButton>
                            </Link>
                            <Link to={`/customers/${customer.id}/edit`}>
                              <SimpleButton variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </SimpleButton>
                            </Link>
                            <SimpleButton 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </SimpleButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SimpleCardContent>
      </SimpleCard>
    </div>
  );
};

export default CustomersPage;
