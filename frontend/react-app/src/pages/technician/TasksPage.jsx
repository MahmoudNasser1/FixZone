import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Search, LayoutGrid, Calendar, List, Activity, X, CheckCircle, Clock, AlertCircle, Circle, Edit2, ArrowRight } from 'lucide-react';
import KanbanBoard from '../../components/technician/KanbanBoard';
import CalendarView from '../../components/technician/CalendarView';
import TaskTimelineView from '../../components/technician/TaskTimelineView';
import TaskForm from '../../components/technician/TaskForm';
import TechnicianBottomNav from '../../components/technician/TechnicianBottomNav';
import { deleteTask, getTasks } from '../../services/taskService';
import { useNotifications } from '../../components/notifications/NotificationSystem';

/**
 * Tasks Page
 * صفحة إدارة المهام للفنيين
 * 
 * المميزات:
 * - Kanban Board View
 * - List View
 * - Calendar View
 * - Timeline View
 * - إضافة/تعديل/حذف المهام
 * - فلترة وبحث
 */
const TasksPage = () => {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // kanban, list, calendar, timeline
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleAddTask = () => {
    setEditingTask(null);
    setShowTaskForm(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
      return;
    }

    try {
      const response = await deleteTask(taskId);
      if (response.success) {
        notifications.success('نجح', { 
          message: 'تم حذف المهمة بنجاح',
          duration: 3000
        });
        // تحديث البيانات بدون إعادة تحميل الصفحة
        setRefreshTrigger(prev => prev + 1);
        loadTasks();
      } else {
        throw new Error(response.error || 'فشل حذف المهمة');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      notifications.error('خطأ', { 
        message: error.message || 'فشل حذف المهمة. يرجى المحاولة مرة أخرى.',
        duration: 5000
      });
    }
  };

  const handleTaskClick = (task) => {
    // يمكن فتح modal أو navigate لصفحة التفاصيل
    console.log('Task clicked:', task);
  };

  const handleTaskFormSuccess = (message = 'تم حفظ المهمة بنجاح') => {
    setShowTaskForm(false);
    setEditingTask(null);
    notifications.success('نجح', { 
      message,
      duration: 3000
    });
    // تحديث البيانات بدون إعادة تحميل الصفحة
    setRefreshTrigger(prev => prev + 1);
    loadTasks();
  };

  // جلب المهام
  const loadTasks = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filterStatus !== 'all') filters.status = filterStatus;
      if (filterPriority !== 'all') filters.priority = filterPriority;
      if (searchQuery.trim()) filters.search = searchQuery.trim();
      
      console.log('Loading tasks with filters:', filters); // Debug log
      const response = await getTasks(filters);
      console.log('Tasks response:', response); // Debug log
      
      if (response.success) {
        const tasksList = response.data?.tasks || response.data || [];
        console.log('Tasks loaded:', tasksList.length); // Debug log
        setTasks(tasksList);
      } else {
        throw new Error(response.error || 'فشل تحميل المهام');
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      notifications.error('خطأ', { 
        message: error.message || 'فشل تحميل المهام. يرجى المحاولة مرة أخرى.',
        duration: 5000
      });
      setTasks([]); // تعيين قائمة فارغة عند الفشل
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, filterStatus, filterPriority]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadTasks();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + K للبحث
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[aria-label="بحث في المهام"]');
        if (searchInput) {
          searchInput.focus();
        }
      }
      // Ctrl/Cmd + N لإضافة مهمة جديدة
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleAddTask();
      }
      // Escape لإغلاق Filter Panel
      if (e.key === 'Escape' && showFilterPanel) {
        setShowFilterPanel(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFilterPanel]);

  // Filtered tasks for List View
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const query = searchQuery.toLowerCase();
    return tasks.filter(task => 
      task.title?.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.repairNumber?.toString().includes(query)
    );
  }, [tasks, searchQuery]);

  const getStatusIcon = (status) => {
    const icons = {
      todo: Circle,
      in_progress: Clock,
      review: AlertCircle,
      done: CheckCircle
    };
    return icons[status] || Circle;
  };

  const getStatusText = (status) => {
    const texts = {
      todo: 'معلقة',
      in_progress: 'قيد التنفيذ',
      review: 'قيد المراجعة',
      done: 'مكتملة'
    };
    return texts[status] || status;
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-20 md:pb-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          {/* Back Button */}
          <div className="mb-4">
            <button
              onClick={() => navigate('/technician/dashboard')}
              aria-label="العودة إلى لوحة التحكم"
              className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <ArrowRight className="w-5 h-5" />
              <span className="font-medium">العودة للرئيسية</span>
            </button>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">إدارة المهام</h1>
              <p className="text-muted-foreground mt-1">نظم مهامك وإصلاحاتك بكفاءة</p>
            </div>
            <button
              onClick={handleAddTask}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>مهمة جديدة</span>
            </button>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-card rounded-lg p-1 border border-border" role="tablist" aria-label="طرق عرض المهام">
              <button
                onClick={() => setViewMode('kanban')}
                role="tab"
                aria-selected={viewMode === 'kanban'}
                aria-label="لوحة Kanban"
                className={`p-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${viewMode === 'kanban' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                title="لوحة Kanban"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                role="tab"
                aria-selected={viewMode === 'list'}
                aria-label="قائمة"
                className={`p-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title="قائمة"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                role="tab"
                aria-selected={viewMode === 'calendar'}
                aria-label="تقويم"
                className={`p-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${viewMode === 'calendar' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title="تقويم"
              >
                <Calendar className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                role="tab"
                aria-selected={viewMode === 'timeline'}
                aria-label="الخط الزمني"
                className={`p-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${viewMode === 'timeline' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title="الخط الزمني"
              >
                <Activity className="w-4 h-4" />
              </button>
            </div>

            {/* Search & Filter */}
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="بحث في المهام..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="بحث في المهام"
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-foreground"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                aria-label="فلترة المهام"
                aria-expanded={showFilterPanel}
                className={`p-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  showFilterPanel || filterStatus !== 'all' || filterPriority !== 'all'
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                title="فلترة"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="mb-6 bg-card rounded-xl shadow-sm border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">الفلاتر</h3>
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setFilterPriority('all');
                }}
                className="text-sm text-primary hover:text-primary/80"
              >
                مسح الكل
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">الحالة</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="all">الكل</option>
                  <option value="todo">معلقة</option>
                  <option value="in_progress">قيد التنفيذ</option>
                  <option value="review">قيد المراجعة</option>
                  <option value="done">مكتملة</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">الأولوية</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="all">الكل</option>
                  <option value="urgent">عاجل</option>
                  <option value="high">عالي</option>
                  <option value="medium">متوسط</option>
                  <option value="low">منخفض</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => {
                loadTasks();
                setShowFilterPanel(false);
              }}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              تطبيق الفلاتر
            </button>
          </div>
        )}

        {/* Content */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {viewMode === 'kanban' && (
            <KanbanBoard
              onTaskClick={handleTaskClick}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              refreshTrigger={refreshTrigger}
            />
          )}
          
          {viewMode === 'list' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <List className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium mb-2">لا توجد مهام</p>
                  <p className="text-sm mb-4">جرب تغيير الفلاتر أو البحث</p>
                  <button
                    onClick={handleAddTask}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    إضافة مهمة جديدة
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTasks.map((task) => {
                    const StatusIcon = getStatusIcon(task.status);
                    return (
                      <div
                        key={task.id}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <StatusIcon className="w-5 h-5 text-muted-foreground" />
                              <h3 className="font-semibold text-foreground">{task.title}</h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                task.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                task.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}>
                                {task.priority === 'urgent' ? 'عاجل' :
                                 task.priority === 'high' ? 'عالي' :
                                 task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                              </span>
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                {getStatusText(task.status)}
                              </span>
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {task.dueDate && (
                                <span>{new Date(task.dueDate).toLocaleDateString('ar-EG')}</span>
                              )}
                              {task.estimatedDuration && (
                                <span>{task.estimatedDuration} دقيقة</span>
                              )}
                              {task.repairNumber && (
                                <span>إصلاح: #{task.repairNumber}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEditTask(task)}
                              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="تعديل"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="حذف"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          {viewMode === 'calendar' && (
            <CalendarView
              onTaskClick={handleTaskClick}
              onAddTask={(taskData) => {
                setEditingTask(taskData || null);
                setShowTaskForm(true);
              }}
              onEditTask={handleEditTask}
              refreshTrigger={refreshTrigger}
            />
          )}

          {viewMode === 'timeline' && (
            <TaskTimelineView
              onTaskClick={handleTaskClick}
              onEditTask={handleEditTask}
              refreshTrigger={refreshTrigger}
            />
          )}
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          task={editingTask}
          onClose={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
          onSuccess={handleTaskFormSuccess}
        />
      )}

      {/* Bottom Navigation - Mobile Only */}
      <TechnicianBottomNav />
    </div>
  );
};

export default TasksPage;

