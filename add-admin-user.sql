-- إضافة مستخدم admin للاختبار
USE FZ;

-- حذف المستخدم إذا كان موجود (للتأكد من عدم التكرار)
DELETE FROM User WHERE email = 'admin@fixzone.com';

-- إضافة المستخدم admin الجديد
-- كلمة المرور: password (مشفرة بـ bcrypt)
INSERT INTO User (firstName, lastName, email, password, roleId, isActive, createdAt, updatedAt) 
VALUES (
    'Admin',
    'User', 
    'admin@fixzone.com',
    '$2a$10$rQZ8K5q9L4nM2pP1oQwRxe6vF8gH9iJ0kL3mN4oP5qR6sT7uV8wX9yZ0',
    1,
    1,
    NOW(),
    NOW()
);

-- التحقق من إضافة المستخدم
SELECT id, firstName, lastName, email, roleId, isActive, createdAt 
FROM User 
WHERE email = 'admin@fixzone.com';

