# 📚 دليل شامل: النسخ الاحتياطي، التاريخ، والاستيراد/التصدير

## 📋 جدول المحتويات

1. [تبويب النسخ الاحتياطي (Backup)](#1-تبويب-النسخ-الاحتياطي-backup)
2. [سيكشن الاستيراد والتصدير (Import/Export)](#2-سيكشن-الاستيراد-والتصدير-importexport)
3. [تبويب التاريخ (History)](#3-تبويب-التاريخ-history)
4. [التطويرات المقترحة](#4-التطويرات-المقترحة)

---

## 1. تبويب النسخ الاحتياطي (Backup)

### 🎯 ما يفعله هذا التبويب:

تبويب النسخ الاحتياطي يسمح لك بحفظ **جميع إعدادات النظام** في نسخة احتياطية يمكن استعادتها لاحقاً.

### ✨ الميزات الحالية:

#### 1.1 إنشاء نسخة احتياطية (Create Backup)

**ما يحدث:**
- يجلب جميع الإعدادات من قاعدة البيانات
- يحفظها في جدول `SettingBackup` مع:
  - اسم النسخة الاحتياطية
  - وصف (اختياري)
  - جميع الإعدادات (JSON)
  - المستخدم الذي أنشأها
  - التاريخ والوقت

**الكود:**
```javascript
// backend/services/settings/settingsBackupService.js
async createBackup(name, description, userId) {
  // 1. جلب جميع الإعدادات
  const allSettings = await settingsRepository.findAll({}, {});
  
  // 2. إنشاء كائن النسخة الاحتياطية
  const backup = {
    name: name || `Backup_${new Date().toISOString()}`,
    description: description || null,
    settings: allSettings.map(setting => ({
      key: setting.key,
      value: setting.value,
      type: setting.type,
      category: setting.category,
      // ... جميع البيانات
    })),
    createdBy: userId
  };
  
  // 3. حفظ في قاعدة البيانات
  const savedBackup = await settingsBackupRepository.create(backup);
  return savedBackup;
}
```

**الاستخدام:**
1. اضغط "إنشاء نسخة احتياطية"
2. أدخل اسم النسخة (مثال: "Backup قبل التحديث")
3. أدخل وصف (اختياري)
4. اضغط "إنشاء"

---

#### 1.2 عرض النسخ الاحتياطية (List Backups)

**ما يحدث:**
- يعرض جميع النسخ الاحتياطية المحفوظة
- يظهر لكل نسخة:
  - الاسم والوصف
  - التاريخ والوقت
  - المستخدم الذي أنشأها
  - عدد الإعدادات المحفوظة

**الكود:**
```javascript
// backend/repositories/settingsBackupRepository.js
async findAll(pagination = {}) {
  const sql = `
    SELECT sb.*, u.name as createdByName, u.email as createdByEmail
    FROM SettingBackup sb
    LEFT JOIN User u ON sb.createdBy = u.id
    ORDER BY sb.createdAt DESC
  `;
  // ... pagination
}
```

---

#### 1.3 استعادة نسخة احتياطية (Restore Backup)

**ما يحدث:**
- يجلب النسخة الاحتياطية من قاعدة البيانات
- يعيد كل إعداد إلى قيمته المحفوظة
- لديه خيارات:
  - **overwriteExisting**: الكتابة فوق الإعدادات الموجودة
  - **skipSystemSettings**: تخطي إعدادات النظام

**الكود:**
```javascript
// backend/services/settings/settingsBackupService.js
async restoreBackup(backupId, userId, options = {}) {
  const { overwriteExisting = true, skipSystemSettings = true } = options;
  
  // 1. جلب النسخة الاحتياطية
  const backup = await settingsBackupRepository.findById(backupId);
  
  // 2. استعادة كل إعداد
  for (const setting of backup.settings) {
    // تخطي إعدادات النظام إذا طُلب
    if (skipSystemSettings && setting.isSystem) {
      skipped.push({ key: setting.key, reason: 'System setting' });
      continue;
    }
    
    // تحديث أو إنشاء الإعداد
    const existing = await settingsRepository.findByKey(setting.key);
    if (existing) {
      if (!overwriteExisting) {
        skipped.push({ key: setting.key, reason: 'Setting already exists' });
        continue;
      }
      await settingsService.updateSetting(setting.key, {...}, userId);
    } else {
      await settingsService.createSetting({...}, userId);
    }
  }
  
  return {
    restored: restored.length,
    skipped: skipped.length,
    errors: errors.length
  };
}
```

**الاستخدام:**
1. اختر نسخة احتياطية
2. اضغط "استعادة"
3. اختر الخيارات:
   - ✅ الكتابة فوق الإعدادات الموجودة
   - ✅ تخطي إعدادات النظام
4. اضغط "استعادة"

---

#### 1.4 حذف نسخة احتياطية (Delete Backup)

**ما يحدث:**
- يحذف النسخة الاحتياطية من قاعدة البيانات
- **تحذير:** لا يمكن استعادتها بعد الحذف

---

### 🔧 التطويرات المقترحة للنسخ الاحتياطي:

#### 1. نسخ احتياطية تلقائية (Auto Backup)
```javascript
// مثال: نسخة احتياطية يومية تلقائية
async scheduleAutoBackup() {
  // كل يوم الساعة 2 صباحاً
  cron.schedule('0 2 * * *', async () => {
    await settingsBackupService.createBackup(
      `Auto Backup ${new Date().toLocaleDateString()}`,
      'نسخة احتياطية تلقائية يومية',
      systemUserId
    );
  });
}
```

#### 2. نسخ احتياطية قبل التحديثات الكبيرة
```javascript
// قبل تحديث الإعدادات، إنشاء نسخة احتياطية تلقائياً
async updateSetting(key, value, userId, reason) {
  // إنشاء نسخة احتياطية قبل التحديث
  await this.createBackup(
    `Pre-Update Backup: ${key}`,
    `نسخة احتياطية قبل تحديث ${key}`,
    userId
  );
  
  // ثم تحديث الإعداد
  // ...
}
```

#### 3. ضغط النسخ الاحتياطية القديمة
```javascript
// حذف النسخ الاحتياطية الأقدم من 30 يوم
async cleanupOldBackups() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  await db.execute(
    'DELETE FROM SettingBackup WHERE createdAt < ?',
    [thirtyDaysAgo]
  );
}
```

#### 4. مقارنة النسخ الاحتياطية
```javascript
// مقارنة نسختين احتياطيتين لمعرفة الاختلافات
async compareBackups(backupId1, backupId2) {
  const backup1 = await this.getBackup(backupId1);
  const backup2 = await this.getBackup(backupId2);
  
  const differences = [];
  backup1.settings.forEach(setting1 => {
    const setting2 = backup2.settings.find(s => s.key === setting1.key);
    if (!setting2 || setting1.value !== setting2.value) {
      differences.push({
        key: setting1.key,
        oldValue: setting1.value,
        newValue: setting2?.value
      });
    }
  });
  
  return differences;
}
```

#### 5. تصدير النسخ الاحتياطية كملفات
```javascript
// تصدير نسخة احتياطية كملف JSON
async exportBackupToFile(backupId) {
  const backup = await this.getBackup(backupId);
  const filename = `backup_${backup.name}_${Date.now()}.json`;
  
  await fs.writeFile(
    path.join('backups', filename),
    JSON.stringify(backup, null, 2)
  );
  
  return filename;
}
```

---

## 2. سيكشن الاستيراد والتصدير (Import/Export)

### 🎯 ما يفعله هذا السيكشن:

يسمح لك بتصدير الإعدادات إلى ملف JSON واستيرادها من ملف JSON.

### ✨ الميزات الحالية:

#### 2.1 تصدير الإعدادات (Export Settings)

**ما يحدث:**
- يجلب جميع الإعدادات (أو حسب الفلتر)
- يحولها إلى JSON
- يسمح بتحميل الملف

**الكود:**
```javascript
// backend/services/settings/settingsImportExportService.js
async exportSettings(format = 'json', filters = {}) {
  // 1. جلب الإعدادات حسب الفلتر
  const settings = await settingsRepository.findAll(filters, {});
  
  // 2. تحضير بيانات التصدير
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    exportedBy: 'system',
    settings: settings.map(setting => ({
      key: setting.key,
      value: setting.value,
      type: setting.type,
      category: setting.category,
      // ... جميع البيانات
    }))
  };
  
  // 3. إرجاع JSON
  return {
    format: 'json',
    data: JSON.stringify(exportData, null, 2),
    filename: `settings_export_${new Date().toISOString()}.json`
  };
}
```

**الاستخدام:**
1. اضغط "تصدير الإعدادات"
2. سيتم تحميل ملف JSON
3. احفظ الملف في مكان آمن

**مثال على الملف المُصدّر:**
```json
{
  "version": "1.0",
  "exportedAt": "2025-01-28T10:30:00.000Z",
  "exportedBy": "system",
  "settings": [
    {
      "key": "company.name",
      "value": "FixZone",
      "type": "string",
      "category": "company",
      "description": "اسم الشركة"
    },
    {
      "key": "currency.code",
      "value": "EGP",
      "type": "string",
      "category": "currency"
    }
  ]
}
```

---

#### 2.2 استيراد الإعدادات (Import Settings)

**ما يحدث:**
- يقرأ ملف JSON
- يتحقق من صحة البيانات
- يستورد الإعدادات مع خيارات:
  - **overwriteExisting**: الكتابة فوق الإعدادات الموجودة
  - **skipSystemSettings**: تخطي إعدادات النظام

**الكود:**
```javascript
// backend/services/settings/settingsImportExportService.js
async importSettings(filePath, userId, options = {}) {
  const { overwriteExisting = false, skipSystemSettings = true } = options;
  
  // 1. قراءة الملف
  const fileContent = await fs.readFile(filePath, 'utf8');
  const importData = JSON.parse(fileContent);
  
  // 2. التحقق من صحة البيانات
  if (!importData.settings || !Array.isArray(importData.settings)) {
    throw new Error('Invalid import file format');
  }
  
  // 3. معالجة كل إعداد
  for (const setting of importData.settings) {
    // تخطي إعدادات النظام إذا طُلب
    if (skipSystemSettings && setting.isSystem) {
      skipped.push({ key: setting.key, reason: 'System setting' });
      continue;
    }
    
    // التحقق من وجود الإعداد
    const existing = await settingsRepository.findByKey(setting.key);
    
    if (existing) {
      if (!overwriteExisting) {
        skipped.push({ key: setting.key, reason: 'Setting already exists' });
        continue;
      }
      // تحديث الإعداد
      await settingsService.updateSetting(setting.key, {...}, userId);
    } else {
      // إنشاء إعداد جديد
      await settingsService.createSetting({...}, userId);
    }
  }
  
  return {
    imported: imported.length,
    skipped: skipped.length,
    errors: errors.length
  };
}
```

**الاستخدام:**
1. اضغط "اختر ملف JSON"
2. اختر الملف
3. سيتم التحقق من صحة الملف تلقائياً
4. اختر الخيارات:
   - ✅ الكتابة فوق الإعدادات الموجودة
   - ✅ تخطي إعدادات النظام
5. اضغط "استيراد الإعدادات"

---

#### 2.3 الحصول على قالب (Get Template)

**ما يحدث:**
- يعطي ملف JSON قالب فارغ
- يمكن استخدامه كمرجع لإنشاء ملف استيراد

**الكود:**
```javascript
async getExportTemplate() {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    exportedBy: 'template',
    settings: [
      {
        key: 'example.setting.key',
        value: 'example value',
        type: 'string',
        category: 'general',
        description: 'Example setting description'
      }
    ]
  };
}
```

---

#### 2.4 التحقق من صحة الملف (Validate File)

**ما يحدث:**
- يتحقق من صحة ملف JSON قبل الاستيراد
- يتحقق من:
  - صحة البنية (JSON valid)
  - وجود الحقول المطلوبة
  - صحة أنواع البيانات

**الكود:**
```javascript
async validateImportFile(filePath) {
  try {
    const result = await this.importSettings(filePath, null, {
      validateOnly: true,  // فقط التحقق، بدون استيراد
      overwriteExisting: false,
      skipSystemSettings: true
    });
    
    return {
      valid: result.errors.length === 0,
      ...result
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}
```

---

### 🔧 التطويرات المقترحة للاستيراد/التصدير:

#### 1. تصدير/استيراد جزئي (Selective Export/Import)
```javascript
// تصدير إعدادات فئة معينة فقط
async exportSettingsByCategory(category) {
  return await this.exportSettings('json', { category });
}

// استيراد إعدادات فئة معينة فقط
async importSettingsByCategory(filePath, category) {
  const importData = JSON.parse(await fs.readFile(filePath, 'utf8'));
  const filteredSettings = importData.settings.filter(s => s.category === category);
  // ... استيراد
}
```

#### 2. تصدير بصيغ متعددة
```javascript
// تصدير بصيغة CSV
async exportToCSV() {
  const settings = await settingsRepository.findAll({}, {});
  const csv = settings.map(s => `${s.key},${s.value},${s.category}`).join('\n');
  return { format: 'csv', data: csv, filename: 'settings.csv' };
}

// تصدير بصيغة XML
async exportToXML() {
  // ...
}
```

#### 3. استيراد من مصادر متعددة
```javascript
// استيراد من URL
async importFromURL(url) {
  const response = await fetch(url);
  const fileContent = await response.text();
  const tempPath = path.join('uploads/temp', `import_${Date.now()}.json`);
  await fs.writeFile(tempPath, fileContent);
  return await this.importSettings(tempPath, userId);
}

// استيراد من قاعدة بيانات أخرى
async importFromDatabase(connectionString) {
  // ...
}
```

#### 4. مقارنة قبل الاستيراد
```javascript
// مقارنة الإعدادات الحالية مع الملف قبل الاستيراد
async compareWithFile(filePath) {
  const importData = JSON.parse(await fs.readFile(filePath, 'utf8'));
  const currentSettings = await settingsRepository.findAll({}, {});
  
  const differences = [];
  importData.settings.forEach(imported => {
    const current = currentSettings.find(s => s.key === imported.key);
    if (!current || current.value !== imported.value) {
      differences.push({
        key: imported.key,
        currentValue: current?.value,
        importedValue: imported.value,
        action: current ? 'update' : 'create'
      });
    }
  });
  
  return differences;
}
```

#### 5. استيراد تدريجي (Incremental Import)
```javascript
// استيراد فقط الإعدادات التي تغيرت
async incrementalImport(filePath) {
  const importData = JSON.parse(await fs.readFile(filePath, 'utf8'));
  const currentSettings = await settingsRepository.findAll({}, {});
  
  const toImport = importData.settings.filter(imported => {
    const current = currentSettings.find(s => s.key === imported.key);
    return !current || current.value !== imported.value;
  });
  
  // استيراد فقط الإعدادات المتغيرة
  // ...
}
```

---

## 3. تبويب التاريخ (History)

### 🎯 ما يفعله هذا التبويب:

تبويب التاريخ يسجل **جميع التغييرات** التي تحدث على كل إعداد، ويسمح بالتراجع (Rollback) إلى أي نسخة سابقة.

### ✨ الميزات الحالية:

#### 3.1 تسجيل التاريخ (History Logging)

**ما يحدث:**
- عند تحديث أي إعداد، يتم تسجيل:
  - القيمة القديمة
  - القيمة الجديدة
  - المستخدم الذي غيّرها
  - التاريخ والوقت
  - سبب التغيير (إن وجد)
  - IP Address
  - User Agent

**الكود:**
```javascript
// backend/services/settings/settingsService.js
async updateSetting(key, data, userId, reason = null) {
  // 1. جلب الإعداد الحالي
  const existing = await settingsRepository.findByKey(key);
  const oldValue = existing ? existing.value : null;
  
  // 2. تحديث الإعداد
  const updated = await settingsRepository.update(key, data);
  
  // 3. تسجيل التاريخ
  await settingsHistoryRepository.create({
    settingId: updated.id,
    settingKey: key,
    oldValue: oldValue,
    newValue: updated.value,
    changedBy: userId,
    changeReason: reason,
    ipAddress: req?.ip || null,
    userAgent: req?.headers['user-agent'] || null
  });
  
  return updated;
}
```

**مثال على سجل التاريخ:**
```json
{
  "id": 1,
  "settingKey": "company.name",
  "oldValue": "FixZone Old",
  "newValue": "FixZone New",
  "changedBy": 5,
  "changedByName": "أحمد الإداري",
  "changeReason": "تحديث اسم الشركة",
  "createdAt": "2025-01-28T10:30:00.000Z",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

---

#### 3.2 عرض التاريخ (View History)

**ما يحدث:**
- يعرض جميع التغييرات لإعداد معين
- مرتبة من الأحدث إلى الأقدم
- يظهر:
  - المستخدم الذي غيّرها
  - التاريخ والوقت
  - القيمة القديمة والجديدة
  - سبب التغيير

**الكود:**
```javascript
// backend/repositories/settingsHistoryRepository.js
async findBySettingKey(key, pagination = {}) {
  const sql = `
    SELECT sh.*, u.name as changedByName, u.email as changedByEmail
    FROM SettingHistory sh
    LEFT JOIN User u ON sh.changedBy = u.id
    WHERE sh.settingKey = ?
    ORDER BY sh.createdAt DESC
  `;
  // ... pagination
}
```

**الاستخدام:**
1. اختر إعداداً من القائمة
2. سيتم عرض جميع التغييرات لهذا الإعداد
3. يمكنك رؤية:
   - من غيّرها
   - متى
   - القيمة القديمة والجديدة
   - سبب التغيير

---

#### 3.3 التراجع (Rollback)

**ما يحدث:**
- يعيد الإعداد إلى قيمة سابقة
- يسجل هذا التغيير في التاريخ أيضاً

**الكود:**
```javascript
// backend/services/settings/settingsService.js
async rollbackSetting(key, historyId, userId) {
  // 1. جلب سجل التاريخ
  const historyEntry = await settingsHistoryRepository.findById(historyId);
  
  if (!historyEntry || historyEntry.settingKey !== key) {
    throw new Error('History entry not found');
  }
  
  // 2. التراجع إلى القيمة القديمة
  const current = await settingsRepository.findByKey(key);
  const oldValue = current ? current.value : null;
  
  await settingsRepository.update(key, {
    value: historyEntry.oldValue
  });
  
  // 3. تسجيل التراجع في التاريخ
  await settingsHistoryRepository.create({
    settingId: current.id,
    settingKey: key,
    oldValue: oldValue,
    newValue: historyEntry.oldValue,
    changedBy: userId,
    changeReason: `Rollback to history entry #${historyId}`
  });
  
  return { success: true };
}
```

**الاستخدام:**
1. اختر إعداداً
2. شاهد التاريخ
3. اضغط "تراجع" على أي تغيير
4. سيتم إرجاع الإعداد إلى القيمة السابقة

---

### 🔧 التطويرات المقترحة للتاريخ:

#### 1. فلترة التاريخ
```javascript
// فلترة حسب المستخدم
async getHistoryByUser(userId) {
  return await settingsHistoryRepository.findAll({ changedBy: userId });
}

// فلترة حسب التاريخ
async getHistoryByDateRange(startDate, endDate) {
  return await settingsHistoryRepository.findAll({
    startDate: startDate,
    endDate: endDate
  });
}

// فلترة حسب الفئة
async getHistoryByCategory(category) {
  const settings = await settingsRepository.findAll({ category }, {});
  const keys = settings.map(s => s.key);
  return await settingsHistoryRepository.findAll({
    settingKey: { $in: keys }
  });
}
```

#### 2. إحصائيات التاريخ
```javascript
// أكثر الإعدادات تغييراً
async getMostChangedSettings(limit = 10) {
  const sql = `
    SELECT settingKey, COUNT(*) as changeCount
    FROM SettingHistory
    GROUP BY settingKey
    ORDER BY changeCount DESC
    LIMIT ?
  `;
  // ...
}

// أكثر المستخدمين تغييراً
async getMostActiveUsers(limit = 10) {
  const sql = `
    SELECT changedBy, COUNT(*) as changeCount
    FROM SettingHistory
    GROUP BY changedBy
    ORDER BY changeCount DESC
    LIMIT ?
  `;
  // ...
}
```

#### 3. مقارنة الإصدارات
```javascript
// مقارنة إعداد بين تاريخين
async compareSettingVersions(key, historyId1, historyId2) {
  const history1 = await settingsHistoryRepository.findById(historyId1);
  const history2 = await settingsHistoryRepository.findById(historyId2);
  
  return {
    key: key,
    version1: {
      value: history1.newValue,
      date: history1.createdAt,
      user: history1.changedByName
    },
    version2: {
      value: history2.newValue,
      date: history2.createdAt,
      user: history2.changedByName
    },
    difference: history1.newValue !== history2.newValue
  };
}
```

#### 4. تصدير التاريخ
```javascript
// تصدير تاريخ إعداد معين
async exportHistory(key, format = 'json') {
  const history = await settingsHistoryRepository.findBySettingKey(key);
  
  if (format === 'json') {
    return JSON.stringify(history, null, 2);
  } else if (format === 'csv') {
    const csv = history.map(h => 
      `${h.createdAt},${h.changedByName},${h.oldValue},${h.newValue}`
    ).join('\n');
    return csv;
  }
}
```

#### 5. تنظيف التاريخ القديم
```javascript
// حذف السجلات الأقدم من 90 يوم
async cleanupOldHistory() {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  await db.execute(
    'DELETE FROM SettingHistory WHERE createdAt < ?',
    [ninetyDaysAgo]
  );
}
```

---

## 4. التطويرات المقترحة

### 🚀 أولويات التطوير:

#### الأولوية العالية (High Priority):
1. ✅ **نسخ احتياطية تلقائية يومية**
2. ✅ **فلترة التاريخ حسب المستخدم/التاريخ**
3. ✅ **مقارنة قبل الاستيراد**

#### الأولوية المتوسطة (Medium Priority):
4. ✅ **تصدير/استيراد جزئي (حسب الفئة)**
5. ✅ **إحصائيات التاريخ**
6. ✅ **تصدير التاريخ**

#### الأولوية المنخفضة (Low Priority):
7. ✅ **مقارنة النسخ الاحتياطية**
8. ✅ **تصدير بصيغ متعددة (CSV, XML)**
9. ✅ **استيراد من URL**

---

## 📊 ملخص الميزات

| الميزة | الحالة | التطويرات المقترحة |
|--------|--------|---------------------|
| **النسخ الاحتياطي** | ✅ جاهز | نسخ تلقائية، مقارنة، تصدير |
| **الاستيراد/التصدير** | ✅ جاهز | جزئي، صيغ متعددة، مقارنة |
| **التاريخ** | ✅ جاهز | فلترة، إحصائيات، تصدير |

---

**تم إعداد الدليل بواسطة:** AI Assistant  
**آخر تحديث:** 2025-01-28

