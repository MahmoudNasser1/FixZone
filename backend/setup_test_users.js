const bcrypt = require('bcryptjs');
const db = require('/opt/lampp/htdocs/FixZone/backend/db');

async function setupTestUsers() {
    try {
        console.log('🔄 Setting up test users...');

        const users = [
            {
                name: 'Admin User',
                email: 'admin@fixzone.com',
                password: 'admin1234',
                roleId: 1,
                phone: '01111111111'
            },
            {
                name: 'Regular User',
                email: 'user@fixzone.com',
                password: 'user1234',
                roleId: 8,
                phone: '01222222222'
            },
            {
                name: 'Technician User',
                email: 'technician@fixzone.com',
                password: 'tech1234',
                roleId: 3,
                phone: '01333333333'
            }
        ];

        for (const user of users) {
            // Hash password
            const hashedPassword = await bcrypt.hash(user.password, 10);

            // Check if user exists
            const [existing] = await db.query(
                'SELECT id FROM User WHERE email = ?',
                [user.email]
            );

            if (existing.length > 0) {
                // Update existing user
                await db.query(
                    'UPDATE User SET name = ?, phone = ?, password = ?, roleId = ?, isActive = 1 WHERE id = ?',
                    [user.name, user.phone, hashedPassword, user.roleId, existing[0].id]
                );
                console.log(`✅ Updated user: ${user.email} (ID: ${existing[0].id})`);
            } else {
                // Create new user
                const [result] = await db.query(
                    `INSERT INTO User (name, email, phone, password, roleId, isActive) 
           VALUES (?, ?, ?, ?, ?, 1)`,
                    [user.name, user.email, user.phone, hashedPassword, user.roleId]
                );
                console.log(`✅ Created user: ${user.email} (ID: ${result.insertId})`);
            }
        }

        console.log('🎉 All test users setup successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting up users:', error.message);
        process.exit(1);
    }
}

setupTestUsers();
