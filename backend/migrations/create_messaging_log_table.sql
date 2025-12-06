-- =====================================================
-- Migration: Create MessagingLog Table
-- Description: جدول لتسجيل جميع محاولات إرسال الرسائل
-- Date: 2025-01-12
-- =====================================================

CREATE TABLE IF NOT EXISTS MessagingLog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- معلومات الكيان المرتبط
    entityType ENUM('invoice', 'repair', 'quotation', 'payment', 'custom') NOT NULL COMMENT 'نوع الكيان',
    entityId INT NOT NULL COMMENT 'معرف الكيان',
    customerId INT COMMENT 'معرف العميل',
    
    -- معلومات القناة والمستلم
    channel ENUM('whatsapp', 'email', 'sms') NOT NULL COMMENT 'قناة الإرسال',
    recipient VARCHAR(255) NOT NULL COMMENT 'رقم الهاتف أو البريد الإلكتروني',
    
    -- محتوى الرسالة
    message TEXT NOT NULL COMMENT 'نص الرسالة',
    template VARCHAR(100) COMMENT 'اسم القالب المستخدم',
    subject VARCHAR(255) COMMENT 'عنوان الرسالة (للبريد الإلكتروني)',
    
    -- حالة الإرسال
    status ENUM('pending', 'sent', 'delivered', 'failed', 'read') DEFAULT 'pending' COMMENT 'حالة الإرسال',
    
    -- معلومات الإرسال
    sentBy INT COMMENT 'معرف المستخدم الذي أرسل الرسالة',
    sentAt DATETIME NULL COMMENT 'وقت الإرسال',
    deliveredAt DATETIME NULL COMMENT 'وقت التسليم',
    readAt DATETIME NULL COMMENT 'وقت القراءة',
    
    -- معلومات الأخطاء وإعادة المحاولة
    errorMessage TEXT COMMENT 'رسالة الخطأ',
    retryCount INT DEFAULT 0 COMMENT 'عدد محاولات الإعادة',
    lastRetryAt DATETIME NULL COMMENT 'وقت آخر محاولة',
    
    -- بيانات إضافية
    metadata JSON COMMENT 'بيانات إضافية (مثل رابط PDF، معلومات API response، إلخ)',
    
    -- الطوابع الزمنية
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'وقت الإنشاء',
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'وقت التحديث',
    
    -- Foreign Keys
    FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE SET NULL,
    FOREIGN KEY (sentBy) REFERENCES User(id) ON DELETE SET NULL,
    
    -- Indexes للأداء
    INDEX idx_entity (entityType, entityId) COMMENT 'بحث سريع حسب الكيان',
    INDEX idx_customer (customerId) COMMENT 'بحث سريع حسب العميل',
    INDEX idx_recipient (recipient) COMMENT 'بحث سريع حسب المستلم',
    INDEX idx_status (status) COMMENT 'فلترة حسب الحالة',
    INDEX idx_channel (channel) COMMENT 'فلترة حسب القناة',
    INDEX idx_sent_at (sentAt) COMMENT 'ترتيب حسب وقت الإرسال',
    INDEX idx_created_at (createdAt) COMMENT 'ترتيب حسب وقت الإنشاء',
    INDEX idx_status_created (status, createdAt) COMMENT 'فلترة وترتيب مركب'
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='سجل شامل لجميع محاولات إرسال الرسائل للعملاء';

-- =====================================================
-- ملاحظات:
-- 1. entityType و entityId يربطان الرسالة بالكيان (فاتورة، طلب إصلاح، إلخ)
-- 2. status يتبع دورة حياة الرسالة: pending → sent → delivered → read
-- 3. metadata يمكن أن يحتوي على معلومات إضافية مثل:
--    - رابط PDF للفاتورة
--    - API response من WhatsApp
--    - معلومات التسليم
-- 4. retryCount و lastRetryAt للمساعدة في إعادة المحاولة التلقائية
-- =====================================================


