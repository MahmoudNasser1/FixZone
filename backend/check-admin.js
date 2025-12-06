const db = require('./db');

async function checkAdminUser() {
  try {
    console.log('🔍 Checking admin user in database...\n');
    
    // Query for admin user
    const [users] = await db.execute(
      `SELECT id, name, email, roleId, isActive, createdAt 
       FROM User 
       WHERE email = 'admin@fixzone.com' AND deletedAt IS NULL`
    );
    
    if (users.length === 0) {
      console.log('❌ No admin user found with email: admin@fixzone.com');
      console.log('\n📝 To create an admin user, run:');
      console.log('   node backend/create-admin.js');
      return;
    }
    
    const admin = users[0];
    console.log('✅ Admin user found:');
    console.log('   ID:', admin.id);
    console.log('   Name:', admin.name);
    console.log('   Email:', admin.email);
    console.log('   Role ID:', admin.roleId);
    console.log('   Active:', admin.isActive ? 'Yes' : 'No');
    console.log('   Created:', admin.createdAt);
    
    // Check role name
    try {
      const [roles] = await db.execute(
        `SELECT r.name as roleName 
         FROM Role r 
         WHERE r.id = ?`,
        [admin.roleId]
      );
      if (roles.length > 0) {
        console.log('   Role:', roles[0].roleName);
      }
    } catch (e) {
      // Role table might not exist or have different structure
    }
    
    console.log('\n📧 Login Credentials:');
    console.log('   Email: admin@fixzone.com');
    console.log('   Password: (check the create-admin scripts)');
    console.log('\n💡 Common passwords used in scripts:');
    console.log('   - "password" (from backend/create-admin.js)');
    console.log('   - "admin123" (from backend/create_admin.js)');
    console.log('\n⚠️  Note: Password is hashed in database, cannot be retrieved.');
    console.log('   To reset password, run: node backend/create-admin.js');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

checkAdminUser();

