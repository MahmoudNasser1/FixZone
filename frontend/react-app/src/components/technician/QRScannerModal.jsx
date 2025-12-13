import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Camera,
  QrCode,
  CheckCircle,
  AlertCircle,
  Loader,
  FlipHorizontal,
  Flashlight,
  Upload,
  Smartphone
} from 'lucide-react';
import { useNotifications } from '../notifications/NotificationSystem';

/**
 * 📱 QR Scanner Modal
 * 
 * مسح QR Code للأجهزة أو طلبات الإصلاح
 * المميزات:
 * - كاميرا مباشرة
 * - رفع صورة QR
 * - التعرف التلقائي على الكود
 */

export default function QRScannerModal({ isOpen, onClose, onScan }) {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [scanning, setScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraPermission, setCameraPermission] = useState('pending'); // pending, granted, denied
  const [scanResult, setScanResult] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // environment or user
  const [isProcessing, setIsProcessing] = useState(false);

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setScanResult(null);
    }

    return () => stopCamera();
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    try {
      setScanning(true);
      setCameraPermission('pending');

      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        setCameraPermission('denied');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraPermission('granted');
        
        // Start scanning loop
        requestAnimationFrame(scanFrame);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCamera(false);
      setCameraPermission('denied');

      if (error.name === 'NotAllowedError') {
        notifications.error('خطأ', { message: 'يرجى السماح بالوصول للكاميرا' });
      } else if (error.name === 'NotFoundError') {
        notifications.error('خطأ', { message: 'لم يتم العثور على كاميرا' });
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const scanFrame = () => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data for QR code scanning
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Try to decode QR code
      // Note: In a real implementation, you would use a library like jsQR
      // For this example, we'll simulate QR detection
      tryDecodeQR(imageData);
    }

    if (scanning && !scanResult) {
      requestAnimationFrame(scanFrame);
    }
  };

  const tryDecodeQR = (imageData) => {
    // This is a placeholder for QR code decoding
    // In production, use a library like jsQR:
    // import jsQR from 'jsqr';
    // const code = jsQR(imageData.data, imageData.width, imageData.height);
    // if (code) handleScanResult(code.data);

    // For demo purposes, we won't actually decode
    // The user can enter a code manually or upload an image
  };

  const handleScanResult = (data) => {
    setScanning(false);
    setScanResult(data);
    
    // Parse the QR code data
    // Expected formats:
    // - FZ-REPAIR-{id} for repair requests
    // - FZ-DEVICE-{id} for devices
    
    if (data.startsWith('FZ-REPAIR-')) {
      const repairId = data.replace('FZ-REPAIR-', '');
      notifications.success('تم', { message: `تم العثور على طلب إصلاح #${repairId}` });
      
      if (onScan) {
        onScan({ type: 'repair', id: repairId });
      } else {
        navigate(`/technician/jobs/${repairId}`);
        onClose();
      }
    } else if (data.startsWith('FZ-DEVICE-')) {
      const deviceId = data.replace('FZ-DEVICE-', '');
      notifications.success('تم', { message: `تم العثور على جهاز #${deviceId}` });
      
      if (onScan) {
        onScan({ type: 'device', id: deviceId });
      }
    } else {
      // Unknown format - try to parse as repair ID
      const numericId = data.replace(/\D/g, '');
      if (numericId) {
        notifications.info('بحث', { message: `جاري البحث عن #${numericId}` });
        navigate(`/technician/jobs/${numericId}`);
        onClose();
      } else {
        notifications.error('خطأ', { message: 'صيغة QR غير معروفة' });
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      // Create image from file
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Draw to canvas and try to decode
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // In production, decode the QR from the image data
      // For demo, we'll show a message
      notifications.info('معالجة', { message: 'جاري تحليل الصورة...' });
      
      // Simulate processing
      setTimeout(() => {
        setIsProcessing(false);
        notifications.error('خطأ', { message: 'لم يتم العثور على QR Code في الصورة' });
      }, 1500);

    } catch (error) {
      console.error('Error processing image:', error);
      notifications.error('خطأ', { message: 'فشل معالجة الصورة' });
      setIsProcessing(false);
    }
  };

  const handleManualEntry = () => {
    const code = prompt('أدخل رقم طلب الإصلاح:');
    if (code) {
      const numericId = code.replace(/\D/g, '');
      if (numericId) {
        navigate(`/technician/jobs/${numericId}`);
        onClose();
      } else {
        notifications.error('خطأ', { message: 'يرجى إدخال رقم صحيح' });
      }
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-[101] animate-in zoom-in-95 slide-in-from-bottom duration-300">
        <div className="h-full sm:h-auto bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/20 rounded-xl">
                <QrCode className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">مسح QR Code</h2>
                <p className="text-xs text-slate-400">وجّه الكاميرا نحو الكود</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Camera View */}
          <div className="relative flex-1 min-h-[300px] bg-black">
            {cameraPermission === 'granted' && (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Scan Frame Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-64 h-64">
                    {/* Corners */}
                    <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-teal-400 rounded-tl-2xl" />
                    <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-teal-400 rounded-tr-2xl" />
                    <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-teal-400 rounded-bl-2xl" />
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-teal-400 rounded-br-2xl" />
                    
                    {/* Scanning Line Animation */}
                    <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-scan" />
                  </div>
                </div>

                {/* Camera Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                  <button
                    onClick={toggleCamera}
                    className="p-3 bg-slate-900/80 backdrop-blur-sm rounded-full hover:bg-slate-800 transition-colors"
                  >
                    <FlipHorizontal className="w-5 h-5 text-white" />
                  </button>
                </div>
              </>
            )}

            {cameraPermission === 'pending' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Loader className="w-10 h-10 text-teal-400 mx-auto mb-3 animate-spin" />
                  <p className="text-white">جاري تشغيل الكاميرا...</p>
                </div>
              </div>
            )}

            {cameraPermission === 'denied' && (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">لا يمكن الوصول للكاميرا</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    يرجى السماح بالوصول للكاميرا من إعدادات المتصفح
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors font-medium"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              </div>
            )}

            {/* Hidden canvas for processing */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Actions */}
          <div className="p-4 space-y-3 bg-slate-900 border-t border-slate-800">
            {/* Alternative Options */}
            <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
                <span>رفع صورة</span>
              </button>
              <button
                onClick={handleManualEntry}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"
              >
                <Smartphone className="w-5 h-5" />
                <span>إدخال يدوي</span>
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Tip */}
            <p className="text-xs text-slate-500 text-center">
              وجّه الكاميرا نحو QR Code الموجود على الجهاز أو إيصال الاستلام
            </p>
          </div>
        </div>
      </div>

      {/* CSS for scanning animation */}
      <style jsx global>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: calc(100% - 2px); }
          100% { top: 0; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}


