# ⚡ اختبار سريع في Browser Console

> **انسخ والصق في Browser Console بعد تسجيل الدخول**

---

## 🚀 اختبار سريع (Copy & Paste)

### **1. اختبار شامل (جميع APIs)**

انسخ والصق هذا الكود في Browser Console (F12):

```javascript
(async function testNavigationAPIs() {
  console.log('🧪 اختبار Navigation APIs...\n');
  
  const tests = [
    { name: 'Navigation Items', url: '/api/navigation/items' },
    { name: 'Navigation Stats', url: '/api/navigation/stats' },
    { name: 'Quick Stats', url: '/api/dashboard/quick-stats' }
  ];
  
  for (const test of tests) {
    try {
      console.log(`📡 Testing: ${test.name}...`);
      const start = performance.now();
      
      const response = await fetch(test.url, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const end = performance.now();
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log(`✅ ${test.name}: PASSED (${(end - start).toFixed(2)}ms)`);
        
        if (Array.isArray(data.data)) {
          console.log(`   📦 Sections: ${data.data.length}`);
          data.data.forEach((section, i) => {
            console.log(`      ${i + 1}. ${section.section}: ${section.items?.length || 0} items`);
          });
        } else if (typeof data.data === 'object') {
          console.log(`   📊 Stats:`);
          Object.keys(data.data).forEach(key => {
            console.log(`      - ${key}: ${data.data[key]}`);
          });
        }
      } else {
        console.error(`❌ ${test.name}: FAILED (${response.status})`);
        console.error(`   Message: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`❌ ${test.name}: ERROR - ${error.message}`);
    }
    console.log('');
  }
  
  console.log('✨ اختبار مكتمل!');
})();
```

---

### **2. اختبار Navigation Items فقط**

```javascript
fetch('/api/navigation/items', {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Navigation Items:', data);
  if (data.success) {
    console.log(`   Sections: ${data.data.length}`);
    data.data.forEach(s => console.log(`   - ${s.section}: ${s.items?.length || 0} items`));
  }
})
.catch(err => console.error('❌ Error:', err));
```

---

### **3. اختبار Stats فقط**

```javascript
Promise.all([
  fetch('/api/navigation/stats', { credentials: 'include' }).then(r => r.json()),
  fetch('/api/dashboard/quick-stats', { credentials: 'include' }).then(r => r.json())
])
.then(([navStats, quickStats]) => {
  console.log('✅ Navigation Stats:', navStats);
  console.log('✅ Quick Stats:', quickStats);
})
.catch(err => console.error('❌ Error:', err));
```

---

### **4. فحص Sidebar Component**

```javascript
// البحث عن Sidebar
const sidebar = document.querySelector('aside');
if (sidebar) {
  console.log('✅ Sidebar موجود');
  console.log('   Width:', sidebar.offsetWidth);
  console.log('   Classes:', sidebar.className);
  
  // فحص عناصر التنقل
  const navLinks = sidebar.querySelectorAll('a[href]');
  console.log(`   Navigation Links: ${navLinks.length}`);
  
  // فحص Badges
  const badges = sidebar.querySelectorAll('[class*="badge"], [class*="Badge"]');
  console.log(`   Badges: ${badges.length}`);
} else {
  console.error('❌ Sidebar غير موجود');
}
```

---

### **5. فحص Topbar Component**

```javascript
const topbar = document.querySelector('header');
if (topbar) {
  console.log('✅ Topbar موجود');
  
  // فحص الإحصائيات
  const statsElements = topbar.querySelectorAll('[class*="stat"]');
  console.log(`   Stats Elements: ${statsElements.length}`);
  
  // فحص الإشعارات
  const notifications = topbar.querySelectorAll('[class*="notification"], [class*="bell"]');
  console.log(`   Notifications: ${notifications.length}`);
} else {
  console.error('❌ Topbar غير موجود');
}
```

---

## ✅ Checklist سريع

بعد تشغيل الاختبارات:

- [ ] Navigation Items API يعمل
- [ ] Navigation Stats API يعمل  
- [ ] Quick Stats API يعمل
- [ ] Sidebar يظهر البيانات
- [ ] Topbar يظهر الإحصائيات
- [ ] Badges تعمل
- [ ] لا توجد أخطاء في Console

---

**جاهز للاختبار!** 🚀

