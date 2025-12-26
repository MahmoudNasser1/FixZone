import React, { useState, useEffect } from 'react';
import {
  TrendingUp, DollarSign, Package, BarChart3, PieChart,
  Activity, AlertTriangle, RefreshCw
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

import analyticsService from '../../services/analyticsService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { SimpleCard, SimpleCardContent, SimpleCardHeader, SimpleCardTitle } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import { cn } from '../../lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement
);

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: 'oklch(var(--muted-foreground))',
        font: { size: 12 }
      },
    },
    tooltip: {
      rtl: true,
      backgroundColor: 'oklch(var(--card))',
      titleColor: 'oklch(var(--foreground))',
      bodyColor: 'oklch(var(--muted-foreground))',
      borderColor: 'oklch(var(--border))',
      borderWidth: 1,
    }
  },
  scales: {
    x: {
      grid: { color: 'oklch(var(--border) / 0.1)' },
      ticks: { color: 'oklch(var(--muted-foreground))' }
    },
    y: {
      grid: { color: 'oklch(var(--border) / 0.1)' },
      ticks: { color: 'oklch(var(--muted-foreground))' }
    }
  }
};

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
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6 text-right" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">التحليلات المتقدمة</h1>
            <p className="text-muted-foreground mt-1">ذكاء الأعمال والرؤى العميقة لأداء المخزون</p>
          </div>
          <div className="flex items-center gap-2">
            <SimpleButton onClick={loadAnalytics} variant="outline" className="w-full md:w-auto">
              <RefreshCw className="w-4 h-4 ml-2" />
              تحديث البيانات
            </SimpleButton>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الأصناف', value: summary?.totalItems || 0, icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'قيمة المخزون', value: `${(summary?.totalPurchaseValue || 0).toLocaleString()} ج.م`, icon: DollarSign, color: 'text-success', bg: 'bg-success/10' },
            { label: 'الربح المتوقع', value: `${(summary?.potentialProfit || 0).toLocaleString()} ج.م`, icon: TrendingUp, color: 'text-warning', bg: 'bg-warning/10' },
            { label: 'هامش الربح', value: `${(summary?.profitMargin || 0).toFixed(1)}%`, icon: BarChart3, color: 'text-secondary', bg: 'bg-secondary/10' }
          ].map((stat, i) => (
            <SimpleCard key={i}>
              <SimpleCardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={cn("p-3 rounded-xl", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'نظرة عامة', icon: Activity },
            { id: 'abc', label: 'تحليل ABC', icon: PieChart },
            { id: 'profit', label: 'هامش الربح', icon: DollarSign },
            { id: 'slow', label: 'بطيء الحركة', icon: AlertTriangle }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative min-w-max",
                  isActive
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Areas */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {selectedTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimpleCard>
                <SimpleCardHeader>
                  <SimpleCardTitle className="text-lg">التوزيع حسب الفئة (قيمة الشراء)</SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent>
                  <div className="h-[300px]">
                    <Doughnut
                      data={{
                        labels: (inventoryValue?.categoryBreakdown || []).map(item => item.category),
                        datasets: [{
                          data: (inventoryValue?.categoryBreakdown || []).map(item => item.purchaseValue),
                          backgroundColor: COLORS,
                          borderColor: 'oklch(var(--card))',
                          borderWidth: 2
                        }]
                      }}
                      options={chartOptions}
                    />
                  </div>
                </SimpleCardContent>
              </SimpleCard>

              <SimpleCard>
                <SimpleCardHeader>
                  <SimpleCardTitle className="text-lg">مقارنة التوزيع بين المستودعات</SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent>
                  <div className="h-[300px]">
                    <Bar
                      data={{
                        labels: (inventoryValue?.warehouseBreakdown || []).map(item => item.name),
                        datasets: [
                          {
                            label: 'قيمة الشراء',
                            data: (inventoryValue?.warehouseBreakdown || []).map(item => item.purchaseValue),
                            backgroundColor: 'oklch(var(--primary) / 0.8)',
                            borderRadius: 6
                          },
                          {
                            label: 'قيمة البيع',
                            data: (inventoryValue?.warehouseBreakdown || []).map(item => item.sellingValue),
                            backgroundColor: 'oklch(var(--success) / 0.8)',
                            borderRadius: 6
                          }
                        ]
                      }}
                      options={chartOptions}
                    />
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            </div>
          )}

          {selectedTab === 'abc' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { class: 'A', count: abcAnalysis?.classACount || 0, value: abcAnalysis?.classAValue || 0, color: 'text-success', bg: 'bg-success/5', border: 'border-success/20' },
                  { class: 'B', count: abcAnalysis?.classBCount || 0, value: abcAnalysis?.classBValue || 0, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20' },
                  { class: 'C', count: abcAnalysis?.classCCount || 0, value: abcAnalysis?.classCValue || 0, color: 'text-warning', bg: 'bg-warning/5', border: 'border-warning/20' }
                ].map(item => (
                  <div key={item.class} className={cn("p-6 rounded-2xl border-2 transition-all hover:shadow-md", item.bg, item.border)}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={cn("text-xl font-bold", item.color)}>فئة {item.class}</h4>
                      <SimpleBadge variant="outline">{item.count} صنف</SimpleBadge>
                    </div>
                    <p className="text-3xl font-extrabold text-foreground mb-1">
                      {((item.value / (abcAnalysis?.summary.totalValue || 1)) * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground font-medium">من إجمالي قيمة المخزون</p>
                  </div>
                ))}
              </div>

              <SimpleCard>
                <SimpleCardHeader>
                  <SimpleCardTitle className="text-lg">تحليل Pareto - توزيع القيمة لأهم 15 صنف</SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent>
                  <div className="h-[400px]">
                    <Bar
                      data={{
                        labels: (abcAnalysis?.allItems?.slice(0, 15) || []).map(item => item.name),
                        datasets: [{
                          label: 'القيمة الإجمالية',
                          data: (abcAnalysis?.allItems?.slice(0, 15) || []).map(item => item.totalValue),
                          backgroundColor: (abcAnalysis?.allItems?.slice(0, 15) || []).map(item =>
                            item.classification === 'A' ? 'oklch(var(--success) / 0.8)' :
                              item.classification === 'B' ? 'oklch(var(--primary) / 0.8)' : 'oklch(var(--warning) / 0.8)'
                          ),
                          borderRadius: 4
                        }]
                      }}
                      options={chartOptions}
                    />
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            </div>
          )}

          {selectedTab === 'profit' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SimpleCard>
                  <SimpleCardContent className="p-8 flex items-center gap-6">
                    <div className="p-4 bg-success/10 rounded-2xl">
                      <TrendingUp className="w-8 h-8 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">متوسط هامش الربح</p>
                      <h4 className="text-4xl font-bold text-success">{profitMargin?.overall?.avgMargin || 0}%</h4>
                    </div>
                  </SimpleCardContent>
                </SimpleCard>
                <SimpleCard>
                  <SimpleCardContent className="p-8 flex items-center gap-6">
                    <div className="p-4 bg-primary/10 rounded-2xl">
                      <DollarSign className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">إجمالي الربح المتوقع</p>
                      <h4 className="text-4xl font-bold text-primary">{(profitMargin?.overall?.totalPotentialProfit || 0).toLocaleString()} <span className="text-sm">ج.م</span></h4>
                    </div>
                  </SimpleCardContent>
                </SimpleCard>
              </div>

              <SimpleCard>
                <SimpleCardHeader>
                  <SimpleCardTitle className="text-lg">هوامش الربحية حسب الفئات</SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent>
                  <div className="h-[300px]">
                    <Bar
                      data={{
                        labels: (profitMargin?.byCategory || []).map(item => item.category),
                        datasets: [{
                          label: 'هامش الربح %',
                          data: (profitMargin?.byCategory || []).map(item => item.avgMarginPercent),
                          backgroundColor: 'oklch(var(--primary) / 0.7)',
                          borderRadius: 6
                        }]
                      }}
                      options={{
                        ...chartOptions,
                        plugins: { ...chartOptions.plugins, legend: { display: false } }
                      }}
                    />
                  </div>
                </SimpleCardContent>
              </SimpleCard>

              <SimpleCard>
                <SimpleCardHeader>
                  <SimpleCardTitle>قائمة الأصناف الأكثر ربحية</SimpleCardTitle>
                </SimpleCardHeader>
                <div className="overflow-x-auto border-t border-border">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">الصنف</th>
                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase text-center">التسعير</th>
                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase text-center">الربح للوحدة</th>
                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase text-center">الهامش</th>
                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase text-right">الإجمالي المتوقع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(profitMargin?.topProfitable || []).map((item) => (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">مخزون: {item.currentStock}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="text-xs text-muted-foreground">شراء: {item.purchasePrice}</div>
                            <div className="text-sm font-medium text-foreground">بيع: {item.sellingPrice}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-bold text-success">{item.profitPerUnit.toFixed(2)} ج.م</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <SimpleBadge variant="success">{item.marginPercent}%</SimpleBadge>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-primary">
                            {item.potentialProfit.toLocaleString()} ج.م
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SimpleCard>
            </div>
          )}

          {selectedTab === 'slow' && (
            <SimpleCard>
              <SimpleCardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <SimpleCardTitle>أصناف بطيئة الحركة</SimpleCardTitle>
                    <p className="text-sm text-muted-foreground mt-1">الأصناف التي لم تتحرك منذ فترة طويلة</p>
                  </div>
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                    <p className="text-xs text-destructive font-bold uppercase tracking-wider mb-1">رأس مال معطل</p>
                    <h4 className="text-2xl font-black text-destructive">{(slowMoving?.summary?.totalTiedUpCapital || 0).toLocaleString()} <span className="text-sm font-normal">ج.م</span></h4>
                  </div>
                </div>
              </SimpleCardHeader>
              <div className="overflow-x-auto border-t border-border">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-6 py-4 text-xs font-bold text-muted-foreground">الصنف / الفئة</th>
                      <th className="px-6 py-4 text-xs font-bold text-muted-foreground text-center">الكمية</th>
                      <th className="px-6 py-4 text-xs font-bold text-muted-foreground">رأس المال</th>
                      <th className="px-6 py-4 text-xs font-bold text-muted-foreground text-center">أيام الركود</th>
                      <th className="px-6 py-4 text-xs font-bold text-muted-foreground">التوصية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(slowMoving?.items || []).map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                        </td>
                        <td className="px-6 py-4 text-center text-muted-foreground font-medium">{item.currentStock}</td>
                        <td className="px-6 py-4 font-bold text-destructive">
                          {item.tiedUpCapital.toLocaleString()} ج.م
                        </td>
                        <td className="px-6 py-4 text-center">
                          <SimpleBadge variant={item.daysSinceLastMovement > 180 ? 'danger' : 'warning'}>
                            {item.daysSinceLastMovement > 365 ? 'أكثر من سنة' : `${item.daysSinceLastMovement} يوم`}
                          </SimpleBadge>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold border",
                            item.recommendation === 'تصفية' ? 'bg-danger/10 border-danger/20 text-danger' :
                              item.recommendation === 'خصم' ? 'bg-warning/10 border-warning/20 text-warning' :
                                'bg-primary/10 border-primary/20 text-primary'
                          )}>
                            {item.recommendation}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SimpleCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;

