# 🧪 اختبار إرسال Email

## 📋 المتطلبات

### 1. إعدادات SMTP
يجب تفعيل Email في الإعدادات وتحديد:
- `smtpHost`: عنوان خادم SMTP (مثل: smtp.gmail.com)
- `smtpPort`: المنفذ (587 أو 465)
- `smtpUser`: اسم المستخدم
- `smtpPassword`: كلمة المرور
- `fromEmail`: البريد الإلكتروني المرسل
- `fromName`: اسم المرسل

### 2. متغيرات البيئة (اختياري)
يمكن استخدام متغيرات البيئة للاختبار:
```bash
export TEST_EMAIL_USER=your-email@gmail.com
export TEST_EMAIL_PASSWORD=your-app-password
export TEST_EMAIL_FROM=your-email@gmail.com
```

---

## 🧪 الاختبارات

### 1. اختبار إرسال Email بسيط
```bash
cd backend
node scripts/test-email-sending.js [invoiceId] [email]
```

**مثال:**
```bash
node scripts/test-email-sending.js 1409 test@example.com
```

### 2. اختبار مع إعدادات تجريبية
```bash
cd backend
node scripts/test-email-with-settings.js [invoiceId] [email]
```

**مثال:**
```bash
TEST_EMAIL_USER=your-email@gmail.com \
TEST_EMAIL_PASSWORD=your-app-password \
TEST_EMAIL_FROM=your-email@gmail.com \
node scripts/test-email-with-settings.js 1409 test@example.com
```

---

## 📧 إعدادات Gmail

إذا كنت تستخدم Gmail:

1. **تفعيل App Password:**
   - اذهب إلى: https://myaccount.google.com/apppasswords
   - أنشئ App Password جديد
   - استخدمه في `smtpPassword`

2. **إعدادات SMTP:**
   ```
   smtpHost: smtp.gmail.com
   smtpPort: 587
   smtpUser: your-email@gmail.com
   smtpPassword: your-app-password
   fromEmail: your-email@gmail.com
   ```

---

## ✅ النتائج المتوقعة

### نجاح الإرسال:
```
✅ تم الإرسال بنجاح!
📊 النتيجة:
{
  "success": true,
  "messageId": "...",
  "accepted": ["test@example.com"],
  "rejected": []
}
```

### فشل الإرسال:
```
❌ خطأ في إرسال Email:
Invalid login
```

---

## 🔍 استكشاف الأخطاء

### 1. "Email غير مفعل في الإعدادات"
- **الحل:** تفعيل Email في صفحة الإعدادات أو استخدام `test-email-with-settings.js`

### 2. "Invalid login"
- **الحل:** تحقق من:
  - اسم المستخدم وكلمة المرور صحيحة
  - استخدام App Password (لـ Gmail)
  - إعدادات SMTP صحيحة

### 3. "Connection timeout"
- **الحل:** تحقق من:
  - اتصال الإنترنت
  - إعدادات Firewall
  - عنوان SMTP صحيح

---

## 📝 ملاحظات

- ⚠️ **تحذير:** لا تستخدم بيانات حقيقية في الاختبارات
- ✅ **نصيحة:** استخدم حساب بريد إلكتروني تجريبي
- 🔒 **أمان:** لا تضع كلمات المرور في الكود مباشرة

---

**تاريخ الإنشاء:** 2025-01-12

