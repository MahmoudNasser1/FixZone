import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical } from 'lucide-react';
import { getTasks, updateTask } from '../../services/taskService';
import { useNotifications } from '../notifications/NotificationSystem';

/**
 * 📋 Kanban Board Component
 * 
 * لوحة Kanban للمهام
 * - Drag & Drop بين الأعمدة
 * - عرض المهام كبطاقات
 * - فلترة متقدمة
 */
const COLUMNS = [
  { id: 'todo', title: 'معلق', color: 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-800' },
  { id: 'in_progress', title: 'قيد التنفيذ', color: 'bg-blue-100 border-blue-300 dark:bg-blue-900/20 dark:border-blue-800' },
  { id: 'review', title: 'قيد المراجعة', color: 'bg-purple-100 border-purple-300 dark:bg-purple-900/20 dark:border-purple-800' },
  { id: 'done', title: 'مكتمل', color: 'bg-green-100 border-green-300 dark:bg-green-900/20 dark:border-green-800' },
];

export default function KanbanBoard({ onTaskClick, onAddTask }) {
  const notifications = useNotifications();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState(null);

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

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      const response = await updateTask(draggedTask.id, { status: newStatus });
      if (response.success) {
        setTasks(tasks.map(task => 
          task.id === draggedTask.id ? { ...task, status: newStatus } : task
        ));
        notifications.success('تم', { message: 'تم تحديث حالة المهمة' });
      } else {
        throw new Error(response.error || 'فشل تحديث المهمة');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      notifications.error('خطأ', { message: error.message || 'فشل تحديث المهمة' });
    } finally {
      setDraggedTask(null);
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-4">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((column) => {
        const columnTasks = getTasksByStatus(column.id);
        
        return (
          <div
            key={column.id}
            className={`flex-1 min-w-[300px] rounded-lg border-2 ${column.color} p-4`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">
                {column.title}
                <span className="ml-2 text-sm text-muted-foreground">
                  ({columnTasks.length})
                </span>
              </h3>
              {onAddTask && column.id === 'todo' && (
                <button
                  onClick={() => onAddTask(column.id)}
                  className="p-1 hover:bg-white/50 dark:hover:bg-black/20 rounded transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-3 min-h-[400px]">
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onClick={() => onTaskClick && onTaskClick(task)}
                  className="bg-card rounded-lg border border-border p-3 shadow-sm hover:shadow-md transition-all cursor-move"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-foreground flex-1">
                      {task.title || (task.repairNumber ? `إصلاح #${task.repairNumber.replace('REP-', '')}` : 'مهمة بدون عنوان')}
                    </h4>
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)} flex-shrink-0 ml-2`} />
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {task.description}
                    </p>
                  )}
                  
                  {task.dueDate && (
                    <div className="text-xs text-muted-foreground">
                      {new Date(task.dueDate).toLocaleDateString('ar-EG')}
                    </div>
                  )}
                </div>
              ))}
              
              {columnTasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  لا توجد مهام
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

