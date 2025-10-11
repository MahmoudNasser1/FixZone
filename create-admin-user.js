const bcrypt = require('bcryptjs');
const db = require('./backend/db');

async function createAdminUser() {
    try {
        console.log('🔍 فحص المستخدمين الموجودين...');
        
        // فحص المستخدمين الموجودين
        const [users] = await db.query('SELECT id, email, firstName, lastName FROM User');
        console.log('المستخدمون الموجودون:', users);
        
        // فحص إذا كان admin موجود
        const [adminUser] = await db.query('SELECT * FROM User WHERE email = ?', ['admin@fixzone.com']);
        
        if (adminUser.length > 0) {
            console.log('✅ المستخدم admin@fixzone.com موجود بالفعل');
            console.log('تفاصيل المستخدم:', adminUser[0]);
            return;
        }
        
        console.log('➕ إنشاء مستخدم admin جديد...');
        
        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash('password', 10);
        
        // إدراج المستخدم الجديد
        const [result] = await db.query(
            'INSERT INTO User (firstName, lastName, email, password, roleId, isActive) VALUES (?, ?, ?, ?, ?, ?)',
            ['Admin', 'User', 'admin@fixzone.com', hashedPassword, 1, 1]
        );
        
        console.log('✅ تم إنشاء المستخدم admin بنجاح!');
        console.log('ID:', result.insertId);
        console.log('Email: admin@fixzone.com');
        console.log('Password: password');
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء المستخدم:', error);
    } finally {
        process.exit();
    }
}

createAdminUser();

