import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';

/**
 * ⏱️ Job Timer Component
 * 
 * عداد لحساب وقت العمل الفعلي على المهمة.
 * - Start: يبدأ العد
 * - Pause: يوقف العد مؤقتاً
 * - Stop: ينهي العمل ويسجل الوقت الكلي
 */

export default function JobTimer({ initialTime = 0, isRunning = false, onStart, onPause, onStop }) {
    const [time, setTime] = useState(initialTime);
    const [active, setActive] = useState(isRunning);

    useEffect(() => {
        let interval = null;
        if (active) {
            interval = setInterval(() => {
                setTime((prevTime) => prevTime + 1);
            }, 1000);
        } else if (!active && time !== 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [active, time]);

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStart = () => {
        setActive(true);
        if (onStart) onStart();
    };

    const handlePause = () => {
        setActive(false);
        if (onPause) onPause();
    };

    const handleStop = () => {
        setActive(false);
        if (onStop) onStop(time);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${active ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
                    <Clock className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-medium">وقت العمل</p>
                    <p className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
                        {formatTime(time)}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {!active ? (
                    <button
                        onClick={handleStart}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        بدء
                    </button>
                ) : (
                    <button
                        onClick={handlePause}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors shadow-sm font-medium"
                    >
                        <Pause className="w-4 h-4 fill-current" />
                        إيقاف مؤقت
                    </button>
                )}

                {time > 0 && (
                    <button
                        onClick={handleStop}
                        className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        title="إنهاء العمل"
                    >
                        <Square className="w-5 h-5 fill-current" />
                    </button>
                )}
            </div>
        </div>
    );
}
