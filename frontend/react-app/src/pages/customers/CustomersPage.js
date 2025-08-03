import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Input } from '../../components/ui/Input';
import { 
  Plus, Search, Filter, Download, RefreshCw, Building2,
  User, Phone, Mail, MapPin, Calendar, MoreHorizontal,
  Eye, Edit, Trash2, Users, UserCheck, UserX
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/DropdownMenu";

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // بيانات تجريبية للعملاء (سيتم استبدالها بـ API calls)
  const sampleCustomers = [
    {
      id: 1,
      name: 'أحمد محمد السعيد',
      phone: '0501234567',
      email: 'ahmed.mohammed@email.com',
      address: 'الرياض، حي النرجس',
      companyId: 1,
      companyName: 'شركة التقنية المتقدمة',
      totalRepairs: 12,
      lastRepairDate: '2024-01-15',
      status: 'active',
      createdAt: '2023-06-15',
      customFields: {
        preferredContact: 'phone',
        vipCustomer: true
      }
    },
    {
      id: 2,
      name: 'فاطمة أحمد العلي',
      phone: '0507654321',
      email: 'fatima.ali@email.com',
      address: 'جدة، حي الصفا',
      companyId: null,
      companyName: null,
      totalRepairs: 5,
      lastRepairDate: '2024-01-10',
      status: 'active',
      createdAt: '2023-08-20',
      customFields: {
        preferredContact: 'email',
        vipCustomer: false
      }
    },
    {
      id: 3,
      name: 'عبدالله سعد المطيري',
      phone: '0551234567',
      email: 'abdullah.saad@email.com',
      address: 'الدمام، حي الشاطئ',
      companyId: 2,
      companyName: 'مؤسسة الخليج للتجارة',
      totalRepairs: 8,
      lastRepairDate: '2023-12-28',
      status: 'inactive',
      createdAt: '2023-04-10',
      customFields: {
        preferredContact: 'phone',
        vipCustomer: false
      }
    },
    {
      id: 4,
      name: 'سارة محمد الزهراني',
      phone: '0509876543',
      email: 'sara.alzahrani@email.com',
      address: 'مكة المكرمة، العزيزية',
      companyId: null,
      companyName: null,
      totalRepairs: 15,
      lastRepairDate: '2024-01-12',
      status: 'active',
      createdAt: '2023-03-05',
      customFields: {
        preferredContact: 'email',
        vipCustomer: true
      }
    }
  ];

  useEffect(() => {
    // محاكاة تحميل البيانات
    setTimeout(() => {
      setCustomers(sampleCustomers);
      setLoading(false);
    }, 1000);
  }, []);

  // تعريف أعمدة الجدول
  const columns = [
    {
      accessorKey: 'name',
      header: 'اسم العميل',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {customer.name}
              </div>
              <div className="flex items-center space-x-2 space-x-reverse mt-1">
                {customer.customFields?.vipCustomer && (
                  <Badge variant="default" size="sm">VIP</Badge>
                )}
                <Badge 
                  variant={customer.status === 'active' ? 'success' : 'secondary'}
                  size="sm"
                >
                  {customer.status === 'active' ? 'نشط' : 'غير نشط'}
                </Badge>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'contact',
      header: 'معلومات الاتصال',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-2 space-x-reverse text-sm">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="en-text">{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="en-text">{customer.email}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'company',
      header: 'الشركة',
      cell: ({ row }) => {
        const customer = row.original;
        return customer.companyName ? (
          <div className="flex items-center space-x-2 space-x-reverse">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{customer.companyName}</span>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">عميل فردي</span>
        );
      },
    },
    {
      accessorKey: 'address',
      header: 'العنوان',
      cell: ({ row }) => {
        const customer = row.original;
        return customer.address ? (
          <div className="flex items-center space-x-2 space-x-reverse">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{customer.address}</span>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">غير محدد</span>
        );
      },
    },
    {
      accessorKey: 'repairs',
      header: 'الطلبات',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {customer.totalRepairs}
            </div>
            <div className="text-xs text-gray-500">
              آخر طلب: {new Date(customer.lastRepairDate).toLocaleDateString('ar-SA')}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'تاريخ التسجيل',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center space-x-2 space-x-reverse text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{new Date(customer.createdAt).toLocaleDateString('ar-SA')}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'الإجراءات',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/customers/${customer.id}`}>
                  <Eye className="w-4 h-4 ml-2" />
                  عرض الملف
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/customers/${customer.id}/edit`}>
                  <Edit className="w-4 h-4 ml-2" />
                  تعديل
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/customers/${customer.id}/repairs`}>
                  <Users className="w-4 h-4 ml-2" />
                  طلبات الإصلاح
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => handleDeleteCustomer(customer.id)}
              >
                <Trash2 className="w-4 h-4 ml-2" />
                حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // إحصائيات سريعة
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    inactive: customers.filter(c => c.status === 'inactive').length,
    vip: customers.filter(c => c.customFields?.vipCustomer).length,
    withCompany: customers.filter(c => c.companyId).length
  };

  const handleDeleteCustomer = (customerId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      setCustomers(customers.filter(c => c.id !== customerId));
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    // محاكاة إعادة تحميل البيانات
    setTimeout(() => {
      setCustomers(sampleCustomers);
      setLoading(false);
    }, 1000);
  };

  const pageActions = (
    <>
      <Button variant="outline" size="sm" onClick={handleRefresh}>
        <RefreshCw className="w-4 h-4 ml-2" />
        تحديث
      </Button>
      <Button variant="outline" size="sm">
        <Download className="w-4 h-4 ml-2" />
        تصدير
      </Button>
      <Button variant="outline" size="sm">
        <Filter className="w-4 h-4 ml-2" />
        فلترة
      </Button>
      <Button size="sm" asChild>
        <Link to="/customers/new">
          <Plus className="w-4 h-4 ml-2" />
          عميل جديد
        </Link>
      </Button>
    </>
  );

  return (
    <div className="space-y-6">
        {/* الإحصائيات السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    إجمالي العملاء
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.total}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    عملاء نشطين
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.active}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                  <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    غير نشطين
                  </p>
                  <p className="text-2xl font-bold text-gray-600">
                    {stats.inactive}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700">
                  <UserX className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    عملاء VIP
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.vip}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                  <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    عملاء شركات
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.withCompany}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/20">
                  <Building2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* جدول العملاء */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>قائمة العملاء</CardTitle>
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="البحث في العملاء..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={customers}
              searchKey="name"
              searchPlaceholder="البحث في أسماء العملاء..."
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
  );
};

export default CustomersPage;
