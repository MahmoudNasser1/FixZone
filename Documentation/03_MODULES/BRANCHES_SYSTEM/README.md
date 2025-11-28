# نظام إدارة الفروع - Branches Management System
## دليل شامل لتطوير وتكامل نظام الفروع

---

## 📚 المحتويات

هذا المجلد يحتوي على التوثيق الشامل لنظام إدارة الفروع في Fix Zone ERP.

### الملفات الرئيسية:

1. **[BRANCHES_COMPREHENSIVE_DEVELOPMENT_PLAN.md](./BRANCHES_COMPREHENSIVE_DEVELOPMENT_PLAN.md)**
   - خطة التطوير الشاملة
   - الوضع الحالي والمشاكل
   - الأهداف والرؤية
   - خطة التطوير للـ Backend
   - خطة التطوير للـ Frontend
   - التكامل مع باقي النظام
   - الأمان والصلاحيات
   - التوثيق والاختبار
   - خطة التنفيذ

2. **[BRANCHES_MIDDLEWARES_INTEGRATION.md](./BRANCHES_MIDDLEWARES_INTEGRATION.md)**
   - دليل التكامل مع الـ Middlewares
   - Authentication Middleware
   - Authorization Middleware
   - Validation Middleware
   - Branch Context Middleware
   - Activity Logging
   - Error Handling
   - أمثلة عملية

3. **[BRANCHES_IMPLEMENTATION_CHECKLIST.md](./BRANCHES_IMPLEMENTATION_CHECKLIST.md)**
   - قائمة تحقق شاملة
   - خطوات التنفيذ خطوة بخطوة
   - Checklist للمراجعة النهائية
   - نصائح وأولويات

---

## 🚀 البدء السريع

### 1. قراءة خطة التطوير
ابدأ بقراءة [BRANCHES_COMPREHENSIVE_DEVELOPMENT_PLAN.md](./BRANCHES_COMPREHENSIVE_DEVELOPMENT_PLAN.md) لفهم:
- الوضع الحالي للنظام
- المشاكل والثغرات
- الأهداف المطلوبة
- خطة التطوير الكاملة

### 2. فهم التكامل مع Middlewares
اقرأ [BRANCHES_MIDDLEWARES_INTEGRATION.md](./BRANCHES_MIDDLEWARES_INTEGRATION.md) لفهم:
- كيفية استخدام الـ Middlewares
- التكامل مع Authentication & Authorization
- Validation و Error Handling
- Activity Logging

### 3. اتباع قائمة التحقق
استخدم [BRANCHES_IMPLEMENTATION_CHECKLIST.md](./BRANCHES_IMPLEMENTATION_CHECKLIST.md) لـ:
- تتبع التقدم
- التأكد من عدم نسيان أي خطوة
- المراجعة النهائية

---

## 📋 نظرة عامة

### الوضع الحالي
- ✅ Routes بسيطة موجودة (`backend/routes/branches.js`)
- ❌ لا يوجد Controller منفصل
- ❌ لا يوجد Validation
- ❌ لا يوجد Activity Logging
- ❌ لا يوجد Frontend Pages
- ❌ لا يوجد Integration مع باقي النظام

### الهدف
بناء نظام إدارة فروع كامل يتضمن:
- ✅ Backend كامل مع Controllers و Validation
- ✅ Frontend كامل مع Pages و Components
- ✅ Integration مع Users, Repairs, Warehouses
- ✅ نظام صلاحيات متقدم
- ✅ Activity Logging شامل
- ✅ تقارير وإحصائيات

---

## 🏗️ البنية المقترحة

### Backend Structure
```
backend/
├── controllers/
│   └── branchesController.js      # Controller رئيسي
├── routes/
│   └── branches.js                # Routes (محدث)
├── middleware/
│   ├── branchContextMiddleware.js # جديد
│   └── validation.js              # محدث
└── utils/
    └── branchErrors.js            # جديد
```

### Frontend Structure
```
frontend/react-app/src/
├── pages/
│   └── branches/
│       ├── BranchesPage.js
│       ├── BranchDetailsPage.js
│       ├── NewBranchPage.js
│       ├── EditBranchPage.js
│       └── index.js
├── components/
│   └── branches/
│       ├── BranchForm.js
│       ├── BranchTable.js
│       ├── BranchFilters.js
│       ├── BranchCard.js
│       └── index.js
└── services/
    └── branchService.js
```

---

## 🔐 الأمان والصلاحيات

### Permissions Matrix

| الإجراء | Admin | Manager | Technician | Receptionist |
|---------|-------|---------|------------|--------------|
| عرض الفروع | ✅ جميع | ✅ جميع | ✅ فرعه فقط | ✅ فرعه فقط |
| إنشاء فرع | ✅ | ❌ | ❌ | ❌ |
| تعديل فرع | ✅ جميع | ✅ فرعه فقط | ❌ | ❌ |
| حذف فرع | ✅ | ❌ | ❌ | ❌ |
| تعطيل/تفعيل | ✅ جميع | ✅ فرعه فقط | ❌ | ❌ |

---

## 📊 Database Schema

### Branch Table (محدث)
```sql
CREATE TABLE Branch (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  address VARCHAR(255),
  phone VARCHAR(30),
  email VARCHAR(100),
  cityId INT,
  managerId INT,
  isActive BOOLEAN DEFAULT TRUE,
  workingHours JSON,
  location JSON,
  settings JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME NULL,
  FOREIGN KEY (cityId) REFERENCES City(id),
  FOREIGN KEY (managerId) REFERENCES User(id) ON DELETE SET NULL
);
```

---

## 🔗 التكامل مع النظام

### Modules المتكاملة:
1. **Users** - ربط المستخدمين بالفروع
2. **Repairs** - تصفية طلبات الإصلاح حسب الفرع
3. **Warehouses** - ربط المخازن بالفروع
4. **Reports** - تقارير خاصة بالفروع

### Branch Context
جميع Controllers الأخرى ستستخدم Branch Context للتصفية التلقائية حسب فرع المستخدم.

---

## 📅 خطة التنفيذ

### المرحلة 1: Database & Backend (أسبوع 1)
- Database Migration
- Controller
- Routes
- Validation
- Middlewares

### المرحلة 2: Frontend (أسبوع 2)
- Services
- Components
- Pages
- Integration

### المرحلة 3: Integration & Testing (أسبوع 3)
- Integration مع باقي النظام
- Testing
- Bug Fixes

### المرحلة 4: Documentation & Review (أسبوع 4)
- API Documentation
- Code Documentation
- User Guide
- Final Review

---

## 🧪 Testing

### Backend Tests
- Unit Tests للـ Controller
- Integration Tests للـ Routes
- Validation Tests
- Permission Tests

### Frontend Tests
- Component Tests
- Page Tests
- Service Tests
- Integration Tests

---

## 📝 API Endpoints

### Branches
- `GET /api/branches` - قائمة الفروع
- `GET /api/branches/:id` - تفاصيل فرع
- `POST /api/branches` - إنشاء فرع
- `PUT /api/branches/:id` - تحديث فرع
- `DELETE /api/branches/:id` - حذف فرع
- `PATCH /api/branches/:id/toggle-status` - تعطيل/تفعيل

### Branch Statistics
- `GET /api/branches/:id/statistics` - إحصائيات الفرع
- `GET /api/branches/:id/users` - مستخدمي الفرع
- `GET /api/branches/:id/warehouses` - مخازن الفرع
- `GET /api/branches/:id/repairs` - طلبات إصلاح الفرع

---

## 🛠️ الأدوات المطلوبة

### Backend
- Node.js
- Express
- MySQL
- Joi (Validation)
- JWT (Authentication)

### Frontend
- React
- React Router
- Axios
- React Hook Form
- Yup (Validation)

---

## 📚 مراجع إضافية

### Documentation
- [Fix Zone ERP - Main Documentation](../../../README.md)
- [Database Guide](../../05_DATABASE/DATABASE_GUIDE_UPDATED.md)
- [API Standards](../../06_DEVELOPMENT/API_STANDARDS.md)

### Related Modules
- [Users System](../USERS_SYSTEM/)
- [Repairs System](../REPAIR_SYSTEM/)
- [Inventory System](../INVENTORY_SYSTEM/)

---

## ✅ Checklist سريع

### قبل البدء
- [ ] قراءة خطة التطوير الكاملة
- [ ] فهم التكامل مع Middlewares
- [ ] مراجعة Database Schema
- [ ] إعداد بيئة التطوير

### أثناء التطوير
- [ ] اتباع قائمة التحقق
- [ ] كتابة Tests أثناء التطوير
- [ ] توثيق الكود
- [ ] مراجعة الكود

### بعد الانتهاء
- [ ] تشغيل جميع Tests
- [ ] مراجعة Security
- [ ] مراجعة Performance
- [ ] تحديث Documentation

---

## 🐛 المشاكل المعروفة

### حالياً
- لا توجد مشاكل معروفة

### تم حلها
- Hard Delete → Soft Delete
- لا يوجد Validation → Validation شامل
- لا يوجد Permissions → Permissions كاملة

---

## 📞 الدعم

للمساعدة أو الاستفسارات:
- راجع الملفات التوثيقية
- راجع Code Comments
- راجع API Documentation

---

## 📄 الترخيص

هذا المشروع جزء من Fix Zone ERP System.

---

**تاريخ الإنشاء:** 2025-01-XX  
**آخر تحديث:** 2025-01-XX  
**الحالة:** 📋 قيد التطوير  
**الإصدار:** 1.0.0


