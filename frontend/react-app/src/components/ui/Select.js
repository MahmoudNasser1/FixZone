import React, { useState, useRef, useEffect, createContext, useContext, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

// Select Context
const SelectContext = createContext();

// Main Select Component
export const Select = ({ 
  children, 
  value, 
  onValueChange, 
  onChange, 
  options = [], 
  disabled = false, 
  className = '',
  id,
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || '');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [optionLabels, setOptionLabels] = useState(new Map());
  const selectRef = useRef(null);

  // Find the selected option label
  useEffect(() => {
    const selectedOption = options.find(option => option.value === value);
    if (selectedOption) {
      setSelectedLabel(selectedOption.label);
    } else if (optionLabels.has(value)) {
      setSelectedLabel(optionLabels.get(value));
    } else {
      setSelectedLabel('');
    }
  }, [value, options, optionLabels]);

  useEffect(() => {
    setSelectedValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleValueChange = (newValue, label) => {
    setSelectedValue(newValue);
    setSelectedLabel(label);
    setIsOpen(false);
    
    // Support both onValueChange and onChange for compatibility
    onValueChange?.(newValue);
    onChange?.({ target: { value: newValue } });
  };

  const registerOptionLabel = useCallback((value, label) => {
    setOptionLabels(prev => {
      const newMap = new Map(prev);
      newMap.set(value, label);
      return newMap;
    });
  }, []);

  // If options are provided, render a simple dropdown
  if (options.length > 0) {
    return (
      <div ref={selectRef} className="relative">
        <button
          type="button"
          id={id}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            "dark:border-gray-700 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus:ring-blue-400",
            className
          )}
          {...props}
        >
          <span className={cn(
            "block truncate text-right",
            !selectedValue && "text-gray-500 dark:text-gray-400"
          )}>
            {selectedLabel || 'اختر قيمة...'}
          </span>
          <ChevronDown className={cn(
            "h-4 w-4 opacity-50 transition-transform",
            isOpen && "rotate-180"
          )} />
        </button>
        
        {isOpen && (
          <div className={cn(
            "absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg",
            "dark:border-gray-700 dark:bg-gray-800"
          )}>
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleValueChange(option.value, option.label)}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100",
                  "dark:hover:bg-gray-700 dark:focus:bg-gray-700",
                  selectedValue === option.value && "bg-gray-100 dark:bg-gray-700"
                )}
              >
                <span className="flex-1 text-right">{option.label}</span>
                {selectedValue === option.value && (
                  <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Original compound component behavior
  return (
    <SelectContext.Provider
      value={{
        isOpen,
        setIsOpen,
        selectedValue,
        selectedLabel,
        handleValueChange,
        registerOptionLabel,
        disabled
      }}
    >
      <div ref={selectRef} className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

// Select Trigger
export const SelectTrigger = ({ children, className, ...props }) => {
  const { isOpen, setIsOpen, disabled } = useContext(SelectContext);

  return (
    <button
      type="button"
      onClick={() => !disabled && setIsOpen(!isOpen)}
      disabled={disabled}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        "dark:border-gray-700 dark:bg-gray-800 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus:ring-blue-400",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className={cn(
        "h-4 w-4 opacity-50 transition-transform",
        isOpen && "rotate-180"
      )} />
    </button>
  );
};

// Select Value
export const SelectValue = ({ placeholder = "اختر قيمة..." }) => {
  const { selectedValue, selectedLabel } = useContext(SelectContext);

  return (
    <span className={cn(
      "block truncate text-right",
      !selectedValue && "text-gray-500 dark:text-gray-400"
    )}>
      {selectedLabel || placeholder}
    </span>
  );
};

// Select Content
export const SelectContent = ({ children, className }) => {
  const { isOpen } = useContext(SelectContext);

  if (!isOpen) return null;

  return (
    <div className={cn(
      "absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg",
      "dark:border-gray-700 dark:bg-gray-800",
      className
    )}>
      {children}
    </div>
  );
};

// Select Item
export const SelectItem = ({ children, value, className }) => {
  const { selectedValue, handleValueChange, registerOptionLabel } = useContext(SelectContext);
  const isSelected = selectedValue === value;

  // Register the option label when component mounts
  useEffect(() => {
    registerOptionLabel(value, children);
  }, [value, children, registerOptionLabel]);

  const handleClick = () => {
    handleValueChange(value, children);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100",
        "dark:hover:bg-gray-700 dark:focus:bg-gray-700",
        isSelected && "bg-gray-100 dark:bg-gray-700",
        className
      )}
    >
      <span className="flex-1 text-right">{children}</span>
      {isSelected && (
        <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      )}
    </div>
  );
};

export default Select;
