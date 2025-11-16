import React, { useState } from 'react';
import { uploadTechJobMedia } from '../../services/technicianService';
import SimpleButton from '../ui/SimpleButton';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { useNotifications } from '../notifications/NotificationSystem';
import {
  X,
  Image as ImageIcon,
  Video,
  FileText,
  Upload,
  CheckCircle
} from 'lucide-react';

/**
 * MediaUploadModal Component
 * Modal لرفع الوسائط (صور، فيديو، مستندات)
 */

const FILE_TYPES = [
  { value: 'IMAGE', label: 'صورة', icon: ImageIcon },
  { value: 'VIDEO', label: 'فيديو', icon: Video },
  { value: 'DOCUMENT', label: 'مستند', icon: FileText },
];

const CATEGORIES = [
  { value: 'BEFORE', label: 'قبل الإصلاح', color: 'bg-blue-100 text-blue-700' },
  { value: 'DURING', label: 'أثناء الإصلاح', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'AFTER', label: 'بعد الإصلاح', color: 'bg-green-100 text-green-700' },
  { value: 'PARTS', label: 'قطع الغيار', color: 'bg-orange-100 text-orange-700' },
  { value: 'EVIDENCE', label: 'إثبات/دليل', color: 'bg-purple-100 text-purple-700' },
];

export default function MediaUploadModal({ jobId, isOpen, onClose, onSuccess }) {
  const notifications = useNotifications();
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    fileUrl: '',
    fileType: 'IMAGE',
    category: 'DURING',
    description: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fileUrl.trim()) {
      notifications.warning('تنبيه', { message: 'يرجى إدخال رابط الملف' });
      return;
    }

    try {
      setUploading(true);
      const response = await uploadTechJobMedia(jobId, formData);

      if (response.success) {
        notifications.success('نجاح', { message: 'تم رفع الوسائط بنجاح' });
        
        // Reset form
        setFormData({
          fileUrl: '',
          fileType: 'IMAGE',
          category: 'DURING',
          description: '',
        });

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }

        // Close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        notifications.error('خطأ', { message: response.message || 'فشل رفع الوسائط' });
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      notifications.error('خطأ', { message: 'فشل رفع الوسائط' });
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">رفع وسائط</h3>
                <p className="text-sm text-gray-600">إضافة صور أو فيديو أو مستندات</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رابط الملف *
              </label>
              <Input
                type="url"
                name="fileUrl"
                value={formData.fileUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                أدخل رابط مباشر للملف (صورة، فيديو، أو مستند)
              </p>
            </div>

            {/* File Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع الملف *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {FILE_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, fileType: type.value }))}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        formData.fileType === type.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-8 h-8 mx-auto mb-2 ${
                        formData.fileType === type.value ? 'text-indigo-600' : 'text-gray-400'
                      }`} />
                      <p className={`text-sm font-medium ${
                        formData.fileType === type.value ? 'text-indigo-600' : 'text-gray-700'
                      }`}>
                        {type.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التصنيف *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.category === cat.value
                        ? `${cat.color} border-current`
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الوصف (اختياري)
              </label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="أضف وصف للملف..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <SimpleButton
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={uploading}
              >
                إلغاء
              </SimpleButton>
              <SimpleButton
                type="submit"
                disabled={uploading || !formData.fileUrl.trim()}
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    جاري الرفع...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    رفع الوسائط
                  </>
                )}
              </SimpleButton>
            </div>
          </form>

          {/* Helper text */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>ملاحظة:</strong> يمكنك رفع الملفات إلى خدمة تخزين سحابية (مثل ImgBB أو Cloudinary) ثم نسخ الرابط هنا.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


