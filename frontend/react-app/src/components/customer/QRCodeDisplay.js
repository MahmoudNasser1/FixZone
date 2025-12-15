import React, { useState, useEffect, useRef } from 'react';
import { Download, Copy, Share2, CheckCircle, QrCode } from 'lucide-react';

/**
 * QRCodeDisplay - Generates and displays QR codes for repair tracking
 * 
 * Features:
 * - Generates QR code from repair ID
 * - Download as image
 * - Copy link functionality
 * - Share functionality (Web Share API)
 * - Simple SVG-based QR generation (no external deps)
 */

// Simple QR Code Matrix Generator (simplified for demo)
// In production, use a library like 'qrcode' or 'qrcode.react'
function generateQRMatrix(data) {
    // This is a simplified placeholder - creates a pattern based on data
    const size = 21; // Standard QR size
    const matrix = [];
    const dataHash = data.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    for (let row = 0; row < size; row++) {
        matrix[row] = [];
        for (let col = 0; col < size; col++) {
            // Finder patterns (corner squares)
            if ((row < 7 && col < 7) || 
                (row < 7 && col >= size - 7) || 
                (row >= size - 7 && col < 7)) {
                const inOuter = row < 7 && col < 7 ? 
                    (row === 0 || row === 6 || col === 0 || col === 6) :
                    row < 7 && col >= size - 7 ?
                    (row === 0 || row === 6 || col === size - 1 || col === size - 7) :
                    (row === size - 1 || row === size - 7 || col === 0 || col === 6);
                
                const inMiddle = row < 7 && col < 7 ?
                    (row >= 2 && row <= 4 && col >= 2 && col <= 4) :
                    row < 7 && col >= size - 7 ?
                    (row >= 2 && row <= 4 && col >= size - 5 && col <= size - 3) :
                    (row >= size - 5 && row <= size - 3 && col >= 2 && col <= 4);
                
                matrix[row][col] = inOuter || inMiddle ? 1 : 0;
            } else {
                // Data pattern based on hash
                matrix[row][col] = ((row * col + dataHash) % 3 === 0) ? 1 : 0;
            }
        }
    }
    return matrix;
}

function QRCodeSVG({ data, size = 200, fgColor = '#000', bgColor = '#fff' }) {
    const matrix = generateQRMatrix(data);
    const cellSize = size / matrix.length;
    
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <rect width={size} height={size} fill={bgColor} />
            {matrix.map((row, rowIndex) =>
                row.map((cell, colIndex) =>
                    cell === 1 ? (
                        <rect
                            key={`${rowIndex}-${colIndex}`}
                            x={colIndex * cellSize}
                            y={rowIndex * cellSize}
                            width={cellSize}
                            height={cellSize}
                            fill={fgColor}
                        />
                    ) : null
                )
            )}
        </svg>
    );
}

export default function QRCodeDisplay({ 
    repairId, 
    trackingUrl,
    size = 180,
    showActions = true,
    onClose 
}) {
    const [copied, setCopied] = useState(false);
    const [shared, setShared] = useState(false);
    const qrRef = useRef(null);

    // Generate tracking URL
    const url = trackingUrl || `${window.location.origin}/track/${repairId}`;

    // Handle copy link
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Handle share
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `تتبع طلب الإصلاح #${repairId}`,
                    text: `تابع حالة طلب الإصلاح رقم ${repairId} من Fix Zone`,
                    url: url
                });
                setShared(true);
                setTimeout(() => setShared(false), 2000);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        } else {
            handleCopy();
        }
    };

    // Handle download
    const handleDownload = () => {
        if (!qrRef.current) return;

        const svg = qrRef.current.querySelector('svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = size * 2;
            canvas.height = size * 2;
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `repair-${repairId}-qr.png`;
            downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    return (
        <div className="bg-card rounded-xl border border-border p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-brand-blue" />
                    <h3 className="font-bold text-foreground">رمز التتبع</h3>
                </div>
                <span className="text-xs text-muted-foreground">طلب #{repairId}</span>
            </div>

            {/* QR Code */}
            <div 
                ref={qrRef}
                className="flex justify-center p-4 bg-white rounded-xl mb-4"
            >
                <QRCodeSVG 
                    data={url} 
                    size={size}
                    fgColor="#053887"
                />
            </div>

            {/* URL Display */}
            <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">رابط التتبع:</p>
                <p className="text-sm text-foreground font-mono break-all">{url}</p>
            </div>

            {/* Actions */}
            {showActions && (
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopy}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                    >
                        {copied ? (
                            <>
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-green-600">تم النسخ</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" />
                                <span>نسخ</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleShare}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-brand-blue text-white hover:bg-brand-blue-light transition-colors"
                    >
                        {shared ? (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                <span>تمت المشاركة</span>
                            </>
                        ) : (
                            <>
                                <Share2 className="w-4 h-4" />
                                <span>مشاركة</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleDownload}
                        className="p-2.5 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="تحميل"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Help Text */}
            <p className="mt-4 text-xs text-center text-muted-foreground">
                امسح الرمز أو شارك الرابط لتتبع حالة الطلب
            </p>
        </div>
    );
}

/**
 * Compact QR display for inline use
 */
export function MiniQRCode({ repairId, size = 60 }) {
    const url = `${window.location.origin}/track/${repairId}`;
    
    return (
        <div className="bg-white p-1 rounded-lg inline-block">
            <QRCodeSVG data={url} size={size} fgColor="#053887" />
        </div>
    );
}

