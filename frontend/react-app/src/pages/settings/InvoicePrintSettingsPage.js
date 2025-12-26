import React, { useState, useEffect, useMemo } from 'react';
import { Save, Upload } from 'lucide-react';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { useSettings } from '../../context/SettingsContext';
import api from '../../services/api';

export default function InvoicePrintSettingsPage() {
    const notifications = useNotifications();
    const { formatMoney } = useSettings();
    const [saving, setSaving] = useState(false);
    const [invoicePrint, setInvoicePrint] = useState({
        title: 'فاتورة',
        showLogo: true,
        logoUrl: '',
        logoHeight: 50,
        logoPosition: 'center',
        showHeader: true,
        headerText: 'فاتورة ضريبية',
        headerFontSize: 24,
        showInvoiceNumber: true,
        showInvoiceDate: true,
        showDueDate: true,
        showCustomerInfo: true,
        customerInfoLayout: 'vertical',
        showCompanyInfo: true,
        companyInfoLayout: 'vertical',
        showDeviceSection: true,
        showItemsTable: true,
        tableStyle: 'bordered',
        showItemDescription: true,
        showItemQuantity: true,
        showItemPrice: true,
        showItemDiscount: true,
        showItemTax: true,
        showItemTotal: true,
        showServiceNotes: true,
        serviceNotesLabel: 'ملاحظات',
        showSubtotal: true,
        showDiscount: true,
        showTax: true,
        showShipping: true,
        showTotal: true,
        showPaymentMethod: true,
        showPaymentStatus: true,
        showNotes: true,
        notesLabel: 'ملاحظات',
        showTerms: true,
        termsLabel: 'الشروط والأحكام',
        termsText: 'شكراً لتعاملكم معنا',
        showSignature: true,
        signatureLabel: 'التوقيع',
        showFooter: true,
        footerText: '',
        paperSize: 'A4',
        orientation: 'portrait',
        fontSize: 12,
        titleFontSize: 20,
        sectionTitleFontSize: 14,
        tableFontSize: 11,
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        lineHeight: 1.5,
        spacing: { section: 15, item: 8, paragraph: 10 },
        colors: {
            primary: '#000000',
            secondary: '#666666',
            border: '#cccccc',
            headerBg: '#f5f5f5',
            alternateRow: '#fafafa'
        },
        showBarcode: true,
        barcodePosition: 'bottom',
        barcodeWidth: 2,
        barcodeHeight: 40,
        showQrCode: false,
        qrCodePosition: 'top-right',
        qrCodeSize: 80,
        watermark: {
            enabled: false,
            text: 'مسودة',
            opacity: 0.1,
            position: 'center'
        },
        pageBreak: {
            avoidItems: true,
            avoidCustomerInfo: true
        },
        currency: {
            showSymbol: true,
            symbolPosition: 'before',
            showCode: false
        },
        dateFormat: 'yyyy/MM/dd',
        dateDisplay: 'both',
        numberFormat: {
            decimalPlaces: 2,
            thousandSeparator: ',',
            decimalSeparator: '.'
        },
        financial: {
            showTax: true,
            showShipping: true,
            defaultTaxPercent: 15,
            defaultShippingAmount: 150
        }
    });

    useEffect(() => {
        let mounted = true;
        api.getPrintSettings().then((data) => {
            if (mounted && data && data.invoice) {
                setInvoicePrint((ip) => ({ ...ip, ...data.invoice }));
            }
        }).catch(console.error);
        return () => { mounted = false; };
    }, []);

    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            notifications.error('خطأ', { message: 'الملف يجب أن يكون صورة' });
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            setInvoicePrint(prev => ({ ...prev, logoUrl: base64 }));
        };
        reader.onerror = () => {
            notifications.error('خطأ', { message: 'فشل قراءة الملف' });
        };
        reader.readAsDataURL(file);
    };

    const handleInvoicePrintChange = (e) => {
        const { name, value, type, checked } = e.target;
        const bools = new Set([
            'showLogo', 'showHeader', 'showInvoiceNumber', 'showInvoiceDate', 'showDueDate',
            'showCustomerInfo', 'showCompanyInfo', 'showDeviceSection', 'showItemsTable', 'showItemDescription',
            'showItemQuantity', 'showItemPrice', 'showItemDiscount', 'showItemTax',
            'showItemTotal', 'showSubtotal', 'showDiscount', 'showTax', 'showShipping',
            'showTotal', 'showPaymentMethod', 'showPaymentStatus', 'showNotes', 'showTerms',
            'showSignature', 'showFooter', 'showBarcode', 'showQrCode', 'showServiceNotes'
        ]);
        const nums = new Set([
            'logoHeight', 'headerFontSize', 'fontSize', 'titleFontSize', 'sectionTitleFontSize',
            'tableFontSize', 'lineHeight', 'barcodeWidth', 'barcodeHeight', 'qrCodeSize',
            'margins.top', 'margins.right', 'margins.bottom', 'margins.left',
            'spacing.section', 'spacing.item', 'spacing.paragraph',
            'watermark.opacity', 'numberFormat.decimalPlaces'
        ]);

        if (name.startsWith('margins.')) {
            const key = name.split('.')[1];
            setInvoicePrint((ip) => ({ ...ip, margins: { ...ip.margins, [key]: Number(value) } }));
            return;
        }
        if (name.startsWith('spacing.')) {
            const key = name.split('.')[1];
            setInvoicePrint((ip) => ({ ...ip, spacing: { ...ip.spacing, [key]: Number(value) } }));
            return;
        }
        if (name.startsWith('watermark.')) {
            const key = name.split('.')[1];
            setInvoicePrint((ip) => ({
                ...ip,
                watermark: { ...ip.watermark, [key]: key === 'enabled' ? checked : (key === 'opacity' ? Number(value) : value) }
            }));
            return;
        }
        if (name.startsWith('pageBreak.')) {
            const key = name.split('.')[1];
            setInvoicePrint((ip) => ({
                ...ip,
                pageBreak: { ...ip.pageBreak, [key]: checked }
            }));
            return;
        }
        if (name.startsWith('currency.')) {
            const key = name.split('.')[1];
            setInvoicePrint((ip) => ({
                ...ip,
                currency: { ...ip.currency, [key]: key === 'showSymbol' || key === 'showCode' ? checked : value }
            }));
            return;
        }
        if (name.startsWith('numberFormat.')) {
            const key = name.split('.')[1];
            setInvoicePrint((ip) => ({
                ...ip,
                numberFormat: { ...ip.numberFormat, [key]: key === 'decimalPlaces' ? Number(value) : value }
            }));
            return;
        }
        if (name.startsWith('colors.')) {
            const key = name.split('.')[1];
            setInvoicePrint((ip) => ({
                ...ip,
                colors: { ...ip.colors, [key]: value }
            }));
            return;
        }
        if (name.startsWith('financial.')) {
            const key = name.split('.')[1];
            setInvoicePrint((ip) => ({
                ...ip,
                financial: {
                    ...ip.financial,
                    [key]: key === 'showTax' || key === 'showShipping' ? checked : (key === 'defaultTaxPercent' || key === 'defaultShippingAmount' ? Number(value) : value)
                }
            }));
            return;
        }

        setInvoicePrint((ip) => ({
            ...ip,
            [name]: bools.has(name) ? (type === 'checkbox' ? checked : value === 'true') : nums.has(name) ? Number(value) : value,
        }));
    };

    const handleSaveInvoicePrint = async () => {
        setSaving(true);
        try {
            const payload = {
                invoice: {
                    ...invoicePrint,
                    margins: {
                        top: Number(invoicePrint.margins.top) || 20,
                        right: Number(invoicePrint.margins.right) || 20,
                        bottom: Number(invoicePrint.margins.bottom) || 20,
                        left: Number(invoicePrint.margins.left) || 20,
                    },
                    spacing: {
                        section: Number(invoicePrint.spacing.section) || 15,
                        item: Number(invoicePrint.spacing.item) || 8,
                        paragraph: Number(invoicePrint.spacing.paragraph) || 10,
                    },
                    watermark: {
                        enabled: !!invoicePrint.watermark.enabled,
                        text: invoicePrint.watermark.text || 'مسودة',
                        opacity: Number(invoicePrint.watermark.opacity) || 0.1,
                        position: invoicePrint.watermark.position || 'center',
                    },
                    pageBreak: {
                        avoidItems: !!invoicePrint.pageBreak.avoidItems,
                        avoidCustomerInfo: !!invoicePrint.pageBreak.avoidCustomerInfo,
                    },
                    currency: {
                        showSymbol: !!invoicePrint.currency.showSymbol,
                        symbolPosition: invoicePrint.currency.symbolPosition || 'before',
                        showCode: !!invoicePrint.currency.showCode,
                    },
                    numberFormat: {
                        decimalPlaces: Number(invoicePrint.numberFormat.decimalPlaces) || 2,
                        thousandSeparator: invoicePrint.numberFormat.thousandSeparator || ',',
                        decimalSeparator: invoicePrint.numberFormat.decimalSeparator || '.',
                    },
                    dateDisplay: invoicePrint.dateDisplay || 'both',
                    financial: {
                        showTax: !!invoicePrint.financial?.showTax,
                        showShipping: !!invoicePrint.financial?.showShipping,
                        defaultTaxPercent: Number(invoicePrint.financial?.defaultTaxPercent) || 15,
                        defaultShippingAmount: Number(invoicePrint.financial?.defaultShippingAmount) || 150
                    }
                }
            };
            await api.updatePrintSettings(payload);
            notifications.success('تم الحفظ بنجاح', {
                message: 'تم حفظ إعدادات طباعة الفواتير بنجاح'
            });
        } catch (e) {
            console.error(e);
            notifications.error('تعذر الحفظ', {
                message: e.message || 'حدث خطأ أثناء حفظ إعدادات طباعة الفواتير'
            });
        } finally {
            setSaving(false);
        }
    };

    const PreviewCurrency = useMemo(() => (
        <span className="inline-block text-sm text-muted-foreground">
            مثال: {formatMoney(12345.67)}
        </span>
    ), [formatMoney]);

    return (
        <div className="space-y-4">
            <SimpleCard>
                <SimpleCardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <SimpleCardTitle>إعدادات طباعة الفواتير</SimpleCardTitle>
                    <SimpleButton
                        onClick={handleSaveInvoicePrint}
                        disabled={saving}
                        className="w-full sm:w-auto"
                    >
                        <Save className="h-4 w-4 ml-2" />
                        {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                    </SimpleButton>
                </SimpleCardHeader>
                <SimpleCardContent className="space-y-6">
                    {/* Header & Logo */}
                    <div className="border-b border-border pb-6">
                        <h3 className="text-lg font-medium text-foreground mb-4">الرأس والشعار</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">عنوان الفاتورة</label>
                                <input
                                    name="headerText"
                                    value={invoicePrint.headerText}
                                    onChange={handleInvoicePrintChange}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">حجم خط العنوان</label>
                                <input
                                    type="number"
                                    name="headerFontSize"
                                    value={invoicePrint.headerFontSize}
                                    onChange={handleInvoicePrintChange}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 cursor-pointer mb-2">
                                    <input
                                        type="checkbox"
                                        name="showLogo"
                                        checked={!!invoicePrint.showLogo}
                                        onChange={handleInvoicePrintChange}
                                        className="rounded text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium text-foreground">إظهار الشعار</span>
                                </label>
                                {invoicePrint.showLogo && (
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-muted/30 rounded-lg">
                                        <div className="flex-1 w-full">
                                            <label className="block text-sm font-medium text-muted-foreground mb-1">رفع شعار جديد</label>
                                            <div className="flex items-center gap-2">
                                                <label className="cursor-pointer bg-background border border-border rounded-md px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2">
                                                    <Upload className="h-4 w-4" />
                                                    <span className="text-sm">اختر ملف</span>
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                                </label>
                                                <span className="text-xs text-muted-foreground">PNG, JPG (Max 1MB)</span>
                                            </div>
                                        </div>
                                        {invoicePrint.logoUrl && (
                                            <div className="w-20 h-20 border border-border rounded-md p-1 flex items-center justify-center bg-background">
                                                <img src={invoicePrint.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content Options */}
                    <div className="border-b border-border pb-6">
                        <h3 className="text-lg font-medium text-foreground mb-4">محتوى الفاتورة</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { key: 'showInvoiceNumber', label: 'رقم الفاتورة' },
                                { key: 'showInvoiceDate', label: 'تاريخ الفاتورة' },
                                { key: 'showDueDate', label: 'تاريخ الاستحقاق' },
                                { key: 'showCustomerInfo', label: 'بيانات العميل' },
                                { key: 'showCompanyInfo', label: 'بيانات الشركة' },
                                { key: 'showDeviceSection', label: 'تفاصيل الجهاز' },
                                { key: 'showItemsTable', label: 'جدول الأصناف' },
                                { key: 'showPaymentMethod', label: 'طريقة الدفع' },
                                { key: 'showPaymentStatus', label: 'حالة الدفع' },
                                { key: 'showNotes', label: 'الملاحظات' },
                                { key: 'showTerms', label: 'الشروط والأحكام' },
                                { key: 'showSignature', label: 'التوقيع' },
                                { key: 'showFooter', label: 'تذييل الصفحة' },
                                { key: 'showBarcode', label: 'الباركود' },
                                { key: 'showQrCode', label: 'QR Code' },
                            ].map(opt => (
                                <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name={opt.key}
                                        checked={!!invoicePrint[opt.key]}
                                        onChange={handleInvoicePrintChange}
                                        className="rounded text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm text-foreground">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Table Columns */}
                    <div className="border-b border-border pb-6">
                        <h3 className="text-lg font-medium text-foreground mb-4">أعمدة الجدول</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { key: 'showItemDescription', label: 'الوصف' },
                                { key: 'showItemQuantity', label: 'الكمية' },
                                { key: 'showItemPrice', label: 'السعر' },
                                { key: 'showItemDiscount', label: 'الخصم' },
                                { key: 'showItemTax', label: 'الضريبة' },
                                { key: 'showItemTotal', label: 'الإجمالي' },
                                { key: 'showServiceNotes', label: 'ملاحظات إضافية للخدمات' },
                            ].map(opt => (
                                <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name={opt.key}
                                        checked={!!invoicePrint[opt.key]}
                                        onChange={handleInvoicePrintChange}
                                        className="rounded text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm text-foreground">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                        {invoicePrint.showServiceNotes && (
                            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                                <label className="block text-sm font-medium text-muted-foreground mb-1">مسمى الملاحظات</label>
                                <input
                                    name="serviceNotesLabel"
                                    value={invoicePrint.serviceNotesLabel || 'ملاحظات'}
                                    onChange={handleInvoicePrintChange}
                                    placeholder="ملاحظات"
                                    className="w-full md:w-1/3 px-3 py-2 bg-background border border-border rounded-md text-foreground"
                                />
                                <p className="text-xs text-muted-foreground mt-1">اتركه فارغاً لإخفاء المسمى</p>
                            </div>
                        )}
                    </div>

                    {/* Formatting */}
                    <div className="border-b border-border pb-6">
                        <h3 className="text-lg font-medium text-foreground mb-4">التنسيق والأرقام</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">عدد الأرقام العشرية</label>
                                <input
                                    type="number"
                                    name="numberFormat.decimalPlaces"
                                    value={invoicePrint.numberFormat.decimalPlaces}
                                    onChange={handleInvoicePrintChange}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">فاصل الآلاف</label>
                                <input
                                    name="numberFormat.thousandSeparator"
                                    value={invoicePrint.numberFormat.thousandSeparator}
                                    onChange={handleInvoicePrintChange}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">الفاصل العشري</label>
                                <input
                                    name="numberFormat.decimalSeparator"
                                    value={invoicePrint.numberFormat.decimalSeparator}
                                    onChange={handleInvoicePrintChange}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">اتجاه الصفحة</label>
                                <select
                                    name="orientation"
                                    value={invoicePrint.orientation}
                                    onChange={handleInvoicePrintChange}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                                >
                                    <option value="portrait">عمودي</option>
                                    <option value="landscape">أفقي</option>
                                </select>
                            </div>
                            <div className="md:col-span-3">
                                {PreviewCurrency}
                            </div>
                        </div>
                    </div>

                    {/* QR Code Settings */}
                    {invoicePrint.showQrCode && (
                        <div className="border-b border-border pb-6">
                            <h3 className="text-lg font-medium text-foreground mb-4">إعدادات QR Code</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">الموضع</label>
                                    <select
                                        name="qrCodePosition"
                                        value={invoicePrint.qrCodePosition}
                                        onChange={handleInvoicePrintChange}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                                    >
                                        <option value="top-right">أعلى يمين</option>
                                        <option value="top-left">أعلى يسار</option>
                                        <option value="bottom-right">أسفل يمين</option>
                                        <option value="bottom-left">أسفل يسار</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">الحجم (بكسل)</label>
                                    <input
                                        type="number"
                                        name="qrCodeSize"
                                        value={invoicePrint.qrCodeSize}
                                        onChange={handleInvoicePrintChange}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Barcode Settings */}
                    {invoicePrint.showBarcode && (
                        <div className="border-b border-border pb-6">
                            <h3 className="text-lg font-medium text-foreground mb-4">إعدادات الباركود</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">الموضع</label>
                                    <select
                                        name="barcodePosition"
                                        value={invoicePrint.barcodePosition}
                                        onChange={handleInvoicePrintChange}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                                    >
                                        <option value="top">أعلى</option>
                                        <option value="bottom">أسفل</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">العرض</label>
                                    <input
                                        type="number"
                                        name="barcodeWidth"
                                        value={invoicePrint.barcodeWidth}
                                        onChange={handleInvoicePrintChange}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">الارتفاع</label>
                                    <input
                                        type="number"
                                        name="barcodeHeight"
                                        value={invoicePrint.barcodeHeight}
                                        onChange={handleInvoicePrintChange}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Terms Settings */}
                    {invoicePrint.showTerms && (
                        <div className="border-b border-border pb-6">
                            <h3 className="text-lg font-medium text-foreground mb-4">الشروط والأحكام</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">عنوان القسم</label>
                                    <input
                                        name="termsLabel"
                                        value={invoicePrint.termsLabel}
                                        onChange={handleInvoicePrintChange}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">نص الشروط والأحكام</label>
                                    <textarea
                                        name="termsText"
                                        value={invoicePrint.termsText}
                                        onChange={handleInvoicePrintChange}
                                        rows={4}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Financial Settings */}
                    <div className="border-b border-border pb-6">
                        <h3 className="text-lg font-medium text-foreground mb-4">الإعدادات المالية</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="financial.showTax"
                                        checked={!!invoicePrint.financial?.showTax}
                                        onChange={handleInvoicePrintChange}
                                        className="rounded text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm text-foreground">إظهار الضريبة</span>
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">نسبة الضريبة (%)</label>
                                <input
                                    type="number"
                                    name="financial.defaultTaxPercent"
                                    value={invoicePrint.financial?.defaultTaxPercent || 15}
                                    onChange={handleInvoicePrintChange}
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground disabled:opacity-50"
                                    disabled={!invoicePrint.financial?.showTax}
                                />
                            </div>
                            <div className="flex items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="financial.showShipping"
                                        checked={!!invoicePrint.financial?.showShipping}
                                        onChange={handleInvoicePrintChange}
                                        className="rounded text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm text-foreground">إظهار الشحن</span>
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">مبلغ الشحن الافتراضي (ج.م)</label>
                                <input
                                    type="number"
                                    name="financial.defaultShippingAmount"
                                    value={invoicePrint.financial?.defaultShippingAmount || 150}
                                    onChange={handleInvoicePrintChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground disabled:opacity-50"
                                    disabled={!invoicePrint.financial?.showShipping}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Page Break Settings */}
                    <div className="border-b border-border pb-6">
                        <h3 className="text-lg font-medium text-foreground mb-4">تقسيم الصفحات</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="pageBreak.avoidItems"
                                    checked={!!invoicePrint.pageBreak.avoidItems}
                                    onChange={handleInvoicePrintChange}
                                    className="rounded text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-foreground">منع تقسيم الجدول بين صفحات</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="pageBreak.avoidCustomerInfo"
                                    checked={!!invoicePrint.pageBreak.avoidCustomerInfo}
                                    onChange={handleInvoicePrintChange}
                                    className="rounded text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-foreground">منع تقسيم بيانات العميل بين صفحات</span>
                            </label>
                        </div>
                    </div>

                    {/* Watermark */}
                    <div className="border-b border-border pb-6">
                        <h3 className="text-lg font-medium text-foreground mb-4">العلامة المائية</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center h-full pt-2 md:pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="watermark.enabled"
                                        checked={!!invoicePrint.watermark.enabled}
                                        onChange={handleInvoicePrintChange}
                                        className="rounded text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium text-foreground">تفعيل العلامة المائية</span>
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">النص</label>
                                <input
                                    name="watermark.text"
                                    value={invoicePrint.watermark.text}
                                    onChange={handleInvoicePrintChange}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">الشفافية (0-1)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="1"
                                    name="watermark.opacity"
                                    value={invoicePrint.watermark.opacity}
                                    onChange={handleInvoicePrintChange}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Margins */}
                    <div>
                        <h3 className="text-lg font-medium text-foreground mb-4">هوامش الصفحة (مم)</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">أعلى</label>
                                <input
                                    type="number"
                                    name="margins.top"
                                    value={invoicePrint.margins.top}
                                    onChange={handleInvoicePrintChange}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">يمين</label>
                                <input
                                    type="number"
                                    name="margins.right"
                                    value={invoicePrint.margins.right}
                                    onChange={handleInvoicePrintChange}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">أسفل</label>
                                <input
                                    type="number"
                                    name="margins.bottom"
                                    value={invoicePrint.margins.bottom}
                                    onChange={handleInvoicePrintChange}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">يسار</label>
                                <input
                                    type="number"
                                    name="margins.left"
                                    value={invoicePrint.margins.left}
                                    onChange={handleInvoicePrintChange}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                                />
                            </div>
                        </div>
                    </div>
                </SimpleCardContent>
            </SimpleCard>
        </div>
    );
}
