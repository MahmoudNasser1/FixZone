const db = require('./db');

async function checkColumns() {
  console.log('📊 التحقق من أسماء الأعمدة:\n');
  
  // StockLevel
  console.log('1️⃣ جدول StockLevel:');
  const [stockLevelCols] = await db.execute('DESCRIBE StockLevel');
  stockLevelCols.forEach(col => {
    console.log(`   ${col.Field} (${col.Type})`);
  });
  
  // InventoryItem
  console.log('\n2️⃣ جدول InventoryItem:');
  const [inventoryItemCols] = await db.execute('DESCRIBE InventoryItem');
  inventoryItemCols.forEach(col => {
    if (col.Field.toLowerCase().includes('active') || 
        col.Field.toLowerCase().includes('status') || 
        col.Field.toLowerCase().includes('unit') ||
        col.Field.toLowerCase().includes('price')) {
      console.log(`   ✅ ${col.Field} (${col.Type})`);
    }
  });
  
  process.exit(0);
}

checkColumns().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
