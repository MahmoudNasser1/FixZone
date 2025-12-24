
const db = require('./db');

async function debugRemove() {
    try {
        const id = 1426; // invoiceId
        const itemId = 1905; // invoiceItemId (from user logs)

        console.log(`Checking details for invoiceId: ${id}, itemId: ${itemId}`);

        // Simulate column check
        const sqlCheck = `
        SELECT COUNT(*) as exists_count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'InvoiceItem' 
        AND COLUMN_NAME = 'deletedAt'
    `;
        console.log('Running SQL:', sqlCheck);
        const [columnCheck] = await db.execute(sqlCheck);
        console.log('Column check result:', columnCheck);

        const hasSoftDelete = columnCheck[0].exists_count > 0;
        console.log('Has soft delete:', hasSoftDelete);

        if (hasSoftDelete) {
            console.log('Attempting soft delete UPDATE...');
            const [res] = await db.execute(`
          UPDATE InvoiceItem 
          SET deletedAt = NOW(), updatedAt = NOW() 
          WHERE id = ? AND invoiceId = ?
        `, [itemId, id]);
            console.log('Soft delete result:', res);
        } else {
            console.log('Attempting hard delete DELETE...');
            const [res] = await db.execute(`
          DELETE FROM InvoiceItem WHERE id = ? AND invoiceId = ?
        `, [itemId, id]);
            console.log('Hard delete result:', res);
        }

        // Recalculate total
        const totalQuery = hasSoftDelete
            ? `SELECT COALESCE(SUM(quantity * unitPrice), 0) as calculatedTotal
           FROM InvoiceItem 
           WHERE invoiceId = ? AND (deletedAt IS NULL)`
            : `SELECT COALESCE(SUM(quantity * unitPrice), 0) as calculatedTotal
           FROM InvoiceItem 
           WHERE invoiceId = ?`;

        console.log('Recalculating total with query:', totalQuery);
        const [totalResult] = await db.execute(totalQuery, [id]);
        console.log('Total result:', totalResult);

    } catch (err) {
        console.error('Captured Error:', err);
    } finally {
        process.exit();
    }
}

debugRemove();
