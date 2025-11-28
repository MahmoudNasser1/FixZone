// frontend/react-app/src/components/settings/SettingsInput.js
import React from 'react';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';

/**
 * Settings Input Component
 * Handles different input types for settings
 */
export const SettingsInput = ({
  label,
  key: settingKey,
  value,
  type = 'string',
  onChange,
  description,
  error,
  disabled = false,
  placeholder,
  validationRules,
  ...props
}) => {
  const handleChange = (e) => {
    let newValue = e.target.value;
    
    // Type conversion
    if (type === 'number') {
      newValue = parseFloat(newValue) || 0;
    } else if (type === 'boolean') {
      newValue = e.target.checked;
    }
    
    onChange(settingKey, newValue);
  };

  // Render based on type
  if (type === 'boolean') {
    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={settingKey} className="flex items-center gap-2">
            <input
              type="checkbox"
              id={settingKey}
              checked={value === true || value === 'true'}
              onChange={handleChange}
              disabled={disabled}
              className="h-4 w-4 rounded border-gray-300"
              {...props}
            />
            {label}
          </Label>
        )}
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }

  if (type === 'text') {
    return (
      <div className="space-y-2">
        {label && <Label htmlFor={settingKey}>{label}</Label>}
        <textarea
          id={settingKey}
          value={value || ''}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...props}
        />
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={settingKey}>{label}</Label>}
      <Input
        id={settingKey}
        type={type === 'number' ? 'number' : 'text'}
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        {...props}
      />
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

