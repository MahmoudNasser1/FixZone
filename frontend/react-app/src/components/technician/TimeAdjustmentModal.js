import React, { useState } from 'react';
import { X, Clock, AlertCircle } from 'lucide-react';
import { requestTimeAdjustment } from '../../services/timeTrackingService';
import { useNotifications } from '../notifications/NotificationSystem';

/**
 * ⏱️ Time Adjustment Modal
 * 
 * واجهة تعديل الوقت
 * - طلب تعديل الوقت من الفني
 * - سجل التعديلات
 */
export default function TimeAdjustmentModal({ trackingId, currentDuration, onClose, onSuccess }) {
  const notifications = useNotifications();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    newDuration: Math.floor(currentDuration / 60), // تحويل من ثواني إلى دقائق
    reason: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason.trim()) {
      notifications.error('خطأ', { message: 'يرجى إدخال سبب التعديل' });
      return;
    }

    if (formData.newDuration <= 0) {
      notifications.error('خطأ', { message: 'الوقت يجب أن يكون أكبر من صفر' });
      return;
    }

    setLoading(true);
    try {
      // تحويل من دقائق إلى ثواني
      const newDurationSeconds = formData.newDuration * 60;
      const response = await requestTimeAdjustment(trackingId, newDurationSeconds, formData.reason);
      
      if (response.success) {
        notifications.success('تم', { message: 'تم إرسال طلب تعديل الوقت بنجاح' });
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        throw new Error(response.error || 'فشل إرسال طلب التعديل');
      }
    } catch (error) {
      console.error('Error requesting time adjustment:', error);
      notifications.error('خطأ', { message: error.message || 'فشل إرسال طلب التعديل' });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">طلب تعديل الوقت</h2>
              <p className="text-sm text-muted-foreground">الوقت الحالي: {formatTime(currentDuration)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-300">
                <p className="font-medium mb-1">ملاحظة مهمة</p>
                <p>سيتم إرسال طلب تعديل الوقت للمشرف للموافقة عليه. سيتم إشعارك عند الموافقة أو الرفض.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              الوقت الجديد (بالدقائق) *
            </label>
            <input
              type="number"
              value={formData.newDuration}
              onChange={(e) => setFormData({ ...formData, newDuration: parseInt(e.target.value) || 0 })}
              min="1"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              الوقت الحالي: {formatTime(currentDuration)} ({Math.floor(currentDuration / 60)} دقيقة)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              سبب التعديل *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="اذكر سبب طلب تعديل الوقت..."
              rows={4}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              required
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

