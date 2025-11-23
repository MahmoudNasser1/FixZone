# 📝 دلالات للباك اند - Login System
## Backend API Requirements for Enhanced Login

**التاريخ**: 2025-11-23  
**المطور**: Frontend Team  
**الهدف**: توثيق احتياجات الـ Frontend من الـ Backend للـ Login المحسّن

---

## 🎯 الـ APIs المطلوبة

### 1. تسجيل الدخول الموحد
**Endpoint**: `POST /api/auth/login`

#### Request:
```json
{
  "loginIdentifier": "string",  // ممكن يكون email أو phone
  "password": "string",
  "rememberMe": boolean          // optional - للـ session الطويلة
}
```

#### Response Success (200):
```json
{
  "success": true,
  "data": {
    "id": number,


    "name": "string",


    "email": "string",
    "phone": "string",
    "role": number,
    "roleId": number,
    "customerId": number,        // لو customer فقط
    "technicianId": number,      // لو technician فقط
    "type": "string"             // "customer", "te

chnician", "admin"
  },
  "token": "string"              // JWT token (httpOnly cookie + response)
}
```

#### Response Error (400/401):


```json
{
  "success": false,
  "message": "string",           // رسالة الخطأ بالعربي
  "code": "string"              // error code: USER_NOT_FOUND, WRONG_PASSWORD, etc.
}
```

#### Notes للباك اند:
```
✅ يدعم Email و Phone في نفس الـ field
✅ يرجع customerId لو Customer
✅ يرجع technicianId لو Technician  
✅ يرجع type واضح (customer/technician/admin)
✅ JWT يحتوي على role و type و customerId/technicianId
✅ Rate limiting: 5 محاولات كل 15 دقيقة
✅ رسائل الخطأ بالعربي المصري
```

---

### 2. تسجيل الخروج
**Endpoint**: `POST /api/auth/logout`

#### Request:
```json
{}  // الـ token من الـ cookie
```

#### Response (200):
```json
{
  "success": true,
  "message": "تم تسجيل الخروج بنجاح"
}
```

---

### 3. التحقق من الـ Session
**Endpoint**: `GET /api/auth/me`

#### Response (200):
```json
{
  "success": true,
  "data": {
    "id": number,
    "name": "string",
    "email": "string",
    "phone": "string",
    "role": number,
    "roleId": number,
    "type": "string",
    "customerId": number,      // optional
    "technicianId": number     // optional
  }
}
```

#### Response Error (401):
```json
{
  "success": false,
  "message": "غير مصرح",
  "code": "UNAUTHORIZED"
}
```

---

### 4. إعادة تعيين كلمة المرور (Future)
**Endpoint**: `POST /api/auth/reset-password`الخاله دي ملغيه ... سيب رساله مفادها انه يتواصل مع المركز


#### Request:
```json
{
  "email": "string"
}
```

#### Response (200):
```json
{
  "success": true,
  "message": "تم إرسال رابط إعادة التعيين على البريد" الخاله دي ملغيه ... سيب رساله مفادها انه يتواصل مع المركز
}
```

---

## 🔒 Security Requirements

### 1. JWT Token:
```
✅ Expires after 8 hours (أو حسب rememberMe)
✅ httpOnly cookie للأمان
✅ Payload يحتوي على: { id, role, type, customerId?, technicianId? }
✅ Refresh token mechanism (optional)
```


### 3. Rate Limiting: موجوده فعليا لااكنها متوقفه لجد لحين انتهاء التطوير 
```
✅ 5 محاولات login كل 15 دقيقة
✅ IP-based blocking
✅ CAPTCHA بعد 3 محاولات فاشلة (optional)
```

---

## 📊 Error Codes المطلوبة

```javascript
const ERROR_CODES = {
  USER_NOT_FOUND: 'المستخدم غير موجود',
  WRONG_PASSWORD: 'كلمة المرور غير صحيحة',
  ACCOUNT_LOCKED: 'الحساب مغلق، تواصل مع الإدارة',
  TOO_MANY_ATTEMPTS: 'عدد كبير من المحاولات، حاول بعد 15 دقيقة',
  INVALID_CREDENTIALS: 'بيانات الدخول غير صحيحة',
  SESSION_EXPIRED: 'انتهت الجلسة، سجل دخول مرة تانية',
  SERVER_ERROR: 'حصل خطأ في السيرفر، حاول تاني'
};
```

---

## 🎨 Notifications المطلوبة

### يفضل الباك اند يدعم:
```
POST /api/notifications
GET /api/notifications
PATCH /api/notifications/:id/read
```

### للعملاء:
- إشعار عند تغيير حالة الجهاز
- إشعار عند جاهزية الفاتورة
- إشعار عند استلام الجهاز

### للفنيين:
- إشعار عند تسليم جهاز جديد
- إشعار عند توفر قطعة غيار
- تذكير بالأجهزة المتأخرة

---

## 📱 Additional APIs for Enhanced Dashboard

### للعملاء:
```
GET /api/customer/profile          // بيانات العميل
GET /api/customer/repairs          // طلبات الإصلاح
GET /api/customer/invoices         // الفواتير
GET /api/customer/devices          // الأجهزة
GET /api/customer/notifications    // الإشعارات
POST /api/customer/track           // تتبع الطلب بالـ token
```

### للفنيين:
```
GET /api/technician/profile        // بيانات الفني
GET /api/technician/dashboard      // الإحصائيات
GET /api/technician/jobs           // الأجهزة المسلمة له
PATCH /api/technician/jobs/:id     // تحديث حالة الجهاز
GET /api/technician/notifications  // الإشعارات
```

---

## ✅ Checklist للباك اند

- [ ] Endpoint `/api/auth/login` يدعم Email و Phone
- [ ] JWT يحتوي على `type` و `customerId`/`technicianId`
- [ ] رسائل الخطأ بالعربي المصري
- [ ] Rate limiting فعّال
- [ ] Password hashing صح
- [ ] Session management يشتغل
- [ ] Logout ينظف الـ cookies
- [ ] `/api/auth/me` للتحقق من الـ session
- [ ] Notifications APIs جاهزة
- [ ] Customer & Technician APIs شغالة

---

**ملاحظات مهمة**:
1. كل الـ responses تبقى consistent (نفس الـ format)
2. Error handling يكون واضح
3. Validation messages بالعربي
4. CORS configured صح
5. Environment variables للـ JWT secret

---

**آخر تحديث**: 2025-11-23  
**الحالة**: ✅ جاهز للتطبيق
