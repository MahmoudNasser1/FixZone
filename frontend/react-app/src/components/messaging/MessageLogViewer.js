// frontend/react-app/src/components/messaging/MessageLogViewer.js
// مكون لعرض سجل المراسلات

import React, { useState, useEffect } from 'react';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../ui/SimpleCard';
import SimpleButton from '../ui/SimpleButton';
import SimpleBadge from '../ui/SimpleBadge';
import MessageStatusBadge from './MessageStatusBadge';
import messagingService from '../../services/messagingService';
import { useNotifications } from '../notifications/NotificationSystem';
import { 
  MessageSquare, Mail, RefreshCw, Eye, RotateCw, 
  Calendar, User, FileText, AlertCircle, CheckCircle
} from 'lucide-react';

const MessageLogViewer = ({
  entityType,
  entityId,
  customerId,
  onMessageClick,
  showRetry = true,
  limit = 10
}) => {
  const notifications = useNotifications();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(null);

  useEffect(() => {
    loadLogs();
  }, [entityType, entityId, customerId]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const filters = {};
      
      if (entityType) filters.entityType = entityType;
      if (entityId) filters.entityId = entityId;
      if (customerId) filters.customerId = customerId;

      const result = await messagingService.getMessageLogs(filters, {
        limit: limit,
        offset: 0
      });

      setLogs(result.logs || []);
    } catch (error) {
      console.error('Error loading message logs:', error);
      notifications.error('فشل في تحميل السجل', {
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (logId) => {
    try {
      setRetrying(logId);
      await messagingService.retryMessage(logId);
      
      notifications.success('تم إعادة المحاولة', {
        message: 'سيتم إرسال الرسالة مرة أخرى'
      });

      // إعادة تحميل السجل
      await loadLogs();
    } catch (error) {
      console.error('Error retrying message:', error);
      notifications.error('فشلت إعادة المحاولة', {
        message: error.message
      });
    } finally {
      setRetrying(null);
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'whatsapp':
        return MessageSquare;
      case 'email':
        return Mail;
      default:
        return FileText;
    }
  };

  const formatDate = (date) => {
    if (!date) return 'غير محدد';
    try {
      return new Date(date).toLocaleString('ar-EG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'تاريخ غير صحيح';
    }
  };

  if (loading) {
    return (
      <SimpleCard>
        <SimpleCardContent className="py-8">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
            <p className="text-gray-500">جاري تحميل السجل...</p>
          </div>
        </SimpleCardContent>
      </SimpleCard>
    );
  }

  if (logs.length === 0) {
    return (
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-5 h-5 ml-2" />
              سجل المراسلات
            </div>
            <SimpleButton
              variant="ghost"
              size="sm"
              onClick={loadLogs}
            >
              <RefreshCw className="w-4 h-4" />
            </SimpleButton>
          </SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد رسائل مسجلة</p>
          </div>
        </SimpleCardContent>
      </SimpleCard>
    );
  }

  return (
    <SimpleCard>
      <SimpleCardHeader>
        <SimpleCardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="w-5 h-5 ml-2" />
            سجل المراسلات ({logs.length})
          </div>
          <SimpleButton
            variant="ghost"
            size="sm"
            onClick={loadLogs}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </SimpleButton>
        </SimpleCardTitle>
      </SimpleCardHeader>
      <SimpleCardContent>
        <div className="space-y-3">
          {logs.map((log) => {
            const ChannelIcon = getChannelIcon(log.channel);

            return (
              <div
                key={log.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ChannelIcon className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {log.channel === 'whatsapp' ? 'واتساب' : 
                           log.channel === 'email' ? 'بريد إلكتروني' : 
                           log.channel}
                        </span>
                        <MessageStatusBadge status={log.status} />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        إلى: {log.recipient}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {showRetry && log.status === 'failed' && (
                      <SimpleButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRetry(log.id)}
                        disabled={retrying === log.id}
                        title="إعادة المحاولة"
                      >
                        <RotateCw className={`w-4 h-4 ${retrying === log.id ? 'animate-spin' : ''}`} />
                      </SimpleButton>
                    )}
                    {onMessageClick && (
                      <SimpleButton
                        variant="ghost"
                        size="sm"
                        onClick={() => onMessageClick(log)}
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-4 h-4" />
                      </SimpleButton>
                    )}
                  </div>
                </div>

                {log.message && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                    {log.message.length > 100 
                      ? `${log.message.substring(0, 100)}...` 
                      : log.message}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  {log.sentAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>أرسل: {formatDate(log.sentAt)}</span>
                    </div>
                  )}
                  {log.deliveredAt && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      <span>سلم: {formatDate(log.deliveredAt)}</span>
                    </div>
                  )}
                  {log.readAt && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Eye className="w-3 h-3" />
                      <span>قرأ: {formatDate(log.readAt)}</span>
                    </div>
                  )}
                </div>

                {log.errorMessage && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{log.errorMessage}</span>
                  </div>
                )}

                {log.retryCount > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    عدد المحاولات: {log.retryCount}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SimpleCardContent>
    </SimpleCard>
  );
};

export default MessageLogViewer;

