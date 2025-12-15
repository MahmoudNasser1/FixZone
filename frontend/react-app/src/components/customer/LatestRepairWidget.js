import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Wrench,
    Clock,
    CheckCircle,
    Package,
    Truck,
    ArrowLeft,
    ShoppingCart,
    AlertCircle
} from 'lucide-react';

/**
 * LatestRepairWidget - Shows the most recent repair with mini timeline
 * 
 * Features:
 * - Mini status timeline
 * - Quick action to view details
 * - Status-based styling
 * - Device info summary
 */

const statusSteps = [
    { id: 'pending', label: 'استلام', icon: Clock },
    { id: 'in_progress', label: 'إصلاح', icon: Wrench },
    { id: 'waiting-parts', label: 'قطع غيار', icon: ShoppingCart },
    { id: 'ready-for-pickup', label: 'جاهز', icon: Package },
    { id: 'delivered', label: 'تسليم', icon: Truck }
];

const getStatusIndex = (status) => {
    const normalizedStatus = status?.toLowerCase().replace('_', '-');
    const index = statusSteps.findIndex(s => s.id === normalizedStatus);
    if (index >= 0) return index;
    
    // Handle variations
    if (normalizedStatus === 'completed') return 3;
    if (normalizedStatus === 'cancelled') return -1;
    return 0;
};

const getStatusColor = (status) => {
    const colors = {
        pending: '#F59E0B',
        in_progress: '#3B82F6',
        'waiting-parts': '#F97316',
        'ready-for-pickup': '#10B981',
        completed: '#10B981',
        delivered: '#059669',
        cancelled: '#EF4444'
    };
    return colors[status] || '#6B7280';
};

export default function LatestRepairWidget({ repair, onViewDetails }) {
    const navigate = useNavigate();

    if (!repair) {
        return (
            <div className="bg-card rounded-xl border border-border p-6">
                <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                        <Wrench className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">لا توجد طلبات حالية</h3>
                    <p className="text-sm text-muted-foreground">
                        عندما تضيف طلب إصلاح، سيظهر هنا
                    </p>
                </div>
            </div>
        );
    }

    const currentStatusIndex = getStatusIndex(repair.status);
    const statusColor = getStatusColor(repair.status);
    const isCancelled = repair.status === 'cancelled';

    const handleClick = () => {
        if (onViewDetails) {
            onViewDetails(repair);
        } else {
            navigate(`/customer/repairs/${repair.id}`);
        }
    };

    return (
        <div 
            className="bg-card rounded-xl border border-border overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:border-brand-blue group"
            onClick={handleClick}
        >
            {/* Header */}
            <div 
                className="p-4 text-white"
                style={{ background: `linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%)` }}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white/80 text-sm">آخر طلب إصلاح</p>
                        <p className="font-bold text-lg">#{repair.id}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <Wrench className="w-6 h-6 text-white" />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Device Info */}
                <div className="mb-4">
                    <h4 className="font-semibold text-foreground mb-1">
                        {repair.deviceType || 'جهاز'}
                        {repair.brand && ` - ${repair.brand}`}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                        {repair.issueDescription || 'لا يوجد وصف'}
                    </p>
                </div>

                {/* Mini Timeline */}
                {!isCancelled ? (
                    <div className="mb-4">
                        <div className="flex items-center justify-between relative">
                            {/* Progress Line */}
                            <div className="absolute top-3 left-0 right-0 h-0.5 bg-muted" />
                            <div 
                                className="absolute top-3 right-0 h-0.5 transition-all duration-500"
                                style={{ 
                                    width: `${((currentStatusIndex + 1) / statusSteps.length) * 100}%`,
                                    backgroundColor: statusColor
                                }}
                            />

                            {/* Steps */}
                            {statusSteps.map((step, index) => {
                                const StepIcon = step.icon;
                                const isActive = index <= currentStatusIndex;
                                const isCurrent = index === currentStatusIndex;

                                return (
                                    <div 
                                        key={step.id} 
                                        className="relative z-10 flex flex-col items-center"
                                    >
                                        <div 
                                            className={`
                                                w-6 h-6 rounded-full flex items-center justify-center
                                                transition-all duration-300
                                                ${isCurrent 
                                                    ? 'ring-4 ring-opacity-30' 
                                                    : ''
                                                }
                                            `}
                                            style={{
                                                backgroundColor: isActive ? statusColor : 'var(--muted)',
                                                ringColor: isCurrent ? statusColor : 'transparent'
                                            }}
                                        >
                                            {isActive ? (
                                                <StepIcon className="w-3 h-3 text-white" />
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                                            )}
                                        </div>
                                        <span className={`
                                            text-[9px] mt-1 whitespace-nowrap
                                            ${isCurrent 
                                                ? 'text-foreground font-bold' 
                                                : 'text-muted-foreground'
                                            }
                                        `}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm font-medium text-red-700 dark:text-red-300">
                            تم إلغاء هذا الطلب
                        </span>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>
                            {repair.createdAt 
                                ? new Date(repair.createdAt).toLocaleDateString('ar-EG', {
                                    day: 'numeric',
                                    month: 'short'
                                })
                                : 'غير محدد'
                            }
                        </span>
                    </div>

                    <div className="flex items-center gap-1 text-sm font-medium text-brand-blue group-hover:gap-2 transition-all">
                        <span>عرض التفاصيل</span>
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * CompactRepairStatus - Even more compact version for lists
 */
export function CompactRepairStatus({ status }) {
    const statusColor = getStatusColor(status);
    const currentIndex = getStatusIndex(status);
    const isCancelled = status === 'cancelled';

    if (isCancelled) {
        return (
            <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-500" />
                <span className="text-xs text-red-500">ملغي</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1">
            {statusSteps.map((step, index) => (
                <div
                    key={step.id}
                    className="w-2 h-2 rounded-full transition-colors"
                    style={{
                        backgroundColor: index <= currentIndex ? statusColor : 'var(--muted)'
                    }}
                />
            ))}
        </div>
    );
}

