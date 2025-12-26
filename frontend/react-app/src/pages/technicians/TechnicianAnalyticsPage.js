import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  TrendingUp,
  Activity,
  Target,
  RefreshCw,
  Users,
  Award,
  ChevronLeft,
  ArrowRight,
  Info,
  AlertCircle,
  BarChart3,
  LineChart,
  Calendar,
  Clock,
  Briefcase
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import technicianAnalyticsService from '../../services/technicianAnalyticsService';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import PageTransition from '../../components/ui/PageTransition';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { cn } from '../../lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Standardized Chart Options for Dark Mode Compatibility
const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      rtl: true,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          family: 'IBM Plex Sans Arabic, sans-serif',
          size: 12,
          weight: '600'
        },
        color: 'oklch(var(--bc))'
      }
    },
    tooltip: {
      rtl: true,
      padding: 12,
      backgroundColor: 'oklch(var(--b1))',
      titleColor: 'oklch(var(--bc))',
      bodyColor: 'oklch(var(--bc))',
      borderColor: 'oklch(var(--b2))',
      borderWidth: 1,
      titleFont: {
        family: 'IBM Plex Sans Arabic, sans-serif',
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        family: 'IBM Plex Sans Arabic, sans-serif',
        size: 13
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: 'oklch(var(--bc) / 0.6)',
        font: {
          family: 'IBM Plex Sans Arabic, sans-serif'
        }
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'oklch(var(--bc) / 0.05)'
      },
      ticks: {
        color: 'oklch(var(--bc) / 0.6)',
        font: {
          family: 'IBM Plex Sans Arabic, sans-serif'
        }
      }
    }
  }
};

const TechnicianAnalyticsPage = () => {
  const { id } = useParams();
  const notifications = useNotifications();
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('trends');
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState({
    trends: null,
    efficiency: null,
    comparative: null,
    predictions: null,
    skillGaps: null
  });

  useEffect(() => {
    if (id) {
      loadAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, period, selectedTab]);

  const loadAnalytics = async () => {
    if (!id) return;

    setLoading(true);
    try {
      switch (selectedTab) {
        case 'trends':
          const trendsRes = await technicianAnalyticsService.getPerformanceTrends(id, period);
          if (trendsRes.success) {
            setData(prev => ({ ...prev, trends: trendsRes.data }));
          }
          break;
        case 'efficiency':
          const efficiencyRes = await technicianAnalyticsService.getEfficiencyAnalysis(id, period);
          if (efficiencyRes.success) {
            setData(prev => ({ ...prev, efficiency: efficiencyRes.data }));
          }
          break;
        case 'comparative':
          const comparativeRes = await technicianAnalyticsService.getComparativeAnalysis({});
          if (comparativeRes.success) {
            setData(prev => ({ ...prev, comparative: comparativeRes.data }));
          }
          break;
        case 'predictions':
          const predictionsRes = await technicianAnalyticsService.getPredictiveInsights(id);
          if (predictionsRes.success) {
            setData(prev => ({ ...prev, predictions: predictionsRes.data }));
          }
          break;
        case 'skill-gaps':
          const skillGapsRes = await technicianAnalyticsService.getSkillGapAnalysis(id);
          if (skillGapsRes.success) {
            setData(prev => ({ ...prev, skillGaps: skillGapsRes.data }));
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      notifications.error('خطأ في تحميل التحليلات');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data[selectedTab]) {
    return (
      <PageTransition className="min-h-screen bg-background text-right" dir="rtl">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <LoadingSpinner message="جاري استخراج التحليلات المتقدمة..." />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-background pb-12 text-right font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-card/50 backdrop-blur-md sticky top-0 z-20 pt-4 pb-6 mb-8 border-b border-border/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-3 bg-background hover:bg-muted text-muted-foreground hover:text-foreground rounded-2xl shadow-sm border border-border/40 transition-all active:scale-95"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <SimpleBadge variant="primary" className="px-3">لوحة البيانات التحليلية</SimpleBadge>
                  <Activity className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <h1 className="text-3xl font-black text-foreground tracking-tight">تحليلات كفاءة الفني</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                  <Users className="w-4 h-4" />
                  مراقبة الأداء، الكفاءة، وفجوات المهارات
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="pr-10 pl-4 py-2.5 bg-background border-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                >
                  <option value="week">الأسبوع الماضي</option>
                  <option value="month">الشهر الماضي</option>
                  <option value="year">العام الماضي كامل</option>
                </select>
              </div>
              <SimpleButton
                onClick={loadAnalytics}
                variant="outline"
                className="rounded-xl border-border/60 hover:bg-muted font-bold gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                تحديث البيانات
              </SimpleButton>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mb-10 bg-muted/30 p-1.5 rounded-2xl border border-border/40 overflow-x-auto no-scrollbar">
          {[
            { id: 'trends', label: 'الاتجاهات', icon: TrendingUp, color: 'text-primary' },
            { id: 'efficiency', label: 'الكفاءة', icon: Activity, color: 'text-emerald-500' },
            { id: 'comparative', label: 'المقارنة', icon: Users, color: 'text-blue-500' },
            { id: 'predictions', label: 'التوقعات', icon: Target, color: 'text-purple-500' },
            { id: 'skill-gaps', label: 'فجوات المهارات', icon: Award, color: 'text-amber-500' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={cn(
                "flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                selectedTab === tab.id
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <tab.icon className={cn("w-4 h-4", selectedTab === tab.id ? tab.color : "text-muted-foreground")} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {selectedTab === 'trends' && data.trends && (
            <div className="space-y-6">
              <SimpleCard className="border-none shadow-2xl shadow-primary/5 bg-card/60 backdrop-blur-md">
                <SimpleCardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-6">
                  <div>
                    <SimpleCardTitle className="text-xl font-black">تحليل اتجاهات الأداء</SimpleCardTitle>
                    <p className="text-xs text-muted-foreground mt-1">مسار الإنتاجية التاريخي للفني</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <LineChart className="w-6 h-6 text-primary" />
                  </div>
                </SimpleCardHeader>
                <SimpleCardContent className="pt-8">
                  <div style={{ height: '450px' }}>
                    <Line
                      data={{
                        labels: (data.trends || []).map(item => item.date),
                        datasets: [
                          {
                            label: 'إجمالي عمليات الإصلاح',
                            data: (data.trends || []).map(item => item.repairsCount),
                            borderColor: 'oklch(var(--p))',
                            backgroundColor: 'oklch(var(--p) / 0.1)',
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            borderWidth: 3
                          },
                          {
                            label: 'الإصلاحات المكتملة بنجاح',
                            data: (data.trends || []).map(item => item.completedCount),
                            borderColor: 'oklch(0.627 0.265 149.22)',
                            backgroundColor: 'transparent',
                            tension: 0.4,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            borderWidth: 3,
                            borderDash: [5, 5]
                          }
                        ]
                      }}
                      options={commonChartOptions}
                    />
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            </div>
          )}

          {selectedTab === 'efficiency' && data.efficiency && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'معدل الإنجاز الكلي', value: `${data.efficiency.completionRate?.toFixed(1) || 0}%`, icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                  { label: 'متوسط وقت الإصلاح', value: `${data.efficiency.avgTimeSpent?.toFixed(1) || 0} دقيقة`, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { label: 'سكور الكفاءة العام', value: data.efficiency.efficiencyScore || 0, icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' }
                ].map((stat, i) => (
                  <SimpleCard key={i} className="border-none shadow-lg hover:shadow-xl transition-all">
                    <SimpleCardContent className="p-6 flex items-center gap-5">
                      <div className={cn("p-4 rounded-2xl", stat.bg)}>
                        <stat.icon className={cn("w-6 h-6", stat.color)} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase opacity-70 tracking-wider mb-1">{stat.label}</p>
                        <p className="text-3xl font-black text-foreground">{stat.value}</p>
                      </div>
                    </SimpleCardContent>
                  </SimpleCard>
                ))}
              </div>

              <SimpleCard className="border-none shadow-xl bg-card">
                <SimpleCardHeader className="border-b border-border/40 pb-6">
                  <SimpleCardTitle className="text-xl font-black flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    مؤشرات الكفاءة التشغيلية
                  </SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent className="p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                      { label: 'إجمالي المهام', value: data.efficiency.totalRepairs || 0, sub: 'مهمة مسلّمة', color: 'text-foreground' },
                      { label: 'مهام مكتملة', value: data.efficiency.completedRepairs || 0, sub: 'تم إغلاقها', color: 'text-emerald-500' },
                      { label: 'قيد المتابعة', value: data.efficiency.inProgressRepairs || 0, sub: 'تحت العمل حالياً', color: 'text-blue-500' },
                      { label: 'الوقت المستنفذ', value: data.efficiency.totalTimeSpent || 0, sub: 'بإجمالي الدقائق', color: 'text-foreground' }
                    ].map((item, i) => (
                      <div key={i} className="space-y-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.label}</p>
                        <p className={cn("text-4xl font-black", item.color)}>{item.value}</p>
                        <p className="text-xs text-muted-foreground font-medium">{item.sub}</p>
                      </div>
                    ))}
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            </div>
          )}

          {selectedTab === 'comparative' && data.comparative && (
            <div className="space-y-6">
              <SimpleCard className="border-none shadow-2xl bg-card">
                <SimpleCardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-6">
                  <div>
                    <SimpleCardTitle className="text-xl font-black">تحليل المقارنة التنافسي</SimpleCardTitle>
                    <p className="text-xs text-muted-foreground mt-1">أداء الفني مقارنة ببقية أعضاء الفريق</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500 opacity-20" />
                </SimpleCardHeader>
                <SimpleCardContent className="pt-8">
                  <div style={{ height: '500px' }}>
                    <Bar
                      data={{
                        labels: (data.comparative || []).map(item => item.technicianName),
                        datasets: [
                          {
                            label: 'إجمالي العمليات',
                            data: (data.comparative || []).map(item => item.totalRepairs),
                            backgroundColor: 'oklch(var(--p) / 0.8)',
                            borderRadius: 8,
                            barThickness: 30
                          },
                          {
                            label: 'العمليات المكتملة',
                            data: (data.comparative || []).map(item => item.completedRepairs),
                            backgroundColor: 'oklch(0.627 0.265 149.22 / 0.8)',
                            borderRadius: 8,
                            barThickness: 30
                          }
                        ]
                      }}
                      options={commonChartOptions}
                    />
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            </div>
          )}

          {selectedTab === 'predictions' && data.predictions && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 opacity-5 transform group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-32 h-32" />
                  </div>
                  <p className="text-xs font-black text-blue-500 uppercase tracking-widest mb-2">منحنى التطور</p>
                  <p className="text-3xl font-black text-foreground mb-1">
                    {data.predictions.trend === 'increasing' ? 'تصاعدي ↑' :
                      data.predictions.trend === 'decreasing' ? 'تنازلي ↓' : 'مستقر →'}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">بناءً على الذكاء الاصطناعي</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 opacity-5 transform group-hover:scale-110 transition-transform">
                    <Activity className="w-32 h-32" />
                  </div>
                  <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">معدل التغيير المتوقع</p>
                  <p className="text-3xl font-black text-foreground mb-1">{data.predictions.trendPercentage?.toFixed(1) || 0}%</p>
                  <p className="text-xs text-muted-foreground font-medium">نسبة النمو الشهري</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border border-purple-500/20 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 opacity-5 transform group-hover:scale-110 transition-transform">
                    <Target className="w-32 h-32" />
                  </div>
                  <p className="text-xs font-black text-purple-500 uppercase tracking-widest mb-2">التوقع للشهر القادم</p>
                  <p className="text-3xl font-black text-foreground mb-1">{data.predictions.predictedNextMonth || 0}</p>
                  <p className="text-xs text-muted-foreground font-medium">هدف الإصلاح المقترح</p>
                </div>
              </div>

              <SimpleCard className="border-none shadow-2xl bg-card">
                <SimpleCardHeader className="pb-6 border-b border-border/40">
                  <SimpleCardTitle className="text-xl font-black">البيانات التاريخية والتنبؤية</SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent className="pt-8">
                  <div style={{ height: '350px' }}>
                    <Line
                      data={{
                        labels: (data.predictions.historicalData || []).map(item => item.date),
                        datasets: [{
                          label: 'الأداء الفعلي (إصلاحات)',
                          data: (data.predictions.historicalData || []).map(item => item.completedRepairs),
                          borderColor: 'oklch(0.627 0.265 149.22)',
                          backgroundColor: 'oklch(0.627 0.265 149.22 / 0.1)',
                          fill: true,
                          tension: 0.4,
                          pointRadius: 5,
                          borderWidth: 3
                        }]
                      }}
                      options={commonChartOptions}
                    />
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            </div>
          )}

          {selectedTab === 'skill-gaps' && data.skillGaps && (
            <div className="max-w-4xl mx-auto space-y-8">
              <SimpleCard className="border-none shadow-2xl bg-card overflow-hidden">
                <div className="bg-red-500/10 p-10 text-center border-b border-red-500/10">
                  <Award className="w-16 h-16 text-red-500 mx-auto mb-6 opacity-80" />
                  <h3 className="text-2xl font-black text-foreground mb-2">مؤشر فجوة المهارات</h3>
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-4 w-64 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 transition-all duration-1000"
                        style={{ width: `${data.skillGaps.skillGapPercentage || 0}%` }}
                      />
                    </div>
                    <span className="text-2xl font-black text-red-500">{data.skillGaps.skillGapPercentage?.toFixed(1) || 0}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 max-w-md mx-auto">
                    يمثل هذا المؤشر نسبة المهام التي تتطلب مهارات غير متوفرة بشكل كامل لدى الفني بناءً على تاريخ الأداء.
                  </p>
                </div>

                <SimpleCardContent className="p-8">
                  {data.skillGaps.missingSkills && data.skillGaps.missingSkills.length > 0 ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        <h4 className="text-lg font-black font-bold">المجالات التي تتطلب تدريب/تطوير:</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {data.skillGaps.missingSkills.map((skill, index) => (
                          <div key={index} className="group p-5 bg-muted/40 rounded-2xl border border-border/40 hover:border-primary/20 hover:bg-muted/60 transition-all">
                            <div className="flex items-center justify-between mb-3">
                              <p className="font-black text-foreground text-lg">{skill.deviceType}</p>
                              <SimpleBadge variant="warning">حاجة للتطوير</SimpleBadge>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5" />
                                عدد الحالات: {skill.count}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Target className="w-3.5 h-3.5" />
                                الأولوية: عالية
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Award className="w-10 h-10 text-emerald-500" />
                      </div>
                      <h4 className="text-xl font-black text-foreground mb-2">كفاءة تقنية ممتازة!</h4>
                      <p className="text-muted-foreground">لا توجد فجوات مهارات ملحوظة بناءً على البيانات الحالية.</p>
                    </div>
                  )}
                </SimpleCardContent>
              </SimpleCard>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default TechnicianAnalyticsPage;


