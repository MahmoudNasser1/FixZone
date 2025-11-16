import React, { useState, useEffect } from 'react';
import { getTechJobMedia } from '../../services/technicianService';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../ui/SimpleCard';
import SimpleButton from '../ui/SimpleButton';
import SimpleBadge from '../ui/SimpleBadge';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useNotifications } from '../notifications/NotificationSystem';
import {
  Image as ImageIcon,
  Video,
  FileText,
  Calendar,
  User,
  ZoomIn,
  X,
  RefreshCw
} from 'lucide-react';

/**
 * MediaGallery Component
 * عرض معرض الوسائط (صور، فيديو، مستندات) للجهاز
 */

// Media type icons
const mediaTypeIcons = {
  IMAGE: ImageIcon,
  VIDEO: Video,
  DOCUMENT: FileText,
};

// Category colors
const categoryColors = {
  BEFORE: 'bg-blue-100 text-blue-700 border-blue-200',
  DURING: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  AFTER: 'bg-green-100 text-green-700 border-green-200',
  PARTS: 'bg-orange-100 text-orange-700 border-orange-200',
  EVIDENCE: 'bg-purple-100 text-purple-700 border-purple-200',
};

// Category labels
const categoryLabels = {
  BEFORE: 'قبل الإصلاح',
  DURING: 'أثناء الإصلاح',
  AFTER: 'بعد الإصلاح',
  PARTS: 'قطع الغيار',
  EVIDENCE: 'إثبات/دليل',
};

export default function MediaGallery({ jobId, onUploadClick }) {
  const notifications = useNotifications();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    if (jobId) {
      loadMedia();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const response = await getTechJobMedia(jobId);
      
      if (response.success) {
        setMedia(response.data || []);
      } else {
        notifications.error('خطأ', { message: 'فشل تحميل الوسائط' });
      }
    } catch (error) {
      console.error('Error loading media:', error);
      notifications.error('خطأ', { message: 'فشل تحميل الوسائط' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadMedia();
  };

  const openLightbox = (mediaItem) => {
    setSelectedMedia(mediaItem);
  };

  const closeLightbox = () => {
    setSelectedMedia(null);
  };

  // Filter media by category
  const filteredMedia = filterCategory
    ? media.filter(m => m.category === filterCategory)
    : media;

  // Group media by category
  const groupedMedia = {};
  filteredMedia.forEach(item => {
    const cat = item.category || 'DURING';
    if (!groupedMedia[cat]) {
      groupedMedia[cat] = [];
    }
    groupedMedia[cat].push(item);
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            معرض الوسائط ({filteredMedia.length})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <SimpleButton
            variant="outline"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw className="w-4 h-4" />
          </SimpleButton>
          {onUploadClick && (
            <SimpleButton
              variant="default"
              size="sm"
              onClick={onUploadClick}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              رفع وسائط
            </SimpleButton>
          )}
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <SimpleButton
          variant={!filterCategory ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterCategory('')}
        >
          الكل ({media.length})
        </SimpleButton>
        {Object.keys(categoryLabels).map((cat) => {
          const count = media.filter(m => m.category === cat).length;
          return count > 0 ? (
            <SimpleButton
              key={cat}
              variant={filterCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory(cat)}
            >
              {categoryLabels[cat]} ({count})
            </SimpleButton>
          ) : null;
        })}
      </div>

      {/* Media display */}
      {filteredMedia.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600 mb-2">لا توجد وسائط</p>
          {onUploadClick && (
            <SimpleButton variant="outline" size="sm" onClick={onUploadClick}>
              رفع وسائط
            </SimpleButton>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.map((item, index) => {
            const MediaIcon = mediaTypeIcons[item.fileType] || ImageIcon;
            const categoryColor = categoryColors[item.category] || categoryColors.DURING;

            return (
              <div
                key={item.id || index}
                className="relative group cursor-pointer"
                onClick={() => openLightbox(item)}
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 hover:border-indigo-400 transition-all">
                  {item.fileType === 'IMAGE' ? (
                    <img
                      src={item.fileUrl}
                      alt={item.description || 'صورة'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
                        e.target.alt = 'فشل التحميل';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <MediaIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                    <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Category badge */}
                <div className="absolute top-2 right-2">
                  <SimpleBadge className={`text-xs ${categoryColor}`}>
                    {categoryLabels[item.category] || item.category}
                  </SimpleBadge>
                </div>

                {/* Description */}
                {item.description && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Media content */}
            <div className="bg-white rounded-lg overflow-hidden">
              {selectedMedia.fileType === 'IMAGE' ? (
                <img
                  src={selectedMedia.fileUrl}
                  alt={selectedMedia.description || 'صورة'}
                  className="w-full max-h-[70vh] object-contain"
                />
              ) : selectedMedia.fileType === 'VIDEO' ? (
                <video
                  src={selectedMedia.fileUrl}
                  controls
                  className="w-full max-h-[70vh]"
                />
              ) : (
                <div className="p-12 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <a
                    href={selectedMedia.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    فتح المستند
                  </a>
                </div>
              )}

              {/* Info bar */}
              <div className="p-4 bg-gray-50 border-t">
                <div className="flex items-center justify-between mb-2">
                  <SimpleBadge className={categoryColors[selectedMedia.category] || categoryColors.DURING}>
                    {categoryLabels[selectedMedia.category] || selectedMedia.category}
                  </SimpleBadge>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedMedia.uploadedAt)}
                  </div>
                </div>
                {selectedMedia.description && (
                  <p className="text-sm text-gray-700">{selectedMedia.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


