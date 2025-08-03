import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { DataTable } from '../components/ui/DataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { 
  Edit, Phone, Mail, MapPin, Building, User, 
  Calendar, Star, Wrench, FileText, Plus,
  Eye, Clock, CheckCircle, AlertCircle, XCircle
} from 'lucide-react';

const CustomerDetails = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);

  // بيانات تجريبية للعميل
  const sampleCustomer = {
    id: 1,
    name: 'أحمد محمد علي',
    email: 'ahmed.mohammed@email.com',
    phone: '+966501234567',
    alternativePhone: '+966112345678',
    type: 'individual',
    city: 'الرياض',
    district: 'العليا',
    street: 'شارع الملك فهد',
    buildingNumber: '123',
    postalCode: '12345',
    totalRepairs: 5,
    lastRepair: '2024-01-15',
    status: 'active',
    rating: 4.8,
    joinDate: '2023-06-15',
    notes: 'عميل مميز، يفضل التواصل عبر الواتساب',
    preferredContactMethod: 'whatsapp',
    totalSpent: 2850,
    averageRepairCost: 570
  };

  // بيانات تجريبية لطلبات الإصلاح
  const sampleRepairs = [
    {
      id: 1,
      requestNumber: 'REQ-001',
      device: 'iPhone 13 Pro',
      issue: 'شاشة مكسورة',
      status: 'completed',
      priority: 'high',
      cost: 650,
      createdAt: '2024-01-15',
      completedAt: '2024-01-17',
      technician: 'محمد علي',
      notes: 'تم استبدال الشاشة بالكامل'
    },
    {
      id: 2,
      requestNumber: 'REQ-045',
      device: 'Samsung Galaxy S21',
      issue: 'بطارية لا تشحن',
      status: 'in_progress',
      priority: 'medium',
      cost: 320,
      createdAt: '2024-01-10',
      technician: 'سارة محمد',
      notes: 'في انتظار وصول البطارية'
    },
    {
      id: 3,
      requestNumber: 'REQ-023',
      device: 'iPad Air',
      issue: 'لا يعمل اللمس',
      status: 'completed',
      priority: 'low',
      cost: 480,
      createdAt: '2023-12-20',
      completedAt: '2023-12-22',
      technician: 'أحمد حسن',
      notes: 'تم استبدال شاشة اللمس'
    }
  ];

  useEffect(() => {
    // محاكاة تحميل البيانات
    setTimeout(() => {
      setCustomer(sampleCustomer);
      setRepairs(sampleRepairs);
      setLoading(false);
    }, 1000);
  }, [id]);

  const repairColumns = [
    {
      accessorKey: 'requestNumber',
      header: 'رقم الطلب',
      cell: ({ row }) => (
        <Link 
          to={`/repairs/${row.original.id}`}
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          {row.getValue('requestNumber')}
        </Link>
      ),
    },
    {
      accessorKey: 'device',
      header: 'الجهاز',
    },
    {
      accessorKey: 'issue',
      header: 'المشكلة',
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => {
        const status = row.getValue('status');
        const statusMap = {
          pending: { label: 'معلق', variant: 'secondary', icon: Clock },
          in_progress: { label: 'قيد التنفيذ', variant: 'default', icon: Wrench },
          completed: { label: 'مكتمل', variant: 'success', icon: CheckCircle },
          cancelled: { label: 'ملغي', variant: 'destructive', icon: XCircle }
        };
        const statusInfo = statusMap[status] || { label: status, variant: 'secondary', icon: AlertCircle };
        const IconComponent = statusInfo.icon;
        
        return (
          <Badge variant={statusInfo.variant} className="flex items-center space-x-1 space-x-reverse">
            <IconComponent className="w-3 h-3" />
            <span>{statusInfo.label}</span>
          </Badge>
        );
      },
    },
    {
      accessorKey: 'cost',
      header: 'التكلفة',
      cell: ({ row }) => (
        <span className="font-medium">
          {row.getValue('cost')} ر.س
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'تاريخ الطلب',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {new Date(row.getValue('createdAt')).toLocaleDateString('ar-SA')}
        </span>
      ),
    },
    {
      accessorKey: 'technician',
      header: 'الفني',
    },
    {
      id: 'actions',
      header: 'الإجراءات',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/repairs/${row.original.id}`}>
            <Eye className="w-4 h-4" />
          </Link>
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <MainLayout showBreadcrumb={true}>
        <div className="flex items-center justify-center min-h-96">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!customer) {
    return (
      <MainLayout showBreadcrumb={true}>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            العميل غير موجود
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            لم يتم العثور على العميل المطلوب
          </p>
          <Button asChild className="mt-4">
            <Link to="/customers">العودة لقائمة العملاء</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const pageActions = (
    <>
      <Button variant="outline" asChild>
        <Link to={`/repairs/new?customer=${customer.id}`}>
          <Plus className="w-4 h-4 ml-2" />
          طلب إصلاح جديد
        </Link>
      </Button>
      <Button asChild>
        <Link to={`/customers/${customer.id}/edit`}>
          <Edit className="w-4 h-4 ml-2" />
          تعديل البيانات
        </Link>
      </Button>
    </>
  );

  return (
    <MainLayout 
      pageTitle={customer.name}
      pageActions={pageActions}
      showBreadcrumb={true}
    >
      <div className="space-y-6">
        {/* معلومات العميل الأساسية */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* البطاقة الشخصية */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                  customer.type === 'company' ? 'bg-blue-600' : 'bg-green-600'
                }`}>
                  {customer.type === 'company' ? (
                    <Building className="w-8 h-8" />
                  ) : (
                    customer.name.charAt(0)
                  )}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl">{customer.name}</CardTitle>
                  <div className="flex items-center space-x-4 space-x-reverse mt-2">
                    <Badge variant={customer.type === 'company' ? 'default' : 'secondary'}>
                      {customer.type === 'company' ? 'شركة' : 'فرد'}
                    </Badge>
                    <Badge variant={customer.status === 'active' ? 'success' : 'secondary'}>
                      {customer.status === 'active' ? 'نشط' : 'غير نشط'}
                    </Badge>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{customer.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{customer.phone}</p>
                    {customer.alternativePhone && (
                      <p className="text-sm text-gray-500">{customer.alternativePhone}</p>
                    )}
                  </div>
                </div>
                
                {customer.email && (
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <p className="text-blue-600 hover:text-blue-800">{customer.email}</p>
                  </div>
                )}
                
                <div className="flex items-center space-x-3 space-x-reverse">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{customer.city}</p>
                    {customer.district && (
                      <p className="text-sm text-gray-500">
                        {customer.district}
                        {customer.street && `, ${customer.street}`}
                        {customer.buildingNumber && `, ${customer.buildingNumber}`}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">عضو منذ</p>
                    <p className="text-sm text-gray-500">
                      {new Date(customer.joinDate).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
              </div>
              
              {customer.notes && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">ملاحظات:</h4>
                  <p className="text-gray-600 dark:text-gray-400">{customer.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* الإحصائيات */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{customer.totalRepairs}</div>
                  <div className="text-sm text-gray-500">إجمالي الطلبات</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{customer.totalSpent} ر.س</div>
                  <div className="text-sm text-gray-500">إجمالي الإنفاق</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{customer.averageRepairCost} ر.س</div>
                  <div className="text-sm text-gray-500">متوسط تكلفة الإصلاح</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* التبويبات */}
        <Tabs defaultValue="repairs" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="repairs">طلبات الإصلاح ({repairs.length})</TabsTrigger>
            <TabsTrigger value="invoices">الفواتير</TabsTrigger>
            <TabsTrigger value="activity">النشاط</TabsTrigger>
          </TabsList>
          
          <TabsContent value="repairs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>سجل طلبات الإصلاح</CardTitle>
                  <Button size="sm" asChild>
                    <Link to={`/repairs/new?customer=${customer.id}`}>
                      <Plus className="w-4 h-4 ml-2" />
                      طلب جديد
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={repairColumns}
                  data={repairs}
                  searchKey="device"
                  searchPlaceholder="البحث في الطلبات..."
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  لا توجد فواتير
                </h3>
                <p className="text-gray-500">
                  لم يتم إنشاء أي فواتير لهذا العميل بعد
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>سجل النشاط</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">تم إكمال طلب الإصلاح REQ-001</p>
                      <p className="text-xs text-gray-500">منذ 3 أيام</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">تم إنشاء طلب إصلاح جديد REQ-045</p>
                      <p className="text-xs text-gray-500">منذ أسبوع</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">تم تحديث معلومات العميل</p>
                      <p className="text-xs text-gray-500">منذ شهر</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default CustomerDetails;
