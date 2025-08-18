import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
// import { Progress } from '../../components/ui/Progress';
import apiService from '../../services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  PieChart, 
  Calculator,
  Building2,
  Target,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const AccountingDashboard = () => {
  const [stats, setStats] = useState({
    accounts: [],
    journalEntries: [],
    costCenters: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const data = await apiService.request('/accounting/dashboard-stats');
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // بيانات تجريبية للعرض
  const mockFinancialData = {
    totalRevenue: 125000,
    totalExpenses: 87500,
    netIncome: 37500,
    cashFlow: 42000,
    accountsReceivable: 28000,
    accountsPayable: 15500,
    monthlyGrowth: 12.5,
    profitMargin: 30
  };

  const quickActions = [
    {
      title: 'قيد محاسبي جديد',
      description: 'إنشاء قيد محاسبي',
      icon: FileText,
      color: 'bg-blue-500',
      action: () => console.log('New Journal Entry')
    },
    {
      title: 'ميزان المراجعة',
      description: 'عرض ميزان المراجعة',
      icon: Calculator,
      color: 'bg-green-500',
      action: () => console.log('Trial Balance')
    },
    {
      title: 'قائمة الدخل',
      description: 'تقرير الأرباح والخسائر',
      icon: TrendingUp,
      color: 'bg-purple-500',
      action: () => console.log('Income Statement')
    },
    {
      title: 'قائمة المركز المالي',
      description: 'الميزانية العمومية',
      icon: PieChart,
      color: 'bg-orange-500',
      action: () => console.log('Balance Sheet')
    }
  ];

  const recentEntries = [
    {
      id: 1,
      entryNumber: 'JE-2025-001',
      date: '2025-01-18',
      description: 'قيد إيراد خدمات الصيانة',
      amount: 5500,
      status: 'posted'
    },
    {
      id: 2,
      entryNumber: 'JE-2025-002',
      date: '2025-01-17',
      description: 'قيد شراء قطع غيار',
      amount: 2800,
      status: 'draft'
    },
    {
      id: 3,
      entryNumber: 'JE-2025-003',
      date: '2025-01-16',
      description: 'قيد مصروفات تشغيلية',
      amount: 1200,
      status: 'posted'
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم المحاسبية</h1>
          <p className="text-gray-600 mt-1">نظرة عامة على الوضع المالي والمحاسبي</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <FileText className="w-4 h-4 ml-2" />
            تصدير التقارير
          </Button>
          <Button>
            <Calculator className="w-4 h-4 ml-2" />
            قيد جديد
          </Button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-green-600">
                  {mockFinancialData.totalRevenue.toLocaleString()} ج.م
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
                  <span className="text-sm text-green-600">+{mockFinancialData.monthlyGrowth}%</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي المصروفات</p>
                <p className="text-2xl font-bold text-red-600">
                  {mockFinancialData.totalExpenses.toLocaleString()} ج.م
                </p>
                <div className="flex items-center mt-2">
                  <TrendingDown className="w-4 h-4 text-red-500 ml-1" />
                  <span className="text-sm text-red-600">-8.2%</span>
                </div>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">صافي الربح</p>
                <p className="text-2xl font-bold text-blue-600">
                  {mockFinancialData.netIncome.toLocaleString()} ج.م
                </p>
                <div className="flex items-center mt-2">
                  <Target className="w-4 h-4 text-blue-500 ml-1" />
                  <span className="text-sm text-blue-600">{mockFinancialData.profitMargin}% هامش</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">التدفق النقدي</p>
                <p className="text-2xl font-bold text-purple-600">
                  {mockFinancialData.cashFlow.toLocaleString()} ج.م
                </p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="w-4 h-4 text-green-500 ml-1" />
                  <span className="text-sm text-green-600">صحي</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="w-5 h-5 ml-2" />
            الإجراءات السريعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-md transition-shadow"
                onClick={action.action}
              >
                <div className={`p-3 rounded-full ${action.color}`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-medium">{action.title}</p>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Journal Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-5 h-5 ml-2" />
                القيود المحاسبية الأخيرة
              </div>
              <Button variant="ghost" size="sm">
                عرض الكل
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{entry.entryNumber}</p>
                      <Badge 
                        variant={entry.status === 'posted' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {entry.status === 'posted' ? 'مرحل' : 'مسودة'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                    <p className="text-xs text-gray-500">{entry.date}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg">{entry.amount.toLocaleString()} ج.م</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Account Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 ml-2" />
              ملخص الحسابات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">حسابات الأصول</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-blue-500 rounded-full" style={{width: '75%'}}></div>
                  </div>
                  <span className="text-sm font-bold">24</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">حسابات الخصوم</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-red-500 rounded-full" style={{width: '60%'}}></div>
                  </div>
                  <span className="text-sm font-bold">18</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">حسابات الإيرادات</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-green-500 rounded-full" style={{width: '85%'}}></div>
                  </div>
                  <span className="text-sm font-bold">12</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">حسابات المصروفات</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-orange-500 rounded-full" style={{width: '70%'}}></div>
                  </div>
                  <span className="text-sm font-bold">16</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-medium">إجمالي الحسابات النشطة</span>
                  <span className="text-xl font-bold text-blue-600">70</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Ratios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChart className="w-5 h-5 ml-2" />
            النسب المالية الرئيسية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {((mockFinancialData.netIncome / mockFinancialData.totalRevenue) * 100).toFixed(1)}%
              </div>
              <p className="text-sm font-medium text-gray-600">هامش صافي الربح</p>
              <p className="text-xs text-gray-500 mt-1">ممتاز</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {(mockFinancialData.accountsReceivable / mockFinancialData.totalRevenue * 365).toFixed(0)}
              </div>
              <p className="text-sm font-medium text-gray-600">أيام التحصيل</p>
              <p className="text-xs text-gray-500 mt-1">جيد</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {(mockFinancialData.cashFlow / mockFinancialData.totalExpenses).toFixed(2)}
              </div>
              <p className="text-sm font-medium text-gray-600">نسبة السيولة</p>
              <p className="text-xs text-gray-500 mt-1">ممتاز</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountingDashboard;
