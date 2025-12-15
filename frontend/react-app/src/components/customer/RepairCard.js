import React from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleBadge from '../ui/SimpleBadge';
import { MiniProgressBar } from './RepairProgressBar';
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
 * - Dark Mode Support
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
            delivered: {
                label: 'تم التسليم',
                variant: 'success',
                icon: CheckCircle,
                color: '#059669'
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

    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onClick) {
            onClick(repair);
        } else {
            navigate(`/customer/repairs/${repair.id}`);
        }
    };

    return (
        <div
            onClick={handleClick}
            className="relative overflow-hidden rounded-xl shadow-md transition-all duration-300 cursor-pointer bg-card border border-border hover:-translate-y-1 hover:shadow-xl group"
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
                            <Wrench className="w-4 h-4 text-brand-blue" />
                            <p className="font-bold text-foreground">طلب #{repair.id}</p>
                        </div>
                        <p className="text-sm font-semibold text-muted-foreground">
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
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {repair.issueDescription}
                    </p>
                )}

                {/* Progress Bar */}
                <div className="mb-3">
                    <MiniProgressBar status={repair.status} />
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                    {(repair.estimatedCost || repair.actualCost) && (
                        <div className="text-sm font-bold text-brand-blue">
                            {(repair.actualCost || repair.estimatedCost || 0).toLocaleString('ar-EG')} جنيه
                        </div>
                    )}
                </div>
            </div>

            {/* Hover border effect */}
            <div 
                className="absolute inset-0 border-2 border-transparent rounded-xl transition-colors duration-300 pointer-events-none group-hover:border-current"
                style={{ borderColor: 'transparent' }}
            />
            <style>{`
                .group:hover > div:last-child {
                    border-color: ${statusConfig.color} !important;
                }
            `}</style>
        </div>
    );
}
