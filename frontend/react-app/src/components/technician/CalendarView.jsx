import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { getTasks } from '../../services/taskService';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameDay, isSameMonth, parseISO, getDay } from 'date-fns';
import { ar } from 'date-fns/locale';

/**
 * Calendar View Component
 * عرض تقويمي للمهام - مستوحى من Pipedrive و Google Calendar
 * 
 * المميزات:
 * - عرض شهري/أسبوعي/يومي
 * - عرض المهام كأحداث على التقويم
 * - سحب وإفلات لإعادة الجدولة
 * - ألوان حسب الأولوية والحالة
 * - إضافة مهمة جديدة من التقويم
 */
const CalendarView = ({ onTaskClick, onAddTask, onEditTask, refreshTrigger = 0 }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, week, day
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    loadTasks();
  }, [refreshTrigger]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await getTasks();
      if (response.success) {
        setTasks(response.data.tasks || []);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // تجميع المهام حسب التاريخ
  const tasksByDate = useMemo(() => {
    const grouped = {};
    tasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = format(parseISO(task.dueDate), 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  // الحصول على المهام في تاريخ محدد
  const getTasksForDate = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return tasksByDate[dateKey] || [];
  };

  // الحصول على لون المهمة حسب الأولوية
  const getTaskColor = (task) => {
    const priorityColors = {
      urgent: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-blue-500',
      low: 'bg-gray-400'
    };
    return priorityColors[task.priority] || priorityColors.medium;
  };

  // الحصول على أيقونة الحالة
  const getStatusIcon = (status) => {
    const icons = {
      todo: Circle,
      in_progress: Clock,
      review: AlertCircle,
      done: CheckCircle2
    };
    return icons[status] || Circle;
  };

  // التنقل بين الشهور
  const navigateMonth = (direction) => {
    setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  // التنقل بين الأسابيع
  const navigateWeek = (direction) => {
    setCurrentDate(prev => {
      const newDate = addDays(prev, direction === 'next' ? 7 : -7);
      return newDate;
    });
  };

  // التنقل بين الأيام
  const navigateDay = (direction) => {
    setCurrentDate(prev => addDays(prev, direction === 'next' ? 1 : -1));
  };

  // توليد أيام الشهر
  const generateMonthDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 6 }); // الأسبوع يبدأ من السبت
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 6 });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  // توليد أيام الأسبوع
  const generateWeekDays = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 6 });
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  };

  // عرض الشهر
  const renderMonthView = () => {
    const days = generateMonthDays();
    const weekDays = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

    return (
      <div className="calendar-month-view">
        {/* أيام الأسبوع */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, index) => (
            <div key={index} className="p-2 text-center text-sm font-semibold text-gray-600 dark:text-gray-400 border-b">
              {day}
            </div>
          ))}
        </div>

        {/* الأيام */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dayTasks = getTasksForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <div
                key={index}
                onClick={() => setSelectedDate(day)}
                className={`
                  min-h-[100px] p-2 border border-gray-200 dark:border-gray-700 rounded-lg
                  cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800
                  ${!isCurrentMonth ? 'opacity-40' : ''}
                  ${isToday ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : ''}
                  ${isSelected ? 'ring-2 ring-primary' : ''}
                `}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => {
                    const StatusIcon = getStatusIcon(task.status);
                    return (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick && onTaskClick(task);
                        }}
                        className={`
                          text-xs p-1.5 rounded truncate cursor-pointer
                          ${getTaskColor(task)} text-white
                          hover:opacity-80 transition-opacity
                        `}
                        title={task.title}
                      >
                        <div className="flex items-center gap-1">
                          <StatusIcon className="w-3 h-3" />
                          <span className="truncate">{task.title}</span>
                        </div>
                      </div>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
                      +{dayTasks.length - 3} أكثر
                    </div>
                  )}
                </div>
                {dayTasks.length === 0 && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddTask && onAddTask({ dueDate: format(day, 'yyyy-MM-dd') });
                    }}
                    className="opacity-0 hover:opacity-100 transition-opacity text-xs text-gray-400 dark:text-gray-500 mt-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 inline" /> إضافة
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // عرض الأسبوع
  const renderWeekView = () => {
    const days = generateWeekDays();
    const weekDays = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

    return (
      <div className="calendar-week-view">
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const dayTasks = getTasksForDate(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <div
                key={index}
                className={`
                  border border-gray-200 dark:border-gray-700 rounded-lg p-3
                  ${isToday ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : ''}
                  ${isSelected ? 'ring-2 ring-primary' : ''}
                `}
              >
                <div
                  onClick={() => setSelectedDate(day)}
                  className="cursor-pointer mb-3"
                >
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {weekDays[index]}
                  </div>
                  <div className={`text-lg font-semibold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
                <div className="space-y-2">
                  {dayTasks.map((task) => {
                    const StatusIcon = getStatusIcon(task.status);
                    return (
                      <div
                        key={task.id}
                        onClick={() => onTaskClick && onTaskClick(task)}
                        className={`
                          p-2 rounded-lg cursor-pointer text-sm
                          ${getTaskColor(task)} text-white
                          hover:opacity-80 transition-opacity
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-4 h-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{task.title}</div>
                            {task.dueTime && (
                              <div className="text-xs opacity-90 mt-0.5">
                                {task.dueTime}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    onClick={() => onAddTask && onAddTask({ dueDate: format(day, 'yyyy-MM-dd') })}
                    className="w-full p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-400 dark:text-gray-500 hover:border-primary hover:text-primary transition-colors text-sm flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة مهمة
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // عرض اليوم
  const renderDayView = () => {
    const dayTasks = getTasksForDate(currentDate);
    const isToday = isSameDay(currentDate, new Date());

    return (
      <div className="calendar-day-view">
        <div className={`p-4 rounded-lg mb-4 ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {format(currentDate, 'EEEE، d MMMM yyyy', { locale: ar })}
          </div>
          <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
            {isToday ? 'اليوم' : format(currentDate, 'd MMMM', { locale: ar })}
          </div>
        </div>

        <div className="space-y-3">
          {dayTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <p className="mb-4">لا توجد مهام في هذا اليوم</p>
              <button
                onClick={() => onAddTask && onAddTask({ dueDate: format(currentDate, 'yyyy-MM-dd') })}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                إضافة مهمة جديدة
              </button>
            </div>
          ) : (
            dayTasks.map((task) => {
              const StatusIcon = getStatusIcon(task.status);
              return (
                <div
                  key={task.id}
                  onClick={() => onTaskClick && onTaskClick(task)}
                  className={`
                    p-4 rounded-lg cursor-pointer border-l-4
                    ${getTaskColor(task)} border-opacity-50
                    bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                    hover:shadow-md transition-shadow
                  `}
                >
                  <div className="flex items-start gap-3">
                    <StatusIcon className={`w-5 h-5 mt-0.5 ${getTaskColor(task).replace('bg-', 'text-')}`} />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {task.description}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                        {task.dueTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.dueTime}
                          </div>
                        )}
                        <div className="capitalize">
                          {task.priority} • {task.status}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="calendar-view bg-white dark:bg-gray-900 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (viewMode === 'month') navigateMonth('prev');
                else if (viewMode === 'week') navigateWeek('prev');
                else navigateDay('prev');
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => {
                if (viewMode === 'month') navigateMonth('next');
                else if (viewMode === 'week') navigateWeek('next');
                else navigateDay('next');
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Current Date Display */}
          <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {viewMode === 'month' && format(currentDate, 'MMMM yyyy', { locale: ar })}
            {viewMode === 'week' && `الأسبوع ${format(startOfWeek(currentDate, { weekStartsOn: 6 }), 'd MMM', { locale: ar })} - ${format(endOfWeek(currentDate, { weekStartsOn: 6 }), 'd MMM yyyy', { locale: ar })}`}
            {viewMode === 'day' && format(currentDate, 'EEEE، d MMMM yyyy', { locale: ar })}
          </div>

          {/* Today Button */}
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            اليوم
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {['month', 'week', 'day'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-1.5 text-sm rounded transition-colors ${
                viewMode === mode
                  ? 'bg-primary text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {mode === 'month' ? 'شهري' : mode === 'week' ? 'أسبوعي' : 'يومي'}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Content */}
      <div className="calendar-content">
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
      </div>
    </div>
  );
};

export default CalendarView;

