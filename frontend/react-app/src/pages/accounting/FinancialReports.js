import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import apiService from '../../services/api';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download,
  Calendar,
  Filter
} from 'lucide-react';

const FinancialReports = () => {
  const [activeTab, setActiveTab] = useState('trial-balance');
  const [dateRange, setDateRange] = useState({
    startDate: new Date().getFullYear() + '-01-01',
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const reports = [
    {
      id: 'trial-balance',
      title: 'ميزان المراجعة',
      description: 'عرض أرصدة جميع الحسابات',
      icon: BarChart3,
      endpoint: '/accounting/reports/trial-balance'
    },
    {
      id: 'income-statement',
      title: 'قائمة الدخل',
      description: 'الأرباح والخسائر',
      icon: TrendingUp,
      endpoint: '/accounting/reports/income-statement'
    },
    {
      id: 'balance-sheet',
      title: 'قائمة المركز المالي',
      description: 'الميزانية العمومية',
      icon: PieChart,
      endpoint: '/accounting/reports/balance-sheet'
    }
  ];

  const fetchReport = async (reportId) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const data = await apiService.request(`${report.endpoint}?${queryParams}`);
      
      if (data.success) {
        setReportData(data.data);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab, dateRange]);

  const renderTrialBalance = () => {
    if (!reportData?.accounts) return null;

    return (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-right">كود الحساب</th>
                <th className="border border-gray-300 px-4 py-2 text-right">اسم الحساب</th>
                <th className="border border-gray-300 px-4 py-2 text-center">مدين</th>
                <th className="border border-gray-300 px-4 py-2 text-center">دائن</th>
              </tr>
            </thead>
            <tbody>
              {reportData.accounts.map((account, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 font-mono">{account.code}</td>
                  <td className="border border-gray-300 px-4 py-2">{account.name}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center font-mono">
                    {account.debitBalance > 0 ? account.debitBalance.toLocaleString() : '-'}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center font-mono">
                    {account.creditBalance > 0 ? account.creditBalance.toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-bold">
                <td colSpan="2" className="border border-gray-300 px-4 py-2 text-center">الإجمالي</td>
                <td className="border border-gray-300 px-4 py-2 text-center font-mono">
                  {reportData.totalDebit?.toLocaleString()}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center font-mono">
                  {reportData.totalCredit?.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderIncomeStatement = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">الإيرادات</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.revenues?.map((item, index) => (
                <div key={index} className="flex justify-between py-2 border-b">
                  <span>{item.name}</span>
                  <span className="font-mono">{Number(item.amount || 0).toLocaleString()} ج.م</span>
                </div>
              ))}
              <div className="flex justify-between py-2 font-bold text-lg border-t-2 mt-2">
                <span>إجمالي الإيرادات</span>
                <span className="font-mono text-green-600">
                  {Number(reportData.totalRevenue || 0).toLocaleString()} ج.م
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">المصروفات</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.expenses?.map((item, index) => (
                <div key={index} className="flex justify-between py-2 border-b">
                  <span>{item.name}</span>
                  <span className="font-mono">{item.amount.toLocaleString()} ج.م</span>
                </div>
              ))}
              <div className="flex justify-between py-2 font-bold text-lg border-t-2 mt-2">
                <span>إجمالي المصروفات</span>
                <span className="font-mono text-red-600">
                  {Number(reportData.totalExpenses || 0).toLocaleString()} ج.م
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">
                صافي {reportData.netIncome >= 0 ? 'الربح' : 'الخسارة'}
              </div>
              <div className={`text-4xl font-bold ${reportData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(Math.abs(reportData.netIncome || 0)).toLocaleString()} ج.م
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    if (!reportData) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الأصول</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.assets?.map((item, index) => (
                <div key={index} className="flex justify-between py-2 border-b">
                  <span>{item.name}</span>
                  <span className="font-mono">{item.amount.toLocaleString()} ج.م</span>
                </div>
              ))}
              <div className="flex justify-between py-2 font-bold text-lg border-t-2 mt-2">
                <span>إجمالي الأصول</span>
                <span className="font-mono">{Number(reportData.totalAssets || 0).toLocaleString()} ج.م</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الخصوم وحقوق الملكية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h4 className="font-semibold text-red-600 mb-2">الخصوم</h4>
                {reportData.liabilities?.map((item, index) => (
                  <div key={index} className="flex justify-between py-1 border-b">
                    <span className="text-sm">{item.name}</span>
                    <span className="font-mono text-sm">{Number(item.amount || 0).toLocaleString()} ج.م</span>
                  </div>
                ))}
              </div>
              
              <div className="mb-4">
                <h4 className="font-semibold text-purple-600 mb-2">حقوق الملكية</h4>
                {reportData.equity?.map((item, index) => (
                  <div key={index} className="flex justify-between py-1 border-b">
                    <span className="text-sm">{item.name}</span>
                    <span className="font-mono text-sm">{item.amount.toLocaleString()} ج.م</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between py-2 font-bold text-lg border-t-2 mt-2">
                <span>إجمالي الخصوم وحقوق الملكية</span>
                <span className="font-mono">
                  {Number((reportData.totalLiabilities || 0) + (reportData.totalEquity || 0)).toLocaleString()} ج.م
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'trial-balance':
        return renderTrialBalance();
      case 'income-statement':
        return renderIncomeStatement();
      case 'balance-sheet':
        return renderBalanceSheet();
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">التقارير المالية</h1>
          <p className="text-gray-600 mt-1">التقارير المحاسبية والمالية الأساسية</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 ml-2" />
            تصدير PDF
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">من:</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">إلى:</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg" dir="ltr">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setActiveTab(report.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-colors ${
                activeTab === report.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{report.title}</span>
            </button>
          );
        })}
      </div>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {(() => {
              const currentReport = reports.find(r => r.id === activeTab);
              const Icon = currentReport?.icon;
              return (
                <>
                  <Icon className="w-5 h-5 ml-2" />
                  {currentReport?.title}
                </>
              );
            })()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderReportContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialReports;
