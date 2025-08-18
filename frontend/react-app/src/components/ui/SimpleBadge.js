import React from 'react';

const SimpleBadge = ({ 
  children, 
  variant = 'default', 
  color, // دعم color كبديل لـ variant
  size = 'md', 
  className = '' 
}) => {
  const baseClasses = 'inline-flex items-center rounded-full font-medium';
  
  const variants = {
    default: 'bg-blue-100 text-blue-800',
    primary: 'bg-purple-100 text-purple-800',
    success: 'bg-green-100 text-green-800 border border-green-200',
    secondary: 'bg-gray-100 text-gray-800 border border-gray-200',
    destructive: 'bg-red-100 text-red-800 border border-red-200',
    danger: 'bg-red-100 text-red-800 border border-red-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200'
  };
  
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-0.5 text-sm'
  };
  
  // استخدام color كبديل لـ variant إذا تم تمريره
  const finalVariant = color || variant;
  const classes = `${baseClasses} ${variants[finalVariant]} ${sizes[size]} ${className}`;
  
  return (
    <span className={classes}>
      {children}
    </span>
  );
};

export default SimpleBadge;
