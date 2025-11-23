const bcrypt = require('bcryptjs');
const db = require('./db');

async function createAdminUser() {
  try {
    // Check if user already exists
    const [existing] = await db.execute('SELECT id FROM User WHERE email = ? AND deletedAt IS NULL', ['admin@fixzone.com']);
    
    if (existing.length > 0) {
      console.log('⚠️ المستخدم admin موجود بالفعل');
      // Update password anyway
      const hashedPassword = await bcrypt.hash('password', 10);
      await db.execute('UPDATE User SET password = ?, name = ?, isActive = 1, roleId = 1 WHERE email = ? AND deletedAt IS NULL', 
        [hashedPassword, 'Admin User', 'admin@fixzone.com']);
      console.log('✅ تم تحديث كلمة مرور admin إلى "password"');
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash('password', 10);
      await db.execute('INSERT INTO User (name, email, password, isActive, roleId) VALUES (?, ?, ?, ?, ?)', 
        ['Admin User', 'admin@fixzone.com', hashedPassword, 1, 1]);
      console.log('✅ تم إنشاء مستخدم admin بنجاح');
      console.log('📧 Email: admin@fixzone.com');
      console.log('🔑 Password: password');
    }
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.error('Stack:', error.stack);
  }
  process.exit(0);
}

createAdminUser();
