# 🚀 اختبر الآن! (بعد تسجيل الدخول)

---

## ⚡ خطوات سريعة

### 1️⃣ اضغط F12
### 2️⃣ اختر Console Tab  
### 3️⃣ الصق الكود أدناه ⬇️

---

## 📋 الكود للصقه:

```javascript
(async () => {
  console.log('🧪 اختبار Navigation APIs...\n');
  
  // Test 1: Navigation Items
  try {
    const r1 = await fetch('/api/navigation/items', {credentials: 'include'});
    const d1 = await r1.json();
    if (r1.ok && d1.success) {
      console.log('✅ Navigation Items:', d1.data.length, 'sections');
      d1.data.forEach(s => console.log(`   - ${s.section}: ${s.items?.length || 0} items`));
    } else console.log('❌ Failed:', d1.message);
  } catch(e) { console.log('❌ Error:', e.message); }
  
  // Test 2: Navigation Stats
  try {
    const r2 = await fetch('/api/navigation/stats', {credentials: 'include'});
    const d2 = await r2.json();
    if (r2.ok && d2.success) {
      console.log('\n✅ Navigation Stats:', d2.data);
    } else console.log('❌ Failed:', d2.message);
  } catch(e) { console.log('❌ Error:', e.message); }
  
  // Test 3: Quick Stats
  try {
    const r3 = await fetch('/api/dashboard/quick-stats', {credentials: 'include'});
    const d3 = await r3.json();
    if (r3.ok && d3.success) {
      console.log('\n✅ Quick Stats:', d3.data);
    } else console.log('❌ Failed:', d3.message);
  } catch(e) { console.log('❌ Error:', e.message); }
  
  console.log('\n✨ انتهى الاختبار!');
})();
```

---

## 📊 بعد الاختبار

1. راجع Console للنتائج
2. افتح Network tab وابحث عن:
   - `navigation/items`
   - `navigation/stats`  
   - `quick-stats`
3. تحقق من Sidebar و Topbar في الصفحة

---

**ابدأ الآن!** 🚀

