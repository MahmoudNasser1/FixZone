import React, { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import SimpleButton from './SimpleButton';

const ImageGallery = ({ images = [], repairId }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter only image attachments
  const imageAttachments = images.filter(img => 
    img.type?.startsWith('image/') || 
    /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(img.name || img.id)
  );

  // React Hooks must be called before any conditional returns
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') {
        setLightboxOpen(false);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex((prev) => (prev + 1) % imageAttachments.length);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((prev) => (prev - 1 + imageAttachments.length) % imageAttachments.length);
      }
    };

    if (lightboxOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [lightboxOpen, imageAttachments.length]);

  // Early return after hooks
  if (imageAttachments.length === 0) {
    return null;
  }

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % imageAttachments.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + imageAttachments.length) % imageAttachments.length);
  };

  const getImageUrl = (attachment) => {
    if (attachment.url) {
      // If URL is already absolute (starts with http:// or https://), return it as is
      if (attachment.url.startsWith('http://') || attachment.url.startsWith('https://')) {
        return attachment.url;
      }
      // If URL is relative (starts with /), construct full URL
      if (attachment.url.startsWith('/')) {
        // Use current origin (same origin as the page)
        return `${window.location.origin}${attachment.url}`;
      }
      // If URL doesn't start with /, add it
      return `${window.location.origin}/${attachment.url}`;
    }
    // Fallback: construct URL from repairId and attachment id
    return `${window.location.origin}/uploads/repairs/${repairId}/${encodeURIComponent(attachment.id)}`;
  };

  return (
    <>
      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {imageAttachments.map((attachment, index) => {
          const imageUrl = getImageUrl(attachment);
          return (
            <div
              key={attachment.id || index}
              className="relative group cursor-pointer bg-gray-100 rounded-lg overflow-hidden aspect-square hover:opacity-90 transition-opacity"
              onClick={() => openLightbox(index)}
            >
              <img
                src={imageUrl}
                alt={attachment.name || attachment.title || `صورة ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3Eصورة غير متاحة%3C/text%3E%3C/svg%3E';
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                <ZoomIn className="w-6 h-6 sm:w-8 sm:h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {attachment.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-xs sm:text-sm text-white truncate">{attachment.title}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxOpen && imageAttachments[currentIndex] && (
        <div
          className="fixed inset-0 z-[100] bg-black bg-opacity-95 flex items-center justify-center p-2 sm:p-4"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 text-white hover:text-gray-300 transition-colors p-2 bg-black/50 rounded-full"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Navigation Buttons */}
          {imageAttachments.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors p-2 sm:p-3 bg-black/50 rounded-full"
                aria-label="الصورة السابقة"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors p-2 sm:p-3 bg-black/50 rounded-full"
                aria-label="الصورة التالية"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </>
          )}

          {/* Image Container */}
          <div
            className="relative max-w-full max-h-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getImageUrl(imageAttachments[currentIndex])}
              alt={imageAttachments[currentIndex].name || `صورة ${currentIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            
            {/* Image Info */}
            <div className="mt-3 sm:mt-4 text-center text-white">
              <p className="text-sm sm:text-base font-medium">
                {imageAttachments[currentIndex].title || imageAttachments[currentIndex].name || `صورة ${currentIndex + 1}`}
              </p>
              {imageAttachments.length > 1 && (
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  {currentIndex + 1} / {imageAttachments.length}
                </p>
              )}
            </div>

            {/* Download Button */}
            <SimpleButton
              onClick={(e) => {
                e.stopPropagation();
                const link = document.createElement('a');
                link.href = getImageUrl(imageAttachments[currentIndex]);
                link.download = imageAttachments[currentIndex].name || `image-${currentIndex + 1}.jpg`;
                link.click();
              }}
              variant="outline"
              className="mt-3 sm:mt-4 text-white border-white/30 hover:bg-white/10 min-h-[44px] sm:min-h-[48px]"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              <span className="text-sm sm:text-base">تحميل</span>
            </SimpleButton>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;

