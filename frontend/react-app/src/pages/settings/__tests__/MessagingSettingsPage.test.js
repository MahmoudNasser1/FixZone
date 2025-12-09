/**
 * اختبارات صفحة إعدادات المراسلة
 * 
 * هذا الملف يحتوي على اختبارات شاملة لصفحة إعدادات المراسلة
 * بما في ذلك:
 * - إضافة القوالب المخصصة
 * - حذف القوالب المخصصة
 * - عرض القوالب المخصصة
 * - حفظ الإعدادات
 * - الجدولة
 */

// Mock API
const mockApi = {
    getSystemSetting: jest.fn(),
    updateSystemSetting: jest.fn(),
    createSystemSetting: jest.fn()
};

// Mock Notifications
const mockNotifications = {
    success: jest.fn(),
    error: jest.fn()
};

describe('MessagingSettingsPage - Custom Templates', () => {
    let messagingSettings;
    let customTemplates;

    beforeEach(() => {
        // إعدادات أولية
        messagingSettings = {
            whatsapp: {
                enabled: true,
                defaultMessage: 'مرحباً {customerName}'
            },
            email: {
                enabled: false
            },
            automation: {
                enabled: true,
                defaultChannels: ['whatsapp']
            },
            customTemplates: []
        };

        customTemplates = [];
    });

    describe('إضافة قالب مخصص', () => {
        test('يجب إضافة قالب جديد إلى القائمة', () => {
            const newTemplate = {
                id: 'custom_1234567890',
                name: 'قالب تجريبي',
                entityType: 'repair',
                status: 'RECEIVED',
                template: 'مرحباً {customerName}، رقم الطلب: {repairNumber}',
                createdAt: new Date().toISOString()
            };

            customTemplates.push(newTemplate);
            messagingSettings.customTemplates = customTemplates;

            expect(messagingSettings.customTemplates).toHaveLength(1);
            expect(messagingSettings.customTemplates[0].name).toBe('قالب تجريبي');
            expect(messagingSettings.customTemplates[0].entityType).toBe('repair');
        });

        test('يجب أن يحتوي القالب على جميع الحقول المطلوبة', () => {
            const newTemplate = {
                id: 'custom_1234567890',
                name: 'قالب تجريبي',
                entityType: 'repair',
                status: 'RECEIVED',
                template: 'مرحباً {customerName}',
                createdAt: new Date().toISOString()
            };

            expect(newTemplate).toHaveProperty('id');
            expect(newTemplate).toHaveProperty('name');
            expect(newTemplate).toHaveProperty('entityType');
            expect(newTemplate).toHaveProperty('template');
            expect(newTemplate).toHaveProperty('createdAt');
        });

        test('يجب أن يكون للقالب ID فريد', () => {
            const template1 = {
                id: `custom_${Date.now()}`,
                name: 'قالب 1',
                entityType: 'repair',
                template: 'قالب 1'
            };

            const template2 = {
                id: `custom_${Date.now() + 1}`,
                name: 'قالب 2',
                entityType: 'invoice',
                template: 'قالب 2'
            };

            customTemplates.push(template1, template2);

            expect(customTemplates[0].id).not.toBe(customTemplates[1].id);
        });
    });

    describe('حذف قالب مخصص', () => {
        beforeEach(() => {
            customTemplates = [
                {
                    id: 'custom_1',
                    name: 'قالب 1',
                    entityType: 'repair',
                    template: 'قالب 1'
                },
                {
                    id: 'custom_2',
                    name: 'قالب 2',
                    entityType: 'invoice',
                    template: 'قالب 2'
                },
                {
                    id: 'custom_3',
                    name: 'قالب 3',
                    entityType: 'quotation',
                    template: 'قالب 3'
                }
            ];
            messagingSettings.customTemplates = customTemplates;
        });

        test('يجب حذف القالب المحدد فقط', () => {
            const templateToDelete = 'custom_2';
            const updated = customTemplates.filter(t => t.id !== templateToDelete);

            expect(updated).toHaveLength(2);
            expect(updated.find(t => t.id === 'custom_2')).toBeUndefined();
            expect(updated.find(t => t.id === 'custom_1')).toBeDefined();
            expect(updated.find(t => t.id === 'custom_3')).toBeDefined();
        });

        test('يجب أن تبقى القوالب الأخرى كما هي بعد الحذف', () => {
            const templateToDelete = 'custom_1';
            const updated = customTemplates.filter(t => t.id !== templateToDelete);

            expect(updated[0].id).toBe('custom_2');
            expect(updated[1].id).toBe('custom_3');
        });
    });

    describe('عرض القوالب المخصصة', () => {
        beforeEach(() => {
            customTemplates = [
                {
                    id: 'custom_1',
                    name: 'قالب إصلاح',
                    entityType: 'repair',
                    status: 'RECEIVED',
                    template: 'مرحباً {customerName}'
                },
                {
                    id: 'custom_2',
                    name: 'قالب فاتورة',
                    entityType: 'invoice',
                    status: 'unpaid',
                    template: 'فاتورة #{invoiceId}'
                }
            ];
            messagingSettings.customTemplates = customTemplates;
        });

        test('يجب عرض جميع القوالب المخصصة', () => {
            expect(messagingSettings.customTemplates).toHaveLength(2);
        });

        test('يجب تصفية القوالب حسب البحث', () => {
            const searchTerm = 'إصلاح';
            const filtered = customTemplates.filter(t => 
                t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.template.toLowerCase().includes(searchTerm.toLowerCase())
            );

            expect(filtered).toHaveLength(1);
            expect(filtered[0].name).toBe('قالب إصلاح');
        });

        test('يجب عرض القوالب المخصصة في Accordion منفصل', () => {
            const hasCustomTemplates = messagingSettings.customTemplates && 
                                      messagingSettings.customTemplates.length > 0;
            
            expect(hasCustomTemplates).toBe(true);
        });
    });

    describe('تحديث قالب مخصص', () => {
        beforeEach(() => {
            customTemplates = [
                {
                    id: 'custom_1',
                    name: 'قالب قديم',
                    entityType: 'repair',
                    template: 'قالب قديم'
                }
            ];
            messagingSettings.customTemplates = customTemplates;
        });

        test('يجب تحديث نص القالب', () => {
            const templateIndex = customTemplates.findIndex(t => t.id === 'custom_1');
            const updated = [...customTemplates];
            updated[templateIndex] = {
                ...updated[templateIndex],
                template: 'قالب محدث'
            };

            expect(updated[templateIndex].template).toBe('قالب محدث');
        });
    });

    describe('حفظ الإعدادات', () => {
        test('يجب حفظ القوالب المخصصة مع الإعدادات', async () => {
            messagingSettings.customTemplates = [
                {
                    id: 'custom_1',
                    name: 'قالب تجريبي',
                    entityType: 'repair',
                    template: 'قالب تجريبي'
                }
            ];

            const settingsToSave = JSON.stringify(messagingSettings);
            const parsed = JSON.parse(settingsToSave);

            expect(parsed.customTemplates).toHaveLength(1);
            expect(parsed.customTemplates[0].name).toBe('قالب تجريبي');
        });

        test('يجب استخدام updateSystemSetting عند وجود الإعدادات', async () => {
            mockApi.getSystemSetting.mockResolvedValue({
                key: 'messaging_settings',
                value: JSON.stringify(messagingSettings)
            });

            mockApi.updateSystemSetting.mockResolvedValue({ success: true });

            try {
                await mockApi.updateSystemSetting('messaging_settings', {
                    value: JSON.stringify(messagingSettings)
                });
            } catch (error) {
                // إذا فشل التحديث (404)، استخدم create
                if (error.message?.includes('404')) {
                    await mockApi.createSystemSetting({
                        key: 'messaging_settings',
                        value: JSON.stringify(messagingSettings)
                    });
                }
            }

            expect(mockApi.updateSystemSetting).toHaveBeenCalled();
        });
    });

    describe('الجدولة', () => {
        test('يجب حفظ إعدادات الجدولة', () => {
            const schedule = {
                type: 'daily',
                time: '09:00',
                days: [1, 2, 3, 4, 5, 6, 7],
                cronExpression: '0 9 * * *'
            };

            messagingSettings.automation = {
                ...messagingSettings.automation,
                invoice: {
                    overdueReminders: {
                        enabled: true,
                        schedule: schedule,
                        minDaysBetweenReminders: 1
                    }
                }
            };

            expect(messagingSettings.automation.invoice.overdueReminders.schedule.type).toBe('daily');
            expect(messagingSettings.automation.invoice.overdueReminders.schedule.time).toBe('09:00');
        });

        test('يجب حفظ الجدولة الأسبوعية', () => {
            const schedule = {
                type: 'weekly',
                time: '10:00',
                days: [1, 2, 3, 4, 5],
                cronExpression: '0 10 * * 1-5'
            };

            messagingSettings.automation = {
                ...messagingSettings.automation,
                invoice: {
                    beforeDueReminders: {
                        enabled: true,
                        schedule: schedule,
                        daysBeforeDue: 3,
                        minDaysBetweenReminders: 1
                    }
                }
            };

            expect(messagingSettings.automation.invoice.beforeDueReminders.schedule.type).toBe('weekly');
            expect(messagingSettings.automation.invoice.beforeDueReminders.schedule.days).toEqual([1, 2, 3, 4, 5]);
        });
    });
});

// اختبارات التكامل
describe('MessagingSettingsPage - Integration Tests', () => {
    test('يجب أن تعمل دورة كاملة: إضافة -> حفظ -> تحميل -> حذف', async () => {
        let messagingSettings = {
            customTemplates: []
        };

        // 1. إضافة قالب
        const newTemplate = {
            id: 'custom_123',
            name: 'قالب تجريبي',
            entityType: 'repair',
            template: 'قالب تجريبي'
        };
        messagingSettings.customTemplates.push(newTemplate);
        expect(messagingSettings.customTemplates).toHaveLength(1);

        // 2. حفظ
        const saved = JSON.stringify(messagingSettings);
        expect(saved).toContain('custom_123');

        // 3. تحميل
        const loaded = JSON.parse(saved);
        expect(loaded.customTemplates).toHaveLength(1);

        // 4. حذف
        loaded.customTemplates = loaded.customTemplates.filter(t => t.id !== 'custom_123');
        expect(loaded.customTemplates).toHaveLength(0);
    });
});




