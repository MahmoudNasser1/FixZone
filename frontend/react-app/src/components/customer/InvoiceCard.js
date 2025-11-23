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
            label: paymentStatus,
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
                            <FileText className="w-4 h-4" style={{ color: '#10B981' }} />
                            <p className="font-bold text-gray-900">فاتورة #{invoice.id}</p>
                        </div>
                        {invoice.invoiceNumber && (
                            <p className="text-xs text-gray-500">{invoice.invoiceNumber}</p>
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
                        <span className="text-sm text-gray-600">المبلغ الإجمالي:</span>
                        <span className="text-lg font-bold" style={{ color: '#10B981' }}>
                            {invoice.totalAmount || 0} جنيه
                        </span>
                    </div>
                    {invoice.remainingAmount > 0 && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">المتبقي:</span>
                            <span className="text-sm font-semibold text-orange-600">
                                {invoice.remainingAmount} جنيه
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
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
                        <div className="text-xs text-orange-600">
                            ميعاد السداد: {new Date(invoice.dueDate).toLocaleDateString('ar-EG', {
                                day: 'numeric',
                                month: 'short'
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
