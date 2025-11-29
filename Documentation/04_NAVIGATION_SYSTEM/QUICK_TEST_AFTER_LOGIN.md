# ⚡ اختبار سريع بعد تسجيل الدخول

> **خطوات الاختبار بعد تسجيل الدخول**

---

## 🚀 خطوات الاختبار (3 خطوات)

### **الخطوة 1: افتح Developer Console**

بعد تسجيل الدخول، اضغط:
- **Windows/Linux:** `F12` أو `Ctrl + Shift + I`
- **Mac:** `Cmd + Option + I`

### **الخطوة 2: انتقل إلى Console Tab**

في Developer Tools، اختر tab **Console**

### **الخطوة 3: الصق هذا الكود**

انسخ والصق هذا الكود في Console:

```javascript
// اختبار Navigation APIs بعد تسجيل الدخول
(async function testNavigationAfterLogin() {
  console.log('🧪 بدء اختبار Navigation APIs...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  // Test 1: Navigation Items
  try {
    console.log('📡 Test 1: Navigation Items...');
    const start1 = performance.now();
    const res1 = await fetch('/api/navigation/items', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    const end1 = performance.now();
    const data1 = await res1.json();
    
    if (res1.ok && data1.success) {
      console.log(`✅ PASSED (${(end1 - start1).toFixed(2)}ms)`);
      console.log(`   📦 Sections: ${data1.data.length}`);
      data1.data.forEach((section, i) => {
        console.log(`      ${i + 1}. ${section.section}: ${section.items?.length || 0} items`);
        if (section.items) {
          section.items.forEach(item => {
            if (item.subItems) {
              console.log(`         └─ ${item.label}: ${item.subItems.length} sub-items`);
            }
          });
        }
      });
      results.passed++;
    } else {
      console.log(`❌ FAILED (${res1.status})`);
      console.log(`   Message: ${data1.message || 'Unknown error'}`);
      results.failed++;
      results.errors.push({ test: 'Navigation Items', error: data1.message });
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    results.failed++;
    results.errors.push({ test: 'Navigation Items', error: error.message });
  }
  
  console.log('');
  
  // Test 2: Navigation Stats
  try {
    console.log('📡 Test 2: Navigation Stats...');
    const start2 = performance.now();
    const res2 = await fetch('/api/navigation/stats', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    const end2 = performance.now();
    const data2 = await res2.json();
    
    if (res2.ok && data2.success) {
      console.log(`✅ PASSED (${(end2 - start2).toFixed(2)}ms)`);
      console.log(`   📊 Stats:`);
      Object.keys(data2.data).forEach(key => {
        console.log(`      - ${key}: ${data2.data[key]}`);
      });
      results.passed++;
    } else {
      console.log(`❌ FAILED (${res2.status})`);
      console.log(`   Message: ${data2.message || 'Unknown error'}`);
      results.failed++;
      results.errors.push({ test: 'Navigation Stats', error: data2.message });
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    results.failed++;
    results.errors.push({ test: 'Navigation Stats', error: error.message });
  }
  
  console.log('');
  
  // Test 3: Quick Stats
  try {
    console.log('📡 Test 3: Quick Stats...');
    const start3 = performance.now();
    const res3 = await fetch('/api/dashboard/quick-stats', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    const end3 = performance.now();
    const data3 = await res3.json();
    
    if (res3.ok && data3.success) {
      console.log(`✅ PASSED (${(end3 - start3).toFixed(2)}ms)`);
      console.log(`   📊 Quick Stats:`);
      Object.keys(data3.data).forEach(key => {
        const value = data3.data[key];
        if (typeof value === 'number') {
          console.log(`      - ${key}: ${value.toLocaleString()}`);
        } else {
          console.log(`      - ${key}: ${value}`);
        }
      });
      results.passed++;
    } else {
      console.log(`❌ FAILED (${res3.status})`);
      console.log(`   Message: ${data3.message || 'Unknown error'}`);
      results.failed++;
      results.errors.push({ test: 'Quick Stats', error: data3.message });
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    results.failed++;
    results.errors.push({ test: 'Quick Stats', error: error.message });
  }
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Summary:');
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   Total: ${results.passed + results.failed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err.test}: ${err.error}`);
    });
  }
  
  console.log('\n✨ اختبار مكتمل!');
  
  return results;
})();
```

---

## 🔍 فحص Sidebar و Topbar

بعد تشغيل الاختبار أعلاه، جرب هذا:

```javascript
// فحص Sidebar
console.log('\n🔍 فحص Sidebar...');
const sidebar = document.querySelector('aside');
if (sidebar) {
  console.log('✅ Sidebar موجود');
  console.log('   Width:', sidebar.offsetWidth);
  
  const navLinks = sidebar.querySelectorAll('a[href]');
  console.log(`   Navigation Links: ${navLinks.length}`);
  
  const badges = sidebar.querySelectorAll('[class*="badge"], [class*="Badge"]');
  console.log(`   Badges: ${badges.length}`);
  badges.forEach((badge, i) => {
    console.log(`      ${i + 1}. ${badge.textContent.trim()}`);
  });
} else {
  console.log('❌ Sidebar غير موجود');
}

// فحص Topbar
console.log('\n🔍 فحص Topbar...');
const topbar = document.querySelector('header');
if (topbar) {
  console.log('✅ Topbar موجود');
  
  const stats = topbar.querySelectorAll('[class*="stat"], [class*="Stat"]');
  console.log(`   Stats Elements: ${stats.length}`);
} else {
  console.log('❌ Topbar غير موجود');
}
```

---

## 📊 فحص Network Requests

1. افتح **Network** tab في Developer Tools
2. ابحث عن:
   - `navigation/items`
   - `navigation/stats`
   - `dashboard/quick-stats`
3. تحقق من:
   - ✅ Status: 200
   - ✅ Response: JSON مع success: true
   - ✅ Response Time: < 500ms

---

## ✅ Checklist

بعد الاختبار، تحقق من:

- [ ] Navigation Items API يعمل
- [ ] Navigation Stats API يعمل
- [ ] Quick Stats API يعمل
- [ ] Sidebar يعرض العناصر
- [ ] Topbar يعرض الإحصائيات
- [ ] Badges تظهر
- [ ] لا توجد أخطاء في Console

---

**جاهز للاختبار!** 🚀

