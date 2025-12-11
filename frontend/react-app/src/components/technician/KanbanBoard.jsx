import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical } from 'lucide-react';
import TaskCard from './TaskCard';
import { getTasks, updateTask } from '../../services/taskService';
import { useNotifications } from '../notifications/NotificationSystem';

/**
 * Kanban Board Component
 * لوحة Kanban لإدارة المهام
 * 
 * المميزات:
 * - عرض المهام في أعمدة (To Do, In Progress, Review, Done)
 * - سحب وإفلات المهام بين الأعمدة
 * - إضافة مهمة جديدة
 * - تعديل وحذف المهام
 */
const KanbanBoard = ({ onTaskClick, onAddTask, onEditTask, onDeleteTask, refreshTrigger = 0 }) => {
  const notifications = useNotifications();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);

  const columns = [
    { id: 'todo', title: 'المهام المعلقة', status: 'todo', color: 'bg-gray-100 dark:bg-gray-700' },
    { id: 'in_progress', title: 'قيد التنفيذ', status: 'in_progress', color: 'bg-blue-100 dark:bg-blue-900/30' },
    { id: 'review', title: 'قيد المراجعة', status: 'review', color: 'bg-yellow-100 dark:bg-yellow-900/30' },
    { id: 'done', title: 'مكتملة', status: 'done', color: 'bg-green-100 dark:bg-green-900/30' }
  ];

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
      notifications.error('خطأ', { message: 'فشل تحميل المهام' });
    } finally {
      setLoading(false);
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.status === targetStatus) {
      setDraggedTask(null);
      setDraggedOverColumn(null);
      return;
    }

    try {
      // تحديث الحالة
      const response = await updateTask(draggedTask.id, { status: targetStatus });
      
      if (response.success) {
        // تحديث القائمة محلياً
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === draggedTask.id
              ? { ...task, status: targetStatus }
              : task
          )
        );
        
        notifications.success('تم تحديث الحالة', { 
          message: 'تم نقل المهمة بنجاح' 
        });
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      notifications.error('خطأ', { message: 'فشل تحديث حالة المهمة' });
    } finally {
      setDraggedTask(null);
      setDraggedOverColumn(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="kanban-board overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.status);
          const isDraggedOver = draggedOverColumn === column.id;

          return (
            <div
              key={column.id}
              className={`flex-shrink-0 w-80 ${isDraggedOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              {/* Column Header */}
              <div className={`${column.color} rounded-t-lg p-4 mb-2`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{column.title}</h3>
                    <span className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-sm font-medium">
                      {columnTasks.length}
                    </span>
                  </div>
                  {column.id === 'todo' && onAddTask && (
                    <button
                      onClick={onAddTask}
                      className="p-1.5 bg-white dark:bg-gray-800 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      title="إضافة مهمة"
                    >
                      <Plus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-2 min-h-[200px] max-h-[600px] overflow-y-auto p-2">
                {columnTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                    لا توجد مهام
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      className="cursor-move"
                    >
                      <TaskCard
                        task={task}
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                        onClick={() => onTaskClick && onTaskClick(task)}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanBoard;

