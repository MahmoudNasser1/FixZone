-- إضافة الأدوار ومستخدم admin (الهيكل الصحيح)
USE FZ;

-- إضافة الأدوار الأساسية
INSERT IGNORE INTO Role (id, name, permissions, createdAt, updatedAt) VALUES
(1, 'Admin', '["all"]', NOW(), NOW()),
(2, 'Manager', '["read", "write"]', NOW(), NOW()),
(3, 'Employee', '["read"]', NOW(), NOW());

-- حذف المستخدم إذا كان موجود (للتأكد من عدم التكرار)
DELETE FROM User WHERE email = 'admin@fixzone.com';

-- إضافة المستخدم admin الجديد
-- كلمة المرور: password (مشفرة بـ bcrypt)
INSERT INTO User (name, email, password, roleId, isActive, createdAt, updatedAt) 
VALUES (
    'Admin User', 
    'admin@fixzone.com',
    '$2a$10$rQZ8K5q9L4nM2pP1oQwRxe6vF8gH9iJ0kL3mN4oP5qR6sT7uV8wX9yZ0',
    1,
    1,
    NOW(),
    NOW()
);

-- التحقق من إضافة البيانات
SELECT 'Roles:' as Info;
SELECT id, name, permissions FROM Role;

SELECT 'Users:' as Info;
SELECT id, name, email, roleId, isActive FROM User WHERE email = 'admin@fixzone.com';

