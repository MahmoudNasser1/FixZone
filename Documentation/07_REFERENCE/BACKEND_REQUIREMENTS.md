# 📝 دلالات للباك اند - Login System
## Backend API Requirements for Enhanced Login

**التاريخ**: 2025-11-23  
**المطور**: Frontend Team  
**الهدف**: توثيق احتياجات الـ Frontend من الـ Backend للـ Login المحسّن

---

## 🎯 الـ APIs المطلوبة

### 1. تسجيل الدخول الموحد ( تم ابانتهاء منها فعليا وتعمل )
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

## 📊 APIs للـ Customer Dashboard و الصفحات الفرعية

### 1. Customer Profile API
**Endpoint**: `GET /api/auth/customer/profile`

**Headers**:
```json
{
  "Cookie": "token=<JWT_TOKEN>"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "أحمد محمد",
    "email": "ahmed@example.com",
    "phone": "01012345678",
    "address": "القاهرة، مصر",
    "createdAt": "2024-01-15T10:30:00Z",
    "totalRepairs": 15,
    "totalSpent": 25000.00
  }
}
```

---

### 2. Customer Stats API
**Endpoint**: `GET /api/customer/stats`

**Query Parameters**:
- `customerId` (optional) - يتم استخراجه من الـ JWT إذا لم يُمرر

**Response** (Success - 200):
```json
{
  "success": true,
  "data": {
    "totalRepairs": 15,
    "activeRepairs": 3,
    "completedRepairs": 10,
    "cancelledRepairs": 2,
    "totalInvoices": 12,
    "pendingInvoices": 2,
    "paidInvoices": 8,
    "overdueInvoices": 2,
    "totalDevices": 5,
    "totalSpent": 15000.50
  }
}
```

---

### 3. Customer Repairs List API
**Endpoint**: `GET /api/repairs`

**Query Parameters**:
- `customerId` - يتم استخراجه من الـ JWT
- `page` (optional) - رقم الصفحة (default: 1)
- `limit` (optional) - عدد العناصر (default: 10)
- `status` (optional) - فلترة حسب الحالة (pending, in_progress, completed, cancelled)
- `search` (optional) - بحث في رقم الطلب أو نوع الجهاز

**Response** (Success - 200):
```json
{
  "success": true,
  "data": {
    "repairs": [
      {
        "id": 456,
        "deviceType": "iPhone 13 Pro",
        "brand": "Apple",
        "model": "A2483",
        "issueDescription": "شاشة مكسورة",
        "status": "in_progress",
        "estimatedCost": 2500.00,
        "actualCost": null,
        "createdAt": "2024-01-20T14:30:00Z",
        "updatedAt": "2024-01-21T10:15:00Z",
        "assignedTechnician": "محمد أحمد",
        "estimatedCompletionDate": "2024-01-25T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 2,
      "totalItems": 15
    }
  }
}
```

---

### 4. Customer Repair Details API
**Endpoint**: `GET /api/repairs/:id`

**Response** (Success - 200):
```json
{
  "success": true,
  "data": {
    "id": 456,
    "customerId": 123,
    "customerName": "أحمد محمد",
    "deviceType": "iPhone 13 Pro",
    "brand": "Apple",
    "model": "A2483",
    "serialNumber": "DMPTXXXXXX",
    "issueDescription": "شاشة مكسورة",
    "status": "in_progress",
    "priority": "normal",
    "estimatedCost": 2500.00,
    "actualCost": null,
    "createdAt": "2024-01-20T14:30:00Z",
    "updatedAt": "2024-01-21T10:15:00Z",
    "assignedTechnicianId": 5,
    "assignedTechnician": "محمد أحمد",
    "estimatedCompletionDate": "2024-01-25T00:00:00Z",
    "history": [
      {
        "id": 1,
        "action": "تم استلام الجهاز",
        "description": "تم فحص الجهاز والتأكد من المشكلة",
        "createdAt": "2024-01-20T14:30:00Z",
        "createdBy": "موظف الاستقبال"
      },
      {
        "id": 2,
        "action": "بدء الإصلاح",
        "description": "تم تكليف الفني محمد أحمد",
        "createdAt": "2024-01-21T10:15:00Z",
        "createdBy": "النظام"
      }
    ],
    "parts": [
      {
        "id": 10,
        "name": "شاشة iPhone 13 Pro - أصلي",
        "quantity": 1,
        "price": 2000.00
      }
    ]
  }
}
```

---

### 5. Customer Invoices List API
**Endpoint**: `GET /api/invoices`

**Query Parameters**:
- `customerId` - يتم استخراجه من الـ JWT
- `page` (optional)
- `limit` (optional)
- `paymentStatus` (optional) - pending, paid, overdue, cancelled

**Response** (Success - 200):
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": 789,
        "repairId": 456,
        "totalAmount": 2650.00,
        "paidAmount": 0,
        "remainingAmount": 2650.00,
        "paymentStatus": "pending",
        "dueDate": "2024-01-30T00:00:00Z",
        "createdAt": "2024-01-22T12:00:00Z",
        "items": [
          {
            "description": "شاشة iPhone 13 Pro",
            "quantity": 1,
            "price": 2000.00,
            "total": 2000.00
          },
          {
            "description": "أجر الفني",
            "quantity": 1,
            "price": 500.00,
            "total": 500.00
          },
          {
            "description": "ضريبة القيمة المضافة (14%)",
            "quantity": 1,
            "price": 375.00,
            "total": 375.00
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 2,
      "totalItems": 12
    }
  }
}
```

---

### 6. Customer Invoice Details API
**Endpoint**: `GET /api/invoices/:id`

**Response** (Success - 200):
```json
{
  "success": true,
  "data": {
    "id": 789,
    "invoiceNumber": "INV-2024-000789",
    "customerId": 123,
    "customerName": "أحمد محمد",
    "customerPhone": "01012345678",
    "repairId": 456,
    "totalAmount": 2650.00,
    "paidAmount": 0,
    "remainingAmount": 2650.00,
    "paymentStatus": "pending",
    "paymentMethod": null,
    "dueDate": "2024-01-30T00:00:00Z",
    "createdAt": "2024-01-22T12:00:00Z",
    "items": [
      {
        "id": 1,
        "description": "شاشة iPhone 13 Pro - أصلي",
        "quantity": 1,
        "unitPrice": 2000.00,
        "total": 2000.00
      },
      {
        "id": 2,
        "description": "أجر الفني",
        "quantity": 1,
        "unitPrice": 500.00,
        "total": 500.00
      },
      {
        "id": 3,
        "description": "ضريبة (15%)",
        "quantity": 1,
        "unitPrice": 375.00,
        "total": 375.00
      }
    ],
    "payments": [
      {
        "id": 1,
        "amount": 1000.00,
        "method": "cash",
        "paidAt": "2024-01-23T10:00:00Z",
        "notes": "دفعة مقدمة"
      }
    ]
  }
}
```

---

### 7. Customer Devices List API
**Endpoint**: `GET /api/customer/devices`

**Response** (Success - 200):
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "id": 10,
        "deviceType": "iPhone 13 Pro",
        "brand": "Apple",
        "model": "A2483",
        "serialNumber": "DMPTXXXXXX",
        "totalRepairs": 2,
        "lastRepairDate": "2024-01-20T14:30:00Z",
        "status": "in_repair"
      },
      {
        "id": 11,
        "deviceType": "MacBook Pro 14",
        "brand": "Apple",
        "model": "M1 Pro",
        "serialNumber": "C02XXXXXXX",
        "totalRepairs": 1,
        "lastRepairDate": "2023-12-10T10:00:00Z",
        "status": "completed"
      }
    ]
  }
}
```

---

### 8. Update Customer Profile API
**Endpoint**: `PUT /api/customer/profile`

**Request Body**:
```json
{
  "name": "أحمد محمد علي",
  "phone": "01012345678",
  "address": "القاهرة، مدينة نصر",
  "email": "ahmed.new@example.com"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "message": "تم تحديث البيانات بنجاح",
  "data": {
    "id": 123,
    "name": "أحمد محمد علي",
    "email": "ahmed.new@example.com",
    "phone": "01012345678",
    "address": "القاهرة، مدينة نصر"
  }
}
```

---

### 9. Customer Notifications API
**Endpoint**: `GET /api/customer/notifications`

**Query Parameters**:
- `page` (optional)
- `limit` (optional)
- `unreadOnly` (optional) - true/false

**Response** (Success - 200):
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 1,
        "type": "repair_status",
        "title": "تحديث حالة الإصلاح",
        "message": "تم بدء إصلاح جهازك iPhone 13 Pro",
        "isRead": false,
        "createdAt": "2024-01-21T10:15:00Z",
        "relatedId": 456,
        "relatedType": "repair"
      },
      {
        "id": 2,
        "type": "invoice",
        "title": "فاتورة جديدة",
        "message": "تم إنشاء فاتورة بقيمة 2650 جنيه",
        "isRead": true,
        "createdAt": "2024-01-22T12:00:00Z",
        "relatedId": 789,
        "relatedType": "invoice"
      }
    ],
    "unreadCount": 3,
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "totalItems": 5
    }
  }
}
```

---

### 10. Mark Notification as Read API
**Endpoint**: `PUT /api/customer/notifications/:id/read`

**Response** (Success - 200):
```json
{
  "success": true,
  "message": "تم تحديث الإشعار"
}
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

---

## 🛠️ APIs للـ Technician Dashboard

### 1. Technician Dashboard Stats
**Endpoint**: `GET /api/technician/dashboard`
**Response**:
```json
{
  "success": true,
  "data": {
    "byStatus": [
      { "status": "in_progress", "count": 3 },
      { "status": "completed", "count": 5 },
      { "status": "pending", "count": 2 }
    ],
    "efficiency": 95,
    "totalAssigned": 10
  }
}
```

### 2. Technician Jobs List
**Endpoint**: `GET /api/technician/jobs`
**Query Params**: `status`, `sort`, `search`
**Response**: List of jobs with summary details.

### 3. Job Details (Full)
**Endpoint**: `GET /api/technician/jobs/:id`
**Response**: Full details including customer info, device info, parts, notes, and timeline status.

### 4. Update Job Status
**Endpoint**: `PUT /api/technician/jobs/:id/status`
**Request**: `{ "status": "completed" }`

### 5. Add Job Part
**Endpoint**: `POST /api/technician/jobs/:id/parts`
**Request**: `{ "partId": 55, "quantity": 1 }`

### 6. Add Job Note
**Endpoint**: `POST /api/technician/jobs/:id/notes`
**Request**: `{ "content": "تم فحص الجهاز..." }`

---

## 📱 APIs إضافية للعملاء (Customer Portal)

### 1. Repair Tracking Timeline
**Endpoint**: `GET /api/customer/repairs/:id/timeline`
**Response**:
```json
{
  "currentStatus": "testing",
  "history": [
    { "status": "received", "timestamp": "2024-01-20T10:00:00Z" },
    { "status": "diagnosing", "timestamp": "2024-01-21T12:00:00Z" },
    { "status": "in_progress", "timestamp": "2024-01-22T09:00:00Z" },
    { "status": "testing", "timestamp": "2024-01-23T14:00:00Z" }
  ]
}
```

### 2. Before/After Photos
**Endpoint**: `GET /api/customer/repairs/:id/photos`
**Response**:
```json
{
  "before": "url_to_before_image.jpg",
  "after": "url_to_after_image.jpg"
}
```

### 3. Invoice Details & Payment
**Endpoint**: `GET /api/customer/invoices/:id`
**Response**: Full invoice details including items, tax, and status.

**Endpoint**: `POST /api/customer/invoices/:id/pay`
**Request**: Payment gateway token/details.
**Response**: `{ "success": true, "newStatus": "paid" }`

---

## 🛠️ APIs للـ Technician Dashboard

### 1. Technician Dashboard Stats
**Endpoint**: `GET /api/technician/dashboard`

**Response** (Success - 200):
```json
{
  "success": true,
  "data": {
    "byStatus": [
      { "status": "in_progress", "count": 3 },
      { "status": "completed", "count": 5 },
      { "status": "pending", "count": 2 }
    ],
    "efficiency": 95,
    "totalAssigned": 10
  }
}
```

### 2. Technician Jobs List
**Endpoint**: `GET /api/technician/jobs`

**Query Parameters**:
- `status` (pending, in_progress, completed)
- `sort` (date_desc, date_asc, priority)
- `search` (customer name, device, id)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "deviceType": "iPhone 13",
      "issueDescription": "Screen Replacement",
      "status": "in_progress",
      "priority": "high",
      "customerName": "Ahmed Ali",
      "createdAt": "2024-01-23T10:00:00Z"
    }
  ]
}
```

### 3. Job Details (Full)
**Endpoint**: `GET /api/technician/jobs/:id`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 101,
    "deviceType": "iPhone 13",
    "brand": "Apple",
    "model": "A2633",
    "issueDescription": "Broken Screen",
    "status": "in_progress",
    "priority": "high",
    "elapsedTime": 3600, // seconds
    "customerName": "Ahmed Ali",
    "customerPhone": "01012345678",
    "customerAddress": "Cairo, Egypt",
    "parts": [
      { "name": "Screen Original", "quantity": 1, "price": 3500 }
    ],
    "notes": [
      { "id": 1, "content": "Started work", "author": "Eng. Ahmed", "createdAt": "..." }
    ]
  }
}
```

### 4. Update Job Status
**Endpoint**: `PUT /api/technician/jobs/:id/status`

**Request**:
```json
{
  "status": "completed" // or in_progress, pending
}
```

### 5. Add Job Part
**Endpoint**: `POST /api/technician/jobs/:id/parts`

**Request**:
```json
{
  "partId": 55,
  "quantity": 1
}
```

### 6. Add Job Note
**Endpoint**: `POST /api/technician/jobs/:id/notes`

**Request**:
```json
{
  "content": "تم فحص الجهاز وتبين وجود عطل في البطارية أيضاً"
}
```

---

## ✅ Checklist للباك اند

### Login & Authentication
- [ ] Endpoint `/api/auth/login` يدعم Email و Phone
- [ ] JWT يحتوي على `type` و `customerId`/`technicianId`
- [ ] رسائل الخطأ بالعربي المصري
- [ ] Rate limiting فعّال
- [ ] Password hashing صح (bcrypt)
- [ ] Session management يشتغل
- [ ] Logout ينظف الـ cookies
- [ ] `/api/auth/me` للتحقق من الـ session

### Customer Dashboard APIs
- [ ] `GET /api/auth/customer/profile` - بيانات العميل
- [ ] `GET /api/customer/stats` - إحصائيات العميل
- [ ] `GET /api/repairs?customerId=:id` - قائمة الإصلاحات
- [ ] `GET /api/repairs/:id` - تفاصيل الإصلاح
- [ ] `GET /api/invoices?customerId=:id` - قائمة الفواتير
- [ ] `GET /api/invoices/:id` - تفاصيل الفاتورة
- [ ] `GET /api/customer/devices` - قائمة الأجهزة
- [ ] `PUT /api/customer/profile` - تحديث البيانات
- [ ] `GET /api/customer/notifications` - الإشعارات
- [ ] `PUT /api/customer/notifications/:id/read` - تحديد كمقروء

### Response Format
- [ ] كل الـ responses تبقى consistent (نفس الـ format)
- [ ] Error handling واضح
- [ ] Validation messages بالعربي
- [ ] Pagination في كل القوائم
- [ ] Success/Error codes محددة

### Security & Performance
- [ ] CORS configured صح
- [ ] Environment variables للـ JWT secret
- [ ] Database indexes للـ queries الكثيرة
- [ ] Caching للبيانات المتكررة
- [ ] Input validation على كل endpoint

---

## 📊 ملخص الـ APIs المطلوبة

### إجمالي الـ Endpoints: 13 API

#### Authentication (3 APIs)
1. `POST /api/auth/login` - تسجيل الدخول الموحد
2. `POST /api/auth/logout` - تسجيل الخروج
3. `GET /api/auth/me` - التحقق من الجلسة

#### Customer Profile (2 APIs)
4. `GET /api/auth/customer/profile` - بيانات العميل
5. `PUT /api/customer/profile` - تحديث البيانات

#### Repairs (2 APIs)
6. `GET /api/repairs` - قائمة الإصلاحات (مع filters)
7. `GET /api/repairs/:id` - تفاصيل الإصلاح

#### Invoices (2 APIs)
8. `GET /api/invoices` - قائمة الفواتير (مع filters)
9. `GET /api/invoices/:id` - تفاصيل الفاتورة

#### Devices (1 API)
10. `GET /api/customer/devices` - قائمة الأجهزة

#### Stats (1 API)
11. `GET /api/customer/stats` - إحصائيات شاملة

#### Notifications (2 APIs)
12. `GET /api/customer/notifications` - قائمة الإشعارات
13. `PUT /api/customer/notifications/:id/read` - تحديد كمقروء

---

## 🎯 الأولويات للتطبيق

### أولوية عالية (Critical)
1. ✅ Login API - **مطبق بالفعل**
2. ✅ Customer Profile API - **مطبق بالفعل**
3. 🔴 Repairs List API - **مطلوب للصفحة**
4. 🔴 Invoices List API - **مطلوب للصفحة**
5. 🔴 Customer Stats API - **مطلوب للـ Dashboard**

### أولوية متوسطة
6. 🟡 Repair Details API
7. 🟡 Invoice Details API
8. 🟡 Devices List API
9. 🟡 Update Profile API

### أولوية منخفضة
10. 🟢 Notifications APIs
11. 🟢 Mark as Read API

---

## 📝 ملاحظات التطوير

### للـ Backend Developer:
1. **Response Format**: التزم بالـ structure الموحد في كل الـ responses
2. **Error Messages**: استخدم الرسائل العربية المصرية الموجودة في الـ ERROR_CODES
3. **Pagination**: طبّق pagination على كل القوائم (repairs, invoices, notifications)
4. **Filtering**: ادعم الفلاتر المذكورة في كل endpoint
5. **Security**: تأكد من التحقق من الـ customerId من الـ JWT
6. **Performance**: استخدم indexes على الـ queries الكثيرة

### Testing:
- استخدم Postman أو Thunder Client للاختبار
- اختبر كل endpoint بـ valid و invalid data
- تأكد من الـ error handling
- راجع الـ response times

---

**آخر تحديث**: 2025-11-23  
**الحالة**: ✅ جاهز للتطبيق  
**الصفحات المرتبطة**: 
- Customer Dashboard ✅
- Customer Repairs Page ✅
- Customer Invoices Page ✅
- Customer Devices Page ✅
- Customer Profile Page ✅
- Customer Settings Page ✅
