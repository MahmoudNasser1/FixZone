# 🧪 دليل الاختبار - نظام التنقل والبارات

> **دليل شامل لاختبار جميع المكونات**

---

## ✅ أولويات الاختبار

### **1. Backend APIs (أولوية عالية)** ⚠️
- [ ] `/api/navigation/items` - اختبار الحصول على عناصر التنقل
- [ ] `/api/navigation/stats` - اختبار الحصول على الإحصائيات
- [ ] `/api/dashboard/quick-stats` - اختبار الإحصائيات السريعة
- [ ] اختبار نظام الصلاحيات
- [ ] اختبار Error Handling

### **2. Frontend Integration (أولوية عالية)** ⚠️
- [ ] اختبار `useNavigation()` hook
- [ ] اختبار `useNavigationStats()` hook
- [ ] اختبار `useQuickStats()` hook
- [ ] اختبار Sidebar مع APIs
- [ ] اختبار Topbar مع APIs

### **3. UI/UX (أولوية متوسطة)**
- [ ] اختبار البحث داخل Sidebar
- [ ] اختبار Badges الديناميكية
- [ ] اختبار Dark Mode
- [ ] اختبار Responsive Design

---

## 🧪 خطوات الاختبار

### **1. اختبار Backend APIs:**

```bash
# 1. اختبار Navigation Items API
curl -X GET http://localhost:4000/api/navigation/items \
  -H "Cookie: token=YOUR_TOKEN" \
  -H "Content-Type: application/json"

# 2. اختبار Navigation Stats API
curl -X GET http://localhost:4000/api/navigation/stats \
  -H "Cookie: token=YOUR_TOKEN" \
  -H "Content-Type: application/json"

# 3. اختبار Quick Stats API
curl -X GET http://localhost:4000/api/dashboard/quick-stats \
  -H "Cookie: token=YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### **2. اختبار Frontend:**

```bash
# 1. تشغيل Frontend
cd frontend/react-app
npm start

# 2. فتح Developer Console
# 3. التحقق من:
#    - Network requests للـ APIs
#    - Console errors
#    - Sidebar يعرض العناصر بشكل صحيح
#    - Topbar يعرض الإحصائيات بشكل صحيح
```

---

## 🔍 Checklist الاختبار

### **Backend:**
- [ ] APIs تعمل بدون أخطاء
- [ ] نظام الصلاحيات يعمل
- [ ] Error Handling صحيح
- [ ] Database queries تعمل بشكل صحيح

### **Frontend:**
- [ ] Hooks تعمل بشكل صحيح
- [ ] Sidebar يعرض العناصر
- [ ] Badges تعمل بشكل ديناميكي
- [ ] البحث داخل Sidebar يعمل
- [ ] Topbar يعرض الإحصائيات

### **Integration:**
- [ ] البيانات تظهر بشكل صحيح
- [ ] لا توجد أخطاء في Console
- [ ] Performance جيد

---

## 🐛 المشاكل المحتملة والحلول

### **1. APIs لا تعمل:**
- ✅ التحقق من Route في `backend/app.js`
- ✅ التحقق من Authentication
- ✅ التحقق من Database Connection

### **2. Badges لا تظهر:**
- ✅ التحقق من API response
- ✅ التحقق من badgeKey في navigation items
- ✅ التحقق من stats object

### **3. Search لا يعمل:**
- ✅ التحقق من useNavigationSearch hook
- ✅ التحقق من searchQuery state

---

**آخر تحديث:** 2025-11-XX

