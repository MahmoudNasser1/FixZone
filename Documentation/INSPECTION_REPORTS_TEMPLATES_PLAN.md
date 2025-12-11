# 📋 خطة تفصيلية: Report Templates (قوالب التقارير)

## 📊 نظرة عامة

**الهدف:** إنشاء نظام قوالب جاهزة للتقارير لتوفير الوقت وتحسين الاتساق في كتابة التقارير.

**الوقت المتوقع:** 4-6 ساعات  
**الأولوية:** 🟢 منخفضة (تحسين مستقبلي)  
**التعقيد:** متوسط

---

## 🎯 الأهداف

1. ✅ إمكانية حفظ قوالب جاهزة للتقارير
2. ✅ استخدام القوالب عند إنشاء تقرير جديد
3. ✅ إدارة القوالب (إنشاء، تعديل، حذف)
4. ✅ قوالب افتراضية لأنواع الفحص المختلفة
5. ✅ إمكانية مشاركة القوالب بين المستخدمين

---

## 🏗️ التصميم

### 1. قاعدة البيانات

#### جدول `ReportTemplate`

```sql
CREATE TABLE `ReportTemplate` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL COMMENT 'اسم القالب',
  `description` text DEFAULT NULL COMMENT 'وصف القالب',
  `inspectionTypeId` int(11) DEFAULT NULL COMMENT 'نوع الفحص المرتبط',
  `summary` text DEFAULT NULL COMMENT 'ملخص افتراضي',
  `result` text DEFAULT NULL COMMENT 'نتيجة افتراضية',
  `recommendations` text DEFAULT NULL COMMENT 'توصيات افتراضية',
  `notes` text DEFAULT NULL COMMENT 'ملاحظات افتراضية',
  `isDefault` tinyint(1) DEFAULT 0 COMMENT 'هل هو قالب افتراضي',
  `isPublic` tinyint(1) DEFAULT 0 COMMENT 'هل القالب عام (يمكن للجميع استخدامه)',
  `createdBy` int(11) DEFAULT NULL COMMENT 'منشئ القالب',
  `usageCount` int(11) DEFAULT 0 COMMENT 'عدد مرات الاستخدام',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_inspectionTypeId` (`inspectionTypeId`),
  KEY `idx_createdBy` (`createdBy`),
  KEY `idx_deletedAt` (`deletedAt`),
  FOREIGN KEY (`inspectionTypeId`) REFERENCES `InspectionType` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`createdBy`) REFERENCES `User` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**الحقول:**
- `name`: اسم القالب (مثل "فحص مبدئي - لابتوب")
- `description`: وصف القالب
- `inspectionTypeId`: نوع الفحص المرتبط (اختياري)
- `summary`, `result`, `recommendations`, `notes`: محتوى القالب
- `isDefault`: قالب افتراضي (يظهر أولاً)
- `isPublic`: قالب عام (يمكن للجميع استخدامه)
- `createdBy`: منشئ القالب
- `usageCount`: عدد مرات الاستخدام (للمقاييس)

---

### 2. Backend API

#### الملف: `backend/routes/reportTemplates.js`

```javascript
const express = require('express');
const router = express.Router();
const db = require('../db');
// const authMiddleware = require('../middleware/auth'); // للمستقبل

// GET /api/reporttemplates - جلب جميع القوالب
router.get('/', async (req, res) => {
  try {
    const { inspectionTypeId, isPublic, createdBy } = req.query;
    
    let query = `
      SELECT 
        rt.*,
        it.name as inspectionTypeName,
        u.name as createdByName
      FROM ReportTemplate rt
      LEFT JOIN InspectionType it ON rt.inspectionTypeId = it.id AND it.deletedAt IS NULL
      LEFT JOIN User u ON rt.createdBy = u.id AND u.deletedAt IS NULL
      WHERE rt.deletedAt IS NULL
    `;
    const params = [];
    
    if (inspectionTypeId) {
      query += ' AND rt.inspectionTypeId = ?';
      params.push(inspectionTypeId);
    }
    if (isPublic !== undefined) {
      query += ' AND rt.isPublic = ?';
      params.push(isPublic === 'true' ? 1 : 0);
    }
    if (createdBy) {
      query += ' AND rt.createdBy = ?';
      params.push(createdBy);
    }
    
    query += ' ORDER BY rt.isDefault DESC, rt.usageCount DESC, rt.createdAt DESC';
    
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching report templates:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// GET /api/reporttemplates/:id - جلب قالب محدد
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT 
        rt.*,
        it.name as inspectionTypeName,
        u.name as createdByName
      FROM ReportTemplate rt
      LEFT JOIN InspectionType it ON rt.inspectionTypeId = it.id AND it.deletedAt IS NULL
      LEFT JOIN User u ON rt.createdBy = u.id AND u.deletedAt IS NULL
      WHERE rt.id = ? AND rt.deletedAt IS NULL
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(`Error fetching template ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// POST /api/reporttemplates - إنشاء قالب جديد
router.post('/', async (req, res) => {
  const { name, description, inspectionTypeId, summary, result, recommendations, notes, isDefault, isPublic, createdBy } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, error: 'Name is required' });
  }
  
  try {
    // Validate inspectionTypeId if provided
    if (inspectionTypeId) {
      const [it] = await db.query('SELECT id FROM InspectionType WHERE id = ? AND deletedAt IS NULL', [inspectionTypeId]);
      if (!it || it.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid inspectionTypeId' });
      }
    }
    
    const [resultQuery] = await db.query(
      `INSERT INTO ReportTemplate 
       (name, description, inspectionTypeId, summary, result, recommendations, notes, isDefault, isPublic, createdBy) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description || null, inspectionTypeId || null, summary || null, result || null, recommendations || null, notes || null, isDefault ? 1 : 0, isPublic ? 1 : 0, createdBy || null]
    );
    
    // Fetch the created template
    const [created] = await db.query(`
      SELECT 
        rt.*,
        it.name as inspectionTypeName,
        u.name as createdByName
      FROM ReportTemplate rt
      LEFT JOIN InspectionType it ON rt.inspectionTypeId = it.id AND it.deletedAt IS NULL
      LEFT JOIN User u ON rt.createdBy = u.id AND u.deletedAt IS NULL
      WHERE rt.id = ?
    `, [resultQuery.insertId]);
    
    res.status(201).json({ success: true, data: created[0] });
  } catch (err) {
    console.error('Error creating template:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// PUT /api/reporttemplates/:id - تحديث قالب
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, inspectionTypeId, summary, result, recommendations, notes, isDefault, isPublic } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, error: 'Name is required' });
  }
  
  try {
    // Check if template exists
    const [existing] = await db.query('SELECT id FROM ReportTemplate WHERE id = ? AND deletedAt IS NULL', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    // Validate inspectionTypeId if provided
    if (inspectionTypeId) {
      const [it] = await db.query('SELECT id FROM InspectionType WHERE id = ? AND deletedAt IS NULL', [inspectionTypeId]);
      if (!it || it.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid inspectionTypeId' });
      }
    }
    
    const [resultQuery] = await db.query(
      `UPDATE ReportTemplate 
       SET name = ?, description = ?, inspectionTypeId = ?, summary = ?, result = ?, 
           recommendations = ?, notes = ?, isDefault = ?, isPublic = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ? AND deletedAt IS NULL`,
      [name, description || null, inspectionTypeId || null, summary || null, result || null, recommendations || null, notes || null, isDefault ? 1 : 0, isPublic ? 1 : 0, id]
    );
    
    if (resultQuery.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    // Fetch updated template
    const [updated] = await db.query(`
      SELECT 
        rt.*,
        it.name as inspectionTypeName,
        u.name as createdByName
      FROM ReportTemplate rt
      LEFT JOIN InspectionType it ON rt.inspectionTypeId = it.id AND it.deletedAt IS NULL
      LEFT JOIN User u ON rt.createdBy = u.id AND u.deletedAt IS NULL
      WHERE rt.id = ?
    `, [id]);
    
    res.json({ success: true, data: updated[0] });
  } catch (err) {
    console.error(`Error updating template ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// DELETE /api/reporttemplates/:id - حذف قالب (soft delete)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      'UPDATE ReportTemplate SET deletedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (err) {
    console.error(`Error deleting template ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// POST /api/reporttemplates/:id/use - زيادة عداد الاستخدام
router.post('/:id/use', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      'UPDATE ReportTemplate SET usageCount = usageCount + 1 WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    res.json({ success: true, message: 'Usage count updated' });
  } catch (err) {
    console.error(`Error updating usage count for template ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

module.exports = router;
```

#### تسجيل Route في `backend/server.js`:

```javascript
// Add after other routes
const reportTemplatesRoutes = require('./routes/reportTemplates');
app.use('/api/reporttemplates', reportTemplatesRoutes);
```

---

### 3. Migration Script

#### الملف: `migrations/create_report_templates_table.sql`

```sql
-- Migration: Create ReportTemplate table
-- Date: 2025-12-10
-- Description: Create table for report templates

CREATE TABLE IF NOT EXISTS `ReportTemplate` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL COMMENT 'اسم القالب',
  `description` text DEFAULT NULL COMMENT 'وصف القالب',
  `inspectionTypeId` int(11) DEFAULT NULL COMMENT 'نوع الفحص المرتبط',
  `summary` text DEFAULT NULL COMMENT 'ملخص افتراضي',
  `result` text DEFAULT NULL COMMENT 'نتيجة افتراضية',
  `recommendations` text DEFAULT NULL COMMENT 'توصيات افتراضية',
  `notes` text DEFAULT NULL COMMENT 'ملاحظات افتراضية',
  `isDefault` tinyint(1) DEFAULT 0 COMMENT 'هل هو قالب افتراضي',
  `isPublic` tinyint(1) DEFAULT 0 COMMENT 'هل القالب عام (يمكن للجميع استخدامه)',
  `createdBy` int(11) DEFAULT NULL COMMENT 'منشئ القالب',
  `usageCount` int(11) DEFAULT 0 COMMENT 'عدد مرات الاستخدام',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_inspectionTypeId` (`inspectionTypeId`),
  KEY `idx_createdBy` (`createdBy`),
  KEY `idx_deletedAt` (`deletedAt`),
  CONSTRAINT `fk_reporttemplate_inspectiontype` FOREIGN KEY (`inspectionTypeId`) REFERENCES `InspectionType` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_reporttemplate_createdby` FOREIGN KEY (`createdBy`) REFERENCES `User` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default templates
INSERT INTO `ReportTemplate` (`name`, `description`, `summary`, `result`, `recommendations`, `isDefault`, `isPublic`) VALUES
('فحص مبدئي - عام', 'قالب للفحص المبدئي العام', 'تم فحص الجهاز بشكل مبدئي', 'الجهاز يحتاج فحص تفصيلي', 'يُنصح بإجراء فحص تفصيلي', 1, 1),
('فحص نهائي - عام', 'قالب للفحص النهائي العام', 'تم فحص الجهاز بشكل نهائي', 'الجهاز جاهز للتسليم', 'الجهاز جاهز للتسليم للعميل', 1, 1);
```

---

### 4. Frontend Implementation

#### أ) API Service

**الملف:** `frontend/react-app/src/services/api.js`

```javascript
// Add to apiService class

async getReportTemplates(filters = {}) {
  const params = new URLSearchParams();
  if (filters.inspectionTypeId) params.append('inspectionTypeId', filters.inspectionTypeId);
  if (filters.isPublic !== undefined) params.append('isPublic', filters.isPublic);
  if (filters.createdBy) params.append('createdBy', filters.createdBy);
  
  const queryString = params.toString();
  return this.request(`/reporttemplates${queryString ? `?${queryString}` : ''}`);
}

async getReportTemplate(id) {
  return this.request(`/reporttemplates/${id}`);
}

async createReportTemplate(templateData) {
  return this.request('/reporttemplates', {
    method: 'POST',
    body: JSON.stringify(templateData),
  });
}

async updateReportTemplate(id, templateData) {
  return this.request(`/reporttemplates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(templateData),
  });
}

async deleteReportTemplate(id) {
  return this.request(`/reporttemplates/${id}`, {
    method: 'DELETE',
  });
}

async useReportTemplate(id) {
  return this.request(`/reporttemplates/${id}/use`, {
    method: 'POST',
  });
}
```

#### ب) Component: ReportTemplateSelector

**الملف:** `frontend/react-app/src/components/reports/ReportTemplateSelector.js`

```javascript
import React, { useState, useEffect } from 'react';
import { FileText, Loader2, Check } from 'lucide-react';
import apiService from '../../services/api';
import SimpleButton from '../ui/SimpleButton';
import Input from '../ui/Input';

const ReportTemplateSelector = ({ inspectionTypeId, onSelectTemplate, className = '' }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, [inspectionTypeId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (inspectionTypeId) filters.inspectionTypeId = inspectionTypeId;
      filters.isPublic = true; // Load public templates
      
      const response = await apiService.getReportTemplates(filters);
      const templatesList = response.success && response.data ? response.data : (Array.isArray(response) ? response : []);
      setTemplates(templatesList);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (template) => {
    setSelectedTemplateId(template.id);
    
    // Update usage count
    try {
      await apiService.useReportTemplate(template.id);
    } catch (error) {
      console.warn('Failed to update usage count:', error);
    }
    
    // Call parent callback with template data
    if (onSelectTemplate) {
      onSelectTemplate({
        summary: template.summary || '',
        result: template.result || '',
        recommendations: template.recommendations || '',
        notes: template.notes || '',
      });
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin text-blue-600 ml-2" />
        <span className="text-gray-600">جاري تحميل القوالب...</span>
      </div>
    );
  }

  if (templates.length === 0) {
    return null; // Don't show if no templates
  }

  return (
    <div className={`border border-gray-200 rounded-lg p-4 bg-gray-50 ${className}`}>
      <div className="flex items-center mb-3">
        <FileText className="w-4 h-4 text-blue-600 ml-2" />
        <h4 className="font-semibold text-gray-900">اختر قالب جاهز</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {templates.map(template => (
          <button
            key={template.id}
            onClick={() => handleSelectTemplate(template)}
            className={`p-3 text-right rounded-md border transition-all ${
              selectedTemplateId === template.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm text-gray-900">{template.name}</span>
              {selectedTemplateId === template.id && (
                <Check className="w-4 h-4 text-blue-600" />
              )}
            </div>
            {template.description && (
              <p className="text-xs text-gray-600 mt-1">{template.description}</p>
            )}
            {template.inspectionTypeName && (
              <span className="text-xs text-blue-600 mt-1 block">{template.inspectionTypeName}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReportTemplateSelector;
```

#### ج) تحديث RepairDetailsPage.js

**في modal إنشاء التقرير:**

```javascript
import ReportTemplateSelector from '../../components/reports/ReportTemplateSelector';

// في InspectionReportModal
const [selectedTemplate, setSelectedTemplate] = useState(null);

// في JSX
<ReportTemplateSelector
  inspectionTypeId={inspectionForm.inspectionTypeId}
  onSelectTemplate={(templateData) => {
    setInspectionForm(prev => ({
      ...prev,
      summary: templateData.summary || prev.summary,
      result: templateData.result || prev.result,
      recommendations: templateData.recommendations || prev.recommendations,
      notes: templateData.notes || prev.notes,
    }));
  }}
  className="mb-4"
/>
```

#### د) صفحة إدارة القوالب (اختياري)

**الملف:** `frontend/react-app/src/pages/reports/ReportTemplatesPage.js`

```javascript
import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Trash2, Star, Users } from 'lucide-react';
import apiService from '../../services/api';
import SimpleCard from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import Input from '../../components/ui/Input';
import NotificationSystem from '../../components/ui/NotificationSystem';

const ReportTemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    inspectionTypeId: '',
    summary: '',
    result: '',
    recommendations: '',
    notes: '',
    isDefault: false,
    isPublic: false,
  });
  const notifications = NotificationSystem();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiService.getReportTemplates();
      const templatesList = response.success && response.data ? response.data : (Array.isArray(response) ? response : []);
      setTemplates(templatesList);
    } catch (error) {
      console.error('Error loading templates:', error);
      notifications.error('تعذر تحميل القوالب');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      if (editingTemplate) {
        await apiService.updateReportTemplate(editingTemplate.id, formData);
        notifications.success('تم تحديث القالب بنجاح');
      } else {
        await apiService.createReportTemplate({
          ...formData,
          createdBy: 1, // TODO: Get from auth context
        });
        notifications.success('تم إنشاء القالب بنجاح');
      }
      setFormOpen(false);
      setEditingTemplate(null);
      setFormData({
        name: '',
        description: '',
        inspectionTypeId: '',
        summary: '',
        result: '',
        recommendations: '',
        notes: '',
        isDefault: false,
        isPublic: false,
      });
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      notifications.error('تعذر حفظ القالب');
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا القالب؟')) return;
    try {
      await apiService.deleteReportTemplate(id);
      notifications.success('تم حذف القالب بنجاح');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      notifications.error('تعذر حذف القالب');
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      inspectionTypeId: template.inspectionTypeId || '',
      summary: template.summary || '',
      result: template.result || '',
      recommendations: template.recommendations || '',
      notes: template.notes || '',
      isDefault: template.isDefault || false,
      isPublic: template.isPublic || false,
    });
    setFormOpen(true);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">إدارة قوالب التقارير</h1>
        <SimpleButton onClick={() => {
          setEditingTemplate(null);
          setFormData({
            name: '',
            description: '',
            inspectionTypeId: '',
            summary: '',
            result: '',
            recommendations: '',
            notes: '',
            isDefault: false,
            isPublic: false,
          });
          setFormOpen(true);
        }}>
          <Plus className="w-4 h-4 ml-1" /> إنشاء قالب جديد
        </SimpleButton>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <SimpleCard key={template.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    {template.name}
                    {template.isDefault && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                    {template.isPublic && <Users className="w-4 h-4 text-green-500" />}
                  </h3>
                  {template.description && (
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  )}
                  {template.inspectionTypeName && (
                    <span className="text-xs text-blue-600 mt-1 block">{template.inspectionTypeName}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <SimpleButton size="sm" variant="outline" onClick={() => handleEditTemplate(template)}>
                    <Edit className="w-4 h-4" />
                  </SimpleButton>
                  <SimpleButton size="sm" variant="outline" className="text-red-600" onClick={() => handleDeleteTemplate(template.id)}>
                    <Trash2 className="w-4 h-4" />
                  </SimpleButton>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                <p>عدد الاستخدامات: {template.usageCount || 0}</p>
                {template.createdByName && <p>منشئ: {template.createdByName}</p>}
              </div>
            </SimpleCard>
          ))}
        </div>
      )}

      {/* Modal for create/edit */}
      {formOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingTemplate ? 'تعديل القالب' : 'إنشاء قالب جديد'}</h2>
            
            <div className="space-y-4">
              <Input
                label="اسم القالب"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="الوصف"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                type="textarea"
              />
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="ml-2"
                  />
                  قالب افتراضي
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="ml-2"
                  />
                  قالب عام
                </label>
              </div>
              <Input
                label="الملخص"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                type="textarea"
              />
              <Input
                label="النتيجة"
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                type="textarea"
              />
              <Input
                label="التوصيات"
                value={formData.recommendations}
                onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                type="textarea"
              />
              <Input
                label="ملاحظات"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                type="textarea"
              />
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <SimpleButton variant="outline" onClick={() => {
                setFormOpen(false);
                setEditingTemplate(null);
              }}>
                إلغاء
              </SimpleButton>
              <SimpleButton onClick={handleSaveTemplate}>
                حفظ
              </SimpleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportTemplatesPage;
```

---

## 📝 خطوات التنفيذ

### المرحلة 1: قاعدة البيانات (30 دقيقة)

1. ✅ إنشاء ملف migration: `migrations/create_report_templates_table.sql`
2. ✅ تنفيذ migration على قاعدة البيانات
3. ✅ إدراج قوالب افتراضية

### المرحلة 2: Backend (1.5-2 ساعة)

1. ✅ إنشاء `backend/routes/reportTemplates.js`
2. ✅ تسجيل route في `backend/server.js`
3. ✅ اختبار جميع endpoints باستخدام Postman/curl

### المرحلة 3: Frontend API Service (30 دقيقة)

1. ✅ إضافة methods في `api.js`
2. ✅ اختبار الاتصال مع Backend

### المرحلة 4: Frontend Components (1.5-2 ساعة)

1. ✅ إنشاء `ReportTemplateSelector` component
2. ✅ دمج `ReportTemplateSelector` في `RepairDetailsPage.js`
3. ✅ (اختياري) إنشاء صفحة إدارة القوالب

### المرحلة 5: الاختبار (30 دقيقة)

1. ✅ اختبار إنشاء قالب جديد
2. ✅ اختبار استخدام قالب عند إنشاء تقرير
3. ✅ اختبار تحديث وحذف قالب
4. ✅ اختبار القوالب الافتراضية

---

## ✅ Checklist

- [ ] Migration script جاهز ومنفذ
- [ ] Backend routes جاهزة ومختبرة
- [ ] API Service methods مضافة
- [ ] ReportTemplateSelector component جاهز
- [ ] Integration في RepairDetailsPage
- [ ] (اختياري) صفحة إدارة القوالب
- [ ] الاختبارات النهائية

---

## 🎯 النتيجة المتوقعة

بعد التنفيذ:
- ✅ يمكن للمستخدمين حفظ قوالب جاهزة
- ✅ يمكن استخدام القوالب عند إنشاء تقرير جديد
- ✅ توفير الوقت في كتابة التقارير
- ✅ تحسين الاتساق في التقارير

---

**تاريخ الإنشاء:** 2025-12-10  
**الإصدار:** 1.0

