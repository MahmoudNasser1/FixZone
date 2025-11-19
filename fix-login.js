const db = require('./backend/db');
const bcrypt = require('bcryptjs');

async function fixLogin() {
  try {
    console.log('🔧 بدء إصلاح Login...\n');

    // 1. التحقق من وجود المستخدم
    console.log('1️⃣ التحقق من وجود المستخدم...');
    const [users] = await db.execute(
      'SELECT id, name, email, password, roleId FROM User WHERE email = ?',
      ['admin@fixzone.com']
    );

    if (users.length === 0) {
      console.log('⚠️ المستخدم غير موجود، جاري إنشائه...');
      
      // إنشاء كلمة مرور جديدة
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // إنشاء المستخدم
      const [result] = await db.execute(
        'INSERT INTO User (name, email, password, roleId) VALUES (?, ?, ?, ?)',
        ['مدير النظام', 'admin@fixzone.com', hashedPassword, 1]
      );
      
      console.log('✅ تم إنشاء المستخدم بنجاح!');
      console.log(`   - ID: ${result.insertId}`);
      console.log(`   - Email: admin@fixzone.com`);
      console.log(`   - Password: admin123`);
      console.log(`   - Role: Admin (1)\n`);
    } else {
      const user = users[0];
      console.log('✅ المستخدم موجود بالفعل!');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Name: ${user.name}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Role: ${user.roleId}\n`);

      // 2. التحقق من كلمة المرور
      console.log('2️⃣ التحقق من كلمة المرور...');
      const isMatch = await bcrypt.compare('admin123', user.password);
      
      if (!isMatch) {
        console.log('⚠️ كلمة المرور غير صحيحة، جاري تحديثها...');
        
        // تحديث كلمة المرور
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await db.execute(
          'UPDATE User SET password = ? WHERE id = ?',
          [hashedPassword, user.id]
        );
        
        console.log('✅ تم تحديث كلمة المرور بنجاح!');
        console.log(`   - Password: admin123\n`);
      } else {
        console.log('✅ كلمة المرور صحيحة!\n');
      }

      // 3. التأكد من أن roleId = 1 (Admin)
      if (user.roleId !== 1) {
        console.log('3️⃣ تحديث Role إلى Admin...');
        await db.execute(
          'UPDATE User SET roleId = ? WHERE id = ?',
          [1, user.id]
        );
        console.log('✅ تم تحديث Role إلى Admin (1)!\n');
      }
    }

    // 4. اختبار Login
    console.log('4️⃣ اختبار Login...');
    const [testUsers] = await db.execute(
      'SELECT id, name, email, password, roleId FROM User WHERE email = ?',
      ['admin@fixzone.com']
    );

    if (testUsers.length > 0) {
      const testUser = testUsers[0];
      const testMatch = await bcrypt.compare('admin123', testUser.password);
      
      if (testMatch) {
        console.log('✅ Login يعمل بشكل صحيح!');
        console.log(`   - User ID: ${testUser.id}`);
        console.log(`   - Name: ${testUser.name}`);
        console.log(`   - Email: ${testUser.email}`);
        console.log(`   - Role: ${testUser.roleId}\n`);
        console.log('🎉 تم إصلاح Login بنجاح!\n');
        console.log('📝 بيانات الدخول:');
        console.log('   Email: admin@fixzone.com');
        console.log('   Password: admin123\n');
      } else {
        console.log('❌ Login لا يزال لا يعمل - مشكلة في كلمة المرور\n');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ في إصلاح Login:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

// تشغيل الإصلاح
fixLogin();

