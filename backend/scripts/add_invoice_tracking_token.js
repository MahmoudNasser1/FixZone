const db = require('../db');
const crypto = require('crypto');

async function migrate() {
    console.log('🚀 Starting migration: Add trackingToken to Invoice table');

    try {
        // 1. Check if the column already exists
        const [columns] = await db.execute("SHOW COLUMNS FROM Invoice LIKE 'trackingToken'");

        if (columns.length === 0) {
            console.log('📝 Adding trackingToken column...');
            await db.execute('ALTER TABLE Invoice ADD COLUMN trackingToken VARCHAR(100) AFTER id');
            // We don't add UNIQUE yet because existing rows will have NULL (or empty)
            console.log('✅ Column added successfully');
        } else {
            console.log('ℹ️ trackingToken column already exists');
        }

        // 2. Generate tokens for existing null records
        const [rows] = await db.execute('SELECT id FROM Invoice WHERE trackingToken IS NULL');
        console.log(`📊 Found ${rows.length} invoices without tokens`);

        for (const row of rows) {
            const token = crypto.randomUUID();
            await db.execute('UPDATE Invoice SET trackingToken = ? WHERE id = ?', [token, row.id]);
        }

        if (rows.length > 0) {
            console.log('✅ Generated tokens for existing invoices');
        }

        // 3. Add UNIQUE constraint now that all rows have unique values
        try {
            await db.execute('ALTER TABLE Invoice ADD UNIQUE (trackingToken)');
            console.log('✅ Added UNIQUE constraint to trackingToken');
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY' || err.message.includes('Duplicate entry')) {
                console.warn('⚠️ Unique constraint might already exist or failed due to duplicates');
            } else {
                throw err;
            }
        }

        console.log('🎉 Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
