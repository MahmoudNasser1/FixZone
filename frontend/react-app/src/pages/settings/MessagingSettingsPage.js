import React, { useState, useEffect } from 'react';
import { Save, Send } from 'lucide-react';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import api from '../../services/api';

export default function MessagingSettingsPage() {
    const notifications = useNotifications();
    const [saving, setSaving] = useState(false);
    const [messagingSettings, setMessagingSettings] = useState({
        whatsapp: {
            enabled: true,
            apiEnabled: false,
            apiUrl: '',
            apiToken: '',
            webEnabled: true,
            defaultMessage: 'مرحباً {customerName}، فاتورتك رقم #{invoiceId} جاهزة بمبلغ {amount} {currency}. يمكنك تحميلها من: {invoiceLink}'
        },
        email: {
            enabled: false,
            smtpHost: '',
            smtpPort: 587,
            smtpUser: '',
            smtpPassword: '',
            fromEmail: '',
            fromName: 'Fix Zone ERP',
            defaultSubject: 'فاتورة #{invoiceId} - Fix Zone',
            defaultTemplate: `مرحباً {customerName},

نرسل لك فاتورة الإصلاح رقم #{invoiceId}

تفاصيل الفاتورة:
- المبلغ الإجمالي: {amount} {currency}
- تاريخ الإصدار: {issueDate}
- حالة الدفع: {status}

يمكنك تحميل الفاتورة من الرابط التالي:
{invoiceLink}

شكراً لتعاملكم معنا
فريق Fix Zone`
        }
    });

    useEffect(() => {
        let mounted = true;
        const loadSettings = async () => {
            try {
                const item = await api.getSystemSetting('messaging_settings');
                if (mounted && item && item.value) {
                    const parsed = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
                    setMessagingSettings(prev => ({
                        ...prev,
                        ...parsed
                    }));
                }
            } catch (error) {
                console.error('Error loading messaging settings:', error);
            }
        };
        loadSettings();
        return () => { mounted = false; };
    }, []);

    const handleMessagingChange = (section, field, value) => {
        setMessagingSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleMessagingSave = async () => {
        try {
            setSaving(true);
            await api.createSystemSetting({
                key: 'messaging_settings',
                value: JSON.stringify(messagingSettings),
                description: 'إعدادات المراسلة والإشعارات'
            });
            notifications.success('تم الحفظ بنجاح', {
                message: 'تم حفظ إعدادات المراسلة بنجاح'
            });
        } catch (error) {
            console.error('Error saving messaging settings:', error);
            notifications.error('تعذر الحفظ', {
                message: error.message || 'حدث خطأ أثناء حفظ إعدادات المراسلة'
            });
        } finally {
            setSaving(false);
        }
    };

    const testWhatsAppWeb = (phone, message) => {
        const cleanPhone = phone.replace(/[^\d]/g, '');
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    };

    const testWhatsAppAPI = async (phone, message) => {
        try {
            const response = await fetch(messagingSettings.whatsapp.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${messagingSettings.whatsapp.apiToken}`
                },
                body: JSON.stringify({
                    phone: phone,
                    message: message
                })
            });

            if (response.ok) {
                notifications.success('تم الإرسال بنجاح', {
                    message: 'تم إرسال الرسالة بنجاح عبر API'
                });
            } else {
                throw new Error('فشل في إرسال الرسالة');
            }
        } catch (error) {
            console.error('WhatsApp API Error:', error);
            notifications.error('فشل الإرسال', {
                message: error.message || 'فشل في إرسال الرسالة عبر API'
            });
        }
    };

    return (
        <div className="space-y-6">
            <SimpleCard>
                <SimpleCardHeader className="flex flex-row items-center justify-between">
                    <SimpleCardTitle>إعدادات واتساب (WhatsApp)</SimpleCardTitle>
                    <SimpleButton
                        onClick={handleMessagingSave}
                        disabled={saving}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'جاري الحفظ...' : 'حفظ'}
                    </SimpleButton>
                </SimpleCardHeader>
                <SimpleCardContent className="space-y-4">
                    <div className="flex items-center gap-4 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={messagingSettings.whatsapp.enabled}
                                onChange={(e) => handleMessagingChange('whatsapp', 'enabled', e.target.checked)}
                                className="rounded text-blue-600"
                            />
                            <span className="font-medium">تفعيل واتساب</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={messagingSettings.whatsapp.webEnabled}
                                onChange={(e) => handleMessagingChange('whatsapp', 'webEnabled', e.target.checked)}
                                className="rounded text-blue-600"
                            />
                            <span className="font-medium">استخدام WhatsApp Web</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={messagingSettings.whatsapp.apiEnabled}
                                onChange={(e) => handleMessagingChange('whatsapp', 'apiEnabled', e.target.checked)}
                                className="rounded text-blue-600"
                            />
                            <span className="font-medium">استخدام WhatsApp API</span>
                        </label>
                    </div>

                    {messagingSettings.whatsapp.apiEnabled && (
                        <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 rounded-lg border">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">API URL</label>
                                <input
                                    type="text"
                                    value={messagingSettings.whatsapp.apiUrl}
                                    onChange={(e) => handleMessagingChange('whatsapp', 'apiUrl', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="https://api.whatsapp.com/send"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
                                <input
                                    type="password"
                                    value={messagingSettings.whatsapp.apiToken}
                                    onChange={(e) => handleMessagingChange('whatsapp', 'apiToken', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">رسالة الفاتورة الافتراضية</label>
                        <textarea
                            value={messagingSettings.whatsapp.defaultMessage}
                            onChange={(e) => handleMessagingChange('whatsapp', 'defaultMessage', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            المتغيرات المتاحة: {'{customerName}, {invoiceId}, {amount}, {currency}, {invoiceLink}'}
                        </p>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <SimpleButton
                            variant="outline"
                            size="sm"
                            onClick={() => testWhatsAppWeb('201000000000', 'تجربة واتساب ويب')}
                            disabled={!messagingSettings.whatsapp.webEnabled}
                        >
                            <Send className="h-3 w-3 mr-2" />
                            تجربة Web
                        </SimpleButton>
                        <SimpleButton
                            variant="outline"
                            size="sm"
                            onClick={() => testWhatsAppAPI('201000000000', 'تجربة واتساب API')}
                            disabled={!messagingSettings.whatsapp.apiEnabled}
                        >
                            <Send className="h-3 w-3 mr-2" />
                            تجربة API
                        </SimpleButton>
                    </div>
                </SimpleCardContent>
            </SimpleCard>

            <SimpleCard>
                <SimpleCardHeader className="flex flex-row items-center justify-between">
                    <SimpleCardTitle>إعدادات البريد الإلكتروني (Email)</SimpleCardTitle>
                    <SimpleButton
                        onClick={handleMessagingSave}
                        disabled={saving}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'جاري الحفظ...' : 'حفظ'}
                    </SimpleButton>
                </SimpleCardHeader>
                <SimpleCardContent className="space-y-4">
                    <div className="flex items-center gap-4 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={messagingSettings.email.enabled}
                                onChange={(e) => handleMessagingChange('email', 'enabled', e.target.checked)}
                                className="rounded text-blue-600"
                            />
                            <span className="font-medium">تفعيل البريد الإلكتروني</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                            <input
                                type="text"
                                value={messagingSettings.email.smtpHost}
                                onChange={(e) => handleMessagingChange('email', 'smtpHost', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="smtp.gmail.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                            <input
                                type="number"
                                value={messagingSettings.email.smtpPort}
                                onChange={(e) => handleMessagingChange('email', 'smtpPort', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="587"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP User</label>
                            <input
                                type="text"
                                value={messagingSettings.email.smtpUser}
                                onChange={(e) => handleMessagingChange('email', 'smtpUser', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
                            <input
                                type="password"
                                value={messagingSettings.email.smtpPassword}
                                onChange={(e) => handleMessagingChange('email', 'smtpPassword', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
                            <input
                                type="email"
                                value={messagingSettings.email.fromEmail}
                                onChange={(e) => handleMessagingChange('email', 'fromEmail', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                            <input
                                type="text"
                                value={messagingSettings.email.fromName}
                                onChange={(e) => handleMessagingChange('email', 'fromName', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الرسالة الافتراضي</label>
                        <input
                            type="text"
                            value={messagingSettings.email.defaultSubject}
                            onChange={(e) => handleMessagingChange('email', 'defaultSubject', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">قالب الرسالة الافتراضي</label>
                        <textarea
                            value={messagingSettings.email.defaultTemplate}
                            onChange={(e) => handleMessagingChange('email', 'defaultTemplate', e.target.value)}
                            rows={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                        />
                    </div>
                </SimpleCardContent>
            </SimpleCard>
        </div>
    );
}
