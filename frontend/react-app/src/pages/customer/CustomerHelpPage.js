import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { isCustomerRole } from '../../constants/roles';
import api from '../../services/api';
import CustomerHeader from '../../components/customer/CustomerHeader';
import {
    HelpCircle,
    ChevronDown,
    ChevronUp,
    Phone,
    Mail,
    MessageCircle,
    MapPin,
    Clock,
    Wrench,
    FileText,
    CreditCard,
    Shield,
    Settings,
    User,
    Bell,
    Package,
    Search
} from 'lucide-react';

/**
 * 📚 Customer Help / FAQ Page
 * 
 * صفحة المساعدة والأسئلة الشائعة للعملاء
 */

const faqCategories = [
    {
        id: 'repairs',
        title: 'طلبات الإصلاح',
        icon: Wrench,
        color: '#3B82F6',
        faqs: [
            {
                question: 'كيف أتابع حالة طلب الإصلاح؟',
                answer: 'يمكنك متابعة حالة طلب الإصلاح من خلال صفحة "طلبات الإصلاح" في لوحة التحكم، أو من خلال النقر على الإشعارات عند تحديث حالة الطلب. ستجد تفاصيل كاملة عن حالة الجهاز والمرحلة الحالية من عملية الإصلاح.'
            },
            {
                question: 'كم يستغرق إصلاح الجهاز عادةً؟',
                answer: 'يعتمد وقت الإصلاح على نوع المشكلة وتوفر قطع الغيار. الإصلاحات البسيطة تستغرق عادةً 1-2 يوم عمل، بينما الإصلاحات المعقدة قد تستغرق 3-7 أيام. سيتم إبلاغك بالوقت المتوقع عند استلام الجهاز.'
            },
            {
                question: 'ماذا يحدث إذا كان الجهاز غير قابل للإصلاح؟',
                answer: 'في حالة تعذر إصلاح الجهاز، سنتواصل معك لإبلاغك بالتفاصيل. لن يتم احتساب أي رسوم للإصلاح في هذه الحالة، وقد تكون هناك رسوم فحص بسيطة فقط.'
            },
            {
                question: 'هل يمكنني إلغاء طلب الإصلاح؟',
                answer: 'نعم، يمكنك إلغاء طلب الإصلاح قبل بدء العمل عليه. إذا كان الإصلاح قد بدأ بالفعل، يرجى التواصل مع فريق الدعم الفني لمناقشة الخيارات المتاحة.'
            }
        ]
    },
    {
        id: 'invoices',
        title: 'الفواتير والمدفوعات',
        icon: CreditCard,
        color: '#10B981',
        faqs: [
            {
                question: 'كيف أستلم الفاتورة؟',
                answer: 'يتم إنشاء الفاتورة تلقائياً بعد إتمام الإصلاح. يمكنك الاطلاع على جميع فواتيرك من صفحة "الفواتير" في لوحة التحكم، وطباعتها أو تحميلها بصيغة PDF.'
            },
            {
                question: 'ما هي طرق الدفع المتاحة؟',
                answer: 'نقبل الدفع النقدي عند الاستلام، وكذلك الدفع بالبطاقات الائتمانية (Visa, MasterCard). كما يمكن الدفع عبر التحويل البنكي أو المحافظ الإلكترونية.'
            },
            {
                question: 'هل يمكنني الدفع بالتقسيط؟',
                answer: 'نعم، نوفر خيار الدفع بالتقسيط للمبالغ الكبيرة. يرجى التواصل مع فريق الدعم لمناقشة خطط التقسيط المتاحة.'
            }
        ]
    },
    {
        id: 'warranty',
        title: 'الضمان',
        icon: Shield,
        color: '#8B5CF6',
        faqs: [
            {
                question: 'ما هي مدة الضمان على الإصلاحات؟',
                answer: 'نقدم ضمان يتراوح من 3 إلى 6 أشهر على جميع الإصلاحات وقطع الغيار المستخدمة، حسب نوع الإصلاح. تفاصيل الضمان موضحة في الفاتورة.'
            },
            {
                question: 'ماذا يغطي الضمان؟',
                answer: 'الضمان يغطي نفس المشكلة التي تم إصلاحها وقطع الغيار المستبدلة. لا يشمل الضمان الأعطال الناتجة عن سوء الاستخدام أو السقوط أو تعرض الجهاز للسوائل.'
            },
            {
                question: 'كيف أستفيد من الضمان؟',
                answer: 'في حالة ظهور نفس المشكلة خلال فترة الضمان، تواصل معنا وأحضر الجهاز مع فاتورة الإصلاح الأصلية. سيتم فحص الجهاز وإصلاحه مجاناً إذا كانت المشكلة مشمولة بالضمان.'
            }
        ]
    },
    {
        id: 'account',
        title: 'الحساب والإعدادات',
        icon: Settings,
        color: '#F59E0B',
        faqs: [
            {
                question: 'كيف أغير كلمة المرور؟',
                answer: 'انتقل إلى صفحة "الإعدادات" من القائمة الجانبية، ثم اختر تبويب "الأمان". أدخل كلمة المرور الحالية ثم كلمة المرور الجديدة مرتين للتأكيد.'
            },
            {
                question: 'كيف أحدث بياناتي الشخصية؟',
                answer: 'انتقل إلى صفحة "الملف الشخصي" من القائمة، اضغط على "تعديل البيانات" لتحديث معلوماتك مثل الاسم أو البريد الإلكتروني أو رقم الهاتف.'
            },
            {
                question: 'كيف أوقف الإشعارات؟',
                answer: 'من صفحة "الإعدادات"، اختر تبويب "الإشعارات". يمكنك التحكم في أنواع الإشعارات التي تريد استقبالها عبر البريد الإلكتروني أو الرسائل النصية.'
            }
        ]
    }
];

export default function CustomerHelpPage() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [notificationCount, setNotificationCount] = useState(0);

    useEffect(() => {
        const roleId = user?.roleId || user?.role;
        const numericRoleId = Number(roleId);
        const isCustomer = user && (user.type === 'customer' || isCustomerRole(numericRoleId));

        if (!user || !isCustomer) {
            navigate('/login');
            return;
        }

        loadNotificationCount();
    }, [user, navigate]);

    const loadNotificationCount = async () => {
        try {
            const response = await api.getCustomerNotifications({ unreadOnly: 'true', limit: 1 });
            if (response.success && response.data) {
                setNotificationCount(response.data.unreadCount || 0);
            }
        } catch (error) {
            console.warn('Failed to load notification count:', error);
        }
    };

    const toggleFaq = (categoryId, faqIndex) => {
        const key = `${categoryId}-${faqIndex}`;
        setExpandedFaq(expandedFaq === key ? null : key);
    };

    const handleContactSupport = () => {
        window.open('https://api.whatsapp.com/send/?phone=%2B201270388043&text&type=phone_number&app_absent=0', '_blank');
    };

    // Filter FAQs based on search and category
    const filteredCategories = faqCategories
        .filter(cat => selectedCategory === 'all' || cat.id === selectedCategory)
        .map(cat => ({
            ...cat,
            faqs: cat.faqs.filter(faq =>
                !searchQuery ||
                faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }))
        .filter(cat => cat.faqs.length > 0);

    return (
        <div className="min-h-screen bg-background pb-12">
            <CustomerHeader user={user} notificationCount={notificationCount} />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Title */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-brand-blue to-brand-blue-light">
                        <HelpCircle className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">مركز المساعدة</h1>
                    <p className="text-muted-foreground">نحن هنا لمساعدتك. ابحث عن إجابات لأسئلتك أو تواصل معنا مباشرة.</p>
                </div>

                {/* Search Bar */}
                <div className="relative mb-8">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="ابحث في الأسئلة الشائعة..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pr-12 pl-4 py-4 rounded-xl border-2 border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all"
                    />
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap gap-2 mb-8">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            selectedCategory === 'all'
                                ? 'bg-brand-blue text-white'
                                : 'bg-card text-foreground border border-border hover:border-brand-blue'
                        }`}
                    >
                        الكل
                    </button>
                    {faqCategories.map((cat) => {
                        const Icon = cat.icon;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                    selectedCategory === cat.id
                                        ? 'bg-brand-blue text-white'
                                        : 'bg-card text-foreground border border-border hover:border-brand-blue'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {cat.title}
                            </button>
                        );
                    })}
                </div>

                {/* FAQ Sections */}
                {filteredCategories.length === 0 ? (
                    <div className="text-center py-12">
                        <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد نتائج</h3>
                        <p className="text-muted-foreground">لم نجد إجابات مطابقة لبحثك. جرب كلمات بحث أخرى أو تواصل معنا مباشرة.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {filteredCategories.map((category) => {
                            const CategoryIcon = category.icon;
                            return (
                                <div key={category.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                                    {/* Category Header */}
                                    <div 
                                        className="p-4 border-b border-border flex items-center gap-3"
                                        style={{ borderLeftColor: category.color, borderLeftWidth: '4px' }}
                                    >
                                        <div 
                                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: `${category.color}20` }}
                                        >
                                            <CategoryIcon className="w-5 h-5" style={{ color: category.color }} />
                                        </div>
                                        <h2 className="text-lg font-bold text-foreground">{category.title}</h2>
                                    </div>

                                    {/* FAQs */}
                                    <div className="divide-y divide-border">
                                        {category.faqs.map((faq, index) => {
                                            const isExpanded = expandedFaq === `${category.id}-${index}`;
                                            return (
                                                <div key={index}>
                                                    <button
                                                        onClick={() => toggleFaq(category.id, index)}
                                                        className="w-full p-4 text-right flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors"
                                                    >
                                                        <span className="font-medium text-foreground">{faq.question}</span>
                                                        {isExpanded ? (
                                                            <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                                        ) : (
                                                            <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                                        )}
                                                    </button>
                                                    {isExpanded && (
                                                        <div className="px-4 pb-4">
                                                            <p className="text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-lg">
                                                                {faq.answer}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Contact Section */}
                <div className="mt-12 bg-gradient-to-br from-brand-blue to-brand-blue-light rounded-2xl p-8 text-white text-center">
                    <h3 className="text-xl font-bold mb-2">لم تجد ما تبحث عنه؟</h3>
                    <p className="opacity-90 mb-6">فريق الدعم الفني متاح لمساعدتك على مدار الساعة</p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={handleContactSupport}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-brand-blue rounded-lg font-bold hover:bg-gray-100 transition-colors"
                        >
                            <MessageCircle className="w-5 h-5" />
                            تواصل عبر واتساب
                        </button>
                        <a
                            href="tel:+201270388043"
                            className="flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-lg font-bold hover:bg-white/30 transition-colors"
                        >
                            <Phone className="w-5 h-5" />
                            اتصل بنا
                        </a>
                    </div>

                    {/* Contact Info */}
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center justify-center gap-2 opacity-90">
                            <Clock className="w-4 h-4" />
                            <span>24/7 دعم فني</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 opacity-90">
                            <Mail className="w-4 h-4" />
                            <span>support@fixzone.com</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 opacity-90">
                            <MapPin className="w-4 h-4" />
                            <span>القاهرة، مصر</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

