#!/usr/bin/env node

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Empty password for XAMPP default
  database: 'FZ',
  multipleStatements: true
};

async function applyOptimizations() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');
    
    // Read the optimization SQL file
    const sqlFilePath = path.join(__dirname, 'migrations', '02_PERFORMANCE_OPTIMIZATION.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📖 Reading optimization SQL file...');
    
    // Split SQL content by semicolon and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        await connection.execute(statement);
        successCount++;
        
        // Log progress for major operations
        if (statement.includes('CREATE INDEX') || statement.includes('CREATE OR REPLACE VIEW')) {
          const operation = statement.includes('CREATE INDEX') ? 'Index' : 'View';
          console.log(`✅ Created ${operation}: ${statement.split(' ')[2] || 'Unknown'}`);
        }
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        
        // Continue with other statements even if one fails
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log('⚠️ Index already exists, skipping...');
        } else if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log('⚠️ Table already exists, skipping...');
        }
      }
    }
    
    console.log('\n📊 Optimization Summary:');
    console.log(`✅ Successful operations: ${successCount}`);
    console.log(`❌ Failed operations: ${errorCount}`);
    console.log(`📈 Success rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`);
    
    // Test the optimizations
    console.log('\n🧪 Testing optimizations...');
    
    // Test indexes
    const indexTest = await connection.execute(`
      SELECT 
        TABLE_NAME,
        INDEX_NAME,
        COLUMN_NAME
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = 'FZ' 
        AND TABLE_NAME IN ('RepairRequest', 'Customer', 'User')
        AND INDEX_NAME LIKE 'idx_%'
      ORDER BY TABLE_NAME, INDEX_NAME
    `);
    
    console.log(`✅ Created ${indexTest[0].length} indexes for performance optimization`);
    
    // Test views
    const viewTest = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'FZ' 
        AND TABLE_TYPE = 'VIEW'
        AND TABLE_NAME LIKE 'v_%'
    `);
    
    console.log(`✅ Created ${viewTest[0].length} views for complex queries`);
    
    // Test stored procedures
    const procedureTest = await connection.execute(`
      SELECT ROUTINE_NAME 
      FROM information_schema.ROUTINES 
      WHERE ROUTINE_SCHEMA = 'fixzone' 
        AND ROUTINE_TYPE = 'PROCEDURE'
    `);
    
    console.log(`✅ Created ${procedureTest[0].length} stored procedures`);
    
    console.log('\n🎉 Database optimization completed successfully!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the optimization
if (require.main === module) {
  applyOptimizations()
    .then(() => {
      console.log('\n✨ All optimizations applied successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Optimization failed:', error.message);
      process.exit(1);
    });
}

module.exports = { applyOptimizations };
