# 🧪 **مجلد الاختبار - Testing**

## ملفات وسكريبتات اختبار Fix Zone ERP

---

```
╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║                  🧪 أدوات الاختبار الشاملة 🧪                        ║
║                                                                        ║
║  جميع ما تحتاجه لاختبار النظام بشكل كامل                            ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝
```

---

## 🚀 **البداية السريعة**

### **اختبار سريع:**
```bash
cd /opt/lampp/htdocs/FixZone/testing
./scripts/execute-full-test.sh
```

### **اختبار يدوي:**
```bash
cd /opt/lampp/htdocs/FixZone/testing
./scripts/start-manual-testing.sh
```

---

## 📂 **هيكل المجلد**

```
testing/
├── README.md                [هذا الملف]
├── QUICK_START.md          [بداية سريعة]
├── QUICK_TEST_INSTRUCTIONS.md
│
├── 📂 scripts/              [السكريبتات الرئيسية]
│   ├── execute-full-test.sh          ⭐ اختبار شامل
│   ├── start-manual-testing.sh       ⭐ اختبار يدوي
│   ├── run-complete-test-suite.js    ⭐ اختبار APIs
│   ├── test-backend-apis.js          ⭐ اختبار Backend
│   └── test-e2e-playwright.js        ⭐ اختبار E2E
│
├── 📂 test-module-*.js      [اختبارات الموديولات]
│   ├── test-module-customers.js
│   ├── test-module-inventory.js
│   ├── test-module-payments-invoices.js
│   └── test-module-tickets.js
│
├── 📂 examples/             [أمثلة]
│   └── API_TEST_EXAMPLES.md
│
├── 📂 templates/            [قوالب]
│   └── BUG_REPORT_TEMPLATE.md
│
├── 📂 results/              [نتائج الاختبارات]
│   └── [ملفات JSON]
│
├── 📂 reports/              [تقارير]
│   └── testing-final-report.md
│
├── 📂 cases/                [حالات اختبار]
│   └── [ملفات CSV]
│
└── 📂 archived/             [ملفات مؤقتة قديمة]
    ├── check-db.js
    ├── create-admin-user.js
    ├── fix-admin-password.js
    └── ... [ملفات قديمة]
```

---

## 🧪 **السكريبتات الرئيسية**

### **1. execute-full-test.sh**
**الوصف:** سكريبت شامل لاختبار كامل النظام
**الاستخدام:**
```bash
cd /opt/lampp/htdocs/FixZone/testing
./scripts/execute-full-test.sh
```
**يختبر:**
- ✅ حالة الخوادم
- ✅ APIs Backend
- ✅ قاعدة البيانات
- ✅ يوفر دليل اختبار يدوي

---

### **2. start-manual-testing.sh**
**الوصف:** سكريبت تفاعلي للاختبار اليدوي
**الاستخدام:**
```bash
cd /opt/lampp/htdocs/FixZone/testing
./scripts/start-manual-testing.sh
```
**المميزات:**
- ✅ تحقق تلقائي من الخوادم
- ✅ تشغيل اختبارات APIs
- ✅ دليل خطوة بخطوة للاختبار اليدوي

---

### **3. run-complete-test-suite.js**
**الوصف:** اختبار شامل لجميع APIs
**الاستخدام:**
```bash
node testing/scripts/run-complete-test-suite.js
```
**يختبر:**
- ✅ 50+ API endpoint
- ✅ جميع الموديولات
- ✅ تقرير مفصل

---

### **4. test-backend-apis.js**
**الوصف:** اختبار Backend APIs
**الاستخدام:**
```bash
node testing/scripts/test-backend-apis.js
```

---

### **5. test-e2e-playwright.js**
**الوصف:** اختبار E2E باستخدام Playwright
**الاستخدام:**
```bash
node testing/scripts/test-e2e-playwright.js
```

---

## 📋 **اختبارات الموديولات**

### **المتاحة:**
- `test-module-customers.js` - اختبار موديول العملاء
- `test-module-inventory.js` - اختبار موديول المخزون
- `test-module-payments-invoices.js` - اختبار المدفوعات والفواتير
- `test-module-tickets.js` - اختبار التذاكر

**الاستخدام:**
```bash
node testing/test-module-inventory.js
```

---

## 📚 **التوثيق**

### **للاختبار اليدوي:**
- 📖 [../Documentation/04_TESTING/MANUAL_TESTING_GUIDE.md](../Documentation/04_TESTING/MANUAL_TESTING_GUIDE.md)
- ✅ [../Documentation/04_TESTING/MANUAL_TESTING_CHECKLIST.md](../Documentation/04_TESTING/MANUAL_TESTING_CHECKLIST.md)

### **للاختبار الآلي:**
- 📋 [QUICK_START.md](./QUICK_START.md)
- 📋 [QUICK_TEST_INSTRUCTIONS.md](./QUICK_TEST_INSTRUCTIONS.md)

---

## 🎯 **الاستخدام الموصى به**

### **للاختبار السريع:**
```bash
# 1. اختبار APIs فقط
node testing/scripts/test-backend-apis.js

# 2. اختبار شامل
./testing/scripts/execute-full-test.sh
```

### **للاختبار الكامل:**
```bash
# 1. اختبار تلقائي شامل
node testing/scripts/run-complete-test-suite.js

# 2. ثم اختبار يدوي
./testing/scripts/start-manual-testing.sh

# 3. اختبار E2E
node testing/scripts/test-e2e-playwright.js
```

---

## 🗄️ **الملفات المؤرشفة**

### **في testing/archived/:**
- `check-db.js` - فحص قاعدة البيانات (مؤقت)
- `create-admin-user.js` - إنشاء مستخدم (تم)
- `fix-admin-password.js` - إصلاح كلمة المرور (تم)
- `final-comprehensive-test.sh` - مكرر
- `test-database-integration.js` - قديم
- ملفات SQL مؤقتة

**ملاحظة:** هذه الملفات محفوظة للرجوع إليها فقط

---

## 📊 **إحصائيات**

### **الملفات النشطة:**
- **Scripts:** 5 سكريبتات
- **Module Tests:** 4 ملفات
- **Examples:** 1 ملف
- **Templates:** 1 ملف
- **Documentation:** 3 ملفات

**إجمالي:** 14 ملف نشط

### **الملفات المؤرشفة:**
- **Archived:** 5+ ملفات
- **Results:** نتائج الاختبارات القديمة

---

## 🎯 **الخطوات التالية**

1. راجع [QUICK_START.md](./QUICK_START.md)
2. نفذ `./scripts/execute-full-test.sh`
3. راجع [../Documentation/04_TESTING/](../Documentation/04_TESTING/)

---

**📅 آخر تحديث:** 10 أكتوبر 2025  
**✅ الحالة:** منظم ومرتب  
**🚀 الاستخدام:** `./scripts/execute-full-test.sh`

**🎉 ملفات الاختبار منظمة وجاهزة! 🎉**
