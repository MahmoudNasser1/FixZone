const bcrypt = require('bcryptjs');
const db = require('./db');

// Passwords for users (minimum 8 characters, simple and memorable)
const USERS = [
  {
    name: 'Admin User',
    email: 'admin@fixzone.com',
    password: 'admin1234',  // 8 characters
    roleId: 1, // Admin
    phone: '01111111111'
  },
  {
    name: 'Regular User',
    email: 'user@fixzone.com',
    password: 'user1234',  // 8 characters
    roleId: 7, // User
    phone: '01222222222'
  },
  {
    name: 'Technician User',
    email: 'technician@fixzone.com',
    password: 'tech1234',  // 8 characters
    roleId: 6, // Technician
    phone: '01333333333'
  }
];

async function createUsers() {
  try {
    console.log('🚀 FixZone - Create Users Script');
    console.log('================================\n');

    // Check roles exist
    console.log('📋 Checking roles...');
    const [roles] = await db.execute('SELECT id, name FROM Role ORDER BY id');
    console.log('Available roles:');
    roles.forEach(role => {
      console.log(`   ${role.id}. ${role.name}`);
    });
    console.log('');

    // Process each user
    for (const userData of USERS) {
      try {
        // Check if user already exists
        const [existing] = await db.execute(
          'SELECT id, email FROM User WHERE email = ? AND deletedAt IS NULL',
          [userData.email]
        );

        if (existing.length > 0) {
          console.log(`⚠️  User ${userData.email} already exists (ID: ${existing[0].id})`);
          
          // Check if phone is already used by another user
          const [phoneCheck] = await db.execute(
            'SELECT id, email FROM User WHERE phone = ? AND email != ? AND deletedAt IS NULL',
            [userData.phone, userData.email]
          );
          
          // Update password and details (only update phone if not used)
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          if (phoneCheck.length === 0) {
            // Phone is available, update everything
            await db.execute(
              'UPDATE User SET password = ?, name = ?, phone = ?, roleId = ?, isActive = 1 WHERE email = ? AND deletedAt IS NULL',
              [hashedPassword, userData.name, userData.phone, userData.roleId, userData.email]
            );
            console.log(`   ✅ Updated password and details`);
          } else {
            // Phone is taken, update without phone
            await db.execute(
              'UPDATE User SET password = ?, name = ?, roleId = ?, isActive = 1 WHERE email = ? AND deletedAt IS NULL',
              [hashedPassword, userData.name, userData.roleId, userData.email]
            );
            console.log(`   ✅ Updated password and details (kept existing phone)`);
          }
        } else {
          // Check if phone is already used
          const [phoneCheck] = await db.execute(
            'SELECT id, email FROM User WHERE phone = ? AND deletedAt IS NULL',
            [userData.phone]
          );
          
          // Create new user
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          if (phoneCheck.length === 0) {
            // Phone is available, use it
            const [result] = await db.execute(
              'INSERT INTO User (name, email, password, phone, roleId, isActive) VALUES (?, ?, ?, ?, ?, ?)',
              [userData.name, userData.email, hashedPassword, userData.phone, userData.roleId, 1]
            );
            console.log(`✅ Created user: ${userData.email} (ID: ${result.insertId})`);
          } else {
            // Phone is taken, create without phone
            const [result] = await db.execute(
              'INSERT INTO User (name, email, password, roleId, isActive) VALUES (?, ?, ?, ?, ?)',
              [userData.name, userData.email, hashedPassword, userData.roleId, 1]
            );
            console.log(`✅ Created user: ${userData.email} (ID: ${result.insertId}) - without phone`);
          }
        }

        // Display user info
        const roleName = roles.find(r => r.id === userData.roleId)?.name || 'Unknown';
        console.log(`   📧 Email: ${userData.email}`);
        console.log(`   🔑 Password: ${userData.password}`);
        console.log(`   👤 Role: ${roleName}`);
        console.log('');

      } catch (err) {
        console.error(`❌ Error processing user ${userData.email}:`, err.message);
      }
    }

    // Display summary
    console.log('================================');
    console.log('✅ Users Creation Complete!');
    console.log('================================\n');
    console.log('📋 Login Credentials:\n');
    
    USERS.forEach(user => {
      const roleName = roles.find(r => r.id === user.roleId)?.name || 'Unknown';
      console.log(`${roleName}:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log('');
    });

    console.log('💡 You can now login with these credentials!');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

createUsers();

