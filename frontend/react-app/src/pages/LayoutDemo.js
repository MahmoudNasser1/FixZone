import React, { useState } from 'react';
import { MainLayout, SimpleLayout, CleanLayout } from '../components/layout/index';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { DataTable } from '../components/ui/DataTable';
import { 
  Plus, Search, Filter, Download, RefreshCw, 
  Wrench, Users, Package, TrendingUp, AlertCircle,
  Eye, Edit, Trash2, MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/DropdownMenu";

const LayoutDemo = () => {
  const [selectedLayout, setSelectedLayout] = useState('main');

  // بيانات تجريبية للجدول
  const sampleData = [
    {
      id: 1,
      requestNumber: 'REQ-001',
      customerName: 'أحمد محمد',
      device: 'iPhone 13 Pro',
      issue: 'شاشة مكسورة',
      status: 'pending',
      priority: 'high',
      createdAt: '2024-01-15',
      technician: 'محمد علي'
    },
    {
      id: 2,
      requestNumber: 'REQ-002',
      customerName: 'فاطمة أحمد',
      device: 'Samsung Galaxy S21',
      issue: 'بطارية لا تشحن',
      status: 'in_progress',
      priority: 'medium',
      createdAt: '2024-01-14',
      technician: 'سارة محمد'
    },
    {
      id: 3,
      requestNumber: 'REQ-003',
      customerName: 'عبدالله سعد',
      device: 'iPad Air',
      issue: 'لا يعمل اللمس',
      status: 'completed',
      priority: 'low',
      createdAt: '2024-01-13',
      technician: 'أحمد حسن'
    }
  ];

  const columns = [
    {
      accessorKey: 'requestNumber',
      header: 'رقم الطلب',
      cell: ({ row }) => (
        <div className="font-medium text-blue-600">
          {row.getValue('requestNumber')}
        </div>
      ),
    },
    {
      accessorKey: 'customerName',
      header: 'اسم العميل',
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
          pending: { label: 'معلق', variant: 'secondary' },
          in_progress: { label: 'قيد التنفيذ', variant: 'default' },
          completed: { label: 'مكتمل', variant: 'success' }
        };
        const statusInfo = statusMap[status] || { label: status, variant: 'secondary' };
        
        return (
          <Badge variant={statusInfo.variant}>
            {statusInfo.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'priority',
      header: 'الأولوية',
      cell: ({ row }) => {
        const priority = row.getValue('priority');
        const priorityMap = {
          high: { label: 'عالية', variant: 'destructive' },
          medium: { label: 'متوسطة', variant: 'default' },
          low: { label: 'منخفضة', variant: 'secondary' }
        };
        const priorityInfo = priorityMap[priority] || { label: priority, variant: 'secondary' };
        
        return (
          <Badge variant={priorityInfo.variant} size="sm">
            {priorityInfo.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'technician',
      header: 'الفني',
    },
    {
      id: 'actions',
      header: 'الإجراءات',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="w-4 h-4 ml-2" />
              عرض
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="w-4 h-4 ml-2" />
              تعديل
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="w-4 h-4 ml-2" />
              حذف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // إحصائيات سريعة
  const quickStats = [
    {
      title: 'إجمالي الطلبات',
      value: '156',
      change: '+12%',
      changeType: 'positive',
      icon: Wrench,
      color: 'blue'
    },
    {
      title: 'العملاء النشطين',
      value: '89',
      change: '+5%',
      changeType: 'positive',
      icon: Users,
      color: 'green'
    },
    {
      title: 'قطع الغيار',
      value: '234',
      change: '-3%',
      changeType: 'negative',
      icon: Package,
      color: 'orange'
    },
    {
      title: 'الإيرادات',
      value: '45,230 جنية',
      change: '+18%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'purple'
    }
  ];

  const pageActions = (
    <>
      <Button variant="outline" size="sm">
        <Filter className="w-4 h-4 ml-2" />
        فلترة
      </Button>
      <Button variant="outline" size="sm">
        <Download className="w-4 h-4 ml-2" />
        تصدير
      </Button>
      <Button size="sm">
        <Plus className="w-4 h-4 ml-2" />
        طلب جديد
      </Button>
    </>
  );

  const renderContent = () => (
    <div className="space-y-6">
      {/* أزرار تبديل التخطيط */}
      <Card>
        <CardHeader>
          <CardTitle>عرض تجريبي للتخطيط المحسن</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 space-x-reverse mb-4">
            <Button 
              variant={selectedLayout === 'main' ? 'default' : 'outline'}
              onClick={() => setSelectedLayout('main')}
            >
              التخطيط الرئيسي
            </Button>
            <Button 
              variant={selectedLayout === 'simple' ? 'default' : 'outline'}
              onClick={() => setSelectedLayout('simple')}
            >
              التخطيط المبسط
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            هذه صفحة تجريبية لعرض التحسينات الجديدة على نظام التنقل والتخطيط. 
            يمكنك رؤية Sidebar المحسن، TopBar مع الاختصارات السريعة، ونظام Breadcrumb التلقائي.
          </p>
        </CardContent>
      </Card>

      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stat.value}
                  </p>
                  <p className={`text-sm ${
                    stat.changeType === 'positive' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {stat.change} من الشهر الماضي
                  </p>
                </div>
                <div className={`p-3 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* جدول البيانات */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>طلبات الإصلاح الحديثة</CardTitle>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 ml-2" />
                بحث
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={sampleData}
            searchKey="customerName"
            searchPlaceholder="البحث في العملاء..."
          />
        </CardContent>
      </Card>

      {/* تنبيهات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <span>تنبيهات هامة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 space-x-reverse p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">نقص في المخزون</p>
                  <p className="text-xs text-gray-600">5 قطع تحتاج إعادة طلب</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">طلبات معلقة</p>
                  <p className="text-xs text-gray-600">12 طلب في انتظار المراجعة</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الأداء اليومي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">الطلبات المكتملة</span>
                <span className="font-medium">8/12</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '67%' }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">رضا العملاء</span>
                <span className="font-medium">95%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '95%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (selectedLayout === 'simple') {
    return (
      <SimpleLayout 
        title="عرض تجريبي - التخطيط المبسط"
        actions={pageActions}
      >
        {renderContent()}
      </SimpleLayout>
    );
  }

  return (
    <MainLayout 
      pageTitle="عرض تجريبي للتحسينات"
      pageActions={pageActions}
      showBreadcrumb={true}
    >
      {renderContent()}
    </MainLayout>
  );
};

export default LayoutDemo;
