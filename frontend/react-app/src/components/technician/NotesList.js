import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, Clock, AlertCircle, X } from 'lucide-react';
import { getNotes, createNote, deleteNote } from '../../services/noteService';
import { useNotifications } from '../notifications/NotificationSystem';

/**
 * 📝 Notes List Component
 * 
 * قائمة الملاحظات للفني
 * - عرض الملاحظات العامة وملاحظات الأجهزة
 * - إضافة ملاحظات جديدة
 * - البحث في الملاحظات
 * - حذف الملاحظات
 */
export default function NotesList({ repairId = null, deviceId = null, limit = 5 }) {
  const notifications = useNotifications();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', category: 'general' });

  useEffect(() => {
    loadNotes();
  }, [repairId, deviceId, searchQuery]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (limit) filters.limit = limit;
      if (searchQuery && searchQuery.trim()) filters.search = searchQuery.trim();
      if (repairId) filters.repairId = repairId;
      if (deviceId) filters.deviceId = deviceId;

      const response = await getNotes(filters);
      if (response.success) {
        setNotes(response.data.notes || []);
      } else {
        throw new Error(response.error || 'فشل تحميل الملاحظات');
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      notifications.error('خطأ', { message: 'فشل تحميل الملاحظات' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      notifications.error('خطأ', { message: 'يرجى إدخال عنوان ومحتوى الملاحظة' });
      return;
    }

    try {
      const response = await createNote({
        ...newNote,
        repairId: repairId || null,
        deviceId: deviceId || null,
        noteType: repairId || deviceId ? 'device' : 'general',
      });

      if (response.success) {
        notifications.success('تم', { message: 'تم إضافة الملاحظة بنجاح' });
        setShowAddModal(false);
        setNewNote({ title: '', content: '', category: 'general' });
        loadNotes();
      } else {
        throw new Error(response.error || 'فشل إضافة الملاحظة');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      notifications.error('خطأ', { message: error.message || 'فشل إضافة الملاحظة' });
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) {
      return;
    }

    try {
      const response = await deleteNote(noteId);
      if (response.success) {
        notifications.success('تم', { message: 'تم حذف الملاحظة بنجاح' });
        loadNotes();
      } else {
        throw new Error(response.error || 'فشل حذف الملاحظة');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      notifications.error('خطأ', { message: error.message || 'فشل حذف الملاحظة' });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5" />
            الملاحظات
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            إضافة ملاحظة
          </button>
        </div>

        {/* Search */}
        <div className="mt-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في الملاحظات..."
              className="w-full pr-10 pl-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">جاري التحميل...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">لا توجد ملاحظات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 bg-muted/50 rounded-lg border border-border hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{note.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{note.content}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(note.createdAt)}</span>
                  </div>
                  {note.category && (
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                      {note.category}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Note Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">إضافة ملاحظة جديدة</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewNote({ title: '', content: '', category: 'general' });
                }}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  العنوان *
                </label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="عنوان الملاحظة"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  المحتوى *
                </label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="محتوى الملاحظة"
                  rows={4}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  الفئة
                </label>
                <select
                  value={newNote.category}
                  onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="general">عام</option>
                  <option value="technical">تقني</option>
                  <option value="reminder">تذكير</option>
                  <option value="issue">مشكلة</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddNote}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                إضافة
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewNote({ title: '', content: '', category: 'general' });
                }}
                className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

