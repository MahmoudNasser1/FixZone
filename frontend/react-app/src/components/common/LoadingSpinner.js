import React from 'react';

/**
 * LoadingSpinner Component
 * Displays a loading spinner with optional message
 * Replaced MUI with lightweight CSS-based spinner for better build performance
 */
const LoadingSpinner = ({ 
  message = 'جاري التحميل...', 
  size = 40, 
  color = 'primary',
  fullScreen = false 
}) => {
  const spinnerSize = size;
  const borderWidth = Math.max(2, Math.floor(size / 20));
  
  const content = (
    <div
      className="flex flex-col items-center justify-center gap-2 py-4"
    >
      <div
        className="border-4 border-muted border-t-brand-blue rounded-full animate-spin"
        style={{
          width: `${spinnerSize}px`,
          height: `${spinnerSize}px`,
          borderWidth: `${borderWidth}px`
        }}
      />
      {message && (
        <p className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-white/80 z-[9999]"
      >
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;

