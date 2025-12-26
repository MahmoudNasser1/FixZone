import React from 'react';
import {
    Calendar,
    User,
    Wrench,
    DollarSign,
    Eye,
    Edit,
    Printer,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Smartphone,
    Laptop,
    Tablet,
    Monitor,
    Speaker,
    Watch,
    Gamepad2
} from 'lucide-react';
import SimpleButton from '../ui/SimpleButton';
import SimpleBadge from '../ui/SimpleBadge';
import { useSettings } from '../../context/SettingsContext';

const RepairCard = ({
    repair,
    onEdit,
    onView,
    onPrint,
    isSelected,
    onSelect
}) => {
    const { formatMoney } = useSettings();

    // Helper function to get status configuration
    const getStatusConfig = (status) => {
        switch (status) {
            case 'pending':
                return { color: 'border-yellow-500', bg: 'bg-yellow-50/50', text: 'text-yellow-700', label: 'في الانتظار', icon: Clock };
            case 'in-progress':
                return { color: 'border-blue-500', bg: 'bg-blue-50/50', text: 'text-blue-700', label: 'قيد التنفيذ', icon: Wrench };
            case 'waiting-parts':
                return { color: 'border-orange-500', bg: 'bg-orange-50/50', text: 'text-orange-700', label: 'انتظار قطع', icon: AlertTriangle };
            case 'ready-for-pickup':
                return { color: 'border-green-500', bg: 'bg-green-50/50', text: 'text-green-700', label: 'جاهز للاستلام', icon: CheckCircle };
            case 'completed':
                return { color: 'border-green-600', bg: 'bg-green-50/50', text: 'text-green-800', label: 'مكتمل', icon: CheckCircle };
            case 'delivered':
                return { color: 'border-purple-500', bg: 'bg-purple-50/50', text: 'text-purple-700', label: 'تم التسليم', icon: CheckCircle };
            case 'cancelled':
                return { color: 'border-red-500', bg: 'bg-red-50/50', text: 'text-red-700', label: 'ملغي', icon: XCircle };
            default:
                return { color: 'border-gray-500', bg: 'bg-gray-50/50', text: 'text-gray-700', label: status, icon: Clock };
        }
    };

    // Helper function to get device icon
    const getDeviceIcon = (type) => {
        const typeLower = (type || '').toLowerCase();
        if (typeLower.includes('phone') || typeLower.includes('موبايل') || typeLower.includes('هاتف')) return <Smartphone className="w-5 h-5" />;
        if (typeLower.includes('laptop') || typeLower.includes('لابتوب')) return <Laptop className="w-5 h-5" />;
        if (typeLower.includes('tablet') || typeLower.includes('تابلت')) return <Tablet className="w-5 h-5" />;
        if (typeLower.includes('pc') || typeLower.includes('كمبيوتر')) return <Monitor className="w-5 h-5" />;
        if (typeLower.includes('console') || typeLower.includes('بلايستيشن')) return <Gamepad2 className="w-5 h-5" />;
        if (typeLower.includes('watch') || typeLower.includes('ساعة')) return <Watch className="w-5 h-5" />;
        return <Wrench className="w-5 h-5" />;
    };

    const statusConfig = getStatusConfig(repair.status);
    const StatusIcon = statusConfig.icon;

    return (
        <div
            className={`
        relative group bg-card border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg
        ${isSelected ? 'border-primary ring-1 ring-primary' : 'border-border'}
        ${statusConfig.color.replace('border-', 'border-l-4 ')} 
      `}
        >
            {/* Header Section */}
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/10">
                <div className="flex items-center gap-3">
                    {onSelect && (
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                                e.stopPropagation();
                                onSelect(repair.id, e.target.checked);
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        />
                    )}
                    <span className="font-mono text-sm font-medium text-muted-foreground">
                        #{repair.requestNumber || repair.id}
                    </span>
                </div>
                <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.text}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusConfig.label}
                </div>
            </div>

            {/* Body Section */}
            <div className="p-4 grid grid-cols-1 gap-4">
                {/* Customer & Device Info */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-full bg-primary/10 text-primary shrink-0">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground text-base leading-tight">
                                {repair.customerName || 'عميل غير معروف'}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                <span dir="ltr">{repair.customerPhone}</span>
                            </p>
                        </div>
                    </div>

                    <div className="text-left shrink-0">
                        <div className="flex items-center justify-end gap-2 text-foreground font-medium">
                            <span>{repair.deviceModel}</span>
                            <span className="text-muted-foreground ml-1">{getDeviceIcon(repair.deviceType)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-left">
                            {repair.deviceBrand}
                        </p>
                    </div>
                </div>

                {/* Problem Description (Truncated) */}
                {repair.problemDescription && (
                    <div className="text-sm text-muted-foreground bg-muted/20 p-2.5 rounded-lg border border-border/50 line-clamp-2">
                        <span className="font-medium text-foreground text-xs ml-1">المشكلة:</span>
                        {repair.problemDescription}
                    </div>
                )}
            </div>

            {/* Footer Section */}
            <div className="px-4 py-3 bg-muted/5 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                    <div className="flex items-center gap-1.5" title="تاريخ التحديث">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(repair.updatedAt || repair.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                    {repair.estimatedCost > 0 && (
                        <div className="flex items-center gap-1.5 text-foreground font-bold">
                            <DollarSign className="w-3.5 h-3.5 text-green-600" />
                            <span>{formatMoney(repair.estimatedCost)}</span>
                        </div>
                    )}
                </div>

                {/* Actions (Visible on hover on desktop, always visible on mobile) */}
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                    <SimpleButton
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                        onClick={(e) => { e.stopPropagation(); onEdit(repair.id); }}
                        title="تعديل"
                    >
                        <Edit className="w-4 h-4" />
                    </SimpleButton>
                    <SimpleButton
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                        onClick={(e) => { e.stopPropagation(); onView(repair.id); }}
                        title="عرض التفاصيل"
                    >
                        <Eye className="w-4 h-4" />
                    </SimpleButton>
                    <SimpleButton
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-50"
                        onClick={(e) => { e.stopPropagation(); onPrint(repair.id); }}
                        title="طباعة الفاتورة"
                    >
                        <Printer className="w-4 h-4" />
                    </SimpleButton>
                </div>
            </div>
        </div>
    );
};

export default RepairCard;
