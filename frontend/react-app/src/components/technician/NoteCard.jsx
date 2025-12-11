import React from 'react';
import { Calendar, Tag, Edit2, Trash2, Bell, Lock, Globe } from 'lucide-react';

/**
 * Note Card Component
 * بطاقة الملاحظة
 */
const NoteCard = ({ note, onEdit, onDelete, onClick }) => {
  const getCategoryColor = (category) => {
    switch (category) {
      case 'تقنية':
        return 'bg-blue-100 text-blue-800';
      case 'تذكير':
        return 'bg-yellow-100 text-yellow-800';
      case 'مشكلة':
        return 'bg-red-100 text-red-800';
      case 'حل':
        return 'bg-green-100 text-green-800';
      case 'توصية':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-300';
      case 'medium':
        return 'border-yellow-300';
      case 'low':
        return 'border-blue-300';
      default:
        return 'border-gray-300';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border-2 p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(note.priority)}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          {note.title && (
            <h4 className="font-semibold text-gray-800 text-sm mb-1">
              {note.title}
            </h4>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {note.noteType === 'device' && note.deviceName && (
              <span className="flex items-center gap-1">
                <span>جهاز:</span>
                <span className="font-medium">{note.deviceName}</span>
              </span>
            )}
            {note.noteType === 'general' && (
              <span className="flex items-center gap-1">
                {note.isPrivate ? (
                  <Lock className="w-3 h-3" />
                ) : (
                  <Globe className="w-3 h-3" />
                )}
                <span>{note.isPrivate ? 'خاص' : 'عام'}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 ml-2">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(note);
              }}
              className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
              title="تعديل"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
              title="حذف"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-700 mb-3 line-clamp-3">
        {note.content}
      </p>

      {/* Category & Priority */}
      <div className="flex items-center gap-2 mb-2">
        {note.category && (
          <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(note.category)}`}>
            {note.category}
          </span>
        )}
        {note.priority && (
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            note.priority === 'high' ? 'bg-red-100 text-red-800' :
            note.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {note.priority === 'high' ? 'عالي' : note.priority === 'medium' ? 'متوسط' : 'منخفض'}
          </span>
        )}
      </div>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {note.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs flex items-center gap-1"
            >
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-xs text-gray-400">+{note.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Reminder */}
      {note.reminderDate && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
          <Bell className="w-3 h-3" />
          <span>تذكير: {formatDate(`${note.reminderDate} ${note.reminderTime || ''}`)}</span>
        </div>
      )}

      {/* Date */}
      <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
        <Calendar className="w-3 h-3" />
        <span>{formatDate(note.createdAt)}</span>
      </div>
    </div>
  );
};

export default NoteCard;

