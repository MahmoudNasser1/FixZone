import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

/**
 * 🎨 صفحة تسجيل الدخول المحسّنة
 * Enhanced Login Page - Premium Design
 * 
 * المميزات:
 * - تصميم عصري مع gradients
 * - Icons في الـ input fields
 * - Show/Hide password
 * - Validation في الوقت الفعلي
 * - Loading states و animations
 * - Auto-redirect حسب نوع المستخدم
 */

const EnhancedLoginPage = () => {
    // ===== State Management =====
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [touched, setTouched] = useState({});

    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    // ===== Validation Functions =====
    const validateField = (name, value) => {
        const errors = { ...validationErrors };

        switch (name) {
            case 'loginIdentifier':
                if (!value) {
                    errors.loginIdentifier = 'لازم تدخل الإيميل أو الموبايل';
                } else if (value.length < 3) {
                    errors.loginIdentifier = 'الإيميل أو الموبايل قصير أوي';
                } else {
                    delete errors.loginIdentifier;
                }
                break;
            case 'password':
                if (!value) {
                    errors.password = 'لازم تدخل كلمة السر';
                } else if (value.length < 8) {
                    errors.password = 'كلمة السر لازم تكون 8 أحرف على الأقل';
                } else {
                    delete errors.password;
                }
                break;
            default:
                break;
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // امسح الـ error لما اليوزر يبدأ يكتب
    useEffect(() => {
        if (error) setError(null);
    }, [loginIdentifier, password]);

    // ===== Event Handlers =====
    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched({ ...touched, [name]: true });
        validateField(name, value);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'loginIdentifier') {
            setLoginIdentifier(value);
        } else if (name === 'password') {
            setPassword(value);
        }

        // Validate بس لو الـ field اتلمس قبل كده
        if (touched[name]) {
            validateField(name, value);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setValidationErrors({});

        // علّم كل الـ fields إنها اتلمست
        const allTouched = { loginIdentifier: true, password: true };
        setTouched(allTouched);

        // تحقق من كل الـ fields
        const isLoginValid = validateField('loginIdentifier', loginIdentifier);
        const isPasswordValid = validateField('password', password);

        if (!isLoginValid || !isPasswordValid) {
            return;
        }

        setIsLoading(true);
        try {
            await login(loginIdentifier, password);

            // جيب بيانات اليوزر بعد الـ login علشان تعرف توجهه فين
            const user = useAuthStore.getState().user;
            const roleId = user?.roleId || user?.role;

            // وجّه حسب نوع المستخدم
            if (roleId === 3 || roleId === '3') {
                // فني → لوحة الفني
                navigate('/tech/dashboard');
            } else if (roleId === 8 || user?.type === 'customer') {
                // عميل → لوحة العميل
                navigate('/customer/dashboard');
            } else {
                // أدمن/موظف → اللوحة الرئيسية
                navigate('/');
            }
        } catch (err) {
            // ترجم رسائل الأخطاء للعربي المصري
            let errorMessage = err.message || 'حصل خطأ مش متوقع';

            const errorTranslations = {
                'User not found': 'مفيش يوزر بالبيانات دي',
                'Incorrect password': 'كلمة السر غلط',
                'Invalid credentials': 'البيانات مش صح',
                'Too many login attempts': 'حاولت كتير خالص، استنى 15 دقيقة وحاول تاني',
                'Please provide login identifier and password': 'لازم تدخل الإيميل أو الموبايل وكلمة السر',
                'Network Error': 'مفيش نت، اتشيك على الاتصال',
                'Server error': 'في مشكلة في السيرفر، حاول تاني'
            };

            Object.keys(errorTranslations).forEach(key => {
                if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
                    errorMessage = errorTranslations[key];
                }
            });

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // ===== Render =====
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decoration - ألوان البراند */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ backgroundColor: '#053887' }}></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" style={{ backgroundColor: '#0a4da3' }}></div>
                <div className="absolute top-40 left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" style={{ backgroundColor: '#1562bf' }}></div>
            </div>

            {/* Login Card */}
            <Card className="w-full max-w-md shadow-2xl backdrop-blur-sm bg-white/95 relative z-10 border-t-4" style={{ borderTopColor: '#053887' }}>
                <CardHeader className="text-center pb-2">
                    {/* Logo الحقيقي */}
                    <div className="mx-auto mb-4 flex items-center justify-center">
                        <img
                            src="/logo.png"
                            alt="FixZone Logo"
                            className="h-20 w-auto object-contain"
                            onError={(e) => {
                                // Fallback لو الصورة مش موجودة
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        {/* Fallback Logo */}
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg hidden" style={{ background: 'linear-gradient(135deg, #053887 0%, #0a4da3 100%)' }}>
                            <div className="text-white text-3xl font-bold">FZ</div>
                        </div>
                    </div>

                    <CardTitle className="text-3xl font-bold" style={{
                        background: 'linear-gradient(135deg, #053887 0%, #0a4da3 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        أهلاً بيك
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                        سجل دخول علشان تدخل على حسابك
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-5 pt-6">
                        {/* Error Message */}
                        {error && (
                            <div className="border-l-4 p-4 rounded-lg flex items-start gap-3 animate-shake" style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                borderColor: '#EF4444'
                            }}>
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#EF4444' }} />
                                <div>
                                    <p className="font-semibold text-sm" style={{ color: '#DC2626' }}>في مشكلة!</p>
                                    <p className="text-sm mt-1" style={{ color: '#EF4444' }}>{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Email/Phone Field */}
                        <div className="space-y-2">
                            <Label htmlFor="loginIdentifier" className="text-right block font-semibold">
                                الإيميل أو الموبايل
                            </Label>
                            <div className="relative">
                                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: '#9CA3AF' }} />
                                <Input
                                    id="loginIdentifier"
                                    name="loginIdentifier"
                                    type="text"
                                    placeholder="مثال: ahmed@fixzone.com أو 01012345678"
                                    value={loginIdentifier}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    disabled={isLoading}
                                    dir="ltr"
                                    className={`pr-10 h-12 text-base ${touched.loginIdentifier && validationErrors.loginIdentifier
                                        ? 'border-red-500 focus:ring-red-500'
                                        : ''
                                        }`}
                                    style={!validationErrors.loginIdentifier ? {
                                        borderColor: '#E5E7EB',
                                        focusRingColor: '#053887'
                                    } : {}}
                                />
                            </div>
                            {touched.loginIdentifier && validationErrors.loginIdentifier && (
                                <p className="text-sm flex items-center gap-1 animate-fadeIn" style={{ color: '#EF4444' }}>
                                    <AlertCircle className="w-4 h-4" />
                                    {validationErrors.loginIdentifier}
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-right block font-semibold">
                                كلمة السر
                            </Label>
                            <div className="relative">
                                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: '#9CA3AF' }} />
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    lang="en"
                                    autoComplete="current-password"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    spellCheck={false}
                                    required
                                    value={password}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    disabled={isLoading}
                                    placeholder="اكتب كلمة السر"
                                    className={`pr-10 pl-10 h-12 text-base ${touched.password && validationErrors.password
                                        ? 'border-red-500 focus:ring-red-500'
                                        : ''
                                        }`}
                                    style={!validationErrors.password ? {
                                        borderColor: '#E5E7EB'
                                    } : {}}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors"
                                    style={{ color: '#9CA3AF' }}
                                    onMouseEnter={(e) => e.target.style.color = '#6B7280'}
                                    onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {touched.password && validationErrors.password && (
                                <p className="text-sm flex items-center gap-1 animate-fadeIn" style={{ color: '#EF4444' }}>
                                    <AlertCircle className="w-4 h-4" />
                                    {validationErrors.password}
                                </p>
                            )}
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded focus:ring-2"
                                    style={{
                                        color: '#053887',
                                        borderColor: '#D1D5DB'
                                    }}
                                    disabled={isLoading}
                                />
                                <span className="text-gray-700">فاكرني</span>
                            </label>
                            <a
                                href="#"
                                className="font-medium hover:underline"
                                style={{ color: '#053887' }}
                                onMouseEnter={(e) => e.target.style.color = '#042d6b'}
                                onMouseLeave={(e) => e.target.style.color = '#053887'}
                                onClick={(e) => {
                                    e.preventDefault();
                                    alert('اتصل بالإدارة علشان تعيد كلمة السر');
                                }}
                            >
                                نسيت كلمة السر؟
                            </a>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-3">
                        {/* Login Button - ألوان البراند */}
                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200"
                            style={{
                                background: 'linear-gradient(135deg, #053887 0%, #0a4da3 100%)'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'linear-gradient(135deg, #042d6b 0%, #053887 50%, #0a4da3 100%)'}
                            onMouseLeave={(e) => e.target.style.background = 'linear-gradient(135deg, #053887 0%, #0a4da3 100%)'}
                            disabled={isLoading || Object.keys(validationErrors).length > 0}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    بدخل...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <LogIn className="w-5 h-5" />
                                    تسجيل الدخول
                                </span>
                            )}
                        </Button>

                        {/* Help Text */}
                        <p className="text-center text-sm text-gray-600">
                            محتاج مساعدة؟{' '}
                            <a
                                href="mailto:support@fixzone.com"
                                className="font-medium hover:underline"
                                style={{ color: '#053887' }}
                                onMouseEnter={(e) => e.target.style.color = '#042d6b'}
                                onMouseLeave={(e) => e.target.style.color = '#053887'}
                            >
                                اتصل بينا
                            </a>
                        </p>
                    </CardFooter>
                </form>
            </Card>

            {/* Custom CSS for animations */}
            <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
        </div>
    );
};

export default EnhancedLoginPage;
