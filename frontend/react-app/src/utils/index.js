/**
 * Utility Functions Index
 * 
 * Central export point for all utility functions
 */

// Accessibility utilities
export {
    announceToScreenReader,
    createFocusTrap,
    prefersReducedMotion,
    useReducedMotion,
    getContrastColor,
    hasAdequateContrast,
    SkipLink,
    KeyboardKeys,
    handleKeyboardActivation,
    statusAriaLabels,
    getStatusAriaLabel,
    formatNumberForSR,
    formatCurrencyForSR,
    formatDateForSR
} from './accessibility';

// i18n utilities
export {
    t,
    getCurrentLanguage,
    setLanguage,
    formatNumber,
    formatCurrency,
    formatDate,
    isRTL,
    getAvailableLanguages,
    useTranslation
} from './i18n';

