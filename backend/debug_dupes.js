
const db = require('./db');

async function check() {
    try {
        const repairId = 1427;
        console.log(`Checking RepairRequestService for repairId: ${repairId}`);
        const [services] = await db.query('SELECT * FROM RepairRequestService WHERE repairRequestId = ?', [repairId]);
        console.log('Services found:', services.length);
        console.table(services.map(s => ({ id: s.id, serviceId: s.serviceId, notes: s.notes, date: s.createdAt })));

        const invoiceId = 1427;
        console.log(`Checking InvoiceItem for invoiceId: ${invoiceId}`);
        const [items] = await db.query('SELECT * FROM InvoiceItem WHERE invoiceId = ?', [invoiceId]);
        console.log('Items found:', items.length);
        console.table(items.map(i => ({ id: i.id, desc: i.description, type: i.itemType, serviceId: i.serviceId })));

        // Check for invoiceItemId column
        console.log('Checking columns for RepairRequestService...');
        const [columns] = await db.query("SHOW COLUMNS FROM RepairRequestService LIKE 'invoiceItemId'");
        console.log('Columns found:', columns);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

check();
