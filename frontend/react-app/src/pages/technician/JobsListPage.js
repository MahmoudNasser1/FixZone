import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getTechJobs } from '../../services/technicianService';
import { getTasks, createTask, updateTask, deleteTask } from '../../services/taskService';
import TechnicianHeader from '../../components/technician/TechnicianHeader';
import JobCard from '../../components/technician/JobCard';
import TechnicianBottomNav from '../../components/technician/TechnicianBottomNav';
import KanbanBoard from '../../components/technician/KanbanBoard';
import CalendarView from '../../components/technician/CalendarView';

import { CardSkeleton } from '../../components/ui/Skeletons';
import PageTransition from '../../components/ui/PageTransition';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import useAuthStore from '../../stores/authStore';
import {
  Search,
  ArrowUpDown,
  Wrench,
  ListTodo,
  LayoutGrid,
  Calendar,
  Kanban,
  Plus,
  X,
  CheckCircle,
  Circle,
  Clock,
  AlertTriangle,
  ChevronLeft,
  Edit,
  Trash2,
  Smartphone,
  Laptop,
  Tablet,
  Timer,
  User,
  AlertCircle,
  Inbox
} from 'lucide-react';

/**
 * 📋 Unified Tasks Page - Enhanced
 * 
 * صفحة موحدة تجمع:
 * - الإصلاحات (Repairs) - يعامل كمهام
 * - المهام (Personal Tasks)
 * 
 * المميزات:
 * - عرض متعدد لكلا النوعين (Grid, Kanban, Calendar, Timeline)
 * - سيكشن خاص للطلبات الجديدة في الانتظار
 * - بحث وفلترة متقدمة
 */

export default function JobsListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const notifications = useNotifications();
  const user = useAuthStore((state) => state.user);

  // Active main tab
  const [activeMainTab, setActiveMainTab] = useState('repairs'); // 'repairs' | 'tasks'
  
  // Repairs state
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'all');
  
  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [taskStatus, setTaskStatus] = useState('all');
  
  // Common state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'kanban' | 'calendar' | 'timeline'
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
  });

  // Load both jobs and tasks on mount
  useEffect(() => {
    loadJobs();
    loadTasks();
  }, []);

  // Reload based on filters
  useEffect(() => {
    if (activeMainTab === 'repairs') {
      loadJobs();
    } else {
      loadTasks();
    }
  }, [filterStatus, taskStatus, sortBy]);

  const loadJobs = async () => {
    try {
      setJobsLoading(true);
      const response = await getTechJobs({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        sort: sortBy
      });

      if (response.success) {
        setJobs(response.data || []);
      } else {
        throw new Error(response.error || 'فشل تحميل قائمة الإصلاحات');
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      notifications.error('خطأ', { 
        message: error.message || 'فشل تحميل قائمة الإصلاحات',
        duration: 5000
      });
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      setTasksLoading(true);
      const filters = {};
      if (taskStatus !== 'all') filters.status = taskStatus;

      const response = await getTasks(filters);
      if (response.success) {
        setTasks(response.data.tasks || []);
      } else {
        throw new Error(response.error || 'فشل تحميل المهام');
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      notifications.error('خطأ', { message: 'فشل تحميل المهام' });
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      notifications.error('خطأ', { message: 'يرجى إدخال عنوان المهمة' });
      return;
    }

    try {
      if (editingTask) {
        const response = await updateTask(editingTask.id, taskForm);
        if (response.success) {
          notifications.success('تم', { message: 'تم تحديث المهمة بنجاح' });
        }
      } else {
        const response = await createTask(taskForm);
        if (response.success) {
          notifications.success('تم', { message: 'تم إضافة المهمة بنجاح' });
        }
      }
      
      setShowAddTaskModal(false);
      setEditingTask(null);
      setTaskForm({ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '' });
      loadTasks();
    } catch (error) {
      notifications.error('خطأ', { message: error.message || 'فشل حفظ المهمة' });
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المهمة؟')) return;
    
    try {
      const response = await deleteTask(taskId);
      if (response.success) {
        notifications.success('تم', { message: 'تم حذف المهمة' });
        loadTasks();
      }
    } catch (error) {
      notifications.error('خطأ', { message: 'فشل حذف المهمة' });
    }
  };

  const handleToggleTaskComplete = async (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      await updateTask(task.id, { status: newStatus });
      notifications.success('تم', { message: newStatus === 'done' ? 'تم إكمال المهمة' : 'تم إلغاء الإكمال' });
      loadTasks();
    } catch (error) {
      notifications.error('خطأ', { message: 'فشل تحديث المهمة' });
    }
  };

  // Pending jobs (waiting for technician to start)
  const pendingJobs = useMemo(() => {
    return jobs.filter(j => j.status === 'pending');
  }, [jobs]);

  // Filter functions
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // Apply status filter
      if (filterStatus !== 'all' && job.status !== filterStatus) return false;
      
      // Apply search
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        job.customerName?.toLowerCase().includes(query) ||
        job.deviceType?.toLowerCase().includes(query) ||
        job.issueDescription?.toLowerCase().includes(query) ||
        job.id?.toString().includes(query)
      );
    });
  }, [jobs, filterStatus, searchQuery]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Apply status filter
      if (taskStatus !== 'all' && task.status !== taskStatus) return false;
      
      // Apply search
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    });
  }, [tasks, taskStatus, searchQuery]);

  // Transform jobs to task-like format for Kanban/Calendar
  const jobsAsTasks = useMemo(() => {
    return filteredJobs.map(job => ({
      id: `job-${job.id}`,
      originalId: job.id,
      title: `${job.deviceType} - ${job.customerName}`,
      description: job.issueDescription,
      status: job.status === 'pending' ? 'todo' : job.status === 'in_progress' ? 'in_progress' : job.status === 'completed' ? 'done' : job.status,
      priority: job.priority || 'medium',
      dueDate: job.expectedCompletionDate || job.createdAt,
      type: 'repair',
      originalJob: job
    }));
  }, [filteredJobs]);

  const getDeviceIcon = (type) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('iphone') || lowerType.includes('phone')) return Smartphone;
    if (lowerType.includes('mac') || lowerType.includes('laptop')) return Laptop;
    if (lowerType.includes('ipad') || lowerType.includes('tablet')) return Tablet;
    return Smartphone;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'medium': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      default: return 'text-slate-600 bg-slate-100 dark:bg-slate-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'done': return 'bg-emerald-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending':
      case 'todo': return 'bg-amber-500';
      default: return 'bg-slate-400';
    }
  };

  const repairStatusTabs = [
    { id: 'all', label: 'الكل' },
    { id: 'pending', label: 'في الانتظار' },
    { id: 'in_progress', label: 'قيد العمل' },
    { id: 'completed', label: 'مكتملة' },
  ];

  const taskStatusTabs = [
    { id: 'all', label: 'الكل' },
    { id: 'todo', label: 'معلقة' },
    { id: 'in_progress', label: 'قيد التنفيذ' },
    { id: 'done', label: 'مكتملة' },
  ];

  const loading = activeMainTab === 'repairs' ? jobsLoading : tasksLoading;

  // Group jobs by date for timeline view
  const jobsByDate = useMemo(() => {
    const groups = {};
    filteredJobs.forEach(job => {
      const date = new Date(job.createdAt).toLocaleDateString('ar-EG');
      if (!groups[date]) groups[date] = [];
      groups[date].push(job);
    });
    return groups;
  }, [filteredJobs]);

  return (
    <PageTransition className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/20 pb-24 md:pb-8">
      <TechnicianHeader user={user} notificationCount={5} />

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Pending Jobs Alert Section */}
        {activeMainTab === 'repairs' && pendingJobs.length > 0 && filterStatus === 'all' && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-500 rounded-xl">
                <Inbox className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 dark:text-amber-200">
                  طلبات جديدة في الانتظار ({pendingJobs.length})
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  هذه الطلبات تنتظر أن تبدأ العمل عليها
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingJobs.slice(0, 3).map(job => {
                const DeviceIcon = getDeviceIcon(job.deviceType);
                return (
                  <div 
                    key={job.id}
                    onClick={() => navigate(`/technician/jobs/${job.id}`)}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl cursor-pointer hover:shadow-md transition-all group"
                  >
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <DeviceIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate text-sm">
                        {job.deviceType}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {job.customerName}
                      </p>
                    </div>
                    {job.priority === 'high' && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                        عاجل
                      </span>
                    )}
                    <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                  </div>
                );
              })}
            </div>
            {pendingJobs.length > 3 && (
              <button
                onClick={() => setFilterStatus('pending')}
                className="mt-3 text-sm font-medium text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300"
              >
                عرض جميع الطلبات المنتظرة ({pendingJobs.length}) ←
              </button>
            )}
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">إدارة المهام</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {activeMainTab === 'repairs' 
                ? `${filteredJobs.length} طلب إصلاح` 
                : `${filteredTasks.length} مهمة`
              }
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Selector - Available for both tabs */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-slate-200/50 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-teal-500 text-white shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="عرض الشبكة"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'kanban' 
                    ? 'bg-teal-500 text-white shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="عرض Kanban"
              >
                <Kanban className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'calendar' 
                    ? 'bg-teal-500 text-white shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="عرض التقويم"
              >
                <Calendar className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'timeline' 
                    ? 'bg-teal-500 text-white shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="عرض الجدول الزمني"
              >
                <Timer className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Button */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                <ArrowUpDown className="w-4 h-4" />
                <span className="hidden sm:inline">ترتيب</span>
              </button>
              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200/50 dark:border-slate-700 py-2 z-20">
                    {[
                      { id: 'date_desc', label: 'الأحدث أولاً' },
                      { id: 'date_asc', label: 'الأقدم أولاً' },
                      { id: 'priority', label: 'حسب الأولوية' },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSortBy(option.id);
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-right px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                          sortBy === option.id ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 font-medium' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Add Task Button (Only for Tasks tab) */}
            {activeMainTab === 'tasks' && (
              <button
                onClick={() => {
                  setEditingTask(null);
                  setTaskForm({ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '' });
                  setShowAddTaskModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/25 font-medium"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">مهمة جديدة</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setActiveMainTab('repairs');
              setViewMode('grid');
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
              activeMainTab === 'repairs'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>الإصلاحات</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeMainTab === 'repairs' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'
            }`}>
              {jobs.length}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveMainTab('tasks');
              setViewMode('grid');
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
              activeMainTab === 'tasks'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>المهام</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeMainTab === 'tasks' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'
            }`}>
              {tasks.length}
            </span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-800 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            {/* Status Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
              {(activeMainTab === 'repairs' ? repairStatusTabs : taskStatusTabs).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (activeMainTab === 'repairs') {
                      setFilterStatus(tab.id);
                      setSearchParams({ status: tab.id });
                    } else {
                      setTaskStatus(tab.id);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    (activeMainTab === 'repairs' ? filterStatus : taskStatus) === tab.id
                      ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={activeMainTab === 'repairs' ? 'بحث في الإصلاحات...' : 'بحث في المهام...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12">
            <CardSkeleton count={6} />
          </div>
        ) : activeMainTab === 'repairs' ? (
          /* Repairs Content */
          viewMode === 'kanban' ? (
            <RepairsKanbanView 
              jobs={filteredJobs}
              onJobClick={(job) => navigate(`/technician/jobs/${job.id}`)}
            />
          ) : viewMode === 'calendar' ? (
            <RepairsCalendarView 
              jobs={filteredJobs}
              onJobClick={(job) => navigate(`/technician/jobs/${job.id}`)}
            />
          ) : viewMode === 'timeline' ? (
            <RepairsTimelineView
              jobsByDate={jobsByDate}
              onJobClick={(job) => navigate(`/technician/jobs/${job.id}`)}
              getDeviceIcon={getDeviceIcon}
              getStatusColor={getStatusColor}
            />
          ) : filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onClick={() => navigate(`/technician/jobs/${job.id}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={Wrench}
              title="لا توجد إصلاحات"
              description="جرب تغيير الفلاتر أو كلمات البحث"
              onClear={() => {
                setFilterStatus('all');
                setSearchQuery('');
              }}
            />
          )
        ) : (
          /* Tasks Content */
          viewMode === 'kanban' ? (
            <KanbanBoard 
              onTaskClick={(task) => {
                setEditingTask(task);
                setTaskForm({
                  title: task.title || '',
                  description: task.description || '',
                  priority: task.priority || 'medium',
                  status: task.status || 'todo',
                  dueDate: task.dueDate?.split('T')[0] || '',
                });
                setShowAddTaskModal(true);
              }}
              onAddTask={() => {
                setEditingTask(null);
                setTaskForm({ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '' });
                setShowAddTaskModal(true);
              }}
            />
          ) : viewMode === 'calendar' ? (
            <CalendarView 
              onTaskClick={(task) => {
                setEditingTask(task);
                setTaskForm({
                  title: task.title || '',
                  description: task.description || '',
                  priority: task.priority || 'medium',
                  status: task.status || 'todo',
                  dueDate: task.dueDate?.split('T')[0] || '',
                });
                setShowAddTaskModal(true);
              }}
              onAddTask={(date) => {
                setEditingTask(null);
                setTaskForm({ 
                  title: '', 
                  description: '', 
                  priority: 'medium', 
                  status: 'todo', 
                  dueDate: date ? date.toISOString().split('T')[0] : '' 
                });
                setShowAddTaskModal(true);
              }}
            />
          ) : viewMode === 'timeline' ? (
            <TasksTimelineView 
              tasks={filteredTasks}
              onTaskClick={(task) => {
                setEditingTask(task);
                setTaskForm({
                  title: task.title || '',
                  description: task.description || '',
                  priority: task.priority || 'medium',
                  status: task.status || 'todo',
                  dueDate: task.dueDate?.split('T')[0] || '',
                });
                setShowAddTaskModal(true);
              }}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
            />
          ) : filteredTasks.length > 0 ? (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleTaskComplete}
                  onEdit={(task) => {
                    setEditingTask(task);
                    setTaskForm({
                      title: task.title || '',
                      description: task.description || '',
                      priority: task.priority || 'medium',
                      status: task.status || 'todo',
                      dueDate: task.dueDate?.split('T')[0] || '',
                    });
                    setShowAddTaskModal(true);
                  }}
                  onDelete={handleDeleteTask}
                  getPriorityColor={getPriorityColor}
                />
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={ListTodo}
              title="لا توجد مهام"
              description="ابدأ بإضافة مهمة جديدة"
              actionLabel="إضافة مهمة"
              onAction={() => {
                setEditingTask(null);
                setTaskForm({ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '' });
                setShowAddTaskModal(true);
              }}
            />
          )
        )}
      </div>

      {/* Add/Edit Task Modal */}
      {showAddTaskModal && (
        <TaskModal
          editingTask={editingTask}
          taskForm={taskForm}
          setTaskForm={setTaskForm}
          onSave={handleSaveTask}
          onClose={() => {
            setShowAddTaskModal(false);
            setEditingTask(null);
          }}
        />
      )}

      {/* Bottom Navigation - Mobile Only */}
      <TechnicianBottomNav />
    </PageTransition>
  );
}

// Repairs Kanban View
function RepairsKanbanView({ jobs, onJobClick }) {
  const columns = [
    { id: 'pending', label: 'في الانتظار', color: 'bg-amber-500' },
    { id: 'in_progress', label: 'قيد العمل', color: 'bg-blue-500' },
    { id: 'completed', label: 'مكتملة', color: 'bg-emerald-500' },
  ];

  const getJobsByStatus = (status) => jobs.filter(j => j.status === status);

  const getDeviceIcon = (type) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('iphone') || lowerType.includes('phone')) return Smartphone;
    if (lowerType.includes('mac') || lowerType.includes('laptop')) return Laptop;
    if (lowerType.includes('ipad') || lowerType.includes('tablet')) return Tablet;
    return Smartphone;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map(col => (
        <div key={col.id} className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-3 h-3 ${col.color} rounded-full`} />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">{col.label}</h3>
            <span className="ml-auto text-sm text-slate-500 dark:text-slate-400">
              {getJobsByStatus(col.id).length}
            </span>
          </div>
          <div className="space-y-3">
            {getJobsByStatus(col.id).map(job => {
              const DeviceIcon = getDeviceIcon(job.deviceType);
              return (
                <div
                  key={job.id}
                  onClick={() => onJobClick(job)}
                  className="bg-white dark:bg-slate-900 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all border border-slate-200/50 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <DeviceIcon className="w-5 h-5 text-slate-500" />
                    <span className="font-medium text-slate-900 dark:text-white truncate">
                      {job.deviceType}
                    </span>
                    {job.priority === 'high' && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        عاجل
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                    {job.issueDescription}
                  </p>
                  <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {job.customerName}
                    </span>
                    <span>#{job.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// Repairs Calendar View
function RepairsCalendarView({ jobs, onJobClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const getJobsForDay = (day) => {
    return jobs.filter(job => {
      const jobDate = new Date(job.createdAt);
      return jobDate.getDate() === day && 
             jobDate.getMonth() === currentDate.getMonth() &&
             jobDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
        >
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </button>
        <h3 className="font-bold text-slate-900 dark:text-white">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <button
          onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
        {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => (
          <div key={day} className="p-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {blanks.map(i => (
          <div key={`blank-${i}`} className="min-h-[80px] border-b border-r border-slate-100 dark:border-slate-800" />
        ))}
        {days.map(day => {
          const dayJobs = getJobsForDay(day);
          const isToday = new Date().getDate() === day && 
                          new Date().getMonth() === currentDate.getMonth() &&
                          new Date().getFullYear() === currentDate.getFullYear();
          return (
            <div 
              key={day}
              className={`min-h-[80px] border-b border-r border-slate-100 dark:border-slate-800 p-1 ${
                isToday ? 'bg-teal-50 dark:bg-teal-900/20' : ''
              }`}
            >
              <div className={`text-xs font-medium mb-1 ${isToday ? 'text-teal-600' : 'text-slate-500'}`}>
                {day}
              </div>
              {dayJobs.slice(0, 2).map(job => (
                <div
                  key={job.id}
                  onClick={() => onJobClick(job)}
                  className="text-xs p-1 mb-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded truncate cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50"
                >
                  {job.deviceType}
                </div>
              ))}
              {dayJobs.length > 2 && (
                <div className="text-xs text-slate-400">+{dayJobs.length - 2} المزيد</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Repairs Timeline View
function RepairsTimelineView({ jobsByDate, onJobClick, getDeviceIcon, getStatusColor }) {
  const dates = Object.keys(jobsByDate).sort((a, b) => new Date(b) - new Date(a));

  if (dates.length === 0) {
    return (
      <EmptyState
        icon={Timer}
        title="لا توجد إصلاحات"
        description="لا توجد إصلاحات لعرضها في الجدول الزمني"
      />
    );
  }

  return (
    <div className="space-y-6">
      {dates.map(date => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 bg-teal-500 rounded-full" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">{date}</h3>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="mr-6 space-y-3">
            {jobsByDate[date].map(job => {
              const DeviceIcon = getDeviceIcon(job.deviceType);
              return (
                <div
                  key={job.id}
                  onClick={() => onJobClick(job)}
                  className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className={`w-1 h-12 ${getStatusColor(job.status)} rounded-full`} />
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <DeviceIcon className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white">{job.deviceType}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{job.issueDescription}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">#{job.id}</p>
                    <p className="text-xs text-slate-500">{job.customerName}</p>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-slate-400" />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// Tasks Timeline View
function TasksTimelineView({ tasks, onTaskClick, getPriorityColor, getStatusColor }) {
  // Group tasks by date
  const tasksByDate = {};
  tasks.forEach(task => {
    const date = task.dueDate 
      ? new Date(task.dueDate).toLocaleDateString('ar-EG')
      : 'بدون تاريخ';
    if (!tasksByDate[date]) tasksByDate[date] = [];
    tasksByDate[date].push(task);
  });

  const dates = Object.keys(tasksByDate);

  if (dates.length === 0) {
    return (
      <EmptyState
        icon={Timer}
        title="لا توجد مهام"
        description="لا توجد مهام لعرضها في الجدول الزمني"
      />
    );
  }

  return (
    <div className="space-y-6">
      {dates.map(date => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 bg-violet-500 rounded-full" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">{date}</h3>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="mr-6 space-y-3">
            {tasksByDate[date].map(task => (
              <div
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800 cursor-pointer hover:shadow-md transition-all"
              >
                <div className={`w-1 h-12 ${getStatusColor(task.status)} rounded-full`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white">{task.title}</p>
                  {task.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{task.description}</p>
                  )}
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${getPriorityColor(task.priority)}`}>
                  {task.priority === 'high' ? 'عاجل' : task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                </span>
                <ChevronLeft className="w-5 h-5 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Task List Item Component
function TaskListItem({ task, onToggleComplete, onEdit, onDelete, getPriorityColor }) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 p-4 hover:shadow-lg transition-all cursor-pointer group ${
        task.status === 'done' ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(task);
          }}
          className="mt-1 flex-shrink-0"
        >
          {task.status === 'done' ? (
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          ) : (
            <Circle className="w-6 h-6 text-slate-300 dark:text-slate-600 hover:text-teal-500 transition-colors" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className={`font-semibold text-slate-900 dark:text-white ${
              task.status === 'done' ? 'line-through' : ''
            }`}>
              {task.title}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${getPriorityColor(task.priority)}`}>
                {task.priority === 'high' ? 'عاجل' : task.priority === 'medium' ? 'متوسط' : 'منخفض'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                className="p-1.5 text-slate-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {task.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">
              {task.description}
            </p>
          )}
          
          {task.dueDate && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{new Date(task.dueDate).toLocaleDateString('ar-EG')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Task Modal Component
function TaskModal({ editingTask, taskForm, setTaskForm, onSave, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-800 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {editingTask ? 'تعديل المهمة' : 'مهمة جديدة'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        <form onSubmit={onSave} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              العنوان *
            </label>
            <input
              type="text"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="عنوان المهمة"
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              الوصف
            </label>
            <textarea
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              placeholder="وصف المهمة (اختياري)"
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                الأولوية
              </label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="low">منخفض</option>
                <option value="medium">متوسط</option>
                <option value="high">عاجل</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                تاريخ الاستحقاق
              </label>
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-600 hover:to-emerald-600 transition-all font-medium shadow-lg shadow-teal-500/25"
            >
              {editingTask ? 'تحديث' : 'إضافة'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ icon: Icon, title, description, actionLabel, onAction, onClear }) {
  return (
    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 border-dashed">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 mb-6">{description}</p>
      <div className="flex gap-3 justify-center">
        {onClear && (
          <button
            onClick={onClear}
            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium"
          >
            مسح الفلاتر
          </button>
        )}
        {onAction && (
          <button
            onClick={onAction}
            className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-600 hover:to-emerald-600 transition-all font-medium shadow-lg shadow-teal-500/25"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
