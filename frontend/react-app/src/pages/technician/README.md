# 🔧 Technician Portal

## Overview
واجهة كاملة للفنيين لإدارة الأجهزة المسلمة لهم في نظام FixZone.

## Features

### ✅ Dashboard
- إحصائيات شاملة للأجهزة
- بطاقات Stats ملونة وجذابة
- إجراءات سريعة
- عرض آخر الأجهزة المحدثة

### ✅ Jobs List
- قائمة جميع الأجهزة المسلمة للفني
- بحث متقدم (اسم العميل، الموديل، السيريال، المشكلة)
- فلاتر حسب الحالة
- عرض Cards responsive

### ✅ Job Details
- معلومات الجهاز الكاملة
- معلومات العميل
- Timeline للأحداث
- تحديث الحالة
- إضافة ملاحظات

## Routes

```
/tech/dashboard         - Dashboard الرئيسي
/tech/jobs              - قائمة الأجهزة
/tech/jobs/:id          - تفاصيل جهاز
/tech/profile           - الملف الشخصي (قريباً)
```

## Components

```
components/technician/
├── JobCard.js           - بطاقة عرض الجهاز
├── JobStatusBadge.js    - Badge الحالة
├── TimelineView.js      - عرض Timeline
└── StatsCard.js         - بطاقة إحصائيات
```

## API Integration

```javascript
import { 
  getTechDashboard,
  getTechJobs,
  getTechJobDetails,
  updateTechJobStatus,
  addTechJobNote
} from '../../services/technicianService';
```

## Permissions

الفني يحتاج إلى الصلاحيات التالية:
- `repairs.view_own` - عرض الأجهزة الخاصة به
- `repairs.update_own` - تحديث حالة الأجهزة
- `repairs.timeline_update` - إضافة ملاحظات

## Security

- TechnicianRoute wrapper يتحقق من roleId === 3
- Redirect automatic للفني
- منع الوصول إلى صفحات الأدمن

## Usage

1. تسجيل الدخول بحساب فني (roleId = 3)
2. سيتم التوجيه تلقائياً إلى `/tech/dashboard`
3. عرض الأجهزة والبحث والفلترة
4. فتح تفاصيل جهاز وتحديث الحالة

## Future Enhancements

- [ ] Media upload (صور وفيديو)
- [ ] Spare parts request
- [ ] Real-time notifications
- [ ] Profile page
- [ ] Advanced analytics

---

**Created:** 2025-11-16  
**Status:** ✅ Complete & Ready


