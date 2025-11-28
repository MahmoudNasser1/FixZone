import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import api from '../../services/api';

export default function ReceiptPrintSettingsPage() {
    const notifications = useNotifications();
    const [saving, setSaving] = useState(false);
    const [print, setPrint] = useState({
        title: 'إيصال استلام',
        showLogo: true,
        logoUrl: '/assets/logo.png',
        showQr: true,
        qrSize: 180,
        showDevicePassword: false,
        showSerialBarcode: true,
        barcodeWidth: 1,
        barcodeHeight: 28,
        compactMode: false,
        branchName: '',
        branchAddress: '',
        branchPhone: '',
        margins: { top: 16, right: 16, bottom: 16, left: 16 },
        dateDisplay: 'both',
        terms: ''
    });

    useEffect(() => {
        let mounted = true;
        api.getPrintSettings().then((data) => {
            if (mounted && data) {
                // Only take relevant fields, excluding invoice
                const { invoice, ...receiptSettings } = data;
                setPrint((p) => ({ ...p, ...receiptSettings }));
            }
        }).catch(console.error);
        return () => { mounted = false; };
    }, []);

    const handlePrintChange = (e) => {
        const { name, value, type, checked } = e.target;
        const bools = new Set(['showLogo', 'showQr', 'showDevicePassword', 'showSerialBarcode', 'compactMode']);
        const nums = new Set(['qrSize', 'barcodeWidth', 'barcodeHeight', 'margins.top', 'margins.right', 'margins.bottom', 'margins.left']);

        if (name.startsWith('margins.')) {
            const key = name.split('.')[1];
            setPrint((p) => ({ ...p, margins: { ...p.margins, [key]: Number(value) } }));
            return;
        }

        setPrint((p) => ({
            ...p,
            [name]: bools.has(name) ? (type === 'checkbox' ? checked : value === 'true') : nums.has(name) ? Number(value) : value,
        }));
    };

    const handleSavePrint = async () => {
        try {
            setSaving(true);
            const payload = {
                title: print.title,
                showLogo: !!print.showLogo,
                logoUrl: print.logoUrl,
                showQr: !!print.showQr,
                qrSize: Number(print.qrSize) || 180,
                showDevicePassword: !!print.showDevicePassword,
                showSerialBarcode: !!print.showSerialBarcode,
                barcodeWidth: Number(print.barcodeWidth) || 1,
                barcodeHeight: Number(print.barcodeHeight) || 28,
                compactMode: !!print.compactMode,
                branchName: print.branchName,
                branchAddress: print.branchAddress,
                branchPhone: print.branchPhone,
                margins: {
                    top: Number(print.margins.top) || 16,
                    right: Number(print.margins.right) || 16,
                    bottom: Number(print.margins.bottom) || 16,
                    left: Number(print.margins.left) || 16,
                },
                dateDisplay: print.dateDisplay,
                terms: print.terms,
            };
            await api.updatePrintSettings(payload);
            notifications.success('تم الحفظ بنجاح', {
                message: 'تم حفظ إعدادات إيصال الاستلام بنجاح'
            });
        } catch (e) {
            console.error(e);
            notifications.error('تعذر الحفظ', {
                message: e.message || 'حدث خطأ أثناء حفظ إعدادات الإيصال'
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <SimpleCard>
                <SimpleCardHeader className="flex flex-row items-center justify-between">
                    <SimpleCardTitle>إعدادات إيصال الاستلام</SimpleCardTitle>
                    <SimpleButton
                        onClick={handleSavePrint}
                        disabled={saving}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'جاري الحفظ...' : 'حفظ'}
                    </SimpleButton>
                </SimpleCardHeader>
                <SimpleCardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الإيصال</label>
                            <input
                                name="title"
                                value={print.title}
                                onChange={handlePrintChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div className="flex items-center h-full pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="showLogo"
                                    checked={!!print.showLogo}
                                    onChange={handlePrintChange}
                                    className="rounded text-blue-600"
                                />
                                <span className="text-sm font-medium text-gray-700">إظهار الشعار</span>
                            </label>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">رابط الشعار</label>
                            <input
                                name="logoUrl"
                                value={print.logoUrl}
                                onChange={handlePrintChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                dir="ltr"
                            />
                        </div>

                        <div className="flex items-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="showQr"
                                    checked={!!print.showQr}
                                    onChange={handlePrintChange}
                                    className="rounded text-blue-600"
                                />
                                <span className="text-sm font-medium text-gray-700">إظهار QR للتتبّع</span>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">حجم QR</label>
                            <input
                                type="number"
                                min={100}
                                max={320}
                                name="qrSize"
                                value={print.qrSize}
                                onChange={handlePrintChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div className="flex items-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="showDevicePassword"
                                    checked={!!print.showDevicePassword}
                                    onChange={handlePrintChange}
                                    className="rounded text-blue-600"
                                />
                                <span className="text-sm font-medium text-gray-700">عرض كلمة المرور على الإيصال</span>
                            </label>
                        </div>

                        <div className="flex items-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="showSerialBarcode"
                                    checked={!!print.showSerialBarcode}
                                    onChange={handlePrintChange}
                                    className="rounded text-blue-600"
                                />
                                <span className="text-sm font-medium text-gray-700">إظهار باركود الرقم التسلسلي</span>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">عرض الباركود</label>
                            <input
                                type="number"
                                name="barcodeWidth"
                                value={print.barcodeWidth}
                                onChange={handlePrintChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ارتفاع الباركود</label>
                            <input
                                type="number"
                                name="barcodeHeight"
                                value={print.barcodeHeight}
                                onChange={handlePrintChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div className="flex items-center md:col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="compactMode"
                                    checked={!!print.compactMode}
                                    onChange={handlePrintChange}
                                    className="rounded text-blue-600"
                                />
                                <span className="text-sm font-medium text-gray-700">وضع الطباعة المصغر (Compact Mode)</span>
                            </label>
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">معلومات الفرع (تظهر في الإيصال)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الفرع</label>
                                <input
                                    name="branchName"
                                    value={print.branchName}
                                    onChange={handlePrintChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                                <input
                                    name="branchAddress"
                                    value={print.branchAddress}
                                    onChange={handlePrintChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">الهاتف</label>
                                <input
                                    name="branchPhone"
                                    value={print.branchPhone}
                                    onChange={handlePrintChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">هوامش الطباعة (بكسل)</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">أعلى</label>
                                <input
                                    type="number"
                                    name="margins.top"
                                    value={print.margins.top}
                                    onChange={handlePrintChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">يمين</label>
                                <input
                                    type="number"
                                    name="margins.right"
                                    value={print.margins.right}
                                    onChange={handlePrintChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">أسفل</label>
                                <input
                                    type="number"
                                    name="margins.bottom"
                                    value={print.margins.bottom}
                                    onChange={handlePrintChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">يسار</label>
                                <input
                                    type="number"
                                    name="margins.left"
                                    value={print.margins.left}
                                    onChange={handlePrintChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">طريقة عرض التاريخ</label>
                                <select
                                    name="dateDisplay"
                                    value={print.dateDisplay}
                                    onChange={handlePrintChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="date">التاريخ فقط</option>
                                    <option value="datetime">التاريخ والوقت</option>
                                    <option value="both">كلاهما</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">الشروط والأحكام (تظهر أسفل الإيصال)</label>
                                <textarea
                                    name="terms"
                                    value={print.terms}
                                    onChange={handlePrintChange}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
                    </div>
                </SimpleCardContent>
            </SimpleCard>
        </div>
    );
}
