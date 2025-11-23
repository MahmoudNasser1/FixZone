import React from 'react';
import { CheckCircle, Circle, Clock, Wrench, Search, Package } from 'lucide-react';

/**
 * 📍 Repair Tracking Timeline
 * 
 * مكون يعرض مراحل الإصلاح بشكل مرئي جذاب.
 * المراحل:
 * 1. Received (تم الاستلام)
 * 2. Diagnosing (جاري الفحص)
 * 3. In Progress (قيد الإصلاح)
 * 4. Testing (مرحلة الاختبار)
 * 5. Ready (جاهز للاستلام)
 */

export default function RepairTrackingTimeline({ currentStatus }) {
    const steps = [
        { id: 'received', label: 'تم الاستلام', icon: Package },
        { id: 'diagnosing', label: 'جاري الفحص', icon: Search },
        { id: 'in_progress', label: 'قيد الإصلاح', icon: Wrench },
        { id: 'testing', label: 'مرحلة الاختبار', icon: Clock },
        { id: 'ready', label: 'جاهز للاستلام', icon: CheckCircle },
    ];

    // Helper to determine step status
    const getStepStatus = (stepId) => {
        const statusOrder = ['received', 'diagnosing', 'in_progress', 'testing', 'ready', 'completed'];
        const currentIndex = statusOrder.indexOf(currentStatus?.toLowerCase() || 'received');
        const stepIndex = statusOrder.indexOf(stepId);

        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'current';
        return 'upcoming';
    };

    return (
        <div className="w-full py-8">
            <div className="relative flex items-center justify-between w-full">
                {/* Connecting Line */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>

                {/* Colored Line (Progress) */}
                <div
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-green-500 -z-10 transition-all duration-1000 ease-out"
                    style={{
                        width: `${(steps.findIndex(s => getStepStatus(s.id) === 'current') / (steps.length - 1)) * 100}%`
                    }}
                ></div>

                {steps.map((step) => {
                    const status = getStepStatus(step.id);
                    const Icon = step.icon;

                    return (
                        <div key={step.id} className="flex flex-col items-center group">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${status === 'completed' ? 'bg-green-500 border-green-500 text-white' :
                                        status === 'current' ? 'bg-white border-blue-500 text-blue-500 scale-125 shadow-lg' :
                                            'bg-white border-gray-200 text-gray-300'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                            </div>
                            <span
                                className={`mt-3 text-xs font-bold transition-colors duration-300 ${status === 'current' ? 'text-blue-600 scale-110' :
                                        status === 'completed' ? 'text-green-600' : 'text-gray-400'
                                    }`}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
