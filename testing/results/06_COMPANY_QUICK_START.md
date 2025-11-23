# 🚀 دليل البدء السريع - اختبار Company Management
## Quick Start Guide - Company Management Testing

**التاريخ:** 2025-11-14  
**المهندس:** Auto (Cursor AI) - QA Engineer

---

## ✅ الملفات الجاهزة

1. ✅ `TESTING/RESULTS/06_COMPANY_MANAGEMENT_COMPLETE_TEST_EXECUTION.md`
   - خطة الاختبار التفصيلية مع جميع الخطوات

2. ✅ `TESTING/RESULTS/06_COMPANY_MANAGEMENT_TEST_EXECUTION_RESULTS.md`
   - ملف لتسجيل النتائج الفعلية

3. ✅ `TESTING/test_company_api.sh`
   - سكريبت bash للاختبار من Terminal

4. ✅ `TESTING/test_company_api.js`
   - سكريبت JavaScript للاختبار من Browser Console

---

## 🎯 طريقة البدء السريع

### الطريقة 1: Browser Console (أسهل) ⭐

1. **افتح الموقع وتسجيل الدخول:**
   - اذهب إلى `http://localhost:3000`
   - سجل الدخول

2. **افتح Browser Console:**
   - اضغط `F12`
   - اختر تبويب `Console`

3. **انسخ والصق السكريبت:**
   ```javascript
   // افتح الملف: TESTING/test_company_api.js
   // انسخ المحتوى كاملاً والصقه في Console
   ```

4. **شغّل الاختبارات:**
   ```javascript
   // للتشغيل السريع لجميع الاختبارات:
   runAllTests()
   
   // أو اختبر يدوياً:
   getToken()                          // الحصول على Token
   testGetCompanyById(1)               // اختبار GET by ID
   testCreateCompany()                 // اختبار CREATE
   testUpdateCompany(TEST_COMPANY_ID)  // اختبار UPDATE
   testGetCompanyCustomers(1)          // اختبار GET customers
   testSearchCompanies('شركة')        // اختبار SEARCH
   testPagination(1, 5)                // اختبار PAGINATION
   testUnauthorized()                  // اختبار 401
   testNonExistent()                   // اختبار 404
   ```

---

### الطريقة 2: Terminal (curl/bash)

1. **شغّل السكريبت:**
   ```bash
   cd /opt/lampp/htdocs/FixZone
   ./TESTING/test_company_api.sh
   ```

2. **اتبع التعليمات:**
   - أدخل Token (احصل عليه من Browser Console أولاً)
   - اختر الاختبارات التي تريد تنفيذها

---

### الطريقة 3: Manual (curl commands)

1. **احصل على Token أولاً:**
   ```bash
   # من Browser Console:
   const authStorage = localStorage.getItem('auth-storage');
   const token = JSON.parse(authStorage)?.state?.token;
   console.log('Token:', token);
   
   # أو من Terminal (إذا كان المستخدم متاح):
   TOKEN=$(curl -X POST http://localhost:4000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"loginIdentifier":"username","password":"password"}' \
     | jq -r '.token')
   ```

2. **شغّل الاختبارات:**
   ```bash
   # Test 1: GET /api/companies/:id
   curl -X GET "http://localhost:4000/api/companies/1" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" | jq '.'
   
   # Test 2: POST /api/companies
   curl -X POST "http://localhost:4000/api/companies" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "شركة اختبار",
       "email": "test@company.com",
       "phone": "01234567890",
       "address": "عنوان الشركة",
       "taxNumber": "TAX123456",
       "status": "active"
     }' | jq '.'
   
   # Test 3: PUT /api/companies/:id
   curl -X PUT "http://localhost:4000/api/companies/1" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "شركة محدثة",
       "email": "updated@company.com",
       "phone": "09876543210",
       "address": "عنوان محدث",
       "taxNumber": "TAX654321",
       "status": "active"
     }' | jq '.'
   
   # Test 4: DELETE /api/companies/:id
   curl -X DELETE "http://localhost:4000/api/companies/1" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" | jq '.'
   
   # Test 5: GET /api/companies/:id/customers
   curl -X GET "http://localhost:4000/api/companies/1/customers" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" | jq '.'
   
   # Test 6: GET /api/companies (search)
   curl -X GET "http://localhost:4000/api/companies?search=شركة" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" | jq '.'
   
   # Test 7: GET /api/companies (pagination)
   curl -X GET "http://localhost:4000/api/companies?page=1&pageSize=5" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" | jq '.'
   
   # Test 8: GET /api/companies (unauthorized - 401)
   curl -X GET "http://localhost:4000/api/companies" \
     -H "Content-Type: application/json" | jq '.'
   
   # Test 9: GET /api/companies/99999 (404)
   curl -X GET "http://localhost:4000/api/companies/99999" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" | jq '.'
   ```

---

## 📋 Checklist الاختبارات

- [ ] Test 1: GET /api/companies/:id
- [ ] Test 2: POST /api/companies (Create)
- [ ] Test 3: PUT /api/companies/:id (Update)
- [ ] Test 4: DELETE /api/companies/:id (Soft Delete)
- [ ] Test 5: GET /api/companies/:id/customers
- [ ] Test 6: GET /api/companies (search filter)
- [ ] Test 7: GET /api/companies (pagination)
- [ ] Test 8: GET /api/companies (unauthorized - 401)
- [ ] Test 9: GET /api/companies/99999 (404)

---

## 📝 تسجيل النتائج

بعد تنفيذ كل اختبار، سجّل النتائج في:
- `TESTING/RESULTS/06_COMPANY_MANAGEMENT_TEST_EXECUTION_RESULTS.md`

**مثال:**
```markdown
### Test 1: GET /api/companies/:id
**Status:** ✅ نجح
**Actual Result:**
- Status: 200
- Response: {id: 1, name: "شركة مثال", ...}
**Notes:** الشركة موجودة والبيانات صحيحة
```

---

## 💡 نصائح

1. **ابدأ بـ Browser Console** - أسهل طريقة
2. **احفظ Token** بعد الحصول عليه
3. **احفظ Company ID** بعد إنشاء شركة جديدة
4. **اختبر Error Cases** أيضاً (401, 404)
5. **وثق كل شيء** - سجّل النتائج مباشرة

---

## 🐛 المشاكل المحتملة

### المشكلة 1: Token غير موجود
**الحل:** تأكد من تسجيل الدخول أولاً

### المشكلة 2: 401 Unauthorized
**الحل:** تحقق من صحة Token

### المشكلة 3: 404 Not Found
**الحل:** تأكد من استخدام ID صحيح

### المشكلة 4: Backend غير متاح
**الحل:** تحقق من أن Backend يعمل على `http://localhost:4000`

---

## 🚀 ابدأ الآن!

### الخطوة 1:
افتح `TESTING/test_company_api.js` وانسخه

### الخطوة 2:
افتح Browser Console في `http://localhost:3000`

### الخطوة 3:
الصق السكريبت وشغّل `runAllTests()`

### الخطوة 4:
سجّل النتائج في ملف النتائج

---

**آخر تحديث:** 2025-11-14  
**الحالة:** ✅ جاهز للتنفيذ




