import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { DataTable } from '../components/ui/DataTable';
import { Input } from '../components/ui/Input';
import { 
  Plus, Search, Filter, Download, RefreshCw, 
  Users, Building, Phone, Mail, MapPin,
  Eye, Edit, Trash2, MoreHorizontal, UserPlus,
  Calendar, Star, AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/DropdownMenu";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, individual, company

  // بيانات تجريبية للعملاء
  const sampleCustomers = [
    {
      id: 1,
      name: 'أحمد محمد علي',
      email: 'ahmed.mohammed@email.com',
      phone: '+966501234567',
      type: 'individual',
      city: 'الرياض',
      totalRepairs: 5,
      lastRepair: '2024-01-15',
      status: 'active',
      rating: 4.8,
      joinDate: '2023-06-15',
      notes: 'عميل مميز، يفضل التواصل عبر الواتساب'
    },
    {
      id: 2,
      name: 'شركة التقنية المتقدمة',
      email: 'info@advancedtech.com',
      phone: '+966112345678',
      type: 'company',
      city: 'جدة',
      totalRepairs: 23,
      lastRepair: '2024-01-14',
      status: 'active',
      rating: 4.9,
      joinDate: '2022-03-10',
      contactPerson: 'سارة أحمد',
      notes: 'عقد صيانة سنوي، خصم 15%'
    },
    {
      id: 3,
      name: 'فاطمة سعد الغامدي',
      email: 'fatima.saad@email.com',
      phone: '+966503456789',
      type: 'individual',
      city: 'الدمام',
      totalRepairs: 2,
      lastRepair: '2024-01-10',
      status: 'active',
      rating: 4.5,
      joinDate: '2023-11-20',
      notes: 'تفضل الاتصال المسائي'
    },
    {
      id: 4,
      name: 'مؤسسة الأعمال الذكية',
      email: 'contact@smartbusiness.sa',
      phone: '+966114567890',
      type: 'company',
      city: 'الرياض',
      totalRepairs: 12,
      lastRepair: '2024-01-08',
      status: 'inactive',
      rating: 4.2,
      joinDate: '2023-01-15',
      contactPerson: 'محمد العتيبي',
      notes: 'تأخير في السداد'
    }
  ];

  useEffect(() => {
    // محاكاة تحميل البيانات
    setTimeout(() => {
      setCustomers(sampleCustomers);
      setLoading(false);
    }, 1000);
  }, []);

  // تصفية العملاء حسب النوع والبحث
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm);
    
    const matchesType = filterType === 'all' || customer.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const columns = [
    {
      accessorKey: 'name',
      header: 'اسم العميل',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
              customer.type === 'company' ? 'bg-blue-600' : 'bg-green-600'
            }`}>
              {customer.type === 'company' ? (
                <Building className="w-5 h-5" />
              ) : (
                customer.name.charAt(0)
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {customer.name}
              </div>
              {customer.contactPerson && (
                <div className="text-sm text-gray-500">
                  جهة الاتصال: {customer.contactPerson}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'النوع',
      cell: ({ row }) => {
        const type = row.getValue('type');
        return (
          <Badge variant={type === 'company' ? 'default' : 'secondary'}>
            {type === 'company' ? 'شركة' : 'فرد'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'رقم الهاتف',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2 space-x-reverse">
          <Phone className="w-4 h-4 text-gray-400" />
          <span className="font-mono">{row.getValue('phone')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'البريد الإلكتروني',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2 space-x-reverse">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-blue-600 hover:text-blue-800">
            {row.getValue('email')}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'city',
      header: 'المدينة',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2 space-x-reverse">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span>{row.getValue('city')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'totalRepairs',
      header: 'عدد الطلبات',
      cell: ({ row }) => (
        <div className="text-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {row.getValue('totalRepairs')}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'rating',
      header: 'التقييم',
      cell: ({ row }) => {
        const rating = row.getValue('rating');
        return (
          <div className="flex items-center space-x-1 space-x-reverse">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="font-medium">{rating}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => {
        const status = row.getValue('status');
        return (
          <Badge variant={status === 'active' ? 'success' : 'secondary'}>
            {status === 'active' ? 'نشط' : 'غير نشط'}
          </Badge>
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
                  عرض التفاصيل
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/customers/${customer.id}/edit`}>
                  <Edit className="w-4 h-4 ml-2" />
                  تعديل
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={`/repairs/new?customer=${customer.id}`}>
                  <Plus className="w-4 h-4 ml-2" />
                  طلب إصلاح جديد
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
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
    individuals: customers.filter(c => c.type === 'individual').length,
    companies: customers.filter(c => c.type === 'company').length,
    active: customers.filter(c => c.status === 'active').length,
  };

  const pageActions = (
    <>
      <Button variant="outline" size="sm" onClick={() => setFilterType('all')}>
        <Filter className="w-4 h-4 ml-2" />
        الكل ({stats.total})
      </Button>
      <Button 
        variant={filterType === 'individual' ? 'default' : 'outline'} 
        size="sm" 
        onClick={() => setFilterType('individual')}
      >
        <Users className="w-4 h-4 ml-2" />
        أفراد ({stats.individuals})
      </Button>
      <Button 
        variant={filterType === 'company' ? 'default' : 'outline'} 
        size="sm" 
        onClick={() => setFilterType('company')}
      >
        <Building className="w-4 h-4 ml-2" />
        شركات ({stats.companies})
      </Button>
      <Button variant="outline" size="sm">
        <Download className="w-4 h-4 ml-2" />
        تصدير
      </Button>
      <Button size="sm" asChild>
        <Link to="/customers/new">
          <UserPlus className="w-4 h-4 ml-2" />
          عميل جديد
        </Link>
      </Button>
    </>
  );

  return (
    <MainLayout 
      pageTitle="إدارة العملاء"
      pageActions={pageActions}
      showBreadcrumb={true}
    >
      <div className="space-y-6">
        {/* الإحصائيات السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    العملاء النشطين
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.active}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                  <UserPlus className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    الأفراد
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.individuals}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    الشركات
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.companies}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/20">
                  <Building className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* شريط البحث والفلاتر */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="البحث في العملاء (الاسم، البريد، الهاتف)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* جدول العملاء */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>قائمة العملاء</CardTitle>
              <div className="text-sm text-gray-500">
                عرض {filteredCustomers.length} من {customers.length} عميل
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={filteredCustomers}
              searchKey="name"
              searchPlaceholder="البحث في العملاء..."
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Customers;
