const bcrypt = require('bcryptjs');
const db = require('/opt/lampp/htdocs/FixZone/backend/db');

async function createCustomerUser() {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Check if user exists
    const [existing] = await db.query(
      'SELECT id FROM User WHERE email = ?',
      ['customer@fixzone.com']
    );
    
    if (existing.length > 0) {
      console.log('User already exists:', existing[0].id);
      // Update password
      await db.query(
        'UPDATE User SET password = ? WHERE id = ?',
        [hashedPassword, existing[0].id]
      );
      console.log('✅ Password updated to: password123');
      process.exit(0);
    }
    
    // Create user (Role ID 8 for Customer)
    const [result] = await db.query(
      `INSERT INTO User (name, email, phone, password, roleId, isActive, type) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['عميل تجريبي', 'customer@fixzone.com', '01000000000', hashedPassword, 8, 1, 'customer']
    );
    
    console.log('✅ Customer user created successfully!');
    console.log('ID:', result.insertId);
    console.log('Email: customer@fixzone.com');
    console.log('Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createCustomerUser();
