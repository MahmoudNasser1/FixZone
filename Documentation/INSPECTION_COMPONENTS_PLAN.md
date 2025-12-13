# 🔧 خطة تفصيلية: Inspection Components (مكونات الفحص)

## 📊 نظرة عامة

**الهدف:** تطوير نظام مكونات الفحص التفصيلي الذي يسمح بتقسيم التقرير إلى مكونات منفصلة (مثل: الشاشة، البطارية، لوحة المفاتيح، إلخ) مع إمكانية تتبع حالة كل مكون بشكل منفصل.

**الوقت المتوقع:** 8-10 ساعات  
**الأولوية:** 🟢 منخفضة (تحسين مستقبلي)  
**التعقيد:** عالي

---

## 🎯 الأهداف

1. ✅ إمكانية إضافة مكونات فحص منفصلة لكل تقرير
2. ✅ تتبع حالة كل مكون (سليم، معطل، يحتاج إصلاح)
3. ✅ إضافة ملاحظات وصور لكل مكون
4. ✅ تحديد أولوية المكونات
5. ✅ ربط المكونات بقطع الغيار المستخدمة
6. ✅ عرض تفصيلي للمكونات في التقرير

---

## 🏗️ التصميم

### 1. قاعدة البيانات

#### جدول `InspectionComponent` (موجود - يحتاج تحسين)

**البنية الحالية:**
```sql
CREATE TABLE `InspectionComponent` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `inspectionReportId` int(11) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `priority` int(11) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`inspectionReportId`) REFERENCES `InspectionReport` (`id`)
)
```

**التحسينات المطلوبة:**
```sql
-- Migration: Enhance InspectionComponent table
-- Date: 2025-12-10
-- Description: Add soft delete, improve structure, add new fields

-- Add deletedAt for soft delete
ALTER TABLE `InspectionComponent` 
ADD COLUMN `deletedAt` datetime DEFAULT NULL AFTER `updatedAt`;

-- Add index for better performance
CREATE INDEX `idx_inspectioncomponent_deletedAt` ON `InspectionComponent`(`deletedAt`);
CREATE INDEX `idx_inspectioncomponent_reportId` ON `InspectionComponent`(`inspectionReportId`);

-- Add new fields for better tracking
ALTER TABLE `InspectionComponent` 
ADD COLUMN `componentType` varchar(100) DEFAULT NULL COMMENT 'نوع المكون (screen, battery, keyboard, etc.)' AFTER `name`,
ADD COLUMN `condition` varchar(50) DEFAULT NULL COMMENT 'حالة المكون (excellent, good, fair, poor)' AFTER `status`,
ADD COLUMN `estimatedCost` decimal(10,2) DEFAULT NULL COMMENT 'التكلفة المتوقعة للإصلاح' AFTER `priority`,
ADD COLUMN `partsUsedId` int(11) DEFAULT NULL COMMENT 'رابط بقطع الغيار المستخدمة' AFTER `photo`,
ADD COLUMN `isReplaced` tinyint(1) DEFAULT 0 COMMENT 'هل تم استبدال المكون' AFTER `partsUsedId`,
ADD COLUMN `replacedAt` datetime DEFAULT NULL COMMENT 'تاريخ الاستبدال' AFTER `isReplaced`;

-- Add foreign key for partsUsedId
ALTER TABLE `InspectionComponent` 
ADD CONSTRAINT `fk_inspectioncomponent_partsused` 
FOREIGN KEY (`partsUsedId`) REFERENCES `PartsUsed` (`id`) ON DELETE SET NULL;

-- Update status enum values (if needed)
-- Status values: 'working', 'not_working', 'needs_repair', 'replaced', 'not_applicable'
```

#### جدول `ComponentTemplate` (جديد - قوالب المكونات)

```sql
CREATE TABLE `ComponentTemplate` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL COMMENT 'اسم المكون',
  `componentType` varchar(100) DEFAULT NULL COMMENT 'نوع المكون',
  `description` text DEFAULT NULL COMMENT 'وصف المكون',
  `deviceType` varchar(100) DEFAULT NULL COMMENT 'نوع الجهاز (laptop, phone, tablet, etc.)',
  `defaultStatus` varchar(50) DEFAULT 'working' COMMENT 'الحالة الافتراضية',
  `defaultPriority` int(11) DEFAULT 3 COMMENT 'الأولوية الافتراضية (1-5)',
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_componenttemplate_type` (`componentType`),
  KEY `idx_componenttemplate_devicetype` (`deviceType`),
  KEY `idx_componenttemplate_deletedAt` (`deletedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default component templates
INSERT INTO `ComponentTemplate` (`name`, `componentType`, `description`, `deviceType`, `defaultPriority`) VALUES
('الشاشة', 'screen', 'شاشة العرض', 'laptop', 5),
('البطارية', 'battery', 'بطارية الجهاز', 'laptop', 4),
('لوحة المفاتيح', 'keyboard', 'لوحة المفاتيح', 'laptop', 3),
('لوحة اللمس', 'touchpad', 'لوحة اللمس', 'laptop', 2),
('المروحة', 'fan', 'مروحة التبريد', 'laptop', 3),
('السماعات', 'speakers', 'سماعات الجهاز', 'laptop', 2),
('الكاميرا', 'camera', 'كاميرا الويب', 'laptop', 1),
('منافذ USB', 'ports', 'منافذ USB', 'laptop', 2),
('الشاحن', 'charger', 'شاحن الجهاز', 'laptop', 4),
('الهارد ديسك', 'storage', 'وحدة التخزين', 'laptop', 5),
('الرام', 'memory', 'ذاكرة الوصول العشوائي', 'laptop', 4),
('المعالج', 'processor', 'المعالج', 'laptop', 5);
```

---

### 2. Backend API

#### الملف: `backend/routes/inspectionComponents.js` (تحسين الموجود)

```javascript
const express = require('express');
const router = express.Router();
const db = require('../db');
const websocketService = require('../services/websocketService');

// GET /api/inspectioncomponents - جلب جميع المكونات أو حسب reportId
router.get('/', async (req, res) => {
  try {
    const { reportId, componentType, status } = req.query;
    
    let query = `
      SELECT 
        ic.*,
        pu.inventoryItemId,
        pu.quantity,
        ii.name as partName
      FROM InspectionComponent ic
      LEFT JOIN PartsUsed pu ON ic.partsUsedId = pu.id AND pu.deletedAt IS NULL
      LEFT JOIN InventoryItem ii ON pu.inventoryItemId = ii.id AND ii.deletedAt IS NULL
      WHERE ic.deletedAt IS NULL
    `;
    const params = [];
    
    if (reportId) {
      query += ' AND ic.inspectionReportId = ?';
      params.push(reportId);
    }
    if (componentType) {
      query += ' AND ic.componentType = ?';
      params.push(componentType);
    }
    if (status) {
      query += ' AND ic.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY ic.priority DESC, ic.createdAt ASC';
    
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching inspection components:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// GET /api/inspectioncomponents/:id - جلب مكون محدد
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT 
        ic.*,
        pu.inventoryItemId,
        pu.quantity,
        ii.name as partName
      FROM InspectionComponent ic
      LEFT JOIN PartsUsed pu ON ic.partsUsedId = pu.id AND pu.deletedAt IS NULL
      LEFT JOIN InventoryItem ii ON pu.inventoryItemId = ii.id AND ii.deletedAt IS NULL
      WHERE ic.id = ? AND ic.deletedAt IS NULL
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Component not found' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(`Error fetching component ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// POST /api/inspectioncomponents - إنشاء مكون جديد
router.post('/', async (req, res) => {
  const { 
    inspectionReportId, 
    name, 
    componentType,
    status, 
    condition,
    notes, 
    priority, 
    photo,
    estimatedCost,
    partsUsedId
  } = req.body;
  
  if (!inspectionReportId || !name || !status) {
    return res.status(400).json({ success: false, error: 'inspectionReportId, name, and status are required' });
  }
  
  try {
    // Validate inspectionReportId
    const [report] = await db.query('SELECT id FROM InspectionReport WHERE id = ? AND deletedAt IS NULL', [inspectionReportId]);
    if (!report || report.length === 0) {
      return res.status(404).json({ success: false, error: 'Inspection report not found' });
    }
    
    // Validate partsUsedId if provided
    if (partsUsedId) {
      const [part] = await db.query('SELECT id FROM PartsUsed WHERE id = ? AND deletedAt IS NULL', [partsUsedId]);
      if (!part || part.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid partsUsedId' });
      }
    }
    
    const [result] = await db.query(
      `INSERT INTO InspectionComponent 
       (inspectionReportId, name, componentType, status, condition, notes, priority, photo, estimatedCost, partsUsedId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        inspectionReportId, 
        name, 
        componentType || null,
        status, 
        condition || null,
        notes || null, 
        priority || 3, 
        photo || null,
        estimatedCost || null,
        partsUsedId || null
      ]
    );
    
    // Fetch created component
    const [created] = await db.query(`
      SELECT 
        ic.*,
        pu.inventoryItemId,
        pu.quantity,
        ii.name as partName
      FROM InspectionComponent ic
      LEFT JOIN PartsUsed pu ON ic.partsUsedId = pu.id AND pu.deletedAt IS NULL
      LEFT JOIN InventoryItem ii ON pu.inventoryItemId = ii.id AND ii.deletedAt IS NULL
      WHERE ic.id = ?
    `, [result.insertId]);
    
    // Send WebSocket notification
    try {
      const [repairRows] = await db.query(
        'SELECT * FROM RepairRequest WHERE id = (SELECT repairRequestId FROM InspectionReport WHERE id = ?) AND deletedAt IS NULL',
        [inspectionReportId]
      );
      if (repairRows && repairRows.length > 0) {
        websocketService.sendRepairUpdate('component_created', repairRows[0]);
      }
    } catch (wsError) {
      console.warn('[InspectionComponents] Failed to send WebSocket notification:', wsError);
    }
    
    res.status(201).json({ success: true, data: created[0] });
  } catch (err) {
    console.error('Error creating inspection component:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// PUT /api/inspectioncomponents/:id - تحديث مكون
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    componentType,
    status, 
    condition,
    notes, 
    priority, 
    photo,
    estimatedCost,
    partsUsedId,
    isReplaced,
    replacedAt
  } = req.body;
  
  if (!name || !status) {
    return res.status(400).json({ success: false, error: 'name and status are required' });
  }
  
  try {
    // Check if component exists
    const [existing] = await db.query('SELECT id, inspectionReportId FROM InspectionComponent WHERE id = ? AND deletedAt IS NULL', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Component not found' });
    }
    
    // Validate partsUsedId if provided
    if (partsUsedId) {
      const [part] = await db.query('SELECT id FROM PartsUsed WHERE id = ? AND deletedAt IS NULL', [partsUsedId]);
      if (!part || part.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid partsUsedId' });
      }
    }
    
    const [result] = await db.query(
      `UPDATE InspectionComponent 
       SET name = ?, componentType = ?, status = ?, condition = ?, notes = ?, priority = ?, 
           photo = ?, estimatedCost = ?, partsUsedId = ?, isReplaced = ?, replacedAt = ?, 
           updatedAt = CURRENT_TIMESTAMP
       WHERE id = ? AND deletedAt IS NULL`,
      [
        name, 
        componentType || null,
        status, 
        condition || null,
        notes || null, 
        priority || 3, 
        photo || null,
        estimatedCost || null,
        partsUsedId || null,
        isReplaced ? 1 : 0,
        replacedAt || null,
        id
      ]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Component not found' });
    }
    
    // Fetch updated component
    const [updated] = await db.query(`
      SELECT 
        ic.*,
        pu.inventoryItemId,
        pu.quantity,
        ii.name as partName
      FROM InspectionComponent ic
      LEFT JOIN PartsUsed pu ON ic.partsUsedId = pu.id AND pu.deletedAt IS NULL
      LEFT JOIN InventoryItem ii ON pu.inventoryItemId = ii.id AND ii.deletedAt IS NULL
      WHERE ic.id = ?
    `, [id]);
    
    // Send WebSocket notification
    try {
      const [repairRows] = await db.query(
        'SELECT * FROM RepairRequest WHERE id = (SELECT repairRequestId FROM InspectionReport WHERE id = ?) AND deletedAt IS NULL',
        [existing[0].inspectionReportId]
      );
      if (repairRows && repairRows.length > 0) {
        websocketService.sendRepairUpdate('component_updated', repairRows[0]);
      }
    } catch (wsError) {
      console.warn('[InspectionComponents] Failed to send WebSocket notification:', wsError);
    }
    
    res.json({ success: true, data: updated[0] });
  } catch (err) {
    console.error(`Error updating component ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// DELETE /api/inspectioncomponents/:id - حذف مكون (soft delete)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Get inspectionReportId before delete
    const [component] = await db.query('SELECT inspectionReportId FROM InspectionComponent WHERE id = ? AND deletedAt IS NULL', [id]);
    
    const [result] = await db.query(
      'UPDATE InspectionComponent SET deletedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Component not found' });
    }
    
    // Send WebSocket notification
    if (component && component.length > 0) {
      try {
        const [repairRows] = await db.query(
          'SELECT * FROM RepairRequest WHERE id = (SELECT repairRequestId FROM InspectionReport WHERE id = ?) AND deletedAt IS NULL',
          [component[0].inspectionReportId]
        );
        if (repairRows && repairRows.length > 0) {
          websocketService.sendRepairUpdate('component_deleted', repairRows[0]);
        }
      } catch (wsError) {
        console.warn('[InspectionComponents] Failed to send WebSocket notification:', wsError);
      }
    }
    
    res.json({ success: true, message: 'Component deleted successfully' });
  } catch (err) {
    console.error(`Error deleting component ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// GET /api/inspectioncomponents/templates - جلب قوالب المكونات
router.get('/templates', async (req, res) => {
  try {
    const { deviceType } = req.query;
    
    let query = 'SELECT * FROM ComponentTemplate WHERE deletedAt IS NULL AND isActive = 1';
    const params = [];
    
    if (deviceType) {
      query += ' AND (deviceType = ? OR deviceType IS NULL)';
      params.push(deviceType);
    }
    
    query += ' ORDER BY defaultPriority DESC, name ASC';
    
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching component templates:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

module.exports = router;
```

#### Routes للـ ComponentTemplate (اختياري)

**الملف:** `backend/routes/componentTemplates.js`

```javascript
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/componenttemplates
router.get('/', async (req, res) => {
  try {
    const { deviceType, componentType } = req.query;
    let query = 'SELECT * FROM ComponentTemplate WHERE deletedAt IS NULL AND isActive = 1';
    const params = [];
    
    if (deviceType) {
      query += ' AND (deviceType = ? OR deviceType IS NULL)';
      params.push(deviceType);
    }
    if (componentType) {
      query += ' AND componentType = ?';
      params.push(componentType);
    }
    
    query += ' ORDER BY defaultPriority DESC, name ASC';
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching component templates:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// POST /api/componenttemplates
router.post('/', async (req, res) => {
  const { name, componentType, description, deviceType, defaultStatus, defaultPriority, isActive } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: 'Name is required' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO ComponentTemplate (name, componentType, description, deviceType, defaultStatus, defaultPriority, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, componentType || null, description || null, deviceType || null, defaultStatus || 'working', defaultPriority || 3, isActive !== false ? 1 : 0]
    );
    const [created] = await db.query('SELECT * FROM ComponentTemplate WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: created[0] });
  } catch (err) {
    console.error('Error creating component template:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// PUT /api/componenttemplates/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, componentType, description, deviceType, defaultStatus, defaultPriority, isActive } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: 'Name is required' });
  }
  try {
    const [result] = await db.query(
      'UPDATE ComponentTemplate SET name = ?, componentType = ?, description = ?, deviceType = ?, defaultStatus = ?, defaultPriority = ?, isActive = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL',
      [name, componentType || null, description || null, deviceType || null, defaultStatus || 'working', defaultPriority || 3, isActive !== false ? 1 : 0, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    const [updated] = await db.query('SELECT * FROM ComponentTemplate WHERE id = ?', [id]);
    res.json({ success: true, data: updated[0] });
  } catch (err) {
    console.error(`Error updating template ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// DELETE /api/componenttemplates/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('UPDATE ComponentTemplate SET deletedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (err) {
    console.error(`Error deleting template ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

module.exports = router;
```

---

### 3. Migration Scripts

#### الملف: `migrations/enhance_inspection_components_table.sql`

```sql
-- Migration: Enhance InspectionComponent table
-- Date: 2025-12-10
-- Description: Add soft delete, improve structure, add new fields

-- Check if deletedAt exists
SET @dbname = DATABASE();
SET @tablename = 'InspectionComponent';
SET @columnname = 'deletedAt';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' datetime DEFAULT NULL')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_inspectioncomponent_deletedAt ON InspectionComponent(deletedAt);
CREATE INDEX IF NOT EXISTS idx_inspectioncomponent_reportId ON InspectionComponent(inspectionReportId);

-- Add new columns (check if they exist first)
-- componentType
SET @columnname = 'componentType';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' varchar(100) DEFAULT NULL COMMENT ''نوع المكون'' AFTER name')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- condition
SET @columnname = 'condition';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' varchar(50) DEFAULT NULL COMMENT ''حالة المكون'' AFTER status')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- estimatedCost
SET @columnname = 'estimatedCost';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' decimal(10,2) DEFAULT NULL COMMENT ''التكلفة المتوقعة'' AFTER priority')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- partsUsedId
SET @columnname = 'partsUsedId';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' int(11) DEFAULT NULL COMMENT ''رابط بقطع الغيار'' AFTER photo')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- isReplaced
SET @columnname = 'isReplaced';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' tinyint(1) DEFAULT 0 COMMENT ''هل تم استبدال المكون'' AFTER partsUsedId')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- replacedAt
SET @columnname = 'replacedAt';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' datetime DEFAULT NULL COMMENT ''تاريخ الاستبدال'' AFTER isReplaced')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add foreign key for partsUsedId (if table exists)
-- Note: This might fail if PartsUsed table doesn't exist, so we'll handle it gracefully
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_NAME = 'fk_inspectioncomponent_partsused' 
  AND TABLE_NAME = 'InspectionComponent' 
  AND TABLE_SCHEMA = @dbname);
SET @preparedStatement = IF(@fk_exists > 0,
  'SELECT 1',
  'ALTER TABLE InspectionComponent ADD CONSTRAINT fk_inspectioncomponent_partsused FOREIGN KEY (partsUsedId) REFERENCES PartsUsed(id) ON DELETE SET NULL');
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
```

#### الملف: `migrations/create_component_templates_table.sql`

```sql
-- Migration: Create ComponentTemplate table
-- Date: 2025-12-10
-- Description: Create table for component templates

CREATE TABLE IF NOT EXISTS `ComponentTemplate` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL COMMENT 'اسم المكون',
  `componentType` varchar(100) DEFAULT NULL COMMENT 'نوع المكون',
  `description` text DEFAULT NULL COMMENT 'وصف المكون',
  `deviceType` varchar(100) DEFAULT NULL COMMENT 'نوع الجهاز (laptop, phone, tablet, etc.)',
  `defaultStatus` varchar(50) DEFAULT 'working' COMMENT 'الحالة الافتراضية',
  `defaultPriority` int(11) DEFAULT 3 COMMENT 'الأولوية الافتراضية (1-5)',
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_componenttemplate_type` (`componentType`),
  KEY `idx_componenttemplate_devicetype` (`deviceType`),
  KEY `idx_componenttemplate_deletedAt` (`deletedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default component templates
INSERT INTO `ComponentTemplate` (`name`, `componentType`, `description`, `deviceType`, `defaultPriority`) VALUES
('الشاشة', 'screen', 'شاشة العرض', 'laptop', 5),
('البطارية', 'battery', 'بطارية الجهاز', 'laptop', 4),
('لوحة المفاتيح', 'keyboard', 'لوحة المفاتيح', 'laptop', 3),
('لوحة اللمس', 'touchpad', 'لوحة اللمس', 'laptop', 2),
('المروحة', 'fan', 'مروحة التبريد', 'laptop', 3),
('السماعات', 'speakers', 'سماعات الجهاز', 'laptop', 2),
('الكاميرا', 'camera', 'كاميرا الويب', 'laptop', 1),
('منافذ USB', 'ports', 'منافذ USB', 'laptop', 2),
('الشاحن', 'charger', 'شاحن الجهاز', 'laptop', 4),
('الهارد ديسك', 'storage', 'وحدة التخزين', 'laptop', 5),
('الرام', 'memory', 'ذاكرة الوصول العشوائي', 'laptop', 4),
('المعالج', 'processor', 'المعالج', 'laptop', 5);
```

---

### 4. Frontend Implementation

#### أ) API Service

**الملف:** `frontend/react-app/src/services/api.js`

```javascript
// Add to apiService class

async getInspectionComponents(filters = {}) {
  const params = new URLSearchParams();
  if (filters.reportId) params.append('reportId', filters.reportId);
  if (filters.componentType) params.append('componentType', filters.componentType);
  if (filters.status) params.append('status', filters.status);
  
  const queryString = params.toString();
  return this.request(`/inspectioncomponents${queryString ? `?${queryString}` : ''}`);
}

async getInspectionComponent(id) {
  return this.request(`/inspectioncomponents/${id}`);
}

async createInspectionComponent(componentData) {
  return this.request('/inspectioncomponents', {
    method: 'POST',
    body: JSON.stringify(componentData),
  });
}

async updateInspectionComponent(id, componentData) {
  return this.request(`/inspectioncomponents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(componentData),
  });
}

async deleteInspectionComponent(id) {
  return this.request(`/inspectioncomponents/${id}`, {
    method: 'DELETE',
  });
}

async getComponentTemplates(filters = {}) {
  const params = new URLSearchParams();
  if (filters.deviceType) params.append('deviceType', filters.deviceType);
  if (filters.componentType) params.append('componentType', filters.componentType);
  
  const queryString = params.toString();
  return this.request(`/inspectioncomponents/templates${queryString ? `?${queryString}` : ''}`);
}
```

#### ب) Component: InspectionComponentsList

**الملف:** `frontend/react-app/src/components/reports/InspectionComponentsList.js`

```javascript
import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Edit, Trash2, CheckCircle, XCircle, AlertCircle, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import apiService from '../../services/api';
import SimpleButton from '../ui/SimpleButton';
import SimpleCard from '../ui/SimpleCard';
import NotificationSystem from '../ui/NotificationSystem';

const InspectionComponentsList = ({ reportId, onComponentUpdate }) => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    componentType: '',
    status: 'working',
    condition: '',
    notes: '',
    priority: 3,
    estimatedCost: '',
    partsUsedId: null,
  });
  const notifications = NotificationSystem();

  useEffect(() => {
    if (reportId) {
      loadComponents();
    }
  }, [reportId]);

  const loadComponents = async () => {
    try {
      setLoading(true);
      const response = await apiService.getInspectionComponents({ reportId });
      const componentsList = response.success && response.data ? response.data : (Array.isArray(response) ? response : []);
      setComponents(componentsList);
    } catch (error) {
      console.error('Error loading components:', error);
      notifications.error('تعذر تحميل المكونات');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveComponent = async () => {
    try {
      if (editingComponent) {
        await apiService.updateInspectionComponent(editingComponent.id, {
          ...formData,
          inspectionReportId: reportId,
        });
        notifications.success('تم تحديث المكون بنجاح');
      } else {
        await apiService.createInspectionComponent({
          ...formData,
          inspectionReportId: reportId,
        });
        notifications.success('تم إضافة المكون بنجاح');
      }
      setFormOpen(false);
      setEditingComponent(null);
      setFormData({
        name: '',
        componentType: '',
        status: 'working',
        condition: '',
        notes: '',
        priority: 3,
        estimatedCost: '',
        partsUsedId: null,
      });
      loadComponents();
      if (onComponentUpdate) onComponentUpdate();
    } catch (error) {
      console.error('Error saving component:', error);
      notifications.error('تعذر حفظ المكون');
    }
  };

  const handleDeleteComponent = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المكون؟')) return;
    try {
      await apiService.deleteInspectionComponent(id);
      notifications.success('تم حذف المكون بنجاح');
      loadComponents();
      if (onComponentUpdate) onComponentUpdate();
    } catch (error) {
      console.error('Error deleting component:', error);
      notifications.error('تعذر حذف المكون');
    }
  };

  const handleEditComponent = (component) => {
    setEditingComponent(component);
    setFormData({
      name: component.name || '',
      componentType: component.componentType || '',
      status: component.status || 'working',
      condition: component.condition || '',
      notes: component.notes || '',
      priority: component.priority || 3,
      estimatedCost: component.estimatedCost || '',
      partsUsedId: component.partsUsedId || null,
    });
    setFormOpen(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'working':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'not_working':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'needs_repair':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'replaced':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <Wrench className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      working: 'سليم',
      not_working: 'معطل',
      needs_repair: 'يحتاج إصلاح',
      replaced: 'تم الاستبدال',
      not_applicable: 'غير قابل للتطبيق',
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority) => {
    if (priority >= 5) return 'bg-red-100 text-red-800';
    if (priority >= 4) return 'bg-orange-100 text-orange-800';
    if (priority >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Wrench className="w-5 h-5 ml-2" />
          مكونات الفحص
        </h3>
        <SimpleButton size="sm" onClick={() => {
          setEditingComponent(null);
          setFormData({
            name: '',
            componentType: '',
            status: 'working',
            condition: '',
            notes: '',
            priority: 3,
            estimatedCost: '',
            partsUsedId: null,
          });
          setFormOpen(true);
        }}>
          <Plus className="w-4 h-4 ml-1" /> إضافة مكون
        </SimpleButton>
      </div>

      {components.length === 0 ? (
        <p className="text-gray-600 text-center py-8">لا توجد مكونات فحص لهذا التقرير</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {components.map(component => (
            <SimpleCard key={component.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(component.status)}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{component.name}</h4>
                    {component.componentType && (
                      <p className="text-xs text-gray-600 mt-1">النوع: {component.componentType}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(component.priority)}`}>
                        أولوية: {component.priority}
                      </span>
                      <span className="text-xs text-gray-600">
                        {getStatusLabel(component.status)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <SimpleButton size="sm" variant="outline" onClick={() => handleEditComponent(component)}>
                    <Edit className="w-4 h-4" />
                  </SimpleButton>
                  <SimpleButton size="sm" variant="outline" className="text-red-600" onClick={() => handleDeleteComponent(component.id)}>
                    <Trash2 className="w-4 h-4" />
                  </SimpleButton>
                </div>
              </div>

              {component.condition && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">الحالة:</span> {component.condition}
                </p>
              )}

              {component.notes && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-700 mb-1">ملاحظات:</p>
                  <p className="text-sm text-gray-800 bg-gray-100 p-2 rounded-md whitespace-pre-wrap">{component.notes}</p>
                </div>
              )}

              {component.estimatedCost && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">التكلفة المتوقعة:</span> {Number(component.estimatedCost).toFixed(2)} جنيه
                </p>
              )}

              {component.partName && (
                <div className="mt-2 flex items-center gap-1 text-sm text-blue-600">
                  <LinkIcon className="w-4 h-4" />
                  <span>مرتبط بقطعة: {component.partName}</span>
                </div>
              )}

              {component.isReplaced && (
                <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>تم الاستبدال {component.replacedAt ? `في ${new Date(component.replacedAt).toLocaleDateString('ar-SA')}` : ''}</span>
                </div>
              )}
            </SimpleCard>
          ))}
        </div>
      )}

      {/* Modal for create/edit */}
      {formOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingComponent ? 'تعديل المكون' : 'إضافة مكون جديد'}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المكون *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع المكون</label>
                <input
                  type="text"
                  value={formData.componentType}
                  onChange={(e) => setFormData({ ...formData, componentType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="مثل: screen, battery, keyboard"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الحالة *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="working">سليم</option>
                  <option value="not_working">معطل</option>
                  <option value="needs_repair">يحتاج إصلاح</option>
                  <option value="replaced">تم الاستبدال</option>
                  <option value="not_applicable">غير قابل للتطبيق</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">حالة المكون</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">اختر الحالة</option>
                  <option value="excellent">ممتازة</option>
                  <option value="good">جيدة</option>
                  <option value="fair">متوسطة</option>
                  <option value="poor">ضعيفة</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الأولوية (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 3 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التكلفة المتوقعة</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.estimatedCost}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="4"
                  placeholder="ملاحظات إضافية عن المكون..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <SimpleButton variant="outline" onClick={() => {
                setFormOpen(false);
                setEditingComponent(null);
              }}>
                إلغاء
              </SimpleButton>
              <SimpleButton onClick={handleSaveComponent} disabled={!formData.name || !formData.status}>
                حفظ
              </SimpleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionComponentsList;
```

#### ج) تحديث RepairDetailsPage.js

**في tab "تقارير الفحص":**

```javascript
import InspectionComponentsList from '../../components/reports/InspectionComponentsList';

// في عرض التقرير
{report.summary && (
  <div className="mt-3">
    <p className="text-xs font-medium text-gray-700 mb-1">الملخص:</p>
    <p className="text-sm text-gray-800 bg-gray-100 p-2 rounded-md whitespace-pre-wrap">{report.summary}</p>
  </div>
)}

{/* إضافة قائمة المكونات */}
<InspectionComponentsList 
  reportId={report.id} 
  onComponentUpdate={() => {
    // Refresh reports if needed
    loadInspectionReports();
  }}
/>
```

---

## 📝 خطوات التنفيذ

### المرحلة 1: قاعدة البيانات (1-1.5 ساعة)

1. ✅ إنشاء migration: `migrations/enhance_inspection_components_table.sql`
2. ✅ إنشاء migration: `migrations/create_component_templates_table.sql`
3. ✅ تنفيذ migrations على قاعدة البيانات
4. ✅ التحقق من البنية

### المرحلة 2: Backend (2-3 ساعات)

1. ✅ تحديث `backend/routes/inspectionComponents.js`
2. ✅ إنشاء `backend/routes/componentTemplates.js` (اختياري)
3. ✅ تسجيل routes في `backend/server.js`
4. ✅ اختبار جميع endpoints

### المرحلة 3: Frontend API Service (30 دقيقة)

1. ✅ إضافة methods في `api.js`
2. ✅ اختبار الاتصال مع Backend

### المرحلة 4: Frontend Components (3-4 ساعات)

1. ✅ إنشاء `InspectionComponentsList` component
2. ✅ دمج `InspectionComponentsList` في `RepairDetailsPage.js`
3. ✅ (اختياري) إضافة ComponentTemplateSelector

### المرحلة 5: الاختبار (1 ساعة)

1. ✅ اختبار إضافة مكون جديد
2. ✅ اختبار تحديث وحذف مكون
3. ✅ اختبار ربط المكون بقطع الغيار
4. ✅ اختبار عرض المكونات في التقرير

---

## ✅ Checklist

- [ ] Migration scripts جاهزة ومنفذة
- [ ] Backend routes جاهزة ومختبرة
- [ ] API Service methods مضافة
- [ ] InspectionComponentsList component جاهز
- [ ] Integration في RepairDetailsPage
- [ ] (اختياري) ComponentTemplateSelector
- [ ] (اختياري) صفحة إدارة Component Templates
- [ ] الاختبارات النهائية

---

## 🎯 النتيجة المتوقعة

بعد التنفيذ:
- ✅ يمكن تقسيم التقرير إلى مكونات منفصلة
- ✅ تتبع حالة كل مكون بشكل منفصل
- ✅ ربط المكونات بقطع الغيار المستخدمة
- ✅ تقارير أكثر تفصيلاً ودقة
- ✅ تحسين تتبع الإصلاحات

---

## 📊 أمثلة الاستخدام

### مثال 1: فحص لابتوب

```
التقرير: فحص مبدئي - لابتوب Dell
المكونات:
1. الشاشة - حالة: معطل - أولوية: 5 - يحتاج استبدال
2. البطارية - حالة: يحتاج إصلاح - أولوية: 4 - عمرها قصير
3. لوحة المفاتيح - حالة: سليم - أولوية: 1
4. المروحة - حالة: يحتاج إصلاح - أولوية: 3 - صوت عالي
```

### مثال 2: ربط بقطع الغيار

```
المكون: الشاشة
الحالة: تم الاستبدال
مرتبط بقطعة: شاشة لابتوب Dell 15.6" (ID: 123)
تاريخ الاستبدال: 2025-12-10
```

---

**تاريخ الإنشاء:** 2025-12-10  
**الإصدار:** 1.0




