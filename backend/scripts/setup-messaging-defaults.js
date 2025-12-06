// backend/scripts/setup-messaging-defaults.js
// Script لإضافة إعدادات المراسلة الافتراضية

const db = require('../db');

const defaultSettings = {
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

فريق الفنيين هيبدأ الفحص خلال الساعات القادمة.`,
    // قوالب إضافية لطلبات الإصلاح
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
    // قوالب إضافية لحالات طلبات الإصلاح
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
    // قوالب العروض السعرية
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
    // قوالب تذكيرات الدفع
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
  },
  automation: {
    enabled: true,
    defaultChannels: ['whatsapp'],
    // إشعارات الفواتير
    invoice: {
      notifyOnCreated: true,
      notifyOnStatusChange: false
    },
    // إشعارات طلبات الإصلاح
    repair: {
      notifyOnReceived: true,
      notifyOnDiagnosed: true,
      notifyOnAwaitingApproval: true,
      notifyOnUnderRepair: false, // اختياري - قد يكون مزعج
      notifyOnWaitingParts: true,
      notifyOnCompleted: true,
      notifyOnReadyPickup: true,
      notifyOnRejected: false, // اختياري
      notifyOnOnHold: false // اختياري
    },
    // تذكيرات الدفع
    payment: {
      overdueReminders: {
        enabled: true,
        schedule: '0 9 * * *', // يومياً 9 صباحاً
        minDaysBetweenReminders: 1 // يوم واحد على الأقل بين التذكيرات
      },
      beforeDueReminders: {
        enabled: true,
        schedule: '0 10 * * *', // يومياً 10 صباحاً
        daysBeforeDue: 3, // 3 أيام قبل الاستحقاق
        minDaysBetweenReminders: 1
      }
    }
  }
};

async function setupDefaults() {
  try {
    console.log('🚀 إعداد إعدادات المراسلة الافتراضية...\n');

    // التحقق من وجود الإعدادات
    const [existing] = await db.execute(
      'SELECT id FROM SystemSetting WHERE `key` = ?',
      ['messaging_settings']
    );

    if (existing.length > 0) {
      console.log('⚠️  الإعدادات موجودة بالفعل');
      console.log('📝 هل تريد تحديثها؟ (سيتم الحفاظ على القيم المملوءة)');
      
      // قراءة الإعدادات الحالية
      const [current] = await db.execute(
        'SELECT value FROM SystemSetting WHERE `key` = ?',
        ['messaging_settings']
      );

      if (current.length > 0) {
        const currentSettings = JSON.parse(current[0].value);
        
        // دمج الإعدادات (الحفاظ على القيم المملوءة)
        const merged = {
          whatsapp: {
            ...defaultSettings.whatsapp,
            ...currentSettings.whatsapp,
            // دمج القوالب الجديدة مع الحفاظ على القديمة
            diagnosisCompleteMessage: currentSettings.whatsapp?.diagnosisCompleteMessage || defaultSettings.whatsapp.diagnosisCompleteMessage,
            repairCompletedMessage: currentSettings.whatsapp?.repairCompletedMessage || defaultSettings.whatsapp.repairCompletedMessage,
            readyPickupMessage: currentSettings.whatsapp?.readyPickupMessage || defaultSettings.whatsapp.readyPickupMessage,
            quotationDefaultMessage: currentSettings.whatsapp?.quotationDefaultMessage || defaultSettings.whatsapp.quotationDefaultMessage,
            quotationApprovedMessage: currentSettings.whatsapp?.quotationApprovedMessage || defaultSettings.whatsapp.quotationApprovedMessage,
            paymentOverdueReminder: currentSettings.whatsapp?.paymentOverdueReminder || defaultSettings.whatsapp.paymentOverdueReminder,
            paymentBeforeDueReminder: currentSettings.whatsapp?.paymentBeforeDueReminder || defaultSettings.whatsapp.paymentBeforeDueReminder
          },
          email: {
            ...defaultSettings.email,
            ...currentSettings.email
          },
          automation: {
            ...defaultSettings.automation,
            ...(currentSettings.automation || {})
          }
        };

        await db.execute(
          'UPDATE SystemSetting SET value = ? WHERE `key` = ?',
          [JSON.stringify(merged), 'messaging_settings']
        );

        console.log('✅ تم تحديث الإعدادات مع الحفاظ على القيم المملوءة');
      }
    } else {
      // إنشاء إعدادات جديدة
      await db.execute(
        `INSERT INTO SystemSetting (\`key\`, value, description, type) 
         VALUES (?, ?, ?, ?)`,
        [
          'messaging_settings',
          JSON.stringify(defaultSettings),
          'إعدادات المراسلة والإشعارات',
          'JSON'
        ]
      );

      console.log('✅ تم إنشاء الإعدادات الافتراضية بنجاح!');
    }

    // عرض الإعدادات
    const [settings] = await db.execute(
      'SELECT value FROM SystemSetting WHERE `key` = ?',
      ['messaging_settings']
    );

    if (settings.length > 0) {
      const parsed = JSON.parse(settings[0].value);
      console.log('\n📋 الإعدادات الحالية:');
      console.log('   WhatsApp:', parsed.whatsapp?.enabled ? '✅ مفعل' : '❌ معطل');
      console.log('   WhatsApp Web:', parsed.whatsapp?.webEnabled ? '✅ مفعل' : '❌ معطل');
      console.log('   WhatsApp API:', parsed.whatsapp?.apiEnabled ? '✅ مفعل' : '❌ معطل');
      console.log('   Email:', parsed.email?.enabled ? '✅ مفعل' : '❌ معطل');
      console.log('   Automation:', parsed.automation?.enabled ? '✅ مفعل' : '❌ معطل');
    }

    console.log('\n🎉 الإعداد مكتمل!');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ في الإعداد:', error.message);
    process.exit(1);
  }
}

setupDefaults();

