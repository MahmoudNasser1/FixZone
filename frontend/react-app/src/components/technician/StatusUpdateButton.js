import React, { useState } from 'react';
import { CheckCircle, Clock, Wrench, AlertCircle, XCircle, FileCheck } from 'lucide-react';
import { updateTechJobStatus } from '../../services/technicianService';
import { useNotifications } from '../notifications/NotificationSystem';

/**
 * 🔄 Status Update Button Component
 * 
 * مكون لتحديث حالة الإصلاح
 * - قائمة منسدلة بالحالات المتاحة
 * - إشعارات عند التحديث
 * - سجل التحديثات
 */
const STATUS_OPTIONS = [
  { value: 'pending', label: 'معلق', icon: Clock, color: 'yellow' },
  { value: 'in_progress', label: 'قيد التنفيذ', icon: Wrench, color: 'blue' },
  { value: 'diagnosis', label: 'قيد التشخيص', icon: AlertCircle, color: 'orange' },
  { value: 'testing', label: 'قيد الاختبار', icon: FileCheck, color: 'purple' },
  { value: 'needs_approval', label: 'يحتاج موافقة', icon: AlertCircle, color: 'orange' },
  { value: 'completed', label: 'مكتمل', icon: CheckCircle, color: 'green' },
  { value: 'cancelled', label: 'ملغي', icon: XCircle, color: 'red' },
];

export default function StatusUpdateButton({ repairId, currentStatus, onStatusUpdated }) {
  const notifications = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState('');

  const currentStatusOption = STATUS_OPTIONS.find(s => s.value === currentStatus) || STATUS_OPTIONS[0];

  const handleStatusChange = async (newStatus) => {
    if (newStatus === currentStatus) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    try {
      const response = await updateTechJobStatus(repairId, {
        status: newStatus,
        notes: notes.trim() || undefined,
      });

      if (response.success) {
        notifications.success('تم', { 
          message: `تم تحديث الحالة إلى "${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}"` 
        });
        setIsOpen(false);
        setNotes('');
        if (onStatusUpdated) {
          onStatusUpdated(newStatus);
        }
      } else {
        throw new Error(response.error || 'فشل تحديث الحالة');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      notifications.error('خطأ', { 
        message: error.message || 'فشل تحديث الحالة' 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
          currentStatusOption.color === 'green' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : currentStatusOption.color === 'blue'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            : currentStatusOption.color === 'yellow'
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            : currentStatusOption.color === 'orange'
            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
            : currentStatusOption.color === 'red'
            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
        } hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <currentStatusOption.icon className="w-4 h-4" />
        <span>{currentStatusOption.label}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-xl z-20">
            <div className="p-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">تحديث الحالة</h3>
            </div>

            <div className="p-2 max-h-64 overflow-y-auto">
              {STATUS_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = option.value === currentStatus;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    disabled={isUpdating || isSelected}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      isSelected
                        ? 'bg-primary/10 text-primary cursor-not-allowed'
                        : 'hover:bg-muted text-foreground'
                    } disabled:opacity-50`}
                  >
                    <Icon className={`w-4 h-4 ${
                      option.color === 'green' ? 'text-green-600' :
                      option.color === 'blue' ? 'text-blue-600' :
                      option.color === 'yellow' ? 'text-yellow-600' :
                      option.color === 'orange' ? 'text-orange-600' :
                      option.color === 'red' ? 'text-red-600' :
                      'text-purple-600'
                    }`} />
                    <span className="flex-1 text-right">{option.label}</span>
                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Notes Input */}
            <div className="p-3 border-t border-border">
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                ملاحظة (اختياري)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أضف ملاحظة حول التحديث..."
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={2}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

