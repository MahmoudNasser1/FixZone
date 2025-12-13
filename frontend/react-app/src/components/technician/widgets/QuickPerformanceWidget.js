import React from 'react';
import { TrendingUp, Clock, CheckCircle, BarChart3 } from 'lucide-react';

/**
 * Quick Performance Widget
 * يعرض مؤشرات الأداء السريعة للفني
 */
export default function QuickPerformanceWidget({ performance, loading = false }) {
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
        <div className="h-4 bg-muted rounded w-32 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-muted rounded"></div>
          <div className="h-16 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 h-full">
        <h3 className="text-lg font-bold text-foreground mb-4">الأداء السريع</h3>
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">لا توجد بيانات أداء متاحة</p>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      label: 'متوسط وقت الإصلاح',
      value: `${performance.averageRepairTime || 0} ساعة`,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      description: 'متوسط الوقت المستغرق في الإصلاح',
    },
    {
      label: 'معدل الإنجاز',
      value: `${performance.completionRate || 0}%`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      description: 'نسبة المهام المكتملة',
    },
    {
      label: 'المكتملة (7 أيام)',
      value: performance.totalCompleted || 0,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      description: 'عدد المهام المكتملة في آخر 7 أيام',
    },
  ];

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 h-full">
      <h3 className="text-lg font-bold text-foreground mb-4">الأداء السريع</h3>
      <div className="space-y-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;

          return (
            <div
              key={index}
              className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                  <p className="text-2xl font-bold text-foreground mb-1">{metric.value}</p>
                  {metric.description && (
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


