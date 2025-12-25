import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    FileText,
    Printer,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Package,
    CreditCard,
    Building2,
    Calendar,
    User,
    Shield,
    Sun,
    Moon,
    ArrowLeft,
    Wrench,
    Smartphone,
    Laptop,
    Monitor,
    Tablet
} from 'lucide-react';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import { useTheme } from '../../components/ThemeProvider';
import { useSettings } from '../../context/SettingsContext';
import { Loading } from '../../components/ui/Loading';
import { getDefaultApiBaseUrl } from '../../lib/apiConfig';

const API_BASE_URL = getDefaultApiBaseUrl();

const PublicInvoicePage = () => {
    const { token } = useParams();
    const { theme, setTheme } = useTheme();
    const { formatMoney: settingsFormatMoney } = useSettings();

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (token) {
            fetchPublicInvoice();
        }
    }, [token]);

    const fetchPublicInvoice = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_BASE_URL}/invoices/public/view/${token}`);

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setInvoice(result.data);
                } else {
                    setError(result.message || 'فشل في تحميل بيانات الفاتورة');
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 404) {
                    setError('الفاتورة غير موجودة أو الرابط غير صالح');
                } else {
                    setError(errorData.message || 'حدث خطأ أثناء تحميل الفاتورة');
                }
            }
        } catch (err) {
            console.error('Error fetching public invoice:', err);
            setError('حدث خطأ في الاتصال بالخادم');
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status) => {
        const configs = {
            'paid': { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', text: 'مدفوعة', icon: CheckCircle },
            'draft': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', text: 'مسودة', icon: FileText },
            'sent': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', text: 'تم الإرسال', icon: Clock },
            'partially_paid': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', text: 'مدفوعة جزئياً', icon: Clock },
            'overdue': { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', text: 'متأخرة', icon: AlertCircle },
            'cancelled': { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', text: 'ملغاة', icon: XCircle }
        };
        return configs[status] || configs['draft'];
    };

    const formatMoney = (amount, currency = 'EGP') => {
        if (settingsFormatMoney) {
            return settingsFormatMoney(amount);
        }
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const formatDate = (date) => {
        if (!date) return 'غير محدد';
        return new Date(date).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handlePrint = () => {
        if (!token) return;
        const printUrl = `${API_BASE_URL}/invoices/public/print/${token}`;
        window.open(printUrl, '_blank');
    };

    // Check dark mode
    const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 dark:bg-background">
                <Loading size="xl" text="جاري تحميل الفاتورة..." />
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 dark:bg-background p-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-border">
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-foreground mb-2">خطأ</h1>
                        <p className="text-foreground/70">{error || 'الفاتورة غير موجودة'}</p>
                    </div>
                    <p className="text-sm text-foreground/50">
                        إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع فريق الدعم لدينا.
                    </p>
                </div>
            </div>
        );
    }

    const statusConfig = getStatusConfig(invoice.status);
    const StatusIcon = statusConfig.icon;

    return (
        <div className="min-h-screen bg-muted/30 dark:bg-gray-950 font-sans text-right" dir="rtl">
            {/* Navigation Header */}
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-border shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">بوابة الفواتير</h1>
                            <p className="text-xs text-foreground/60 hidden sm:block">FixZone ERP System</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
                            className="p-2.5 rounded-xl hover:bg-muted transition-all duration-200 text-foreground"
                        >
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <SimpleButton onClick={handlePrint} className="gap-2 rounded-xl">
                            <Printer className="w-4 h-4" />
                            <span>طباعة</span>
                        </SimpleButton>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Welcome & Status Card */}
                <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/10 transition-colors duration-500"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <p className="text-blue-100 font-medium mb-1">فاتورة عميل</p>
                            <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">أهلاً، {invoice.customerName || 'عميلنا العزيز'}</h2>
                            <div className="flex flex-wrap items-center gap-4 text-blue-100 text-sm">
                                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatDate(invoice.createdAt)}</span>
                                <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> فاتورة رقم #{invoice.id}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-center md:items-end gap-2">
                            <div className={`px-5 py-2 rounded-2xl ${statusConfig.color} font-bold flex items-center gap-2 shadow-inner border border-white/20`}>
                                <StatusIcon className="w-5 h-5" />
                                <span>{statusConfig.text}</span>
                            </div>
                            {invoice.dueDate && (
                                <p className="text-xs text-blue-100 font-medium">تاريخ الاستحقاق: {formatDate(invoice.dueDate)}</p>
                            )}
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Items Table */}
                        <SimpleCard className="rounded-3xl border-none shadow-xl overflow-hidden bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                            <SimpleCardHeader className="p-6 border-b border-border/50 bg-muted/30">
                                <SimpleCardTitle className="text-lg flex items-center gap-3">
                                    <Package className="w-5 h-5 text-blue-600" />
                                    <span>عناصر الفاتورة ({invoice.items?.length || 0})</span>
                                </SimpleCardTitle>
                            </SimpleCardHeader>
                            <SimpleCardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-right">
                                        <thead className="bg-muted text-foreground/70 uppercase text-xs">
                                            <tr>
                                                <th className="px-6 py-4 font-bold">الوصف</th>
                                                <th className="px-6 py-4 font-bold text-center">الكمية</th>
                                                <th className="px-6 py-4 font-bold text-center">السعر الوحدة</th>
                                                <th className="px-6 py-4 font-bold text-left">الإجمالي</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {invoice.items?.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-6 py-5">
                                                        <span className="font-bold text-foreground">
                                                            {item.itemType === 'part' ? (item.partName || item.description) : (item.serviceName || item.description)}
                                                        </span>
                                                        <div className="text-xs text-foreground/50 mt-1 flex items-center gap-2">
                                                            {item.itemType === 'service' ? <Wrench className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                                                            {item.itemType === 'service' ? 'خدمة فنية' : 'قطعة غيار'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center font-medium">{item.quantity}</td>
                                                    <td className="px-6 py-5 text-center font-medium">{formatMoney(item.unitPrice, invoice.currency)}</td>
                                                    <td className="px-6 py-5 text-left font-bold text-blue-600 dark:text-blue-400">
                                                        {formatMoney(item.totalPrice, invoice.currency)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </SimpleCardContent>
                        </SimpleCard>

                        {/* Device Info (if linked to repair) */}
                        {invoice.repairRequestId && (
                            <SimpleCard className="rounded-3xl border-none shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                                <SimpleCardHeader className="p-6">
                                    <SimpleCardTitle className="text-lg flex items-center gap-3">
                                        <Smartphone className="w-5 h-5 text-indigo-600" />
                                        <span>بيانات الجهاز المرتبط</span>
                                    </SimpleCardTitle>
                                </SimpleCardHeader>
                                <SimpleCardContent className="p-6 pt-0">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-xs text-foreground/50">نوع الجهاز</p>
                                            <p className="font-bold">{invoice.deviceType || 'غير محدد'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-foreground/50">العلامة التجارية</p>
                                            <p className="font-bold">{invoice.deviceBrand || 'غير محدد'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-foreground/50">الموديل</p>
                                            <p className="font-bold">{invoice.deviceModel || 'غير محدد'}</p>
                                        </div>
                                    </div>
                                </SimpleCardContent>
                            </SimpleCard>
                        )}

                        {/* Notes Section */}
                        {invoice.notes && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30 rounded-3xl p-6 relative overflow-hidden">
                                <div className="absolute -top-4 -left-4 opacity-5">
                                    <FileText className="w-24 h-24" />
                                </div>
                                <h3 className="font-bold text-yellow-800 dark:text-yellow-500 mb-3 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    ملاحظات الفاتورة
                                </h3>
                                <p className="text-sm text-yellow-900/80 dark:text-yellow-400/80 leading-relaxed">
                                    {invoice.notes}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Summary */}
                    <aside className="space-y-8">
                        <SimpleCard className="rounded-3xl border-none shadow-2xl bg-white dark:bg-gray-900 overflow-hidden sticky top-24">
                            <div className="bg-muted/50 p-6 border-b border-border/50 text-center">
                                <p className="text-xs text-foreground/50 uppercase tracking-widest font-bold mb-2">الإجمالي المطلوب</p>
                                <div className="text-4xl font-black text-foreground">{formatMoney(invoice.totalAmount, invoice.currency)}</div>
                            </div>
                            <SimpleCardContent className="p-6 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-foreground/60">المجموع الفرعي</span>
                                        <span className="font-bold">{formatMoney(parseFloat(invoice.totalAmount) - parseFloat(invoice.taxAmount || 0) - parseFloat(invoice.shippingAmount || 0) + parseFloat(invoice.discountAmount || 0), invoice.currency)}</span>
                                    </div>
                                    {parseFloat(invoice.discountAmount) > 0 && (
                                        <div className="flex justify-between text-sm text-red-500 font-medium">
                                            <span>الخصم</span>
                                            <span>-{formatMoney(invoice.discountAmount, invoice.currency)}</span>
                                        </div>
                                    )}
                                    {parseFloat(invoice.taxAmount) > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-foreground/60">الضريبة</span>
                                            <span className="font-bold text-foreground">+{formatMoney(invoice.taxAmount, invoice.currency)}</span>
                                        </div>
                                    )}
                                    {parseFloat(invoice.shippingAmount) > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-foreground/60">رسوم الشحن</span>
                                            <span className="font-bold text-foreground">+{formatMoney(invoice.shippingAmount, invoice.currency)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-dashed border-border/50 pt-6 space-y-3">
                                    <div className="flex justify-between text-sm items-center">
                                        <span className="flex items-center gap-2 text-green-600 font-medium">
                                            <CheckCircle className="w-4 h-4" />
                                            المدفوع
                                        </span>
                                        <span className="font-bold text-green-600">{formatMoney(invoice.amountPaid, invoice.currency)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-4 px-5 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                                        <span className="text-sm font-bold text-blue-700 dark:text-blue-400">المتبقي</span>
                                        <span className="text-xl font-black text-blue-700 dark:text-blue-400">{formatMoney(invoice.remainingAmount, invoice.currency)}</span>
                                    </div>
                                </div>

                                {/* Secure Badge */}
                                <div className="flex items-center justify-center gap-2 py-3 bg-muted/30 rounded-xl text-[10px] text-foreground/40 font-bold uppercase tracking-wider">
                                    <Shield className="w-3 h-3" />
                                    رابط آمن ومحمي
                                </div>
                            </SimpleCardContent>
                        </SimpleCard>

                        {/* Payments History (if any) */}
                        {invoice.payments?.length > 0 && (
                            <SimpleCard className="rounded-3xl border-none shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                                <SimpleCardHeader className="p-6">
                                    <SimpleCardTitle className="text-sm flex items-center gap-2 font-bold">
                                        <CreditCard className="w-4 h-4 text-emerald-600" />
                                        تاريخ المدفوعات
                                    </SimpleCardTitle>
                                </SimpleCardHeader>
                                <SimpleCardContent className="p-6 pt-0">
                                    <div className="space-y-4">
                                        {invoice.payments.map((p, i) => (
                                            <div key={i} className="flex justify-between items-center text-xs group">
                                                <div className="space-y-1">
                                                    <p className="font-bold text-foreground group-hover:text-emerald-600 transition-colors">{formatMoney(p.amount, invoice.currency)}</p>
                                                    <p className="text-[10px] text-foreground/40">{formatDate(p.paymentDate)}</p>
                                                </div>
                                                <span className="px-2 py-1 bg-muted rounded-lg text-[9px] font-bold text-foreground/60">{p.paymentMethod}</span>
                                            </div>
                                        ))}
                                    </div>
                                </SimpleCardContent>
                            </SimpleCard>
                        )}
                    </aside>
                </div>
            </main>

            {/* Modern Footer */}
            <footer className="max-w-5xl mx-auto px-6 py-12 text-center border-t border-border/50">
                <div className="flex items-center justify-center gap-4 mb-6 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-default">
                    <Building2 className="w-8 h-8" />
                    <p className="text-lg font-black tracking-tighter">FixZone <span className="text-blue-600 text-[10px] align-top">TM</span></p>
                </div>
                <p className="text-xs text-foreground/40 font-medium">هذه الفاتورة تم إنشاؤها إلكترونياً وهي محمية بموجب شروط الخدمة لـ FixZone.</p>
                <p className="text-[10px] text-foreground/30 mt-2">© {new Date().getFullYear()} كافة الحقوق محفوظة.</p>
            </footer>
        </div>
    );
};

export default PublicInvoicePage;
