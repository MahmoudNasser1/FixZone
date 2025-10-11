const fetch = globalThis.fetch;

// إعدادات الاختبار
const API_BASE_URL = 'http://localhost:3001/api';
const BASE_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 10000; // 10 ثواني

let AUTH_TOKEN = null;
let AUTH_HEADERS = {};

async function loginAndGetToken() {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginIdentifier: 'admin@fixzone.com', password: 'password' })
    });
    const setCookie = res.headers.get('set-cookie') || '';
    const m = setCookie.match(/token=([^;]+)/);
    if (m) {
      AUTH_TOKEN = m[1];
      AUTH_HEADERS = { Authorization: `Bearer ${AUTH_TOKEN}` };
    }
    return res.ok;
  } catch (e) {
    return false;
  }
}

// نتائج الاختبار
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  errors: []
};

// دالة مساعدة للاختبار
async function testAPI(name, testFunction) {
  console.log(`\n🧪 اختبار: ${name}`);
  testResults.total++;
  
  try {
    const result = await Promise.race([
      testFunction(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('انتهت مهلة الاختبار')), TEST_TIMEOUT)
      )
    ]);
    
    if (result.success) {
      console.log(`✅ نجح: ${name}`);
      testResults.passed++;
    } else {
      console.log(`❌ فشل: ${name} - ${result.error || 'خطأ غير معروف'}`);
      testResults.failed++;
      testResults.errors.push({ name, error: result.error });
    }
  } catch (error) {
    console.log(`❌ فشل: ${name} - ${error.message}`);
    testResults.failed++;
    testResults.errors.push({ name, error: error.message });
  }
}

// اختبار الاتصال بالخادم
async function testServerConnection() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    if (response.ok) {
      return { success: true };
    }
    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    throw new Error(`لا يمكن الاتصال بالخادم: ${error.message}`);
  }
}

// اختبار جلب المدفوعات
async function testGetPayments() {
  try {
    const response = await fetch(`${API_BASE_URL}/payments`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'خطأ غير معروف'}`);
    }
    
    if (Array.isArray(data)) {
      console.log(`   📊 تم جلب ${data.length} مدفوعة`);
    } else if (Array.isArray(data.payments)) {
      console.log(`   📊 تم جلب ${data.payments.length} مدفوعة`);
    }
    return { success: true, data };
  } catch (error) {
    throw new Error(`فشل في جلب المدفوعات: ${error.message}`);
  }
}

// اختبار جلب إحصائيات المدفوعات
async function testGetPaymentStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/stats/summary`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'خطأ غير معروف'}`);
    }
    
    console.log(`   📈 الإحصائيات: ${JSON.stringify(data, null, 2)}`);
    return { success: true, data };
  } catch (error) {
    throw new Error(`فشل في جلب الإحصائيات: ${error.message}`);
  }
}

// اختبار جلب المدفوعات المتأخرة
async function testGetOverduePayments() {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/overdue/list`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'خطأ غير معروف'}`);
    }
    
    const len = Array.isArray(data) ? data.length : 0;
    console.log(`   ⏰ المدفوعات المتأخرة: ${len}`);
    return { success: true, data };
  } catch (error) {
    throw new Error(`فشل في جلب المدفوعات المتأخرة: ${error.message}`);
  }
}

// اختبار إنشاء مدفوعة جديدة
async function testCreatePayment() {
  try {
    // Get a valid invoiceId first by creating one
    const invoiceResponse = await testCreateInvoice();
    const validInvoiceId = invoiceResponse.data.id;
    
    const paymentData = {
      invoiceId: validInvoiceId,
      amount: 100,
      paymentMethod: 'cash',
      currency: 'EGP',
      createdBy: 1
    };
    
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...AUTH_HEADERS
      },
      body: JSON.stringify(paymentData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'خطأ غير معروف'}`);
    }
    
    console.log(`   💰 تم إنشاء مدفوعة جديدة`);
    return { success: true, data };
  } catch (error) {
    throw new Error(`فشل في إنشاء مدفوعة: ${error.message}`);
  }
}

// اختبار جلب الفواتير
async function testGetInvoices() {
  try {
    const response = await fetch(`${API_BASE_URL}/invoices`, { headers: { ...AUTH_HEADERS } });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || data.message || 'خطأ غير معروف'}`);
    }
    
    const count = Array.isArray(data) ? data.length : (Array.isArray(data.data) ? data.data.length : 0);
    console.log(`   📄 تم جلب ${count} فاتورة`);
    return { success: true, data };
  } catch (error) {
    throw new Error(`فشل في جلب الفواتير: ${error.message}`);
  }
}

// اختبار إنشاء فاتورة جديدة
async function testCreateInvoice() {
  try {
    // Get a valid repairRequestId first
    const repairsResponse = await fetch(`${API_BASE_URL}/repairs`);
    const repairsData = await repairsResponse.json();
    const validRepairId = repairsData[0]?.id || 4; // Use existing ID or fallback to 4
    
    const invoiceData = {
      repairRequestId: validRepairId,
      totalAmount: 500,
      status: 'draft',
      currency: 'EGP'
    };
    
    const response = await fetch(`${API_BASE_URL}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...AUTH_HEADERS
      },
      body: JSON.stringify(invoiceData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || data.message || 'خطأ غير معروف'}`);
    }
    
    console.log(`   📋 تم إنشاء فاتورة جديدة بمعرف ${data.id}`);
    return { success: true, data };
  } catch (error) {
    throw new Error(`فشل في إنشاء فاتورة: ${error.message}`);
  }
}

// اختبار جلب طلبات الإصلاح
async function testGetRepairRequests() {
  try {
    const response = await fetch(`${API_BASE_URL}/repairs`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'خطأ غير معروف'}`);
    }
    
    console.log(`   🔧 تم جلب ${Array.isArray(data) ? data.length : 0} طلب إصلاح`);
    return { success: true, data };
  } catch (error) {
    throw new Error(`فشل في جلب طلبات الإصلاح: ${error.message}`);
  }
}

// اختبار جلب العملاء
async function testGetCustomers() {
  try {
    const response = await fetch(`${API_BASE_URL}/customers`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'خطأ غير معروف'}`);
    }
    
    console.log(`   👥 تم جلب ${Array.isArray(data) ? data.length : 0} عميل`);
    return { success: true, data };
  } catch (error) {
    throw new Error(`فشل في جلب العملاء: ${error.message}`);
  }
}

// اختبار قاعدة البيانات - التحقق من الاتصال
async function testDatabaseConnection() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'خطأ غير معروف'}`);
    }
    
    console.log(`   🗄️ حالة قاعدة البيانات: ${data.message || 'OK'}`);
    return { success: true, data };
  } catch (error) {
    throw new Error(`فشل في الاتصال بقاعدة البيانات: ${error.message}`);
  }
}

// اختبار التصفح مع الفلاتر
async function testPaymentsWithFilters() {
  try {
    const filters = { page: 1, limit: 5, paymentMethod: 'cash' };
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/payments?${queryParams}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'خطأ غير معروف'}`);
    }
    
    const count = Array.isArray(data) ? data.length : (Array.isArray(data.payments) ? data.payments.length : 0);
    console.log(`   🔍 تم تطبيق الفلاتر بنجاح: ${count} نتيجة`);
    return { success: true, data };
  } catch (error) {
    throw new Error(`فشل في تطبيق الفلاتر: ${error.message}`);
  }
}

// تشغيل جميع الاختبارات
async function runAllTests() {
  console.log('🚀 بدء اختبار APIs الباك اند...\n');
  
  // تسجيل الدخول للحصول على JWT
  await loginAndGetToken();
  
  // اختبار الاتصال
  await testAPI('الاتصال بالخادم', testServerConnection);
  await testAPI('الاتصال بقاعدة البيانات', testDatabaseConnection);
  
  // اختبار البيانات الأساسية
  await testAPI('جلب العملاء', testGetCustomers);
  await testAPI('جلب طلبات الإصلاح', testGetRepairRequests);
  await testAPI('جلب الفواتير', testGetInvoices);
  
  // اختبار المدفوعات
  await testAPI('جلب المدفوعات', testGetPayments);
  await testAPI('إحصائيات المدفوعات', testGetPaymentStats);
  await testAPI('المدفوعات المتأخرة', testGetOverduePayments);
  await testAPI('المدفوعات مع الفلاتر', testPaymentsWithFilters);
  
  // اختبار الإنشاء
  await testAPI('إنشاء فاتورة جديدة', testCreateInvoice);
  await testAPI('إنشاء مدفوعة جديدة', testCreatePayment);
  
  // عرض النتائج النهائية
  console.log('\n' + '='.repeat(50));
  console.log('📊 نتائج الاختبار النهائية:');
  console.log('='.repeat(50));
  console.log(`✅ نجح: ${testResults.passed}`);
  console.log(`❌ فشل: ${testResults.failed}`);
  console.log(`📈 النسبة: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ الأخطاء:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.name}: ${error.error}`);
    });
  }
  
  console.log('\n🎯 ملخص الاختبار:');
  if (testResults.failed === 0) {
    console.log('🎉 جميع الاختبارات نجحت! النظام جاهز للاستخدام.');
  } else if (testResults.passed > testResults.failed) {
    console.log('⚠️ معظم الاختبارات نجحت، لكن هناك بعض المشاكل تحتاج إصلاح.');
  } else {
    console.log('🚨 هناك مشاكل كبيرة في النظام تحتاج إصلاح فوري.');
  }
}

// تشغيل الاختبارات
runAllTests().catch(console.error);
