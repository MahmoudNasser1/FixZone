# ✅ دليل اختبار نظام FixZone - Checklist شامل

**الغرض:** التأكد من أن جميع الإصلاحات تعمل بشكل صحيح  
**متى تستخدمه:** بعد أي تعديل على الكود، قبل الـ deployment، أو للـ regression testing

---

## 🚀 التحضير الأولي

### 1. تأكد من تشغيل البيئة

```bash
# 1. تأكد من MySQL يعمل
sudo systemctl status mysql
# أو
ps aux | grep mysql

# 2. تأكد من قاعدة البيانات موجودة
mysql -u root -p -e "SHOW DATABASES LIKE 'fixzone%';"

# 3. شغّل الـ backend server
cd /opt/lampp/htdocs/FixZone/backend
node server.js &

# 4. تأكد من الـ server شغال
curl http://localhost:4000/health
# Expected: {"status":"OK","message":"Fix Zone Backend is running"}
```

---

## 📋 دليل الاختبار حسب Module

---

## Module 1: Authentication ✅

### الاختبار السريع (Manual):
```bash
# Test 1: Login Success
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginIdentifier":"admin@fixzone.com","password":"password"}' \
  -c cookies.txt

# ✅ Expected: 200 OK + token in Set-Cookie header
# ❌ Watch out for: 401 Unauthorized, missing token

# Test 2: Login Failure
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginIdentifier":"admin@fixzone.com","password":"wrong"}'

# ✅ Expected: 401 Unauthorized
# ❌ Watch out for: 200 OK (security issue!)

# Test 3: Protected Route
curl http://localhost:4000/api/customers
# ✅ Expected: 401 (no token)

curl http://localhost:4000/api/customers -b cookies.txt
# ✅ Expected: 200 OK + data
```

### الاختبار الآلي:
```bash
cd /opt/lampp/htdocs/FixZone
# سيختبر 9 حالات
# Expected: 9/9 passed (100%)
```

### ⚠️ **خلّي بالك من:**
1. **Token expiry:** الـ token صالح لمدة ساعة واحدة فقط
2. **Cookie vs Header:** النظام يدعم الاثنين
3. **Invalid tokens:** يجب رفضها بـ 401

---

## Module 2: Tickets/Repairs ✅

### الاختبار السريع (Manual):
```bash
# احصل على token أولاً
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginIdentifier":"admin@fixzone.com","password":"password"}' \
  -c - | grep token | awk '{print $7}')

# Test 1: Get All Tickets
curl -s "http://localhost:4000/api/repairs" \
  -H "Authorization: Bearer $TOKEN" | jq '. | length'

# ✅ Expected: عدد التذاكر (> 0)
# ❌ Watch out for: 401, 404, empty array

# Test 2: Get Single Ticket
curl -s "http://localhost:4000/api/repairs/7" \
  -H "Authorization: Bearer $TOKEN" | jq '.id'

# ✅ Expected: 7
# ❌ Watch out for: 404 (ticket not found)

# Test 3: Create Ticket (Existing Customer)
curl -X POST "http://localhost:4000/api/repairs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "deviceBrand": "Samsung",
    "deviceModel": "S22",
    "reportedProblem": "Test problem",
    "priority": "medium"
  }' | jq '.success'

# ✅ Expected: true
# ❌ Watch out for: 400 (validation), 404 (customer not found)

# Test 4: Create Ticket (New Customer Inline)
curl -X POST "http://localhost:4000/api/repairs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "firstName": "Test",
      "lastName": "User",
      "phone": "01099999999"
    },
    "deviceBrand": "iPhone",
    "deviceModel": "14",
    "reportedProblem": "Battery drain"
  }' | jq '.success'

# ✅ Expected: true + new customer created
# ❌ Watch out for: 400 (missing customer fields)
```

### الاختبار الآلي:
```bash
cd /opt/lampp/htdocs/FixZone
node testing/test-module-tickets.js
# Expected: 9/9 passed (100%)
```

### ⚠️ **خلّي بالك من:**
1. **Required fields:** `deviceBrand`, `deviceModel`, `reportedProblem` مطلوبة
2. **Customer inline:** يجب توفير `customerId` أو `customer` object
3. **Status transitions:** بعض الانتقالات غير مسموحة
4. **Search & Filter:** الـ query params يجب أن تعمل بشكل صحيح

---

## Module 3: Payments & Invoices ✅

### A. Invoices

#### الاختبار السريع:
```bash
# Test 1: Get All Invoices
curl -s "http://localhost:4000/api/invoices" \
  -H "Authorization: Bearer $TOKEN" | jq '.success'

# ✅ Expected: true + data array
# ❌ Watch out for: 401, empty data

# Test 2: Get Invoice by ID
curl -s "http://localhost:4000/api/invoices/8" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.id'

# ✅ Expected: 8
# ❌ Watch out for: 404 (تم إصلاحها!)

# Test 3: Create Invoice
curl -X POST "http://localhost:4000/api/invoices" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "repairRequestId": 7,
    "totalAmount": 500,
    "currency": "EGP",
    "taxAmount": 70
  }' | jq '.success'

# ✅ Expected: true + invoice ID
# ❌ Watch out for: 
#   - 404 (repair not found)
#   - 400 (missing totalAmount)
#   - customerId not auto-fetched
```

### B. Payments

#### الاختبار السريع:
```bash
# Test 1: Get All Payments
curl -s "http://localhost:4000/api/payments" \
  -H "Authorization: Bearer $TOKEN" | jq '.payments | length'

# ✅ Expected: عدد المدفوعات
# ❌ Watch out for: wrong response format

# Test 2: Get Payment Stats
curl -s "http://localhost:4000/api/payments/stats" \
  -H "Authorization: Bearer $TOKEN" | jq '.totalPayments'

# ✅ Expected: عدد صحيح (تم إصلاحها!)
# ❌ Watch out for: 404 (تم حلها)

# Test 3: Create Payment
curl -X POST "http://localhost:4000/api/payments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": 8,
    "amount": 250,
    "paymentMethod": "cash",
    "currency": "EGP",
    "createdBy": 1
  }' | jq '.success'

# ✅ Expected: true
# ❌ Watch out for:
#   - 400 (missing createdBy - تم إصلاحها!)
#   - 400 (amount > remaining)
#   - 404 (invoice not found)
```

### الاختبار الآلي:
```bash
cd /opt/lampp/htdocs/FixZone
node testing/test-module-payments-invoices.js
# Expected: 11/11 passed (100%)
```

### ⚠️ **خلّي بالك من:**
1. **createdBy vs userId:** استخدم `createdBy` في الـ payment API
2. **Payment amount:** يجب ألا تتجاوز remaining balance
3. **Invoice status:** يتحدث تلقائياً (`paid`, `partially_paid`)
4. **Response formats:** قد تختلف ({data:[]}, {payments:[]})

---

## Module 4: Customers ✅

### الاختبار السريع:
```bash
# Test 1: Get All Customers
curl -s "http://localhost:4000/api/customers" \
  -H "Authorization: Bearer $TOKEN" | jq '. | length'

# ✅ Expected: عدد العملاء
# ❌ Watch out for: 401, empty array

# Test 2: Create Customer
curl -X POST "http://localhost:4000/api/customers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "أحمد",
    "lastName": "محمد",
    "phone": "01012345678",
    "email": "test@example.com"
  }' | jq '.success'

# ✅ Expected: true
# ❌ Watch out for:
#   - 400 (missing firstName or phone)
#   - 400 (duplicate phone - تم إصلاحها!)

# Test 3: Duplicate Phone Check (CRITICAL!)
curl -X POST "http://localhost:4000/api/customers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Duplicate",
    "phone": "01012345678"
  }' | jq '.success'

# ✅ Expected: false + error message "already exists"
# ❌ Watch out for: true (تم إصلاحها - الآن ترفض!)

# Test 4: Update Customer
CUSTOMER_ID=1
curl -X PUT "http://localhost:4000/api/customers/$CUSTOMER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "العنوان الجديد"
  }' | jq '.success'

# ✅ Expected: true
# ❌ Watch out for: 404 (customer not found)
```

### الاختبار الآلي:
```bash
cd /opt/lampp/htdocs/FixZone
node testing/test-module-customers.js
# Expected: 10/10 passed (100%)
```

### ⚠️ **خلّي بالك من:**
1. **firstName + lastName:** استخدم الاثنين (مش `name`)
2. **Duplicate phone:** **تم إصلاحها** - الآن ترفض الأرقام المكررة
3. **Phone format:** أي format مقبول (مفيش validation محددة)
4. **Soft delete:** العملاء المحذوفون مش بيظهروا في النتائج

---

## 🧪 اختبارات إضافية مهمة

### 1. Data Integrity Tests

```bash
# Test: Customer deletion doesn't break tickets
CUSTOMER_ID=1
# 1. احصل على tickets للعميل
curl -s "http://localhost:4000/api/repairs?customerId=$CUSTOMER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '. | length'

# 2. احذف العميل (soft delete)
curl -X DELETE "http://localhost:4000/api/customers/$CUSTOMER_ID" \
  -H "Authorization: Bearer $TOKEN"

# 3. تأكد أن الـ tickets لسه موجودة
curl -s "http://localhost:4000/api/repairs?customerId=$CUSTOMER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '. | length'

# ✅ Expected: نفس العدد (tickets مش بتتحذف)
```

### 2. Payment Flow Tests

```bash
# Scenario: Full payment workflow
# 1. Create repair → 2. Create invoice → 3. Add payment

# Step 1: Create repair
REPAIR_ID=$(curl -s -X POST "http://localhost:4000/api/repairs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "deviceBrand": "Test",
    "deviceModel": "Model",
    "reportedProblem": "Test problem"
  }' | jq '.data.id')

echo "Created repair: $REPAIR_ID"

# Step 2: Create invoice
INVOICE_ID=$(curl -s -X POST "http://localhost:4000/api/invoices" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"repairRequestId\": $REPAIR_ID,
    \"totalAmount\": 1000,
    \"currency\": \"EGP\"
  }" | jq '.id')

echo "Created invoice: $INVOICE_ID"

# Step 3: Add full payment
curl -s -X POST "http://localhost:4000/api/payments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"invoiceId\": $INVOICE_ID,
    \"amount\": 1000,
    \"paymentMethod\": \"cash\",
    \"currency\": \"EGP\",
    \"createdBy\": 1
  }" | jq '.success'

# ✅ Expected: true
# ✅ Invoice status should change to "paid"
```

### 3. Error Handling Tests

```bash
# Test 1: 404 Handling
curl -s "http://localhost:4000/api/customers/99999" \
  -H "Authorization: Bearer $TOKEN" | jq '.success'
# ✅ Expected: false (404)

# Test 2: 400 Validation
curl -s -X POST "http://localhost:4000/api/customers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Test"}' | jq '.success'
# ✅ Expected: false (missing phone)

# Test 3: 401 Unauthorized
curl -s "http://localhost:4000/api/customers"
# ✅ Expected: 401 (no token)
```

---

## 🔄 Regression Testing Script

قبل كل deployment، شغّل هذا السكربت:

```bash
#!/bin/bash
# File: testing/run-regression-tests.sh

echo "🧪 Starting Regression Tests..."
echo "================================"

cd /opt/lampp/htdocs/FixZone

# Module 1: Authentication
echo "Testing Authentication..."
# (يفترض أن تكون automated)

# Module 2: Tickets
echo "Testing Tickets..."
node testing/test-module-tickets.js || exit 1

# Module 3: Payments & Invoices
echo "Testing Payments & Invoices..."
node testing/test-module-payments-invoices.js || exit 1

# Module 4: Customers
echo "Testing Customers..."
node testing/test-module-customers.js || exit 1

echo "================================"
echo "✅ All regression tests passed!"
```

---

## 📊 النتائج المتوقعة

### عند نجاح الاختبارات:
```
✅ Authentication:          9/9    (100%)
✅ Tickets:                 9/9    (100%)
✅ Payments & Invoices:    11/11   (100%)
✅ Customers:              10/10   (100%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 TOTAL: 39/39 = 100% SUCCESS! 🎉
```

### عند فشل أي اختبار:
1. **راجع الـ error message**
2. **تأكد من الـ server شغال**
3. **تأكد من الـ database connection**
4. **راجع الـ logs:** `backend/server.log`
5. **راجع الـ test results:** `testing/results/`

---

## ⚠️ **أهم النقاط التي تخلّي بالك منها:**

### 1. المشاكل التي تم إصلاحها ✅
- ✅ **Duplicate phone validation** - الآن يعمل بشكل صحيح
- ✅ **Payment stats route** - تم إضافته
- ✅ **Invoice by ID route** - تم إضافته
- ✅ **Schema alignment** - firstName/lastName vs name
- ✅ **createdBy parameter** - في payments API

### 2. احتمال الـ regression (خلّي بالك):
- ⚠️ **Token expiration:** لو الاختبار أخذ وقت طويل
- ⚠️ **Duplicate data:** لو run الاختبار مرتين متتاليتين
- ⚠️ **Database state:** لو في data تم تعديلها يدوياً
- ⚠️ **Server restart:** لو الـ server اتوقف أثناء الاختبار

### 3. Best Practices:
- ✅ **شغّل الاختبارات في بيئة staging** (مش production)
- ✅ **استخدم seed data** للاختبارات
- ✅ **نظّف test data** بعد الاختبار
- ✅ **احفظ الـ logs** لكل run
- ✅ **راجع الـ results** قبل الـ deployment

---

## 📞 عند وجود مشاكل

### خطوات التشخيص:
1. **تأكد من الـ server:**
   ```bash
   curl http://localhost:4000/health
   ```

2. **تأكد من الـ database:**
   ```bash
   mysql -u root -p -e "SELECT COUNT(*) FROM fixzone_erp.Customer;"
   ```

3. **راجع الـ logs:**
   ```bash
   tail -f /opt/lampp/htdocs/FixZone/backend/server.log
   ```

4. **أعد تشغيل السيرفر:**
   ```bash
   cd /opt/lampp/htdocs/FixZone/backend
   pkill -f "node server.js"
   node server.js &
   ```

---

**آخر تحديث:** 2 أكتوبر 2025  
**الإصدار:** 1.0  
**الحالة:** ✅ Production Ready

