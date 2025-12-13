import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Wrench,
  User,
  FileText,
  Settings,
  Clock,
  Home,
  Briefcase,
  ListTodo,
  ChevronLeft,
  Command,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Smartphone,
  Laptop,
  Tablet
} from 'lucide-react';
import { getTechJobs } from '../../services/technicianService';
import { getTasks } from '../../services/taskService';

/**
 * 🔍 Command Palette (Ctrl+K)
 * 
 * بحث سريع شامل في:
 * - المهام
 * - العملاء
 * - الأجهزة
 * - الإجراءات السريعة
 */

// Quick Actions
const quickActions = [
  { id: 'dashboard', label: 'الرئيسية', icon: Home, path: '/technician/dashboard', keywords: 'home main dashboard رئيسية' },
  { id: 'jobs', label: 'قائمة المهام', icon: Briefcase, path: '/technician/jobs', keywords: 'jobs tasks مهام إصلاحات' },
  { id: 'tasks', label: 'المهام الشخصية', icon: ListTodo, path: '/technician/tasks', keywords: 'tasks personal شخصية مهام' },
  { id: 'time-reports', label: 'تقارير الوقت', icon: Clock, path: '/technician/time-reports', keywords: 'time reports وقت تقارير' },
  { id: 'profile', label: 'الملف الشخصي', icon: User, path: '/technician/profile', keywords: 'profile ملف شخصي' },
  { id: 'settings', label: 'الإعدادات', icon: Settings, path: '/technician/settings', keywords: 'settings إعدادات' },
];

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      inputRef.current?.focus();
      loadData();
    }
  }, [isOpen]);

  // Load jobs and tasks
  const loadData = async () => {
    setLoading(true);
    try {
      const [jobsRes, tasksRes] = await Promise.allSettled([
        getTechJobs({ limit: 50 }),
        getTasks({ limit: 50 })
      ]);

      if (jobsRes.status === 'fulfilled' && jobsRes.value?.success) {
        setJobs(jobsRes.value.data || []);
      }

      if (tasksRes.status === 'fulfilled' && tasksRes.value?.success) {
        setTasks(tasksRes.value.data?.tasks || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter results based on query
  useEffect(() => {
    if (!query.trim()) {
      setFilteredResults([
        { type: 'header', label: 'إجراءات سريعة' },
        ...quickActions.map(a => ({ ...a, type: 'action' }))
      ]);
      setSelectedIndex(1); // Skip header
      return;
    }

    const q = query.toLowerCase();
    const results = [];

    // Search actions
    const matchedActions = quickActions.filter(
      a => a.label.toLowerCase().includes(q) || a.keywords.toLowerCase().includes(q)
    );

    if (matchedActions.length > 0) {
      results.push({ type: 'header', label: 'إجراءات' });
      results.push(...matchedActions.map(a => ({ ...a, type: 'action' })));
    }

    // Search jobs
    const matchedJobs = jobs.filter(
      j => j.customerName?.toLowerCase().includes(q) ||
           j.deviceType?.toLowerCase().includes(q) ||
           j.issueDescription?.toLowerCase().includes(q) ||
           j.id?.toString().includes(q)
    );

    if (matchedJobs.length > 0) {
      results.push({ type: 'header', label: 'طلبات الإصلاح' });
      results.push(...matchedJobs.slice(0, 5).map(j => ({
        ...j,
        type: 'job',
        label: `#${j.id} - ${j.deviceType}`,
        sublabel: j.customerName,
        path: `/technician/jobs/${j.id}`
      })));
    }

    // Search tasks
    const matchedTasks = tasks.filter(
      t => t.title?.toLowerCase().includes(q) ||
           t.description?.toLowerCase().includes(q)
    );

    if (matchedTasks.length > 0) {
      results.push({ type: 'header', label: 'المهام' });
      results.push(...matchedTasks.slice(0, 5).map(t => ({
        ...t,
        type: 'task',
        label: t.title,
        sublabel: t.description?.substring(0, 50),
        path: `/technician/tasks/${t.id}`
      })));
    }

    if (results.length === 0) {
      results.push({ type: 'empty', label: 'لا توجد نتائج' });
    }

    setFilteredResults(results);
    setSelectedIndex(results[0]?.type === 'header' ? 1 : 0);
  }, [query, jobs, tasks]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    const selectableItems = filteredResults.filter(r => r.type !== 'header' && r.type !== 'empty');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => {
        let next = prev + 1;
        while (filteredResults[next]?.type === 'header') next++;
        return next < filteredResults.length ? next : prev;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => {
        let next = prev - 1;
        while (filteredResults[next]?.type === 'header' && next > 0) next--;
        return next >= 0 && filteredResults[next]?.type !== 'header' ? next : prev;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filteredResults[selectedIndex];
      if (item?.path) {
        navigate(item.path);
        onClose();
      }
    }
  }, [filteredResults, selectedIndex, navigate, onClose]);

  const handleItemClick = (item) => {
    if (item?.path) {
      navigate(item.path);
      onClose();
    }
  };

  const getDeviceIcon = (type) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('iphone') || lowerType.includes('phone')) return Smartphone;
    if (lowerType.includes('mac') || lowerType.includes('laptop')) return Laptop;
    if (lowerType.includes('ipad') || lowerType.includes('tablet')) return Tablet;
    return Smartphone;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-x-4 top-[20%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-xl z-[101] animate-in slide-in-from-top-4 duration-300">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200/50 dark:border-slate-800">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="ابحث عن مهمة، عميل، أو إجراء..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-base"
            />
            <div className="flex items-center gap-1">
              <kbd className="hidden sm:flex items-center gap-0.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs rounded-lg">
                ESC
              </kbd>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors sm:hidden"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Results */}
          <div 
            ref={listRef}
            className="max-h-[60vh] overflow-y-auto p-2"
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-1">
                {filteredResults.map((item, index) => {
                  if (item.type === 'header') {
                    return (
                      <div key={`header-${index}`} className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {item.label}
                      </div>
                    );
                  }

                  if (item.type === 'empty') {
                    return (
                      <div key="empty" className="px-4 py-12 text-center">
                        <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400">لا توجد نتائج</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">جرب كلمات بحث مختلفة</p>
                      </div>
                    );
                  }

                  const isSelected = index === selectedIndex;
                  const Icon = item.type === 'job' 
                    ? getDeviceIcon(item.deviceType) 
                    : item.type === 'task' 
                      ? ListTodo 
                      : item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all
                        ${isSelected 
                          ? 'bg-teal-500 text-white' 
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }
                      `}
                    >
                      <div className={`
                        p-2 rounded-lg transition-colors
                        ${isSelected 
                          ? 'bg-white/20' 
                          : 'bg-slate-100 dark:bg-slate-800'
                        }
                      `}>
                        {Icon && <Icon className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 text-right min-w-0">
                        <p className="font-medium truncate">{item.label}</p>
                        {item.sublabel && (
                          <p className={`text-xs truncate ${isSelected ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'}`}>
                            {item.sublabel}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <ChevronLeft className="w-4 h-4 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <ArrowUp className="w-3 h-3" />
                <ArrowDown className="w-3 h-3" />
                للتنقل
              </span>
              <span className="flex items-center gap-1">
                <CornerDownLeft className="w-3 h-3" />
                للاختيار
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Command className="w-3 h-3" />
              <span>+K للفتح</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Hook for Command Palette
 * Usage: const { isOpen, openPalette, closePalette } = useCommandPalette();
 */
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    openPalette: () => setIsOpen(true),
    closePalette: () => setIsOpen(false)
  };
}


