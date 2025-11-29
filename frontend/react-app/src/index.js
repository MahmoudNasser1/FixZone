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
    // Check if it's a 401 error from auth/settings endpoint
    const errorString = String(args[0] || '') + ' ' + (args[1] || '');
    const is401Error = errorString.includes('401') || 
                      errorString.includes('Unauthorized') ||
                      (args[0]?.response?.status === 401);
    const isAuthEndpoint = errorString.includes('/auth/') || 
                          errorString.includes('/settings') ||
                          (args[0]?.config?.url?.includes('/auth/')) ||
                          (args[0]?.config?.url?.includes('/settings'));
    const isLoginPage = window.location.pathname === '/login' || 
                        window.location.pathname === '/customer/login';
    
    // Suppress 401 errors from auth/settings endpoints or on login page
    if (is401Error && (isAuthEndpoint || isLoginPage)) {
      return; // Don't log to console
    }
    
    // Log all other errors normally
    originalError.apply(console, args);
  };
  
  console.warn = (...args) => {
    // Also suppress warnings about 401 errors
    const warnString = String(args[0] || '');
    const is401Warning = warnString.includes('401') || warnString.includes('Unauthorized');
    const isAuthEndpoint = warnString.includes('/auth/') || warnString.includes('/settings');
    
    if (is401Warning && isAuthEndpoint) {
      return; // Don't log to console
    }
    
    // Log all other warnings normally
    originalWarn.apply(console, args);
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
const Boot = () => {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  useEffect(() => { restoreSession(); }, [restoreSession]);
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
