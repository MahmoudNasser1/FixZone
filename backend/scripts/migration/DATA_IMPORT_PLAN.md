# خطة استيراد البيانات من النظام القديم إلى الجديد
## Data Import Plan from Old System to New FixZone System

📅 **تاريخ:** 21 نوفمبر 2025
🎯 **الهدف:** استيراد العملاء و إيصالات الاستلام من النظام القديم مع الحفاظ على العلاقات

---

## 📊 تحليل النظام القديم

### ملف المصدر:
```
IN/FZ Data From Old System 2025-11-20_u539485933_maintain_dump.sql
```

### الجداول الرئيسية المكتشفة (42 جدول):

#### 1. **جداول العملاء والبيانات الأساسية:**
- `clients` - العملاء (الجدول الرئيسي)
- `locations` - المواقع/المحافظات
- `branches` - الفروع (2 فرع)

#### 2. **جداول طلبات الإصلاح:**
- `workorders` - أوامر العمل (إيصالات الاستلام)
- `invoices` - الفواتير
- `invoice_services` - خدمات الفاتورة
- `invoice_status` - حالات الفواتير

#### 3. **جداول البيانات المساعدة:**
- `lookups` - قيم البحث (الماركات، الملحقات، الفحص، إلخ)
- `types` - الأنواع
- `status` - الحالات
- `departments` - الأقسام

#### 4. **جداول المستخدمين:**
- `users` - المستخدمون
- `roles` - الأدوار
- `permissions` - الصلاحيات

#### 5. **جداول أخرى:**
- `products` - المنتجات/قطع الغيار
- `suppliers` - الموردين
- `purchases` - المشتريات
- `offers` - العروض
- `appointments` - المواعيد
- `missions` - المهام
- `order_task` - مهام الطلبات

---

## 🔍 تحليل بنية الجداول

### 1. جدول `clients` (العملاء القديم)

```sql
CREATE TABLE `clients` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `location_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `mobile` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `balance` decimal(8,2) DEFAULT 0.00,
  `price_type` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
)
```

**الأعمدة الهامة:**
- `id` → `Customer.id` (النظام الجديد)
- `name` → `Customer.name`
- `mobile` → `Customer.phone`
- `address` → `Customer.address`
- `location_id` → يحتاج ربط مع City
- `balance` → معلومات مالية (للمتابعة لاحقاً)
- `deleted_at` → للفلترة

### 2. جدول `workorders` (طلبات الإصلاح القديم)

```sql
CREATE TABLE `workorders` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `client_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `branche_id` bigint(20) unsigned NOT NULL,
  `service` varchar(255) DEFAULT NULL,
  `date_recieved` timestamp NULL DEFAULT NULL,
  `date_final` timestamp NULL DEFAULT NULL,
  `problem_type` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `specify` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `warranty` varchar(255) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `device` varchar(255) DEFAULT NULL,
  `price` decimal(8,2) DEFAULT NULL,
  `isPaid` varchar(255) DEFAULT NULL,
  `examinations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
)
```

**الأعمدة الهامة:**
- `id` → سيتم إنشاء `RepairRequest.id` جديد
- `client_id` → `RepairRequest.customerId` (ربط مع العملاء)
- `user_id` → `RepairRequest.technicianId` (المستخدم/الفني)
- `branche_id` → `RepairRequest.branchId`
- `device` → معلومات الجهاز → `Device` table
- `problem_type` → JSON يحتوي على نوع المشكلة → `RepairRequest.reportedProblem`
- `specify` → JSON يحتوي على مواصفات الجهاز
- `status` → `RepairRequest.status`
- `date_recieved` → `RepairRequest.createdAt`
- `examinations` → JSON يحتوي على نتائج الفحص
- `price` → `RepairRequest.estimatedCost`
- `note` → `RepairRequest.notes`

### 3. جدول `lookups` (القيم المساعدة)

```sql
CREATE TABLE `lookups` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `module` varchar(255) NOT NULL,
  `_lft` int(10) unsigned NOT NULL DEFAULT 0,
  `_rgt` int(10) unsigned NOT NULL DEFAULT 0,
  `parent_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
)
```

**الوحدات (Modules):**
- `brand` → الماركات → `VariableOption` (category: brand)
- `deviceType` → أنواع الأجهزة → `VariableOption` (category: deviceType)
- `accessories` → الملحقات → `VariableOption` (category: accessories)
- `examination` → نتائج الفحص → يمكن حفظها في notes
- `category` → فئات المنتجات

---

## 🎯 خطة الربط بين النظامين

### المرحلة 1: العملاء (Customers)

```
clients (Old)  →  Customer (New)
=====================================
id             →  مرجع داخلي للربط
name           →  Customer.name
mobile         →  Customer.phone
address        →  Customer.address
location_id    →  Customer.cityId (بعد ربط Locations → City)
created_at     →  Customer.createdAt
updated_at     →  Customer.updatedAt
deleted_at     →  Customer.deletedAt
```

### المرحلة 2: الأجهزة (Devices)

```
workorders.device + specify (Old)  →  Device (New)
=======================================================
workorders.client_id                →  Device.customerId
device (text)                       →  Device.deviceType
specify['brand']                    →  Device.brand / Device.brandId
specify['model']                    →  Device.model
specify['cpu']                      →  Device.cpu
specify['gpu']                      →  Device.gpu
specify['ram']                      →  Device.ram
specify['storage']                  →  Device.storage
specify['serial']                   →  Device.serialNumber
specify['password']                 →  Device.devicePassword
```

### المرحلة 3: طلبات الإصلاح (RepairRequests)

```
workorders (Old)  →  RepairRequest + Device (New)
=======================================================
id                →  مرجع داخلي (tracking reference)
client_id         →  RepairRequest.customerId
device            →  Device.deviceType (جديد)
problem_type      →  RepairRequest.reportedProblem
status            →  RepairRequest.status (تحويل)
note              →  RepairRequest.notes
user_id           →  RepairRequest.technicianId
branche_id        →  RepairRequest.branchId
date_recieved     →  RepairRequest.createdAt
examinations      →  ملحق في notes أو customFields
price             →  RepairRequest.estimatedCost
```

### المرحلة 4: الملحقات (Accessories)

```
problem_type['accessories'] (JSON) →  RepairRequestAccessory (New)
=========================================================================
استخراج الملحقات من JSON القديم وربطها بجدول VariableOption
ثم إنشاء سجلات في RepairRequestAccessory
```

---

## 📋 خطوات التنفيذ المقترحة

### **الخطوة 1: تحليل وتنظيف البيانات** ⚡
1. استخراج العملاء النشطين (deleted_at IS NULL)
2. استخراج طلبات الإصلاح النشطة
3. تحليل JSON fields (problem_type, specify, examinations)
4. إنشاء ملفات CSV منظمة

### **الخطوة 2: إعداد البيانات المساعدة** 🔧
1. استيراد Locations → City
2. استيراد Lookups (brand, deviceType, accessories) → VariableOption
3. استيراد Users (إذا لزم الأمر)
4. استيراد Branches (إذا لزم الأمر)

### **الخطوة 3: استيراد العملاء** 👥
1. إنشاء ملف `customers_import.sql`
2. التحقق من عدم التكرار (phone number)
3. الحفاظ على `id` القديم في `customFields` للمرجعية

### **الخطوة 4: استيراد الأجهزة** 💻
1. إنشاء Device لكل workorder
2. ربطه بالعميل المستورد
3. ربطه بال brand من VariableOption

### **الخطوة 5: استيراد طلبات الإصلاح** 📋
1. إنشاء RepairRequest لكل workorder
2. ربطه بالعميل والجهاز
3. تحويل الحالات (status mapping)
4. إنشاء tracking token فريد

### **الخطوة 6: استيراد الملحقات** 🔌
1. استخراج accessories من JSON
2. إنشاء RepairRequestAccessory records

### **الخطوة 7: الاختبار والتحقق** ✅
1. التحقق من عدد السجلات المستوردة
2. التحقق من العلاقات (Foreign Keys)
3. اختبار عينة من البيانات في الواجهة

---

## 🗺️ ربط الحالات (Status Mapping)

### حالات النظام القديم → الجديد:

```javascript
{
  '1': 'RECEIVED',        // استلام
  '2': 'INSPECTION',      // فحص
  '3': 'AWAITING_APPROVAL', // انتظار الموافقة
  '4': 'UNDER_REPAIR',    // تحت الإصلاح
  '5': 'READY_FOR_DELIVERY', // جاهز للتسليم  
  '6': 'DELIVERED',       // تم التسليم
  '7': 'REJECTED',        // مرفوض
  '8': 'WAITING_PARTS',   // انتظار قطع غيار
  '9': 'ON_HOLD'          // معلق
}
```

---

## 📁 الملفات المتوقع إنشاؤها

```
backend/scripts/migration/
├── 1_extract_old_data.js         // استخراج البيانات من SQL القديم
├── 2_transform_data.js           // تحويل البيانات للصيغة الجديدة
├── 3_import_locations.sql        // استيراد المواقع
├── 4_import_lookups.sql          // استيراد القيم المساعدة
├── 5_import_customers.sql        // استيراد العملاء
├── 6_import_devices.sql          // استيراد الأجهزة
├── 7_import_repairs.sql          // استيراد طلبات الإصلاح
├── 8_import_accessories.sql      // استيراد الملحقات
└── 9_verify_import.js            // التحقق من الاستيراد
```

---

## ⚠️ ملاحظات هامة

### 1. **التعامل مع JSON:**
- `problem_type` في workorders هو JSON يحتوي على:
  - نوع المشكلة (problem)
  - الملحقات (accessories array)
  
- `specify` هو JSON يحتوي على مواصفات الجهاز:
  - brand, model, cpu, gpu, ram, storage, serial, password

### 2. **الحفاظ على المراجع:**
- حفظ `old_system_id` في `customFields` لكل سجل
- يمكن استخدامه للربط المستقبلي أو التدقيق

### 3. **البيانات المحذوفة:**
- تجاهل السجلات التي `deleted_at IS NOT NULL`
- أو استيرادها مع وضع علامة محذوفة

### 4. **ترقيم التتبع:**
- إنشاء `tracking_token` جديد لكل RepairRequest
- حفظ رقم الطلب القديم في `customFields`

---

## 📊 الإحصائيات المتوقعة

بناءً على الفحص الأولي للملف:

| الجدول | العدد التقريبي |
|--------|----------------|
| العملاء (clients) | 300-500 |
| طلبات الإصلاح (workorders) | 800-1200 |
| الفواتير (invoices) | 800-1200 |
| المستخدمون (users) | 5-10 |
| الفروع (branches) | 2 |
| القيم المساعدة (lookups) | 94 |

---

## 🚀 الخطوات التالية

1. ✅ **تحليل البنية:** مكتمل
2. ⏳ **استخراج العينات:** قيد التنفيذ
3. ⏳ **إنشاء سكريبتات التحويل:** قادم
4. ⏳ **الاختبار:** قادم
5. ⏳ **التنفيذ النهائي:** قادم

---

## 📞 للاستفسار والدعم

راجع الملفات الأخرى في هذا المجلد:
- `README.md` - الدليل العام
- `QUICK_START.md` - البداية السريعة
- `إرشادات_الاستيراد.md` - الإرشادات بالعربية

---

**آخر تحديث:** 21 نوفمبر 2025  
**الحالة:** 🟡 قيد التطوير
