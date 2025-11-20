const bcrypt = require('bcryptjs');
const db = require('./db');

async function resetPassword() {
    try {
        const email = 'admin@fixzone.com';
        const newPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const [result] = await db.execute(
            'UPDATE User SET password = ? WHERE email = ?',
            [hashedPassword, email]
        );

        if (result.affectedRows > 0) {
            console.log(`✅ Password for ${email} reset successfully to: ${newPassword}`);
        } else {
            console.log(`❌ User ${email} not found.`);
        }
        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting password:', error);
        process.exit(1);
    }
}

resetPassword();
