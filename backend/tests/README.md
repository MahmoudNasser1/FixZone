# Authentication & Permissions Test Suite

## نظرة عامة

مجموعة شاملة من الاختبارات لنظام المصادقة والصلاحيات في FixZone ERP.

## البنية

```
tests/
├── setup/
│   └── testHelpers.js          # مساعدات إنشاء مستخدمين وأدوار اختبار
├── unit/
│   ├── auth.test.js            # اختبارات تسجيل الدخول
│   └── permissions.test.js     # اختبارات نظام الصلاحيات
├── integration/
│   └── auth.permissions.integration.test.js  # اختبارات تكامل شاملة
├── run-all-tests.js            # سكريبت تشغيل جميع الاختبارات
└── README.md                   # هذا الملف
```

## أنواع الاختبارات

### 1. Unit Tests - تسجيل الدخول (`auth.test.js`)

- ✅ تسجيل الدخول بالبريد الإلكتروني
- ✅ تسجيل الدخول برقم الهاتف
- ✅ رفض تسجيل الدخول ببيانات خاطئة
- ✅ رفض تسجيل الدخول ببيانات ناقصة
- ✅ معالجة مستخدمين العملاء

### 2. Unit Tests - الصلاحيات (`permissions.test.js`)

- ✅ Admin لديه جميع الصلاحيات
- ✅ Manager لديه صلاحيات محددة
- ✅ Technician لديه صلاحيات محددة
- ✅ Customer لديه صلاحيات محدودة
- ✅ رفض الوصول بدون صلاحيات
- ✅ وراثة الصلاحيات من الدور الأب
- ✅ `checkAnyPermission` - واحدة من الصلاحيات
- ✅ `checkAllPermissions` - جميع الصلاحيات

### 3. Integration Tests (`auth.permissions.integration.test.js`)

- ✅ تسجيل دخول مستخدمين مختلفين
- ✅ تطبيق الصلاحيات على `/api/users`
- ✅ تطبيق الصلاحيات على `/api/roles`
- ✅ تطبيق الصلاحيات على `/api/repairs`
- ✅ رفض الوصول بدون مصادقة
- ✅ سيناريوهات واقعية (إنشاء/تحديث/حذف)

## التشغيل

### تشغيل جميع الاختبارات

```bash
cd backend
npm test
```

### تشغيل اختبارات محددة

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Specific test file
npx jest tests/unit/auth.test.js

# With coverage
npm run test:coverage
```

### استخدام السكريبت المخصص

```bash
# جميع الاختبارات
node tests/run-all-tests.js

# Unit tests فقط
node tests/run-all-tests.js unit

# Integration tests فقط
node tests/run-all-tests.js integration
```

## إعدادات الاختبار

### متطلبات

1. قاعدة بيانات اختبار منفصلة (موصى به)
2. متغيرات البيئة في `.env.test`:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=FZ_test
   JWT_SECRET=test_secret_key
   ```

### البيانات الاختبارية

يتم إنشاء بيانات اختبارية تلقائياً:
- أدوار اختبار: Admin, Manager, Technician, Customer
- مستخدمين اختبار بصلاحيات مختلفة
- تنظيف تلقائي بعد الاختبارات

## الأمثلة

### إنشاء مستخدم اختبار

```javascript
const { createTestUser } = require('./setup/testHelpers');

const user = await createTestUser({
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  roleId: 1
});
```

### إنشاء دور اختبار

```javascript
const { createTestRole } = require('./setup/testHelpers');

const role = await createTestRole({
  name: 'TestRole',
  permissions: {
    'repairs.view': true,
    'repairs.update': true
  }
});
```

### طلب مصادق

```javascript
const { createAuthHeaders } = require('./setup/testHelpers');
const request = require('supertest');

const headers = createAuthHeaders(user);
const response = await request(app)
  .get('/api/users')
  .set('Cookie', headers.Cookie);
```

## التقارير

### Coverage Report

```bash
npm run test:coverage
```

سيتم إنشاء تقرير في `coverage/` directory.

## ملاحظات

1. **قاعدة بيانات الاختبار**: يفضل استخدام قاعدة بيانات منفصلة للاختبارات
2. **البيانات الاختبارية**: يتم تنظيفها تلقائياً بعد كل مجموعة اختبارات
3. **الأدوار النظامية**: لا يمكن حذف الأدوار النظامية (`isSystem = true`)
4. **JWT Tokens**: يتم إنشاء tokens صحيحة للاختبارات

## استكشاف الأخطاء

### الاختبارات تفشل بسبب قاعدة البيانات

```bash
# تحقق من الاتصال
mysql -u root -p FZ_test -e "SELECT 1"
```

### مشاكل JWT

```bash
# تحقق من JWT_SECRET
echo $JWT_SECRET
```

### تنظيف البيانات الاختبارية يدوياً

```sql
DELETE FROM User WHERE email LIKE '%test%' OR email LIKE '%integration%';
DELETE FROM Role WHERE name LIKE '%Test%' OR name LIKE '%Integration%';
```

## المساهمة

عند إضافة اختبارات جديدة:
1. استخدم `testHelpers.js` لإنشاء بيانات الاختبار
2. نظف البيانات بعد الاختبارات
3. اكتب اختبارات واضحة وموثقة
4. اتبع نمط الاختبارات الموجودة

## الدعم

للمساعدة أو الأسئلة، راجع:
- `TESTING/RESULTS/07_ROLES_PERMISSIONS_TEST_GUIDE.md`
- `ROLES_PERMISSIONS_SYSTEM_PLAN.md`

