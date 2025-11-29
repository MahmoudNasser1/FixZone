# 🌐 دليل الاختبار في المتصفح - نظام التنقل

> **اختبار مباشر في Browser Console**

---

## 🔍 الاختبار في Browser Console

### **1. اختبار Navigation Items API**

افتح Browser Console (F12) والصق:

```javascript
// اختبار Navigation Items
fetch('/api/navigation/items', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('✅ Navigation Items:', data);
  if (data.success) {
    console.log(`   Sections: ${data.data.length}`);
    data.data.forEach((section, index) => {
      console.log(`   ${index + 1}. ${section.section}: ${section.items?.length || 0} items`);
    });
  } else {
    console.error('❌ Failed:', data.message);
  }
})
.catch(error => {
  console.error('❌ Error:', error);
});
```

### **2. اختبار Navigation Stats API**

```javascript
// اختبار Navigation Stats
fetch('/api/navigation/stats', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('✅ Navigation Stats:', data);
  if (data.success) {
    console.log('   Stats:', data.data);
    Object.keys(data.data).forEach(key => {
      console.log(`   - ${key}: ${data.data[key]}`);
    });
  } else {
    console.error('❌ Failed:', data.message);
  }
})
.catch(error => {
  console.error('❌ Error:', error);
});
```

### **3. اختبار Quick Stats API**

```javascript
// اختبار Quick Stats
fetch('/api/dashboard/quick-stats', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('✅ Quick Stats:', data);
  if (data.success) {
    console.log('   Quick Stats:', data.data);
    Object.keys(data.data).forEach(key => {
      console.log(`   - ${key}: ${data.data[key]}`);
    });
  } else {
    console.error('❌ Failed:', data.message);
  }
})
.catch(error => {
  console.error('❌ Error:', error);
});
```

### **4. اختبار شامل (All APIs)**

```javascript
// اختبار شامل لجميع APIs
async function testAllNavigationAPIs() {
  console.log('🧪 بدء اختبار Navigation APIs...\n');
  
  const tests = [
    { name: 'Navigation Items', url: '/api/navigation/items' },
    { name: 'Navigation Stats', url: '/api/navigation/stats' },
    { name: 'Quick Stats', url: '/api/dashboard/quick-stats' }
  ];
  
  for (const test of tests) {
    try {
      console.log(`\n📡 Testing: ${test.name}...`);
      const start = Date.now();
      const response = await fetch(test.url, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const end = Date.now();
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ ${test.name}: PASSED (${end - start}ms)`);
        if (Array.isArray(data.data)) {
          console.log(`   Items: ${data.data.length}`);
        } else if (typeof data.data === 'object') {
          console.log(`   Keys: ${Object.keys(data.data).join(', ')}`);
        }
      } else {
        console.error(`❌ ${test.name}: FAILED - ${data.message}`);
      }
    } catch (error) {
      console.error(`❌ ${test.name}: ERROR - ${error.message}`);
    }
  }
  
  console.log('\n✨ اختبار مكتمل!');
}

// تشغيل الاختبار
testAllNavigationAPIs();
```

---

## 🔍 فحص Frontend Components

### **1. فحص Sidebar**

```javascript
// في React DevTools أو Console
// البحث عن Sidebar component
const sidebar = document.querySelector('aside');
if (sidebar) {
  console.log('✅ Sidebar موجود');
  console.log('   Classes:', sidebar.className);
  console.log('   Width:', sidebar.offsetWidth);
  
  // فحص عناصر التنقل
  const navItems = sidebar.querySelectorAll('a, button');
  console.log(`   Navigation Items: ${navItems.length}`);
} else {
  console.error('❌ Sidebar غير موجود');
}
```

### **2. فحص Topbar**

```javascript
// فحص Topbar
const topbar = document.querySelector('header');
if (topbar) {
  console.log('✅ Topbar موجود');
  console.log('   Classes:', topbar.className);
  
  // فحص الإحصائيات
  const stats = topbar.querySelectorAll('[class*="stat"]');
  console.log(`   Stats Elements: ${stats.length}`);
} else {
  console.error('❌ Topbar غير موجود');
}
```

### **3. فحص Badges**

```javascript
// فحص Badges في Sidebar
const badges = document.querySelectorAll('aside [class*="badge"], aside [class*="Badge"]');
console.log(`✅ Badges: ${badges.length}`);
badges.forEach((badge, index) => {
  console.log(`   ${index + 1}. ${badge.textContent}`);
});
```

---

## 🧪 اختبار الأداء

### **قياس وقت الاستجابة**

```javascript
// قياس وقت استجابة APIs
async function measurePerformance() {
  const endpoints = [
    '/api/navigation/items',
    '/api/navigation/stats',
    '/api/dashboard/quick-stats'
  ];
  
  console.log('⚡ قياس الأداء...\n');
  
  for (const endpoint of endpoints) {
    const times = [];
    
    // اختبار 5 مرات
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      await fetch(endpoint, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const end = performance.now();
      times.push(end - start);
    }
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    console.log(`${endpoint}:`);
    console.log(`   Average: ${avg.toFixed(2)}ms`);
    console.log(`   Min: ${min.toFixed(2)}ms`);
    console.log(`   Max: ${max.toFixed(2)}ms\n`);
  }
}

measurePerformance();
```

---

## ✅ Checklist

### **APIs:**
- [ ] Navigation Items API يعمل
- [ ] Navigation Stats API يعمل
- [ ] Quick Stats API يعمل
- [ ] جميع APIs تعيد success: true
- [ ] وقت الاستجابة < 500ms

### **Frontend:**
- [ ] Sidebar يظهر بشكل صحيح
- [ ] Topbar يظهر بشكل صحيح
- [ ] Badges تظهر
- [ ] البحث يعمل
- [ ] Dark Mode يعمل

### **Integration:**
- [ ] Sidebar يحصل على بيانات من API
- [ ] Topbar يحصل على إحصائيات من API
- [ ] Badges تتحدث ديناميكياً
- [ ] Fallback يعمل عند فشل API

---

**آخر تحديث:** 2025-11-XX

