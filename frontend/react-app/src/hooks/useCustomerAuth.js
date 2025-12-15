import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { isCustomerRole } from '../constants/roles';
import { useNotifications } from '../components/notifications/NotificationSystem';

/**
 * useCustomerAuth - Centralized Customer Authentication Hook
 * 
 * This hook centralizes all customer authentication logic that was 
 * previously duplicated across multiple customer pages.
 * 
 * Features:
 * - Automatic authentication check
 * - Role validation (customer role)
 * - Redirect to login if not authenticated
 * - User profile management
 * - Session monitoring
 * 
 * Usage:
 * const { user, isLoading, isCustomer, customerId } = useCustomerAuth();
 */

export default function useCustomerAuth(options = {}) {
    const {
        redirectOnFail = true,
        redirectPath = '/customer/login',
        showErrorNotification = true
    } = options;

    const navigate = useNavigate();
    const notifications = useNotifications();
    const user = useAuthStore((state) => state.user);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const logout = useAuthStore((state) => state.logout);
    const forcePasswordReset = useAuthStore((state) => state.forcePasswordReset);

    const [isLoading, setIsLoading] = useState(true);
    const [isValidated, setIsValidated] = useState(false);

    // Check if user is a customer
    const checkIsCustomer = useCallback(() => {
        if (!user) return false;
        
        const roleId = user?.roleId || user?.role;
        const numericRoleId = Number(roleId);
        
        return user.type === 'customer' || isCustomerRole(numericRoleId);
    }, [user]);

    const isCustomer = checkIsCustomer();

    // Get customer ID (handles different data structures)
    const customerId = user?.customerId || user?.id;

    // Main authentication check
    useEffect(() => {
        const validateAuth = () => {
            setIsLoading(true);

            if (!isAuthenticated || !user) {
                if (showErrorNotification && redirectOnFail) {
                    notifications.error('خطأ', { 
                        message: 'يجب تسجيل الدخول للوصول لهذه الصفحة' 
                    });
                }
                if (redirectOnFail) {
                    navigate(redirectPath);
                }
                setIsValidated(false);
                setIsLoading(false);
                return;
            }

            if (!checkIsCustomer()) {
                if (showErrorNotification && redirectOnFail) {
                    notifications.error('خطأ', { 
                        message: 'يجب تسجيل الدخول كعميل للوصول لهذه الصفحة' 
                    });
                }
                if (redirectOnFail) {
                    navigate(redirectPath);
                }
                setIsValidated(false);
                setIsLoading(false);
                return;
            }

            setIsValidated(true);
            setIsLoading(false);
        };

        validateAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, user?.id]);

    // Handle logout
    const handleLogout = useCallback(async () => {
        try {
            // Attempt to call logout API
            const api = await import('../services/api');
            await api.default.request('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.log('Logout API failed, continuing with local logout');
        }
        logout();
        navigate('/login');
    }, [logout, navigate]);

    // Get user display name
    const getUserDisplayName = useCallback(() => {
        if (!user) return 'عميل';
        return user.name?.split(' ')[0] || user.name || 'عميل';
    }, [user]);

    // Get user initials for avatar
    const getUserInitials = useCallback(() => {
        if (!user?.name) return 'م';
        const names = user.name.trim().split(' ');
        if (names.length >= 2) {
            return names[0].charAt(0) + names[names.length - 1].charAt(0);
        }
        return names[0].charAt(0);
    }, [user]);

    // Check if user needs to reset password
    const needsPasswordReset = forcePasswordReset;

    return {
        // Auth state
        user,
        isAuthenticated,
        isCustomer,
        isLoading,
        isValidated,
        customerId,
        
        // Password reset
        needsPasswordReset,
        forcePasswordReset,
        
        // User info helpers
        getUserDisplayName,
        getUserInitials,
        
        // Actions
        handleLogout,
        logout,
        
        // Navigation
        navigate
    };
}

/**
 * useCustomerAuthGuard - Lightweight version for simple auth check
 * 
 * Usage in components that just need basic auth protection:
 * const { isReady } = useCustomerAuthGuard();
 * if (!isReady) return <LoadingSpinner />;
 */
export function useCustomerAuthGuard() {
    const navigate = useNavigate();
    const notifications = useNotifications();
    const user = useAuthStore((state) => state.user);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const roleId = user?.roleId || user?.role;
        const numericRoleId = Number(roleId);
        const isCustomer = user && (user.type === 'customer' || isCustomerRole(numericRoleId));

        if (!isAuthenticated || !user || !isCustomer) {
            notifications.error('خطأ', { 
                message: 'يجب تسجيل الدخول كعميل للوصول لهذه الصفحة' 
            });
            navigate('/customer/login');
            return;
        }

        setIsReady(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { isReady, user, customerId: user?.customerId || user?.id };
}

