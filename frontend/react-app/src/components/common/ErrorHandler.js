import React from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { ErrorAlert } from '../ui/Alert';
import SimpleButton from '../ui/SimpleButton';

/**
 * ErrorHandler Component
 * Displays error messages with optional retry functionality
 * Replaced MUI with lightweight components for better build performance
 */
const ErrorHandler = ({ 
  error, 
  onRetry, 
  title = 'خطأ',
  message = 'حدث خطأ غير متوقع',
  showRetry = true,
  variant = 'destructive'
}) => {
  const handleRetry = () => {
    if (onRetry && typeof onRetry === 'function') {
      onRetry();
    }
  };

  const errorMessage = error?.message || message;

  return (
    <div className="w-full p-2">
      <ErrorAlert
        title={title}
        description={errorMessage}
        dismissible={false}
        className="relative"
      >
        {showRetry && onRetry && (
          <div className="mt-4">
            <SimpleButton
              onClick={handleRetry}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              إعادة المحاولة
            </SimpleButton>
          </div>
        )}
      </ErrorAlert>
    </div>
  );
};

export default ErrorHandler;

