import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CustomerHeader from '../../components/customer/CustomerHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import useAuthStore from '../../stores/authStore';
import {
    ArrowRight,
    Printer,
    CreditCard,
    Download,
    CheckCircle,
    AlertCircle,
    FileText
} from 'lucide-react';

/**
 * 🧾 Customer Invoice Details Page
 * 
 * صفحة تفاصيل الفاتورة مع ميزات:
 * - الدفع الإلكتروني (Pay Now)
 * - الطباعة (Print)
 * - التحميل (Download PDF)
 */

export default function CustomerInvoiceDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const notifications = useNotifications();
    const user = useAuthStore((state) => state.user);

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPaying, setIsPaying] = useState(false);

    useEffect(() => {
        // Mock Data
        setTimeout(() => {
            setInvoice({
                id: id,
                number: `INV-${id}`,
                date: '2024-01-20',
                dueDate: '2024-01-27',
                status: 'pending', // pending, paid, overdue
                items: [
                    { description: 'تغيير شاشة iPhone 13 Pro Max', quantity: 1, price: 4500 },
                    { description: 'لاصقة حماية زجاجية', quantity: 1, price: 150 },
                    { description: 'خدمة تركيب', quantity: 1, price: 350 }
                ],
                subtotal: 5000,
                tax: 700, // 14%
                total: 5700,
                customerName: user?.name || 'العميل',
                customerAddress: 'القاهرة، مصر'
            });
            setLoading(false);
        }, 1000);
    }, [id, user]);

    const handlePayment = () => {
        setIsPaying(true);
        // Simulate payment processing
        setTimeout(() => {
            setIsPaying(false);
            setInvoice(prev => ({ ...prev, status: 'paid' }));
            notifications.success('تم الدفع بنجاح', { message: 'شكراً لك! تم سداد الفاتورة.' });
        }, 2000);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="flex justify-center min-h-screen items-center"><LoadingSpinner /></div>;
    if (!invoice) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-12 print:bg-white">
            <div className="print:hidden">
                <CustomerHeader user={user} notificationCount={2} />
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Actions Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 print:hidden">
                    <button
                        onClick={() => navigate('/customer/invoices')}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <ArrowRight className="w-5 h-5" />
                        <span>عودة للفواتير</span>
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
                        >
                            <Printer className="w-4 h-4" />
                            <span>طباعة</span>
                        </button>
                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
                        >
                            <Download className="w-4 h-4" />
                            <span>تحميل PDF</span>
                        </button>
                        {invoice.status !== 'paid' && (
                            <button
                                onClick={handlePayment}
                                disabled={isPaying}
                                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-bold disabled:opacity-70"
                            >
                                {isPaying ? (
                                    <LoadingSpinner size="sm" color="white" />
                                ) : (
                                    <>
                                        <CreditCard className="w-4 h-4" />
                                        <span>ادفع الآن</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Invoice Paper */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden print:shadow-none print:border-none">

                    {/* Invoice Header */}
                    <div className="p-8 border-b border-gray-100 bg-gray-50 print:bg-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                    <h1 className="text-2xl font-bold text-gray-900">فاتورة ضريبية</h1>
                                </div>
                                <p className="text-gray-500">#{invoice.number}</p>
                            </div>
                            <div className="text-left">
                                <h2 className="text-xl font-bold text-gray-900">FixZone ERP</h2>
                                <p className="text-gray-500 text-sm">123 شارع التكنولوجيا، المعادي</p>
                                <p className="text-gray-500 text-sm">القاهرة، مصر</p>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Info */}
                    <div className="p-8 grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">فوترة إلى</h3>
                            <p className="font-bold text-gray-900">{invoice.customerName}</p>
                            <p className="text-gray-600">{invoice.customerAddress}</p>
                        </div>
                        <div className="text-left">
                            <div className="mb-2">
                                <span className="text-gray-500 text-sm">تاريخ الفاتورة: </span>
                                <span className="font-medium text-gray-900">{new Date(invoice.date).toLocaleDateString('ar-EG')}</span>
                            </div>
                            <div className="mb-2">
                                <span className="text-gray-500 text-sm">تاريخ الاستحقاق: </span>
                                <span className="font-medium text-gray-900">{new Date(invoice.dueDate).toLocaleDateString('ar-EG')}</span>
                            </div>
                            <div className="mt-4">
                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                                        invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {invoice.status === 'paid' ? 'مدفوعة' : invoice.status === 'overdue' ? 'متأخرة' : 'معلقة'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="px-8">
                        <table className="w-full text-right">
                            <thead className="bg-gray-50 border-y border-gray-200">
                                <tr>
                                    <th className="py-3 px-4 text-sm font-bold text-gray-900">الوصف</th>
                                    <th className="py-3 px-4 text-sm font-bold text-gray-900 text-center">الكمية</th>
                                    <th className="py-3 px-4 text-sm font-bold text-gray-900 text-center">السعر</th>
                                    <th className="py-3 px-4 text-sm font-bold text-gray-900 text-left">الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {invoice.items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="py-4 px-4 text-gray-900">{item.description}</td>
                                        <td className="py-4 px-4 text-gray-600 text-center">{item.quantity}</td>
                                        <td className="py-4 px-4 text-gray-600 text-center">{item.price} ج.م</td>
                                        <td className="py-4 px-4 text-gray-900 font-medium text-left">{item.price * item.quantity} ج.م</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="p-8 bg-gray-50 print:bg-white border-t border-gray-200 mt-8">
                        <div className="w-full md:w-1/2 mr-auto">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">المجموع الفرعي</span>
                                <span className="font-medium text-gray-900">{invoice.subtotal} ج.م</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">الضريبة (14%)</span>
                                <span className="font-medium text-gray-900">{invoice.tax} ج.م</span>
                            </div>
                            <div className="flex justify-between pt-4 border-t border-gray-200 mt-4">
                                <span className="text-xl font-bold text-gray-900">الإجمالي الكلي</span>
                                <span className="text-xl font-bold text-blue-600">{invoice.total} ج.م</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-8 text-center text-gray-500 text-sm border-t border-gray-100">
                        <p>شكراً لتعاملك مع FixZone ERP</p>
                        <p className="mt-1">لأي استفسارات، يرجى التواصل مع الدعم الفني</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
