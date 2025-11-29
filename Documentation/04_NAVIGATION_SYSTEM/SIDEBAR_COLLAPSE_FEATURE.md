# ✅ ميزة طي الأقسام تلقائياً - Sidebar

> **تاريخ:** 2025-11-29

---

## 📋 الوصف

تم تطبيق ميزة جديدة في السايد بار حيث **جميع الأقسام منطوية (collapsed) تلقائياً** باستثناء القسم الذي يحتوي على الصفحة الحالية.

---

## ✨ المميزات

1. **طي تلقائي:** جميع الأقسام منطوية افتراضياً
2. **فتح تلقائي:** القسم الذي يحتوي على الصفحة الحالية يفتح تلقائياً
3. **دعم المسارات المتداخلة:** يعمل مع المسارات المتداخلة (مثل `/repairs/123`)
4. **دعم SubItems:** يفتح القوائم الفرعية (SubItems) تلقائياً إذا كانت الصفحة الحالية ضمنها

---

## 🔧 التغييرات

### **1. تحديث State:**
```javascript
// قبل: كانت الأقسام مفتوحة افتراضياً
const [openSections, setOpenSections] = useState(new Set(['الرئيسية', 'إدارة الإصلاحات', ...]));

// بعد: جميع الأقسام منطوية افتراضياً
const [openSections, setOpenSections] = useState(new Set());
```

### **2. إضافة Logic للبحث عن القسم:**
- يتم البحث عن القسم الذي يحتوي على الصفحة الحالية
- يدعم المسارات المتداخلة (nested routes)
- يفتح القوائم الفرعية (SubItems) تلقائياً

### **3. useEffect للتحديث التلقائي:**
- يتم تحديث الأقسام المفتوحة تلقائياً عند تغيير الصفحة
- يعمل حتى لو كان Sidebar مغلقاً (سيفتح القسم الصحيح عند فتح Sidebar)

---

## 📝 الكود

### **findSectionForCurrentPage:**
```javascript
const findSectionForCurrentPage = useCallback((items, pathname) => {
  let foundSection = null;
  let foundMenuItem = null;

  for (const section of items) {
    for (const item of section.items || []) {
      // Check direct href match (exact match)
      if (item.href === pathname) {
        foundSection = section.section;
        break;
      }
      
      // Check if pathname starts with item.href (for nested routes)
      if (item.href && item.href !== '/' && pathname.startsWith(item.href)) {
        foundSection = section.section;
        break;
      }
      
      // Check subItems
      if (item.subItems) {
        for (const subItem of item.subItems) {
          if (subItem.href === pathname || 
              (subItem.href && subItem.href !== '/' && pathname.startsWith(subItem.href))) {
            foundSection = section.section;
            foundMenuItem = item.label;
            break;
          }
        }
        if (foundMenuItem) break;
      }
    }
    if (foundSection) break;
  }

  // Open the menu item if it has subItems
  if (foundMenuItem) {
    setOpenMenus(prev => new Set([...prev, foundMenuItem]));
  }

  return foundSection;
}, []);
```

### **useEffect للتحديث:**
```javascript
useEffect(() => {
  // Always find the section, even if sidebar is closed
  const currentSection = findSectionForCurrentPage(navigationItems, location.pathname);
  
  if (currentSection) {
    // Open only the section containing the current page, close all others
    setOpenSections(new Set([currentSection]));
  } else {
    // If no section found, close all sections
    setOpenSections(new Set());
  }
}, [location.pathname, navigationItems, findSectionForCurrentPage]);
```

---

## ✅ النتيجة

- ✅ جميع الأقسام منطوية افتراضياً
- ✅ القسم الذي يحتوي على الصفحة الحالية يفتح تلقائياً
- ✅ عند الانتقال لصفحة جديدة، ينطوي القسم السابق ويفتح القسم الجديد
- ✅ يعمل مع المسارات المتداخلة

---

**الحالة:** ✅ **مكتمل!**

