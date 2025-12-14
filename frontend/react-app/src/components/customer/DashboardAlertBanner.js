import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    AlertTriangle, 
    CreditCard, 
    Wrench, 
    CheckCircle,
    X,
    ChevronLeft
} from 'lucide-react';

/**
 * DashboardAlertBanner - Alert notifications for dashboard
 * 
 * Features:
 * - Pending invoices alert
 * - Repair status updates
 * - Ready for pickup notifications
 * - Dismissible alerts
 */

export default function DashboardAlertBanner({ stats, onDismiss }) {
    const navigate = useNavigate();

    // Determine which alert to show (priority order)
    const getAlert = () => {
        // Priority 1: Ready for pickup
        if (stats?.readyForPickup > 0) {
            return {
                type: 'success',
                icon: CheckCircle,
                title: 'جهازك جاهز للاستلام! 🎉',
                message: `لديك ${stats.readyForPickup} جهاز${stats.readyForPickup > 1 ? ' أجهزة' : ''} جاهز${stats.readyForPickup > 1 ? 'ة' : ''} للاستلام.`,
                action: 'عرض التفاصيل',
                onClick: () => navigate('/customer/repairs?status=ready'),
                gradient: 'from-green-500 to-emerald-600',
                bgLight: 'bg-green-50 dark:bg-green-900/20',
                textColor: 'text-green-800 dark:text-green-200'
            };
        }

        // Priority 2: Pending invoices
        if (stats?.pendingInvoices > 0) {
            return {
                type: 'warning',
                icon: CreditCard,
                title: 'فواتير في انتظار الدفع',
                message: `لديك ${stats.pendingInvoices} فاتورة${stats.pendingInvoices > 1 ? ' فواتير' : ''} بانتظار الدفع.`,
                action: 'دفع الآن',
                onClick: () => navigate('/customer/invoices?status=pending'),
                gradient: 'from-amber-500 to-orange-600',
                bgLight: 'bg-amber-50 dark:bg-amber-900/20',
                textColor: 'text-amber-800 dark:text-amber-200'
            };
        }

        // Priority 3: Active repairs
        if (stats?.activeRepairs > 0) {
            return {
                type: 'info',
                icon: Wrench,
                title: 'إصلاحات قيد التنفيذ',
                message: `لديك ${stats.activeRepairs} طلب${stats.activeRepairs > 1 ? ' طلبات' : ''} إصلاح قيد التنفيذ.`,
                action: 'تتبع الطلبات',
                onClick: () => navigate('/customer/repairs?status=in_progress'),
                gradient: 'from-blue-500 to-indigo-600',
                bgLight: 'bg-blue-50 dark:bg-blue-900/20',
                textColor: 'text-blue-800 dark:text-blue-200'
            };
        }

        return null;
    };

    const alert = getAlert();

    if (!alert) return null;

    const Icon = alert.icon;

    return (
        <div className={`relative mb-6 rounded-xl overflow-hidden ${alert.bgLight} border border-${alert.type === 'success' ? 'green' : alert.type === 'warning' ? 'amber' : 'blue'}-200 dark:border-${alert.type === 'success' ? 'green' : alert.type === 'warning' ? 'amber' : 'blue'}-800`}>
            {/* Gradient accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-l ${alert.gradient}`} />
            
            <div className="p-4 flex items-center gap-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${alert.gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className={`font-bold ${alert.textColor}`}>{alert.title}</h4>
                    <p className={`text-sm ${alert.textColor} opacity-80 mt-0.5`}>{alert.message}</p>
                </div>

                {/* Action Button */}
                <button
                    onClick={alert.onClick}
                    className={`flex-shrink-0 flex items-center gap-1 px-4 py-2 rounded-lg bg-gradient-to-l ${alert.gradient} text-white font-medium text-sm hover:shadow-lg transition-all`}
                >
                    {alert.action}
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Dismiss Button */}
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className={`flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${alert.textColor} opacity-60 hover:opacity-100`}
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}

