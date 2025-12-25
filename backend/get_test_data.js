const mysql = require('mysql2/promise');
require('dotenv').config({ path: '/opt/lampp/htdocs/FixZone/backend/.env' });

async function getTestData() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'FZ',
        port: process.env.DB_PORT || 3306
    });

    try {
        const [rows] = await connection.execute(`
      SELECT rr.id, rr.trackingToken as repairToken, i.trackingToken as invoiceToken, c.phone 
      FROM RepairRequest rr 
      JOIN Customer c ON rr.customerId = c.id 
      JOIN Invoice i ON rr.id = i.repairRequestId
      WHERE i.id = 31
    `);
        console.log(JSON.stringify(rows[0]));
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

getTestData();
