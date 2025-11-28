# خطة تطوير API - بورتال العملاء

## 1. نظرة عامة

هذا المستند يغطي جميع جوانب تطوير API لبورتال العملاء، بما في ذلك Endpoints، Request/Response Formats، Documentation، Versioning، و Best Practices.

## 2. API Structure

### 2.1 Base URL

```
Production: https://api.fixzzone.com/api/customer
Staging: https://staging-api.fixzzone.com/api/customer
Development: http://localhost:3000/api/customer
```

### 2.2 API Versioning

```
/api/customer/v1/...
/api/customer/v2/...
```

**الملف**: `backend/routes/customer/index.js`

```javascript
const express = require('express');
const router = express.Router();

// Version 1
const v1Router = require('./v1');
router.use('/v1', v1Router);

// Version 2 (Future)
// const v2Router = require('./v2');
// router.use('/v2', v2Router);

// Default to v1
router.use('/', v1Router);

module.exports = router;
```

## 3. API Endpoints

### 3.1 Authentication Endpoints

#### POST /api/customer/auth/login
**Description**: تسجيل دخول العميل

**Request Body**:
```json
{
  "loginIdentifier": "01012345678", // Phone or Email
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "customerId": 456,
      "name": "أحمد محمد",
      "email": "ahmed@example.com",
      "phone": "01012345678",
      "roleId": 6
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses**:
- `401 Unauthorized`: بيانات الدخول غير صحيحة
- `403 Forbidden`: الحساب غير مفعّل
- `429 Too Many Requests`: تم تجاوز الحد المسموح

---

#### POST /api/customer/auth/logout
**Description**: تسجيل خروج العميل

**Response** (200 OK):
```json
{
  "success": true,
  "message": "تم تسجيل الخروج بنجاح"
}
```

---

#### POST /api/customer/auth/refresh
**Description**: تحديث Token

**Request Body**:
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "refreshToken": "new_refresh_token"
  }
}
```

---

#### POST /api/customer/auth/forgot-password
**Description**: طلب إعادة تعيين كلمة المرور

**Request Body**:
```json
{
  "loginIdentifier": "01012345678"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "إذا كان الحساب موجوداً، سيتم إرسال رمز التحقق"
}
```

---

#### POST /api/customer/auth/reset-password
**Description**: إعادة تعيين كلمة المرور

**Request Body**:
```json
{
  "token": "reset_token",
  "newPassword": "new_password123",
  "confirmPassword": "new_password123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "تم تغيير كلمة المرور بنجاح"
}
```

---

### 3.2 Dashboard Endpoints

#### GET /api/customer/dashboard/stats
**Description**: جلب إحصائيات لوحة التحكم

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "repairs": {
      "total": 25,
      "active": 3,
      "completed": 20,
      "pending": 2
    },
    "invoices": {
      "total": 15,
      "paid": 12,
      "pending": 3,
      "overdue": 0,
      "totalAmount": 5000.00,
      "paidAmount": 4000.00,
      "pendingAmount": 1000.00
    },
    "devices": {
      "total": 5
    },
    "notifications": {
      "unread": 3
    }
  }
}
```

---

#### GET /api/customer/dashboard/recent-repairs
**Description**: جلب آخر طلبات الإصلاح

**Query Parameters**:
- `limit` (optional, default: 5): عدد النتائج

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "deviceName": "لابتوب Dell",
      "issue": "مشكلة في الشاشة",
      "status": "in_progress",
      "createdAt": "2024-11-20T10:00:00Z",
      "updatedAt": "2024-11-27T15:30:00Z"
    }
  ]
}
```

---

#### GET /api/customer/dashboard/recent-invoices
**Description**: جلب آخر الفواتير

**Query Parameters**:
- `limit` (optional, default: 5): عدد النتائج

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "invoiceNumber": "INV-2024-001",
      "totalAmount": 500.00,
      "amountPaid": 500.00,
      "status": "paid",
      "createdAt": "2024-11-25T10:00:00Z",
      "dueDate": "2024-12-25T10:00:00Z"
    }
  ]
}
```

---

### 3.3 Repairs Endpoints

#### GET /api/customer/repairs
**Description**: جلب قائمة طلبات الإصلاح

**Query Parameters**:
- `page` (optional, default: 1): رقم الصفحة
- `limit` (optional, default: 20): عدد النتائج في الصفحة
- `status` (optional): تصفية حسب الحالة (pending, in_progress, completed, cancelled)
- `sortBy` (optional, default: createdAt): ترتيب حسب (createdAt, updatedAt, status)
- `sortDir` (optional, default: DESC): اتجاه الترتيب (ASC, DESC)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "deviceName": "لابتوب Dell",
      "deviceModel": "Inspiron 15",
      "issue": "مشكلة في الشاشة",
      "status": "in_progress",
      "estimatedCost": 500.00,
      "estimatedCompletion": "2024-12-01T10:00:00Z",
      "createdAt": "2024-11-20T10:00:00Z",
      "updatedAt": "2024-11-27T15:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "totalPages": 2
  }
}
```

---

#### GET /api/customer/repairs/:id
**Description**: جلب تفاصيل طلب إصلاح

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 123,
    "deviceName": "لابتوب Dell",
    "deviceModel": "Inspiron 15",
    "serialNumber": "SN123456",
    "issue": "مشكلة في الشاشة",
    "description": "الشاشة لا تعمل بشكل صحيح",
    "status": "in_progress",
    "estimatedCost": 500.00,
    "actualCost": null,
    "estimatedCompletion": "2024-12-01T10:00:00Z",
    "completedAt": null,
    "technician": {
      "id": 10,
      "name": "محمد أحمد"
    },
    "branch": {
      "id": 1,
      "name": "فرع القاهرة"
    },
    "timeline": [
      {
        "id": 1,
        "status": "pending",
        "note": "تم استلام الطلب",
        "createdAt": "2024-11-20T10:00:00Z",
        "createdBy": "System"
      },
      {
        "id": 2,
        "status": "in_progress",
        "note": "بدء العمل على الإصلاح",
        "createdAt": "2024-11-21T09:00:00Z",
        "createdBy": "محمد أحمد"
      }
    ],
    "comments": [
      {
        "id": 1,
        "comment": "متى سيكتمل الإصلاح؟",
        "type": "customer",
        "createdAt": "2024-11-22T14:00:00Z"
      }
    ],
    "attachments": [
      {
        "id": 1,
        "fileName": "image1.jpg",
        "fileUrl": "https://...",
        "fileType": "image",
        "createdAt": "2024-11-20T10:00:00Z"
      }
    ],
    "createdAt": "2024-11-20T10:00:00Z",
    "updatedAt": "2024-11-27T15:30:00Z"
  }
}
```

**Error Responses**:
- `404 Not Found`: طلب الإصلاح غير موجود
- `403 Forbidden`: لا يمكنك الوصول لهذا الطلب

---

#### POST /api/customer/repairs/:id/comments
**Description**: إضافة تعليق على طلب إصلاح

**Request Body**:
```json
{
  "comment": "متى سيكتمل الإصلاح؟"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 2,
    "repairId": 123,
    "comment": "متى سيكتمل الإصلاح؟",
    "type": "customer",
    "createdAt": "2024-11-27T16:00:00Z"
  },
  "message": "تم إضافة التعليق بنجاح"
}
```

---

#### POST /api/customer/repairs/:id/request-update
**Description**: طلب تحديث حالة طلب الإصلاح

**Request Body**:
```json
{
  "message": "أريد معرفة حالة الإصلاح"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "تم إرسال طلب التحديث بنجاح"
}
```

---

#### GET /api/customer/repairs/:id/timeline
**Description**: جلب Timeline لطلب الإصلاح

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "status": "pending",
      "note": "تم استلام الطلب",
      "createdAt": "2024-11-20T10:00:00Z",
      "createdBy": "System"
    },
    {
      "id": 2,
      "status": "in_progress",
      "note": "بدء العمل على الإصلاح",
      "createdAt": "2024-11-21T09:00:00Z",
      "createdBy": "محمد أحمد"
    }
  ]
}
```

---

### 3.4 Invoices Endpoints

#### GET /api/customer/invoices
**Description**: جلب قائمة الفواتير

**Query Parameters**:
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `status` (optional): paid, pending, overdue
- `sortBy` (optional, default: createdAt)
- `sortDir` (optional, default: DESC)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "invoiceNumber": "INV-2024-001",
      "totalAmount": 500.00,
      "amountPaid": 500.00,
      "status": "paid",
      "createdAt": "2024-11-25T10:00:00Z",
      "dueDate": "2024-12-25T10:00:00Z",
      "paidAt": "2024-11-26T14:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

---

#### GET /api/customer/invoices/:id
**Description**: جلب تفاصيل الفاتورة

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 456,
    "invoiceNumber": "INV-2024-001",
    "totalAmount": 500.00,
    "amountPaid": 500.00,
    "status": "paid",
    "items": [
      {
        "id": 1,
        "description": "إصلاح الشاشة",
        "quantity": 1,
        "unitPrice": 500.00,
        "total": 500.00
      }
    ],
    "payments": [
      {
        "id": 1,
        "amount": 500.00,
        "method": "cash",
        "paidAt": "2024-11-26T14:00:00Z"
      }
    ],
    "createdAt": "2024-11-25T10:00:00Z",
    "dueDate": "2024-12-25T10:00:00Z",
    "paidAt": "2024-11-26T14:00:00Z"
  }
}
```

---

#### GET /api/customer/invoices/:id/pdf
**Description**: تحميل الفاتورة كـ PDF

**Response**: PDF File

---

#### POST /api/customer/invoices/:id/pay
**Description**: دفع الفاتورة

**Request Body**:
```json
{
  "amount": 500.00,
  "paymentMethod": "online", // online, cash, bank_transfer
  "paymentGateway": "stripe", // stripe, paymob, etc.
  "cardToken": "token_here" // For online payments
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "paymentId": 789,
    "invoiceId": 456,
    "amount": 500.00,
    "status": "completed",
    "transactionId": "txn_123456",
    "paidAt": "2024-11-27T16:00:00Z"
  },
  "message": "تم الدفع بنجاح"
}
```

---

### 3.5 Devices Endpoints

#### GET /api/customer/devices
**Description**: جلب قائمة الأجهزة

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "لابتوب Dell",
      "model": "Inspiron 15",
      "serialNumber": "SN123456",
      "brand": "Dell",
      "type": "laptop",
      "purchaseDate": "2023-01-15",
      "repairCount": 2,
      "lastRepairDate": "2024-11-20T10:00:00Z",
      "createdAt": "2023-01-15T10:00:00Z"
    }
  ]
}
```

---

#### POST /api/customer/devices
**Description**: إضافة جهاز جديد

**Request Body**:
```json
{
  "name": "لابتوب Dell",
  "model": "Inspiron 15",
  "serialNumber": "SN123456",
  "brand": "Dell",
  "type": "laptop",
  "purchaseDate": "2023-01-15"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "لابتوب Dell",
    "model": "Inspiron 15",
    "serialNumber": "SN123456",
    "brand": "Dell",
    "type": "laptop",
    "purchaseDate": "2023-01-15",
    "createdAt": "2024-11-27T16:00:00Z"
  },
  "message": "تم إضافة الجهاز بنجاح"
}
```

---

#### PUT /api/customer/devices/:id
**Description**: تحديث بيانات الجهاز

**Request Body**:
```json
{
  "name": "لابتوب Dell - محدث",
  "model": "Inspiron 15",
  "serialNumber": "SN123456"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "لابتوب Dell - محدث",
    "model": "Inspiron 15",
    "serialNumber": "SN123456",
    "updatedAt": "2024-11-27T16:00:00Z"
  },
  "message": "تم تحديث الجهاز بنجاح"
}
```

---

#### DELETE /api/customer/devices/:id
**Description**: حذف جهاز

**Response** (200 OK):
```json
{
  "success": true,
  "message": "تم حذف الجهاز بنجاح"
}
```

---

#### GET /api/customer/devices/:id/repairs
**Description**: جلب تاريخ الإصلاحات للجهاز

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "issue": "مشكلة في الشاشة",
      "status": "completed",
      "cost": 500.00,
      "completedAt": "2024-11-25T10:00:00Z"
    }
  ]
}
```

---

### 3.6 Notifications Endpoints

#### GET /api/customer/notifications
**Description**: جلب الإشعارات

**Query Parameters**:
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `unreadOnly` (optional, default: false)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "تم تحديث حالة طلب الإصلاح",
      "message": "تم تحديث حالة طلب الإصلاح #123 إلى 'قيد التنفيذ'",
      "type": "repair_update",
      "isRead": false,
      "relatedId": 123,
      "relatedType": "repair",
      "createdAt": "2024-11-27T15:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1
  },
  "unreadCount": 3
}
```

---

#### GET /api/customer/notifications/unread-count
**Description**: جلب عدد الإشعارات غير المقروءة

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "unreadCount": 3
  }
}
```

---

#### PUT /api/customer/notifications/:id/read
**Description**: تحديد الإشعار كمقروء

**Response** (200 OK):
```json
{
  "success": true,
  "message": "تم تحديد الإشعار كمقروء"
}
```

---

#### PUT /api/customer/notifications/read-all
**Description**: تحديد جميع الإشعارات كمقروءة

**Response** (200 OK):
```json
{
  "success": true,
  "message": "تم تحديد جميع الإشعارات كمقروءة"
}
```

---

#### DELETE /api/customer/notifications/:id
**Description**: حذف إشعار

**Response** (200 OK):
```json
{
  "success": true,
  "message": "تم حذف الإشعار بنجاح"
}
```

---

### 3.7 Profile Endpoints

#### GET /api/customer/profile
**Description**: جلب بيانات الملف الشخصي

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 456,
    "name": "أحمد محمد",
    "email": "ahmed@example.com",
    "phone": "01012345678",
    "address": "القاهرة، مصر",
    "createdAt": "2023-01-01T10:00:00Z",
    "updatedAt": "2024-11-27T16:00:00Z"
  }
}
```

---

#### PUT /api/customer/profile
**Description**: تحديث بيانات الملف الشخصي

**Request Body**:
```json
{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "phone": "01012345678",
  "address": "القاهرة، مصر"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 456,
    "name": "أحمد محمد",
    "email": "ahmed@example.com",
    "phone": "01012345678",
    "address": "القاهرة، مصر",
    "updatedAt": "2024-11-27T16:00:00Z"
  },
  "message": "تم تحديث البيانات بنجاح"
}
```

---

#### POST /api/customer/profile/change-password
**Description**: تغيير كلمة المرور

**Request Body**:
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password123",
  "confirmPassword": "new_password123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "تم تغيير كلمة المرور بنجاح"
}
```

---

## 4. Request/Response Standards

### 4.1 Request Headers

```
Authorization: Bearer <token>
Content-Type: application/json
Accept: application/json
X-Request-ID: <unique_request_id>
```

### 4.2 Response Format

**Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "meta": {
    "requestId": "req_123456",
    "timestamp": "2024-11-27T16:00:00Z"
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "meta": {
    "requestId": "req_123456",
    "timestamp": "2024-11-27T16:00:00Z"
  }
}
```

### 4.3 HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created
- `400 Bad Request`: Invalid request
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## 5. API Documentation

### 5.1 Swagger/OpenAPI

**الملف**: `backend/docs/customer-api.yaml`

```yaml
openapi: 3.0.0
info:
  title: Customer Portal API
  version: 1.0.0
  description: API documentation for Customer Portal

paths:
  /api/customer/auth/login:
    post:
      summary: Customer login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                loginIdentifier:
                  type: string
                password:
                  type: string
      responses:
        '200':
          description: Success
```

### 5.2 Postman Collection

إنشاء Postman Collection مع جميع Endpoints للاختبار.

## 6. Rate Limiting

### 6.1 Limits

- **Authentication**: 5 requests per 15 minutes per IP
- **General API**: 100 requests per 15 minutes per customer
- **File Upload**: 10 requests per hour per customer

### 6.2 Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701100800
```

## 7. Security

### 7.1 Authentication

- JWT Tokens
- HTTP-only Cookies
- Token Expiration: 7 days
- Refresh Tokens: 30 days

### 7.2 CORS

```javascript
const corsOptions = {
  origin: process.env.CUSTOMER_PORTAL_URL,
  credentials: true,
  optionsSuccessStatus: 200
};
```

### 7.3 Input Validation

- Use validation middleware
- Sanitize all inputs
- Validate file uploads
- Check file sizes

## 8. Monitoring & Logging

### 8.1 Request Logging

```javascript
// Log all API requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${req.ip}`);
  next();
});
```

### 8.2 Error Logging

```javascript
// Log errors with context
logger.error('API Error', {
  endpoint: req.path,
  method: req.method,
  error: err.message,
  stack: err.stack,
  customerId: req.user?.customerId
});
```

### 8.3 Metrics

- Request count
- Response time
- Error rate
- Active users

## 9. Testing

### 9.1 Unit Tests

```javascript
describe('Customer API', () => {
  test('POST /api/customer/auth/login', async () => {
    const response = await request(app)
      .post('/api/customer/auth/login')
      .send({
        loginIdentifier: '01012345678',
        password: 'password123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### 9.2 Integration Tests

```javascript
describe('Customer Repairs API', () => {
  test('GET /api/customer/repairs', async () => {
    const token = await getCustomerToken();
    const response = await request(app)
      .get('/api/customer/repairs')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## 10. Checklist

### 10.1 Endpoints
- [ ] Authentication Endpoints
- [ ] Dashboard Endpoints
- [ ] Repairs Endpoints
- [ ] Invoices Endpoints
- [ ] Devices Endpoints
- [ ] Notifications Endpoints
- [ ] Profile Endpoints
- [ ] Payments Endpoints

### 10.2 Documentation
- [ ] OpenAPI/Swagger Documentation
- [ ] Postman Collection
- [ ] API Usage Examples
- [ ] Error Codes Documentation

### 10.3 Security
- [ ] Authentication
- [ ] Authorization
- [ ] Rate Limiting
- [ ] Input Validation
- [ ] CORS Configuration

### 10.4 Testing
- [ ] Unit Tests
- [ ] Integration Tests
- [ ] E2E Tests
- [ ] Load Tests

---

**الملف التالي**: [الربط مع الموديولات الأخرى](./05_INTEGRATION_WITH_MODULES.md)


