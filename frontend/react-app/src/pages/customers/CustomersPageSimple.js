import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleBadge from '../../components/ui/SimpleBadge';
import { Plus, User, Phone, Mail, Eye, Edit, Trash2 } from 'lucide-react';

const CustomersPageSimple = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
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
      console.log('Customers data:', data);
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('حدث خطأ في تحميل بيانات العملاء');
      // استخدام بيانات تجريبية في حالة الخطأ
      setCustomers([
        {
          id: 1,
          name: 'أحمد محمد السعيد',
          phone: '0501234567',
          email: 'ahmed.mohammed@email.com',
          address: 'الرياض، حي الربيع',
          createdAt: '2023-01-15',
          customFields: '{"isVip": true}',
          status: 'active'
        },
        {
          id: 2,
          name: 'فاطمة أحمد علي',
          phone: '0507654321',
          email: 'fatima.ali@email.com',
          address: 'جدة، حي الصفا',
          createdAt: '2023-02-20',
          customFields: '{"isVip": false}',
          status: 'active'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      try {
        await apiService.deleteCustomer(customerId);
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('حدث خطأ في حذف العميل');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل العملاء...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          إدارة العملاء
        </h1>
        <Link to="/customers/new">
          <SimpleButton>
            <Plus className="w-4 h-4 ml-2" />
            عميل جديد
          </SimpleButton>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي العملاء</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">عملاء نشطين</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customers.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <User className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">عملاء VIP</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customers.filter(c => {
                    try {
                      const customFields = typeof c.customFields === 'string' 
                        ? JSON.parse(c.customFields) 
                        : c.customFields;
                      return customFields?.isVip;
                    } catch {
                      return false;
                    }
                  }).length}
                </p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">عملاء شركات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customers.filter(c => c.companyId).length}
                </p>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>

      {/* Customers Table */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle>قائمة العملاء</SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    العميل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    معلومات الاتصال
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    العنوان
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.name}
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            {(() => {
                              try {
                                const customFields = typeof customer.customFields === 'string' 
                                  ? JSON.parse(customer.customFields) 
                                  : customer.customFields;
                                return customFields?.isVip && (
                                  <SimpleBadge variant="default" size="sm">VIP</SimpleBadge>
                                );
                              } catch {
                                return null;
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 text-gray-400 ml-2" />
                          {customer.phone}
                        </div>
                        {customer.email && (
                          <div className="flex items-center mt-1">
                            <Mail className="w-4 h-4 text-gray-400 ml-2" />
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.address || 'غير محدد'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SimpleBadge 
                        variant={customer.status === 'active' ? 'success' : 'secondary'}
                        size="sm"
                      >
                        {customer.status === 'active' ? 'نشط' : 'غير نشط'}
                      </SimpleBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteCustomer(customer.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </SimpleButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SimpleCardContent>
      </SimpleCard>
    </div>
  );
};

export default CustomersPageSimple;
