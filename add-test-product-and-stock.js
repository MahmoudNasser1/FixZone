/**
 * Script to add a test product and stock for testing part issuance
 * Usage: node add-test-product-and-stock.js
 */

const mysql = require('mysql2/promise');

// Use same config as backend (from backend/db.js)
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'FZ', // Same as backend
  multipleStatements: true
};

async function addTestProductAndStock() {
  let connection;
  
  try {
    console.log('🔌 جاري الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(dbConfig);
    
    // 1. إنشاء منتج تجريبي
    console.log('\n📦 1. إنشاء منتج تجريبي...');
    const [itemResult] = await connection.execute(`
      INSERT INTO InventoryItem (
        sku, name, type, purchasePrice, sellingPrice, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      `BAT-IP12-TEST-${Date.now()}`,
      'بطارية iPhone 12 تجريبية',
      'BATTERY',
      200,
      350
    ]);
    
    const itemId = itemResult.insertId;
    console.log(`✅ تم إنشاء المنتج بنجاح! ID: ${itemId}`);
    
    // 2. الحصول على المخزن الأول المتاح
    console.log('\n🏭 2. الحصول على المخزن...');
    const [warehouses] = await connection.execute(`
      SELECT id, name FROM Warehouse 
      WHERE deletedAt IS NULL 
      ORDER BY id ASC 
      LIMIT 1
    `);
    
    if (warehouses.length === 0) {
      console.error('❌ لا توجد مخازن متاحة. يرجى إنشاء مخزن أولاً.');
      return;
    }
    
    const warehouseId = warehouses[0].id;
    const warehouseName = warehouses[0].name;
    console.log(`✅ تم العثور على المخزن: ${warehouseName} (ID: ${warehouseId})`);
    
    // 3. إضافة مخزون للمنتج في المخزن
    console.log('\n📊 3. إضافة مخزون للمنتج...');
    const quantity = 10;
    const minLevel = 2;
    
    // Check if stock level exists
    const [existingStock] = await connection.execute(`
      SELECT id FROM StockLevel 
      WHERE inventoryItemId = ? AND warehouseId = ? AND deletedAt IS NULL
    `, [itemId, warehouseId]);
    
    if (existingStock.length > 0) {
      // Update existing stock
      await connection.execute(`
        UPDATE StockLevel 
        SET quantity = ?, minLevel = ?, isLowStock = ?, updatedAt = NOW()
        WHERE id = ?
      `, [
        quantity,
        minLevel,
        quantity <= minLevel ? 1 : 0,
        existingStock[0].id
      ]);
      console.log(`✅ تم تحديث المخزون الموجود: ${quantity} قطعة`);
    } else {
      // Create new stock level
      await connection.execute(`
        INSERT INTO StockLevel (
          inventoryItemId, warehouseId, quantity, minLevel, isLowStock,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        itemId,
        warehouseId,
        quantity,
        minLevel,
        quantity <= minLevel ? 1 : 0
      ]);
      console.log(`✅ تم إنشاء مخزون جديد: ${quantity} قطعة`);
    }
    
    // 4. عرض المعلومات النهائية
    console.log('\n📋 **المعلومات النهائية:**');
    console.log(`   المنتج ID: ${itemId}`);
    console.log(`   اسم المنتج: بطارية iPhone 12 تجريبية`);
    console.log(`   المخزن ID: ${warehouseId}`);
    console.log(`   اسم المخزن: ${warehouseName}`);
    console.log(`   الكمية المتاحة: ${quantity}`);
    console.log(`   الحد الأدنى: ${minLevel}`);
    
    console.log('\n✅ ✅ ✅ **تم الإضافة بنجاح!** ✅ ✅ ✅');
    console.log('\n🧪 **يمكنك الآن اختبار صرف القطعة:**');
    console.log(`   1. افتح صفحة طلب الإصلاح`);
    console.log(`   2. اضغط على "صرف قطعة"`);
    console.log(`   3. اختر المخزن: ${warehouseName}`);
    console.log(`   4. اختر المنتج: بطارية iPhone 12 تجريبية`);
    console.log(`   5. يجب أن ترى: "المخزون المتاح: ${quantity} ✓"`);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    console.error(error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات.');
    }
  }
}

// Run the script
addTestProductAndStock();

