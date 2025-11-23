const axios = require('axios');

// اختبار شامل للتحسينات
async function testOptimizations() {
  console.log('🧪 اختبار شامل للتحسينات المطبقة\n');
  
  const baseURL = 'http://localhost:4000';
  
  try {
    // 1. اختبار Health Check
    console.log('1️⃣ اختبار Health Check:');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Health Check:', healthResponse.data);
    
    // 2. اختبار Rate Limiting
    console.log('\n2️⃣ اختبار Rate Limiting:');
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        axios.get(`${baseURL}/health`).catch(err => ({ 
          status: err.response?.status, 
          message: err.response?.data?.message || err.message 
        }))
      );
    }
    const rateLimitResults = await Promise.all(promises);
    console.log('✅ نتائج Rate Limiting:', rateLimitResults.map((r, i) => `${i+1}: ${r.status || 'success'}`));
    
    // 3. اختبار Caching (محاكاة)
    console.log('\n3️⃣ اختبار Caching Performance:');
    const cacheTests = [];
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      await axios.get(`${baseURL}/health`);
      const end = Date.now();
      cacheTests.push(end - start);
    }
    console.log('✅ أوقات الاستجابة (ms):', cacheTests);
    console.log('✅ متوسط الوقت:', (cacheTests.reduce((a, b) => a + b, 0) / cacheTests.length).toFixed(2) + 'ms');
    
    // 4. اختبار WebSocket (محاكاة)
    console.log('\n4️⃣ اختبار WebSocket Endpoint:');
    try {
      const wsResponse = await axios.get(`${baseURL}/ws`);
      console.log('✅ WebSocket endpoint:', wsResponse.status);
    } catch (err) {
      console.log('⚠️ WebSocket endpoint:', err.response?.status || 'Not available');
    }
    
    // 5. اختبار Memory Usage
    console.log('\n5️⃣ اختبار Memory Usage:');
    const memoryUsage = process.memoryUsage();
    console.log('✅ Memory Usage:', {
      heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`
    });
    
    console.log('\n🎉 تم إكمال اختبار التحسينات بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  }
}

testOptimizations();
