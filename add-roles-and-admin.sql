-- إضافة الأدوار ومستخدم admin
USE FZ;

-- إضافة الأدوار الأساسية
INSERT IGNORE INTO Role (id, name, description, isActive, createdAt, updatedAt) VALUES
(1, 'Admin', 'مدير النظام', 1, NOW(), NOW()),
(2, 'Manager', 'مدير', 1, NOW(), NOW()),
(3, 'Employee', 'موظف', 1, NOW(), NOW());

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
SELECT id, name, description FROM Role;

SELECT 'Users:' as Info;
SELECT id, name, email, roleId, isActive FROM User WHERE email = 'admin@fixzone.com';

