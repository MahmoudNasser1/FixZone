const db = require('../backend/db');

async function seedRepairsData() {
  console.log('🌱 إضافة البيانات التجريبية لموديول الإصلاحات...');

  try {
    // إنشاء طلبات إصلاح تجريبية
    console.log('\n🔧 إضافة طلبات إصلاح تجريبية...');
    const repairs = [
      {
        customerId: 1,
        deviceBrand: 'Samsung',
        deviceModel: 'Galaxy S21',
        deviceType: 'smartphone',
        serialNumber: 'SN123456789',
        reportedProblem: 'مشكلة في الشاشة - لا تعمل بشكل صحيح',
        priority: 'high',
        estimatedCost: 500.00,
        status: 'RECEIVED',
        customerNotes: 'الجهاز سقط من الطابق الثاني'
      },
      {
        customerId: 2,
        deviceBrand: 'iPhone',
        deviceModel: '13 Pro',
        deviceType: 'smartphone',
        serialNumber: 'SN987654321',
        reportedProblem: 'مشكلة في البطارية - تنتهي بسرعة',
        priority: 'medium',
        estimatedCost: 800.00,
        status: 'UNDER_REPAIR',
        customerNotes: 'الجهاز جديد لكن البطارية لا تعمل بشكل طبيعي'
      },
      {
        customerId: 1,
        deviceBrand: 'Dell',
        deviceModel: 'Inspiron 15',
        deviceType: 'laptop',
        serialNumber: 'SN555666777',
        reportedProblem: 'مشكلة في لوحة المفاتيح - بعض المفاتيح لا تعمل',
        priority: 'low',
        estimatedCost: 300.00,
        status: 'DELIVERED',
        customerNotes: 'الجهاز يحتاج تنظيف وصيانة'
      },
      {
        customerId: 2,
        deviceBrand: 'HP',
        deviceModel: 'LaserJet Pro',
        deviceType: 'printer',
        serialNumber: 'SN111222333',
        reportedProblem: 'مشكلة في الطباعة - لا تطبع بشكل واضح',
        priority: 'medium',
        estimatedCost: 200.00,
        status: 'DELIVERED',
        customerNotes: 'الطابعة تحتاج تنظيف الرؤوس'
      },
      {
        customerId: 1,
        deviceBrand: 'MacBook',
        deviceModel: 'Air M2',
        deviceType: 'laptop',
        serialNumber: 'SN444555666',
        reportedProblem: 'مشكلة في الشحن - لا يشحن بشكل طبيعي',
        priority: 'high',
        estimatedCost: 600.00,
        status: 'RECEIVED',
        customerNotes: 'الجهاز لا يشحن أحياناً'
      }
    ];

    for (const repair of repairs) {
      try {
        const [existing] = await db.query('SELECT id FROM RepairRequest WHERE customerId = ? AND deviceBrand = ? AND deviceModel = ?', 
          [repair.customerId, repair.deviceBrand, repair.deviceModel]);
        
        if (existing.length > 0) {
          console.log(`⚠️ طلب الإصلاح للجهاز ${repair.deviceBrand} ${repair.deviceModel} موجود بالفعل`);
        } else {
          await db.query(
            `INSERT INTO RepairRequest (
              customerId, reportedProblem, status
            ) VALUES (?, ?, ?)`,
            [
              repair.customerId, repair.reportedProblem, repair.status
            ]
          );
          console.log(`✅ تم إضافة طلب الإصلاح: ${repair.deviceBrand} ${repair.deviceModel}`);
        }
      } catch (error) {
        console.error(`❌ خطأ في إضافة طلب الإصلاح:`, error.message);
      }
    }

    console.log('\n📊 البيانات التجريبية الموجودة:');
    
    // عرض الإحصائيات
    const [repairCount] = await db.query('SELECT COUNT(*) as count FROM RepairRequest WHERE deletedAt IS NULL');
    const [customerCount] = await db.query('SELECT COUNT(*) as count FROM Customer WHERE deletedAt IS NULL');
    
    console.log(`- طلبات الإصلاح: ${repairCount[0].count}`);
    console.log(`- العملاء: ${customerCount[0].count}`);

    // عرض تفاصيل طلبات الإصلاح
    console.log('\n📋 تفاصيل طلبات الإصلاح:');
    const [repairDetails] = await db.query(`
      SELECT 
        rr.id,
        rr.reportedProblem,
        rr.status,
        c.name as customerName
      FROM RepairRequest rr
      LEFT JOIN Customer c ON rr.customerId = c.id
      WHERE rr.deletedAt IS NULL
      ORDER BY rr.createdAt DESC
    `);
    
    repairDetails.forEach(repair => {
      console.log(`- ${repair.id}: ${repair.reportedProblem} (${repair.customerName}) - ${repair.status}`);
    });

    console.log('\n🎉 تم إنهاء إضافة البيانات التجريبية بنجاح!');
    process.exit(0);

  } catch (error) {
    console.error('❌ خطأ في إضافة البيانات التجريبية:', error);
    process.exit(1);
  }
}

seedRepairsData();
