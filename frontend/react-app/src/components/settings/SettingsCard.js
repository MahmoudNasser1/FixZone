// frontend/react-app/src/components/settings/SettingsCard.js
import React from 'react';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../ui/SimpleCard';
import { SettingsInput } from './SettingsInput';
import SimpleBadge from '../ui/SimpleBadge';

/**
 * Settings Card Component
 * Displays a setting in a card format
 */
export const SettingsCard = ({
  setting,
  onUpdate,
  loading = false,
  showCategory = true,
  showType = false,
  ...props
}) => {
  const { key, value, type, category, description, isSystem, isEncrypted, validationRules } = setting;

  const handleChange = (settingKey, newValue) => {
    if (onUpdate) {
      onUpdate(settingKey, newValue);
    }
  };

  return (
    <SimpleCard {...props}>
      <SimpleCardHeader>
        <div className="flex items-center justify-between">
          <SimpleCardTitle className="text-base">{key}</SimpleCardTitle>
          <div className="flex gap-2">
            {isSystem && (
              <SimpleBadge variant="secondary" className="text-xs">نظام</SimpleBadge>
            )}
            {isEncrypted && (
              <SimpleBadge variant="outline" className="text-xs">مشفر</SimpleBadge>
            )}
            {showType && (
              <SimpleBadge variant="outline" className="text-xs">{type}</SimpleBadge>
            )}
            {showCategory && category && (
              <SimpleBadge variant="outline" className="text-xs">{category}</SimpleBadge>
            )}
          </div>
        </div>
      </SimpleCardHeader>
      <SimpleCardContent>
        <SettingsInput
          key={key}
          label={null}
          value={value}
          type={type}
          onChange={handleChange}
          description={description}
          disabled={loading || isSystem}
          validationRules={validationRules}
        />
      </SimpleCardContent>
    </SimpleCard>
  );
};

