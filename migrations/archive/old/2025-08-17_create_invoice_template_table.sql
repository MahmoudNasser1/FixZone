-- إنشاء جدول قوالب الفواتير
-- Migration: Create InvoiceTemplate table for invoice templates system

USE FZ;

CREATE TABLE IF NOT EXISTS InvoiceTemplate (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL COMMENT 'اسم القالب',
  type ENUM('standard', 'tax', 'commercial', 'service', 'receipt') DEFAULT 'standard' COMMENT 'نوع القالب',
  description TEXT COMMENT 'وصف القالب',
  
  -- محتوى القالب
  headerHTML TEXT COMMENT 'HTML الرأس',
  footerHTML TEXT COMMENT 'HTML التذييل', 
  stylesCSS TEXT COMMENT 'أنماط CSS مخصصة',
  settings JSON COMMENT 'إعدادات القالب (ألوان، خطوط، شعار، إلخ)',
  
  -- حالة القالب
  isDefault BOOLEAN DEFAULT FALSE COMMENT 'هل هو القالب الافتراضي لهذا النوع',
  isActive BOOLEAN DEFAULT TRUE COMMENT 'هل القالب نشط',
  
  -- تواريخ النظام
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL COMMENT 'تاريخ الحذف المنطقي',
  
  -- فهارس
  INDEX idx_template_type (type),
  INDEX idx_template_default (isDefault),
  INDEX idx_template_active (isActive),
  INDEX idx_template_deleted (deletedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='قوالب الفواتير';

-- إدراج قوالب افتراضية مصرية
INSERT INTO InvoiceTemplate (name, type, description, isDefault, headerHTML, footerHTML, stylesCSS, settings) VALUES 
(
  'القالب الأساسي', 
  'standard', 
  'قالب فاتورة أساسي للاستخدام العام',
  TRUE,
  '<div class="company-info"><h1>{{companyName}}</h1><p>{{companyAddress}}</p><p>هاتف: {{companyPhone}} | إيميل: {{companyEmail}}</p></div>',
  '<p>شكرًا لتعاملكم معنا</p><p>{{footerText}}</p>',
  '.invoice-container { max-width: 800px; margin: 0 auto; } .header { border-bottom: 2px solid #333; padding-bottom: 20px; }',
  JSON_OBJECT(
    'companyName', 'شركة فيكس زون',
    'companyAddress', 'القاهرة، جمهورية مصر العربية',
    'companyPhone', '+20-10-1234567',
    'companyEmail', 'info@fixzone.eg',
    'currency', 'ج.م',
    'footerText', 'جميع الحقوق محفوظة © 2025'
  )
),
(
  'قالب ضريبي', 
  'tax', 
  'قالب فاتورة ضريبية متوافق مع متطلبات الضريبة المصرية',
  TRUE,
  '<div class="company-info"><h1>{{companyName}}</h1><p>الرقم الضريبي: {{taxNumber}}</p><p>{{companyAddress}}</p></div>',
  '<p>فاتورة ضريبية معتمدة</p><p>{{footerText}}</p>',
  '.tax-info { background: #f0f8ff; padding: 10px; border: 1px solid #0066cc; margin: 10px 0; }',
  JSON_OBJECT(
    'companyName', 'شركة فيكس زون',
    'taxNumber', '123-456-789',
    'companyAddress', 'القاهرة، جمهورية مصر العربية',
    'currency', 'ج.م',
    'showTaxDetails', true,
    'footerText', 'فاتورة ضريبية معتمدة'
  )
),
(
  'إيصال بسيط', 
  'receipt', 
  'إيصال بسيط للمدفوعات السريعة',
  TRUE,
  '<div class="receipt-header"><h2>إيصال استلام</h2><p>{{companyName}}</p></div>',
  '<p>تم الاستلام بتاريخ: {{currentDate}}</p>',
  '.receipt-header { text-align: center; border-bottom: 1px dashed #333; } .receipt-container { max-width: 400px; font-size: 14px; }',
  JSON_OBJECT(
    'companyName', 'فيكس زون',
    'currency', 'ج.م',
    'showMinimalInfo', true
  )
);
