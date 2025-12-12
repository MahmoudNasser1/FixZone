import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Clock, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { getTasks } from '../../services/taskService';
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, parseISO, differenceInHours, differenceInDays, isWithinInterval } from 'date-fns';
import { ar } from 'date-fns/locale';

/**
 * Timeline View Component
 * عرض زمني أفقي للمهام - مستوحى من Gantt Charts
 * 
 * المميزات:
 * - عرض زمني أفقي للمهام
 * - عرض المدة المتوقعة
 * - سحب وإفلات لإعادة الجدولة
 * - Zoom In/Out
 * - ألوان حسب الأولوية والحالة
 */
const TimelineView = ({ onTaskClick, onEditTask, refreshTrigger = 0 }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = week, 2 = month
  const [selectedTask, setSelectedTask] = useState(null);
  const timelineRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);

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

  // حساب موضع المهمة على Timeline
  const calculateTaskPosition = (task) => {
    if (!task.dueDate) return null;

    const taskDate = parseISO(task.dueDate);
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 6 });
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 6 });

    // التحقق من أن المهمة ضمن الأسبوع المعروض
    if (!isWithinInterval(taskDate, { start: weekStart, end: weekEnd })) {
      return null;
    }

    // حساب الموضع النسبي
    const daysDiff = differenceInDays(taskDate, weekStart);
    const hoursDiff = task.dueTime ? parseInt(task.dueTime.split(':')[0]) : 0;
    const left = (daysDiff * (100 / 7)) + (hoursDiff * (100 / (7 * 24)));

    // حساب العرض (المدة)
    const duration = task.estimatedDuration || 2; // ساعات افتراضية
    const width = (duration / (7 * 24)) * 100;

    return { left: `${left}%`, width: `${Math.max(width, 2)}%` };
  };

  // الحصول على لون المهمة
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

  // توليد أيام الأسبوع
  const generateWeekDays = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 6 });
    const days = [];
    const weekDays = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      days.push({
        date: day,
        label: weekDays[i],
        dayNumber: format(day, 'd')
      });
    }

    return days;
  };

  // توليد ساعات اليوم
  const generateHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  };

  // المهام المرئية في الأسبوع الحالي
  const visibleTasks = useMemo(() => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 6 });
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 6 });

    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = parseISO(task.dueDate);
      return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
    });
  }, [tasks, currentWeek]);

  // التنقل بين الأسابيع
  const navigateWeek = (direction) => {
    setCurrentWeek(prev => {
      const newWeek = direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1);
      return newWeek;
    });
  };

  // Zoom
  const handleZoom = (direction) => {
    setZoomLevel(prev => {
      const newZoom = direction === 'in' ? Math.min(prev + 0.5, 3) : Math.max(prev - 0.5, 0.5);
      return newZoom;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const weekDays = generateWeekDays();
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 6 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 6 });

  return (
    <div className="timeline-view bg-white dark:bg-gray-900 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Current Week Display */}
          <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {format(weekStart, 'd MMM', { locale: ar })} - {format(weekEnd, 'd MMM yyyy', { locale: ar })}
          </div>

          {/* Today Button */}
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            هذا الأسبوع
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleZoom('out')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="تصغير"
          >
            <ZoomOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => handleZoom('in')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="تكبير"
          >
            <ZoomIn className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="timeline-container overflow-x-auto" ref={timelineRef}>
        <div className="min-w-full">
          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2 border-b pb-2">
            {weekDays.map((day, index) => {
              const isToday = format(day.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              return (
                <div
                  key={index}
                  className={`text-center p-2 rounded ${
                    isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {day.label}
                  </div>
                  <div className={`text-lg font-semibold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {day.dayNumber}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline Grid */}
          <div className="relative" style={{ minHeight: `${visibleTasks.length * 60 + 100}px` }}>
            {/* Grid Lines */}
            <div className="absolute inset-0 grid grid-cols-7 gap-1">
              {weekDays.map((day, index) => (
                <div
                  key={index}
                  className="border-r border-gray-200 dark:border-gray-700"
                  style={{ minHeight: '100%' }}
                />
              ))}
            </div>

            {/* Tasks */}
            <div className="relative z-10">
              {visibleTasks.map((task, index) => {
                const position = calculateTaskPosition(task);
                if (!position) return null;

                const StatusIcon = getStatusIcon(task.status);
                const taskColor = getTaskColor(task);

                return (
                  <div
                    key={task.id}
                    className="absolute"
                    style={{
                      left: position.left,
                      width: position.width,
                      top: `${index * 60 + 20}px`,
                      height: '50px'
                    }}
                  >
                    <div
                      onClick={() => {
                        setSelectedTask(task);
                        onTaskClick && onTaskClick(task);
                      }}
                      className={`
                        h-full rounded-lg cursor-pointer shadow-md
                        ${taskColor} text-white
                        hover:opacity-90 transition-opacity
                        border-2 ${selectedTask?.id === task.id ? 'border-white ring-2 ring-primary' : 'border-transparent'}
                      `}
                      title={task.title}
                    >
                      <div className="p-2 h-full flex items-center gap-2 overflow-hidden">
                        <StatusIcon className="w-4 h-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{task.title}</div>
                          {task.dueTime && (
                            <div className="text-xs opacity-90">{task.dueTime}</div>
                          )}
                        </div>
                        {task.estimatedDuration && (
                          <div className="text-xs opacity-90 whitespace-nowrap">
                            {task.estimatedDuration}س
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Empty State */}
              {visibleTasks.length === 0 && (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <p>لا توجد مهام في هذا الأسبوع</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task Details Sidebar */}
      {selectedTask && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
              {selectedTask.title}
            </h3>
            <button
              onClick={() => setSelectedTask(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          {selectedTask.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {selectedTask.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
            <div>الأولوية: <span className="capitalize">{selectedTask.priority}</span></div>
            <div>الحالة: <span className="capitalize">{selectedTask.status}</span></div>
            {selectedTask.dueDate && (
              <div>التاريخ: {format(parseISO(selectedTask.dueDate), 'd MMM yyyy', { locale: ar })}</div>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                onEditTask && onEditTask(selectedTask);
                setSelectedTask(null);
              }}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              تعديل
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineView;



