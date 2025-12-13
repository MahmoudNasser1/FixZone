import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, AlertCircle, ChevronRight } from 'lucide-react';

/**
 * Upcoming Tasks Widget
 * يعرض قائمة المهام القادمة للفني
 */
export default function UpcomingTasksWidget({ tasks = [], loading = false, onViewAll }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
        <div className="h-4 bg-muted rounded w-32 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      default:
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'بدون تاريخ';
    try {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === today.toDateString()) {
        return 'اليوم';
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'غداً';
      } else {
        return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
      }
    } catch (e) {
      return 'تاريخ غير صحيح';
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">المهام القادمة</h3>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              عرض الكل
            </button>
          )}
        </div>
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">لا توجد مهام قادمة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">المهام القادمة</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            عرض الكل
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="space-y-3 flex-1 overflow-y-auto">
        {tasks.slice(0, 5).map((task) => (
          <div
            key={task.id}
            onClick={() => navigate(`/technician/tasks/${task.id}`)}
            className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-medium text-foreground flex-1 line-clamp-1">{task.title}</h4>
              {task.priority && (
                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority === 'high' ? 'عاجل' : task.priority === 'medium' ? 'متوسط' : 'عادي'}
                </span>
              )}
            </div>
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{task.description}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(task.dueDate)}</span>
                </div>
              )}
              {task.status && (
                <span className={`px-2 py-0.5 rounded ${
                  task.status === 'in_progress' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {task.status === 'in_progress' ? 'قيد التنفيذ' : 'معلق'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


