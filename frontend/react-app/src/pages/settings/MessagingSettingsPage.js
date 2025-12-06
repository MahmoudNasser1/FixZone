import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Save, Send, MessageSquare, FileText, Settings, Eye, RotateCcw, Search, X, Plus, Trash2, Clock, Calendar, Edit } from 'lucide-react';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { Accordion } from '../../components/ui/Accordion';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '../../components/ui/Modal';
import api from '../../services/api';

export default function MessagingSettingsPage() {
    const notifications = useNotifications();
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('channels');
    const [templateSearch, setTemplateSearch] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        entityType: 'repair',
        status: '',
        template: ''
    });
    // State للـ modal تعديل القالب
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [editTemplateValue, setEditTemplateValue] = useState('');
    const [messagingSettings, setMessagingSettings] = useState({
        whatsapp: {
            enabled: true,
            apiEnabled: false,
            apiUrl: '',
            apiToken: '',
            webEnabled: true,
            defaultMessage: 'مرحباً {customerName}، فاتورتك رقم #{invoiceId} جاهزة بمبلغ {totalAmount} {currency}. يمكنك تحميلها من: {invoiceLink}',
            repairReceivedMessage: `جهازك وصل Fix Zone يا فندم



ده ملخص الطلب :

• رقم الطلب: {repairNumber}

• الجهاز: {deviceInfo}

• المشكلة: {problem}{oldInvoiceNumber}

تقدر تشوف التحديثات أول بأول من هنا:

{trackingUrl}

فريق الفنيين هيبدأ الفحص خلال الساعات القادمة.`
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
- المبلغ الإجمالي: {totalAmount} {currency}
- تاريخ الإصدار: {invoiceDate}
- حالة الدفع: {status}

يمكنك تحميل الفاتورة من الرابط التالي:
{invoiceLink}

شكراً لتعاملكم معنا
فريق Fix Zone`
        },
        automation: {
            enabled: true,
            defaultChannels: ['whatsapp'],
            invoice: {
                notifyOnCreate: true,
                notifyOnStatusChange: false,
                overdueReminders: {
                    enabled: true,
                    schedule: {
                        type: 'daily', // 'daily', 'weekly', 'cron'
                        time: '09:00',
                        days: [1, 2, 3, 4, 5, 6, 7], // 1=السبت, 2=الأحد, etc.
                        cronExpression: '0 9 * * *'
                    },
                    minDaysBetweenReminders: 1
                },
                beforeDueReminders: {
                    enabled: true,
                    schedule: {
                        type: 'daily',
                        time: '10:00',
                        days: [1, 2, 3, 4, 5, 6, 7],
                        cronExpression: '0 10 * * *'
                    },
                    daysBeforeDue: 3,
                    minDaysBetweenReminders: 1
                }
            },
            repair: {
                notifyOnReceived: true,
                notifyOnDiagnosed: true,
                notifyOnAwaitingApproval: true,
                notifyOnUnderRepair: false,
                notifyOnWaitingParts: true,
                notifyOnCompleted: true,
                notifyOnReadyPickup: true,
                notifyOnRejected: false,
                notifyOnOnHold: false
            },
            quotation: {
                notifyOnCreate: true,
                notifyOnApproval: true
            },
            payment: {
                notifyOnReceived: true
            }
        },
        customTemplates: [] // قوالب مخصصة
    });

    // Default templates for reset
    const defaultTemplates = {
        defaultMessage: 'مرحباً {customerName}، فاتورتك رقم #{invoiceId} جاهزة بمبلغ {totalAmount} {currency}. يمكنك تحميلها من: {invoiceLink}',
        repairReceivedMessage: `جهازك وصل Fix Zone يا فندم



ده ملخص الطلب :

• رقم الطلب: {repairNumber}

• الجهاز: {deviceInfo}

• المشكلة: {problem}{oldInvoiceNumber}

تقدر تشوف التحديثات أول بأول من هنا:

{trackingUrl}

فريق الفنيين هيبدأ الفحص خلال الساعات القادمة.`,
        diagnosisCompleteMessage: `عزيزي {customerName}،

تم الانتهاء من تشخيص جهازك {deviceInfo}.

• رقم الطلب: {repairNumber}
• المشكلة: {problem}
• التشخيص: {diagnosis}
• التكلفة المتوقعة: {estimatedCost}

يمكنك متابعة التحديثات من هنا:
{trackingUrl}

فريق Fix Zone`,
        repairCompletedMessage: `عزيزي {customerName}،

تم إكمال إصلاح جهازك بنجاح! ✅

• رقم الطلب: {repairNumber}
• الجهاز: {deviceInfo}

يمكنك استلام جهازك من:
{location}

يمكنك متابعة التحديثات من هنا:
{trackingUrl}

شكراً لثقتك بنا 🌟
فريق Fix Zone`,
        readyPickupMessage: `عزيزي {customerName}،

جهازك جاهز للاستلام! 🎉

• رقم الطلب: {repairNumber}
• الجهاز: {deviceInfo}

يمكنك استلام جهازك من:
{location}

يمكنك متابعة التحديثات من هنا:
{trackingUrl}

ننتظرك في أي وقت مناسب لك 📍
فريق Fix Zone`,
        waitingPartsMessage: `عزيزي {customerName}،

نحتاج لقطع غيار لجهازك {deviceInfo}

• رقم الطلب: {repairNumber}
• المشكلة: {problem}

نحن بانتظار وصول قطع الغيار المطلوبة. سيتم إكمال الإصلاح فور وصولها.

يمكنك متابعة التحديثات من هنا:
{trackingUrl}

شكراً لصبرك 🙏
فريق Fix Zone`,
        awaitingApprovalMessage: `عزيزي {customerName}،

تم إعداد عرض سعر لإصلاح جهازك

• رقم الطلب: {repairNumber}
• الجهاز: {deviceInfo}
• التكلفة المتوقعة: {estimatedCost}

يرجى مراجعة العرض والموافقة عليه للمتابعة.

يمكنك متابعة التحديثات من هنا:
{trackingUrl}

ننتظر موافقتك 📋
فريق Fix Zone`,
        underRepairMessage: `عزيزي {customerName}،

تم البدء في إصلاح جهازك

• رقم الطلب: {repairNumber}
• الجهاز: {deviceInfo}

فريق الفنيين يعمل على إصلاح جهازك الآن.

يمكنك متابعة التحديثات من هنا:
{trackingUrl}

شكراً لصبرك ⚙️
فريق Fix Zone`,
        deliveredMessage: `عزيزي {customerName}،

تم تسليم جهازك بنجاح! ✅

• رقم الطلب: {repairNumber}
• الجهاز: {deviceInfo}

نتمنى أن يكون كل شيء على ما يرام.

إذا كان لديك أي استفسار، لا تتردد في التواصل معنا.

شكراً لثقتك بنا 🌟
فريق Fix Zone`,
        completedMessage: `عزيزي {customerName}،

تم إكمال إصلاح جهازك بنجاح! ✅

• رقم الطلب: {repairNumber}
• الجهاز: {deviceInfo}

يمكنك استلام جهازك من:
{location}

يمكنك متابعة التحديثات من هنا:
{trackingUrl}

شكراً لثقتك بنا 🌟
فريق Fix Zone`,
        rejectedMessage: `عزيزي {customerName}،

نعتذر، تم رفض طلب إصلاح جهازك

• رقم الطلب: {repairNumber}
• الجهاز: {deviceInfo}
• السبب: {rejectionReason}

يمكنك التواصل معنا لمزيد من التفاصيل.

شكراً لتفهمك
فريق Fix Zone`,
        onHoldMessage: `عزيزي {customerName}،

تم تعليق طلب إصلاح جهازك مؤقتاً

• رقم الطلب: {repairNumber}
• الجهاز: {deviceInfo}
• السبب: {holdReason}

سيتم متابعة الطلب قريباً.

يمكنك متابعة التحديثات من هنا:
{trackingUrl}

شكراً لصبرك
فريق Fix Zone`,
        quotationDefaultMessage: `عزيزي {customerName}،

تم إعداد عرض سعر جديد لك:

• رقم العرض: #{quotationId}
• رقم الطلب: {repairNumber}
• المبلغ الإجمالي: {totalAmount} {currency}
• صالح حتى: {validUntil}

يمكنك مراجعة العرض والموافقة من هنا:
{quotationLink}

شكراً لثقتك بنا
فريق Fix Zone`,
        quotationApprovedMessage: `عزيزي {customerName}،

شكراً لموافقتك على عرض السعر! ✅

• رقم العرض: #{quotationId}
• المبلغ: {totalAmount} {currency}

سيتم البدء في الإصلاح قريباً.

يمكنك متابعة التحديثات من هنا:
{trackingUrl}

فريق Fix Zone`,
        paymentOverdueReminder: `عزيزي {customerName}،

تذكير: فاتورة #{invoiceId} متأخرة عن السداد

• المبلغ الإجمالي: {totalAmount} {currency}
• المبلغ المدفوع: {amountPaid} {currency}
• المبلغ المتبقي: {remainingAmount} {currency}
• تاريخ الاستحقاق: {dueDate}

يرجى تسوية المبلغ في أقرب وقت ممكن.

يمكنك الدفع من هنا:
{invoiceLink}

شكراً لتعاملكم معنا
فريق Fix Zone`,
        paymentBeforeDueReminder: `عزيزي {customerName}،

تذكير ودود: فاتورة #{invoiceId} مستحقة خلال 3 أيام

• المبلغ الإجمالي: {totalAmount} {currency}
• المبلغ المدفوع: {amountPaid} {currency}
• المبلغ المتبقي: {remainingAmount} {currency}
• تاريخ الاستحقاق: {dueDate}

يمكنك الدفع من هنا:
{invoiceLink}

شكراً لتعاملكم معنا
فريق Fix Zone`
    };

    // Deep merge function
    const deepMerge = (target, source) => {
        const output = { ...target };
        if (isObject(target) && isObject(source)) {
            Object.keys(source).forEach(key => {
                if (isObject(source[key]) && !Array.isArray(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = deepMerge(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    };

    const isObject = (item) => {
        return item && typeof item === 'object' && !Array.isArray(item);
    };

    useEffect(() => {
        let mounted = true;
        const loadSettings = async () => {
            try {
                const item = await api.getSystemSetting('messaging_settings');
                if (mounted && item && item.value) {
                    const parsed = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
                    // استخدام deep merge لدمج الإعدادات المحفوظة مع الافتراضية
                    setMessagingSettings(prev => {
                        const merged = deepMerge(prev, parsed);
                        // التأكد من وجود customTemplates
                        merged.customTemplates = parsed.customTemplates || [];
                        return merged;
                    });
                }
            } catch (error) {
                console.error('Error loading messaging settings:', error);
                // في حالة عدم وجود إعدادات، نستخدم القيم الافتراضية
                if (mounted) {
                    setMessagingSettings(prev => ({
                        ...prev,
                        customTemplates: prev.customTemplates || []
                    }));
                }
            }
        };
        loadSettings();
        return () => { mounted = false; };
    }, []);

    const handleMessagingChange = useCallback((section, field, value) => {
        setHasUnsavedChanges(true);
        if (section === 'automation' && typeof field === 'object') {
            // Handle nested automation settings (e.g., { invoice: { notifyOnCreate: true } })
            setMessagingSettings(prev => ({
                ...prev,
                automation: {
                    ...prev.automation,
                    ...field
                }
            }));
        } else if (section === 'customTemplates' && field === null) {
            // Handle customTemplates array update
            setMessagingSettings(prev => ({
                ...prev,
                customTemplates: value
            }));
        } else {
            // Handle simple fields (e.g., 'whatsapp', 'defaultMessage')
            setMessagingSettings(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value
                }
            }));
        }
    }, []);

    const handleMessagingSave = async () => {
        try {
            setSaving(true);
            // محاولة التحديث أولاً، وإذا فشل (404) ننشئ جديد
            try {
                await api.updateSystemSetting('messaging_settings', {
                    value: JSON.stringify(messagingSettings),
                    description: 'إعدادات المراسلة والإشعارات'
                });
            } catch (updateError) {
                // إذا كان الخطأ 404 (غير موجود)، أنشئ جديد
                if (updateError.message?.includes('404') || updateError.message?.includes('not found')) {
                    await api.createSystemSetting({
                        key: 'messaging_settings',
                        value: JSON.stringify(messagingSettings),
                        description: 'إعدادات المراسلة والإشعارات'
                    });
                } else {
                    throw updateError;
                }
            }
            setHasUnsavedChanges(false);
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

    const resetTemplate = useCallback((templateKey) => {
        if (defaultTemplates[templateKey]) {
            handleMessagingChange('whatsapp', templateKey, defaultTemplates[templateKey]);
            notifications.success('تم الاستعادة', {
                message: 'تم استعادة القالب الافتراضي'
            });
        }
    }, [handleMessagingChange, notifications, defaultTemplates]);

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

    // Template definitions with metadata
    const templateDefinitions = useMemo(() => ({
        invoice: [
            {
                key: 'defaultMessage',
                label: 'رسالة الفاتورة الافتراضية',
                variables: '{customerName}, {invoiceId}, {totalAmount}, {currency}, {invoiceLink}',
                category: 'invoice'
            }
        ],
        repair: [
            {
                key: 'repairReceivedMessage',
                label: 'استلام الطلب (RECEIVED)',
                variables: '{customerName}, {repairNumber}, {deviceInfo}, {deviceBrand}, {deviceModel}, {deviceType}, {problem}, {oldInvoiceNumber}, {trackingUrl}, {status}, {createdAt}',
                category: 'repair',
                status: 'RECEIVED'
            },
            {
                key: 'diagnosisCompleteMessage',
                label: 'اكتمال التشخيص (INSPECTION)',
                variables: '{customerName}, {repairNumber}, {deviceInfo}, {deviceBrand}, {deviceModel}, {problem}, {diagnosis}, {estimatedCost}, {trackingUrl}, {status}',
                category: 'repair',
                status: 'INSPECTION'
            },
            {
                key: 'awaitingApprovalMessage',
                label: 'بانتظار الموافقة (AWAITING_APPROVAL)',
                variables: '{customerName}, {repairNumber}, {deviceInfo}, {estimatedCost}, {trackingUrl}, {status}',
                category: 'repair',
                status: 'AWAITING_APPROVAL'
            },
            {
                key: 'underRepairMessage',
                label: 'قيد الإصلاح (UNDER_REPAIR)',
                variables: '{customerName}, {repairNumber}, {deviceInfo}, {problem}, {trackingUrl}, {status}',
                category: 'repair',
                status: 'UNDER_REPAIR'
            },
            {
                key: 'waitingPartsMessage',
                label: 'بانتظار قطع الغيار (WAITING_PARTS)',
                variables: '{customerName}, {repairNumber}, {deviceInfo}, {problem}, {trackingUrl}, {status}',
                category: 'repair',
                status: 'WAITING_PARTS'
            },
            {
                key: 'readyPickupMessage',
                label: 'جاهزية الاستلام (READY_FOR_PICKUP)',
                variables: '{customerName}, {repairNumber}, {deviceInfo}, {location}, {trackingUrl}, {status}',
                category: 'repair',
                status: 'READY_FOR_PICKUP'
            },
            {
                key: 'repairCompletedMessage',
                label: 'اكتمال الإصلاح (READY_FOR_DELIVERY)',
                variables: '{customerName}, {repairNumber}, {deviceInfo}, {location}, {trackingUrl}, {status}',
                category: 'repair',
                status: 'READY_FOR_DELIVERY'
            },
            {
                key: 'deliveredMessage',
                label: 'تم التسليم (DELIVERED)',
                variables: '{customerName}, {repairNumber}, {deviceInfo}, {status}',
                category: 'repair',
                status: 'DELIVERED'
            },
            {
                key: 'completedMessage',
                label: 'مكتمل (COMPLETED)',
                variables: '{customerName}, {repairNumber}, {deviceInfo}, {location}, {trackingUrl}, {status}',
                category: 'repair',
                status: 'COMPLETED'
            },
            {
                key: 'rejectedMessage',
                label: 'مرفوض (REJECTED)',
                variables: '{customerName}, {repairNumber}, {deviceInfo}, {rejectionReason}, {status}',
                category: 'repair',
                status: 'REJECTED'
            },
            {
                key: 'onHoldMessage',
                label: 'معلق (ON_HOLD)',
                variables: '{customerName}, {repairNumber}, {deviceInfo}, {holdReason}, {trackingUrl}, {status}',
                category: 'repair',
                status: 'ON_HOLD'
            }
        ],
        quotation: [
            {
                key: 'quotationDefaultMessage',
                label: 'عرض سعر جديد',
                variables: '{customerName}, {quotationId}, {repairNumber}, {totalAmount}, {currency}, {validUntil}, {quotationLink}',
                category: 'quotation'
            },
            {
                key: 'quotationApprovedMessage',
                label: 'موافقة على عرض السعر',
                variables: '{customerName}, {quotationId}, {totalAmount}, {currency}, {trackingUrl}',
                category: 'quotation'
            }
        ],
        payment: [
            {
                key: 'paymentOverdueReminder',
                label: 'تذكير الدفع المتأخر',
                variables: '{customerName}, {invoiceId}, {totalAmount}, {amountPaid}, {remainingAmount}, {currency}, {dueDate}, {invoiceLink}',
                category: 'payment'
            },
            {
                key: 'paymentBeforeDueReminder',
                label: 'تذكير قبل الاستحقاق',
                variables: '{customerName}, {invoiceId}, {totalAmount}, {amountPaid}, {remainingAmount}, {currency}, {dueDate}, {invoiceLink}',
                category: 'payment'
            }
        ]
    }), []);

    // Filter templates based on search
    const filteredTemplates = useMemo(() => {
        if (!templateSearch) return templateDefinitions;
        
        const searchLower = templateSearch.toLowerCase();
        const filtered = {};
        
        Object.keys(templateDefinitions).forEach(category => {
            filtered[category] = templateDefinitions[category].filter(template => 
                template.label.toLowerCase().includes(searchLower) ||
                template.key.toLowerCase().includes(searchLower) ||
                template.variables.toLowerCase().includes(searchLower)
            );
        });
        
        return filtered;
    }, [templateSearch, templateDefinitions]);

    // Render template display (بدون تعديل مباشر)
    const renderTemplateDisplay = useCallback((template) => {
        const value = messagingSettings.whatsapp[template.key] || '';
        const preview = value.length > 100 ? value.substring(0, 100) + '...' : value;
        
        return (
            <div className="space-y-2 border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700 text-right">
                        {template.label}
                    </label>
                    <div className="flex items-center gap-2">
                        <SimpleButton
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setEditingTemplate(template);
                                setEditTemplateValue(value);
                            }}
                            className="text-xs"
                        >
                            <Edit className="w-3 h-3 ml-1" />
                            تعديل
                        </SimpleButton>
                        <SimpleButton
                            variant="outline"
                            size="sm"
                            onClick={() => resetTemplate(template.key)}
                            className="text-xs"
                        >
                            <RotateCcw className="w-3 h-3 ml-1" />
                            استعادة افتراضي
                        </SimpleButton>
                    </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 min-h-[100px]">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono text-right" dir="rtl">
                        {preview}
                    </pre>
                </div>
                <p className="text-xs text-gray-500">
                    المتغيرات المتاحة: {template.variables}
                </p>
            </div>
        );
    }, [messagingSettings.whatsapp, resetTemplate]);
    
    // حفظ القالب بعد التعديل
    const handleSaveTemplate = useCallback((e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        if (!editingTemplate) return;
        
        handleMessagingChange('whatsapp', editingTemplate.key, editTemplateValue);
        setEditingTemplate(null);
        setEditTemplateValue('');
        notifications.success('تم الحفظ', {
            message: 'تم حفظ القالب بنجاح'
        });
    }, [editingTemplate, editTemplateValue, handleMessagingChange, notifications]);

    // Channels Tab Content
    const ChannelsTab = () => (
        <div className="space-y-6" dir="rtl">
            {/* WhatsApp Settings */}
            <SimpleCard>
                <SimpleCardHeader>
                    <SimpleCardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                        إعدادات واتساب (WhatsApp)
                    </SimpleCardTitle>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-right">API URL</label>
                                <input
                                    type="text"
                                    value={messagingSettings.whatsapp.apiUrl}
                                    onChange={(e) => handleMessagingChange('whatsapp', 'apiUrl', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                                    placeholder="https://api.whatsapp.com/send"
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-right">API Token</label>
                                <input
                                    type="password"
                                    value={messagingSettings.whatsapp.apiToken}
                                    onChange={(e) => handleMessagingChange('whatsapp', 'apiToken', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <SimpleButton
                            variant="outline"
                            size="sm"
                            onClick={() => testWhatsAppWeb('201000000000', 'تجربة واتساب ويب')}
                            disabled={!messagingSettings.whatsapp.webEnabled}
                        >
                            <Send className="h-3 w-3 ml-2" />
                            تجربة Web
                        </SimpleButton>
                        <SimpleButton
                            variant="outline"
                            size="sm"
                            onClick={() => testWhatsAppAPI('201000000000', 'تجربة واتساب API')}
                            disabled={!messagingSettings.whatsapp.apiEnabled}
                        >
                            <Send className="h-3 w-3 ml-2" />
                            تجربة API
                        </SimpleButton>
                    </div>
                </SimpleCardContent>
            </SimpleCard>

            {/* Email Settings */}
            <SimpleCard>
                <SimpleCardHeader>
                    <SimpleCardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        إعدادات البريد الإلكتروني (Email)
                    </SimpleCardTitle>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">SMTP Host</label>
                            <input
                                type="text"
                                value={messagingSettings.email.smtpHost}
                                onChange={(e) => handleMessagingChange('email', 'smtpHost', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                                placeholder="smtp.gmail.com"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">SMTP Port</label>
                            <input
                                type="number"
                                value={messagingSettings.email.smtpPort}
                                onChange={(e) => handleMessagingChange('email', 'smtpPort', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                                placeholder="587"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">SMTP User</label>
                            <input
                                type="text"
                                value={messagingSettings.email.smtpUser}
                                onChange={(e) => handleMessagingChange('email', 'smtpUser', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">SMTP Password</label>
                            <input
                                type="password"
                                value={messagingSettings.email.smtpPassword}
                                onChange={(e) => handleMessagingChange('email', 'smtpPassword', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">From Email</label>
                            <input
                                type="email"
                                value={messagingSettings.email.fromEmail}
                                onChange={(e) => handleMessagingChange('email', 'fromEmail', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">From Name</label>
                            <input
                                type="text"
                                value={messagingSettings.email.fromName}
                                onChange={(e) => handleMessagingChange('email', 'fromName', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 text-right">عنوان الرسالة الافتراضي</label>
                        <input
                            type="text"
                            value={messagingSettings.email.defaultSubject}
                            onChange={(e) => handleMessagingChange('email', 'defaultSubject', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 text-right">قالب الرسالة الافتراضي</label>
                        <textarea
                            value={messagingSettings.email.defaultTemplate}
                            onChange={(e) => handleMessagingChange('email', 'defaultTemplate', e.target.value)}
                            rows={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm text-right"
                            dir="rtl"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            المتغيرات المتاحة: {'{customerName}, {invoiceId}, {totalAmount}, {currency}, {invoiceDate}, {status}, {invoiceLink}'}
                        </p>
                    </div>
                </SimpleCardContent>
            </SimpleCard>
        </div>
    );

    // Templates Tab Content
    const TemplatesTab = () => {
        // استخدام useMemo لحفظ accordionItems حتى لا يتم إعادة إنشائها في كل render
        // لكن content يتم إعادة إنشاؤه في كل render لأنه يعتمد على messagingSettings.whatsapp
        const accordionItems = React.useMemo(() => {
            const items = [
            // Invoice Templates
            {
                value: 'invoice-templates',
                label: 'قوالب الفواتير',
                badge: filteredTemplates.invoice?.length || 0,
                content: (
                    <div className="space-y-4">
                        {filteredTemplates.invoice?.map(template => (
                            <div key={template.key}>
                                {renderTemplateDisplay(template)}
                            </div>
                        ))}
                    </div>
                )
            },
            // Repair Templates
            {
                value: 'repair-templates',
                label: 'قوالب طلبات الإصلاح',
                badge: filteredTemplates.repair?.length || 0,
                content: (
                    <div className="space-y-4">
                        {filteredTemplates.repair?.map(template => (
                            <div key={template.key}>
                                {renderTemplateDisplay(template)}
                            </div>
                        ))}
                    </div>
                )
            },
            // Quotation Templates
            {
                value: 'quotation-templates',
                label: 'قوالب العروض السعرية',
                badge: filteredTemplates.quotation?.length || 0,
                content: (
                    <div className="space-y-4">
                        {filteredTemplates.quotation?.map(template => (
                            <div key={template.key}>
                                {renderTemplateDisplay(template)}
                            </div>
                        ))}
                    </div>
                )
            },
            // Payment Templates
            {
                value: 'payment-templates',
                label: 'قوالب التذكيرات',
                badge: filteredTemplates.payment?.length || 0,
                content: (
                    <div className="space-y-4">
                        {filteredTemplates.payment?.map(template => (
                            <div key={template.key}>
                                {renderTemplateDisplay(template)}
                            </div>
                        ))}
                    </div>
                )
            }
        ];

        // إضافة القوالب المخصصة
        if (messagingSettings.customTemplates && messagingSettings.customTemplates.length > 0) {
            const customTemplatesFiltered = messagingSettings.customTemplates.filter(t => {
                if (!templateSearch) return true;
                const searchLower = templateSearch.toLowerCase();
                return t.name.toLowerCase().includes(searchLower) ||
                       t.template.toLowerCase().includes(searchLower);
            });

            if (customTemplatesFiltered.length > 0) {
                items.push({
                    value: 'custom-templates',
                    label: 'قوالب مخصصة',
                    badge: customTemplatesFiltered.length,
                    content: (
                        <div className="space-y-4">
                            {customTemplatesFiltered.map((template, index) => {
                                return (
                                    <div key={template.id || index} className="border border-gray-200 rounded-lg p-4 bg-white">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <h4 className="font-medium text-gray-900">{template.name}</h4>
                                                <p className="text-xs text-gray-500">
                                                    {template.entityType} {template.status && `- ${template.status}`}
                                                </p>
                                            </div>
                                            <SimpleButton
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const updated = messagingSettings.customTemplates.filter(t => t.id !== template.id);
                                                    handleMessagingChange('customTemplates', null, updated);
                                                }}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4 ml-1" />
                                                حذف
                                            </SimpleButton>
                                        </div>
                                        <textarea
                                            value={template.template}
                                            onChange={(e) => {
                                                const updated = messagingSettings.customTemplates.map(t =>
                                                    t.id === template.id
                                                        ? { ...t, template: e.target.value }
                                                        : t
                                                );
                                                handleMessagingChange('customTemplates', null, updated);
                                            }}
                                            rows={6}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm text-right"
                                            dir="rtl"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )
                });
            }
        }
        
        return items;
        }, [
            // Dependencies for useMemo
            // لا نضع messagingSettings.whatsapp أو renderTemplateEditor هنا
            // لأنهما يتغيران في كل تعديل، مما يسبب إعادة حساب accordionItems
            // content يتم إعادة إنشاؤه في كل render (هذا طبيعي)
            // لكن Accordion يحافظ على الحالة المفتوحة بناءً على القيم فقط
            filteredTemplates,
            messagingSettings.customTemplates,
            templateSearch
        ]);

        const totalTemplates = Object.values(filteredTemplates).reduce((sum, arr) => sum + arr.length, 0) + (messagingSettings.customTemplates?.length || 0);

        return (
            <div className="space-y-6" dir="rtl">
                {/* Search and Stats */}
                <SimpleCard>
                    <SimpleCardContent className="space-y-4">
                        <div className="flex items-center justify-between flex-row-reverse">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900">القوالب</h3>
                                    <SimpleButton
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowAddTemplateModal(true)}
                                        className="flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        إضافة قالب جديد
                                    </SimpleButton>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    إجمالي القوالب: <span className="font-medium text-blue-600">{totalTemplates} قالب</span>
                                    {' '}({filteredTemplates.invoice?.length || 0} فواتير + {filteredTemplates.repair?.length || 0} إصلاح + {filteredTemplates.quotation?.length || 0} عروض + {filteredTemplates.payment?.length || 0} تذكيرات)
                                    {messagingSettings.customTemplates?.length > 0 && (
                                        <span className="mr-2">+ {messagingSettings.customTemplates.length} مخصص</span>
                                    )}
                                </p>
                            </div>
                            <div className="flex-1 max-w-md">
                                <div className="relative" dir="rtl">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={templateSearch}
                                        onChange={(e) => setTemplateSearch(e.target.value)}
                                        placeholder="ابحث في القوالب..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                                    />
                                    {templateSearch && (
                                        <button
                                            onClick={() => setTemplateSearch('')}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </SimpleCardContent>
                </SimpleCard>

                {/* Templates Accordion */}
                <SimpleCard>
                    <SimpleCardContent>
                        <Accordion 
                            items={accordionItems}
                            allowMultiple={true}
                            defaultOpen={templateSearch ? accordionItems.map(item => item.value) : []}
                        />
                    </SimpleCardContent>
                </SimpleCard>

                {/* Modal تعديل القالب */}
                <Modal
                    isOpen={editingTemplate !== null}
                    onClose={() => {
                        setEditingTemplate(null);
                        setEditTemplateValue('');
                    }}
                    title={`تعديل قالب: ${editingTemplate?.label || ''}`}
                    description="قم بتعديل القالب ثم اضغط حفظ"
                    size="2xl"
                >
                    <ModalContent className="max-h-[90vh] overflow-hidden flex flex-col">
                        <ModalHeader>
                            <ModalTitle>{`تعديل قالب: ${editingTemplate?.label || ''}`}</ModalTitle>
                            <ModalDescription>قم بتعديل القالب ثم اضغط حفظ</ModalDescription>
                        </ModalHeader>
                        <div className="flex-1 overflow-y-auto px-6 py-4" dir="rtl">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        القالب
                                    </label>
                                    <textarea
                                        value={editTemplateValue}
                                        onChange={(e) => setEditTemplateValue(e.target.value)}
                                        rows={15}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm text-right resize-y"
                                        placeholder="أدخل نص القالب..."
                                        dir="rtl"
                                        style={{ minHeight: '300px' }}
                                    />
                                    {editingTemplate && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            المتغيرات المتاحة: {editingTemplate.variables}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <ModalFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <SimpleButton
                                variant="outline"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setEditingTemplate(null);
                                    setEditTemplateValue('');
                                }}
                                type="button"
                            >
                                إلغاء
                            </SimpleButton>
                            <SimpleButton
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (editingTemplate && defaultTemplates[editingTemplate.key]) {
                                        setEditTemplateValue(defaultTemplates[editingTemplate.key]);
                                    }
                                }}
                                variant="outline"
                                type="button"
                            >
                                <RotateCcw className="w-4 h-4 ml-2" />
                                استعادة افتراضي
                            </SimpleButton>
                            <SimpleButton
                                onClick={handleSaveTemplate}
                                variant="default"
                                type="button"
                            >
                                <Save className="w-4 h-4 ml-2" />
                                حفظ
                            </SimpleButton>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </div>
        );
    };

    // Automation Tab Content
    const AutomationTab = () => (
        <div className="space-y-6" dir="rtl">
            <SimpleCard>
                <SimpleCardHeader>
                    <SimpleCardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-orange-600" />
                        إعدادات الأتمتة
                    </SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-800">
                            <strong>معلومات:</strong> الأتمتة تتيح إرسال إشعارات تلقائية عند تغيير حالات الطلبات والفواتير، 
                            بالإضافة إلى تذكيرات الدفع التلقائية.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={messagingSettings.automation?.enabled ?? true}
                                onChange={(e) => handleMessagingChange('automation', 'enabled', e.target.checked)}
                                className="rounded text-blue-600"
                            />
                            <span className="font-medium">تفعيل الأتمتة</span>
                        </label>
                    </div>

                    {messagingSettings.automation?.enabled && (
                        <>
                            {/* Default Channels */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        القنوات الافتراضية للأتمتة
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={messagingSettings.automation?.defaultChannels?.includes('whatsapp') ?? true}
                                                onChange={(e) => {
                                                    const channels = messagingSettings.automation?.defaultChannels || ['whatsapp'];
                                                    if (e.target.checked) {
                                                        if (!channels.includes('whatsapp')) {
                                                            handleMessagingChange('automation', 'defaultChannels', [...channels, 'whatsapp']);
                                                        }
                                                    } else {
                                                        handleMessagingChange('automation', 'defaultChannels', channels.filter(c => c !== 'whatsapp'));
                                                    }
                                                }}
                                                className="rounded text-blue-600"
                                            />
                                            <span>واتساب (WhatsApp)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={messagingSettings.automation?.defaultChannels?.includes('email') ?? false}
                                                onChange={(e) => {
                                                    const channels = messagingSettings.automation?.defaultChannels || ['whatsapp'];
                                                    if (e.target.checked) {
                                                        if (!channels.includes('email')) {
                                                            handleMessagingChange('automation', 'defaultChannels', [...channels, 'email']);
                                                        }
                                                    } else {
                                                        handleMessagingChange('automation', 'defaultChannels', channels.filter(c => c !== 'email'));
                                                    }
                                                }}
                                                className="rounded text-blue-600"
                                            />
                                            <span>بريد إلكتروني (Email)</span>
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        سيتم إرسال الإشعارات التلقائية عبر القنوات المحددة
                                    </p>
                                </div>
                            </div>

                            {/* Invoice Notifications */}
                            <div className="border border-gray-200 rounded-lg p-4 mb-4">
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    إشعارات الفواتير
                                </h4>
                                <div className="space-y-3">
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                                            <input
                                                type="checkbox"
                                                checked={messagingSettings.automation?.invoice?.notifyOnCreate ?? true}
                                                onChange={(e) => {
                                                    const invoice = messagingSettings.automation?.invoice || {};
                                                    handleMessagingChange('automation', { invoice: { ...invoice, notifyOnCreate: e.target.checked } });
                                                }}
                                                className="rounded text-blue-600"
                                            />
                                            <span className="font-medium">إشعار عند إنشاء فاتورة جديدة</span>
                                        </label>
                                        {messagingSettings.automation?.invoice?.notifyOnCreate && (
                                            <div className="mr-6 mt-2 space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-600">القنوات:</span>
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={true}
                                                            disabled
                                                            className="rounded text-blue-600"
                                                        />
                                                        <span className="text-xs">واتساب</span>
                                                    </label>
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={messagingSettings.automation?.defaultChannels?.includes('email')}
                                                            disabled
                                                            className="rounded text-blue-600"
                                                        />
                                                        <span className="text-xs">بريد إلكتروني</span>
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                                            <input
                                                type="checkbox"
                                                checked={messagingSettings.automation?.invoice?.notifyOnStatusChange ?? false}
                                                onChange={(e) => {
                                                    const invoice = messagingSettings.automation?.invoice || {};
                                                    handleMessagingChange('automation', { invoice: { ...invoice, notifyOnStatusChange: e.target.checked } });
                                                }}
                                                className="rounded text-blue-600"
                                            />
                                            <span className="font-medium">إشعار عند تغيير حالة الفاتورة</span>
                                        </label>
                                        {messagingSettings.automation?.invoice?.notifyOnStatusChange && (
                                            <div className="mr-6 mt-2 space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-600">القنوات:</span>
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={true}
                                                            disabled
                                                            className="rounded text-blue-600"
                                                        />
                                                        <span className="text-xs">واتساب</span>
                                                    </label>
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={messagingSettings.automation?.defaultChannels?.includes('email')}
                                                            disabled
                                                            className="rounded text-blue-600"
                                                        />
                                                        <span className="text-xs">بريد إلكتروني</span>
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Repair Notifications */}
                            <div className="border border-gray-200 rounded-lg p-4 mb-4">
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    إشعارات طلبات الإصلاح
                                </h4>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={messagingSettings.automation?.repair?.notifyOnReceived ?? true}
                                            onChange={(e) => {
                                                const repair = messagingSettings.automation?.repair || {};
                                                handleMessagingChange('automation', { repair: { ...repair, notifyOnReceived: e.target.checked } });
                                            }}
                                            className="rounded text-blue-600"
                                        />
                                        <span>إشعار عند استلام الطلب (RECEIVED)</span>
                                    </label>
                                    <div className="p-2 bg-gray-50 rounded border border-gray-200">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={messagingSettings.automation?.repair?.notifyOnDiagnosed ?? true}
                                                onChange={(e) => {
                                                    const repair = messagingSettings.automation?.repair || {};
                                                    handleMessagingChange('automation', { repair: { ...repair, notifyOnDiagnosed: e.target.checked } });
                                                }}
                                                className="rounded text-blue-600"
                                            />
                                            <span className="font-medium">إشعار عند اكتمال التشخيص (INSPECTION)</span>
                                        </label>
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded border border-gray-200">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={messagingSettings.automation?.repair?.notifyOnAwaitingApproval ?? true}
                                                onChange={(e) => {
                                                    const repair = messagingSettings.automation?.repair || {};
                                                    handleMessagingChange('automation', { repair: { ...repair, notifyOnAwaitingApproval: e.target.checked } });
                                                }}
                                                className="rounded text-blue-600"
                                            />
                                            <span className="font-medium">إشعار عند بانتظار الموافقة (AWAITING_APPROVAL)</span>
                                        </label>
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded border border-gray-200">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={messagingSettings.automation?.repair?.notifyOnUnderRepair ?? false}
                                                onChange={(e) => {
                                                    const repair = messagingSettings.automation?.repair || {};
                                                    handleMessagingChange('automation', { repair: { ...repair, notifyOnUnderRepair: e.target.checked } });
                                                }}
                                                className="rounded text-blue-600"
                                            />
                                            <span className="font-medium">إشعار عند البدء في الإصلاح (UNDER_REPAIR)</span>
                                        </label>
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded border border-gray-200">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={messagingSettings.automation?.repair?.notifyOnWaitingParts ?? true}
                                                onChange={(e) => {
                                                    const repair = messagingSettings.automation?.repair || {};
                                                    handleMessagingChange('automation', { repair: { ...repair, notifyOnWaitingParts: e.target.checked } });
                                                }}
                                                className="rounded text-blue-600"
                                            />
                                            <span className="font-medium">إشعار عند بانتظار قطع الغيار (WAITING_PARTS)</span>
                                        </label>
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded border border-gray-200">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={messagingSettings.automation?.repair?.notifyOnReadyPickup ?? true}
                                                onChange={(e) => {
                                                    const repair = messagingSettings.automation?.repair || {};
                                                    handleMessagingChange('automation', { repair: { ...repair, notifyOnReadyPickup: e.target.checked } });
                                                }}
                                                className="rounded text-blue-600"
                                            />
                                            <span className="font-medium">إشعار عند جاهزية الاستلام (READY_FOR_PICKUP)</span>
                                        </label>
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded border border-gray-200">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={messagingSettings.automation?.repair?.notifyOnCompleted ?? true}
                                                onChange={(e) => {
                                                    const repair = messagingSettings.automation?.repair || {};
                                                    handleMessagingChange('automation', { repair: { ...repair, notifyOnCompleted: e.target.checked } });
                                                }}
                                                className="rounded text-blue-600"
                                            />
                                            <span className="font-medium">إشعار عند اكتمال الإصلاح (READY_FOR_DELIVERY/DELIVERED)</span>
                                        </label>
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded border border-gray-200">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={messagingSettings.automation?.repair?.notifyOnRejected ?? false}
                                                onChange={(e) => {
                                                    const repair = messagingSettings.automation?.repair || {};
                                                    handleMessagingChange('automation', { repair: { ...repair, notifyOnRejected: e.target.checked } });
                                                }}
                                                className="rounded text-blue-600"
                                            />
                                            <span className="font-medium">إشعار عند رفض الطلب (REJECTED)</span>
                                        </label>
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded border border-gray-200">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={messagingSettings.automation?.repair?.notifyOnOnHold ?? false}
                                                onChange={(e) => {
                                                    const repair = messagingSettings.automation?.repair || {};
                                                    handleMessagingChange('automation', { repair: { ...repair, notifyOnOnHold: e.target.checked } });
                                                }}
                                                className="rounded text-blue-600"
                                            />
                                            <span className="font-medium">إشعار عند تعليق الطلب (ON_HOLD)</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Reminders */}
                            <div className="border border-gray-200 rounded-lg p-4 mb-4">
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                    تذكيرات الدفع
                                </h4>
                                
                                {/* Overdue Reminders */}
                                <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={messagingSettings.automation?.invoice?.overdueReminders?.enabled ?? true}
                                                onChange={(e) => {
                                                    const invoice = messagingSettings.automation?.invoice || {};
                                                    const overdue = invoice.overdueReminders || {};
                                                    handleMessagingChange('automation', { 
                                                        invoice: { 
                                                            ...invoice, 
                                                            overdueReminders: { ...overdue, enabled: e.target.checked } 
                                                        } 
                                                    });
                                                }}
                                                className="rounded text-blue-600"
                                            />
                                            <span className="font-medium">تذكيرات الدفع المتأخرة</span>
                                        </label>
                                    </div>
                                    {messagingSettings.automation?.invoice?.overdueReminders?.enabled && (
                                        <div className="mt-2 space-y-3 text-sm">
                                            {/* Schedule Settings */}
                                            <div className="border-t border-orange-200 pt-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                                    <Clock className="w-4 h-4 inline ml-1" />
                                                    الجدولة
                                                </label>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="overdueScheduleType"
                                                            checked={(messagingSettings.automation?.invoice?.overdueReminders?.schedule?.type || 'daily') === 'daily'}
                                                            onChange={() => {
                                                                const invoice = messagingSettings.automation?.invoice || {};
                                                                const overdue = invoice.overdueReminders || {};
                                                                handleMessagingChange('automation', { 
                                                                    invoice: { 
                                                                        ...invoice, 
                                                                        overdueReminders: { 
                                                                            ...overdue, 
                                                                            schedule: { type: 'daily', time: '09:00', days: [1,2,3,4,5,6,7], cronExpression: '0 9 * * *' }
                                                                        } 
                                                                    } 
                                                                });
                                                            }}
                                                            className="text-blue-600"
                                                        />
                                                        <label className="text-sm">كل يوم</label>
                                                        <input
                                                            type="time"
                                                            value={messagingSettings.automation?.invoice?.overdueReminders?.schedule?.time || '09:00'}
                                                            onChange={(e) => {
                                                                const invoice = messagingSettings.automation?.invoice || {};
                                                                const overdue = invoice.overdueReminders || {};
                                                                const schedule = overdue.schedule || { type: 'daily', time: '09:00', days: [1,2,3,4,5,6,7] };
                                                                handleMessagingChange('automation', { 
                                                                    invoice: { 
                                                                        ...invoice, 
                                                                        overdueReminders: { 
                                                                            ...overdue, 
                                                                            schedule: { ...schedule, time: e.target.value, cronExpression: `0 ${e.target.value.split(':')[1]} ${e.target.value.split(':')[0]} * * *` }
                                                                        } 
                                                                    } 
                                                                });
                                                            }}
                                                            className="mr-2 px-2 py-1 border border-gray-300 rounded text-sm"
                                                            dir="ltr"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="overdueScheduleType"
                                                            checked={(messagingSettings.automation?.invoice?.overdueReminders?.schedule?.type || 'daily') === 'weekly'}
                                                            onChange={() => {
                                                                const invoice = messagingSettings.automation?.invoice || {};
                                                                const overdue = invoice.overdueReminders || {};
                                                                handleMessagingChange('automation', { 
                                                                    invoice: { 
                                                                        ...invoice, 
                                                                        overdueReminders: { 
                                                                            ...overdue, 
                                                                            schedule: { type: 'weekly', time: '09:00', days: [1,2,3,4,5], cronExpression: '0 9 * * 1-5' }
                                                                        } 
                                                                    } 
                                                                });
                                                            }}
                                                            className="text-blue-600"
                                                        />
                                                        <label className="text-sm">أيام محددة</label>
                                                    </div>
                                                    {(messagingSettings.automation?.invoice?.overdueReminders?.schedule?.type || 'daily') === 'weekly' && (
                                                        <div className="mr-6 space-y-2">
                                                            <div className="flex flex-wrap gap-2">
                                                                {[
                                                                    { value: 1, label: 'السبت' },
                                                                    { value: 2, label: 'الأحد' },
                                                                    { value: 3, label: 'الاثنين' },
                                                                    { value: 4, label: 'الثلاثاء' },
                                                                    { value: 5, label: 'الأربعاء' },
                                                                    { value: 6, label: 'الخميس' },
                                                                    { value: 7, label: 'الجمعة' }
                                                                ].map(day => (
                                                                    <label key={day.value} className="flex items-center gap-1 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={(messagingSettings.automation?.invoice?.overdueReminders?.schedule?.days || []).includes(day.value)}
                                                                            onChange={(e) => {
                                                                                const invoice = messagingSettings.automation?.invoice || {};
                                                                                const overdue = invoice.overdueReminders || {};
                                                                                const schedule = overdue.schedule || { type: 'weekly', time: '09:00', days: [] };
                                                                                const days = schedule.days || [];
                                                                                const newDays = e.target.checked 
                                                                                    ? [...days, day.value]
                                                                                    : days.filter(d => d !== day.value);
                                                                                handleMessagingChange('automation', { 
                                                                                    invoice: { 
                                                                                        ...invoice, 
                                                                                        overdueReminders: { 
                                                                                            ...overdue, 
                                                                                            schedule: { ...schedule, days: newDays }
                                                                                        } 
                                                                                    } 
                                                                                });
                                                                            }}
                                                                            className="rounded text-blue-600"
                                                                        />
                                                                        <span className="text-xs">{day.label}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-gray-600">الوقت:</span>
                                                                <input
                                                                    type="time"
                                                                    value={messagingSettings.automation?.invoice?.overdueReminders?.schedule?.time || '09:00'}
                                                                    onChange={(e) => {
                                                                        const invoice = messagingSettings.automation?.invoice || {};
                                                                        const overdue = invoice.overdueReminders || {};
                                                                        const schedule = overdue.schedule || { type: 'weekly', time: '09:00', days: [] };
                                                                        handleMessagingChange('automation', { 
                                                                            invoice: { 
                                                                                ...invoice, 
                                                                                overdueReminders: { 
                                                                                    ...overdue, 
                                                                                    schedule: { ...schedule, time: e.target.value }
                                                                                } 
                                                                            } 
                                                                        });
                                                                    }}
                                                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                                                    dir="ltr"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <span>📅 الحد الأدنى بين التذكيرات:</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={messagingSettings.automation?.invoice?.overdueReminders?.minDaysBetweenReminders ?? 1}
                                                    onChange={(e) => {
                                                        const invoice = messagingSettings.automation?.invoice || {};
                                                        const overdue = invoice.overdueReminders || {};
                                                        handleMessagingChange('automation', { 
                                                            invoice: { 
                                                                ...invoice, 
                                                                overdueReminders: { ...overdue, minDaysBetweenReminders: parseInt(e.target.value) || 1 } 
                                                            } 
                                                        });
                                                    }}
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                                    dir="ltr"
                                                />
                                                <span>يوم</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Before Due Reminders */}
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={messagingSettings.automation?.invoice?.beforeDueReminders?.enabled ?? true}
                                                onChange={(e) => {
                                                    const invoice = messagingSettings.automation?.invoice || {};
                                                    const beforeDue = invoice.beforeDueReminders || {};
                                                    handleMessagingChange('automation', { 
                                                        invoice: { 
                                                            ...invoice, 
                                                            beforeDueReminders: { ...beforeDue, enabled: e.target.checked } 
                                                        } 
                                                    });
                                                }}
                                                className="rounded text-blue-600"
                                            />
                                            <span className="font-medium">تذكيرات قبل الاستحقاق</span>
                                        </label>
                                    </div>
                                    {messagingSettings.automation?.invoice?.beforeDueReminders?.enabled && (
                                        <div className="mt-2 space-y-3 text-sm">
                                            {/* Schedule Settings */}
                                            <div className="border-t border-blue-200 pt-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                                    <Clock className="w-4 h-4 inline ml-1" />
                                                    الجدولة
                                                </label>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="beforeDueScheduleType"
                                                            checked={(messagingSettings.automation?.invoice?.beforeDueReminders?.schedule?.type || 'daily') === 'daily'}
                                                            onChange={() => {
                                                                const invoice = messagingSettings.automation?.invoice || {};
                                                                const beforeDue = invoice.beforeDueReminders || {};
                                                                handleMessagingChange('automation', { 
                                                                    invoice: { 
                                                                        ...invoice, 
                                                                        beforeDueReminders: { 
                                                                            ...beforeDue, 
                                                                            schedule: { type: 'daily', time: '10:00', days: [1,2,3,4,5,6,7], cronExpression: '0 10 * * *' }
                                                                        } 
                                                                    } 
                                                                });
                                                            }}
                                                            className="text-blue-600"
                                                        />
                                                        <label className="text-sm">كل يوم</label>
                                                        <input
                                                            type="time"
                                                            value={messagingSettings.automation?.invoice?.beforeDueReminders?.schedule?.time || '10:00'}
                                                            onChange={(e) => {
                                                                const invoice = messagingSettings.automation?.invoice || {};
                                                                const beforeDue = invoice.beforeDueReminders || {};
                                                                const schedule = beforeDue.schedule || { type: 'daily', time: '10:00', days: [1,2,3,4,5,6,7] };
                                                                handleMessagingChange('automation', { 
                                                                    invoice: { 
                                                                        ...invoice, 
                                                                        beforeDueReminders: { 
                                                                            ...beforeDue, 
                                                                            schedule: { ...schedule, time: e.target.value, cronExpression: `0 ${e.target.value.split(':')[1]} ${e.target.value.split(':')[0]} * * *` }
                                                                        } 
                                                                    } 
                                                                });
                                                            }}
                                                            className="mr-2 px-2 py-1 border border-gray-300 rounded text-sm"
                                                            dir="ltr"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="beforeDueScheduleType"
                                                            checked={(messagingSettings.automation?.invoice?.beforeDueReminders?.schedule?.type || 'daily') === 'weekly'}
                                                            onChange={() => {
                                                                const invoice = messagingSettings.automation?.invoice || {};
                                                                const beforeDue = invoice.beforeDueReminders || {};
                                                                handleMessagingChange('automation', { 
                                                                    invoice: { 
                                                                        ...invoice, 
                                                                        beforeDueReminders: { 
                                                                            ...beforeDue, 
                                                                            schedule: { type: 'weekly', time: '10:00', days: [1,2,3,4,5], cronExpression: '0 10 * * 1-5' }
                                                                        } 
                                                                    } 
                                                                });
                                                            }}
                                                            className="text-blue-600"
                                                        />
                                                        <label className="text-sm">أيام محددة</label>
                                                    </div>
                                                    {(messagingSettings.automation?.invoice?.beforeDueReminders?.schedule?.type || 'daily') === 'weekly' && (
                                                        <div className="mr-6 space-y-2">
                                                            <div className="flex flex-wrap gap-2">
                                                                {[
                                                                    { value: 1, label: 'السبت' },
                                                                    { value: 2, label: 'الأحد' },
                                                                    { value: 3, label: 'الاثنين' },
                                                                    { value: 4, label: 'الثلاثاء' },
                                                                    { value: 5, label: 'الأربعاء' },
                                                                    { value: 6, label: 'الخميس' },
                                                                    { value: 7, label: 'الجمعة' }
                                                                ].map(day => (
                                                                    <label key={day.value} className="flex items-center gap-1 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={(messagingSettings.automation?.invoice?.beforeDueReminders?.schedule?.days || []).includes(day.value)}
                                                                            onChange={(e) => {
                                                                                const invoice = messagingSettings.automation?.invoice || {};
                                                                                const beforeDue = invoice.beforeDueReminders || {};
                                                                                const schedule = beforeDue.schedule || { type: 'weekly', time: '10:00', days: [] };
                                                                                const days = schedule.days || [];
                                                                                const newDays = e.target.checked 
                                                                                    ? [...days, day.value]
                                                                                    : days.filter(d => d !== day.value);
                                                                                handleMessagingChange('automation', { 
                                                                                    invoice: { 
                                                                                        ...invoice, 
                                                                                        beforeDueReminders: { 
                                                                                            ...beforeDue, 
                                                                                            schedule: { ...schedule, days: newDays }
                                                                                        } 
                                                                                    } 
                                                                                });
                                                                            }}
                                                                            className="rounded text-blue-600"
                                                                        />
                                                                        <span className="text-xs">{day.label}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-gray-600">الوقت:</span>
                                                                <input
                                                                    type="time"
                                                                    value={messagingSettings.automation?.invoice?.beforeDueReminders?.schedule?.time || '10:00'}
                                                                    onChange={(e) => {
                                                                        const invoice = messagingSettings.automation?.invoice || {};
                                                                        const beforeDue = invoice.beforeDueReminders || {};
                                                                        const schedule = beforeDue.schedule || { type: 'weekly', time: '10:00', days: [] };
                                                                        handleMessagingChange('automation', { 
                                                                            invoice: { 
                                                                                ...invoice, 
                                                                                beforeDueReminders: { 
                                                                                    ...beforeDue, 
                                                                                    schedule: { ...schedule, time: e.target.value }
                                                                                } 
                                                                            } 
                                                                        });
                                                                    }}
                                                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                                                    dir="ltr"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <span>📅 عدد الأيام قبل الاستحقاق:</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="30"
                                                    value={messagingSettings.automation?.invoice?.beforeDueReminders?.daysBeforeDue ?? 3}
                                                    onChange={(e) => {
                                                        const invoice = messagingSettings.automation?.invoice || {};
                                                        const beforeDue = invoice.beforeDueReminders || {};
                                                        handleMessagingChange('automation', { 
                                                            invoice: { 
                                                                ...invoice, 
                                                                beforeDueReminders: { ...beforeDue, daysBeforeDue: parseInt(e.target.value) || 3 } 
                                                            } 
                                                        });
                                                    }}
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                                    dir="ltr"
                                                />
                                                <span>يوم</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <span>📅 الحد الأدنى بين التذكيرات:</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={messagingSettings.automation?.invoice?.beforeDueReminders?.minDaysBetweenReminders ?? 1}
                                                    onChange={(e) => {
                                                        const invoice = messagingSettings.automation?.invoice || {};
                                                        const beforeDue = invoice.beforeDueReminders || {};
                                                        handleMessagingChange('automation', { 
                                                            invoice: { 
                                                                ...invoice, 
                                                                beforeDueReminders: { ...beforeDue, minDaysBetweenReminders: parseInt(e.target.value) || 1 } 
                                                            } 
                                                        });
                                                    }}
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                                    dir="ltr"
                                                />
                                                <span>يوم</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </SimpleCardContent>
            </SimpleCard>
        </div>
    );

    // Preview Tab Content (Optional)
    const PreviewTab = () => {
        const [selectedTemplate, setSelectedTemplate] = useState('');
        const [previewVariables, setPreviewVariables] = useState({
            customerName: 'أحمد محمد',
            invoiceId: '1234',
            repairNumber: 'REP-20250112-001',
            deviceInfo: 'HP EliteBook 840',
            problem: 'الشاشة لا تعمل',
            totalAmount: '1500.00 EGP',
            currency: 'EGP',
            invoiceLink: 'http://localhost:3000/invoices/1234',
            trackingUrl: 'http://localhost:3000/track/abc123'
        });

        const renderPreview = () => {
            if (!selectedTemplate) return null;
            const template = messagingSettings.whatsapp[selectedTemplate] || '';
            let rendered = template;
            Object.keys(previewVariables).forEach(key => {
                rendered = rendered.replace(new RegExp(`\\{${key}\\}`, 'g'), previewVariables[key]);
            });
            return rendered;
        };

        const allTemplates = [
            ...templateDefinitions.invoice,
            ...templateDefinitions.repair,
            ...templateDefinitions.quotation,
            ...templateDefinitions.payment
        ];

        return (
            <div className="space-y-6" dir="rtl">
                <SimpleCard>
                    <SimpleCardHeader>
                        <SimpleCardTitle className="flex items-center gap-2">
                            <Eye className="w-5 h-5 text-purple-600" />
                            معاينة القوالب
                        </SimpleCardTitle>
                    </SimpleCardHeader>
                    <SimpleCardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                اختر قالب للمعاينة
                            </label>
                            <select
                                value={selectedTemplate}
                                onChange={(e) => setSelectedTemplate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                            >
                                <option value="">-- اختر قالب --</option>
                                {allTemplates.map(template => (
                                    <option key={template.key} value={template.key}>
                                        {template.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedTemplate && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        المتغيرات التجريبية
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.keys(previewVariables).map(key => (
                                            <div key={key}>
                                                <label className="block text-xs text-gray-600 mb-1 text-right">{key}</label>
                                                <input
                                                    type="text"
                                                    value={previewVariables[key]}
                                                    onChange={(e) => setPreviewVariables(prev => ({ ...prev, [key]: e.target.value }))}
                                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-right"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        المعاينة
                                    </label>
                                    <div className="p-4 bg-gray-50 border border-gray-300 rounded-md font-mono text-sm whitespace-pre-wrap min-h-[200px] text-right" dir="rtl">
                                        {renderPreview() || 'اختر قالب للمعاينة'}
                                    </div>
                                </div>
                            </>
                        )}
                    </SimpleCardContent>
                </SimpleCard>
            </div>
        );
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header with Save Button */}
            <SimpleCard>
                <SimpleCardHeader className="flex flex-row items-center justify-between">
                    <SimpleCardTitle>إعدادات المراسلة</SimpleCardTitle>
                    <div className="flex items-center gap-3">
                        {hasUnsavedChanges && (
                            <span className="text-sm text-orange-600 flex items-center gap-1">
                                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                                لديك تغييرات غير محفوظة
                            </span>
                        )}
                        <SimpleButton
                            onClick={handleMessagingSave}
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Save className="h-4 w-4 ml-2" />
                            {saving ? 'جاري الحفظ...' : 'حفظ'}
                        </SimpleButton>
                    </div>
                </SimpleCardHeader>
            </SimpleCard>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6" dir="rtl">
                    <TabsTrigger value="channels" className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        القنوات
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        القوالب
                        <span className="mr-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                            {Object.values(templateDefinitions).reduce((sum, arr) => sum + arr.length, 0)}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="automation" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        الأتمتة
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        المعاينة
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="channels">
                    <ChannelsTab />
                </TabsContent>

                <TabsContent value="templates">
                    <TemplatesTab />
                </TabsContent>

                <TabsContent value="automation">
                    <AutomationTab />
                </TabsContent>

                <TabsContent value="preview">
                    <PreviewTab />
                </TabsContent>
            </Tabs>

            {/* Add Custom Template Modal */}
            <Modal
                isOpen={showAddTemplateModal}
                onClose={() => {
                    setShowAddTemplateModal(false);
                    setNewTemplate({ name: '', entityType: 'repair', status: '', template: '' });
                }}
                title="إضافة قالب مخصص"
                description="أضف قالباً مخصصاً واربطه بحالة معينة"
                size="2xl"
            >
                <div className="space-y-4" dir="rtl">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
                            اسم القالب
                        </label>
                        <input
                            type="text"
                            value={newTemplate.name}
                            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                            placeholder="مثال: رسالة مخصصة للإصلاح"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
                                نوع الكيان
                            </label>
                            <select
                                value={newTemplate.entityType}
                                onChange={(e) => setNewTemplate({ ...newTemplate, entityType: e.target.value, status: '' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                            >
                                <option value="repair">طلب إصلاح</option>
                                <option value="invoice">فاتورة</option>
                                <option value="quotation">عرض سعر</option>
                                <option value="payment">دفعة</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
                                الحالة المرتبطة (اختياري)
                            </label>
                            <select
                                value={newTemplate.status}
                                onChange={(e) => setNewTemplate({ ...newTemplate, status: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                            >
                                <option value="">-- اختر حالة --</option>
                                {newTemplate.entityType === 'repair' && (
                                    <>
                                        <option value="RECEIVED">استلام الطلب</option>
                                        <option value="INSPECTION">اكتمال التشخيص</option>
                                        <option value="AWAITING_APPROVAL">بانتظار الموافقة</option>
                                        <option value="UNDER_REPAIR">قيد الإصلاح</option>
                                        <option value="WAITING_PARTS">بانتظار قطع الغيار</option>
                                        <option value="READY_FOR_PICKUP">جاهزية الاستلام</option>
                                        <option value="READY_FOR_DELIVERY">اكتمال الإصلاح</option>
                                        <option value="DELIVERED">تم التسليم</option>
                                        <option value="COMPLETED">مكتمل</option>
                                        <option value="REJECTED">مرفوض</option>
                                        <option value="ON_HOLD">معلق</option>
                                    </>
                                )}
                                {newTemplate.entityType === 'invoice' && (
                                    <>
                                        <option value="paid">مدفوعة</option>
                                        <option value="unpaid">غير مدفوعة</option>
                                        <option value="partially_paid">مدفوعة جزئياً</option>
                                        <option value="overdue">متأخرة</option>
                                    </>
                                )}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
                            القالب
                        </label>
                        <textarea
                            value={newTemplate.template}
                            onChange={(e) => setNewTemplate({ ...newTemplate, template: e.target.value })}
                            rows={10}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm text-right"
                            placeholder="أدخل نص القالب هنا..."
                            dir="rtl"
                        />
                        <p className="text-xs text-gray-500 mt-1 text-right">
                            المتغيرات المتاحة: {'{customerName}, {repairNumber}, {deviceInfo}, {problem}, {trackingUrl}, {invoiceId}, {totalAmount}, {currency}'}
                        </p>
                    </div>
                </div>

                <ModalFooter>
                    <SimpleButton
                        variant="outline"
                        onClick={() => {
                            setShowAddTemplateModal(false);
                            setNewTemplate({ name: '', entityType: 'repair', status: '', template: '' });
                        }}
                    >
                        إلغاء
                    </SimpleButton>
                    <SimpleButton
                        onClick={() => {
                            if (!newTemplate.name || !newTemplate.template) {
                                notifications.error('خطأ', { message: 'يرجى ملء جميع الحقول المطلوبة' });
                                return;
                            }
                            const customTemplates = messagingSettings.customTemplates || [];
                            const newTemplateData = {
                                id: `custom_${Date.now()}`,
                                ...newTemplate,
                                createdAt: new Date().toISOString()
                            };
                            handleMessagingChange('customTemplates', null, [...customTemplates, newTemplateData]);
                            setShowAddTemplateModal(false);
                            setNewTemplate({ name: '', entityType: 'repair', status: '', template: '' });
                            notifications.success('تم الحفظ', { message: 'تم إضافة القالب المخصص بنجاح' });
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        حفظ
                    </SimpleButton>
                </ModalFooter>
            </Modal>
        </div>
    );
}
