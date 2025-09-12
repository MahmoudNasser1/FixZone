const db = require('./db');

async function checkCompanies() {
  try {
    console.log('Checking companies in database...');
    
    // التحقق من البيانات
    const companies = await db.query('SELECT * FROM Company WHERE deletedAt IS NULL LIMIT 5');
    console.log('Companies found:', companies.length);
    console.log('Companies data:', JSON.stringify(companies, null, 2));
    
    // التحقق من هيكل الجدول
    const structure = await db.query('DESCRIBE Company');
    console.log('Table structure:', JSON.stringify(structure, null, 2));
    
  } catch (err) {
    console.error('Error:', err);
  }
  
  process.exit(0);
}

checkCompanies();
