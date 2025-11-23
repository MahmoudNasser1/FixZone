const axios = require('axios');

// اختبار شامل لموديول الفواتير والمالي
async function testInvoicesModule() {
  console.log('🧪 اختبار شامل لموديول الفواتير (Invoices/Financial)\n');
  
  const baseURL = 'http://localhost:4000';
  const results = {
    backend: {
      health: null,
      invoices: {},
      payments: {},
      expenses: {},
      performance: [],
      errors: []
    },
    frontend: {
      navigation: null,
      forms: null,
      dataDisplay: null,
      calculations: null,
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
      financialSecurity: null,
      errors: []
    }
  };
  
  try {
    // ==================== BACKEND TESTING ====================
    console.log('🔧 اختبار Backend APIs للفواتير:');
    
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
    
    // 2. Test Invoices Endpoints
    console.log('\n2️⃣ اختبار Invoices Endpoints:');
    const invoiceEndpoints = [
      { method: 'GET', path: '/api/invoices', name: 'Get All Invoices' },
      { method: 'POST', path: '/api/invoices', name: 'Create Invoice', data: { totalAmount: 1000, status: 'draft' } },
      { method: 'GET', path: '/api/invoices/1', name: 'Get Invoice by ID' },
      { method: 'PUT', path: '/api/invoices/1', name: 'Update Invoice', data: { totalAmount: 1200 } },
      { method: 'DELETE', path: '/api/invoices/1', name: 'Delete Invoice' },
      { method: 'GET', path: '/api/invoices/stats', name: 'Get Invoice Statistics' }
    ];
    
    for (const endpoint of invoiceEndpoints) {
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
        results.backend.invoices[endpoint.name] = {
          status: response.status,
          responseTime: end - start,
          success: true
        };
        results.backend.performance.push(end - start);
        console.log(`✅ ${endpoint.name}: ${response.status} (${end - start}ms)`);
        
      } catch (error) {
        const end = Date.now();
        results.backend.invoices[endpoint.name] = {
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
    
    // 3. Test Payments Endpoints
    console.log('\n3️⃣ اختبار Payments Endpoints:');
    const paymentEndpoints = [
      { method: 'GET', path: '/api/payments', name: 'Get All Payments' },
      { method: 'POST', path: '/api/payments', name: 'Create Payment', data: { invoiceId: 1, amount: 500, paymentMethod: 'cash' } },
      { method: 'GET', path: '/api/payments/1', name: 'Get Payment by ID' },
      { method: 'PUT', path: '/api/payments/1', name: 'Update Payment', data: { amount: 600 } }
    ];
    
    for (const endpoint of paymentEndpoints) {
      try {
        const start = Date.now();
        let response;
        
        if (endpoint.method === 'GET') {
          response = await axios.get(`${baseURL}${endpoint.path}`);
        } else if (endpoint.method === 'POST') {
          response = await axios.post(`${baseURL}${endpoint.path}`, endpoint.data);
        } else if (endpoint.method === 'PUT') {
          response = await axios.put(`${baseURL}${endpoint.path}`, endpoint.data);
        }
        
        const end = Date.now();
        results.backend.payments[endpoint.name] = {
          status: response.status,
          responseTime: end - start,
          success: true
        };
        results.backend.performance.push(end - start);
        console.log(`✅ ${endpoint.name}: ${response.status} (${end - start}ms)`);
        
      } catch (error) {
        const end = Date.now();
        results.backend.payments[endpoint.name] = {
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
    
    // 4. Test Expenses Endpoints
    console.log('\n4️⃣ اختبار Expenses Endpoints:');
    const expenseEndpoints = [
      { method: 'GET', path: '/api/expenses', name: 'Get All Expenses' },
      { method: 'POST', path: '/api/expenses', name: 'Create Expense', data: { description: 'Test Expense', amount: 100 } },
      { method: 'GET', path: '/api/expense-categories', name: 'Get Expense Categories' }
    ];
    
    for (const endpoint of expenseEndpoints) {
      try {
        const start = Date.now();
        let response;
        
        if (endpoint.method === 'GET') {
          response = await axios.get(`${baseURL}${endpoint.path}`);
        } else if (endpoint.method === 'POST') {
          response = await axios.post(`${baseURL}${endpoint.path}`, endpoint.data);
        }
        
        const end = Date.now();
        results.backend.expenses[endpoint.name] = {
          status: response.status,
          responseTime: end - start,
          success: true
        };
        results.backend.performance.push(end - start);
        console.log(`✅ ${endpoint.name}: ${response.status} (${end - start}ms)`);
        
      } catch (error) {
        const end = Date.now();
        results.backend.expenses[endpoint.name] = {
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
    
    // 5. Performance Testing
    console.log('\n5️⃣ اختبار الأداء:');
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
    console.log('\n🎨 اختبار Frontend للفواتير:');
    
    // 6. Frontend Navigation Test
    console.log('\n6️⃣ اختبار التنقل في Frontend:');
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
    
    // 7. API Integration Test
    console.log('\n7️⃣ اختبار تكامل API:');
    const integrationTests = [
      { name: 'Health Check Integration', url: `${baseURL}/health` },
      { name: 'Invoices API Integration', url: `${baseURL}/api/invoices` },
      { name: 'Payments API Integration', url: `${baseURL}/api/payments` }
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
    
    // 8. Financial Security Tests
    console.log('\n8️⃣ اختبار الأمان المالي:');
    const securityTests = [
      { name: 'SQL Injection Test', data: { totalAmount: "'; DROP TABLE Invoice; --" } },
      { name: 'XSS Test', data: { description: '<script>alert("XSS")</script>' } },
      { name: 'Invalid Amount Test', data: { totalAmount: -1000 } },
      { name: 'Invalid Payment Method Test', data: { paymentMethod: 'invalid_method' } }
    ];
    
    for (const test of securityTests) {
      try {
        const response = await axios.post(`${baseURL}/api/invoices`, test.data);
        results.security.financialSecurity = {
          [test.name]: {
            success: false,
            status: response.status,
            message: 'Financial security test failed - request should be rejected'
          }
        };
        console.log(`⚠️ ASPECT ${test.name}: فشل في اختبار الأمان المالي - الطلب تم قبوله`);
      } catch (error) {
        results.security.financialSecurity = {
          [test.name]: {
            success: true,
            status: error.response?.status,
            message: 'Financial security test passed - request properly rejected'
          }
        };
        console.log(`✅ ${test.name}: نجح اختبار الأمان المالي - الطلب تم رفضه`);
      }
    }
    
    // ==================== SUMMARY ====================
    console.log('\n📊 تقرير شامل لموديول الفواتير:');
    console.log('='.repeat(60));
    
    // Backend Summary
    const invoiceSuccess = Object.values(results.backend.invoices).filter(e => e.success).length;
    const invoiceTotal = Object.keys(results.backend.invoices).length;
    const paymentSuccess = Object.values(results.backend.payments).filter(e => e.success).length;
    const paymentTotal = Object.keys(results.backend.payments).length;
    const expenseSuccess = Object.values(results.backend.expenses).filter(e => e.success).length;
    const expenseTotal = Object.keys(results.backend.expenses).length;
    
    console.log(`🔧 Invoices APIs: ${invoiceSuccess}/${invoiceTotal} نجح`);
    console.log(`💳 Payments APIs: ${paymentSuccess}/${paymentTotal} نجح`);
    console.log(`💰 Expenses APIs: ${expenseSuccess}/${expenseTotal} نجح`);
    
    // Frontend Summary
    console.log(`🎨 Frontend: ${results.frontend.navigation?.success ? '✅ يعمل' : '❌ خطأ'}`);
    
    // Integration Summary
    const integrationSuccess = results.integration.apiCalls.filter(c => c.success).length;
    const integrationTotal = results.integration.apiCalls.length;
    console.log(`🔗 Integration: ${integrationSuccess}/${integrationTotal} نجح`);
    
    // Security Summary
    const securitySuccess = Object.values(results.security.financialSecurity || {}).filter(s => s.success).length;
    const securityTotal = Object.keys(results.security.financialSecurity || {}).length;
    console.log(`🔒 Financial Security: ${securitySuccess}/${securityTotal} نجح`);
    
    // Performance Summary
    const avgPerformance = results.backend.performance.reduce((a, b) => a + b, 0) / results.backend.performance.length;
    console.log(`⚡ الأداء: ${avgPerformance.toFixed(2)}ms متوسط`);
    
    console.log('='.repeat(60));
    
    // Recommendations
    console.log('\n💡 التوصيات:');
    if (invoiceSuccess < invoiceTotal) {
      console.log('⚠️ إصلاح Invoices APIs: بعض الـ endpoints لا تعمل');
    }
    if (paymentSuccess < paymentTotal) {
      console.log('⚠️ إصلاح Payments APIs: بعض الـ endpoints لا تعمل');
    }
    if (expenseSuccess < expenseTotal) {
      console.log('⚠️ إصلاح Expenses APIs: بعض الـ endpoints لا تعمل');
    }
    if (!results.frontend.navigation?.success) {
      console.log('⚠️ إصلاح Frontend: الواجهة غير متاحة');
    }
    if (integrationSuccess < integrationTotal) {
      console.log('⚠️ إصلاح Integration: مشاكل في تكامل API');
    }
    if (securitySuccess < securityTotal) {
      console.log('⚠️ تحسين Financial Security: اختبارات الأمان المالي فشلت');
    }
    if (avgPerformance > 100) {
      console.log('⚠️ تحسين الأداء: وقت الاستجابة مرتفع');
    }
    
    console.log('\n🎉 تم إكمال اختبار موديول الفواتير بنجاح!');
    
    return results;
    
  } catch (error) {
    console.error('❌ خطأ في اختبار موديول الفواتير:', error.message);
    return results;
  }
}

// تشغيل الاختبار
testInvoicesModule().then(results => {
  console.log('\n📋 ملخص النتائج:');
  console.log(JSON.stringify(results, null, 2));
}).catch(error => {
  console.error('❌ فشل اختبار موديول الفواتير:', error);
});
