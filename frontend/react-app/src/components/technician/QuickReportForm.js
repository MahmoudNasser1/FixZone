import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, FileText, Save } from 'lucide-react';
// Note: createReport should be imported from reportService, not technicianReportService
// technicianReportService is for exporting reports only
import { createQuickReport } from '../../services/reportService';
import { getActiveTracking } from '../../services/timeTrackingService';
import { useNotifications } from '../notifications/NotificationSystem';

/**
 * 📋 Quick Report Form Component
 * 
 * نموذج التقرير السريع
 * - وصف المشكلة
 * - الحل المطبق
 * - الأجزاء المستخدمة
 * - الوقت المستغرق (تلقائي من Stopwatch)
 * - رفع الصور
 * - تحديث الحالة تلقائياً
 */
export default function QuickReportForm({ repairId, repairNumber, onClose, onSuccess }) {
  const notifications = useNotifications();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    problemDescription: '',
    solutionApplied: '',
    partsUsed: [],
    timeSpent: null,
    images: [],
    additionalNotes: '',
    updateStatus: true,
    newStatus: 'completed',
  });
  const [newPart, setNewPart] = useState({ name: '', quantity: 1 });

  useEffect(() => {
    loadTimeFromTracking();
  }, [repairId]);

  const loadTimeFromTracking = async () => {
    try {
      const response = await getActiveTracking();
      if (response.success && response.data?.tracking) {
        const tracking = response.data.tracking;
        if (tracking.repairId === repairId && tracking.duration) {
          // تحويل من ثواني إلى دقائق
          const minutes = Math.floor(tracking.duration / 60);
          setFormData(prev => ({ ...prev, timeSpent: minutes }));
        }
      }
    } catch (error) {
      console.error('Error loading time from tracking:', error);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // في الإنتاج، يجب رفع الصور إلى السيرفر أولاً
    // هنا نستخدم URLs مؤقتة للعرض
    const imageUrls = files.map(file => URL.createObjectURL(file));
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...imageUrls]
    }));
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addPart = () => {
    if (!newPart.name.trim()) {
      notifications.error('خطأ', { message: 'يرجى إدخال اسم القطعة' });
      return;
    }

    setFormData(prev => ({
      ...prev,
      partsUsed: [...prev.partsUsed, { ...newPart, quantity: parseInt(newPart.quantity) || 1 }]
    }));
    setNewPart({ name: '', quantity: 1 });
  };

  const removePart = (index) => {
    setFormData(prev => ({
      ...prev,
      partsUsed: prev.partsUsed.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.problemDescription.trim() || !formData.solutionApplied.trim()) {
      notifications.error('خطأ', { message: 'يرجى إدخال وصف المشكلة والحل المطبق' });
      return;
    }

    setLoading(true);
    try {
      const reportData = {
        repairId,
        reportType: 'quick',
        problemDescription: formData.problemDescription,
        solutionApplied: formData.solutionApplied,
        partsUsed: formData.partsUsed,
        timeSpent: formData.timeSpent,
        images: formData.images,
        additionalNotes: formData.additionalNotes,
        status: formData.updateStatus ? 'submitted' : 'draft',
      };

      const response = await createQuickReport(reportData);
      
      if (response.success) {
        notifications.success('تم', { message: 'تم حفظ التقرير بنجاح' });
        
        // تحديث حالة الإصلاح إذا كان مطلوباً
        if (formData.updateStatus) {
          // سيتم تحديث الحالة تلقائياً من Backend
          notifications.info('تم', { message: 'تم تحديث حالة الإصلاح إلى "مكتمل"' });
        }
        
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        throw new Error(response.error || 'فشل حفظ التقرير');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      notifications.error('خطأ', { message: error.message || 'فشل حفظ التقرير' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card rounded-xl border border-border shadow-xl max-w-2xl w-full p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">تقرير سريع</h2>
            {repairNumber && (
              <p className="text-sm text-muted-foreground mt-1">رقم الإصلاح: {repairNumber}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Problem Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              وصف المشكلة *
            </label>
            <textarea
              value={formData.problemDescription}
              onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
              placeholder="وصف المشكلة المكتشفة..."
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              required
            />
          </div>

          {/* Solution Applied */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              الحل المطبق *
            </label>
            <textarea
              value={formData.solutionApplied}
              onChange={(e) => setFormData({ ...formData, solutionApplied: e.target.value })}
              placeholder="وصف الحل المطبق..."
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              required
            />
          </div>

          {/* Parts Used */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              الأجزاء المستخدمة
            </label>
            <div className="space-y-2">
              {formData.partsUsed.map((part, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <span className="flex-1 text-sm">{part.name} (×{part.quantity})</span>
                  <button
                    type="button"
                    onClick={() => removePart(index)}
                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPart.name}
                  onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                  placeholder="اسم القطعة"
                  className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <input
                  type="number"
                  value={newPart.quantity}
                  onChange={(e) => setNewPart({ ...newPart, quantity: parseInt(e.target.value) || 1 })}
                  min="1"
                  className="w-20 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <button
                  type="button"
                  onClick={addPart}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  إضافة
                </button>
              </div>
            </div>
          </div>

          {/* Time Spent */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              الوقت المستغرق (بالدقائق)
            </label>
            <input
              type="number"
              value={formData.timeSpent || ''}
              onChange={(e) => setFormData({ ...formData, timeSpent: parseInt(e.target.value) || null })}
              placeholder="الوقت المستغرق"
              min="0"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              يتم ملء هذا الحقل تلقائياً من Stopwatch إذا كان نشطاً
            </p>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              الصور (اختياري)
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-background hover:bg-muted cursor-pointer transition-colors text-sm">
                  <Upload className="w-4 h-4" />
                  رفع صور
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {formData.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              ملاحظات إضافية
            </label>
            <textarea
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              placeholder="ملاحظات إضافية..."
              rows={2}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Update Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="updateStatus"
              checked={formData.updateStatus}
              onChange={(e) => setFormData({ ...formData, updateStatus: e.target.checked })}
              className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
            />
            <label htmlFor="updateStatus" className="text-sm text-foreground">
              تحديث حالة الإصلاح إلى "مكتمل" تلقائياً
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  حفظ التقرير
                </>
              )}
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

