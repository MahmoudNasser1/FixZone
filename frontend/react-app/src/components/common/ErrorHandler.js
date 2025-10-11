import React from 'react';
import { Alert, AlertTitle, Button, Box } from '@mui/material';
import { RefreshCw, AlertCircle } from 'lucide-react';

/**
 * ErrorHandler Component
 * Displays error messages with optional retry functionality
 */
const ErrorHandler = ({ 
  error, 
  onRetry, 
  title = 'خطأ',
  message = 'حدث خطأ غير متوقع',
  showRetry = true,
  variant = 'outlined'
}) => {
  const handleRetry = () => {
    if (onRetry && typeof onRetry === 'function') {
      onRetry();
    }
  };

  const errorMessage = error?.message || message;

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Alert 
        severity="error" 
        variant={variant}
        icon={<AlertCircle size={20} />}
        action={
          showRetry && onRetry && (
            <Button
              color="inherit"
              size="small"
              onClick={handleRetry}
              startIcon={<RefreshCw size={16} />}
            >
              إعادة المحاولة
            </Button>
          )
        }
      >
        <AlertTitle>{title}</AlertTitle>
        {errorMessage}
      </Alert>
    </Box>
  );
};

export default ErrorHandler;

