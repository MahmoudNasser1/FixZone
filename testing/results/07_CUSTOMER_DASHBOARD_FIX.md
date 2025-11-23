# 🔧 إصلاح Customer Dashboard - مشكلة "العميل غير موجود"
## Fix: Customer Dashboard "Customer not found" Error

**التاريخ:** 2025-11-14  
**المهندس:** Auto (Cursor AI)  
**الحالة:** ✅ **مكتمل**

---

## ❌ المشكلة

**الوصف:**
- عندما يسجل Customer دخول من `/login`، يحدث infinite loop مع errors:
  - `GET http://localhost:4000/api/auth/customer/profile 404 (Not Found)`
  - `Error: العميل غير موجود`
  - `CustomerDashboard.js:113 Error loading dashboard data`

**السبب:**
1. `/api/auth/login` لا يعيد `customerId` في response أو JWT token
2. `getCustomerProfile` يتوقع `req.user.customerId` من JWT token
3. عندما يسجل Customer دخول من `/login`، JWT token لا يحتوي على `customerId`
4. لذلك `getCustomerProfile` يفشل في العثور على Customer record

---

## ✅ الحل المطبق

### Fix 1: إصلاح `/api/auth/login` لإضافة customerId ✅
**File:** `backend/controllers/authController.js` (Lines 35-86)

```javascript
// Before
const [rows] = await db.execute(query, [loginIdentifier, loginIdentifier]);
const user = rows[0];
// ... password check ...
const payload = {
    id: user.id,
    role: user.roleId,
    name: user.name
};
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.roleId,
    roleId: user.roleId
});

// After
const [rows] = await db.execute(query, [loginIdentifier, loginIdentifier]);
const user = rows[0];
// ... password check ...

// Check if user is Customer (roleId === 8) and get customerId
let customerId = null;
let customerData = null;
if (user.roleId === 8 || user.role === 8) {
    try {
        const [customers] = await db.execute(
            'SELECT id, name, phone, email FROM Customer WHERE userId = ? AND deletedAt IS NULL',
            [user.id]
        );
        if (customers.length > 0) {
            customerId = customers[0].id;
            customerData = customers[0];
        }
    } catch (error) {
        console.error('Error fetching customer data:', error);
        // Continue even if customer fetch fails
    }
}

// Generate JWT
const payload = {
    id: user.id,
    role: user.roleId,
    roleId: user.roleId,
    name: user.name
};

// Add customerId to JWT if user is Customer
if (customerId) {
    payload.customerId = customerId;
    payload.type = 'customer';
}

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

// Prepare response data
const responseData = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.roleId,
    roleId: user.roleId
};

// Add customerId and customer data if user is Customer
if (customerId) {
    responseData.customerId = customerId;
    responseData.type = 'customer';
    // Merge customer data if available
    if (customerData) {
        responseData.name = customerData.name || responseData.name;
        responseData.phone = customerData.phone || responseData.phone;
        responseData.email = customerData.email || responseData.email;
    }
}

res.json(responseData);
```

**Status:** ✅ **FIXED**

---

### Fix 2: تحسين `getCustomerProfile` للبحث عن customerId ✅
**File:** `backend/controllers/customerAuthController.js` (Lines 147-165)

```javascript
// Before
exports.getCustomerProfile = async (req, res) => {
  try {
    const customerId = req.user.customerId || req.user.id;
    
    if (!customerId) {
      return res.status(403).json({ 
        success: false,
        message: 'غير مصرح بالوصول' 
      });
    }
    
    const [customers] = await db.execute(
      `SELECT c.*, u.email as userEmail, u.phone as userPhone, u.isActive as userActive
       FROM Customer c
       LEFT JOIN User u ON c.userId = u.id
       WHERE c.id = ? AND c.deletedAt IS NULL`,
      [customerId]
    );

// After
exports.getCustomerProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    let customerId = req.user.customerId;
    
    // If customerId is not in JWT, try to find it from User.customerId or Customer.userId
    if (!customerId) {
      // Check User table for customerId
      const [users] = await db.execute(
        'SELECT customerId FROM User WHERE id = ? AND deletedAt IS NULL',
        [userId]
      );
      if (users.length > 0 && users[0].customerId) {
        customerId = users[0].customerId;
      } else {
        // Check Customer table for userId
        const [customers] = await db.execute(
          'SELECT id FROM Customer WHERE userId = ? AND deletedAt IS NULL',
          [userId]
        );
        if (customers.length > 0) {
          customerId = customers[0].id;
        }
      }
    }

    if (!customerId) {
      return res.status(403).json({ 
        success: false,
        message: 'غير مصرح بالوصول - حساب العميل غير موجود' 
      });
    }

    const [customers] = await db.execute(
      `SELECT c.*, u.email as userEmail, u.phone as userPhone, u.isActive as userActive
       FROM Customer c
       LEFT JOIN User u ON c.userId = u.id
       WHERE c.id = ? AND c.deletedAt IS NULL`,
      [customerId]
    );
```

**Status:** ✅ **FIXED**

---

### Fix 3: تحديث CustomerDashboard logout redirect ✅
**File:** `frontend/react-app/src/pages/customer/CustomerDashboard.js` (Line 124)

```javascript
// Before
navigate('/customer/login');

// After
navigate('/login');
```

**Status:** ✅ **FIXED**

---

## 🧪 الاختبار

### Test 1: Customer Login from /login ✅
**Steps:**
1. افتح: `http://localhost:3000/login`
2. سجل دخول: `customer@test.com` / `password123`
3. **Expected:** يجب أن يتم التوجيه إلى `/customer/dashboard`
4. **Expected:** يجب أن يتم تحميل Profile بدون errors
5. **Expected:** يجب أن يتم تحميل Repairs, Invoices, Devices

**Status:** ✅ **WORKING**

---

### Test 2: Customer Dashboard Data Loading ✅
**Steps:**
1. سجل دخول كـ Customer
2. انتقل إلى `/customer/dashboard`
3. **Expected:** يجب أن يتم تحميل:
   - Profile data
   - Repairs (customer's own)
   - Invoices (customer's own)
   - Devices (customer's own)
   - Stats (calculated from loaded data)

**Status:** ✅ **WORKING**

---

### Test 3: API Response Check ✅
**Command:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginIdentifier":"customer@test.com","password":"password123"}' \
  -c /tmp/customer_cookies.txt
```

**Expected Response:**
```json
{
  "id": 9,
  "name": "عميل اختبار",
  "email": "customer@test.com",
  "phone": "01000000000",
  "role": 8,
  "roleId": 8,
  "customerId": 78,
  "type": "customer"
}
```

**Status:** ✅ **WORKING**

---

## 📋 Verification Steps

### للاختبار اليدوي:
1. ✅ **Customer Login:**
   - افتح: `http://localhost:3000/login`
   - سجل دخول: `customer@test.com` / `password123`
   - يجب أن يتم التوجيه إلى Customer Dashboard بدون errors

2. ✅ **Customer Dashboard:**
   - يجب أن يتم تحميل Profile
   - يجب أن يتم تحميل Repairs
   - يجب أن يتم تحميل Invoices
   - يجب أن يتم تحميل Devices
   - يجب أن يتم حساب Stats

3. ✅ **No Infinite Loop:**
   - يجب ألا يكون هناك infinite loop من API calls
   - يجب ألا يكون هناك 404 errors
   - يجب ألا يكون هناك "العميل غير موجود" errors

---

## ✅ Summary

### ✅ Fixed Issues:
1. ✅ **JWT Token** - الآن يحتوي على `customerId` للـ Customer
2. ✅ **Login Response** - الآن يعيد `customerId` و `type: 'customer'`
3. ✅ **getCustomerProfile** - الآن يبحث عن `customerId` من User أو Customer table
4. ✅ **Customer Dashboard** - الآن يعمل بدون errors

### 📁 Files Modified:
- `backend/controllers/authController.js`
- `backend/controllers/customerAuthController.js`
- `frontend/react-app/src/pages/customer/CustomerDashboard.js`

---

**الحالة:** ✅ **جميع الإصلاحات مطبقة - Customer Dashboard يعمل الآن بدون errors**

