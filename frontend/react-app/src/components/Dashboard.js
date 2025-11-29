import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Wrench, CheckCircle, Clock, PlusCircle, UserPlus } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      title: 'إجمالي الإصلاحات',
      value: '1,254',
      icon: <Wrench className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'قيد الانتظار',
      value: '82',
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'مكتملة',
      value: '1,100',
      icon: <CheckCircle className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'عملاء جدد',
      value: '73',
      icon: <UserPlus className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  const recentActivities = [
    {
      icon: <PlusCircle className="h-5 w-5 text-brand-green" />,
      description: 'طلب إصلاح جديد #1256 لهاتف iPhone 13.',
      time: 'منذ 5 دقائق',
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-brand-blue" />,
      description: 'تم اكتمال الإصلاح #1250.',
      time: 'منذ ساعة',
    },
    {
      icon: <UserPlus className="h-5 w-5 text-brand-purple" />,
      description: 'تسجيل عميل جديد "علي حسن".',
      time: 'منذ 3 ساعات',
    },
    {
      icon: <PlusCircle className="h-5 w-5 text-brand-green" />,
      description: 'طلب إصلاح جديد #1255 لهاتف Samsung S22.',
      time: 'منذ 6 ساعات',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-foreground">لوحة التحكم</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>النشاطات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center gap-4">
                  {activity.icon}
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{activity.description}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Placeholder for another card, e.g., Overdue Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>المهام المتأخرة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">لا توجد مهام متأخرة.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
