import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { getTasks } from '../../services/taskService';
import { useNotifications } from '../notifications/NotificationSystem';

/**
 * 📅 Calendar View Component
 * 
 * عرض المهام على التقويم
 * - عرض يومي/أسبوعي/شهري
 * - إضافة مهمة من التقويم
 * - سحب وإفلات لإعادة الجدولة
 */
export default function CalendarView({ onTaskClick, onAddTask, viewMode = 'month' }) {
  const notifications = useNotifications();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await getTasks();
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

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Convert to Arabic week (Saturday = 0)
    const arabicStartingDay = (startingDayOfWeek + 1) % 7;
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < arabicStartingDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getTasksForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
      return taskDate === dateStr;
    });
  };

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const getMonthName = (date) => {
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[date.getMonth()];
  };

  const getWeekDays = () => {
    return ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = getWeekDays();

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
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-foreground">
            {getMonthName(currentDate)} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={() => {
            const today = new Date();
            setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
            setSelectedDate(today);
            if (onAddTask) onAddTask(today);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          مهمة جديدة
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Week Days Header */}
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-sm text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {days.map((date, index) => {
          const dayTasks = getTasksForDate(date);
          const isToday = date && 
            date.toDateString() === new Date().toDateString();
          const isSelected = date && selectedDate &&
            date.toDateString() === selectedDate.toDateString();

          return (
            <div
              key={index}
              onClick={() => {
                if (date) {
                  setSelectedDate(date);
                  if (onAddTask) onAddTask(date);
                }
              }}
              className={`min-h-[100px] p-2 border border-border rounded-lg transition-all ${
                !date ? 'bg-muted/30' :
                isToday ? 'bg-primary/10 border-primary' :
                isSelected ? 'bg-primary/5 border-primary/50' :
                'bg-card hover:bg-muted/50 cursor-pointer'
              }`}
            >
              {date && (
                <>
                  <div className={`text-sm font-medium mb-1 ${
                    isToday ? 'text-primary' : 'text-foreground'
                  }`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onTaskClick) onTaskClick(task);
                        }}
                        className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${
                          task.status === 'done' 
                            ? 'bg-green-200 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : task.status === 'in_progress'
                            ? 'bg-blue-200 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                            : task.status === 'review'
                            ? 'bg-purple-200 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                            : 'bg-yellow-200 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                        }`}
                        title={task.title || (task.repairNumber ? `إصلاح #${task.repairNumber.replace('REP-', '')}` : 'مهمة بدون عنوان')}
                      >
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${getPriorityColor(task.priority)}`} />
                        {task.title || (task.repairNumber ? `إصلاح #${task.repairNumber.replace('REP-', '')}` : 'مهمة بدون عنوان')}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{dayTasks.length - 3} أكثر
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-200 dark:bg-yellow-900/30" />
          <span className="text-muted-foreground">معلق</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-200 dark:bg-blue-900/30" />
          <span className="text-muted-foreground">قيد التنفيذ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-200 dark:bg-green-900/30" />
          <span className="text-muted-foreground">مكتمل</span>
        </div>
      </div>
    </div>
  );
}

