/**
 * i18n - Internationalization utilities for Fix Zone
 * 
 * Features:
 * - Arabic (default) and English support
 * - RTL/LTR switching
 * - Number and date formatting
 * - Persistent language preference
 */

// Default translations
const translations = {
    ar: {
        // Common
        common: {
            loading: 'جاري التحميل...',
            save: 'حفظ',
            cancel: 'إلغاء',
            delete: 'حذف',
            edit: 'تعديل',
            search: 'بحث',
            filter: 'تصفية',
            all: 'الكل',
            none: 'لا يوجد',
            yes: 'نعم',
            no: 'لا',
            confirm: 'تأكيد',
            back: 'رجوع',
            next: 'التالي',
            previous: 'السابق',
            submit: 'إرسال',
            close: 'إغلاق',
            view: 'عرض',
            download: 'تحميل',
            share: 'مشاركة',
            print: 'طباعة'
        },

        // Navigation
        nav: {
            dashboard: 'لوحة التحكم',
            repairs: 'طلبات الإصلاح',
            invoices: 'الفواتير',
            devices: 'أجهزتي',
            profile: 'الملف الشخصي',
            settings: 'الإعدادات',
            notifications: 'الإشعارات',
            help: 'المساعدة',
            logout: 'تسجيل الخروج'
        },

        // Status
        status: {
            pending: 'قيد الانتظار',
            in_progress: 'قيد التنفيذ',
            'waiting-parts': 'بانتظار قطع غيار',
            'ready-for-pickup': 'جاهز للاستلام',
            completed: 'مكتمل',
            delivered: 'تم التسليم',
            cancelled: 'ملغي',
            paid: 'مدفوعة',
            unpaid: 'غير مدفوعة',
            overdue: 'متأخرة'
        },

        // Repairs
        repairs: {
            title: 'طلبات الإصلاح',
            newRepair: 'طلب إصلاح جديد',
            trackRepair: 'تتبع الطلب',
            repairDetails: 'تفاصيل الطلب',
            deviceType: 'نوع الجهاز',
            brand: 'العلامة التجارية',
            model: 'الموديل',
            issue: 'المشكلة',
            estimatedCost: 'التكلفة المتوقعة',
            actualCost: 'التكلفة الفعلية',
            technician: 'الفني المسؤول',
            receivedDate: 'تاريخ الاستلام',
            expectedDate: 'التاريخ المتوقع',
            noRepairs: 'لا توجد طلبات إصلاح'
        },

        // Invoices
        invoices: {
            title: 'الفواتير',
            invoiceNumber: 'رقم الفاتورة',
            amount: 'المبلغ',
            dueDate: 'تاريخ الاستحقاق',
            payNow: 'ادفع الآن',
            downloadPDF: 'تحميل PDF',
            noInvoices: 'لا توجد فواتير'
        },

        // Profile
        profile: {
            title: 'الملف الشخصي',
            fullName: 'الاسم الكامل',
            email: 'البريد الإلكتروني',
            phone: 'رقم الهاتف',
            address: 'العنوان',
            updateProfile: 'تحديث البيانات'
        },

        // Auth
        auth: {
            login: 'تسجيل الدخول',
            logout: 'تسجيل الخروج',
            email: 'البريد الإلكتروني',
            password: 'كلمة المرور',
            forgotPassword: 'نسيت كلمة المرور؟',
            rememberMe: 'تذكرني'
        },

        // Notifications
        notifications: {
            title: 'الإشعارات',
            markAllRead: 'تعيين الكل كمقروء',
            noNotifications: 'لا توجد إشعارات',
            new: 'جديد'
        },

        // Errors
        errors: {
            generic: 'حدث خطأ غير متوقع',
            network: 'فشل الاتصال بالخادم',
            unauthorized: 'غير مصرح بالوصول',
            notFound: 'غير موجود',
            validation: 'يرجى التحقق من البيانات المدخلة'
        },

        // Success messages
        success: {
            saved: 'تم الحفظ بنجاح',
            updated: 'تم التحديث بنجاح',
            deleted: 'تم الحذف بنجاح',
            sent: 'تم الإرسال بنجاح'
        }
    },

    en: {
        // Common
        common: {
            loading: 'Loading...',
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            search: 'Search',
            filter: 'Filter',
            all: 'All',
            none: 'None',
            yes: 'Yes',
            no: 'No',
            confirm: 'Confirm',
            back: 'Back',
            next: 'Next',
            previous: 'Previous',
            submit: 'Submit',
            close: 'Close',
            view: 'View',
            download: 'Download',
            share: 'Share',
            print: 'Print'
        },

        // Navigation
        nav: {
            dashboard: 'Dashboard',
            repairs: 'Repairs',
            invoices: 'Invoices',
            devices: 'My Devices',
            profile: 'Profile',
            settings: 'Settings',
            notifications: 'Notifications',
            help: 'Help',
            logout: 'Logout'
        },

        // Status
        status: {
            pending: 'Pending',
            in_progress: 'In Progress',
            'waiting-parts': 'Waiting for Parts',
            'ready-for-pickup': 'Ready for Pickup',
            completed: 'Completed',
            delivered: 'Delivered',
            cancelled: 'Cancelled',
            paid: 'Paid',
            unpaid: 'Unpaid',
            overdue: 'Overdue'
        },

        // Repairs
        repairs: {
            title: 'Repair Requests',
            newRepair: 'New Repair Request',
            trackRepair: 'Track Repair',
            repairDetails: 'Repair Details',
            deviceType: 'Device Type',
            brand: 'Brand',
            model: 'Model',
            issue: 'Issue',
            estimatedCost: 'Estimated Cost',
            actualCost: 'Actual Cost',
            technician: 'Technician',
            receivedDate: 'Received Date',
            expectedDate: 'Expected Date',
            noRepairs: 'No repair requests'
        },

        // Invoices
        invoices: {
            title: 'Invoices',
            invoiceNumber: 'Invoice Number',
            amount: 'Amount',
            dueDate: 'Due Date',
            payNow: 'Pay Now',
            downloadPDF: 'Download PDF',
            noInvoices: 'No invoices'
        },

        // Profile
        profile: {
            title: 'Profile',
            fullName: 'Full Name',
            email: 'Email',
            phone: 'Phone',
            address: 'Address',
            updateProfile: 'Update Profile'
        },

        // Auth
        auth: {
            login: 'Login',
            logout: 'Logout',
            email: 'Email',
            password: 'Password',
            forgotPassword: 'Forgot Password?',
            rememberMe: 'Remember Me'
        },

        // Notifications
        notifications: {
            title: 'Notifications',
            markAllRead: 'Mark All as Read',
            noNotifications: 'No notifications',
            new: 'New'
        },

        // Errors
        errors: {
            generic: 'An unexpected error occurred',
            network: 'Failed to connect to server',
            unauthorized: 'Unauthorized access',
            notFound: 'Not found',
            validation: 'Please check your input'
        },

        // Success messages
        success: {
            saved: 'Saved successfully',
            updated: 'Updated successfully',
            deleted: 'Deleted successfully',
            sent: 'Sent successfully'
        }
    }
};

// Language storage key
const LANGUAGE_STORAGE_KEY = 'fixzone_language';

/**
 * Get current language from storage or default
 */
export function getCurrentLanguage() {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'ar';
    }
    return 'ar';
}

/**
 * Set language and persist to storage
 */
export function setLanguage(lang) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
        
        // Update document direction and lang
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
        
        // Trigger custom event for components to update
        window.dispatchEvent(new CustomEvent('languagechange', { detail: { language: lang } }));
    }
}

/**
 * Get translation by key path
 * @param {string} keyPath - Dot-separated key path (e.g., 'common.loading')
 * @param {string} lang - Language code (default: current language)
 * @returns {string}
 */
export function t(keyPath, lang = getCurrentLanguage()) {
    const keys = keyPath.split('.');
    let value = translations[lang];
    
    for (const key of keys) {
        if (value && typeof value === 'object') {
            value = value[key];
        } else {
            // Fallback to Arabic if key not found
            value = keys.reduce((obj, k) => obj?.[k], translations.ar);
            break;
        }
    }
    
    return value || keyPath;
}

/**
 * Format number based on current language
 */
export function formatNumber(num, lang = getCurrentLanguage()) {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(num);
}

/**
 * Format currency based on current language
 */
export function formatCurrency(amount, lang = getCurrentLanguage()) {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
        style: 'currency',
        currency: 'EGP'
    }).format(amount);
}

/**
 * Format date based on current language
 */
export function formatDate(date, lang = getCurrentLanguage(), options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    
    return new Intl.DateTimeFormat(
        lang === 'ar' ? 'ar-EG' : 'en-US',
        { ...defaultOptions, ...options }
    ).format(new Date(date));
}

/**
 * Check if current language is RTL
 */
export function isRTL(lang = getCurrentLanguage()) {
    return lang === 'ar';
}

/**
 * Get all available languages
 */
export function getAvailableLanguages() {
    return [
        { code: 'ar', name: 'العربية', dir: 'rtl' },
        { code: 'en', name: 'English', dir: 'ltr' }
    ];
}

/**
 * React hook for using translations
 */
export function useTranslation() {
    const React = require('react');
    const [lang, setLang] = React.useState(getCurrentLanguage());

    React.useEffect(() => {
        const handleLanguageChange = (e) => {
            setLang(e.detail.language);
        };

        window.addEventListener('languagechange', handleLanguageChange);
        return () => window.removeEventListener('languagechange', handleLanguageChange);
    }, []);

    return {
        t: (key) => t(key, lang),
        lang,
        setLanguage,
        isRTL: isRTL(lang),
        formatNumber: (num) => formatNumber(num, lang),
        formatCurrency: (amount) => formatCurrency(amount, lang),
        formatDate: (date, options) => formatDate(date, lang, options)
    };
}

export default {
    t,
    getCurrentLanguage,
    setLanguage,
    formatNumber,
    formatCurrency,
    formatDate,
    isRTL,
    getAvailableLanguages,
    useTranslation
};

