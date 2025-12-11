import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Bell, Calendar } from 'lucide-react';
import NoteCard from './NoteCard';
import NoteForm from './NoteForm';
import { getNotes, deleteNote, getReminders } from '../../services/noteService';
import { useNotifications } from '../notifications/NotificationSystem';

/**
 * Notes List Component
 * قائمة الملاحظات
 * 
 * المميزات:
 * - عرض الملاحظات العامة والخاصة على الأجهزة
 * - فلترة حسب النوع والفئة
 * - بحث في الملاحظات
 * - التذكيرات
 */
const NotesList = ({ deviceId = null, repairId = null, taskId = null, onNoteClick = null }) => {
  const notifications = useNotifications();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    loadNotes();
    loadReminders();
  }, [deviceId, repairId, taskId, filterCategory, filterType]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const filters = {
        deviceId: deviceId || undefined,
        repairId: repairId || undefined,
        category: filterCategory || undefined,
        noteType: filterType || undefined,
        search: searchTerm || undefined
      };

      // إزالة undefined values
      Object.keys(filters).forEach(key => 
        filters[key] === undefined && delete filters[key]
      );

      const response = await getNotes(filters);
      if (response.success) {
        setNotes(response.data.notes || []);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      notifications.error('خطأ', { message: 'فشل تحميل الملاحظات' });
    } finally {
      setLoading(false);
    }
  };

  const loadReminders = async () => {
    try {
      const response = await getReminders();
      if (response.success) {
        setReminders(response.data.reminders || []);
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const handleAddNote = () => {
    setEditingNote(null);
    setShowNoteForm(true);
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setShowNoteForm(true);
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) {
      return;
    }

    try {
      const response = await deleteNote(noteId);
      if (response.success) {
        notifications.success('نجح', { message: 'تم حذف الملاحظة بنجاح' });
        loadNotes();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      notifications.error('خطأ', { message: 'فشل حذف الملاحظة' });
    }
  };

  const handleNoteFormSuccess = () => {
    setShowNoteForm(false);
    setEditingNote(null);
    loadNotes();
    loadReminders();
  };

  const filteredNotes = notes.filter(note => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        (note.title && note.title.toLowerCase().includes(search)) ||
        note.content.toLowerCase().includes(search)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="notes-list">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">الملاحظات</h3>
          {deviceId && (
            <p className="text-sm text-gray-500 mt-1">ملاحظات خاصة على هذا الجهاز</p>
          )}
        </div>
        <button
          onClick={handleAddNote}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>ملاحظة جديدة</span>
        </button>
      </div>

      {/* Reminders */}
      {reminders.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-yellow-600" />
            <h4 className="font-semibold text-yellow-800">التذكيرات</h4>
          </div>
          <div className="space-y-2">
            {reminders.slice(0, 3).map((reminder) => (
              <div key={reminder.id} className="text-sm text-yellow-700">
                {reminder.title && <span className="font-medium">{reminder.title}: </span>}
                {reminder.content.substring(0, 50)}...
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              loadNotes();
            }}
            placeholder="بحث في الملاحظات..."
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">جميع الفئات</option>
          <option value="تقنية">تقنية</option>
          <option value="تذكير">تذكير</option>
          <option value="مشكلة">مشكلة</option>
          <option value="حل">حل</option>
          <option value="توصية">توصية</option>
        </select>
        {!deviceId && !repairId && (
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">جميع الأنواع</option>
            <option value="general">عامة</option>
            <option value="device">على جهاز</option>
            <option value="task">على مهمة</option>
          </select>
        )}
      </div>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>لا توجد ملاحظات</p>
          <button
            onClick={handleAddNote}
            className="mt-4 text-primary hover:text-primary/80 font-medium"
          >
            إضافة ملاحظة جديدة
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
              onClick={() => onNoteClick && onNoteClick(note)}
            />
          ))}
        </div>
      )}

      {/* Note Form Modal */}
      {showNoteForm && (
        <NoteForm
          note={editingNote}
          deviceId={deviceId}
          repairId={repairId}
          taskId={taskId}
          onClose={() => {
            setShowNoteForm(false);
            setEditingNote(null);
          }}
          onSuccess={handleNoteFormSuccess}
        />
      )}
    </div>
  );
};

export default NotesList;

