// frontend/react-app/src/components/settings/SettingsHelp.js
import React, { useState } from 'react';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../ui/SimpleCard';
import { HelpCircle, Book, Video, MessageCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import SimpleButton from '../ui/SimpleButton';

/**
 * Settings Help Component
 * Provides help and documentation for settings
 */
export const SettingsHelp = () => {
  const [expandedSection, setExpandedSection] = useState(null);

  const helpSections = [
    {
      id: 'general',
      title: 'الإعدادات العامة',
      icon: '⚙️',
      content: `
        الإعدادات العامة تتحكم في سلوك النظام الأساسي مثل:
        - اسم الشركة ومعلومات الاتصال
        - اللغة والمنطقة الزمنية
        - التنسيقات الافتراضية
      `,
    },
    {
      id: 'currency',
      title: 'إعدادات العملة',
      icon: '💰',
      content: `
        إعدادات العملة تتحكم في:
        - العملة الافتراضية (EGP, USD, etc.)
        - رمز العملة وموضعه
        - عدد الأرقام العشرية
        - تنسيق الأرقام
      `,
    },
    {
      id: 'printing',
      title: 'إعدادات الطباعة',
      icon: '🖨️',
      content: `
        إعدادات الطباعة تتحكم في:
        - حجم الورق (A4, Letter, etc.)
        - النسخ الافتراضية
        - العلامة المائية
        - الباركود
      `,
    },
    {
      id: 'history',
      title: 'تاريخ التغييرات',
      icon: '📜',
      content: `
        يمكنك:
        - عرض تاريخ جميع التغييرات على الإعدادات
        - معرفة من قام بالتغيير ومتى
        - التراجع عن أي تغيير سابق
      `,
    },
    {
      id: 'backup',
      title: 'النسخ الاحتياطية',
      icon: '💾',
      content: `
        يمكنك:
        - إنشاء نسخة احتياطية من جميع الإعدادات
        - استعادة نسخة احتياطية سابقة
        - إدارة النسخ الاحتياطية
      `,
    },
    {
      id: 'import-export',
      title: 'استيراد/تصدير',
      icon: '📥',
      content: `
        يمكنك:
        - تصدير جميع الإعدادات إلى ملف JSON
        - استيراد الإعدادات من ملف JSON
        - استخدام القوالب الجاهزة
      `,
    },
  ];

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <HelpCircle className="h-6 w-6 text-gray-500" />
        <h2 className="text-xl font-bold text-gray-900">المساعدة والدعم</h2>
      </div>

      {/* Help Sections */}
      <div className="space-y-4">
        {helpSections.map((section) => (
          <SimpleCard key={section.id}>
            <SimpleCardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{section.icon}</span>
                  <SimpleCardTitle className="text-base">{section.title}</SimpleCardTitle>
                </div>
                <SimpleButton
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSection(section.id)}
                >
                  {expandedSection === section.id ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      إخفاء
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      عرض
                    </>
                  )}
                </SimpleButton>
              </div>
            </SimpleCardHeader>
            {expandedSection === section.id && (
              <SimpleCardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-line text-gray-700">{section.content.trim()}</p>
                </div>
              </SimpleCardContent>
            )}
          </SimpleCard>
        ))}
      </div>

      {/* Quick Links */}
      <SimpleCard>
        <SimpleCardHeader>
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5 text-gray-500" />
            <SimpleCardTitle>روابط سريعة</SimpleCardTitle>
          </div>
        </SimpleCardHeader>
        <SimpleCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/documentation/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Book className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">دليل المستخدم</span>
              <ExternalLink className="h-3 w-3 text-gray-400 mr-auto" />
            </a>
            <a
              href="/documentation/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Book className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">دليل API</span>
              <ExternalLink className="h-3 w-3 text-gray-400 mr-auto" />
            </a>
            <a
              href="/support"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">الدعم الفني</span>
              <ExternalLink className="h-3 w-3 text-gray-400 mr-auto" />
            </a>
            <a
              href="/video-tutorials/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Video className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">فيديوهات تعليمية</span>
              <ExternalLink className="h-3 w-3 text-gray-400 mr-auto" />
            </a>
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* FAQ */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle>الأسئلة الشائعة</SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">كيف يمكنني استعادة إعداد افتراضي؟</h4>
              <p className="text-sm text-gray-600">
                يمكنك استخدام زر "إعادة تعيين" بجانب كل إعداد، أو استعادة نسخة احتياطية سابقة.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">هل يمكنني التراجع عن تغيير؟</h4>
              <p className="text-sm text-gray-600">
                نعم، يمكنك عرض تاريخ التغييرات والتراجع عن أي تغيير من تبويب "التاريخ".
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">كيف أنشئ نسخة احتياطية؟</h4>
              <p className="text-sm text-gray-600">
                اذهب إلى تبويب "النسخ الاحتياطية" واضغط على "إنشاء نسخة احتياطية".
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">هل يمكنني تصدير الإعدادات؟</h4>
              <p className="text-sm text-gray-600">
                نعم، يمكنك تصدير جميع الإعدادات إلى ملف JSON من تبويب "استيراد/تصدير".
              </p>
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>
    </div>
  );
};

