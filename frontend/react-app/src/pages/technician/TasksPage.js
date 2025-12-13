import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, CheckCircle, Circle, Clock, AlertCircle, Edit, Trash2, Calendar, List, LayoutDashboard, GanttChart } from 'lucide-react';
import { getTasks, createTask, updateTask, deleteTask } from '../../services/taskService';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import PageTransition from '../../components/ui/PageTransition';
import KanbanBoard from '../../components/technician/KanbanBoard';
import CalendarView from '../../components/technician/CalendarView';
import TasksTimelineView from '../../components/technician/TasksTimelineView';

/**
 * 📋 Tasks Page
 * 
 * صفحة إدارة المهام للفنيين
 * - عرض المهام (List View)
 * - إضافة/تعديل/حذف المهام
 * - تحديد الأولوية والحالة
 * - ربط المهام بالإصلاحات
 * - الفلترة والبحث
 */
export default function TasksPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notifications = useNotifications();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list', 'kanban', 'calendar', 'timeline'
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    category: '',
    dueDate: '',
    dueTime: '',
    repairId: null,
    deviceId: null,
  });

  useEffect(() => {
    loadTasks();
  }, [statusFilter, priorityFilter, searchQuery]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (priorityFilter !== 'all') filters.priority = priorityFilter;
      if (searchQuery && searchQuery.trim()) filters.search = searchQuery.trim();

      const response = await getTasks(filters);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      notifications.error('خطأ', { message: 'يرجى إدخال عنوان المهمة' });
      return;
    }

    try {
      if (editingTask) {
        const response = await updateTask(editingTask.id, formData);
        if (response.success) {
          notifications.success('تم', { message: 'تم تحديث المهمة بنجاح' });
          setEditingTask(null);
        } else {
          throw new Error(response.error || 'فشل تحديث المهمة');
        }
      } else {
        const response = await createTask(formData);
        if (response.success) {
          notifications.success('تم', { message: 'تم إضافة المهمة بنجاح' });
          setShowAddModal(false);
        } else {
          throw new Error(response.error || 'فشل إضافة المهمة');
        }
      }
      
      resetForm();
      loadTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      notifications.error('خطأ', { message: error.message || 'فشل حفظ المهمة' });
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
      return;
    }

    try {
      const response = await deleteTask(taskId);
      if (response.success) {
        notifications.success('تم', { message: 'تم حذف المهمة بنجاح' });
        loadTasks();
      } else {
        throw new Error(response.error || 'فشل حذف المهمة');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      notifications.error('خطأ', { message: error.message || 'فشل حذف المهمة' });
    }
  };

  const handleToggleComplete = async (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      const response = await updateTask(task.id, { status: newStatus });
      if (response.success) {
        notifications.success('تم', { message: `تم ${newStatus === 'done' ? 'إكمال' : 'إلغاء إكمال'} المهمة` });
        loadTasks();
      } else {
        throw new Error(response.error || 'فشل تحديث المهمة');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      notifications.error('خطأ', { message: error.message || 'فشل تحديث المهمة' });
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'medium',
      status: task.status || 'todo',
      category: task.category || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      dueTime: task.dueTime || '',
      repairId: task.repairId || null,
      deviceId: task.deviceId || null,
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      category: '',
      dueDate: '',
      dueTime: '',
      repairId: null,
      deviceId: null,
    });
    setEditingTask(null);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'عاجل';
      case 'medium': return 'متوسط';
      case 'low': return 'منخفض';
      default: return 'غير محدد';
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    // ترتيب حسب الأولوية أولاً
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    // ثم حسب التاريخ
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    return 0;
  });

  return (
    <PageTransition className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">إدارة المهام</h1>
              <p className="text-muted-foreground mt-1">إدارة مهامك والتسكات</p>
            </div>
            <div className="flex items-center gap-2">
              {/* View Mode Selector */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-primary text-white' 
                      : 'text-muted-foreground hover:bg-muted/80'
                  }`}
                  title="عرض القائمة"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'kanban' 
                      ? 'bg-primary text-white' 
                      : 'text-muted-foreground hover:bg-muted/80'
                  }`}
                  title="عرض كانبان"
                >
                  <LayoutDashboard className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'calendar' 
                      ? 'bg-primary text-white' 
                      : 'text-muted-foreground hover:bg-muted/80'
                  }`}
                  title="عرض التقويم"
                >
                  <Calendar className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'timeline' 
                      ? 'bg-primary text-white' 
                      : 'text-muted-foreground hover:bg-muted/80'
                  }`}
                  title="عرض Timeline"
                >
                  <GanttChart className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                مهمة جديدة
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في المهام..."
                className="w-full pr-10 pl-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">جميع الحالات</option>
              <option value="todo">معلق</option>
              <option value="in_progress">قيد التنفيذ</option>
              <option value="review">قيد المراجعة</option>
              <option value="done">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">جميع الأولويات</option>
              <option value="high">عاجل</option>
              <option value="medium">متوسط</option>
              <option value="low">منخفض</option>
            </select>
          </div>
        </div>

        {/* View Mode Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-4">جاري التحميل...</p>
          </div>
        ) : (
          <>
            {viewMode === 'kanban' && (
              <KanbanBoard 
                onTaskClick={(task) => handleEdit(task)}
                onAddTask={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
              />
            )}
            {viewMode === 'calendar' && (
              <CalendarView 
                onTaskClick={(task) => handleEdit(task)}
                onAddTask={(date) => {
                  resetForm();
                  if (date) {
                    setFormData(prev => ({ ...prev, dueDate: date.toISOString().split('T')[0] }));
                  }
                  setShowAddModal(true);
                }}
              />
            )}
            {viewMode === 'timeline' && (
              <TasksTimelineView 
                onTaskClick={(task) => handleEdit(task)}
                onAddTask={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
              />
            )}
            {viewMode === 'list' && (
              sortedTasks.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border border-border">
                  <CheckCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground mb-2">لا توجد مهام</p>
                  <p className="text-sm text-muted-foreground mb-4">ابدأ بإضافة مهمة جديدة</p>
                  <button
                    onClick={() => {
                      resetForm();
                      setShowAddModal(true);
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    إضافة مهمة
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`bg-card rounded-xl border border-border p-4 hover:shadow-md transition-all ${
                        task.status === 'completed' ? 'opacity-75' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => handleToggleComplete(task)}
                          className="mt-1 flex-shrink-0"
                        >
                          {task.status === 'done' ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <Circle className="w-6 h-6 text-muted-foreground" />
                          )}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h3 className={`font-semibold text-foreground ${
                              task.status === 'done' ? 'line-through' : ''
                            }`}>
                              {task.title || (task.repairNumber ? `إصلاح #${task.repairNumber.replace('REP-', '')}` : 'مهمة بدون عنوان')}
                            </h3>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                                {getPriorityLabel(task.priority)}
                              </span>
                              <button
                                onClick={() => handleEdit(task)}
                                className="p-1 text-primary hover:bg-primary/10 rounded transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(task.id)}
                                className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(task.dueDate).toLocaleDateString('ar-EG')}</span>
                              </div>
                            )}
                            {task.category && (
                              <span className="px-2 py-1 bg-muted rounded">
                                {task.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl border border-border shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  {editingTask ? 'تعديل المهمة' : 'مهمة جديدة'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    العنوان *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="عنوان المهمة"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    الوصف
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="وصف المهمة"
                    rows={3}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      الأولوية
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="low">منخفض</option>
                      <option value="medium">متوسط</option>
                      <option value="high">عاجل</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      الحالة
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="todo">معلق</option>
                      <option value="in_progress">قيد التنفيذ</option>
                      <option value="review">قيد المراجعة</option>
                      <option value="done">مكتمل</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      التاريخ المستهدف
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      الوقت المستهدف
                    </label>
                    <input
                      type="time"
                      value={formData.dueTime}
                      onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    الفئة
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="فئة المهمة (اختياري)"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-border">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    {editingTask ? 'تحديث' : 'إضافة'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

