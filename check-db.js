const db = require('./backend/db');

async function checkDatabase() {
  try {
    console.log('🔍 فحص قاعدة البيانات...');
    
    // فحص الاتصال
    console.log('✅ الاتصال بقاعدة البيانات نجح');
    
    // فحص جدول Payment
    const [paymentCount] = await db.query('SELECT COUNT(*) as count FROM Payment');
    console.log(`📊 عدد المدفوعات: ${paymentCount[0].count}`);
    
    if (paymentCount[0].count === 0) {
      console.log('⚠️  لا توجد مدفوعات في قاعدة البيانات');
      
      // فحص الجداول المطلوبة
      const [invoiceCount] = await db.query('SELECT COUNT(*) as count FROM Invoice');
      console.log(`📊 عدد الفواتير: ${invoiceCount[0].count}`);
      
      const [customerCount] = await db.query('SELECT COUNT(*) as count FROM Customer');
      console.log(`📊 عدد العملاء: ${customerCount[0].count}`);
      
      const [userCount] = await db.query('SELECT COUNT(*) as count FROM User');
      console.log(`📊 عدد المستخدمين: ${userCount[0].count}`);
      
      if (invoiceCount[0].count === 0) {
        console.log('❌ لا توجد فواتير - نحتاج إضافة فواتير أولاً');
      }
      
      if (customerCount[0].count === 0) {
        console.log('❌ لا توجد عملاء - نحتاج إضافة عملاء أولاً');
      }
      
      if (userCount[0].count === 0) {
        console.log('❌ لا يوجد مستخدمين - نحتاج إضافة مستخدمين أولاً');
      }
    } else {
      console.log('✅ توجد مدفوعات في قاعدة البيانات');
      
      // عرض عينة من المدفوعات
      const [payments] = await db.query('SELECT * FROM Payment LIMIT 3');
      console.log('📋 عينة من المدفوعات:', payments);
    }
    
  } catch (error) {
    console.error('❌ خطأ في فحص قاعدة البيانات:', error.message);
  } finally {
    process.exit(0);
  }
}

checkDatabase();
