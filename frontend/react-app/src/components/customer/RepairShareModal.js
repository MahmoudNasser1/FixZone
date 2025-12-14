import React, { useState } from 'react';
import { 
    X, Copy, Check, Share2, 
    MessageCircle, Mail, Link,
    QrCode, Smartphone
} from 'lucide-react';

/**
 * RepairShareModal - Share repair tracking link
 * 
 * Features:
 * - Copy link to clipboard
 * - Share via WhatsApp
 * - Share via Email
 * - QR Code generation
 */

export default function RepairShareModal({ isOpen, onClose, repairId, repairInfo }) {
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);

    if (!isOpen) return null;

    const trackingUrl = `${window.location.origin}/track?id=${repairId}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(trackingUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleShareWhatsApp = () => {
        const message = encodeURIComponent(
            `تتبع حالة طلب الإصلاح #${repairId}\n${repairInfo?.device || 'جهاز'}\n\nرابط التتبع:\n${trackingUrl}`
        );
        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

    const handleShareEmail = () => {
        const subject = encodeURIComponent(`تتبع طلب الإصلاح #${repairId} - Fix Zone`);
        const body = encodeURIComponent(
            `مرحباً،\n\nيمكنك تتبع حالة طلب الإصلاح من خلال الرابط التالي:\n${trackingUrl}\n\nمعلومات الطلب:\n- رقم الطلب: #${repairId}\n- الجهاز: ${repairInfo?.device || 'جهاز'}\n\nفريق Fix Zone`
        );
        window.open(`mailto:?subject=${subject}&body=${body}`);
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `تتبع طلب الإصلاح #${repairId}`,
                    text: `تتبع حالة طلب الإصلاح - ${repairInfo?.device || 'جهاز'}`,
                    url: trackingUrl
                });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Share failed:', error);
                }
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-brand-blue" />
                        <h3 className="font-bold text-foreground">مشاركة رابط التتبع</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Repair Info */}
                    <div className="p-3 rounded-xl bg-muted/50">
                        <p className="text-sm text-muted-foreground">طلب الإصلاح</p>
                        <p className="font-bold text-foreground">#{repairId} - {repairInfo?.device || 'جهاز'}</p>
                    </div>

                    {/* Copy Link */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">رابط التتبع</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={trackingUrl}
                                readOnly
                                className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono text-muted-foreground"
                            />
                            <button
                                onClick={handleCopyLink}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    copied 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-brand-blue text-white hover:bg-brand-blue-light'
                                }`}
                            >
                                {copied ? (
                                    <Check className="w-5 h-5" />
                                ) : (
                                    <Copy className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        {copied && (
                            <p className="text-sm text-green-600 dark:text-green-400">
                                تم نسخ الرابط!
                            </p>
                        )}
                    </div>

                    {/* Share Options */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">مشاركة عبر</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleShareWhatsApp}
                                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 transition-colors"
                            >
                                <MessageCircle className="w-5 h-5" />
                                واتساب
                            </button>

                            <button
                                onClick={handleShareEmail}
                                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
                            >
                                <Mail className="w-5 h-5" />
                                البريد
                            </button>

                            {navigator.share && (
                                <button
                                    onClick={handleNativeShare}
                                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors col-span-2"
                                >
                                    <Smartphone className="w-5 h-5" />
                                    مشاركة أخرى
                                </button>
                            )}
                        </div>
                    </div>

                    {/* QR Code Toggle */}
                    <button
                        onClick={() => setShowQR(!showQR)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors"
                    >
                        <QrCode className="w-5 h-5" />
                        {showQR ? 'إخفاء رمز QR' : 'عرض رمز QR'}
                    </button>

                    {/* QR Code */}
                    {showQR && (
                        <div className="flex flex-col items-center p-4 bg-white rounded-xl">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(trackingUrl)}`}
                                alt="QR Code"
                                className="w-48 h-48"
                            />
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                امسح الرمز للوصول لصفحة التتبع
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-muted/30">
                    <p className="text-xs text-center text-muted-foreground">
                        يمكن لأي شخص يملك هذا الرابط تتبع حالة الطلب
                    </p>
                </div>
            </div>
        </div>
    );
}

