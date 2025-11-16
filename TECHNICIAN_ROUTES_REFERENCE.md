# 🔧 Technician Portal - Routes Reference

## Frontend Routes

### Public Routes (خارج الحماية)
```
/login                          - تسجيل الدخول (موحد للجميع)
```

### Technician Protected Routes (محمية بـ TechnicianRoute)
```
/tech/dashboard                 - Dashboard الرئيسي
/tech/jobs                      - قائمة الأجهزة
/tech/jobs/:id                  - تفاصيل جهاز محدد
/tech/profile                   - الملف الشخصي (قريباً)
```

### Redirect Logic
```javascript
// إذا كان المستخدم فني (roleId = 3):
'/' → '/tech/dashboard'                    // Redirect to tech dashboard
'/admin/*' → '/tech/dashboard'             // Block admin routes
'/customer/*' → '/tech/dashboard'          // Block customer routes

// إذا كان المستخدم عميل (roleId = 8):
'/' → '/customer/dashboard'                // Redirect to customer dashboard
'/tech/*' → '/customer/dashboard'          // Block tech routes

// إذا كان المستخدم أدمن أو موظف:
'/' → '/dashboard'                         // Main dashboard
'/tech/*' → '/'                            // Block tech routes
'/customer/*' → '/'                        // Block customer routes
```

---

## Backend API Routes

### Base URL
```
http://localhost:3001/api/tech
```

### Endpoints

#### 1. Dashboard Stats
```http
GET /api/tech/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalJobs": 15,
    "byStatus": [
      { "status": "UNDER_REPAIR", "cnt": 5 },
      { "status": "WAITING_PARTS", "cnt": 2 }
    ],
    "todayUpdated": 3
  }
}
```

---

#### 2. Get Jobs List
```http
GET /api/tech/jobs?status=UNDER_REPAIR&search=Dell
```

**Query Params:**
- `status` (optional): Filter by status
- `search` (optional): Search term

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 75,
      "requestNumber": 75,
      "status": "UNDER_REPAIR",
      "reportedProblem": "شاشة مكسورة",
      "createdAt": "2025-10-27T10:20:00.000Z",
      "customerId": 12,
      "customerName": "أحمد سمير",
      "customerPhone": "01000000000",
      "deviceBrand": "Dell",
      "deviceModel": "Latitude 5480",
      "deviceType": "LAPTOP"
    }
  ],
  "count": 1
}
```

---

#### 3. Get Job Details
```http
GET /api/tech/jobs/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job": {
      "id": 75,
      "requestNumber": 75,
      "status": "UNDER_REPAIR",
      "reportedProblem": "شاشة مكسورة",
      "customerId": 12,
      "customerName": "أحمد سمير",
      "customerPhone": "01000000000",
      "customerEmail": "ahmed@example.com",
      "deviceBrand": "Dell",
      "deviceModel": "Latitude 5480",
      "deviceType": "LAPTOP",
      "serialNumber": "ABC123",
      "createdAt": "2025-10-27T10:20:00.000Z"
    },
    "timeline": [
      {
        "id": "status-1",
        "type": "status_change",
        "content": "PENDING → UNDER_REPAIR",
        "author": "User #5",
        "createdAt": "2025-10-27T11:00:00.000Z"
      },
      {
        "id": "audit-2",
        "type": "NOTE",
        "content": "تم تغيير الشاشة",
        "author": "User #5",
        "createdAt": "2025-10-27T14:30:00.000Z"
      }
    ]
  }
}
```

---

#### 4. Update Job Status
```http
PUT /api/tech/jobs/:id/status
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "READY",
  "notes": "تم الإصلاح والجهاز جاهز للتسليم"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Status updated successfully",
  "data": {
    "fromStatus": "UNDER_REPAIR",
    "toStatus": "READY"
  }
}
```

---

#### 5. Add Note to Timeline
```http
POST /api/tech/jobs/:id/notes
Content-Type: application/json
```

**Request Body:**
```json
{
  "note": "تم اختبار الجهاز ويعمل بشكل ممتاز"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Note added successfully"
}
```

---

## Status Values

```javascript
const VALID_STATUSES = [
  'PENDING',              // قيد الانتظار
  'UNDER_DIAGNOSIS',      // جاري الفحص
  'UNDER_REPAIR',         // قيد الإصلاح
  'WAITING_PARTS',        // بانتظار قطع غيار
  'WAITING_CUSTOMER',     // بانتظار العميل
  'READY',                // جاهز للتسليم
  'COMPLETED',            // مكتمل
  'CANCELLED'             // ملغي
];
```

---

## Permissions Required

```javascript
// على كل endpoint:
'repairs.view_own'          // عرض الأجهزة الخاصة بالفني
'repairs.update_own'        // تحديث الأجهزة
'repairs.timeline_update'   // إضافة ملاحظات
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Permission denied"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Repair request not found or not assigned to this technician"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Status is required"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Server Error: Failed to fetch technician dashboard",
  "error": "Error details (development only)"
}
```

---

## Authentication

جميع endpoints محمية بـ:
1. `authMiddleware` - التحقق من JWT token
2. `permissionMiddleware` - التحقق من الصلاحيات

**Headers Required:**
```
Cookie: token=<JWT_TOKEN>
```

---

## Testing

### Using Postman/Insomnia:

1. Login first:
```http
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "technician@fixzone.com",
  "password": "password123"
}
```

2. Copy JWT token from cookie

3. Test endpoints:
```http
GET http://localhost:3001/api/tech/dashboard
Cookie: token=<JWT_TOKEN>
```

### Using Frontend:

1. Navigate to `http://localhost:3000/login`
2. Login with technician account (roleId = 3)
3. Will redirect to `/tech/dashboard`
4. Use the UI to test all features

---

**Last Updated:** 2025-11-16  
**Status:** ✅ Complete & Ready


