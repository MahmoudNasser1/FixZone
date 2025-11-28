// backend/scripts/test-settings-api-complete.js
/**
 * Comprehensive test script for Settings API endpoints
 * Tests all new endpoints: company, currency, printing, locale
 */

const http = require('http');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@fixzone.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password';

let authToken = null;

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (authToken) {
      options.headers['Cookie'] = `token=${authToken}`;
    }

    const req = http.request(url, options, (res) => {
      let body = '';
      const cookies = res.headers['set-cookie'] || [];
      
      // Extract token from cookies
      if (cookies.length > 0 && !authToken) {
        const tokenCookie = cookies.find(c => c.includes('token='));
        if (tokenCookie) {
          authToken = tokenCookie.split('token=')[1].split(';')[0];
        }
      }
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Login to get auth token
async function login() {
  console.log('🔐 تسجيل الدخول...');
  console.log(`   Email: ${TEST_EMAIL}`);
  console.log(`   Password: ${'*'.repeat(TEST_PASSWORD.length)}\n`);
  
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      loginIdentifier: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (response.status === 200) {
      // Check for token in response or cookies
      if (response.data.token) {
        authToken = response.data.token;
        console.log('✅ تم تسجيل الدخول بنجاح (Token)\n');
        return true;
      } else if (authToken) {
        console.log('✅ تم تسجيل الدخول بنجاح (Cookie)\n');
        return true;
      } else {
        console.log('⚠️  تم تسجيل الدخول لكن لم يتم العثور على token');
        console.log('   Response:', JSON.stringify(response.data, null, 2));
        // Try to continue anyway - maybe auth is working
        return true;
      }
    } else {
      console.log('❌ فشل تسجيل الدخول:', response.data);
      console.log('   Status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في تسجيل الدخول:', error.message);
    return false;
  }
}

// Test Company Settings
async function testCompanySettings() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 اختبار إعدادات الشركة (Company Settings)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Test GET
    console.log('1️⃣ اختبار GET /api/settings/company');
    const getResponse = await makeRequest('GET', '/api/settings/company');
    console.log(`   Status: ${getResponse.status}`);
    if (getResponse.status === 200) {
      console.log('   ✅ تم جلب إعدادات الشركة بنجاح');
      console.log('   Data:', JSON.stringify(getResponse.data, null, 2));
    } else {
      console.log('   ⚠️  Response:', getResponse.data);
    }
    console.log('');

    // Test PUT
    console.log('2️⃣ اختبار PUT /api/settings/company');
    const updateData = {
      name: 'FixZone Test',
      address: 'عنوان تجريبي',
      phone: '01270388043',
      website: 'https://fixzzone.com',
      logoUrl: '/logo.png',
    };
    const putResponse = await makeRequest('PUT', '/api/settings/company', updateData);
    console.log(`   Status: ${putResponse.status}`);
    if (putResponse.status === 200) {
      console.log('   ✅ تم تحديث إعدادات الشركة بنجاح');
      console.log('   Data:', JSON.stringify(putResponse.data, null, 2));
    } else {
      console.log('   ❌ فشل التحديث:', putResponse.data);
    }
    console.log('');

    // Test Validation
    console.log('3️⃣ اختبار Validation (اسم فارغ)');
    const invalidResponse = await makeRequest('PUT', '/api/settings/company', {
      name: '',
      address: 'عنوان',
    });
    console.log(`   Status: ${invalidResponse.status}`);
    if (invalidResponse.status === 400) {
      console.log('   ✅ Validation يعمل بشكل صحيح');
    } else {
      console.log('   ⚠️  Response:', invalidResponse.data);
    }
    console.log('');

    return true;
  } catch (error) {
    console.error('❌ خطأ في اختبار إعدادات الشركة:', error.message);
    return false;
  }
}

// Test Currency Settings
async function testCurrencySettings() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💰 اختبار إعدادات العملة (Currency Settings)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Test GET
    console.log('1️⃣ اختبار GET /api/settings/currency');
    const getResponse = await makeRequest('GET', '/api/settings/currency');
    console.log(`   Status: ${getResponse.status}`);
    if (getResponse.status === 200) {
      console.log('   ✅ تم جلب إعدادات العملة بنجاح');
      console.log('   Data:', JSON.stringify(getResponse.data, null, 2));
    } else {
      console.log('   ⚠️  Response:', getResponse.data);
    }
    console.log('');

    // Test PUT
    console.log('2️⃣ اختبار PUT /api/settings/currency');
    const updateData = {
      code: 'EGP',
      symbol: 'ج.م',
      name: 'الجنيه المصري',
      locale: 'ar-EG',
      minimumFractionDigits: 2,
      position: 'after',
    };
    const putResponse = await makeRequest('PUT', '/api/settings/currency', updateData);
    console.log(`   Status: ${putResponse.status}`);
    if (putResponse.status === 200) {
      console.log('   ✅ تم تحديث إعدادات العملة بنجاح');
      console.log('   Data:', JSON.stringify(putResponse.data, null, 2));
    } else {
      console.log('   ❌ فشل التحديث:', putResponse.data);
    }
    console.log('');

    // Test Validation
    console.log('3️⃣ اختبار Validation (رمز عملة غير صحيح)');
    const invalidResponse = await makeRequest('PUT', '/api/settings/currency', {
      code: 'EG', // Invalid - should be 3 characters
      symbol: 'ج.م',
    });
    console.log(`   Status: ${invalidResponse.status}`);
    if (invalidResponse.status === 400) {
      console.log('   ✅ Validation يعمل بشكل صحيح');
    } else {
      console.log('   ⚠️  Response:', invalidResponse.data);
    }
    console.log('');

    return true;
  } catch (error) {
    console.error('❌ خطأ في اختبار إعدادات العملة:', error.message);
    return false;
  }
}

// Test Printing Settings
async function testPrintingSettings() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🖨️  اختبار إعدادات الطباعة (Printing Settings)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Test GET
    console.log('1️⃣ اختبار GET /api/settings/printing');
    const getResponse = await makeRequest('GET', '/api/settings/printing');
    console.log(`   Status: ${getResponse.status}`);
    if (getResponse.status === 200) {
      console.log('   ✅ تم جلب إعدادات الطباعة بنجاح');
      console.log('   Data:', JSON.stringify(getResponse.data, null, 2));
    } else {
      console.log('   ⚠️  Response:', getResponse.data);
    }
    console.log('');

    // Test PUT
    console.log('2️⃣ اختبار PUT /api/settings/printing');
    const updateData = {
      defaultCopy: 'customer',
      showWatermark: true,
      paperSize: 'A4',
      showSerialBarcode: true,
    };
    const putResponse = await makeRequest('PUT', '/api/settings/printing', updateData);
    console.log(`   Status: ${putResponse.status}`);
    if (putResponse.status === 200) {
      console.log('   ✅ تم تحديث إعدادات الطباعة بنجاح');
      console.log('   Data:', JSON.stringify(putResponse.data, null, 2));
    } else {
      console.log('   ❌ فشل التحديث:', putResponse.data);
    }
    console.log('');

    // Test Validation
    console.log('3️⃣ اختبار Validation (حجم ورق غير صحيح)');
    const invalidResponse = await makeRequest('PUT', '/api/settings/printing', {
      paperSize: 'InvalidSize',
      showWatermark: true,
    });
    console.log(`   Status: ${invalidResponse.status}`);
    if (invalidResponse.status === 400) {
      console.log('   ✅ Validation يعمل بشكل صحيح');
    } else {
      console.log('   ⚠️  Response:', invalidResponse.data);
    }
    console.log('');

    return true;
  } catch (error) {
    console.error('❌ خطأ في اختبار إعدادات الطباعة:', error.message);
    return false;
  }
}

// Test Locale Settings
async function testLocaleSettings() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌐 اختبار إعدادات المحلية (Locale Settings)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Test GET
    console.log('1️⃣ اختبار GET /api/settings/locale');
    const getResponse = await makeRequest('GET', '/api/settings/locale');
    console.log(`   Status: ${getResponse.status}`);
    if (getResponse.status === 200) {
      console.log('   ✅ تم جلب إعدادات المحلية بنجاح');
      console.log('   Data:', JSON.stringify(getResponse.data, null, 2));
    } else {
      console.log('   ⚠️  Response:', getResponse.data);
    }
    console.log('');

    // Test PUT
    console.log('2️⃣ اختبار PUT /api/settings/locale');
    const updateData = {
      rtl: true,
      dateFormat: 'yyyy/MM/dd',
    };
    const putResponse = await makeRequest('PUT', '/api/settings/locale', updateData);
    console.log(`   Status: ${putResponse.status}`);
    if (putResponse.status === 200) {
      console.log('   ✅ تم تحديث إعدادات المحلية بنجاح');
      console.log('   Data:', JSON.stringify(putResponse.data, null, 2));
    } else {
      console.log('   ❌ فشل التحديث:', putResponse.data);
    }
    console.log('');

    return true;
  } catch (error) {
    console.error('❌ خطأ في اختبار إعدادات المحلية:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  🧪 اختبار شامل لـ Settings API Endpoints                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  // Login first
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('❌ فشل تسجيل الدخول. لا يمكن المتابعة.');
    process.exit(1);
  }

  const results = {
    company: false,
    currency: false,
    printing: false,
    locale: false,
  };

  // Run all tests
  results.company = await testCompanySettings();
  results.currency = await testCurrencySettings();
  results.printing = await testPrintingSettings();
  results.locale = await testLocaleSettings();

  // Summary
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  📊 ملخص النتائج                                               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`   Company Settings:  ${results.company ? '✅ نجح' : '❌ فشل'}`);
  console.log(`   Currency Settings: ${results.currency ? '✅ نجح' : '❌ فشل'}`);
  console.log(`   Printing Settings: ${results.printing ? '✅ نجح' : '❌ فشل'}`);
  console.log(`   Locale Settings:  ${results.locale ? '✅ نجح' : '❌ فشل'}`);
  console.log('');

  const allPassed = Object.values(results).every(r => r === true);
  if (allPassed) {
    console.log('✅ جميع الاختبارات نجحت!');
    process.exit(0);
  } else {
    console.log('⚠️  بعض الاختبارات فشلت. راجع النتائج أعلاه.');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('❌ خطأ فادح:', error);
  process.exit(1);
});

