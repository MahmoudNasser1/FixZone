import React from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleBadge from '../ui/SimpleBadge';
import {
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Calendar,
    DollarSign
} from 'lucide-react';

/**
 * 💰 Invoice Card Component
 * 
 * المميزات:
 * - عرض معلومات الفاتورة
 * - Payment status badge
 * - Hover effects
 * - Dark Mode Support
 */

export default function InvoiceCard({ invoice, onClick }) {
    const navigate = useNavigate();

    const getStatusConfig = (paymentStatus) => {
        const statusMap = {
            pending: {
                label: 'في الانتظار',
                variant: 'warning',
                icon: Clock,
                color: '#F59E0B'
            },
            partial: {
                label: 'مدفوع جزئياً',
                variant: 'warning',
                icon: Clock,
                color: '#F97316'
            },
            paid: {
                label: 'مدفوع',
                variant: 'success',
                icon: CheckCircle,
                color: '#10B981'
            },
            overdue: {
                label: 'متأخر',
                variant: 'destructive',
                icon: AlertCircle,
                color: '#EF4444'
            },
            cancelled: {
                label: 'ملغي',
                variant: 'default',
                icon: XCircle,
                color: '#6B7280'
            }
        };

        return statusMap[paymentStatus] || {
            label: paymentStatus || 'غير محدد',
            variant: 'default',
            icon: AlertCircle,
            color: '#6B7280'
        };
    };

    const statusConfig = getStatusConfig(invoice.paymentStatus);
    const StatusIcon = statusConfig.icon;

    const handleClick = () => {
        if (onClick) {
            onClick(invoice);
        } else {
            navigate(`/invoices/${invoice.id}`);
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
                            <FileText className="w-4 h-4 text-brand-green" />
                            <p className="font-bold text-foreground">فاتورة #{invoice.id}</p>
                        </div>
                        {invoice.invoiceNumber && (
                            <p className="text-xs text-muted-foreground">{invoice.invoiceNumber}</p>
                        )}
                    </div>
                    <SimpleBadge variant={statusConfig.variant} className="flex items-center gap-1">
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                    </SimpleBadge>
                </div>

                {/* Amount */}
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">المبلغ الإجمالي:</span>
                        <span className="text-lg font-bold text-brand-green">
                            {(invoice.totalAmount || 0).toLocaleString('ar-EG')} جنيه
                        </span>
                    </div>
                    {invoice.remainingAmount > 0 && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">المتبقي:</span>
                            <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                {invoice.remainingAmount.toLocaleString('ar-EG')} جنيه
                            </span>
                        </div>
                    )}
                    {invoice.paidAmount > 0 && invoice.paidAmount < (invoice.totalAmount || 0) && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">المدفوع:</span>
                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                {invoice.paidAmount.toLocaleString('ar-EG')} جنيه
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                            {new Date(invoice.createdAt || Date.now()).toLocaleDateString('ar-EG', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            })}
                        </span>
                    </div>

                    {invoice.dueDate && invoice.paymentStatus === 'pending' && (
                        <div className="text-xs text-orange-600 dark:text-orange-400">
                            ميعاد السداد: {new Date(invoice.dueDate).toLocaleDateString('ar-EG', {
                                day: 'numeric',
                                month: 'short'
                            })}
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
