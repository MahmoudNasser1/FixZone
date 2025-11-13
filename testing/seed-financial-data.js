const db = require('../backend/db');

async function seedFinancialData() {
  console.log('🌱 إضافة البيانات المالية التجريبية...');

  try {
    // إنشاء فئات المصروفات
    const expenseCategories = [
      { id: 1, name: 'كهرباء ومياه' },
      { id: 2, name: 'إيجار' },
      { id: 3, name: 'قطع غيار' },
      { id: 4, name: 'صيانة' },
      { id: 5, name: 'أخرى' }
    ];

    console.log('📁 إضافة فئات المصروفات...');
    for (const category of expenseCategories) {
      try {
        const [existing] = await db.query('SELECT id FROM ExpenseCategory WHERE id = ?', [category.id]);
        if (existing.length > 0) {
          await db.query('UPDATE ExpenseCategory SET name = ? WHERE id = ?', [category.name, category.id]);
          console.log(`✅ تم تحديث فئة المصروفات: ${category.name}`);
        } else {
          await db.query('INSERT INTO ExpenseCategory (id, name) VALUES (?, ?)', [category.id, category.name]);
          console.log(`✅ تم إضافة فئة المصروفات: ${category.name}`);
        }
      } catch (error) {
        console.error(`❌ خطأ في إضافة/تحديث فئة المصروفات ${category.name}:`, error.message);
      }
    }

    // إنشاء فواتير تجريبية
    console.log('\n📄 إضافة فواتير تجريبية...');
    const invoices = [
      {
        totalAmount: 1500.00,
        amountPaid: 1500.00,
        status: 'paid',
        currency: 'EGP',
        taxAmount: 0
      },
      {
        totalAmount: 2300.00,
        amountPaid: 1000.00,
        status: 'partially_paid',
        currency: 'EGP',
        taxAmount: 0
      },
      {
        totalAmount: 800.00,
        amountPaid: 0,
        status: 'draft',
        currency: 'EGP',
        taxAmount: 0
      }
    ];

    for (const invoice of invoices) {
      try {
        await db.query(
          `INSERT INTO Invoice (totalAmount, amountPaid, status, currency, taxAmount)
           VALUES (?, ?, ?, ?, ?)`,
          [invoice.totalAmount, invoice.amountPaid, invoice.status, invoice.currency, invoice.taxAmount]
        );
        console.log(`✅ تم إضافة الفاتورة: ${invoice.totalAmount} ج.م`);
      } catch (error) {
        console.error(`❌ خطأ في إضافة الفاتورة:`, error.message);
      }
    }

    // إنشاء مدفوعات تجريبية
    console.log('\n💳 إضافة مدفوعات تجريبية...');
    const payments = [
      {
        invoiceId: 1,
        amount: 1500.00,
        currency: 'EGP',
        paymentMethod: 'cash',
        userId: 2
      },
      {
        invoiceId: 2,
        amount: 1000.00,
        currency: 'EGP',
        paymentMethod: 'card',
        userId: 2
      }
    ];

    for (const payment of payments) {
      try {
        const [existing] = await db.query('SELECT id FROM Payment WHERE invoiceId = ? AND amount = ?', [payment.invoiceId, payment.amount]);
        if (existing.length > 0) {
          console.log(`⚠️ الدفعة للفاتورة ${payment.invoiceId} موجودة بالفعل`);
        } else {
          await db.query(
            `INSERT INTO Payment (invoiceId, amount, currency, paymentMethod, userId)
             VALUES (?, ?, ?, ?, ?)`,
            [payment.invoiceId, payment.amount, payment.currency, payment.paymentMethod, payment.userId]
          );
          console.log(`✅ تم إضافة الدفعة: ${payment.amount} ج.م للفاتورة ${payment.invoiceId}`);
        }
      } catch (error) {
        console.error(`❌ خطأ في إضافة الدفعة:`, error.message);
      }
    }

    // إنشاء مصروفات تجريبية
    console.log('\n💰 إضافة مصروفات تجريبية...');
    const expenses = [
      {
        description: 'فاتورة كهرباء المكتب',
        amount: 500.00,
        expenseDate: '2025-10-01',
        categoryId: 1,
        userId: 2,
        currency: 'EGP'
      },
      {
        description: 'قطع غيار للصيانة',
        amount: 300.00,
        expenseDate: '2025-10-05',
        categoryId: 3,
        userId: 2,
        currency: 'EGP'
      },
      {
        description: 'صيانة الطابعة',
        amount: 150.00,
        expenseDate: '2025-10-10',
        categoryId: 4,
        userId: 2,
        currency: 'EGP'
      }
    ];

    for (const expense of expenses) {
      try {
        const [existing] = await db.query('SELECT id FROM Expense WHERE description = ? AND amount = ?', [expense.description, expense.amount]);
        if (existing.length > 0) {
          console.log(`⚠️ المصروف "${expense.description}" موجود بالفعل`);
        } else {
          await db.query(
            `INSERT INTO Expense (description, amount, expenseDate, categoryId, userId, currency)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [expense.description, expense.amount, expense.expenseDate, expense.categoryId, expense.userId, expense.currency]
          );
          console.log(`✅ تم إضافة المصروف: ${expense.description} - ${expense.amount} ج.م`);
        }
      } catch (error) {
        console.error(`❌ خطأ في إضافة المصروف:`, error.message);
      }
    }

    console.log('\n📊 البيانات المالية الموجودة:');
    
    // عرض الإحصائيات
    const [invoiceCount] = await db.query('SELECT COUNT(*) as count FROM Invoice WHERE deletedAt IS NULL');
    const [paymentCount] = await db.query('SELECT COUNT(*) as count FROM Payment');
    const [expenseCount] = await db.query('SELECT COUNT(*) as count FROM Expense WHERE deletedAt IS NULL');
    const [categoryCount] = await db.query('SELECT COUNT(*) as count FROM ExpenseCategory WHERE deletedAt IS NULL');
    
    console.log(`- الفواتير: ${invoiceCount[0].count}`);
    console.log(`- المدفوعات: ${paymentCount[0].count}`);
    console.log(`- المصروفات: ${expenseCount[0].count}`);
    console.log(`- فئات المصروفات: ${categoryCount[0].count}`);

    console.log('\n🎉 تم إنهاء إضافة البيانات المالية بنجاح!');
    process.exit(0);

  } catch (error) {
    console.error('❌ خطأ في إضافة البيانات المالية:', error);
    process.exit(1);
  }
}

seedFinancialData();
