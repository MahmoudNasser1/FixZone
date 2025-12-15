import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
    Search,
    Wrench,
    Clock,
    CheckCircle,
    Package,
    Truck,
    AlertCircle,
    Phone,
    MessageCircle,
    ArrowRight,
    ShoppingCart,
    Shield,
    XCircle,
    RefreshCw
} from 'lucide-react';

/**
 * TrackRepairPage - Public Repair Tracking Page
 * 
 * Features:
 * - No login required
 * - Search by repair ID or phone number
 * - Displays repair status timeline
 * - Shows basic repair info (no sensitive data)
 * - Contact support options
 */

const statusSteps = [
    { id: 'pending', label: 'تم الاستلام', icon: Clock, color: '#F59E0B' },
    { id: 'in_progress', label: 'قيد الإصلاح', icon: Wrench, color: '#3B82F6' },
    { id: 'waiting-parts', label: 'قطع غيار', icon: ShoppingCart, color: '#F97316' },
    { id: 'ready-for-pickup', label: 'جاهز للاستلام', icon: Package, color: '#10B981' },
    { id: 'delivered', label: 'تم التسليم', icon: Truck, color: '#059669' }
];

const getStatusIndex = (status) => {
    const normalizedStatus = status?.toLowerCase().replace('_', '-');
    const index = statusSteps.findIndex(s => s.id === normalizedStatus);
    if (index >= 0) return index;
    if (normalizedStatus === 'completed') return 3;
    return 0;
};

export default function TrackRepairPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [searchValue, setSearchValue] = useState(id || '');
    const [repair, setRepair] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    // Auto-search if ID is in URL
    useEffect(() => {
        if (id) {
            setSearchValue(id);
            handleSearch(id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleSearch = async (searchId = searchValue) => {
        if (!searchId.trim()) {
            setError('يرجى إدخال رقم الطلب أو رقم الهاتف');
            return;
        }

        setLoading(true);
        setError('');
        setSearched(true);

        try {
            // Try to fetch repair by ID or phone
            const response = await api.request(`/repairs/track/${searchId.trim()}`);
            
            if (response.success && response.data) {
                setRepair(response.data);
                // Update URL without reloading
                if (!id || id !== searchId) {
                    window.history.replaceState(null, '', `/track/${searchId}`);
                }
            } else {
                setRepair(null);
                setError(response.message || 'لم يتم العثور على الطلب');
            }
        } catch (err) {
            console.error('Track error:', err);
            setRepair(null);
            setError('حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleSearch();
    };

    const handleWhatsApp = () => {
        const message = repair 
            ? `مرحباً، أستفسر عن طلب الإصلاح رقم ${repair.id}`
            : 'مرحباً، أريد الاستفسار عن طلب إصلاح';
        window.open(
            `https://api.whatsapp.com/send/?phone=%2B201270388043&text=${encodeURIComponent(message)}`,
            '_blank'
        );
    };

    const currentStatusIndex = repair ? getStatusIndex(repair.status) : -1;
    const isCancelled = repair?.status === 'cancelled';

    return (
        <div className="min-h-screen bg-gradient-to-br from-brand-blue via-brand-blue-light to-blue-900" dir="rtl">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-white/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl" />
            </div>

            <div className="relative min-h-screen flex flex-col">
                {/* Header */}
                <header className="py-6 px-4">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-white">
                                <h1 className="font-bold text-xl">Fix Zone</h1>
                                <p className="text-sm text-white/70">تتبع طلب الإصلاح</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/customer/login')}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            تسجيل الدخول
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl">
                        {/* Search Card */}
                        <div className="bg-card rounded-2xl shadow-2xl overflow-hidden border border-white/10">
                            {/* Search Header */}
                            <div className="p-6 bg-gradient-to-l from-brand-blue/50 to-brand-blue-light/50 border-b border-border">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Search className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">تتبع طلبك</h2>
                                        <p className="text-sm text-white/80">أدخل رقم الطلب أو رقم هاتفك</p>
                                    </div>
                                </div>

                                {/* Search Form */}
                                <form onSubmit={handleSubmit} className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={searchValue}
                                            onChange={(e) => setSearchValue(e.target.value)}
                                            placeholder="رقم الطلب أو رقم الهاتف..."
                                            className="w-full px-4 py-3 pr-10 rounded-xl border-2 border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 transition-colors"
                                        />
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-3 bg-white text-brand-blue rounded-xl font-bold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {loading ? (
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Search className="w-5 h-5" />
                                        )}
                                        بحث
                                    </button>
                                </form>
                            </div>

                            {/* Results */}
                            <div className="p-6">
                                {/* Error State */}
                                {error && (
                                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-6">
                                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                        <p className="text-red-600 dark:text-red-400">{error}</p>
                                    </div>
                                )}

                                {/* Loading State */}
                                {loading && (
                                    <div className="text-center py-12">
                                        <RefreshCw className="w-12 h-12 text-brand-blue mx-auto mb-4 animate-spin" />
                                        <p className="text-muted-foreground">جاري البحث...</p>
                                    </div>
                                )}

                                {/* Not Found State */}
                                {searched && !loading && !repair && !error && (
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                                            <Search className="w-10 h-10 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-foreground mb-2">
                                            لم يتم العثور على الطلب
                                        </h3>
                                        <p className="text-muted-foreground mb-6">
                                            تأكد من رقم الطلب أو رقم الهاتف وحاول مرة أخرى
                                        </p>
                                        <button
                                            onClick={handleWhatsApp}
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
                                        >
                                            <MessageCircle className="w-5 h-5" />
                                            تواصل مع الدعم
                                        </button>
                                    </div>
                                )}

                                {/* Repair Found */}
                                {repair && !loading && (
                                    <div className="space-y-6">
                                        {/* Repair Info Header */}
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">رقم الطلب</p>
                                                <h3 className="text-2xl font-bold text-foreground">#{repair.id}</h3>
                                            </div>
                                            <div className={`px-4 py-2 rounded-lg font-medium ${
                                                isCancelled 
                                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                    : currentStatusIndex >= 3
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                            }`}>
                                                {isCancelled ? 'ملغي' : 
                                                 statusSteps[currentStatusIndex]?.label || 'قيد المعالجة'}
                                            </div>
                                        </div>

                                        {/* Device Info */}
                                        <div className="p-4 bg-muted/50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center">
                                                    <Wrench className="w-6 h-6 text-brand-blue" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">
                                                        {repair.deviceType || 'جهاز'}
                                                        {repair.brand && ` - ${repair.brand}`}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        تاريخ الاستلام: {repair.createdAt 
                                                            ? new Date(repair.createdAt).toLocaleDateString('ar-EG')
                                                            : 'غير محدد'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Timeline */}
                                        {!isCancelled && (
                                            <div className="py-4">
                                                <h4 className="font-semibold text-foreground mb-6">حالة الطلب</h4>
                                                <div className="relative">
                                                    {/* Progress Line */}
                                                    <div className="absolute top-5 right-5 left-5 h-0.5 bg-muted" />
                                                    <div 
                                                        className="absolute top-5 right-5 h-0.5 transition-all duration-500"
                                                        style={{ 
                                                            width: `${((currentStatusIndex + 1) / statusSteps.length) * 100}%`,
                                                            maxWidth: 'calc(100% - 40px)',
                                                            backgroundColor: statusSteps[currentStatusIndex]?.color || '#6B7280'
                                                        }}
                                                    />

                                                    {/* Steps */}
                                                    <div className="relative flex justify-between">
                                                        {statusSteps.map((step, index) => {
                                                            const StepIcon = step.icon;
                                                            const isActive = index <= currentStatusIndex;
                                                            const isCurrent = index === currentStatusIndex;

                                                            return (
                                                                <div 
                                                                    key={step.id}
                                                                    className="flex flex-col items-center"
                                                                >
                                                                    <div 
                                                                        className={`
                                                                            w-10 h-10 rounded-full flex items-center justify-center
                                                                            transition-all duration-300 z-10
                                                                            ${isCurrent ? 'ring-4 ring-opacity-30 scale-110' : ''}
                                                                        `}
                                                                        style={{
                                                                            backgroundColor: isActive ? step.color : 'var(--muted)',
                                                                            ringColor: isCurrent ? step.color : 'transparent'
                                                                        }}
                                                                    >
                                                                        {isActive ? (
                                                                            <StepIcon className="w-5 h-5 text-white" />
                                                                        ) : (
                                                                            <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                                                                        )}
                                                                    </div>
                                                                    <span className={`
                                                                        text-xs mt-2 text-center
                                                                        ${isCurrent 
                                                                            ? 'font-bold text-foreground' 
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
                                            </div>
                                        )}

                                        {/* Cancelled State */}
                                        {isCancelled && (
                                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <XCircle className="w-6 h-6 text-red-500" />
                                                    <div>
                                                        <p className="font-semibold text-red-700 dark:text-red-300">
                                                            تم إلغاء هذا الطلب
                                                        </p>
                                                        <p className="text-sm text-red-600 dark:text-red-400">
                                                            للمزيد من المعلومات، تواصل مع الدعم الفني
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                                            <button
                                                onClick={handleWhatsApp}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
                                            >
                                                <MessageCircle className="w-5 h-5" />
                                                تواصل عبر واتساب
                                            </button>
                                            <a
                                                href="tel:+201270388043"
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-blue hover:bg-brand-blue-light text-white rounded-xl font-medium transition-colors"
                                            >
                                                <Phone className="w-5 h-5" />
                                                اتصل بنا
                                            </a>
                                        </div>

                                        {/* Login CTA */}
                                        <div className="text-center pt-4">
                                            <p className="text-sm text-muted-foreground mb-2">
                                                سجل دخولك للحصول على المزيد من التفاصيل
                                            </p>
                                            <button
                                                onClick={() => navigate('/customer/login')}
                                                className="text-brand-blue hover:text-brand-blue-light font-medium flex items-center gap-1 mx-auto"
                                            >
                                                تسجيل الدخول
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Initial State */}
                                {!searched && !loading && (
                                    <div className="text-center py-8">
                                        <div className="w-20 h-20 rounded-full bg-brand-blue/10 mx-auto mb-4 flex items-center justify-center">
                                            <Wrench className="w-10 h-10 text-brand-blue" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-foreground mb-2">
                                            تتبع طلب الإصلاح
                                        </h3>
                                        <p className="text-muted-foreground">
                                            أدخل رقم الطلب أو رقم هاتفك للاطلاع على حالة الإصلاح
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Help Text */}
                        <p className="text-center text-white/60 text-sm mt-6">
                            تحتاج مساعدة؟ تواصل معنا على{' '}
                            <a href="tel:+201270388043" className="text-white hover:underline">
                                +20 127 038 8043
                            </a>
                        </p>
                    </div>
                </main>

                {/* Footer */}
                <footer className="py-4 px-4 text-center text-white/50 text-sm">
                    © {new Date().getFullYear()} Fix Zone. جميع الحقوق محفوظة.
                </footer>
            </div>
        </div>
    );
}

