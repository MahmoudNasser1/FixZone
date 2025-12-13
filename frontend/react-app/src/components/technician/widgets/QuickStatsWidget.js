import React from 'react';
import { Wrench, CheckCircle, Clock, Timer, TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Quick Stats Widget
 * يعرض إحصائيات سريعة للفني
 */
export default function QuickStatsWidget({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
        <div className="h-4 bg-muted rounded w-24 mb-4"></div>
        <div className="space-y-3">
          <div className="h-8 bg-muted rounded"></div>
          <div className="h-8 bg-muted rounded"></div>
          <div className="h-8 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'قيد العمل',
      value: data?.inProgress || 0,
      icon: Wrench,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      change: data?.inProgressChange || 0,
    },
    {
      label: 'مكتملة اليوم',
      value: data?.completed || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      change: data?.completedChange || 0,
    },
    {
      label: 'معلقة',
      value: data?.pending || 0,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      label: 'وقت العمل',
      value: data?.dailyTime ? `${data.dailyTime.hours || 0}:${(data.dailyTime.minutes || 0).toString().padStart(2, '0')}` : '0:00',
      icon: Timer,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 h-full flex flex-col">
      <h3 className="text-lg font-bold text-foreground mb-4">إحصائيات سريعة</h3>
      <div className="space-y-3 flex-1">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const hasChange = stat.change !== undefined && stat.change !== 0;
          const isPositive = stat.change > 0;

          return (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    {hasChange && (
                      <div className={`flex items-center gap-1 text-xs ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isPositive ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>{Math.abs(stat.change)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

