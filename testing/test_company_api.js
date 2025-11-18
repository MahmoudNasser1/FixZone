// 🏢 اختبار Company Management API من Browser Console
// Company Management API Test Script for Browser Console

// ========================================
// إعدادات
// ========================================
const BASE_URL = 'http://localhost:3001';
let TEST_TOKEN = null;
let TEST_COMPANY_ID = null;

// ========================================
// خطوة 1: الحصول على Token
// ========================================
function getToken() {
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    const authData = JSON.parse(authStorage);
    TEST_TOKEN = authData?.state?.token;
    if (TEST_TOKEN) {
      console.log('✅ Token تم الحصول عليه:', TEST_TOKEN.substring(0, 20) + '...');
      return TEST_TOKEN;
    }
  }
  console.error('❌ لم يتم العثور على Token. يرجى تسجيل الدخول أولاً.');
  return null;
}

// ========================================
// Helper Functions
// ========================================
async function apiCall(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return {
      status: response.status,
      data,
      ok: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message,
      ok: false
    };
  }
}

// ========================================
// Test 1: GET /api/companies/:id
// ========================================
async function testGetCompanyById(companyId) {
  console.log(`\n📋 Test 1: GET /api/companies/${companyId}`);
  const result = await apiCall('GET', `/api/companies/${companyId}`);
  console.log(`Status: ${result.status}`);
  console.log('Response:', result.data);
  
  if (result.ok && result.status === 200) {
    console.log('✅ نجح');
    return result.data;
  } else {
    console.log('❌ فشل');
    return null;
  }
}

// ========================================
// Test 2: POST /api/companies (Create)
// ========================================
async function testCreateCompany() {
  console.log('\n📋 Test 2: POST /api/companies (Create)');
  const timestamp = Date.now();
  const companyData = {
    name: `شركة اختبار ${timestamp}`,
    email: `test${timestamp}@company.com`,
    phone: '01234567890',
    address: 'عنوان الشركة',
    taxNumber: `TAX${timestamp}`,
    status: 'active'
  };
  
  const result = await apiCall('POST', '/api/companies', companyData);
  console.log(`Status: ${result.status}`);
  console.log('Response:', result.data);
  
  if (result.ok && result.status === 201) {
    console.log('✅ نجح');
    TEST_COMPANY_ID = result.data.id;
    console.log(`✅ Company ID: ${TEST_COMPANY_ID}`);
    return result.data;
  } else {
    console.log('❌ فشل');
    return null;
  }
}

// ========================================
// Test 3: PUT /api/companies/:id (Update)
// ========================================
async function testUpdateCompany(companyId) {
  console.log(`\n📋 Test 3: PUT /api/companies/${companyId} (Update)`);
  const timestamp = Date.now();
  const companyData = {
    name: `شركة اختبار محدثة ${timestamp}`,
    email: `updated${timestamp}@company.com`,
    phone: '09876543210',
    address: 'عنوان محدث',
    taxNumber: 'TAX654321',
    status: 'active'
  };
  
  const result = await apiCall('PUT', `/api/companies/${companyId}`, companyData);
  console.log(`Status: ${result.status}`);
  console.log('Response:', result.data);
  
  if (result.ok && result.status === 200) {
    console.log('✅ نجح');
    return result.data;
  } else {
    console.log('❌ فشل');
    return null;
  }
}

// ========================================
// Test 4: GET /api/companies/:id/customers
// ========================================
async function testGetCompanyCustomers(companyId) {
  console.log(`\n📋 Test 4: GET /api/companies/${companyId}/customers`);
  const result = await apiCall('GET', `/api/companies/${companyId}/customers`);
  console.log(`Status: ${result.status}`);
  console.log('Response:', result.data);
  
  if (result.ok && result.status === 200) {
    console.log(`✅ نجح - عدد العملاء: ${result.data.length}`);
    return result.data;
  } else {
    console.log('❌ فشل');
    return null;
  }
}

// ========================================
// Test 5: GET /api/companies (search)
// ========================================
async function testSearchCompanies(searchTerm) {
  console.log(`\n📋 Test 5: GET /api/companies?search=${searchTerm}`);
  const result = await apiCall('GET', `/api/companies?search=${encodeURIComponent(searchTerm)}`);
  console.log(`Status: ${result.status}`);
  console.log('Response:', result.data);
  
  if (result.ok && result.status === 200) {
    console.log(`✅ نجح - عدد النتائج: ${Array.isArray(result.data) ? result.data.length : result.data.data?.length || 0}`);
    return result.data;
  } else {
    console.log('❌ فشل');
    return null;
  }
}

// ========================================
// Test 6: GET /api/companies (pagination)
// ========================================
async function testPagination(page = 1, pageSize = 5) {
  console.log(`\n📋 Test 6: GET /api/companies?page=${page}&pageSize=${pageSize}`);
  const result = await apiCall('GET', `/api/companies?page=${page}&pageSize=${pageSize}`);
  console.log(`Status: ${result.status}`);
  console.log('Response:', result.data);
  
  if (result.ok && result.status === 200) {
    const data = result.data.data || result.data;
    const pagination = result.data.pagination || {};
    console.log(`✅ نجح - الصفحة: ${pagination.page || page}, البيانات: ${Array.isArray(data) ? data.length : 0}`);
    return result.data;
  } else {
    console.log('❌ فشل');
    return null;
  }
}

// ========================================
// Test 7: DELETE /api/companies/:id
// ========================================
async function testDeleteCompany(companyId) {
  console.log(`\n📋 Test 7: DELETE /api/companies/${companyId}`);
  const result = await apiCall('DELETE', `/api/companies/${companyId}`);
  console.log(`Status: ${result.status}`);
  console.log('Response:', result.data);
  
  if (result.ok && result.status === 200) {
    console.log('✅ نجح');
    return result.data;
  } else {
    console.log('❌ فشل');
    return null;
  }
}

// ========================================
// Test 8: GET /api/companies (unauthorized)
// ========================================
async function testUnauthorized() {
  console.log('\n📋 Test 8: GET /api/companies (unauthorized - 401)');
  const oldToken = TEST_TOKEN;
  TEST_TOKEN = null; // إزالة Token
  
  const result = await apiCall('GET', '/api/companies');
  TEST_TOKEN = oldToken; // استعادة Token
  
  console.log(`Status: ${result.status}`);
  console.log('Response:', result.data);
  
  if (result.status === 401) {
    console.log('✅ نجح - تم رفض الوصول كما هو متوقع');
    return true;
  } else {
    console.log('❌ فشل - كان يجب أن يكون Status 401');
    return false;
  }
}

// ========================================
// Test 9: GET /api/companies/99999 (404)
// ========================================
async function testNonExistent() {
  console.log('\n📋 Test 9: GET /api/companies/99999 (404 - non-existent)');
  const result = await apiCall('GET', '/api/companies/99999');
  console.log(`Status: ${result.status}`);
  console.log('Response:', result.data);
  
  if (result.status === 404) {
    console.log('✅ نجح - تم العثور على 404 كما هو متوقع');
    return true;
  } else {
    console.log('❌ فشل - كان يجب أن يكون Status 404');
    return false;
  }
}

// ========================================
// تشغيل جميع الاختبارات
// ========================================
async function runAllTests() {
  console.log('🏢 بدء اختبار Company Management API');
  console.log('=====================================\n');
  
  // الحصول على Token
  if (!getToken()) {
    console.error('\n❌ لا يمكن المتابعة بدون Token. يرجى تسجيل الدخول أولاً.');
    return;
  }
  
  // Test 1: Get by ID
  await testGetCompanyById(1); // استخدم ID موجود
  
  // Test 2: Create
  await testCreateCompany();
  
  // Test 3: Update
  if (TEST_COMPANY_ID) {
    await testUpdateCompany(TEST_COMPANY_ID);
  }
  
  // Test 4: Get customers
  if (TEST_COMPANY_ID) {
    await testGetCompanyCustomers(TEST_COMPANY_ID);
  }
  
  // Test 5: Search
  await testSearchCompanies('شركة');
  
  // Test 6: Pagination
  await testPagination(1, 5);
  
  // Test 8: Unauthorized
  await testUnauthorized();
  
  // Test 9: Non-existent
  await testNonExistent();
  
  // Test 7: Delete (الأخير لتجنب حذف بيانات الاختبار)
  if (TEST_COMPANY_ID) {
    const shouldDelete = confirm(`هل تريد حذف الشركة ${TEST_COMPANY_ID}؟`);
    if (shouldDelete) {
      await testDeleteCompany(TEST_COMPANY_ID);
    }
  }
  
  console.log('\n✅ انتهى الاختبار!');
  console.log('\n📝 ملاحظة: سجل النتائج في ملف:');
  console.log('TESTING/RESULTS/06_COMPANY_MANAGEMENT_TEST_EXECUTION_RESULTS.md');
}

// ========================================
// تعليمات الاستخدام
// ========================================
console.log('🏢 Company Management API Test Script');
console.log('=====================================');
console.log('الاستخدام:');
console.log('1. تأكد من تسجيل الدخول في الموقع');
console.log('2. افتح Browser Console (F12)');
console.log('3. انسخ والصق هذا الملف كاملاً');
console.log('4. أو استخدم الدوال الفردية:');
console.log('   - getToken()');
console.log('   - testGetCompanyById(id)');
console.log('   - testCreateCompany()');
console.log('   - testUpdateCompany(id)');
console.log('   - testDeleteCompany(id)');
console.log('   - testGetCompanyCustomers(id)');
console.log('   - testSearchCompanies(term)');
console.log('   - testPagination(page, pageSize)');
console.log('   - testUnauthorized()');
console.log('   - testNonExistent()');
console.log('   - runAllTests()');
console.log('\nللتشغيل السريع: runAllTests()');



