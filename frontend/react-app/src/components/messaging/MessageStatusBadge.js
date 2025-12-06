// frontend/react-app/src/components/messaging/MessageStatusBadge.js
// Badge لعرض حالة الرسالة

import React from 'react';
import SimpleBadge from '../ui/SimpleBadge';
import { CheckCircle, XCircle, Clock, Mail, Eye } from 'lucide-react';

const MessageStatusBadge = ({ status, showIcon = true }) => {
  const statusConfig = {
    pending: {
      variant: 'secondary',
      text: 'قيد الانتظار',
      icon: Clock,
      color: 'text-gray-600'
    },
    sent: {
      variant: 'success',
      text: 'تم الإرسال',
      icon: Mail,
      color: 'text-green-600'
    },
    delivered: {
      variant: 'success',
      text: 'تم التسليم',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    failed: {
      variant: 'destructive',
      text: 'فشل الإرسال',
      icon: XCircle,
      color: 'text-red-600'
    },
    read: {
      variant: 'success',
      text: 'تم القراءة',
      icon: Eye,
      color: 'text-blue-600'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <SimpleBadge variant={config.variant} className="flex items-center gap-1">
      {showIcon && <Icon className="w-3 h-3" />}
      {config.text}
    </SimpleBadge>
  );
};

export default MessageStatusBadge;

