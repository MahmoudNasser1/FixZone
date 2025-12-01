import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { getAuthBaseUrl } from '../lib/apiConfig';

const useAuthStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      forcePasswordReset: false,

      login: async (loginIdentifier, password) => {
        try {
          const AUTH_URL = getAuthBaseUrl();
          // Configure axios to send credentials (cookies) with every request
          axios.defaults.withCredentials = true;

          const response = await axios.post(`${AUTH_URL}/login`, {
            loginIdentifier,
            password,
          });

          // The backend now sends user info directly, not a token.
          const userData = response.data;
          
          // Ensure roleId is set for frontend (check both role and roleId)
          if (!userData.roleId && userData.role) {
            userData.roleId = userData.role;
          } else if (!userData.role && userData.roleId) {
            userData.role = userData.roleId;
          }

          const resetRequired = Boolean(userData.forcePasswordReset);
          set({ isAuthenticated: true, user: userData, token: null, forcePasswordReset: resetRequired }); // Token is in httpOnly cookie
        } catch (error) {
          console.error('Login failed:', error.response ? error.response.data : error.message);
          // Optionally, you can throw the error to be caught in the component
          throw new Error(error.response?.data?.message || 'Login failed');
        }
      },

      // Restore session using /auth/me
      restoreSession: async () => {
        const AUTH_URL = getAuthBaseUrl();
        try {
          axios.defaults.withCredentials = true;
          const response = await axios.get(`${AUTH_URL}/me`);
          const userData = response.data;
          
          // Ensure roleId is set for frontend (check both role and roleId)
          if (!userData.roleId && userData.role) {
            userData.roleId = userData.role;
          } else if (!userData.role && userData.roleId) {
            userData.role = userData.roleId;
          }
          
          const resetRequired = Boolean(userData.forcePasswordReset);
          set({ isAuthenticated: true, user: userData, token: null, forcePasswordReset: resetRequired });
          return true;
        } catch (error) {
          // Silently fail if 401 (no token) - this is expected when user is not logged in
          // Only log other errors
          if (error.response?.status !== 401) {
            console.error('Error restoring session:', error);
          }
          set({ isAuthenticated: false, user: null, token: null });
          return false;
        }
      },

      logout: async () => {
        try {
          const AUTH_URL = getAuthBaseUrl();
          axios.defaults.withCredentials = true;
          await axios.post(`${AUTH_URL}/logout`);
        } catch (_e) {}
        set({ isAuthenticated: false, user: null, token: null, forcePasswordReset: false });
      },
      markPasswordResetComplete: () => {
        set({ forcePasswordReset: false });
      },
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
    }
  )
);

// Add an interceptor to include the token in all future requests
axios.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

// Add response interceptor to suppress 401 errors in console
// Note: Network tab will still show 401 errors (this is normal browser behavior)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Suppress 401 errors from console (expected when user is not logged in)
    if (error.response?.status === 401) {
      // Check if it's an auth endpoint or settings endpoint
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/') || url.includes('/settings');
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const isLoginPage = currentPath === '/login' || currentPath === '/customer/login';
      const isPublicPage = currentPath.startsWith('/track'); // Public tracking page
      
      // Suppress if it's auth/settings endpoint on login page or public pages
      if (isAuthEndpoint && (isLoginPage || isPublicPage)) {
        // Mark error as silent to prevent console logging
        error.silent = true;
        // Prevent axios from logging to console by overriding config
        if (error.config) {
          error.config.silent = true;
        }
        // Suppress the error - don't log to console
        return Promise.reject(error);
      }
    }
    // For other errors, let them through (they will be logged normally)
    return Promise.reject(error);
  }
);

export default useAuthStore;
