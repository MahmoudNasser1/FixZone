# 🧪 دليل اختبار إعدادات النظام

## 📋 نظرة عامة

هذا الدليل يوضح كيفية اختبار جميع API endpoints الجديدة لإعدادات النظام.

---

## 🔐 الخطوة 1: تسجيل الدخول

قبل اختبار API endpoints، يجب تسجيل الدخول أولاً:

### من المتصفح:
1. افتح `http://localhost:3000/login`
2. سجّل دخول كـ Admin
3. افتح Developer Tools (F12)
4. اذهب إلى Console
5. انسخ الـ token من Cookies:
   ```javascript
   document.cookie.split(';').find(c => c.includes('token=')).split('=')[1]
   ```

### من Terminal (curl):
```bash
# تسجيل الدخول والحصول على Cookie
curl -c /tmp/cookies.txt -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginIdentifier":"admin@fixzone.com","password":"YOUR_PASSWORD"}'
```

---

## 🧪 اختبار API Endpoints

### 1️⃣ إعدادات الشركة (Company Settings)

#### GET - جلب الإعدادات:
```bash
curl -b /tmp/cookies.txt http://localhost:4000/api/settings/company
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "data": {
    "name": "FixZone",
    "address": "مول البستان التجاري - الدور الأرضي",
    "phone": "01270388043",
    "website": "https://fixzzone.com",
    "logoUrl": "/logo.png"
  }
}
```

#### PUT - تحديث الإعدادات:
```bash
curl -b /tmp/cookies.txt -X PUT http://localhost:4000/api/settings/company \
  -H "Content-Type: application/json" \
  -d '{
    "name": "FixZone",
    "address": "مول البستان التجاري - الدور الأرضي",
    "phone": "01270388043",
    "website": "https://fixzzone.com",
    "logoUrl": "/logo.png"
  }'
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "message": "Company settings updated successfully",
  "data": [
    {"key": "company.name", "success": true},
    {"key": "company.address", "success": true},
    ...
  ]
}
```

#### اختبار Validation:
```bash
# اسم فارغ - يجب أن يفشل
curl -b /tmp/cookies.txt -X PUT http://localhost:4000/api/settings/company \
  -H "Content-Type: application/json" \
  -d '{"name": ""}'
```

**النتيجة المتوقعة:**
```json
{
  "success": false,
  "message": "Validation errors",
  "errors": ["Company name is required"]
}
```

---

### 2️⃣ إعدادات العملة (Currency Settings)

#### GET - جلب الإعدادات:
```bash
curl -b /tmp/cookies.txt http://localhost:4000/api/settings/currency
```

#### PUT - تحديث الإعدادات:
```bash
curl -b /tmp/cookies.txt -X PUT http://localhost:4000/api/settings/currency \
  -H "Content-Type: application/json" \
  -d '{
    "code": "EGP",
    "symbol": "ج.م",
    "name": "الجنيه المصري",
    "locale": "ar-EG",
    "minimumFractionDigits": 2,
    "position": "after"
  }'
```

#### اختبار Validation:
```bash
# رمز عملة غير صحيح - يجب أن يفشل
curl -b /tmp/cookies.txt -X PUT http://localhost:4000/api/settings/currency \
  -H "Content-Type: application/json" \
  -d '{"code": "EG", "symbol": "ج.م"}'
```

---

### 3️⃣ إعدادات الطباعة (Printing Settings)

#### GET - جلب الإعدادات:
```bash
curl -b /tmp/cookies.txt http://localhost:4000/api/settings/printing
```

#### PUT - تحديث الإعدادات:
```bash
curl -b /tmp/cookies.txt -X PUT http://localhost:4000/api/settings/printing \
  -H "Content-Type: application/json" \
  -d '{
    "defaultCopy": "customer",
    "showWatermark": true,
    "paperSize": "A4",
    "showSerialBarcode": true
  }'
```

#### اختبار Validation:
```bash
# حجم ورق غير صحيح - يجب أن يفشل
curl -b /tmp/cookies.txt -X PUT http://localhost:4000/api/settings/printing \
  -H "Content-Type: application/json" \
  -d '{"paperSize": "InvalidSize"}'
```

---

### 4️⃣ إعدادات المحلية (Locale Settings)

#### GET - جلب الإعدادات:
```bash
curl -b /tmp/cookies.txt http://localhost:4000/api/settings/locale
```

#### PUT - تحديث الإعدادات:
```bash
curl -b /tmp/cookies.txt -X PUT http://localhost:4000/api/settings/locale \
  -H "Content-Type: application/json" \
  -d '{
    "rtl": true,
    "dateFormat": "yyyy/MM/dd"
  }'
```

---

## 🖥️ اختبار من الواجهة (Frontend)

### الخطوات:

1. **افتح المتصفح:**
   - اذهب إلى `http://localhost:3000/settings`

2. **اختبار تبويب "عام":**
   - غيّر اسم الشركة
   - احفظ
   - تحقق من رسالة النجاح
   - حدّث الصفحة وتحقق من أن التغييرات محفوظة

3. **اختبار تبويب "العملة":**
   - غيّر رمز العملة
   - احفظ
   - تحقق من رسالة النجاح
   - حدّث الصفحة وتحقق من أن التغييرات محفوظة

4. **اختبار تبويب "الطباعة":**
   - غيّر حجم الورق
   - احفظ
   - تحقق من رسالة النجاح
   - افتح صفحة طباعة وتحقق من أن حجم الورق تغير

5. **اختبار تبويب "المحلية":**
   - غيّر تنسيق التاريخ
   - احفظ
   - تحقق من رسالة النجاح

6. **اختبار Validation:**
   - حاول حفظ اسم شركة فارغ → يجب أن يظهر تحذير
   - حاول حفظ رمز عملة غير صحيح → يجب أن يظهر تحذير
   - حاول حفظ حجم ورق غير صحيح → يجب أن يظهر تحذير

---

## ✅ قائمة التحقق (Checklist)

### Backend API:
- [ ] GET /api/settings/company يعمل
- [ ] PUT /api/settings/company يعمل
- [ ] Validation لإعدادات الشركة يعمل
- [ ] GET /api/settings/currency يعمل
- [ ] PUT /api/settings/currency يعمل
- [ ] Validation لإعدادات العملة يعمل
- [ ] GET /api/settings/printing يعمل
- [ ] PUT /api/settings/printing يعمل
- [ ] Validation لإعدادات الطباعة يعمل
- [ ] GET /api/settings/locale يعمل
- [ ] PUT /api/settings/locale يعمل
- [ ] Validation لإعدادات المحلية يعمل

### Frontend:
- [ ] تحميل الإعدادات من API يعمل
- [ ] حفظ الإعدادات في API يعمل
- [ ] Validation في الواجهة يعمل
- [ ] رسائل النجاح/الخطأ تظهر بشكل صحيح
- [ ] Fallback إلى localStorage يعمل

### Integration:
- [ ] إعدادات الشركة تظهر في صفحات الطباعة
- [ ] إعدادات العملة تستخدم في formatMoney
- [ ] إعدادات الطباعة تستخدم في RepairPrintPage
- [ ] paperSize يؤثر على CSS
- [ ] showWatermark يؤثر على الطباعة
- [ ] showSerialBarcode يؤثر على الطباعة

---

## 🔍 التحقق من قاعدة البيانات

للتحقق من أن الإعدادات محفوظة في قاعدة البيانات:

```sql
-- عرض جميع إعدادات الشركة
SELECT `key`, value, category, createdAt, updatedAt 
FROM SystemSetting 
WHERE `key` LIKE 'company.%' 
ORDER BY `key`;

-- عرض جميع إعدادات العملة
SELECT `key`, value, category, createdAt, updatedAt 
FROM SystemSetting 
WHERE `key` LIKE 'currency.%' 
ORDER BY `key`;

-- عرض جميع إعدادات الطباعة
SELECT `key`, value, category, createdAt, updatedAt 
FROM SystemSetting 
WHERE `key` LIKE 'printing.%' 
ORDER BY `key`;

-- عرض جميع إعدادات المحلية
SELECT `key`, value, category, createdAt, updatedAt 
FROM SystemSetting 
WHERE `key` LIKE 'locale.%' 
ORDER BY `key`;
```

---

## 🐛 استكشاف الأخطاء

### مشكلة: "No token, authorization denied"
**الحل:** تأكد من تسجيل الدخول أولاً

### مشكلة: "Setting with key not found"
**الحل:** هذا طبيعي في المرة الأولى - الإعدادات ستُنشأ تلقائياً عند الحفظ

### مشكلة: Validation لا يعمل
**الحل:** تحقق من أن Backend يعمل وأن Routes محدثة

### مشكلة: الإعدادات لا تظهر في الواجهة
**الحل:** 
1. تحقق من Console للأخطاء
2. تحقق من Network tab في Developer Tools
3. تأكد من أن API يعيد البيانات بشكل صحيح

---

## 📝 ملاحظات

- جميع الإعدادات محفوظة في جدول `SystemSetting` في قاعدة البيانات
- الإعدادات متزامنة بين الأجهزة
- Fallback إلى localStorage للتوافق مع الكود القديم
- Validation يعمل في Backend و Frontend

---

**تم إعداد الدليل بواسطة:** AI Assistant  
**آخر تحديث:** 2025-01-28

