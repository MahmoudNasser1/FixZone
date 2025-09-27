import React from 'react';
import SimpleButton from '../ui/SimpleButton';

const AccessibleButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  loading = false,
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaControls,
  role = 'button',
  tabIndex = 0,
  onKeyDown,
  className = '',
  ...props 
}) => {
  
  const handleKeyDown = (event) => {
    // تفعيل الزر عند الضغط على Enter أو Space
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!disabled && !loading && onClick) {
        onClick(event);
      }
    }
    
    // استدعاء onKeyDown المخصص إذا كان موجوداً
    if (onKeyDown) {
      onKeyDown(event);
    }
  };

  return (
    <SimpleButton
      onClick={onClick}
      disabled={disabled || loading}
      className={`focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      role={role}
      tabIndex={tabIndex}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="sr-only">جاري التحميل...</span>
      )}
      {children}
    </SimpleButton>
  );
};

export default AccessibleButton;


