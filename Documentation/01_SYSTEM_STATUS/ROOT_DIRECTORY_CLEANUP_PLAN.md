# 📋 **خطة تنظيف المجلد الرئيسي - Root Directory Cleanup Plan**

## 📅 **12 يناير 2025**

---

```
╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║          🧹 تنظيف المجلد الرئيسي للمشروع                             ║
║                                                                        ║
║  الهدف: نقل جميع الملفات إلى أماكنها الصحيحة                        ║
║  القاعدة: README.md فقط في المجلد الرئيسي                            ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝
```

---

# 📊 **1. تحليل الملفات الحالية**

## **الملفات الموجودة في المجلد الرئيسي:**

### **📄 ملفات .md (100+ ملف):**
- تقارير Fixes (50+ ملف)
- تقارير Testing (20+ ملف)
- تقارير Modules (30+ ملف)
- **الإجراء:** نقل جميعها إلى `Documentation/01_SYSTEM_STATUS/` أو `Documentation/archive/`

### **🍪 ملفات cookie_*.txt (30+ ملف):**
- ملفات مؤقتة للاختبار
- **الإجراء:** حذفها مباشرة (لا قيمة لها)

### **🗄️ ملفات .sql (7 ملفات):**
- `backup_before_clean_20251125_171135.sql`
- `backup_before_reset_20251121_025430.sql`
- `check_columns.sql`
- `check_expense_schema.sql`
- `clean-database.sql`
- `fixzone_db.sql`
- `structure.sql`
- **الإجراء:** نقلها إلى `backups/` أو `migrations/`

### **📜 ملفات .js (5 ملفات):**
- `add-test-product-and-stock.js`
- `apply-optimizations.js`
- `fix-login.js`
- `test_repairs_apis.js`
- `test_repairs_apis_complete.js`
- **الإجراء:** نقلها إلى `testing/scripts/`

### **🔧 ملفات .sh (3 ملفات):**
- `start-backend.sh`
- `start-frontend.sh`
- `test_notifications_api.sh`
- **الإجراء:** نقلها إلى `testing/scripts/` أو `scripts/`

### **🌐 ملفات .html و .json:**
- `test-messaging-settings.html`
- `test-report.html`
- `FIXZONE_FRONTEND_FULL_ANALYSIS.json`
- `fxz-analysis.json`
- `REPAIRS_COMPREHENSIVE_TEST_2025-10-20.json`
- **الإجراء:** نقلها إلى `testing/reports/` أو حذفها

---

# 🎯 **2. خطة التنظيم**

## **الخطوة 1: حذف ملفات Cookie (30+ ملف)**
```bash
rm cookie_*.txt cookies.txt
```

## **الخطوة 2: نقل ملفات .md إلى Documentation**
```bash
# نقل تقارير Fixes
mv *_FIX*.md Documentation/01_SYSTEM_STATUS/
mv *_FIXES*.md Documentation/01_SYSTEM_STATUS/

# نقل تقارير Testing
mv *TEST*.md Documentation/04_TESTING/
mv *TESTING*.md Documentation/04_TESTING/

# نقل تقارير Modules
mv *MODULE*.md Documentation/03_MODULES/
mv *SYSTEM*.md Documentation/01_SYSTEM_STATUS/

# نقل التقارير الأخرى
mv *REPORT*.md Documentation/01_SYSTEM_STATUS/
mv *PLAN*.md Documentation/02_PHASES/
```

## **الخطوة 3: نقل ملفات .sql**
```bash
# Backups
mv backup_*.sql backups/

# Migrations
mv check_*.sql migrations/
mv clean-database.sql migrations/
mv fixzone_db.sql backups/
mv structure.sql backups/
```

## **الخطوة 4: نقل ملفات .js و .sh**
```bash
mv *.js testing/scripts/
mv start-*.sh scripts/
mv test_*.sh testing/scripts/
```

## **الخطوة 5: نقل ملفات .html و .json**
```bash
mv *.html testing/reports/
mv *.json testing/reports/
```

---

# ✅ **3. الملفات المسموح بها في المجلد الرئيسي**

## **✅ يجب أن يبقى:**
- `README.md` - الفهرس الرئيسي
- `package.json` - إعدادات Node.js
- `package-lock.json` - قفل الإصدارات
- `ecosystem.config.js` - إعدادات PM2
- `docker-compose.yml` - إعدادات Docker
- `docker-compose.prod.yml` - إعدادات Docker للإنتاج
- `.env` - متغيرات البيئة (في .gitignore)
- `.gitignore` - قائمة الملفات المستثناة

## **❌ يجب نقلها أو حذفها:**
- جميع ملفات .md (عدا README.md)
- جميع ملفات cookie_*.txt
- جميع ملفات .sql (عدا في migrations/)
- جميع ملفات .js (عدا في node_modules/)
- جميع ملفات .sh (عدا في scripts/)
- جميع ملفات .html و .json (عدا في public/)

---

# 📝 **4. قائمة الملفات المراد نقلها**

## **ملفات .md (100+ ملف):**
[قائمة كاملة في التقرير النهائي]

## **ملفات cookie_*.txt (30+ ملف):**
- cookie_expenses_*.txt
- cookie_jar_*.txt
- cookie_login_*.txt
- cookie_payments_*.txt
- cookie_quotations_*.txt
- cookie_stockmovements_*.txt
- cookie_test*.txt
- cookies.txt

## **ملفات .sql (7 ملفات):**
- backup_before_clean_20251125_171135.sql
- backup_before_reset_20251121_025430.sql
- check_columns.sql
- check_expense_schema.sql
- clean-database.sql
- fixzone_db.sql
- structure.sql

## **ملفات .js (5 ملفات):**
- add-test-product-and-stock.js
- apply-optimizations.js
- fix-login.js
- test_repairs_apis.js
- test_repairs_apis_complete.js

## **ملفات .sh (3 ملفات):**
- start-backend.sh
- start-frontend.sh
- test_notifications_api.sh

## **ملفات .html و .json (5 ملفات):**
- test-messaging-settings.html
- test-report.html
- FIXZONE_FRONTEND_FULL_ANALYSIS.json
- fxz-analysis.json
- REPAIRS_COMPREHENSIVE_TEST_2025-10-20.json

---

# 🎯 **5. النتيجة المتوقعة**

## **بعد التنظيف:**
```
FixZone/
├── README.md                    [الملف الوحيد المسموح]
├── package.json
├── package-lock.json
├── ecosystem.config.js
├── docker-compose.yml
├── docker-compose.prod.yml
├── .gitignore
├── .env
│
├── Documentation/              [كل التوثيق هنا]
├── backend/                    [الكود فقط]
├── frontend/                   [الكود فقط]
├── testing/                    [ملفات الاختبار]
├── migrations/                 [ملفات SQL]
├── backups/                    [النسخ الاحتياطية]
└── scripts/                     [السكريبتات]
```

---

**📅 التاريخ:** 12 يناير 2025  
**✅ الحالة:** جاهز للتنفيذ

