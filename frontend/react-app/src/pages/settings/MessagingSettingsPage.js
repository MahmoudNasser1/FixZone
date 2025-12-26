import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Save, Send, MessageSquare, FileText, Settings, Eye, RotateCcw, Search, X, Plus, Trash2, Clock, Calendar, Edit, CheckCheck, Smartphone, Mail, Globe, Wrench, CreditCard, AlertTriangle } from 'lucide-react';
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
            <div className="space-y-2 border border-border rounded-lg p-4 bg-background">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <label className="block text-sm font-medium text-foreground text-right font-bold">
                        {template.label}
                    </label>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <SimpleButton
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setEditingTemplate(template);
                                setEditTemplateValue(value);
                            }}
                            className="text-xs flex-1 sm:flex-none"
                        >
                            <Edit className="w-3 h-3 ml-1" />
                            تعديل
                        </SimpleButton>
                        <SimpleButton
                            variant="outline"
                            size="sm"
                            onClick={() => resetTemplate(template.key)}
                            className="text-xs flex-1 sm:flex-none"
                        >
                            <RotateCcw className="w-3 h-3 ml-1" />
                            استعادة
                        </SimpleButton>
                    </div>
                </div>
                <div className="bg-muted/50 border border-border rounded-md p-3 min-h-[80px]">
                    <pre className="text-sm text-foreground whitespace-pre-wrap font-mono text-right" dir="rtl">
                        {preview}
                    </pre>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-[10px] text-muted-foreground font-medium">المتغيرات:</span>
                    {template.variables.split(',').map((v, i) => (
                        <span key={i} className="text-[10px] bg-primary/10 text-primary px-1 rounded">{v.trim()}</span>
                    ))}
                </div>
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
                        <MessageSquare className="w-5 h-5 text-green-500" />
                        إعدادات واتساب (WhatsApp)
                    </SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <label className="flex items-center gap-2 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                            <input
                                type="checkbox"
                                checked={messagingSettings.whatsapp.enabled}
                                onChange={(e) => handleMessagingChange('whatsapp', 'enabled', e.target.checked)}
                                className="rounded text-primary focus:ring-primary"
                            />
                            <span className="font-medium text-foreground text-sm">تفعيل واتساب</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                            <input
                                type="checkbox"
                                checked={messagingSettings.whatsapp.webEnabled}
                                onChange={(e) => handleMessagingChange('whatsapp', 'webEnabled', e.target.checked)}
                                className="rounded text-primary focus:ring-primary"
                            />
                            <span className="font-medium text-foreground text-sm">WhatsApp Web</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                            <input
                                type="checkbox"
                                checked={messagingSettings.whatsapp.apiEnabled}
                                onChange={(e) => handleMessagingChange('whatsapp', 'apiEnabled', e.target.checked)}
                                className="rounded text-primary focus:ring-primary"
                            />
                            <span className="font-medium text-foreground text-sm">WhatsApp API</span>
                        </label>
                    </div>

                    {messagingSettings.whatsapp.apiEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border border-border">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1 text-right">API URL</label>
                                <input
                                    type="text"
                                    value={messagingSettings.whatsapp.apiUrl}
                                    onChange={(e) => handleMessagingChange('whatsapp', 'apiUrl', e.target.value)}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                                    placeholder="https://api.whatsapp.com/send"
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1 text-right">API Token / Secret Key</label>
                                <input
                                    type="password"
                                    value={messagingSettings.whatsapp.apiToken}
                                    onChange={(e) => handleMessagingChange('whatsapp', 'apiToken', e.target.value)}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
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
                        <MessageSquare className="w-5 h-5 text-blue-500" />
                        إعدادات البريد الإلكتروني (Email)
                    </SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer w-full sm:w-auto">
                            <input
                                type="checkbox"
                                checked={messagingSettings.email.enabled}
                                onChange={(e) => handleMessagingChange('email', 'enabled', e.target.checked)}
                                className="rounded text-primary focus:ring-primary"
                            />
                            <span className="font-medium text-foreground text-sm">تفعيل البريد الإلكتروني</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-muted-foreground mr-1 text-right">SMTP Host</label>
                            <input
                                type="text"
                                value={messagingSettings.email.smtpHost}
                                onChange={(e) => handleMessagingChange('email', 'smtpHost', e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm"
                                placeholder="smtp.gmail.com"
                                dir="ltr"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-muted-foreground mr-1 text-right">SMTP Port</label>
                            <input
                                type="number"
                                value={messagingSettings.email.smtpPort}
                                onChange={(e) => handleMessagingChange('email', 'smtpPort', e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm"
                                placeholder="587"
                                dir="ltr"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-muted-foreground mr-1 text-right">SMTP User</label>
                            <input
                                type="text"
                                value={messagingSettings.email.smtpUser}
                                onChange={(e) => handleMessagingChange('email', 'smtpUser', e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm"
                                dir="ltr"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-muted-foreground mr-1 text-right">SMTP Password</label>
                            <input
                                type="password"
                                value={messagingSettings.email.smtpPassword}
                                onChange={(e) => handleMessagingChange('email', 'smtpPassword', e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm"
                                dir="ltr"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-muted-foreground mr-1 text-right">From Email</label>
                            <input
                                type="email"
                                value={messagingSettings.email.fromEmail}
                                onChange={(e) => handleMessagingChange('email', 'fromEmail', e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm"
                                dir="ltr"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-muted-foreground mr-1 text-right">From Name</label>
                            <input
                                type="text"
                                value={messagingSettings.email.fromName}
                                onChange={(e) => handleMessagingChange('email', 'fromName', e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-muted-foreground mr-1 text-right">عنوان الرسالة الافتراضي</label>
                        <input
                            type="text"
                            value={messagingSettings.email.defaultSubject}
                            onChange={(e) => handleMessagingChange('email', 'defaultSubject', e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-muted-foreground mr-1 text-right">قالب الرسالة الافتراضي</label>
                        <textarea
                            value={messagingSettings.email.defaultTemplate}
                            onChange={(e) => handleMessagingChange('email', 'defaultTemplate', e.target.value)}
                            rows={6}
                            className="w-full px-3 py-2 bg-background border border-border rounded-md font-mono text-sm text-foreground text-right"
                            dir="rtl"
                        />
                        <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-[10px] text-muted-foreground font-medium">المتغيرات:</span>
                            {'{customerName}, {invoiceId}, {totalAmount}, {currency}, {invoiceDate}, {status}, {invoiceLink}'.split(',').map((v, i) => (
                                <span key={i} className="text-[10px] bg-primary/10 text-primary px-1 rounded">{v.trim()}</span>
                            ))}
                        </div>
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
                    <SimpleCardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex-1 w-full md:w-auto order-2 md:order-1">
                                <div className="relative" dir="rtl">
                                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <input
                                        type="text"
                                        value={templateSearch}
                                        onChange={(e) => setTemplateSearch(e.target.value)}
                                        placeholder="ابحث في القوالب (الاسم، المحتوى، المتغيرات)..."
                                        className="w-full pr-10 pl-4 py-2.5 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground transition-all"
                                    />
                                    {templateSearch && (
                                        <button
                                            onClick={() => setTemplateSearch('')}
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto order-1 md:order-2">
                                <div className="text-right">
                                    <h3 className="text-lg font-bold text-foreground">المكتبة الذكية للقوالب</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        تتحكم في <span className="font-bold text-primary">{totalTemplates} قالب</span> نشط عبر جميع القنوات
                                    </p>
                                </div>
                                <SimpleButton
                                    onClick={() => setShowAddTemplateModal(true)}
                                    className="w-full sm:w-auto shadow-lg shadow-primary/20"
                                >
                                    <Plus className="w-4 h-4 ml-1.5" />
                                    إضافة قالب مخصص
                                </SimpleButton>
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
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 relative overflow-hidden group font-arabic">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
                            <Settings className="w-12 h-12" />
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                            <strong className="text-primary">الذكاء الإجرائي:</strong> تتيح لك الأتمتة إرسال إشعارات ذكية لعملائك بمجرد تغيير حالة الطلب أو الفاتورة، مما يرفع مستوى الشفافية والاحترافية. يمكنك أيضاً جدولة تذكيرات الدفع لضمان تحصيل مستحقاتك في الموعد.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <label className="flex items-center gap-3 p-4 border border-border rounded-xl bg-background/50 hover:bg-muted/30 transition-all cursor-pointer w-full sm:w-auto shadow-sm">
                            <div className={`w-10 h-5 rounded-full transition-all duration-300 relative ${messagingSettings.automation?.enabled !== false ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]' : 'bg-muted border border-border'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${(messagingSettings.automation?.enabled !== false) ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                            <input
                                type="checkbox"
                                checked={messagingSettings.automation?.enabled ?? true}
                                onChange={(e) => handleMessagingChange('automation', 'enabled', e.target.checked)}
                                className="hidden"
                            />
                            <span className="font-bold text-foreground">تفعيل نظام الأتمتة الشامل</span>
                        </label>
                    </div>

                    {messagingSettings.automation?.enabled && (
                        <>
                            {/* Default Channels */}
                            <div className="bg-muted/30 border border-border rounded-xl p-6 mb-8">
                                <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-primary" />
                                    القنوات الافتراضية للبث التلقائي
                                </h4>
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
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
                                            className="rounded text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm font-medium text-foreground">واتساب (WhatsApp)</span>
                                    </label>
                                    <label className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
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
                                            className="rounded text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm font-medium text-foreground">بريد إلكتروني (Email)</span>
                                    </label>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-3 italic">
                                    * سيقوم النظام بإرسال الإشعارات عبر كافة القنوات المفعلة أعلاه بشكل متزامن.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    {/* Invoice Notifications */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2 px-1">
                                            <FileText className="w-4 h-4 text-blue-500" />
                                            إشعارات الفواتير
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="p-4 bg-background border border-border rounded-xl hover:border-primary/30 transition-colors">
                                                <label className="flex items-center justify-between cursor-pointer group">
                                                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">إنشاء فاتورة جديدة</span>
                                                    <div className={`w-10 h-5 rounded-full transition-all duration-300 relative group-hover:scale-105 ${messagingSettings.automation?.invoice?.notifyOnCreate ?? true ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]' : 'bg-muted border border-border'}`}>
                                                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${(messagingSettings.automation?.invoice?.notifyOnCreate ?? true) ? 'translate-x-5' : 'translate-x-0'}`} />
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={messagingSettings.automation?.invoice?.notifyOnCreate ?? true}
                                                        onChange={(e) => {
                                                            const invoice = messagingSettings.automation?.invoice || {};
                                                            handleMessagingChange('automation', { invoice: { ...invoice, notifyOnCreate: e.target.checked } });
                                                        }}
                                                        className="hidden"
                                                    />
                                                </label>
                                            </div>
                                            <div className="p-4 bg-background border border-border rounded-xl hover:border-primary/30 transition-colors">
                                                <label className="flex items-center justify-between cursor-pointer group">
                                                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">تغيير حالة الفاتورة</span>
                                                    <div className={`w-10 h-5 rounded-full transition-all duration-300 relative group-hover:scale-105 ${messagingSettings.automation?.invoice?.notifyOnStatusChange ?? false ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]' : 'bg-muted border border-border'}`}>
                                                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${(messagingSettings.automation?.invoice?.notifyOnStatusChange ?? false) ? 'translate-x-5' : 'translate-x-0'}`} />
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={messagingSettings.automation?.invoice?.notifyOnStatusChange ?? false}
                                                        onChange={(e) => {
                                                            const invoice = messagingSettings.automation?.invoice || {};
                                                            handleMessagingChange('automation', { invoice: { ...invoice, notifyOnStatusChange: e.target.checked } });
                                                        }}
                                                        className="hidden"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Repair Notifications */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2 px-1">
                                            <Wrench className="w-4 h-4 text-green-500" />
                                            إشعارات طلبات الإصلاح
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {[
                                                { key: 'notifyOnReceived', label: 'استلام الطلب', color: 'bg-blue-500/10 text-blue-500' },
                                                { key: 'notifyOnDiagnosed', label: 'اكتمال التشخيص', color: 'bg-purple-500/10 text-purple-500' },
                                                { key: 'notifyOnAwaitingApproval', label: 'بانتظار الموافقة', color: 'bg-orange-500/10 text-orange-500' },
                                                { key: 'notifyOnUnderRepair', label: 'قيد الإصلاح', color: 'bg-yellow-500/10 text-yellow-500' },
                                                { key: 'notifyOnWaitingParts', label: 'بانتظار قطع الغيار', color: 'bg-pink-500/10 text-pink-500' },
                                                { key: 'notifyOnReadyPickup', label: 'جاهزية الاستلام', color: 'bg-teal-500/10 text-teal-500' },
                                                { key: 'notifyOnCompleted', label: 'اكتمال الإصلاح', color: 'bg-green-500/10 text-green-500' },
                                                { key: 'notifyOnRejected', label: 'رفض الطلب', color: 'bg-red-500/10 text-red-500' },
                                                { key: 'notifyOnOnHold', label: 'تعليق الطلب', color: 'bg-gray-500/10 text-gray-500' }
                                            ].map((item) => (
                                                <div key={item.key} className="p-3 bg-background border border-border rounded-xl transition-all hover:bg-muted/30">
                                                    <label className="flex items-center justify-between cursor-pointer">
                                                        <span className="text-xs font-semibold text-foreground">{item.label}</span>
                                                        <div className={`w-10 h-5 rounded-full transition-all duration-300 relative group-hover:scale-105 ${messagingSettings.automation?.repair?.[item.key] ?? false ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]' : 'bg-muted border border-border'}`}>
                                                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${(messagingSettings.automation?.repair?.[item.key] ?? false) ? 'translate-x-5' : 'translate-x-0'}`} />
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={messagingSettings.automation?.repair?.[item.key] ?? false}
                                                            onChange={(e) => {
                                                                const repair = messagingSettings.automation?.repair || {};
                                                                handleMessagingChange('automation', { repair: { ...repair, [item.key]: e.target.checked } });
                                                            }}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Payment Reminders */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2 px-1">
                                            <CreditCard className="w-4 h-4 text-orange-500" />
                                            تذكيرات الدفع والتحصيل
                                        </h4>
                                        <div className="space-y-4">
                                            {/* Overdue Reminders */}
                                            <div className="p-5 bg-orange-500/5 border border-orange-500/20 rounded-2xl relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                                                <label className="flex items-center justify-between cursor-pointer mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                                                        <span className="font-bold text-foreground">تذكيرات الدفع المتأخرة</span>
                                                    </div>
                                                    <div className={`w-10 h-5 rounded-full transition-all duration-300 relative group-hover:scale-105 ${messagingSettings.automation?.invoice?.overdueReminders?.enabled !== false ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'bg-muted border border-border'}`}>
                                                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${(messagingSettings.automation?.invoice?.overdueReminders?.enabled !== false) ? 'translate-x-5' : 'translate-x-0'}`} />
                                                    </div>
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
                                                        className="hidden"
                                                    />
                                                </label>
                                                {messagingSettings.automation?.invoice?.overdueReminders?.enabled !== false && (
                                                    <div className="space-y-4 border-t border-orange-500/10 pt-4 animate-in slide-in-from-top-2 duration-300">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-xs text-muted-foreground">نمط الأتمتة:</span>
                                                            <div className="flex bg-muted/50 p-1 rounded-lg">
                                                                {['daily', 'weekly'].map(type => (
                                                                    <button
                                                                        key={type}
                                                                        onClick={() => {
                                                                            const invoice = messagingSettings.automation?.invoice || {};
                                                                            const overdue = invoice.overdueReminders || {};
                                                                            handleMessagingChange('automation', {
                                                                                invoice: {
                                                                                    ...invoice,
                                                                                    overdueReminders: {
                                                                                        ...overdue,
                                                                                        schedule: {
                                                                                            ...overdue.schedule,
                                                                                            type,
                                                                                            days: type === 'daily' ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5]
                                                                                        }
                                                                                    }
                                                                                }
                                                                            });
                                                                        }}
                                                                        className={`px-3 py-1 text-[10px] rounded-md transition-all ${(messagingSettings.automation?.invoice?.overdueReminders?.schedule?.type || 'daily') === type
                                                                            ? 'bg-orange-500 text-white shadow-sm'
                                                                            : 'text-muted-foreground hover:text-foreground'
                                                                            }`}
                                                                    >
                                                                        {type === 'daily' ? 'يومي' : 'أسبوعي'}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-muted-foreground">وقت الإرسال:</span>
                                                            <input
                                                                type="time"
                                                                value={messagingSettings.automation?.invoice?.overdueReminders?.schedule?.time || '09:00'}
                                                                onChange={(e) => {
                                                                    const invoice = messagingSettings.automation?.invoice || {};
                                                                    const overdue = invoice.overdueReminders || {};
                                                                    handleMessagingChange('automation', {
                                                                        invoice: {
                                                                            ...invoice,
                                                                            overdueReminders: {
                                                                                ...overdue,
                                                                                schedule: { ...overdue.schedule, time: e.target.value }
                                                                            }
                                                                        }
                                                                    });
                                                                }}
                                                                className="bg-transparent border-none text-xs font-bold text-foreground focus:ring-0 w-20 text-center"
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-muted-foreground">الفاصل الزمني (أيام):</span>
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
                                                                className="bg-background border border-border rounded-md text-xs font-bold text-foreground w-16 text-center py-1"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Before Due Reminders */}
                                            <div className="p-5 bg-blue-500/5 border border-blue-500/20 rounded-2xl relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                                                <label className="flex items-center justify-between cursor-pointer mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-blue-500" />
                                                        <span className="font-bold text-foreground">تذكيرات استباقية</span>
                                                    </div>
                                                    <div className={`w-10 h-5 rounded-full transition-all duration-300 relative group-hover:scale-105 ${messagingSettings.automation?.invoice?.beforeDueReminders?.enabled !== false ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-muted border border-border'}`}>
                                                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${(messagingSettings.automation?.invoice?.beforeDueReminders?.enabled !== false) ? 'translate-x-5' : 'translate-x-0'}`} />
                                                    </div>
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
                                                        className="hidden"
                                                    />
                                                </label>
                                                {messagingSettings.automation?.invoice?.beforeDueReminders?.enabled !== false && (
                                                    <div className="space-y-4 border-t border-blue-500/10 pt-4 animate-in slide-in-from-top-2 duration-300">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-muted-foreground">قبل الاستحقاق بـ:</span>
                                                            <div className="flex items-center gap-2">
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
                                                                    className="bg-background border border-border rounded-md text-xs font-bold text-foreground w-16 text-center py-1"
                                                                />
                                                                <span className="text-xs text-muted-foreground">أيام</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-muted-foreground">وقت الإرسال:</span>
                                                            <input
                                                                type="time"
                                                                value={messagingSettings.automation?.invoice?.beforeDueReminders?.schedule?.time || '10:00'}
                                                                onChange={(e) => {
                                                                    const invoice = messagingSettings.automation?.invoice || {};
                                                                    const beforeDue = invoice.beforeDueReminders || {};
                                                                    handleMessagingChange('automation', {
                                                                        invoice: {
                                                                            ...invoice,
                                                                            beforeDueReminders: {
                                                                                ...beforeDue,
                                                                                schedule: { ...beforeDue.schedule, time: e.target.value }
                                                                            }
                                                                        }
                                                                    });
                                                                }}
                                                                className="bg-transparent border-none text-xs font-bold text-foreground focus:ring-0 w-20 text-center"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
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
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SimpleCard className="border-none shadow-xl bg-background/50 backdrop-blur-md overflow-hidden">
                    <SimpleCardHeader className="border-b border-border bg-muted/30">
                        <SimpleCardTitle className="flex items-center gap-3 text-foreground font-bold">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Eye className="w-5 h-5 text-purple-500" />
                            </div>
                            مختبر معاينة القوالب
                        </SimpleCardTitle>
                    </SimpleCardHeader>
                    <SimpleCardContent className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Controls Side */}
                            <div className="lg:col-span-5 space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" />
                                        اختر القالب للمعاينة
                                    </label>
                                    <select
                                        value={selectedTemplate}
                                        onChange={(e) => setSelectedTemplate(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">-- اختر من مكتبة القوالب --</option>
                                        {allTemplates.map(template => (
                                            <option key={template.key} value={template.key}>
                                                {template.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedTemplate ? (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-sm font-bold text-foreground flex items-center gap-2">
                                                <Settings className="w-4 h-4 text-orange-500" />
                                                تخصيص قيم المتغيرات
                                            </label>
                                            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">تحديث فوري</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-muted/30 rounded-2xl border border-border">
                                            {Object.keys(previewVariables).map(key => (
                                                <div key={key} className="space-y-1">
                                                    <label className="text-[10px] font-medium text-muted-foreground mr-1 text-right block">{key}</label>
                                                    <input
                                                        type="text"
                                                        value={previewVariables[key]}
                                                        onChange={(e) => setPreviewVariables(prev => ({ ...prev, [key]: e.target.value }))}
                                                        className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none transition-all"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-2xl opacity-50 bg-muted/10">
                                        <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                                        <p className="text-sm text-foreground font-medium">ابدأ باختيار قالب من القائمة</p>
                                        <p className="text-xs text-muted-foreground mt-1">سيظهر لك نص القالب مع إمكانية تجربة المتغيرات</p>
                                    </div>
                                )}
                            </div>

                            {/* Preview Side */}
                            <div className="lg:col-span-7">
                                <div className="h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <label className="text-sm font-bold text-foreground">النتيجة النهائية (المعاينة الحية)</label>
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 rounded-full bg-red-400" />
                                            <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                            <div className="w-2 h-2 rounded-full bg-green-400" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-h-[400px] bg-muted/40 border border-border rounded-3xl p-6 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {selectedTemplate ? (
                                            <div className="relative h-full flex flex-col font-arabic">
                                                <div className="bg-background rounded-2xl rounded-tr-none p-5 shadow-sm border border-border text-foreground text-sm leading-relaxed whitespace-pre-wrap max-w-[90%] self-end relative animate-in zoom-in-95 duration-200">
                                                    {renderPreview()}
                                                    <div className="absolute top-0 -right-2 w-0 h-0 border-t-[10px] border-t-background border-r-[10px] border-r-transparent" />
                                                    <div className="text-[10px] text-muted-foreground mt-3 flex justify-end gap-1 items-center">
                                                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <CheckCheck className="w-3 h-3 text-blue-500" />
                                                    </div>
                                                </div>
                                                <div className="mt-auto pt-6 border-t border-border/50 flex items-center justify-center gap-4 text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="p-2 bg-background rounded-full border border-border">
                                                            <Smartphone className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-[10px]">موبايل</span>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity cursor-not-allowed">
                                                        <div className="p-2 bg-background rounded-full border border-border">
                                                            <Mail className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-[10px]">إيميل</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center">
                                                <p className="text-muted-foreground text-sm italic">في انتظار اختيار القالب...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SimpleCardContent>
                </SimpleCard>
            </div>
        );
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header with Save Button */}
            <div className="sticky top-0 z-20 pb-4">
                <div className="bg-background/80 backdrop-blur-xl border border-border rounded-2xl shadow-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <MessageSquare className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-foreground">إعدادات المراسلة</h1>
                            <p className="text-xs text-muted-foreground font-medium">إدارة القنوات، القوالب، والأتمتة الذكية</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {hasUnsavedChanges && (
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full animate-in fade-in zoom-in">
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-tight">لديك تغييرات غير محفوظة</span>
                            </div>
                        )}
                        <SimpleButton
                            onClick={handleMessagingSave}
                            disabled={saving}
                            className={`flex-1 sm:flex-none h-11 px-8 rounded-xl font-bold shadow-lg transition-all ${saving ? 'bg-muted opacity-80' : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 active:scale-95'
                                }`}
                        >
                            {saving ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>جاري الحفظ...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Save className="w-4 h-4" />
                                    <span>حفظ الإعدادات</span>
                                </div>
                            )}
                        </SimpleButton>
                    </div>
                </div>
            </div>

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
                size="2xl"
                className="font-arabic"
            >
                <div className="p-6 space-y-6">
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mb-4">
                        <p className="text-xs text-primary font-medium leading-relaxed">
                            تسمح لك القوالب المخصصة بإنشاء رسائل فريدة مرتبطة بحالات معينة في النظام.
                            يمكنك استخدام المتغيرات بالأسفل ليقوم النظام بتعويضها آلياً عند الإرسال.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground mr-1">اسم القالب الفريد</label>
                            <input
                                type="text"
                                value={newTemplate.name}
                                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                placeholder="مثال: رسالة تأكيد استلام الجهاز"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground mr-1">نوع الكيان</label>
                                <select
                                    value={newTemplate.entityType}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, entityType: e.target.value, status: '' })}
                                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="repair">طلب إصلاح</option>
                                    <option value="invoice">فاتورة</option>
                                    <option value="quotation">عرض سعر</option>
                                    <option value="payment">دفعة</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground mr-1">الحالة المرتبطة (اختياري)</label>
                                <select
                                    value={newTemplate.status}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, status: e.target.value })}
                                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">-- اختر حالة للربط --</option>
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

                        <div className="space-y-1.5 text-right">
                            <label className="text-xs font-bold text-muted-foreground mr-1">محتوى القالب</label>
                            <textarea
                                value={newTemplate.template}
                                onChange={(e) => setNewTemplate({ ...newTemplate, template: e.target.value })}
                                rows={8}
                                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono"
                                placeholder="أدخل نص القالب هنا..."
                                dir="rtl"
                            />
                            <div className="flex flex-wrap gap-1.5 mt-2 justify-end">
                                {['customerName', 'repairNumber', 'deviceInfo', 'problem', 'trackingUrl', 'invoiceId', 'totalAmount', 'currency'].map(v => (
                                    <span key={v} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-mono">{`{${v}}`}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-border bg-muted/30 flex items-center justify-end gap-3">
                    <SimpleButton
                        variant="ghost"
                        onClick={() => {
                            setShowAddTemplateModal(false);
                            setNewTemplate({ name: '', entityType: 'repair', status: '', template: '' });
                        }}
                        className="font-bold text-muted-foreground hover:text-foreground hover:bg-muted"
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
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 shadow-lg shadow-primary/20"
                    >
                        حفظ القالب
                    </SimpleButton>
                </div>
            </Modal>
        </div>
    );
}
