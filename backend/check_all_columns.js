const db = require('./db');

async function checkAllColumns() {
  console.log('📊 جميع أعمدة الجداول المهمة:\n');
  
  // StockLevel
  console.log('1️⃣ StockLevel:');
  const [stockLevel] = await db.execute('DESCRIBE StockLevel');
  stockLevel.forEach(col => console.log(`   ${col.Field}`));
  
  // InventoryItem
  console.log('\n2️⃣ InventoryItem:');
  const [inventoryItem] = await db.execute('DESCRIBE InventoryItem');
  inventoryItem.forEach(col => console.log(`   ${col.Field}`));
  
  process.exit(0);
}

checkAllColumns().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
