import React, { useState } from 'react';
import { X, Camera, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * 📷 Technician QR Scanner Modal
 * 
 * مودال لمحاكاة مسح الـ QR Code.
 * يسمح للفني بإدخال رقم المهمة يدوياً أو "مسح" الكود.
 */

export default function TechnicianQRScanner({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [manualCode, setManualCode] = useState('');
    const [isScanning, setIsScanning] = useState(true);

    if (!isOpen) return null;

    const handleScan = () => {
        // Simulate scanning delay
        setTimeout(() => {
            // Mock finding a job
            const mockJobId = '101';
            navigate(`/technician/jobs/${mockJobId}`);
            onClose();
        }, 1500);
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualCode.trim()) {
            navigate(`/technician/jobs/${manualCode}`);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Camera className="w-5 h-5 text-blue-600" />
                        مسح QR Code
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Scanner Area */}
                <div className="p-6">
                    {isScanning ? (
                        <div
                            onClick={handleScan}
                            className="relative aspect-square bg-gray-900 rounded-xl overflow-hidden cursor-pointer group mb-6"
                        >
                            {/* Camera View Simulation */}
                            <div className="absolute inset-0 opacity-50 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>

                            {/* Scanning Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-48 h-48 border-2 border-blue-500 rounded-lg relative">
                                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1"></div>
                                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1"></div>
                                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1"></div>
                                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1"></div>

                                    {/* Scanning Line Animation */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-[scan_2s_linear_infinite]"></div>
                                </div>
                            </div>

                            <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm font-medium bg-black bg-opacity-50 py-2">
                                وجه الكاميرا نحو الـ QR Code
                            </div>
                        </div>
                    ) : null}

                    {/* Manual Entry */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">أو أدخل الرقم يدوياً</span>
                        </div>
                    </div>

                    <form onSubmit={handleManualSubmit} className="mt-4 flex gap-2">
                        <input
                            type="text"
                            placeholder="رقم المهمة (مثلاً: 101)"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                        >
                            <Search className="w-4 h-4" />
                            بحث
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
}
