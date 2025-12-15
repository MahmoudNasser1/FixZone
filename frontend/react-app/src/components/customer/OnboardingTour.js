import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    Wrench,
    FileText,
    Bell,
    Settings,
    CheckCircle,
    Sparkles,
    ArrowRight
} from 'lucide-react';

/**
 * OnboardingTour - Interactive Tour for New Customers
 * 
 * Features:
 * - Step-by-step introduction to portal features
 * - Skip/Complete functionality
 * - Progress indicator
 * - Stores completion state in localStorage
 * - Animated transitions
 */

const ONBOARDING_STORAGE_KEY = 'fixzone_customer_onboarding_completed';
const ONBOARDING_VERSION = '1.0'; // Increment to show tour again after major updates

const tourSteps = [
    {
        id: 'welcome',
        title: 'مرحباً بك في Fix Zone!',
        description: 'دعنا نأخذك في جولة سريعة للتعرف على بوابة العملاء وكيفية الاستفادة من جميع المميزات المتاحة.',
        icon: Sparkles,
        color: '#053887',
        illustration: 'welcome'
    },
    {
        id: 'dashboard',
        title: 'لوحة التحكم',
        description: 'من هنا يمكنك مشاهدة ملخص سريع لحالة طلبات الإصلاح، الفواتير، والإشعارات الجديدة. كل شيء في مكان واحد!',
        icon: LayoutDashboard,
        color: '#053887',
        path: '/customer/dashboard'
    },
    {
        id: 'repairs',
        title: 'طلبات الإصلاح',
        description: 'تابع جميع طلبات إصلاح أجهزتك، اعرف حالة كل طلب، وتواصل مع فريق الدعم مباشرة.',
        icon: Wrench,
        color: '#3B82F6',
        path: '/customer/repairs'
    },
    {
        id: 'invoices',
        title: 'الفواتير والمدفوعات',
        description: 'استعرض فواتيرك، تابع المدفوعات، وقم بتحميل أو مشاركة الفواتير بسهولة.',
        icon: FileText,
        color: '#10B981',
        path: '/customer/invoices'
    },
    {
        id: 'notifications',
        title: 'الإشعارات',
        description: 'ستصلك إشعارات فورية عند تحديث حالة الإصلاح أو إصدار فاتورة جديدة. لا تفوت أي تحديث!',
        icon: Bell,
        color: '#F59E0B',
        path: '/customer/notifications'
    },
    {
        id: 'settings',
        title: 'الإعدادات',
        description: 'خصص تجربتك! غيّر كلمة المرور، تحكم في الإشعارات، واختر الثيم المناسب لك.',
        icon: Settings,
        color: '#8B5CF6',
        path: '/customer/settings'
    },
    {
        id: 'complete',
        title: 'أنت جاهز! 🎉',
        description: 'الآن أصبحت تعرف كل ما تحتاجه. إذا احتجت أي مساعدة، فريق الدعم متاح دائماً عبر الواتساب.',
        icon: CheckCircle,
        color: '#10B981',
        illustration: 'complete'
    }
];

export default function OnboardingTour({ onComplete, forceShow = false }) {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // Check if onboarding should be shown
    useEffect(() => {
        if (forceShow) {
            setIsVisible(true);
            return;
        }

        const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (!stored) {
            setIsVisible(true);
        } else {
            try {
                const data = JSON.parse(stored);
                if (data.version !== ONBOARDING_VERSION) {
                    setIsVisible(true);
                }
            } catch {
                setIsVisible(true);
            }
        }
    }, [forceShow]);

    // Handle step navigation with animation
    const goToStep = useCallback((step) => {
        if (isAnimating) return;
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentStep(step);
            setIsAnimating(false);
        }, 200);
    }, [isAnimating]);

    const nextStep = () => {
        if (currentStep < tourSteps.length - 1) {
            goToStep(currentStep + 1);
        } else {
            completeTour();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            goToStep(currentStep - 1);
        }
    };

    const skipTour = () => {
        completeTour();
    };

    const completeTour = () => {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({
            completed: true,
            version: ONBOARDING_VERSION,
            completedAt: new Date().toISOString()
        }));
        setIsVisible(false);
        onComplete?.();
    };

    const goToFeature = (path) => {
        completeTour();
        if (path) {
            navigate(path);
        }
    };

    if (!isVisible) return null;

    const step = tourSteps[currentStep];
    const Icon = step.icon;
    const progress = ((currentStep + 1) / tourSteps.length) * 100;
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === tourSteps.length - 1;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={skipTour}
            />

            {/* Tour Card */}
            <div 
                className={`
                    relative w-full max-w-md bg-card rounded-2xl shadow-2xl overflow-hidden
                    transform transition-all duration-300
                    ${isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
                `}
            >
                {/* Header Gradient */}
                <div 
                    className="h-32 relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${step.color} 0%, ${step.color}dd 100%)` }}
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/30 blur-2xl" />
                        <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-white/20 blur-2xl" />
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={skipTour}
                        className="absolute top-4 left-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                        title="تخطي الجولة"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Step Icon */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                        <div 
                            className="w-20 h-20 rounded-2xl bg-card shadow-xl flex items-center justify-center"
                            style={{ boxShadow: `0 10px 40px ${step.color}40` }}
                        >
                            <Icon className="w-10 h-10" style={{ color: step.color }} />
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                        <div 
                            className="h-full bg-white transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="pt-14 pb-6 px-6">
                    {/* Step Indicator */}
                    <div className="flex items-center justify-center gap-1.5 mb-4">
                        {tourSteps.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToStep(index)}
                                className={`
                                    h-2 rounded-full transition-all duration-300
                                    ${index === currentStep 
                                        ? 'w-6 bg-brand-blue' 
                                        : index < currentStep
                                            ? 'w-2 bg-brand-blue/50'
                                            : 'w-2 bg-muted'
                                    }
                                `}
                            />
                        ))}
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-foreground text-center mb-3">
                        {step.title}
                    </h2>

                    {/* Description */}
                    <p className="text-muted-foreground text-center leading-relaxed mb-6">
                        {step.description}
                    </p>

                    {/* Feature Link (for non-welcome/complete steps) */}
                    {step.path && (
                        <button
                            onClick={() => goToFeature(step.path)}
                            className="w-full mb-4 py-3 px-4 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-brand-blue hover:text-brand-blue transition-colors flex items-center justify-center gap-2"
                        >
                            <span>انتقل إلى {step.title}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-3">
                        {!isFirstStep && (
                            <button
                                onClick={prevStep}
                                className="flex-1 py-3 px-4 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2"
                            >
                                <ChevronRight className="w-4 h-4" />
                                السابق
                            </button>
                        )}

                        <button
                            onClick={nextStep}
                            className="flex-1 py-3 px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2"
                            style={{ 
                                background: `linear-gradient(135deg, ${step.color} 0%, ${step.color}dd 100%)`,
                                boxShadow: `0 4px 20px ${step.color}40`
                            }}
                        >
                            {isLastStep ? (
                                <>
                                    ابدأ الآن
                                    <CheckCircle className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    التالي
                                    <ChevronLeft className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>

                    {/* Skip Link */}
                    {!isLastStep && (
                        <button
                            onClick={skipTour}
                            className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            تخطي الجولة
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Hook to manage onboarding state
 */
export function useOnboarding() {
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [hasCompleted, setHasCompleted] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                setHasCompleted(data.completed && data.version === ONBOARDING_VERSION);
            } catch {
                setHasCompleted(false);
            }
        }
    }, []);

    const startTour = () => setShowOnboarding(true);
    const completeTour = () => {
        setShowOnboarding(false);
        setHasCompleted(true);
    };

    const resetTour = () => {
        localStorage.removeItem(ONBOARDING_STORAGE_KEY);
        setHasCompleted(false);
    };

    return {
        showOnboarding,
        hasCompleted,
        startTour,
        completeTour,
        resetTour
    };
}

