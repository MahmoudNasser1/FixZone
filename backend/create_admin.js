const bcrypt = require('bcryptjs');
const db = require('./db');

async function createAdminUser() {
    try {
        // Check if admin exists
        const [existing] = await db.execute(
            'SELECT id, email FROM User WHERE email = ?',
            ['admin@fixzone.com']
        );

        if (existing.length > 0) {
            console.log(`✅ Admin user already exists with ID: ${existing[0].id}`);

            // Update password
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await db.execute(
                'UPDATE User SET password = ?, isActive = 1, deletedAt = NULL WHERE email = ?',
                [hashedPassword, 'admin@fixzone.com']
            );
            console.log('✅ Password updated to: admin123');
        } else {
            // Create admin user
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const [result] = await db.execute(
                'INSERT INTO User (name, email, password, roleId, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
                ['Admin User', 'admin@fixzone.com', hashedPassword, 1, 1]
            );
            console.log(`✅ Admin user created with ID: ${result.insertId}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createAdminUser();
