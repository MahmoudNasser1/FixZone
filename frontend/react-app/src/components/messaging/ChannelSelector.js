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
        <Settings className="w-4 h-4 text-gray-600" />
        {selectedChannels.length > 0 && (
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
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
          <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-2 border-b border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">اختر القناة</span>
                <div className="flex gap-1">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    الكل
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={handleDeselectAll}
                    className="text-xs text-red-600 hover:text-red-700"
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">{channelLabels[channel]}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>
            {selectedChannels.length === 0 && (
              <div className="p-2 border-t border-gray-200">
                <p className="text-xs text-red-600 text-center">
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

