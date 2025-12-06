// frontend/react-app/src/components/messaging/SendButton.js
// زر إرسال موحد قابل لإعادة الاستخدام

import React, { useState } from 'react';
import SimpleButton from '../ui/SimpleButton';
import ChannelSelector from './ChannelSelector';
import messagingService from '../../services/messagingService';
import apiService from '../../services/api';
import { useNotifications } from '../notifications/NotificationSystem';
import { Send, Loader2 } from 'lucide-react';

const SendButton = ({
  entityType, // 'invoice', 'repair', 'quotation', 'payment'
  entityId,
  customerId,
  recipient, // رقم الهاتف أو البريد الإلكتروني
  message, // نص الرسالة (اختياري - سيتم توليده من القالب)
  template, // اسم القالب
  variables, // متغيرات القالب
  defaultChannels = ['whatsapp'],
  onSuccess,
  onError,
  className = '',
  size = 'md',
  variant = 'default',
  showChannelSelector = true,
  disabled = false
}) => {
  const notifications = useNotifications();
  const [loading, setLoading] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState(defaultChannels);
  const [customerEmail, setCustomerEmail] = useState(null);
  const [availableChannels, setAvailableChannels] = useState(['whatsapp', 'email']);

  // جلب بيانات العميل للتحقق من البريد الإلكتروني
  React.useEffect(() => {
    const loadCustomerData = async () => {
      if (customerId && entityType === 'invoice') {
        try {
          const customerData = await apiService.getCustomer(customerId);
          const email = customerData.data?.email || customerData.data?.emailAddress || customerData.email;
          setCustomerEmail(email);
          
          // تحديث القنوات المتاحة بناءً على البيانات المتوفرة
          const channels = ['whatsapp'];
          if (email) {
            channels.push('email');
          }
          setAvailableChannels(channels);
        } catch (e) {
          console.warn('Could not load customer email:', e);
        }
      }
    };
    
    loadCustomerData();
  }, [customerId, entityType]);

  const handleSend = async () => {
    if (!entityType || !entityId || !recipient) {
      notifications.error('بيانات غير مكتملة', {
        message: 'يرجى التأكد من وجود جميع البيانات المطلوبة'
      });
      return;
    }

    if (selectedChannels.length === 0) {
      notifications.error('لم يتم اختيار قناة', {
        message: 'يرجى اختيار قناة إرسال واحدة على الأقل'
      });
      return;
    }

    // التحقق من وجود بيانات لكل قناة
    if (selectedChannels.includes('whatsapp') && !recipient) {
      notifications.error('بيانات غير مكتملة', {
        message: 'لا يوجد رقم هاتف للعميل لإرسال عبر واتساب'
      });
      return;
    }

    if (selectedChannels.includes('email')) {
      const emailToUse = customerEmail || recipient;
      if (!emailToUse || !emailToUse.includes('@')) {
        notifications.error('بيانات غير مكتملة', {
          message: 'لا يوجد بريد إلكتروني صحيح للعميل لإرسال عبر البريد الإلكتروني'
        });
        return;
      }
    }

    try {
      setLoading(true);

      let result;

      // تحديد نوع الإرسال حسب entityType
      if (entityType === 'invoice') {
        // جلب بيانات العميل للحصول على البريد الإلكتروني
        let customerEmail = null;
        if (customerId) {
          try {
            const customerData = await apiService.getCustomer(customerId);
            customerEmail = customerData.data?.email || customerData.data?.emailAddress || customerData.email;
          } catch (e) {
            console.warn('Could not load customer email:', e);
          }
        }

        result = await messagingService.sendInvoice(entityId, {
          channels: selectedChannels,
          recipient: recipient, // للواتساب
          emailRecipient: customerEmail // للبريد الإلكتروني
        });
      } else if (entityType === 'repair') {
        result = await messagingService.sendRepairNotification(
          entityId,
          template || 'repairReceivedMessage',
          {
            channels: selectedChannels,
            recipient: recipient
          }
        );
      } else if (entityType === 'quotation') {
        result = await messagingService.sendQuotation(entityId, {
          channels: selectedChannels,
          recipient: recipient
        });
      } else if (entityType === 'payment') {
        result = await messagingService.sendPaymentReminder(entityId, {
          channels: selectedChannels,
          recipient: recipient
        });
      } else {
        // إرسال مخصص
        result = await messagingService.sendMessage({
          entityType,
          entityId,
          customerId,
          channels: selectedChannels,
          recipient,
          message,
          template,
          variables
        });
      }

      if (result.success || result.data?.success) {
        const successCount = Object.values(result.data?.channels || result.channels || {})
          .filter(r => r.success).length;
        const totalCount = selectedChannels.length;

        if (successCount === totalCount) {
          notifications.success('تم الإرسال بنجاح', {
            message: `تم إرسال الرسالة عبر ${successCount} قناة بنجاح`
          });
        } else if (successCount > 0) {
          notifications.warning('إرسال جزئي', {
            message: `تم الإرسال عبر ${successCount} من ${totalCount} قناة`
          });
        }

        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        throw new Error('فشل في إرسال الرسالة');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      notifications.error('فشل الإرسال', {
        message: error.message || 'حدث خطأ أثناء إرسال الرسالة'
      });

      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // إذا كان channel selector معطل، استخدم زر بسيط
  if (!showChannelSelector) {
    return (
      <SimpleButton
        onClick={handleSend}
        disabled={disabled || loading}
        loading={loading}
        variant={variant}
        size={size}
        className={className}
        title={selectedChannels.includes('email') ? 'إرسال عبر البريد الإلكتروني' : 'إرسال عبر واتساب'}
      >
        <Send className="w-4 h-4 ml-2" />
        {loading ? 'جاري الإرسال...' : 'إرسال'}
      </SimpleButton>
    );
  }

  // زر مع channel selector
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <ChannelSelector
          selectedChannels={selectedChannels}
          onChange={setSelectedChannels}
          availableChannels={availableChannels}
          disabled={disabled || loading}
          className="flex-shrink-0"
        />
        <SimpleButton
          onClick={handleSend}
          disabled={disabled || loading || selectedChannels.length === 0}
          loading={loading}
          variant={variant}
          size={size}
          className="bg-green-600 hover:bg-green-700 text-white flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جاري الإرسال...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 ml-2" />
              إرسال
            </>
          )}
        </SimpleButton>
      </div>
      {selectedChannels.includes('email') && !customerEmail && (
        <p className="text-xs text-yellow-600">
          ⚠️ لا يوجد بريد إلكتروني للعميل - سيتم استخدام رقم الهاتف
        </p>
      )}
      {selectedChannels.includes('email') && customerEmail && (
        <p className="text-xs text-green-600">
          ✓ سيتم الإرسال إلى: {customerEmail}
        </p>
      )}
      {selectedChannels.includes('whatsapp') && recipient && (
        <p className="text-xs text-blue-600">
          ✓ سيتم الإرسال إلى: {recipient}
        </p>
      )}
    </div>
  );
};

export default SendButton;

