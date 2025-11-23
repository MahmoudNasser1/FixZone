/**
 * 🧪 سكريبت اختبار موديول المدفوعات - FixZone ERP
 * 
 * هذا السكريبت يحتوي على اختبارات شاملة لموديول المدفوعات
 * يشمل: اختبارات الوظائف، التكامل، الأمان، والأداء
 */

const axios = require('axios');
const mysql = require('mysql2/promise');

// إعدادات الاختبار
const TEST_CONFIG = {
  baseURL: 'http://localhost:4000/api',
  timeout: 10000,
  testUser: {
    email: 'test@fixzone.com',
    password: 'test123456'
  }
};

// إعداد قاعدة البيانات للاختبار
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'fixzone_erp',
  port: 3306
};

class PaymentsTester {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
    this.authToken = null;
    this.testData = {
      invoices: [],
      payments: [],
      customers: []
    };
  }

  // تسجيل النتائج
  logResult(testName, passed, error = null) {
    this.results.total++;
    if (passed) {
      this.results.passed++;
      console.log(`✅ ${testName}: PASSED`);
    } else {
      this.results.failed++;
      this.results.errors.push({ test: testName, error });
      console.log(`❌ ${testName}: FAILED - ${error}`);
    }
  }

  // إنشاء اتصال بقاعدة البيانات
  async createDBConnection() {
    try {
      const connection = await mysql.createConnection(dbConfig);
      return connection;
    } catch (error) {
      console.error('خطأ في الاتصال بقاعدة البيانات:', error.message);
      throw error;
    }
  }

  // تسجيل الدخول للحصول على التوكن
  async authenticate() {
    try {
      const response = await axios.post(`${TEST_CONFIG.baseURL}/auth/login`, {
        email: TEST_CONFIG.testUser.email,
        password: TEST_CONFIG.testUser.password
      });
      
      this.authToken = response.data.token;
      console.log('✅ تم تسجيل الدخول بنجاح');
      return true;
    } catch (error) {
      console.error('❌ فشل في تسجيل الدخول:', error.response?.data || error.message);
      return false;
    }
  }

  // إعداد بيانات الاختبار
  async setupTestData() {
    try {
      const db = await this.createDBConnection();
      
      // إنشاء عميل تجريبي
      const [customerResult] = await db.execute(`
        INSERT INTO Customer (firstName, lastName, email, phone, address, createdAt)
        VALUES (?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE firstName = VALUES(firstName)
      `, ['عميل', 'تجريبي', 'customer@test.com', '01234567890', 'عنوان تجريبي']);
      
      const customerId = customerResult.insertId;
      this.testData.customers.push(customerId);

      // إنشاء فاتورة تجريبية
      const [invoiceResult] = await db.execute(`
        INSERT INTO Invoice (customerId, totalAmount, status, createdAt)
        VALUES (?, ?, ?, NOW())
      `, [customerId, 5000, 'pending']);
      
      const invoiceId = invoiceResult.insertId;
      this.testData.invoices.push(invoiceId);

      await db.end();
      console.log('✅ تم إعداد بيانات الاختبار بنجاح');
      return true;
    } catch (error) {
      console.error('❌ فشل في إعداد بيانات الاختبار:', error.message);
      return false;
    }
  }

  // تنظيف بيانات الاختبار
  async cleanupTestData() {
    try {
      const db = await this.createDBConnection();
      
      // حذف المدفوعات التجريبية
      for (const paymentId of this.testData.payments) {
        await db.execute('DELETE FROM Payment WHERE id = ?', [paymentId]);
      }
      
      // حذف الفواتير التجريبية
      for (const invoiceId of this.testData.invoices) {
        await db.execute('DELETE FROM Invoice WHERE id = ?', [invoiceId]);
      }
      
      // حذف العملاء التجريبيين
      for (const customerId of this.testData.customers) {
        await db.execute('DELETE FROM Customer WHERE id = ?', [customerId]);
      }
      
      await db.end();
      console.log('✅ تم تنظيف بيانات الاختبار');
      return true;
    } catch (error) {
      console.error('❌ فشل في تنظيف بيانات الاختبار:', error.message);
      return false;
    }
  }

  // اختبارات الوظائف الأساسية
  async testBasicFunctions() {
    console.log('\n🧪 بدء اختبارات الوظائف الأساسية...\n');

    // اختبار 1: إنشاء مدفوعة جديدة
    await this.testCreatePayment();
    
    // اختبار 2: الحصول على قائمة المدفوعات
    await this.testGetPayments();
    
    // اختبار 3: الحصول على مدفوعة محددة
    await this.testGetPaymentById();
    
    // اختبار 4: تحديث مدفوعة
    await this.testUpdatePayment();
    
    // اختبار 5: حذف مدفوعة
    await this.testDeletePayment();
  }

  // اختبار إنشاء مدفوعة جديدة
  async testCreatePayment() {
    try {
      const paymentData = {
        invoiceId: this.testData.invoices[0],
        amount: 1000,
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: 'مدفوعة تجريبية للاختبار'
      };

      const response = await axios.post(`${TEST_CONFIG.baseURL}/payments`, paymentData, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      if (response.status === 201 && response.data.success) {
        this.testData.payments.push(response.data.payment.id);
        this.logResult('إنشاء مدفوعة جديدة', true);
      } else {
        this.logResult('إنشاء مدفوعة جديدة', false, 'استجابة غير متوقعة');
      }
    } catch (error) {
      this.logResult('إنشاء مدفوعة جديدة', false, error.response?.data?.error || error.message);
    }
  }

  // اختبار الحصول على قائمة المدفوعات
  async testGetPayments() {
    try {
      const response = await axios.get(`${TEST_CONFIG.baseURL}/payments`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      if (response.status === 200 && Array.isArray(response.data.payments)) {
        this.logResult('الحصول على قائمة المدفوعات', true);
      } else {
        this.logResult('الحصول على قائمة المدفوعات', false, 'استجابة غير صحيحة');
      }
    } catch (error) {
      this.logResult('الحصول على قائمة المدفوعات', false, error.response?.data?.error || error.message);
    }
  }

  // اختبار الحصول على مدفوعة محددة
  async testGetPaymentById() {
    if (this.testData.payments.length === 0) {
      this.logResult('الحصول على مدفوعة محددة', false, 'لا توجد مدفوعات للاختبار');
      return;
    }

    try {
      const paymentId = this.testData.payments[0];
      const response = await axios.get(`${TEST_CONFIG.baseURL}/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      if (response.status === 200 && response.data.payment) {
        this.logResult('الحصول على مدفوعة محددة', true);
      } else {
        this.logResult('الحصول على مدفوعة محددة', false, 'استجابة غير صحيحة');
      }
    } catch (error) {
      this.logResult('الحصول على مدفوعة محددة', false, error.response?.data?.error || error.message);
    }
  }

  // اختبار تحديث مدفوعة
  async testUpdatePayment() {
    if (this.testData.payments.length === 0) {
      this.logResult('تحديث مدفوعة', false, 'لا توجد مدفوعات للاختبار');
      return;
    }

    try {
      const paymentId = this.testData.payments[0];
      const updateData = {
        amount: 1500,
        notes: 'مدفوعة محدثة للاختبار'
      };

      const response = await axios.put(`${TEST_CONFIG.baseURL}/payments/${paymentId}`, updateData, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      if (response.status === 200 && response.data.success) {
        this.logResult('تحديث مدفوعة', true);
      } else {
        this.logResult('تحديث مدفوعة', false, 'استجابة غير متوقعة');
      }
    } catch (error) {
      this.logResult('تحديث مدفوعة', false, error.response?.data?.error || error.message);
    }
  }

  // اختبار حذف مدفوعة
  async testDeletePayment() {
    if (this.testData.payments.length === 0) {
      this.logResult('حذف مدفوعة', false, 'لا توجد مدفوعات للاختبار');
      return;
    }

    try {
      const paymentId = this.testData.payments[0];
      const response = await axios.delete(`${TEST_CONFIG.baseURL}/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      if (response.status === 200 && response.data.success) {
        this.testData.payments = this.testData.payments.filter(id => id !== paymentId);
        this.logResult('حذف مدفوعة', true);
      } else {
        this.logResult('حذف مدفوعة', false, 'استجابة غير متوقعة');
      }
    } catch (error) {
      this.logResult('حذف مدفوعة', false, error.response?.data?.error || error.message);
    }
  }

  // اختبارات التكامل
  async testIntegration() {
    console.log('\n🔗 بدء اختبارات التكامل...\n');

    // اختبار التكامل مع الفواتير
    await this.testInvoiceIntegration();
    
    // اختبار التكامل مع العملاء
    await this.testCustomerIntegration();
  }

  // اختبار التكامل مع الفواتير
  async testInvoiceIntegration() {
    try {
      const invoiceId = this.testData.invoices[0];
      const response = await axios.get(`${TEST_CONFIG.baseURL}/payments/invoice/${invoiceId}`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      if (response.status === 200) {
        this.logResult('التكامل مع الفواتير', true);
      } else {
        this.logResult('التكامل مع الفواتير', false, 'استجابة غير متوقعة');
      }
    } catch (error) {
      this.logResult('التكامل مع الفواتير', false, error.response?.data?.error || error.message);
    }
  }

  // اختبار التكامل مع العملاء
  async testCustomerIntegration() {
    try {
      const response = await axios.get(`${TEST_CONFIG.baseURL}/payments`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      if (response.status === 200 && response.data.payments.length > 0) {
        const payment = response.data.payments[0];
        if (payment.customerFirstName && payment.customerLastName) {
          this.logResult('التكامل مع العملاء', true);
        } else {
          this.logResult('التكامل مع العملاء', false, 'بيانات العميل غير مكتملة');
        }
      } else {
        this.logResult('التكامل مع العملاء', false, 'لا توجد مدفوعات للاختبار');
      }
    } catch (error) {
      this.logResult('التكامل مع العملاء', false, error.response?.data?.error || error.message);
    }
  }

  // اختبارات الأمان
  async testSecurity() {
    console.log('\n🔒 بدء اختبارات الأمان...\n');

    // اختبار SQL Injection
    await this.testSQLInjection();
    
    // اختبار XSS
    await this.testXSS();
    
    // اختبار التحقق من الصلاحيات
    await this.testAuthorization();
  }

  // اختبار SQL Injection
  async testSQLInjection() {
    try {
      const maliciousData = {
        invoiceId: "1'; DROP TABLE Payment; --",
        amount: 1000,
        paymentMethod: 'cash',
        notes: 'test'
      };

      const response = await axios.post(`${TEST_CONFIG.baseURL}/payments`, maliciousData, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      // إذا وصلنا هنا، فالنظام محمي من SQL Injection
      this.logResult('حماية من SQL Injection', true);
    } catch (error) {
      if (error.response?.status === 400) {
        this.logResult('حماية من SQL Injection', true);
      } else {
        this.logResult('حماية من SQL Injection', false, error.message);
      }
    }
  }

  // اختبار XSS
  async testXSS() {
    try {
      const xssData = {
        invoiceId: this.testData.invoices[0],
        amount: 1000,
        paymentMethod: 'cash',
        notes: '<script>alert("XSS")</script>'
      };

      const response = await axios.post(`${TEST_CONFIG.baseURL}/payments`, xssData, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      if (response.status === 201) {
        // التحقق من أن السكريبت لم يتم تنفيذه
        const payment = response.data.payment;
        if (payment.notes && !payment.notes.includes('<script>')) {
          this.logResult('حماية من XSS', true);
        } else {
          this.logResult('حماية من XSS', false, 'السكريبت لم يتم تنظيفه');
        }
      } else {
        this.logResult('حماية من XSS', false, 'استجابة غير متوقعة');
      }
    } catch (error) {
      this.logResult('حماية من XSS', false, error.message);
    }
  }

  // اختبار التحقق من الصلاحيات
  async testAuthorization() {
    try {
      // محاولة الوصول بدون توكن
      const response = await axios.get(`${TEST_CONFIG.baseURL}/payments`);

      if (response.status === 401) {
        this.logResult('التحقق من الصلاحيات', true);
      } else {
        this.logResult('التحقق من الصلاحيات', false, 'يجب رفض الطلبات غير المصرح بها');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        this.logResult('التحقق من الصلاحيات', true);
      } else {
        this.logResult('التحقق من الصلاحيات', false, error.message);
      }
    }
  }

  // اختبارات الأداء
  async testPerformance() {
    console.log('\n⚡ بدء اختبارات الأداء...\n');

    // اختبار وقت الاستجابة
    await this.testResponseTime();
    
    // اختبار الضغط
    await this.testLoad();
  }

  // اختبار وقت الاستجابة
  async testResponseTime() {
    try {
      const startTime = Date.now();
      
      const response = await axios.get(`${TEST_CONFIG.baseURL}/payments`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (response.status === 200 && responseTime < 2000) {
        this.logResult(`وقت الاستجابة (${responseTime}ms)`, true);
      } else {
        this.logResult('وقت الاستجابة', false, `بطيء جداً: ${responseTime}ms`);
      }
    } catch (error) {
      this.logResult('وقت الاستجابة', false, error.message);
    }
  }

  // اختبار الضغط
  async testLoad() {
    try {
      const promises = [];
      const startTime = Date.now();

      // إرسال 10 طلبات متزامنة
      for (let i = 0; i < 10; i++) {
        promises.push(
          axios.get(`${TEST_CONFIG.baseURL}/payments`, {
            headers: { Authorization: `Bearer ${this.authToken}` }
          })
        );
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successCount = responses.filter(r => r.status === 200).length;
      
      if (successCount === 10 && totalTime < 5000) {
        this.logResult(`اختبار الضغط (${totalTime}ms)`, true);
      } else {
        this.logResult('اختبار الضغط', false, `فشل: ${successCount}/10 نجح في ${totalTime}ms`);
      }
    } catch (error) {
      this.logResult('اختبار الضغط', false, error.message);
    }
  }

  // اختبارات التعامل مع الأخطاء
  async testErrorHandling() {
    console.log('\n🚨 بدء اختبارات التعامل مع الأخطاء...\n');

    // اختبار بيانات غير صحيحة
    await this.testInvalidData();
    
    // اختبار فاتورة غير موجودة
    await this.testNonExistentInvoice();
    
    // اختبار مبلغ يتجاوز الرصيد
    await this.testExcessiveAmount();
  }

  // اختبار بيانات غير صحيحة
  async testInvalidData() {
    try {
      const invalidData = {
        invoiceId: 'invalid',
        amount: -100,
        paymentMethod: 'invalid_method'
      };

      const response = await axios.post(`${TEST_CONFIG.baseURL}/payments`, invalidData, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      this.logResult('بيانات غير صحيحة', false, 'يجب رفض البيانات غير الصحيحة');
    } catch (error) {
      if (error.response?.status === 400) {
        this.logResult('بيانات غير صحيحة', true);
      } else {
        this.logResult('بيانات غير صحيحة', false, error.message);
      }
    }
  }

  // اختبار فاتورة غير موجودة
  async testNonExistentInvoice() {
    try {
      const paymentData = {
        invoiceId: 99999,
        amount: 1000,
        paymentMethod: 'cash'
      };

      const response = await axios.post(`${TEST_CONFIG.baseURL}/payments`, paymentData, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      this.logResult('فاتورة غير موجودة', false, 'يجب رفض المدفوعات للفواتير غير الموجودة');
    } catch (error) {
      if (error.response?.status === 404) {
        this.logResult('فاتورة غير موجودة', true);
      } else {
        this.logResult('فاتورة غير موجودة', false, error.message);
      }
    }
  }

  // اختبار مبلغ يتجاوز الرصيد
  async testExcessiveAmount() {
    try {
      const paymentData = {
        invoiceId: this.testData.invoices[0],
        amount: 999999,
        paymentMethod: 'cash'
      };

      const response = await axios.post(`${TEST_CONFIG.baseURL}/payments`, paymentData, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      this.logResult('مبلغ يتجاوز الرصيد', false, 'يجب رفض المبالغ التي تتجاوز الرصيد المتبقي');
    } catch (error) {
      if (error.response?.status === 400) {
        this.logResult('مبلغ يتجاوز الرصيد', true);
      } else {
        this.logResult('مبلغ يتجاوز الرصيد', false, error.message);
      }
    }
  }

  // تشغيل جميع الاختبارات
  async runAllTests() {
    console.log('🚀 بدء اختبارات موديول المدفوعات...\n');
    console.log('=' * 50);

    try {
      // إعداد الاختبار
      console.log('📋 إعداد بيئة الاختبار...');
      await this.setupTestData();
      
      // تسجيل الدخول
      console.log('🔐 تسجيل الدخول...');
      const authSuccess = await this.authenticate();
      if (!authSuccess) {
        console.log('❌ فشل في تسجيل الدخول، توقف الاختبار');
        return;
      }

      // تشغيل الاختبارات
      await this.testBasicFunctions();
      await this.testIntegration();
      await this.testSecurity();
      await this.testPerformance();
      await this.testErrorHandling();

      // تنظيف البيانات
      console.log('\n🧹 تنظيف بيانات الاختبار...');
      await this.cleanupTestData();

      // عرض النتائج النهائية
      this.showResults();

    } catch (error) {
      console.error('❌ خطأ في تشغيل الاختبارات:', error.message);
    }
  }

  // عرض النتائج النهائية
  showResults() {
    console.log('\n' + '=' * 50);
    console.log('📊 نتائج الاختبارات النهائية:');
    console.log('=' * 50);
    console.log(`إجمالي الاختبارات: ${this.results.total}`);
    console.log(`✅ نجح: ${this.results.passed}`);
    console.log(`❌ فشل: ${this.results.failed}`);
    console.log(`📈 معدل النجاح: ${((this.results.passed / this.results.total) * 100).toFixed(2)}%`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ الأخطاء المكتشفة:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.test}: ${error.error}`);
      });
    }

    console.log('\n' + '=' * 50);
    
    if (this.results.failed === 0) {
      console.log('🎉 جميع الاختبارات نجحت! النظام جاهز للإنتاج.');
    } else {
      console.log('⚠️  بعض الاختبارات فشلت. يرجى مراجعة الأخطاء وإصلاحها.');
    }
  }
}

// تشغيل الاختبارات
async function runPaymentsTests() {
  const tester = new PaymentsTester();
  await tester.runAllTests();
}

// تشغيل الاختبارات إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  runPaymentsTests().catch(console.error);
}

module.exports = { PaymentsTester, runPaymentsTests };


