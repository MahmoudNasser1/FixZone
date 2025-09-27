import React from 'react';

const AccessibleForm = ({ 
  children, 
  onSubmit, 
  className = '',
  ariaLabel,
  ariaDescribedBy,
  ...props 
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className={`space-y-4 ${className}`}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      role="form"
      {...props}
    >
      {children}
    </form>
  );
};

// مكون حقل إدخال محسن للوصول
export const AccessibleInput = ({ 
  label,
  id,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder,
  ariaDescribedBy,
  className = '',
  ...props 
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  
  const describedBy = [
    error ? errorId : null,
    helperText ? helperId : null,
    ariaDescribedBy
  ].filter(Boolean).join(' ');

  return (
    <div className="space-y-1">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && (
            <span className="text-red-500 mr-1" aria-label="مطلوب">*</span>
          )}
        </label>
      )}
      
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        required={required}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? 'true' : 'false'}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
        {...props}
      />
      
      {helperText && !error && (
        <p id={helperId} className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// مكون select محسن للوصول
export const AccessibleSelect = ({ 
  label,
  id,
  value,
  onChange,
  options = [],
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder = 'اختر...',
  ariaDescribedBy,
  className = '',
  ...props 
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;
  
  const describedBy = [
    error ? errorId : null,
    helperText ? helperId : null,
    ariaDescribedBy
  ].filter(Boolean).join(' ');

  return (
    <div className="space-y-1">
      {label && (
        <label 
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && (
            <span className="text-red-500 mr-1" aria-label="مطلوب">*</span>
          )}
        </label>
      )}
      
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? 'true' : 'false'}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {helperText && !error && (
        <p id={helperId} className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// مكون textarea محسن للوصول
export const AccessibleTextarea = ({ 
  label,
  id,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder,
  rows = 3,
  ariaDescribedBy,
  className = '',
  ...props 
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${textareaId}-error`;
  const helperId = `${textareaId}-helper`;
  
  const describedBy = [
    error ? errorId : null,
    helperText ? helperId : null,
    ariaDescribedBy
  ].filter(Boolean).join(' ');

  return (
    <div className="space-y-1">
      {label && (
        <label 
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && (
            <span className="text-red-500 mr-1" aria-label="مطلوب">*</span>
          )}
        </label>
      )}
      
      <textarea
        id={textareaId}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        required={required}
        rows={rows}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? 'true' : 'false'}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
        {...props}
      />
      
      {helperText && !error && (
        <p id={helperId} className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default AccessibleForm;


