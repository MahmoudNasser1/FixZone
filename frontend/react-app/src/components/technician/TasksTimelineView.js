import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getTasks, updateTask } from '../../services/taskService';
import { useNotifications } from '../notifications/NotificationSystem';

/**
 * 📅 Tasks Timeline View Component
 * 
 * عرض زمني للمهام (Gantt Chart style)
 * - عرض المهام على Timeline
 * - عرض التداخلات
 * - إعادة الجدولة
 */
export default function TasksTimelineView({ onTaskClick, onAddTask }) {
  const notifications = useNotifications();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date());
  const [viewDays, setViewDays] = useState(7); // 7, 14, 30 days

  useEffect(() => {
    loadTasks();
  }, [startDate, viewDays]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + viewDays);

      const response = await getTasks({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      if (response.success) {
        setTasks(response.data.tasks || []);
      } else {
        throw new Error(response.error || 'فشل تحميل المهام');
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      notifications.error('خطأ', { message: 'فشل تحميل المهام' });
    } finally {
      setLoading(false);
    }
  };

  const navigateDays = (direction) => {
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() + (direction * viewDays));
    setStartDate(newDate);
  };

  const getDaysArray = () => {
    const days = [];
    for (let i = 0; i < viewDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getTaskPosition = (task) => {
    if (!task.dueDate) return null;
    const taskDate = new Date(task.dueDate);
    const daysDiff = Math.floor((taskDate - startDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0 || daysDiff >= viewDays) return null;
    
    return {
      day: daysDiff,
      width: 1, // يمكن توسيعها حسب المدة
    };
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return 'bg-green-200 dark:bg-green-900/30 border-green-400';
      case 'in_progress': return 'bg-blue-200 dark:bg-blue-900/30 border-blue-400';
      case 'review': return 'bg-purple-200 dark:bg-purple-900/30 border-purple-400';
      case 'todo': return 'bg-yellow-200 dark:bg-yellow-900/30 border-yellow-400';
      case 'cancelled': return 'bg-red-200 dark:bg-red-900/30 border-red-400';
      default: return 'bg-gray-200 dark:bg-gray-900/30 border-gray-400';
    }
  };

  const days = getDaysArray();

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-4">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateDays(-1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-foreground">
            {startDate.toLocaleDateString('ar-EG')} - {days[days.length - 1].toLocaleDateString('ar-EG')}
          </h2>
          <button
            onClick={() => navigateDays(1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={viewDays}
            onChange={(e) => setViewDays(parseInt(e.target.value))}
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value={7}>7 أيام</option>
            <option value={14}>14 يوم</option>
            <option value={30}>30 يوم</option>
          </select>
          {onAddTask && (
            <button
              onClick={() => onAddTask(new Date())}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Calendar className="w-4 h-4" />
              مهمة جديدة
            </button>
          )}
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Days Header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {days.map((day, index) => (
              <div
                key={index}
                className={`text-center p-2 rounded-lg border ${
                  day.toDateString() === new Date().toDateString()
                    ? 'bg-primary/10 border-primary'
                    : 'bg-muted border-border'
                }`}
              >
                <div className="text-xs font-medium text-muted-foreground">
                  {day.toLocaleDateString('ar-EG', { weekday: 'short' })}
                </div>
                <div className="text-sm font-bold text-foreground">
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Tasks Timeline */}
          <div className="space-y-2">
            {tasks
              .filter(task => task.dueDate)
              .map((task) => {
                const position = getTaskPosition(task);
                if (!position) return null;

                return (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick && onTaskClick(task)}
                    className="relative h-12 cursor-pointer"
                  >
                    <div
                      className={`absolute top-0 h-full rounded-lg border-2 ${getStatusColor(task.status)} hover:opacity-80 transition-opacity`}
                      style={{
                        left: `${(position.day / viewDays) * 100}%`,
                        width: `${(position.width / viewDays) * 100}%`,
                        minWidth: '120px',
                      }}
                    >
                      <div className="p-2 h-full flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-foreground truncate">
                            {task.title || (task.repairNumber ? `إصلاح #${task.repairNumber.replace('REP-', '')}` : 'مهمة بدون عنوان')}
                          </div>
                          {task.dueTime && (
                            <div className="text-xs text-muted-foreground">
                              {task.dueTime}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            
            {tasks.filter(task => task.dueDate).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد مهام مجدولة في هذه الفترة</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-200 dark:bg-yellow-900/30 border border-yellow-400" />
          <span className="text-muted-foreground">معلق</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-200 dark:bg-blue-900/30 border border-blue-400" />
          <span className="text-muted-foreground">قيد التنفيذ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-200 dark:bg-green-900/30 border border-green-400" />
          <span className="text-muted-foreground">مكتمل</span>
        </div>
      </div>
    </div>
  );
}

