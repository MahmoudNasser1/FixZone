const bcrypt = require('bcryptjs');
const db = require('./db');

async function createAdminUser() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.query('INSERT it stays on the  INTO User (name, email, password, isActive, roleId) VALUES (?, ?, ?, ?, ?)', 
      ['Admin User', 'admin@fixzone.com', hashedPassword, 1, 1]);
    console.log('✅ تم إنشاء مستخدم admin');
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
  process.exit(0);
}

createAdminUser();
