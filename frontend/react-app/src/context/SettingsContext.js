import React, { createContext, useContext, useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { defaultSettings, loadSettings, saveSettings, formatMoney } from '../config/settings';
import { useSettings as useSettingsAPI } from '../hooks/useSettings';

/**
 * SettingsContext - Enhanced with API support
 * 
 * This context provides:
 * 1. Local settings (from localStorage) - for backward compatibility
 * 2. API settings (from backend) - new system settings
 * 3. Unified interface for both
 */
const SettingsContext = createContext({
  // Local settings (legacy)
  localSettings: defaultSettings,
  setLocalSettings: () => {},
  
  // API settings (new system)
  apiSettings: {},
  apiLoading: false,
  apiError: null,
  
  // Unified helpers
  formatMoney: (x) => `${x}`,
  getSetting: (key) => null,
  hasSetting: (key) => false,
});

export function SettingsProvider({ children }) {
  // Local settings (legacy - for backward compatibility)
  const [localSettings, setLocalSettingsState] = useState(loadSettings());

  // API settings (new system)
  const {
    settings: apiSettings,
    loading: apiLoading,
    error: apiError,
    loadSettings: loadAPISettings,
    getSetting: getAPISetting,
    getSettingValue,
    hasSetting: hasAPISetting,
  } = useSettingsAPI();

  // Load API settings on mount (only once) - use ref to prevent infinite loop
  // Skip for public pages (like /track) that don't need settings
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    // Don't load settings on public tracking page
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/track')) {
      return;
    }
    
    if (!hasLoadedRef.current && !apiLoading) {
      hasLoadedRef.current = true;
      loadAPISettings().catch((err) => {
        // Silently fail - don't spam console
        hasLoadedRef.current = false; // Allow retry on error
        // Don't log 401 errors (user not logged in) - this is expected
        const isUnauthorized = err?.message?.includes('401') || 
                               err?.message?.includes('authorization denied') || 
                               err?.message?.includes('No token');
        if (!isUnauthorized && process.env.NODE_ENV === 'development') {
          console.warn('Failed to load API settings:', err.message);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const setLocalSettings = (updater) => {
    setLocalSettingsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveSettings(next);
      return next;
    });
  };

  /**
   * Get setting value (checks API first, then local)
   */
  const getSetting = useCallback((key) => {
    // Try API settings first
    if (hasAPISetting(key)) {
      return getSettingValue(key);
    }
    
    // Fallback to local settings
    const keys = key.split('.');
    let value = localSettings;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }
    return value;
  }, [apiSettings, localSettings, hasAPISetting, getSettingValue]);

  /**
   * Check if setting exists (checks API first, then local)
   */
  const hasSetting = useCallback((key) => {
    if (hasAPISetting(key)) {
      return true;
    }
    
    // Check local settings
    const keys = key.split('.');
    let obj = localSettings;
    for (const k of keys) {
      if (obj && typeof obj === 'object' && k in obj) {
        obj = obj[k];
      } else {
        return false;
      }
    }
    return true;
  }, [apiSettings, localSettings, hasAPISetting]);

  const value = useMemo(() => ({
    // Local settings (legacy)
    localSettings,
    setLocalSettings,
    
    // API settings (new system)
    apiSettings,
    apiLoading,
    apiError,
    loadAPISettings,
    getAPISetting,
    getAPISettingValue: getSettingValue,
    hasAPISetting,
    
    // Unified helpers
    formatMoney: (x) => formatMoney(x, localSettings),
    getSetting,
    hasSetting,
  }), [localSettings, apiSettings, apiLoading, apiError, loadAPISettings, getAPISetting, getSettingValue, hasAPISetting, getSetting, hasSetting]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * Hook to use settings context
 * 
 * @example
 * const { localSettings, apiSettings, getSetting, formatMoney } = useSettingsContext();
 */
export function useSettingsContext() {
  return useContext(SettingsContext);
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useSettingsContext or useSettings hook instead
 */
export function useSettings() {
  const context = useContext(SettingsContext);
  return {
    settings: context.localSettings,
    setSettings: context.setLocalSettings,
    formatMoney: context.formatMoney,
  };
}
