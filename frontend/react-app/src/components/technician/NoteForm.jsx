import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Tag, Bell, Lock, Globe } from 'lucide-react';
import { createNote, updateNote } from '../../services/noteService';
import { useNotifications } from '../notifications/NotificationSystem';

/**
 * Note Form Component
 * نموذج إضافة/تعديل الملاحظات
 */
const NoteForm = ({ note = null, deviceId = null, repairId = null, taskId = null, onClose, onSuccess }) => {
  const notifications = useNotifications();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    noteType: deviceId ? 'device' : repairId ? 'device' : taskId ? 'task' : 'general',
    deviceId: deviceId || null,
    repairId: repairId || null,
    taskId: taskId || null,
    category: '',
    priority: 'medium',
    tags: [],
    isPrivate: false,
    reminderDate: '',
    reminderTime: ''
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title || '',
        content: note.content || '',
        noteType: note.noteType || 'general',
        deviceId: note.deviceId || deviceId || null,
        repairId: note.repairId || repairId || null,
        taskId: note.taskId || taskId || null,
        category: note.category || '',
        priority: note.priority || 'medium',
        tags: note.tags || [],
        isPrivate: note.isPrivate || false,
        reminderDate: note.reminderDate || '',
        reminderTime: note.reminderTime || ''
      });
    }
  }, [note, deviceId, repairId, taskId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      notifications.error('خطأ', { message: 'محتوى الملاحظة مطلوب' });
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        tags: formData.tags
      };

      let response;
      if (note) {
        response = await updateNote(note.id, submitData);
      } else {
        response = await createNote(submitData);
      }

      if (response.success) {
        notifications.success('نجح', { 
          message: note ? 'تم تحديث الملاحظة بنجاح' : 'تم إنشاء الملاحظة بنجاح' 
        });
        if (onSuccess) {
          onSuccess(response.data.note);
        }
        onClose();
      }
    } catch (error) {
      console.error('Error saving note:', error);
      notifications.error('خطأ', { message: error.message || 'فشل حفظ الملاحظة' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            {note ? 'تعديل الملاحظة' : 'ملاحظة جديدة'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              عنوان الملاحظة (اختياري)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="عنوان مختصر للملاحظة"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              المحتوى <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={5}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="اكتب ملاحظتك هنا..."
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الفئة
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">اختر الفئة</option>
                <option value="تقنية">تقنية</option>
                <option value="تذكير">تذكير</option>
                <option value="مشكلة">مشكلة</option>
                <option value="حل">حل</option>
                <option value="توصية">توصية</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الأولوية
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="low">منخفض</option>
                <option value="medium">متوسط</option>
                <option value="high">عالي</option>
              </select>
            </div>
          </div>

          {/* Reminder */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Bell className="w-4 h-4 inline mr-1" />
                تاريخ التذكير
              </label>
              <input
                type="date"
                value={formData.reminderDate}
                onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                وقت التذكير
              </label>
              <input
                type="time"
                value={formData.reminderTime}
                onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={!formData.reminderDate}
              />
            </div>
          </div>

          {/* Privacy (for general notes only) */}
          {formData.noteType === 'general' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrivate"
                checked={formData.isPrivate}
                onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="isPrivate" className="text-sm text-gray-700 flex items-center gap-1">
                {formData.isPrivate ? (
                  <>
                    <Lock className="w-4 h-4" />
                    ملاحظة خاصة (فقط لي)
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    ملاحظة عامة (للجميع)
                  </>
                )}
              </label>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Tag className="w-4 h-4 inline mr-1" />
              العلامات
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="أضف علامة واضغط Enter"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                إضافة
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري الحفظ...' : (note ? 'تحديث' : 'إنشاء')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteForm;



