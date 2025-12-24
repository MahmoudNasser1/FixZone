
const db = require('./db');

async function debugExistsKeyword() {
    try {
        console.log('Testing "exists" keyword...');
        // Exact query from controller
        const sqlCheck = `
        SELECT COUNT(*) as exists 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'InvoiceItem' 
        AND COLUMN_NAME = 'deletedAt'
    `;
        console.log('Running SQL:', sqlCheck);
        const [columnCheck] = await db.execute(sqlCheck);
        console.log('Column check result:', columnCheck);
        console.log('Value:', columnCheck[0].exists);

    } catch (err) {
        console.error('Captured Error:', err);
    } finally {
        process.exit();
    }
}

debugExistsKeyword();
