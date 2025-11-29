import React from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleBadge from '../ui/SimpleBadge';
import {
    Wrench,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Calendar,
    User,
    ShoppingCart,
    Package
} from 'lucide-react';

/**
 * 🎨 Repair Card Component
 * 
 * المميزات:
 * - عرض معلومات الإصلاح
 * - Status badge ملون
 * - Hover effects
 * - Navigation للتفاصيل
 */

export default function RepairCard({ repair, onClick }) {
    const navigate = useNavigate();

    const getStatusConfig = (status) => {
        const statusMap = {
            pending: {
                label: 'قيد الانتظار',
                variant: 'warning',
                icon: Clock,
                color: '#F59E0B'
            },
            in_progress: {
                label: 'قيد التنفيذ',
                variant: 'info',
                icon: Wrench,
                color: '#3B82F6'
            },
            'waiting-parts': {
                label: 'بانتظار قطع غيار',
                variant: 'warning',
                icon: ShoppingCart,
                color: '#F97316'
            },
            'ready-for-pickup': {
                label: 'جاهز للاستلام',
                variant: 'success',
                icon: Package,
                color: '#10B981'
            },
            completed: {
                label: 'مكتمل',
                variant: 'success',
                icon: CheckCircle,
                color: '#10B981'
            },
            cancelled: {
                label: 'ملغي',
                variant: 'destructive',
                icon: XCircle,
                color: '#EF4444'
            }
        };

        return statusMap[status] || {
            label: status,
            variant: 'default',
            icon: AlertCircle,
            color: '#6B7280'
        };
    };

    const statusConfig = getStatusConfig(repair.status);
    const StatusIcon = statusConfig.icon;

    const handleClick = () => {
        if (onClick) {
            onClick(repair);
        } else {
            navigate(`/repairs/${repair.id}`);
        }
    };

    return (
        <div
            onClick={handleClick}
            className="relative overflow-hidden rounded-xl shadow-md transition-all duration-300 cursor-pointer bg-white"
            style={{
                border: '1px solid #E5E7EB'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                e.currentTarget.style.borderColor = statusConfig.color;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.borderColor = '#E5E7EB';
            }}
        >
            {/* Top colored stripe */}
            <div
                className="h-2"
                style={{ background: statusConfig.color }}
            />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <Wrench className="w-4 h-4" style={{ color: '#053887' }} />
                            <p className="font-bold text-gray-900">طلب #{repair.id}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">
                            {repair.deviceType || 'جهاز'}
                            {repair.brand && ` - ${repair.brand}`}
                        </p>
                    </div>
                    <SimpleBadge variant={statusConfig.variant} className="flex items-center gap-1">
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                    </SimpleBadge>
                </div>

                {/* Description */}
                {repair.issueDescription && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {repair.issueDescription}
                    </p>
                )}

                {/* Footer Info */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        {/* Date */}
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                                {new Date(repair.createdAt || Date.now()).toLocaleDateString('ar-EG', {
                                    day: 'numeric',
                                    month: 'short'
                                })}
                            </span>
                        </div>

                        {/* Technician */}
                        {repair.assignedTechnician && (
                            <div className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />
                                <span>{repair.assignedTechnician}</span>
                            </div>
                        )}
                    </div>

                    {/* Cost */}
                    {repair.estimatedCost && (
                        <div className="text-sm font-bold" style={{ color: '#053887' }}>
                            {repair.actualCost || repair.estimatedCost} جنيه
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
