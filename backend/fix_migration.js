
const db = require('./db');

async function migrate() {
    try {
        console.log('Starting migration...');

        // 1. Add invoiceItemId column if not exists
        try {
            await db.query(`
        ALTER TABLE RepairRequestService 
        ADD COLUMN invoiceItemId INT NULL,
        ADD INDEX idx_invoice_item (invoiceItemId)
      `);
            console.log('✅ Added invoiceItemId column');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ invoiceItemId column already exists');
            } else {
                throw err;
            }
        }

        // 2. Populate invoiceItemId from notes
        const [services] = await db.query('SELECT id, notes FROM RepairRequestService WHERE notes LIKE "%[invoiceItemId:%"');
        console.log(`Found ${services.length} services to migrate`);

        for (const service of services) {
            const match = service.notes.match(/\[invoiceItemId:(\d+)\]/);
            if (match && match[1]) {
                const id = match[1];
                // Remove the tag from notes
                const cleanNotes = service.notes.replace(/\[invoiceItemId:\d+\]/, '').trim();
                const finalNotes = cleanNotes === '' ? null : cleanNotes;

                await db.query('UPDATE RepairRequestService SET invoiceItemId = ?, notes = ? WHERE id = ?', [id, finalNotes, service.id]);
                console.log(`Updated service ${service.id}: invoiceItemId=${id}`);
            }
        }

        console.log('✅ Migration completed successfully');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

migrate();
