import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  TrendingUp, Activity, BarChart3, PieChart, Target, AlertTriangle,
  RefreshCw, Calendar, Users, Award
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import technicianAnalyticsService from '../../services/technicianAnalyticsService';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import PageTransition from '../../components/ui/PageTransition';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
      <PageTransition>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">تحليلات الأداء</h1>
            <p className="text-muted-foreground mt-1">تحليلات شاملة لأداء الفني</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg bg-background"
            >
              <option value="week">أسبوع</option>
              <option value="month">شهر</option>
              <option value="year">سنة</option>
            </select>
            <SimpleButton onClick={loadAnalytics} variant="outline">
              <RefreshCw className="w-4 h-4 ml-1" />
              تحديث
            </SimpleButton>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
          <button
            onClick={() => setSelectedTab('trends')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              selectedTab === 'trends'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline ml-1" />
            الاتجاهات
          </button>
          <button
            onClick={() => setSelectedTab('efficiency')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              selectedTab === 'efficiency'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Activity className="w-4 h-4 inline ml-1" />
            الكفاءة
          </button>
          <button
            onClick={() => setSelectedTab('comparative')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              selectedTab === 'comparative'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4 inline ml-1" />
            المقارنة
          </button>
          <button
            onClick={() => setSelectedTab('predictions')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              selectedTab === 'predictions'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Target className="w-4 h-4 inline ml-1" />
            التوقعات
          </button>
          <button
            onClick={() => setSelectedTab('skill-gaps')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              selectedTab === 'skill-gaps'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Award className="w-4 h-4 inline ml-1" />
            فجوات المهارات
          </button>
        </div>

        {/* Content */}
        {selectedTab === 'trends' && data.trends && (
          <div className="space-y-4">
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>اتجاهات الأداء</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={data.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="repairsCount" stroke="#3b82f6" name="إجمالي الإصلاحات" />
                    <Line type="monotone" dataKey="completedCount" stroke="#10b981" name="مكتملة" />
                  </LineChart>
                </ResponsiveContainer>
              </SimpleCardContent>
            </SimpleCard>
          </div>
        )}

        {selectedTab === 'efficiency' && data.efficiency && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SimpleCard>
                <SimpleCardContent className="p-4">
                  <p className="text-sm text-muted-foreground">معدل الإنجاز</p>
                  <p className="text-2xl font-bold">{data.efficiency.completionRate?.toFixed(1) || 0}%</p>
                </SimpleCardContent>
              </SimpleCard>
              <SimpleCard>
                <SimpleCardContent className="p-4">
                  <p className="text-sm text-muted-foreground">متوسط الوقت</p>
                  <p className="text-2xl font-bold">{data.efficiency.avgTimeSpent?.toFixed(1) || 0} دقيقة</p>
                </SimpleCardContent>
              </SimpleCard>
              <SimpleCard>
                <SimpleCardContent className="p-4">
                  <p className="text-sm text-muted-foreground">درجة الكفاءة</p>
                  <p className="text-2xl font-bold">{data.efficiency.efficiencyScore || 0}</p>
                </SimpleCardContent>
              </SimpleCard>
            </div>
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>تفاصيل الكفاءة</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي الإصلاحات</p>
                    <p className="text-xl font-bold">{data.efficiency.totalRepairs || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">مكتملة</p>
                    <p className="text-xl font-bold text-green-600">{data.efficiency.completedRepairs || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">قيد التنفيذ</p>
                    <p className="text-xl font-bold text-blue-600">{data.efficiency.inProgressRepairs || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي الوقت</p>
                    <p className="text-xl font-bold">{data.efficiency.totalTimeSpent || 0} دقيقة</p>
                  </div>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          </div>
        )}

        {selectedTab === 'comparative' && data.comparative && (
          <div className="space-y-4">
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>مقارنة بين الفنيين</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={data.comparative}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="technicianName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalRepairs" fill="#3b82f6" name="إجمالي الإصلاحات" />
                    <Bar dataKey="completedRepairs" fill="#10b981" name="مكتملة" />
                  </BarChart>
                </ResponsiveContainer>
              </SimpleCardContent>
            </SimpleCard>
          </div>
        )}

        {selectedTab === 'predictions' && data.predictions && (
          <div className="space-y-4">
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>توقعات الأداء</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">الاتجاه</p>
                    <p className="text-2xl font-bold">
                      {data.predictions.trend === 'increasing' ? '↑ متزايد' : 
                       data.predictions.trend === 'decreasing' ? '↓ متناقص' : '→ مستقر'}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">نسبة التغيير</p>
                    <p className="text-2xl font-bold">{data.predictions.trendPercentage?.toFixed(1) || 0}%</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">التوقع الشهري القادم</p>
                    <p className="text-2xl font-bold">{data.predictions.predictedNextMonth || 0}</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.predictions.historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="completedRepairs" stroke="#10b981" name="إصلاحات مكتملة" />
                  </LineChart>
                </ResponsiveContainer>
              </SimpleCardContent>
            </SimpleCard>
          </div>
        )}

        {selectedTab === 'skill-gaps' && data.skillGaps && (
          <div className="space-y-4">
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>تحليل فجوات المهارات</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">نسبة فجوة المهارات</p>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-red-600 h-4 rounded-full"
                      style={{ width: `${data.skillGaps.skillGapPercentage || 0}%` }}
                    />
                  </div>
                  <p className="text-sm mt-1">{data.skillGaps.skillGapPercentage?.toFixed(1) || 0}%</p>
                </div>
                {data.skillGaps.missingSkills && data.skillGaps.missingSkills.length > 0 && (
                  <div className="mt-4">
                    <p className="font-semibold mb-2">المهارات المفقودة:</p>
                    <div className="space-y-2">
                      {data.skillGaps.missingSkills.map((skill, index) => (
                        <div key={index} className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <p className="font-medium">{skill.deviceType}</p>
                          <p className="text-sm text-muted-foreground">عدد الإصلاحات: {skill.count}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </SimpleCardContent>
            </SimpleCard>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default TechnicianAnalyticsPage;


