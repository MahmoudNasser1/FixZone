import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, Package, BarChart3, PieChart, 
  Activity, AlertTriangle, RefreshCw 
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import analyticsService from '../../services/analyticsService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [data, setData] = useState({
    summary: null,
    inventoryValue: null,
    abcAnalysis: null,
    profitMargin: null,
    slowMoving: null,
    turnoverRate: null
  });

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [summaryRes, valueRes, abcRes, profitRes, slowRes] = await Promise.all([
        analyticsService.getSummary(),
        analyticsService.getInventoryValue(),
        analyticsService.getABCAnalysis(),
        analyticsService.getProfitMarginAnalysis(),
        analyticsService.getSlowMovingItems()
      ]);

      setData({
        summary: summaryRes.data?.data || summaryRes.data,
        inventoryValue: valueRes.data?.data || valueRes.data,
        abcAnalysis: abcRes.data?.data || abcRes.data,
        profitMargin: profitRes.data?.data || profitRes.data,
        slowMoving: slowRes.data?.data || slowRes.data
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  const { summary, inventoryValue, abcAnalysis, profitMargin, slowMoving } = data;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التحليلات المتقدمة</h1>
          <p className="text-gray-600 mt-1">تحليلات شاملة لأداء المخزون</p>
        </div>
        <button
          onClick={loadAnalytics}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          تحديث
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">إجمالي الأصناف</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.totalItems || 0}</p>
            </div>
            <Package className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">قيمة المخزون</p>
              <p className="text-2xl font-bold text-gray-900">
                {(summary?.totalPurchaseValue || 0).toLocaleString()} ج.م
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">الربح المتوقع</p>
              <p className="text-2xl font-bold text-green-600">
                {(summary?.potentialProfit || 0).toLocaleString()} ج.م
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">هامش الربح</p>
              <p className="text-2xl font-bold text-purple-600">
                {(summary?.profitMargin || 0).toFixed(1)}%
              </p>
            </div>
            <BarChart3 className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          {[
            { id: 'overview', label: 'نظرة عامة', icon: Activity },
            { id: 'abc', label: 'تحليل ABC', icon: PieChart },
            { id: 'profit', label: 'هامش الربح', icon: DollarSign },
            { id: 'slow', label: 'بطيء الحركة', icon: AlertTriangle }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                selectedTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">التوزيع حسب الفئة</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={inventoryValue?.categoryBreakdown || []}
                    dataKey="purchaseValue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {(inventoryValue?.categoryBreakdown || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            </div>

            {/* Warehouse Breakdown */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">التوزيع حسب المستودع</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={inventoryValue?.warehouseBreakdown || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="purchaseValue" fill="#3b82f6" name="قيمة الشراء" />
                  <Bar dataKey="sellingValue" fill="#10b981" name="قيمة البيع" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedTab === 'abc' && (
          <div className="space-y-6">
            {/* ABC Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                <h4 className="text-lg font-semibold text-green-800 mb-2">فئة A</h4>
                <p className="text-3xl font-bold text-green-600">{abcAnalysis?.classACount || 0}</p>
                <p className="text-gray-600 mt-1">
                  {((abcAnalysis?.classAValue / abcAnalysis?.summary.totalValue * 100) || 0).toFixed(1)}% من القيمة
                </p>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                <h4 className="text-lg font-semibold text-blue-800 mb-2">فئة B</h4>
                <p className="text-3xl font-bold text-blue-600">{abcAnalysis?.classBCount || 0}</p>
                <p className="text-gray-600 mt-1">
                  {((abcAnalysis?.classBValue / abcAnalysis?.summary.totalValue * 100) || 0).toFixed(1)}% من القيمة
                </p>
              </div>

              <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200">
                <h4 className="text-lg font-semibold text-orange-800 mb-2">فئة C</h4>
                <p className="text-3xl font-bold text-orange-600">{abcAnalysis?.classCCount || 0}</p>
                <p className="text-gray-600 mt-1">
                  {((abcAnalysis?.classCValue / abcAnalysis?.summary.totalValue * 100) || 0).toFixed(1)}% من القيمة
                </p>
              </div>
            </div>

            {/* ABC Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">تحليل ABC - توزيع القيمة</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={abcAnalysis?.allItems?.slice(0, 15) || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalValue" name="القيمة الإجمالية">
                    {(abcAnalysis?.allItems?.slice(0, 15) || []).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.classification === 'A' ? '#10b981' : 
                              entry.classification === 'B' ? '#3b82f6' : '#f59e0b'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedTab === 'profit' && (
          <div className="space-y-6">
            {/* Profit Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <h4 className="text-gray-600 mb-2">متوسط هامش الربح</h4>
                <p className="text-4xl font-bold text-green-600">
                  {profitMargin?.overall?.avgMargin || 0}%
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h4 className="text-gray-600 mb-2">إجمالي الربح المتوقع</h4>
                <p className="text-4xl font-bold text-blue-600">
                  {(profitMargin?.overall?.totalPotentialProfit || 0).toLocaleString()} ج.م
                </p>
              </div>
            </div>

            {/* Profit by Category */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">هامش الربح حسب الفئة</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={profitMargin?.byCategory || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgMarginPercent" fill="#10b981" name="هامش الربح %" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Profitable Items */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">الأصناف الأكثر ربحية</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الصنف</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">سعر الشراء</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">سعر البيع</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الربح/وحدة</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">هامش الربح</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الكمية</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الربح المتوقع</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(profitMargin?.topProfitable || []).map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.purchasePrice} ج.م</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.sellingPrice} ج.م</td>
                        <td className="px-4 py-3 text-sm text-green-600 font-semibold">
                          {item.profitPerUnit.toFixed(2)} ج.م
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                            {item.marginPercent}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.currentStock}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                          {item.potentialProfit.toLocaleString()} ج.م
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'slow' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">الأصناف بطيئة الحركة</h3>
              <div className="text-sm text-gray-600">
                إجمالي رأس المال المقيد: <span className="font-bold text-red-600">
                  {(slowMoving?.summary?.totalTiedUpCapital || 0).toLocaleString()} ج.م
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الصنف</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الفئة</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الكمية</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">رأس المال المقيد</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">آخر حركة</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">التوصية</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(slowMoving?.items || []).map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.currentStock}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-red-600">
                        {item.tiedUpCapital.toLocaleString()} ج.م
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.daysSinceLastMovement > 365 ? '+365' : item.daysSinceLastMovement} يوم
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.recommendation === 'تصفية' ? 'bg-red-100 text-red-800' :
                          item.recommendation === 'خصم' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.recommendation}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;

