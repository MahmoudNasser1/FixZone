import React, { useState, useRef } from 'react';
import { 
  Paperclip, FileText, Image, Download, Trash2, 
  Plus, Upload, X, Eye, Filter, Search, Edit2,
  Video, Music, Archive, File, Save
} from 'lucide-react';
import SimpleButton from './SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from './SimpleCard';
import SimpleBadge from './SimpleBadge';

const AttachmentManager = ({ 
  attachments = [], 
  onUpload, 
  onDelete, 
  onView,
  onDownload,
  onEdit,
  allowUpload = true,
  allowDelete = true,
  allowEdit = true,
  maxFileSize = 10, // MB
  allowedTypes = ['image/*', 'application/pdf', '.doc', '.docx', 'video/*', 'audio/*']
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAttachment, setEditingAttachment] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const fileInputRef = useRef(null);

  const getFileIcon = (type, fileName) => {
    if (type?.startsWith('image/')) return Image;
    if (type?.startsWith('video/')) return Video;
    if (type?.startsWith('audio/')) return Music;
    if (type?.includes('pdf')) return FileText;
    if (type?.includes('zip') || type?.includes('rar')) return Archive;
    if (fileName?.toLowerCase().includes('.doc')) return FileText;
    return File;
  };

  const getFileTypeColor = (type) => {
    if (type?.startsWith('image/')) return 'text-green-600 bg-green-100';
    if (type?.startsWith('video/')) return 'text-purple-600 bg-purple-100';
    if (type?.startsWith('audio/')) return 'text-blue-600 bg-blue-100';
    if (type?.includes('pdf')) return 'text-red-600 bg-red-100';
    if (type?.includes('zip') || type?.includes('rar')) return 'text-orange-600 bg-orange-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getFileCategory = (type) => {
    if (type?.startsWith('image/')) return 'image';
    if (type?.startsWith('video/')) return 'video';
    if (type?.startsWith('audio/')) return 'audio';
    if (type?.includes('pdf') || type?.includes('doc')) return 'document';
    return 'other';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileSelect = async (files) => {
    if (!onUpload || !files?.length) return;
    
    setUploading(true);
    
    try {
      for (const file of files) {
        // التحقق من حجم الملف
        if (file.size > maxFileSize * 1024 * 1024) {
          alert(`الملف ${file.name} كبير جداً. الحد الأقصى ${maxFileSize} ميجابايت`);
          continue;
        }
        
        // التحقق من نوع الملف
        const isAllowed = allowedTypes.some(type => {
          if (type.includes('*')) {
            return file.type.startsWith(type.replace('*', ''));
          }
          return file.type === type || file.name.toLowerCase().endsWith(type);
        });
        
        if (!isAllowed) {
          alert(`نوع الملف ${file.name} غير مدعوم`);
          continue;
        }
        
        await onUpload(file);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('حدث خطأ في رفع الملفات');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDownload = (attachment) => {
    if (onDownload) {
      onDownload(attachment);
    } else {
      // Fallback: create download link
      const link = document.createElement('a');
      link.href = attachment.url || '#';
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleView = (attachment) => {
    if (onView) {
      onView(attachment);
    } else {
      // Fallback: open in new window
      if (attachment.url) {
        window.open(attachment.url, '_blank');
      }
    }
  };

  const handleDelete = (attachment) => {
    if (window.confirm(`هل تريد حذف الملف "${attachment.title || attachment.name}"؟`)) {
      if (onDelete) {
        onDelete(attachment.id);
      }
    }
  };

  const handleEdit = (attachment) => {
    setEditingAttachment(attachment);
    setEditTitle(attachment.title || attachment.name);
    setEditDescription(attachment.description || '');
  };

  const handleSaveEdit = () => {
    if (onEdit && editingAttachment) {
      onEdit(editingAttachment.id, {
        title: editTitle,
        description: editDescription
      });
    }
    setEditingAttachment(null);
    setEditTitle('');
    setEditDescription('');
  };

  const filteredAttachments = attachments.filter(attachment => {
    const matchesFilter = filter === 'all' || getFileCategory(attachment.type) === filter;
    const matchesSearch = !searchTerm || 
      (attachment.title || attachment.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (attachment.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filterOptions = [
    { value: 'all', label: 'جميع الملفات', count: attachments.length },
    { value: 'image', label: 'الصور', count: attachments.filter(a => getFileCategory(a.type) === 'image').length },
    { value: 'document', label: 'المستندات', count: attachments.filter(a => getFileCategory(a.type) === 'document').length },
    { value: 'video', label: 'الفيديو', count: attachments.filter(a => getFileCategory(a.type) === 'video').length },
    { value: 'audio', label: 'الصوتيات', count: attachments.filter(a => getFileCategory(a.type) === 'audio').length },
    { value: 'other', label: 'أخرى', count: attachments.filter(a => getFileCategory(a.type) === 'other').length }
  ].filter(option => option.count > 0 || option.value === 'all');

  return (
    <SimpleCard>
      <SimpleCardHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SimpleCardTitle className="flex items-center">
              <Paperclip className="w-5 h-5 ml-2" />
              المرفقات ({filteredAttachments.length} من {attachments.length})
            </SimpleCardTitle>
            
            {allowUpload && (
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={allowedTypes.join(',')}
                  onChange={(e) => handleFileSelect(Array.from(e.target.files))}
                  className="hidden"
                  id="file-upload"
                />
                <SimpleButton 
                  size="sm" 
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="w-4 h-4 ml-1" />
                  {uploading ? 'جاري الرفع...' : 'إضافة ملف'}
                </SimpleButton>
              </div>
            )}
          </div>

          {/* شريط البحث والفلترة */}
          {attachments.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3">
              {/* البحث */}
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="البحث في الملفات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* الفلترة */}
              <div className="flex items-center space-x-2 space-x-reverse">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {filterOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({option.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </SimpleCardHeader>
      
      <SimpleCardContent>
        {/* منطقة السحب والإفلات */}
        {allowUpload && (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              اسحب الملفات هنا أو 
              <label htmlFor="file-upload" className="text-blue-600 hover:text-blue-700 cursor-pointer mr-1">
                اختر ملفات
              </label>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              الحد الأقصى: {maxFileSize} ميجابايت لكل ملف
            </p>
          </div>
        )}

        {/* قائمة المرفقات */}
        {filteredAttachments.length > 0 ? (
          <div className={`space-y-3 ${allowUpload ? 'mt-6' : ''}`}>
            {filteredAttachments.map((attachment) => {
              const FileIcon = getFileIcon(attachment.type, attachment.name);
              const colorClass = getFileTypeColor(attachment.type);
              const isEditing = editingAttachment?.id === attachment.id;
              
              return (
                <div key={attachment.id} className="bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  {isEditing ? (
                    /* نموذج التحرير */
                    <div className="p-4 space-y-3">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                          <FileIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-3 py-1 text-sm font-medium border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="عنوان الملف"
                          />
                        </div>
                      </div>
                      
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={2}
                        placeholder="وصف توضيحي للملف (اختياري)"
                      />
                      
                      <div className="flex items-center justify-end space-x-2 space-x-reverse">
                        <SimpleButton 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingAttachment(null)}
                        >
                          <X className="w-4 h-4 ml-1" />
                          إلغاء
                        </SimpleButton>
                        <SimpleButton 
                          size="sm"
                          onClick={handleSaveEdit}
                        >
                          <Save className="w-4 h-4 ml-1" />
                          حفظ
                        </SimpleButton>
                      </div>
                    </div>
                  ) : (
                    /* عرض عادي */
                    <div className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 space-x-reverse flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass} flex-shrink-0`}>
                            <FileIcon className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {attachment.title || attachment.name}
                              </p>
                              <SimpleBadge 
                                className={`${getFileTypeColor(attachment.type)} text-xs`}
                                size="sm"
                              >
                                {getFileCategory(attachment.type)}
                              </SimpleBadge>
                            </div>
                            
                            {attachment.description && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {attachment.description}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-4 space-x-reverse text-xs text-gray-500 mt-1">
                              <span>{attachment.size || formatFileSize(attachment.fileSize)}</span>
                              {attachment.uploadedBy && (
                                <span>رفع بواسطة: {attachment.uploadedBy}</span>
                              )}
                              {attachment.uploadedAt && (
                                <span>{new Date(attachment.uploadedAt).toLocaleDateString('ar-SA')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 space-x-reverse flex-shrink-0">
                          <SimpleButton 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleView(attachment)}
                            title="معاينة"
                          >
                            <Eye className="w-4 h-4" />
                          </SimpleButton>
                          
                          <SimpleButton 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownload(attachment)}
                            title="تحميل"
                          >
                            <Download className="w-4 h-4" />
                          </SimpleButton>
                          
                          {allowEdit && (
                            <SimpleButton 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(attachment)}
                              title="تحرير"
                            >
                              <Edit2 className="w-4 h-4" />
                            </SimpleButton>
                          )}
                          
                          {allowDelete && (
                            <SimpleButton 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(attachment)}
                              className="text-red-600 hover:text-red-700"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </SimpleButton>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`text-center py-8 ${allowUpload ? 'mt-6' : ''}`}>
            <Paperclip className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">لا توجد مرفقات</p>
            {allowUpload && (
              <p className="text-sm text-gray-400 mt-1">
                ابدأ بإضافة ملفات لهذا الطلب
              </p>
            )}
          </div>
        )}

        {/* معلومات إضافية */}
        {attachments.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">إجمالي الملفات:</span>
                <span className="mr-2">{attachments.length}</span>
              </div>
              <div>
                <span className="font-medium">الحجم الإجمالي:</span>
                <span className="mr-2">
                  {formatFileSize(
                    attachments.reduce((total, att) => 
                      total + (att.fileSize || 0), 0
                    )
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </SimpleCardContent>
    </SimpleCard>
  );
};

export default AttachmentManager;
