import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Clock, Wrench, FileText, CheckCircle } from 'lucide-react';
import { createQuickReport, submitReport } from '../../services/reportService';
import { getDailyTotal } from '../../services/timeTrackingService';
import { useNotifications } from '../notifications/NotificationSystem';

/**
 * Quick Report Form Component
 * نموذج التقرير السريع للفنيين
 * 
 * المميزات:
 * - وصف المشكلة
 * - الحل المطبق
 * - الأجزاء المستخدمة
 * - الوقت المستغرق (تلقائي من Stopwatch)
 * - رفع الصور
 * - تحديث حالة الإصلاح تلقائياً
 */
const QuickReportForm = ({ repairId, repairNumber, onClose, onSuccess }) => {
  const notifications = useNotifications();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    problemDescription: '',
    solutionApplied: '',
    partsUsed: [],
    timeSpent: null,
    images: [],
    additionalNotes: '',
    updateStatus: true,
    newStatus: 'completed'
  });

  const [partInput, setPartInput] = useState({ name: '', quantity: '' });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    // جلب الوقت المستغرق تلقائياً
    loadTimeSpent();
  }, [repairId]);

  const loadTimeSpent = async () => {
    try {
      const response = await getDailyTotal();
      if (response.success && response.data.total) {
        // جلب الوقت من آخر تتبع للإصلاح
        // يمكن تحسين هذا ليجلب الوقت المحدد للإصلاح
        const totalMinutes = Math.floor((response.data.total.totalSeconds || 0) / 60);
        setFormData(prev => ({ ...prev, timeSpent: totalMinutes }));
      }
    } catch (error) {
      console.error('Error loading time spent:', error);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // التحقق من حجم الملفات (حد أقصى 5MB لكل صورة)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        notifications.error('خطأ', { 
          message: `الملف ${file.name} كبير جداً (الحد الأقصى 5MB)` 
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newFiles = [...imageFiles, ...validFiles];
    setImageFiles(newFiles);

    // إنشاء معاينات
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    // تحرير الذاكرة
    if (imagePreviews[index]) {
      URL.revokeObjectURL(imagePreviews[index]);
    }
    
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  // تنظيف الذاكرة عند إغلاق المكون
  useEffect(() => {
    return () => {
      imagePreviews.forEach(preview => {
        if (preview && preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddPart = () => {
    if (partInput.name.trim()) {
      setFormData({
        ...formData,
        partsUsed: [
          ...formData.partsUsed,
          {
            name: partInput.name.trim(),
            quantity: partInput.quantity || '1'
          }
        ]
      });
      setPartInput({ name: '', quantity: '' });
    }
  };

  const handleRemovePart = (index) => {
    setFormData({
      ...formData,
      partsUsed: formData.partsUsed.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.problemDescription.trim() && !formData.solutionApplied.trim()) {
      notifications.error('خطأ', { message: 'يرجى إدخال وصف المشكلة أو الحل المطبق' });
      return;
    }

    try {
      setLoading(true);

      // رفع الصور أولاً (إذا كان هناك)
      let imageUrls = [];
      if (imageFiles.length > 0) {
        // TODO: رفع الصور إلى السيرفر
        // حالياً سنستخدم base64 أو نرفعها لاحقاً
        // يمكن استخدام FormData لرفع الصور
        try {
          // تحويل الصور إلى base64 (مؤقت)
          for (const file of imageFiles) {
            const reader = new FileReader();
            const base64 = await new Promise((resolve, reject) => {
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            imageUrls.push(base64);
          }
        } catch (error) {
          console.error('Error processing images:', error);
          notifications.error('تحذير', { message: 'فشل معالجة الصور، سيتم المتابعة بدونها' });
        }
      }

      const reportData = {
        repairId,
        problemDescription: formData.problemDescription,
        solutionApplied: formData.solutionApplied,
        partsUsed: formData.partsUsed,
        timeSpent: formData.timeSpent,
        images: imageUrls,
        additionalNotes: formData.additionalNotes,
        status: formData.updateStatus ? 'submitted' : 'draft'
      };

      const response = await createQuickReport(reportData);

      if (response.success) {
        notifications.success('نجح', { 
          message: formData.updateStatus 
            ? 'تم تقديم التقرير وتحديث حالة الإصلاح بنجاح' 
            : 'تم حفظ التقرير بنجاح' 
        });
        
        if (onSuccess) {
          onSuccess(response.data.report);
        }
        onClose();
      }
    } catch (error) {
      console.error('Error creating report:', error);
      notifications.error('خطأ', { message: error.message || 'فشل إنشاء التقرير' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">تقرير سريع</h2>
            {repairNumber && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">إصلاح #{repairNumber}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Problem Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Wrench className="w-4 h-4 inline mr-1" />
              وصف المشكلة
            </label>
            <textarea
              value={formData.problemDescription}
              onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
              rows={3}
              placeholder="وصف المشكلة المكتشفة..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Solution Applied */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              الحل المطبق
            </label>
            <textarea
              value={formData.solutionApplied}
              onChange={(e) => setFormData({ ...formData, solutionApplied: e.target.value })}
              rows={3}
              placeholder="وصف الحل المطبق..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Parts Used */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              الأجزاء المستخدمة
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={partInput.name}
                onChange={(e) => setPartInput({ ...partInput, name: e.target.value })}
                placeholder="اسم الجزء"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPart();
                  }
                }}
              />
              <input
                type="number"
                value={partInput.quantity}
                onChange={(e) => setPartInput({ ...partInput, quantity: e.target.value })}
                placeholder="الكمية"
                min="1"
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleAddPart}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                إضافة
              </button>
            </div>
            {formData.partsUsed.length > 0 && (
              <div className="space-y-1">
                {formData.partsUsed.map((part, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {part.name} {part.quantity && `(x${part.quantity})`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePart(index)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Time Spent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              الوقت المستغرق (بالدقائق)
            </label>
            <input
              type="number"
              value={formData.timeSpent || ''}
              onChange={(e) => setFormData({ ...formData, timeSpent: parseInt(e.target.value) || null })}
              min="0"
              placeholder="الوقت المستغرق"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              سيتم جلب الوقت تلقائياً من Stopwatch
            </p>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <ImageIcon className="w-4 h-4 inline mr-1" />
              الصور (اختياري)
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">اضغط لرفع الصور</span>
              </label>
            </div>
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              ملاحظات إضافية
            </label>
            <textarea
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              rows={2}
              placeholder="أي ملاحظات إضافية..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Update Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="updateStatus"
              checked={formData.updateStatus}
              onChange={(e) => setFormData({ ...formData, updateStatus: e.target.checked })}
              className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary bg-white dark:bg-gray-700"
            />
            <label htmlFor="updateStatus" className="text-sm text-gray-700 dark:text-gray-300">
              تحديث حالة الإصلاح إلى "مكتمل" تلقائياً
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {formData.updateStatus ? 'تقديم التقرير' : 'حفظ كمسودة'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickReportForm;

