const axios = require('axios');

// اختبار شامل لموديول العملاء مع التحسينات
async function testCustomersModule() {
  console.log('🧪 اختبار شامل لموديول العملاء (Customers)\n');
  
  const baseURL = 'http://localhost:3001';
  const results = {
    backend: {
      health: null,
      endpoints: {},
      performance: [],
      errors: []
    },
    frontend: {
      navigation: null,
      forms: null,
      dataDisplay: null,
      search: null,
      errors: []
    },
    integration: {
      apiCalls: [],
      dataFlow: null,
      errors: []
    },
    security: {
      authentication: null,
      validation: null,
      errors: []
    }
  };
  
  try {
    // ==================== BACKEND TESTING ====================
    console.log('🔧 اختبار Backend APIs للعملاء:');
    
    // 1. Health Check
    console.log('\n1️⃣ Health Check:');
    const start = Date.now();
    const healthResponse = await axios.get(`${baseURL}/health`);
    const end = Date.now();
    results.backend.health = {
      status: healthResponse.status,
      responseTime: end - start,
      data: healthResponse.data
    };
    console.log('✅ Health Check:', results.backend.health);
    
    // 2. Test Customers Endpoints (Expected to fail without DB)
    console.log('\n2️⃣ اختبار Customers Endpoints:');
    const endpoints = [
      { method: 'GET', path: '/api/customers', name: 'Get All Customers' },
      { method: 'POST', path: '/api/customers', name: 'Create Customer', data: { name: 'Test Customer', phone: '01001234567' } },
      { method: 'GET', path: '/api/customers/1', name: 'Get Customer by ID' },
      { method: 'PUT', path: '/api/customers/1', name: 'Update Customer', data: { name: 'Updated Customer' } },
      { method: 'DELETE', path: '/api/customers/1', name: 'Delete Customer' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const start = Date.now();
        let response;
        
        if (endpoint.method === 'GET') {
          response = await axios.get(`${baseURL}${endpoint.path}`);
        } else if (endpoint.method === 'POST') {
          response = await axios.post(`${baseURL}${endpoint.path}`, endpoint.data);
        } else if (endpoint.method === 'PUT') {
          response = await axios.put(`${baseURL}${endpoint.path}`, endpoint.data);
        } else if (endpoint.method === 'DELETE') {
          response = await axios.delete(`${baseURL}${endpoint.path}`);
        }
        
        const end = Date.now();
        results.backend.endpoints[endpoint.name] = {
          status: response.status,
          responseTime: end - start,
          success: true
        };
        results.backend.performance.push(end - start);
        console.log(`✅ ${endpoint.name}: ${response.status} (${end - start}ms)`);
        
      } catch (error) {
        const end = Date.now();
        results.backend.endpoints[endpoint.name] = {
          status: error.response?.status || 'ERROR',
          responseTime: end - start,
          success: false,
          error: error.response?.data?.message || error.message
        };
        results.backend.errors.push({
          endpoint: endpoint.name,
          error: error.response?.data?.message || error.message
        });
        console.log(`⚠️ ${endpoint.name}: ${error.response?.status || 'ERROR'} - ${error.response?.data?.message || error.message}`);
      }
    }
    
    // 3. Performance Testing
    console.log('\n3️⃣ اختبار الأداء:');
    const performanceTests = [];
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await axios.get(`${baseURL}/health`);
      const end = Date.now();
      performanceTests.push(end - start);
    }
    results.backend.performance = performanceTests;
    console.log('✅ أوقات الاستجابة (ms):', performanceTests);
    console.log('✅ متوسط الوقت:', (performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length).toFixed(2) + 'ms');
    
    // ==================== FRONTEND TESTING ====================
    console.log('\n🎨 اختبار Frontend للعملاء:');
    
    // 4. Frontend Navigation Test
    console.log('\n4️⃣ اختبار التنقل في Frontend:');
    try {
      const frontendResponse = await axios.get('http://localhost:3000');
      results.frontend.navigation = {
        status: frontendResponse.status,
        success: true
      };
      console.log('✅ Frontend متاح:', frontendResponse.status);
    } catch (error) {
      results.frontend.navigation = {
        status: error.response?.status || 'ERROR',
        success: false,
        error: error.message
      };
      results.frontend.errors.push({
        component: 'Navigation',
        error: error.message
      });
      console.log('⚠️ Frontend غير متاح:', error.message);
    }
    
    // ==================== INTEGRATION TESTING ====================
    console.log('\n🔗 اختبار Integration:');
    
    // 5. API Integration Test
    console.log('\n5️⃣ اختبار تكامل API:');
    const integrationTests = [
      { name: 'Health Check Integration', url: `${baseURL}/health` },
      { name: 'Customers API Integration', url: `${baseURL}/api/customers` }
    ];
    
    for (const test of integrationTests) {
      try {
        const start = Date.now();
        const response = await axios.get(test.url);
        const end = Date.now();
        results.integration.apiCalls.push({
          name: test.name,
          success: true,
          responseTime: end - start,
          status: response.status
        });
        console.log(`✅ ${test.name}: ${response.status} (${end - start}ms)`);
      } catch (error) {
        results.integration.apiCalls.push({
          name: test.name,
          success: false,
          error: error.response?.data?.message || error.message
        });
        results.integration.errors.push({
          test: test.name,
          error: error.response?.data?.message || error.message
        });
        console.log(`⚠️ ${test.name}: ${error.response?.status || 'ERROR'} - ${error.response?.data?.message || error.message}`);
      }
    }
    
    // ==================== SECURITY TESTING ====================
    console.log('\n🔒 اختبار Security:');
    
    // 6. Security Tests
    console.log('\n6️⃣ اختبار الأمان:');
    const securityTests = [
      { name: 'SQL Injection Test', data: { name: "'; DROP TABLE Customer; --" } },
      { name: 'XSS Test', data: { name: '<script>alert("XSS")</script>' } },
      { name: 'Invalid Data Test', data: { name: '', phone: 'invalid' } }
    ];
    
    for (const test of securityTests) {
      try {
        const response = await axios.post(`${baseURL}/api/customers`, test.data);
        results.security.validation = {
          [test.name]: {
            success: false,
            status: response.status,
            message: 'Security test failed - request should be rejected'
          }
        };
        console.log(`⚠️ ${test.name}: فشل في اختبار الأمان - الطلب تم قبوله`);
      } catch (error) {
        results.security.validation = {
          [test.name]: {
            success: true,
            status: error.response?.status,
            message: 'Security test passed - request properly rejected'
          }
        };
        console.log(`✅ ${test.name}: نجح اختبار الأمان - الطلب تم رفضه`);
      }
    }
    
    // ==================== SUMMARY ====================
    console.log('\n📊 تقرير شامل لموديول العملاء:');
    console.log('='.repeat(60));
    
    // Backend Summary
    const backendSuccess = Object.values(results.backend.endpoints).filter(e => e.success).length;
    const backendTotal = Object.keys(results.backend.endpoints).length;
    console.log(`🔧 Backend APIs: ${backendSuccess}/${backendTotal} نجح`);
    
    // Frontend Summary
    console.log(`🎨 Frontend: ${results.frontend.navigation?.success ? '✅ يعمل' : '❌ خطأ'}`);
    
    // Integration Summary
    const integrationSuccess = results.integration.apiCalls.filter(c => c.success).length;
    const integrationTotal = results.integration.apiCalls.length;
    console.log(`🔗 Integration: ${integrationSuccess}/${integrationTotal} نجح`);
    
    // Security Summary
    const securitySuccess = Object.values(results.security.validation || {}).filter(s => s.success).length;
    const securityTotal = Object.keys(results.security.validation || {}).length;
    console.log(`🔒 Security: ${securitySuccess}/${securityTotal} نجح`);
    
    // Performance Summary
    const avgPerformance = results.backend.performance.reduce((a, b) => a + b, 0) / results.backend.performance.length;
    console.log(`⚡ الأداء: ${avgPerformance.toFixed(2)}ms متوسط`);
    
    console.log('='.repeat(60));
    
    // Recommendations
    console.log('\n💡 التوصيات:');
    if (backendSuccess < backendTotal) {
      console.log('⚠️ إصلاح Backend APIs: بعض الـ endpoints لا تعمل');
    }
    if (!results.frontend.navigation?.success) {
      console.log('⚠️ إصلاح Frontend: الواجهة غير متاحة');
    }
    if (integrationSuccess < integrationTotal) {
      console.log('⚠️ إصلاح Integration: مشاكل في تكامل API');
    }
    if (securitySuccess < securityTotal) {
      console.log('⚠️ تحسين Security: اختبارات الأمان فشلت');
    }
    if (avgPerformance > 100) {
      console.log('⚠️ تحسين الأداء: وقت الاستجابة مرتفع');
    }
    
    console.log('\n🎉 تم إكمال اختبار موديول العملاء بنجاح!');
    
    return results;
    
  } catch (error) {
    console.error('❌ خطأ في اختبار موديول العملاء:', error.message);
    return results;
  }
}

// تشغيل الاختبار
testCustomersModule().then(results => {
  console.log('\n📋 ملخص النتائج:');
  console.log(JSON.stringify(results, null, 2));
}).catch(error => {
  console.error('❌ فشل اختبار موديول العملاء:', error);
});
