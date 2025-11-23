const bcrypt = require('bcryptjs');
const db = require('/opt/lampp/htdocs/FixZone/backend/db');

async function createTechUser() {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('tech12345', 10);

    // Check if user exists
    const [existing] = await db.query(
      'SELECT id FROM User WHERE email = ?',
      ['tech1@fixzone.com']
    );

    if (existing.length > 0) {
      console.log('User already exists:', existing[0].id);
      // Update password
      await db.query(
        'UPDATE User SET password = ? WHERE id = ?',
        [hashedPassword, existing[0].id]
      );
      console.log('✅ Password updated to: tech12345');
      process.exit(0);
    }

    // Create user
    const [result] = await db.query(
      `INSERT INTO User(name, email, phone, password, roleId, isActive)
VALUES(?, ?, ?, ?, ?, ?)`,
      ['أحمد الفني', 'tech1@fixzone.com', '01999888777', hashedPassword, 3, 1]
    );

    console.log('✅ Technician user created successfully!');
    console.log('ID:', result.insertId);
    console.log('Email: tech1@fixzone.com');
    console.log('Password: tech12345');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createTechUser();

