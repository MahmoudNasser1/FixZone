import React, { useState, useEffect } from 'react';
import { X, GripVertical, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { useNotifications } from '../notifications/NotificationSystem';

/**
 * Dashboard Customization Modal
 * يسمح للمستخدم بتخصيص Dashboard (إظهار/إخفاء widgets، إعادة تعيين التخطيط)
 */
export default function DashboardCustomizationModal({ 
  isOpen, 
  onClose, 
  widgets = [],
  onSave,
  onReset
}) {
  const notifications = useNotifications();
  const [visibleWidgets, setVisibleWidgets] = useState(new Set(widgets.map(w => w.id)));

  useEffect(() => {
    if (isOpen) {
      setVisibleWidgets(new Set(widgets.map(w => w.id)));
    }
  }, [isOpen, widgets]);

  const toggleWidget = (widgetId) => {
    setVisibleWidgets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(widgetId)) {
        newSet.delete(widgetId);
      } else {
        newSet.add(widgetId);
      }
      return newSet;
    });
  };

  const handleSave = () => {
    try {
      const visibleIds = Array.from(visibleWidgets);
      localStorage.setItem('technician-dashboard-visible-widgets', JSON.stringify(visibleIds));
      
      if (onSave) {
        onSave(visibleIds);
      }
      
      notifications.success('تم', { message: 'تم حفظ التخصيصات بنجاح' });
      onClose();
    } catch (error) {
      console.error('Error saving customization:', error);
      notifications.error('خطأ', { message: 'فشل حفظ التخصيصات' });
    }
  };

  const handleReset = () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين جميع التخصيصات؟')) {
      try {
        localStorage.removeItem('technician-dashboard-visible-widgets');
        localStorage.removeItem('technician-dashboard-layout');
        
        if (onReset) {
          onReset();
        }
        
        notifications.success('تم', { message: 'تم إعادة تعيين التخصيصات' });
        onClose();
      } catch (error) {
        console.error('Error resetting customization:', error);
        notifications.error('خطأ', { message: 'فشل إعادة تعيين التخصيصات' });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">تخصيص Dashboard</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            اختر الـ widgets التي تريد إظهارها في Dashboard. يمكنك أيضاً سحب وإفلات الـ widgets لتغيير ترتيبها.
          </p>

          {/* Widgets List */}
          <div className="space-y-2">
            {widgets.map((widget) => {
              const isVisible = visibleWidgets.has(widget.id);
              
              return (
                <div
                  key={widget.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{widget.title}</h3>
                      {widget.description && (
                        <p className="text-sm text-muted-foreground">{widget.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleWidget(widget.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      isVisible
                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                    title={isVisible ? 'إخفاء' : 'إظهار'}
                  >
                    {isVisible ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              💡 يمكنك سحب وإفلات الـ widgets مباشرة في Dashboard لتغيير ترتيبها وحجمها.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            إعادة تعيين
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              حفظ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


