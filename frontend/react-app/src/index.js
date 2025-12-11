import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import useAuthStore from './stores/authStore';
import reportWebVitals from './reportWebVitals';

// Suppress 401 errors in console for auth/settings endpoints
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = (...args) => {
    // Check if it's a 401 or 403 error from auth/settings endpoint
    const errorString = String(args[0] || '') + ' ' + (args[1] || '');
    const is401Error = errorString.includes('401') || 
                      errorString.includes('Unauthorized') ||
                      (args[0]?.response?.status === 401);
    const is403Error = errorString.includes('403') || 
                      errorString.includes('Forbidden') ||
                      errorString.includes('Access denied') ||
                      errorString.includes('Insufficient permissions') ||
                      (args[0]?.response?.status === 403);
    const isAuthEndpoint = errorString.includes('/auth/') || 
                          errorString.includes('/settings') ||
                          (args[0]?.config?.url?.includes('/auth/')) ||
                          (args[0]?.config?.url?.includes('/settings'));
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath === '/login' || currentPath === '/customer/login';
    const isPublicPage = currentPath.startsWith('/track'); // Public tracking page
    
    // Suppress 401/403 errors from auth/settings endpoints
    if ((is401Error || is403Error) && isAuthEndpoint) {
      return; // Don't log to console
    }
    
    // Log all other errors normally
    originalError.apply(console, args);
  };
  
  console.warn = (...args) => {
    // Also suppress warnings about 401/403 errors
    const warnString = String(args[0] || '');
    const is401Warning = warnString.includes('401') || warnString.includes('Unauthorized');
    const is403Warning = warnString.includes('403') || 
                        warnString.includes('Forbidden') ||
                        warnString.includes('Access denied') ||
                        warnString.includes('Insufficient permissions');
    const isAuthEndpoint = warnString.includes('/auth/') || warnString.includes('/settings');
    
    if ((is401Warning || is403Warning) && isAuthEndpoint) {
      return; // Don't log to console
    }
    
    // Log all other warnings normally
    originalWarn.apply(console, args);
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
const Boot = () => {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  useEffect(() => {
    // Don't restore session on public pages (like /track) that don't need authentication
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/track')) {
      return;
    }
    restoreSession();
  }, [restoreSession]);
  return <App />;
};

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Boot />
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
