const mysql = require('mysql2/promise');
const path = require('path');

// Use bcrypt from backend
const bcrypt = require(path.join(__dirname, '../backend/node_modules/bcryptjs'));

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'FZ'
};

async function fixCustomerPassword() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Connected to database');
    
    // Hash password properly
    const hashedPassword = await bcrypt.hash('password123', 10);
    console.log('✅ Password hashed:', hashedPassword);
    
    // Find customer user
    const [users] = await connection.execute(
      'SELECT id, name, email, password, roleId, customerId FROM User WHERE email = ?',
      ['customer@test.com']
    );
    
    if (!users.length) {
      console.log('❌ User not found');
      return;
    }
    
    const user = users[0];
    console.log(`✅ Found user ID: ${user.id}`);
    
    // Update password
    await connection.execute(
      'UPDATE User SET password = ?, updatedAt = NOW() WHERE id = ?',
      [hashedPassword, user.id]
    );
    console.log(`✅ Password updated for user ID: ${user.id}`);
    
    // Verify password works
    const [verify] = await connection.execute(
      'SELECT id, name, email, password FROM User WHERE id = ?',
      [user.id]
    );
    
    if (verify.length > 0) {
      const testMatch = await bcrypt.compare('password123', verify[0].password);
      console.log(`✅ Password verification: ${testMatch ? 'PASS' : 'FAIL'}`);
      
      console.log('\n✅ Password fixed successfully!');
      console.log(`   User ID: ${verify[0].id}`);
      console.log(`   Email: ${verify[0].email}`);
      console.log(`\n📝 Login Credentials:`);
      console.log(`   Email/Phone: customer@test.com or 01000000000`);
      console.log(`   Password: password123`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

fixCustomerPassword();
