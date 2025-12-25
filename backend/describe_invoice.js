const db = require('./db'); async function run() { console.log(JSON.stringify(await db.execute('DESCRIBE Invoice'))); process.exit(0); } run();
