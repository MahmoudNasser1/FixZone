import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Input } from '../../components/ui/Input';
import SimpleButton from '../../components/ui/SimpleButton';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { 
    User, Lock, LogIn, AlertCircle, Eye, EyeOff, 
    Shield, Phone, Mail, MessageCircle, Wrench,
    ChevronLeft
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';

/**
 * CustomerLoginPage - Enhanced Login Experience
 * 
 * Features:
 * - Animated background with brand colors
 * - Password visibility toggle
 * - Remember me checkbox
 * - Forgot password flow (contact support)
 * - Loading states with skeleton
 * - Better error messages
 * - Mobile-first responsive design
 */

export default function CustomerLoginPage() {
    const navigate = useNavigate();
    const notifications = useNotifications();
    const [formData, setFormData] = useState({
        loginIdentifier: '',
        password: '',
        rememberMe: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    // Load remembered login if exists
    useEffect(() => {
        const savedLogin = localStorage.getItem('rememberedCustomerLogin');
        if (savedLogin) {
            setFormData(prev => ({
                ...prev,
                loginIdentifier: savedLogin,
                rememberMe: true
            }));
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await api.request('/auth/customer/login', {
                method: 'POST',
                body: JSON.stringify({
                    loginIdentifier: formData.loginIdentifier,
                    password: formData.password
                })
            });

            if (result.success && result.data) {
                // Handle remember me
                if (formData.rememberMe) {
                    localStorage.setItem('rememberedCustomerLogin', formData.loginIdentifier);
                } else {
                    localStorage.removeItem('rememberedCustomerLogin');
                }

                // Ensure roleId is set
                const userData = {
                    ...result.data,
                    roleId: result.data.roleId || result.data.role || 8
                };

                // Update auth store
                useAuthStore.setState({
                    isAuthenticated: true,
                    user: userData,
                    token: null,
                    forcePasswordReset: Boolean(userData.forcePasswordReset)
                });
                
                notifications.success('نجاح', { message: 'تم تسجيل الدخول بنجاح' });
                navigate('/customer/dashboard');
            } else {
                throw new Error(result.message || 'فشل تسجيل الدخول');
            }
        } catch (error) {
            console.error('Customer login error:', error);
            const errorMessage = error.message || 'حدث خطأ في تسجيل الدخول';
            setError(errorMessage);
            notifications.error('خطأ', { message: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const handleContactSupport = () => {
        window.open('https://api.whatsapp.com/send/?phone=%2B201270388043&text=مرحباً، أريد استعادة كلمة المرور لحسابي في Fix Zone', '_blank');
    };

    // Forgot Password Modal/View
    if (showForgotPassword) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-brand-blue via-brand-blue-light to-blue-900 flex items-center justify-center p-4">
                {/* Background Pattern */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-white/5 rounded-full blur-3xl" />
                    <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl" />
                </div>

                <div className="relative w-full max-w-md">
                    <div className="bg-card rounded-2xl shadow-2xl overflow-hidden border border-white/10">
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-l from-brand-blue to-brand-blue-light text-white text-center">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-4 flex items-center justify-center backdrop-blur-sm">
                                <Lock className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-xl font-bold">استعادة كلمة المرور</h2>
                            <p className="text-sm text-white/80 mt-2">تواصل مع فريق الدعم لاستعادة حسابك</p>
                        </div>

                        <div className="p-6">
                            <div className="text-center mb-6">
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    لأسباب أمنية، لا يمكن إعادة تعيين كلمة المرور تلقائياً.
                                    يرجى التواصل مع فريق الدعم الفني وسيتم مساعدتك فوراً.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={handleContactSupport}
                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    تواصل عبر واتساب
                                </button>

                                <a
                                    href="tel:+201270388043"
                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-brand-blue hover:bg-brand-blue-light text-white rounded-xl font-bold transition-all"
                                >
                                    <Phone className="w-5 h-5" />
                                    اتصل بنا مباشرة
                                </a>

                                <button
                                    onClick={() => setShowForgotPassword(false)}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    العودة لتسجيل الدخول
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-brand-blue via-brand-blue-light to-blue-900 flex items-center justify-center p-4">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-white/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                
                {/* Floating Icons */}
                <div className="absolute top-20 left-20 opacity-10 animate-bounce" style={{ animationDuration: '3s' }}>
                    <Wrench className="w-16 h-16 text-white" />
                </div>
                <div className="absolute bottom-32 right-16 opacity-10 animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>
                    <Shield className="w-20 h-20 text-white" />
                </div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-2xl mb-4">
                        <img 
                            src="/Fav.png" 
                            alt="Fix Zone" 
                            className="w-14 h-14 object-contain"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <Shield className="w-10 h-10 text-brand-blue hidden" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">Fix Zone</h1>
                    <p className="text-white/70">بوابة العملاء</p>
                </div>

                {/* Login Card */}
                <div className="bg-card rounded-2xl shadow-2xl overflow-hidden border border-white/10 backdrop-blur-sm">
                    {/* Card Header */}
                    <div className="p-6 border-b border-border bg-gradient-to-l from-card to-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-brand-blue/10 rounded-xl flex items-center justify-center">
                                <User className="w-6 h-6 text-brand-blue" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">تسجيل الدخول</h2>
                                <p className="text-sm text-muted-foreground">أدخل بياناتك للوصول لحسابك</p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Error Alert */}
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top duration-300">
                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-red-800 dark:text-red-200">خطأ في تسجيل الدخول</p>
                                        <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Phone/Email Field */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-foreground">
                                    رقم الهاتف أو البريد الإلكتروني
                                </label>
                                <div className="relative">
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.loginIdentifier}
                                        onChange={(e) => setFormData({ ...formData, loginIdentifier: e.target.value })}
                                        placeholder="أدخل رقم الهاتف أو البريد"
                                        className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all"
                                        required
                                        disabled={loading}
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-foreground">
                                    كلمة المرور
                                </label>
                                <div className="relative">
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        lang="en"
                                        autoComplete="current-password"
                                        autoCorrect="off"
                                        autoCapitalize="off"
                                        spellCheck={false}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="أدخل كلمة المرور"
                                        className="w-full pr-10 pl-12 py-3 rounded-xl border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all"
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.rememberMe}
                                        onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                                        className="w-4 h-4 rounded border-2 border-input text-brand-blue focus:ring-brand-blue cursor-pointer"
                                    />
                                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                        تذكرني
                                    </span>
                                </label>

                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-sm text-brand-blue hover:text-brand-blue-light transition-colors font-medium"
                                >
                                    نسيت كلمة المرور؟
                                </button>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-l from-brand-blue to-brand-blue-light hover:shadow-lg hover:shadow-brand-blue/25 hover:-translate-y-0.5"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        جاري تسجيل الدخول...
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="w-5 h-5" />
                                        تسجيل الدخول
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-border bg-muted/30 text-center">
                        <p className="text-sm text-muted-foreground">
                            ليس لديك حساب؟{' '}
                            <button
                                onClick={handleContactSupport}
                                className="text-brand-blue hover:text-brand-blue-light font-medium transition-colors"
                            >
                                تواصل معنا
                            </button>
                        </p>
                    </div>
                </div>

                {/* Staff Login Link */}
                <div className="text-center mt-6">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                        دخول الموظفين →
                    </button>
                </div>
            </div>
        </div>
    );
}
