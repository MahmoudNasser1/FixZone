// frontend/react-app/src/components/messaging/ChannelSelector.js
// مكون لاختيار قناة الإرسال

import React, { useState } from 'react';
import SimpleButton from '../ui/SimpleButton';
import { Settings, MessageSquare, Mail, Check } from 'lucide-react';

const ChannelSelector = ({ 
  selectedChannels = ['whatsapp'], 
  onChange, 
  availableChannels = ['whatsapp', 'email'],
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const channelLabels = {
    whatsapp: 'واتساب',
    email: 'بريد إلكتروني',
    sms: 'رسالة نصية'
  };

  const channelIcons = {
    whatsapp: MessageSquare,
    email: Mail,
    sms: MessageSquare
  };

  const toggleChannel = (channel) => {
    if (disabled) return;

    const newChannels = selectedChannels.includes(channel)
      ? selectedChannels.filter(c => c !== channel)
      : [...selectedChannels, channel];

    if (onChange) {
      onChange(newChannels);
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    if (onChange) {
      onChange([...availableChannels]);
    }
  };

  const handleDeselectAll = () => {
    if (disabled) return;
    if (onChange) {
      onChange([]);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <SimpleButton
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-2 py-1.5"
        title="اختر قناة الإرسال"
      >
        <Settings className="w-4 h-4 text-muted-foreground" />
        {selectedChannels.length > 0 && (
          <span className="bg-primary/10 text-primary text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
            {selectedChannels.length}
          </span>
        )}
      </SimpleButton>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-56 bg-popover rounded-lg shadow-lg border border-border z-20">
            <div className="p-2 border-b border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-popover-foreground">اختر القناة</span>
                <div className="flex gap-1">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    الكل
                  </button>
                  <span className="text-border">|</span>
                  <button
                    onClick={handleDeselectAll}
                    className="text-xs text-destructive hover:text-destructive/80"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
            <div className="p-2">
              {availableChannels.map(channel => {
                const Icon = channelIcons[channel];
                const isSelected = selectedChannels.includes(channel);

                return (
                  <button
                    key={channel}
                    onClick={() => toggleChannel(channel)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent transition-colors ${
                      isSelected ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-popover-foreground">{channelLabels[channel]}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
            {selectedChannels.length === 0 && (
              <div className="p-2 border-t border-border">
                <p className="text-xs text-destructive text-center">
                  يجب اختيار قناة واحدة على الأقل
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ChannelSelector;

