# 📘 دليل الاختبار اليدوي لوحدة Notifications - FixZone ERP
## Manual Testing Guide for Notifications Module

**التاريخ:** 2025-11-14  
**المهندس:** Auto (Cursor AI) - QA Engineer  

---

## 📋 متطلبات الاختبار

1. ✅ Backend server يعمل على `http://localhost:3001`
2. ✅ Frontend server يعمل على `http://localhost:3000`
3. ✅ قاعدة البيانات متصلة
4. ✅ مستخدم مسجل دخول (للوصول إلى المسارات المحمية)

---

## 🔐 الحصول على Token

### الطريقة 1: من المتصفح (أسهل)
1. افتح المتصفح على `http://localhost:3000`
2. سجل الدخول
3. افتح Developer Console (F12)
4. اكتب:
```javascript
// الحصول على token من localStorage
const token = localStorage.getItem('token');
console.log('Token:', token);

// أو من auth-storage
const authStorage = localStorage.getItem('auth-storage');
if (authStorage) {
  const authData = JSON.parse(authStorage);
  const token = authData?.state?.token;
  console.log('Token from auth-storage:', token);
}
```

### الطريقة 2: من API مباشرة
```bash
# تسجيل الدخول والحصول على token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginIdentifier":"ahmed","password":"ahmed"}' \
  | jq -r '.token'
```

---

## 🧪 الاختبارات اليدوية

### 1. GET /api/notifications/unread/count

**الوصف:** جلب عدد الإشعارات غير المقروءة

**الطريقة:**
```bash
curl -X GET "http://localhost:3001/api/notifications/unread/count" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "count": 5
}
```

**من المتصفح (Console):**
```javascript
fetch('http://localhost:3001/api/notifications/unread/count', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(console.log);
```

---

### 2. GET /api/notifications

**الوصف:** جلب جميع الإشعارات (مع pagination و filters)

**الطريقة:**
```bash
# بدون filters
curl -X GET "http://localhost:3001/api/notifications?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"

# مع filter: unread only
curl -X GET "http://localhost:3001/api/notifications?isRead=false&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"

# مع filter: by type
curl -X GET "http://localhost:3001/api/notifications?type=info&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"

# مع filter: by channel
curl -X GET "http://localhost:3001/api/notifications?channel=IN_APP&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**من المتصفح (Console):**
```javascript
// بدون filters
fetch('http://localhost:3001/api/notifications?page=1&limit=10', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(console.log);

// مع filters
fetch('http://localhost:3001/api/notifications?isRead=false&type=info&page=1&limit=10', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(console.log);
```

---

### 3. POST /api/notifications

**الوصف:** إنشاء إشعار جديد

**الطريقة:**
```bash
curl -X POST "http://localhost:3001/api/notifications" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "info",
    "message": "اختبار إشعار جديد",
    "channel": "IN_APP"
  }'
```

**من المتصفح (Console):**
```javascript
fetch('http://localhost:3001/api/notifications', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'info',
    message: 'اختبار إشعار جديد',
    channel: 'IN_APP'
  })
})
.then(r => r.json())
.then(console.log);
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "message": "Notification created successfully",
  "data": {
    "id": 1,
    "type": "info",
    "message": "اختبار إشعار جديد",
    "channel": "IN_APP",
    "isRead": false,
    "userId": 2,
    "createdAt": "2025-11-14T..."
  }
}
```

**💡 ملاحظة:** احفظ `id` من النتيجة للاختبارات التالية!

---

### 4. GET /api/notifications/:id

**الوصف:** جلب إشعار محدد

**الطريقة:**
```bash
curl -X GET "http://localhost:3001/api/notifications/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**من المتصفح (Console):**
```javascript
const notificationId = 1; // استخدم ID من الاختبار السابق
fetch(`http://localhost:3001/api/notifications/${notificationId}`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(console.log);
```

---

### 5. PUT /api/notifications/:id

**الوصف:** تحديث إشعار

**الطريقة:**
```bash
curl -X PUT "http://localhost:3001/api/notifications/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "تم التحديث",
    "isRead": false
  }'
```

**من المتصفح (Console):**
```javascript
const notificationId = 1;
fetch(`http://localhost:3001/api/notifications/${notificationId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'تم التحديث',
    isRead: false
  })
})
.then(r => r.json())
.then(console.log);
```

---

### 6. PATCH /api/notifications/:id/read

**الوصف:** تعليم إشعار كمقروء

**الطريقة:**
```bash
curl -X PATCH "http://localhost:3001/api/notifications/1/read" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**من المتصفح (Console):**
```javascript
const notificationId = 1;
fetch(`http://localhost:3001/api/notifications/${notificationId}/read`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(console.log);
```

---

### 7. PATCH /api/notifications/read/all

**الوصف:** تعليم جميع الإشعارات كمقروءة

**الطريقة:**
```bash
curl -X PATCH "http://localhost:3001/api/notifications/read/all" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**من المتصفح (Console):**
```javascript
fetch('http://localhost:3001/api/notifications/read/all', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(console.log);
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "message": "Marked 5 notifications as read",
  "count": 5
}
```

---

### 8. DELETE /api/notifications/:id

**الوصف:** حذف إشعار

**الطريقة:**
```bash
curl -X DELETE "http://localhost:3001/api/notifications/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**من المتصفح (Console):**
```javascript
const notificationId = 1;
fetch(`http://localhost:3001/api/notifications/${notificationId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(console.log);
```

---

## 🔒 اختبارات Security

### 1. Unauthorized Access (بدون token)

```bash
curl -X GET "http://localhost:3001/api/notifications" \
  -H "Content-Type: application/json"
```

**النتيجة المتوقعة:**
```json
{
  "message": "No token, authorization denied"
}
```
**Status:** 401 Unauthorized

### 2. Access Non-existent Notification

```bash
curl -X GET "http://localhost:3001/api/notifications/99999" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**النتيجة المتوقعة:**
```json
{
  "success": false,
  "message": "Notification not found"
}
```
**Status:** 404 Not Found

---

## 📊 جدول الاختبار الشامل

| # | Test Case | Method | Endpoint | Expected Status | Expected Result |
|---|-----------|--------|----------|-----------------|-----------------|
| 1 | Get unread count | GET | `/api/notifications/unread/count` | 200 | `{success: true, count: number}` |
| 2 | Get all notifications | GET | `/api/notifications?page=1&limit=10` | 200 | `{success: true, data: [], pagination: {...}}` |
| 3 | Get notifications (filter: unread) | GET | `/api/notifications?isRead=false` | 200 | `{success: true, data: []}` |
| 4 | Get notifications (filter: type) | GET | `/api/notifications?type=info` | 200 | `{success: true, data: []}` |
| 5 | Create notification | POST | `/api/notifications` | 201 | `{success: true, data: {id, ...}}` |
| 6 | Get notification by ID | GET | `/api/notifications/:id` | 200 | `{success: true, data: {...}}` |
| 7 | Update notification | PUT | `/api/notifications/:id` | 200 | `{success: true, data: {...}}` |
| 8 | Mark as read | PATCH | `/api/notifications/:id/read` | 200 | `{success: true}` |
| 9 | Mark all as read | PATCH | `/api/notifications/read/all` | 200 | `{success: true, count: number}` |
| 10 | Delete notification | DELETE | `/api/notifications/:id` | 200 | `{success: true}` |
| 11 | Unauthorized access | GET | `/api/notifications` (no token) | 401 | `{message: "No token..."}` |
| 12 | Non-existent notification | GET | `/api/notifications/99999` | 404 | `{success: false, message: "..."}` |

---

## 🛠️ استخدام Postman

### 1. إنشاء Collection جديد
- اسم: "Notifications API Tests"

### 2. إضافة Environment
- اسم: "FixZone Local"
- Variables:
  - `base_url`: `http://localhost:3001`
  - `token`: (سيتم تعيينه بعد تسجيل الدخول)

### 3. تسجيل الدخول أولاً
- **Request:** POST `/api/auth/login`
- **Body:**
```json
{
  "loginIdentifier": "ahmed",
  "password": "ahmed"
}
```
- **Tests (Postman):**
```javascript
if (pm.response.code === 200) {
  const jsonData = pm.response.json();
  pm.environment.set("token", jsonData.token || jsonData.data.token);
}
```

### 4. إضافة جميع المسارات
- استخدم `{{base_url}}` و `{{token}}` في المسارات
- مثال: `{{base_url}}/api/notifications`
- Header: `Authorization: Bearer {{token}}`

---

## ✅ Checklist للاختبار

- [ ] GET /api/notifications/unread/count
- [ ] GET /api/notifications (بدون filters)
- [ ] GET /api/notifications (مع pagination)
- [ ] GET /api/notifications (مع filter: isRead)
- [ ] GET /api/notifications (مع filter: type)
- [ ] GET /api/notifications (مع filter: channel)
- [ ] POST /api/notifications
- [ ] GET /api/notifications/:id
- [ ] PUT /api/notifications/:id
- [ ] PATCH /api/notifications/:id/read
- [ ] PATCH /api/notifications/read/all
- [ ] DELETE /api/notifications/:id
- [ ] Security: Unauthorized access (401)
- [ ] Security: Non-existent notification (404)
- [ ] Security: Access other user's notification (404)

---

## 💡 نصائح

1. **استخدم Browser Console** للاختبار السريع
2. **استخدم Postman** للاختبار الشامل والمنظم
3. **احفظ Token** بعد تسجيل الدخول
4. **احفظ Notification ID** بعد الإنشاء للاختبارات التالية
5. **تحقق من Status Code** و Response Format
6. **اختبر Error Cases** أيضاً (401, 404, 400)

---

**الحالة:** ✅ جاهز للاستخدام  
**آخر تحديث:** 2025-11-14

