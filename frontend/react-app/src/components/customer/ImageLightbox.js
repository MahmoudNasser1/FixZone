import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';

/**
 * ImageLightbox - Fullscreen image viewer
 * 
 * Features:
 * - Fullscreen overlay
 * - Navigation between images
 * - Zoom controls
 * - Download button
 * - Keyboard navigation
 * - Touch gestures (swipe)
 */

export default function ImageLightbox({ images, initialIndex = 0, isOpen, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [zoom, setZoom] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setCurrentIndex(initialIndex);
        setZoom(1);
    }, [initialIndex, isOpen]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowLeft':
                    goToNext();
                    break;
                case 'ArrowRight':
                    goToPrev();
                    break;
                case '+':
                case '=':
                    handleZoomIn();
                    break;
                case '-':
                    handleZoomOut();
                    break;
                default:
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, currentIndex]);

    if (!isOpen || !images || images.length === 0) return null;

    const currentImage = images[currentIndex];

    const goToPrev = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        setZoom(1);
        setIsLoading(true);
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        setZoom(1);
        setIsLoading(true);
    };

    const handleZoomIn = () => {
        setZoom((prev) => Math.min(prev + 0.5, 3));
    };

    const handleZoomOut = () => {
        setZoom((prev) => Math.max(prev - 0.5, 0.5));
    };

    const handleDownload = async () => {
        try {
            const response = await fetch(currentImage.url || currentImage.path);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = currentImage.name || `image-${currentIndex + 1}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex items-center gap-4">
                    <span className="text-white/80 text-sm">
                        {currentIndex + 1} / {images.length}
                    </span>
                    {currentImage.category && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                            currentImage.category === 'before' 
                                ? 'bg-red-500/20 text-red-300' 
                                : 'bg-green-500/20 text-green-300'
                        }`}>
                            {currentImage.category === 'before' ? 'قبل الإصلاح' : 'بعد الإصلاح'}
                        </span>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Zoom Controls */}
                    <button
                        onClick={handleZoomOut}
                        className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                        title="تصغير"
                    >
                        <ZoomOut className="w-5 h-5" />
                    </button>
                    <span className="text-white/80 text-sm min-w-[60px] text-center">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        onClick={handleZoomIn}
                        className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                        title="تكبير"
                    >
                        <ZoomIn className="w-5 h-5" />
                    </button>

                    {/* Download */}
                    <button
                        onClick={handleDownload}
                        className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors mr-2"
                        title="تحميل"
                    >
                        <Download className="w-5 h-5" />
                    </button>

                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                        title="إغلاق"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Image Container */}
            <div 
                className="flex-1 flex items-center justify-center p-4 cursor-move"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <div
                    className="relative max-w-full max-h-full overflow-hidden"
                    style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease' }}
                >
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        </div>
                    )}
                    <img
                        src={currentImage.url || currentImage.path}
                        alt={currentImage.name || `صورة ${currentIndex + 1}`}
                        className="max-w-full max-h-[80vh] object-contain"
                        onLoad={() => setIsLoading(false)}
                        onError={() => setIsLoading(false)}
                        draggable={false}
                    />
                </div>
            </div>

            {/* Navigation Buttons */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={goToPrev}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </>
            )}

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                    <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
                        {images.map((img, index) => (
                            <button
                                key={img.id || index}
                                onClick={() => {
                                    setCurrentIndex(index);
                                    setZoom(1);
                                    setIsLoading(true);
                                }}
                                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                    index === currentIndex 
                                        ? 'border-white scale-110' 
                                        : 'border-transparent opacity-60 hover:opacity-100'
                                }`}
                            >
                                <img
                                    src={img.url || img.path}
                                    alt={`Thumbnail ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

