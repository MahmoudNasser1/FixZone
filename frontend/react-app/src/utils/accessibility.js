/**
 * Accessibility Utilities for Fix Zone
 * 
 * Provides helpers for:
 * - Focus management
 * - Screen reader announcements
 * - Keyboard navigation
 * - Reduced motion preferences
 * - Color contrast
 */

/**
 * Announce a message to screen readers
 * @param {string} message - The message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export function announceToScreenReader(message, priority = 'polite') {
    const announcer = document.getElementById('sr-announcer') || createAnnouncer();
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = '';
    
    // Use setTimeout to ensure the DOM updates
    setTimeout(() => {
        announcer.textContent = message;
    }, 100);
}

function createAnnouncer() {
    const announcer = document.createElement('div');
    announcer.id = 'sr-announcer';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    `;
    document.body.appendChild(announcer);
    return announcer;
}

/**
 * Focus trap - keeps focus within a container
 * @param {HTMLElement} container - The container element
 * @returns {Function} cleanup function
 */
export function createFocusTrap(container) {
    const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeydown = (e) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    };

    container.addEventListener('keydown', handleKeydown);
    firstElement?.focus();

    return () => {
        container.removeEventListener('keydown', handleKeydown);
    };
}

/**
 * Check if user prefers reduced motion
 * @returns {boolean}
 */
export function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hook for reduced motion preference
 * @returns {boolean}
 */
export function useReducedMotion() {
    const { useState, useEffect } = require('react');
    const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion());

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        const handleChange = (e) => {
            setReducedMotion(e.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return reducedMotion;
}

/**
 * Get contrast color (black or white) based on background
 * @param {string} hexColor - Background color in hex format
 * @returns {string} '#000000' or '#ffffff'
 */
export function getContrastColor(hexColor) {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Check if colors have sufficient contrast ratio (WCAG 2.1)
 * @param {string} foreground - Foreground color in hex
 * @param {string} background - Background color in hex
 * @param {string} level - 'AA' or 'AAA'
 * @returns {boolean}
 */
export function hasAdequateContrast(foreground, background, level = 'AA') {
    const getLuminance = (hex) => {
        const rgb = hex.replace('#', '')
            .match(/.{2}/g)
            .map(x => parseInt(x, 16) / 255)
            .map(x => x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
        return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    const minimumRatio = level === 'AAA' ? 7 : 4.5;
    return ratio >= minimumRatio;
}

/**
 * Skip link component for keyboard navigation
 */
export function SkipLink({ targetId = 'main-content', text = 'تخطي إلى المحتوى الرئيسي' }) {
    const React = require('react');
    
    const handleClick = (e) => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
            target.tabIndex = -1;
            target.focus();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return React.createElement('a', {
        href: `#${targetId}`,
        onClick: handleClick,
        className: `
            sr-only focus:not-sr-only
            fixed top-0 left-1/2 -translate-x-1/2 z-[9999]
            bg-brand-blue text-white px-4 py-2 rounded-b-lg
            font-medium text-sm
            focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-blue
        `
    }, text);
}

/**
 * Keyboard navigation helpers
 */
export const KeyboardKeys = {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End'
};

/**
 * Handle keyboard activation (Enter/Space)
 * @param {Function} callback - Function to call on activation
 * @returns {Function} Event handler
 */
export function handleKeyboardActivation(callback) {
    return (e) => {
        if (e.key === KeyboardKeys.ENTER || e.key === KeyboardKeys.SPACE) {
            e.preventDefault();
            callback(e);
        }
    };
}

/**
 * ARIA labels for common status values
 */
export const statusAriaLabels = {
    pending: 'في انتظار المراجعة',
    in_progress: 'قيد التنفيذ',
    'waiting-parts': 'في انتظار قطع الغيار',
    'ready-for-pickup': 'جاهز للاستلام',
    completed: 'مكتمل',
    delivered: 'تم التسليم',
    cancelled: 'ملغي',
    paid: 'مدفوعة',
    unpaid: 'غير مدفوعة',
    overdue: 'متأخرة'
};

/**
 * Get accessible status description
 * @param {string} status - Status value
 * @param {string} context - Additional context (e.g., 'طلب الإصلاح')
 * @returns {string}
 */
export function getStatusAriaLabel(status, context = '') {
    const label = statusAriaLabels[status] || status;
    return context ? `${context}: ${label}` : label;
}

/**
 * Format number for screen readers (Arabic)
 * @param {number} num - Number to format
 * @returns {string}
 */
export function formatNumberForSR(num) {
    return new Intl.NumberFormat('ar-EG').format(num);
}

/**
 * Format currency for screen readers (Arabic, EGP)
 * @param {number} amount - Amount to format
 * @returns {string}
 */
export function formatCurrencyForSR(amount) {
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP'
    }).format(amount);
}

/**
 * Format date for screen readers (Arabic)
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export function formatDateForSR(date) {
    const d = new Date(date);
    return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(d);
}

