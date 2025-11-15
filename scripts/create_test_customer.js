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

async function createTestCustomer() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Connected to database');
    
    // Password hash for "password123"
    const hashedPassword = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
    
    // Check if customer already exists
    const [existing] = await connection.execute(
      'SELECT id FROM Customer WHERE email = ?',
      ['customer@test.com']
    );
    
    let customerId;
    if (existing.length > 0) {
      customerId = existing[0].id;
      console.log(`✅ Customer already exists with ID: ${customerId}`);
    } else {
      // Create Customer
      const [result] = await connection.execute(
        `INSERT INTO Customer (name, phone, email, address, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        ['عميل اختبار', '01000000000', 'customer@test.com', 'عنوان اختبار']
      );
      customerId = result.insertId;
      console.log(`✅ Created Customer with ID: ${customerId}`);
    }
    
    // Check if user already exists
    const [existingUser] = await connection.execute(
      'SELECT id FROM User WHERE email = ?',
      ['customer@test.com']
    );
    
    let userId;
    if (existingUser.length > 0) {
      userId = existingUser[0].id;
      // Update existing user
      await connection.execute(
        `UPDATE User SET 
         name = ?, 
         password = ?, 
         roleId = 8, 
         customerId = ?, 
         isActive = 1,
         updatedAt = NOW()
         WHERE id = ?`,
        ['عميل اختبار', hashedPassword, customerId, userId]
      );
      console.log(`✅ Updated existing User with ID: ${userId}`);
    } else {
      // Create User
      const [userResult] = await connection.execute(
        `INSERT INTO User (name, email, password, roleId, customerId, isActive, createdAt, updatedAt) 
         VALUES (?, ?, ?, 8, ?, 1, NOW(), NOW())`,
        ['عميل اختبار', 'customer@test.com', hashedPassword, customerId]
      );
      userId = userResult.insertId;
      console.log(`✅ Created User with ID: ${userId}`);
    }
    
    // Link Customer to User
    await connection.execute(
      'UPDATE Customer SET userId = ?, updatedAt = NOW() WHERE id = ?',
      [userId, customerId]
    );
    console.log(`✅ Linked Customer (${customerId}) to User (${userId})`);
    
    // Verify
    const [verify] = await connection.execute(
      `SELECT c.id, c.name, c.email, c.userId, u.id as user_id, u.roleId, r.name as role_name
       FROM Customer c
       LEFT JOIN User u ON c.userId = u.id
       LEFT JOIN Role r ON u.roleId = r.id
       WHERE c.email = ?`,
      ['customer@test.com']
    );
    
    if (verify.length > 0) {
      const data = verify[0];
      console.log('\n✅ Customer Account Created Successfully:');
      console.log(`   Customer ID: ${data.id}`);
      console.log(`   Customer Name: ${data.name}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   User ID: ${data.user_id}`);
      console.log(`   Role ID: ${data.roleId}`);
      console.log(`   Role Name: ${data.role_name}`);
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

createTestCustomer();
