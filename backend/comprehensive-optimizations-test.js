const axios = require('axios');

// اختبار شامل للتحسينات المطبقة
async function testComprehensiveOptimizations() {
  console.log('🧪 اختبار شامل للتحسينات المطبقة\n');
  
  const baseURL = 'http://localhost:3001';
  const results = {
    health: null,
    caching: null,
    rateLimiting: null,
    websocket: null,
    memoryUsage: null,
    responseTimes: [],
    errors: []
  };
  
  try {
    // 1. اختبار Health Check
    console.log('1️⃣ اختبار Health Check:');
    const start = Date.now();
    const healthResponse = await axios.get(`${baseURL}/health`);
    const end = Date.now();
    results.health = {
      status: healthResponse.status,
      responseTime: end - start,
      data: healthResponse.data
    };
    console.log('✅ Health Check:', results.health);
    
    // 2. اختبار Caching Performance
    console.log('\n2️⃣ اختبار Caching Performance:');
    const cacheTests = [];
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await axios.get(`${baseURL}/health`);
      const end = Date.now();
      cacheTests.push(end - start);
      results.responseTimes.push(end - start);
    }
    results.caching = {
      times: cacheTests,
      average: cacheTests.reduce((a, b) => a + b, 0) / cacheTests.length,
      min: Math.min(...cacheTests),
      max: Math.max(...cacheTests)
    };
    console.log('✅ أوقات الاستجابة (ms):', cacheTests);
    console.log('✅ متوسط الوقت:', results.caching.average.toFixed(2) + 'ms');
    console.log('✅ أسرع وقت:', results.caching.min + 'ms');
    console.log('✅ أبطأ وقت:', results.caching.max + 'ms');
    
    // 3. اختبار Rate Limiting
    console.log('\n3️⃣ اختبار Rate Limiting:');
    const rateLimitPromises = [];
    for (let i = 0; i < 15; i++) {
      rateLimitPromises.push(
        axios.get(`${baseURL}/health`).catch(err => ({ 
          status: err.response?.status, 
          message: err.response?.data?.message || err.message,
          rateLimited: err.response?.status === 429
        }))
      );
    }
    const rateLimitResults = await Promise.all(rateLimitPromises);
    const rateLimited = rateLimitResults.filter(r => r.rateLimited).length;
    results.rateLimiting = {
      total: rateLimitResults.length,
      rateLimited: rateLimited,
      successRate: ((rateLimitResults.length - rateLimited) / rateLimitResults.length * 100).toFixed(2) + '%'
    };
    console.log('✅ إجمالي الطلبات:', results.rateLimiting.total);
    console.log('✅ طلبات محدودة:', results.rateLimiting.rateLimited);
    console.log('✅ معدل النجاح:', results.rateLimiting.successRate);
    
    // 4. اختبار WebSocket Endpoint
    console.log('\n4️⃣ اختبار WebSocket Endpoint:');
    try {
      const wsResponse = await axios.get(`${baseURL}/ws`, { timeout: 5000 });
      results.websocket = {
        status: wsResponse.status,
        available: true
      };
      console.log('✅ WebSocket endpoint:', wsResponse.status);
    } catch (err) {
      results.websocket = {
        status: err.response?.status || 'Not available',
        available: false
      };
      console.log('⚠️ WebSocket endpoint:', results.websocket.status);
    }
    
    // 5. اختبار Memory Usage
    console.log('\n5️⃣ اختبار Memory Usage:');
    const memoryUsage = process.memoryUsage();
    results.memoryUsage = {
      heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      external: `${(memoryUsage.external / 1024 / [(1024 * 1024)]).toFixed(2)} MB`,
      rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`
    };
    console.log('✅ Memory Usage:', results.memoryUsage);
    
    // 6. اختبار Concurrent Requests
    console.log('\n6️⃣ اختبار Concurrent Requests:');
    const concurrentPromises = [];
    for (let i = 0; i < 20; i++) {
      concurrentPromises.push(
        axios.get(`${baseURL}/health`).then(response => ({
          success: true,
          time: Date.now()
        })).catch(error => ({
          success: false,
          error: error.message
        }))
      );
    }
    const concurrentResults = await Promise.all(concurrentPromises);
    const successful = concurrentResults.filter(r => r.success).length;
    console.log('✅ الطلبات المتزامنة الناجحة:', successful + '/' + concurrentResults.length);
    
    // 7. تقييم الأداء العام
    console.log('\n7️⃣ تقييم الأداء العام:');
    const avgResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
    const performanceGrade = avgResponseTime < 50 ? 'ممتاز' : avgResponseTime < 100 ? 'جيد جداً' : avgResponseTime < 200 ? 'جيد' : 'يحتاج تحسين';
    
    console.log('✅ متوسط وقت الاستجابة:', avgResponseTime.toFixed(2) + 'ms');
    console.log('✅ تقييم الأداء:', performanceGrade);
    
    // 8. تقرير شامل
    console.log('\n📊 تقرير شامل للتحسينات:');
    console.log('='.repeat(50));
    console.log('🏥 Health Check:', results.health.status === 200 ? '✅ يعمل' : '❌ خطأ');
    console.log('⚡ Caching:', results.caching.average < 100 ? '✅ فعال' : '⚠️ يحتاج تحسين');
    console.log('🛡️ Rate Limiting:', results.rateLimiting.rateLimited > 0 ? '✅ يعمل' : '⚠️ غير مفعل');
    console.log('🔌 WebSocket:', results.websocket.available ? '✅ متاح' : '⚠️ غير متاح');
    console.log('💾 Memory Usage:', results.memoryUsage.heapUsed);
    console.log('📈 Performance Grade:', performanceGrade);
    console.log('='.repeat(50));
    
    // 9. توصيات التحسين
    console.log('\n💡 توصيات التحسين:');
    if (results.caching.average > 100) {
      console.log('⚠️ تحسين الـ Caching: متوسط وقت الاستجابة مرتفع');
    }
    if (results.rateLimiting.rateLimited === 0) {
      console.log('⚠️ تفعيل Rate Limiting: لم يتم اكتشاف أي قيود');
    }
    if (!results.websocket.available) {
      console.log('⚠️ إصلاح WebSocket: غير متاح حالياً');
    }
    if (parseFloat(results.memoryUsage.heapUsed) > 50) {
      console.log('⚠️ تحسين الذاكرة: استخدام مرتفع للذاكرة');
    }
    
    console.log('\n🎉 تم إكمال اختبار التحسينات بنجاح!');
    
    return results;
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    results.errors.push(error.message);
    return results;
  }
}

// تشغيل الاختبار
testComprehensiveOptimizations().then(results => {
  console.log('\n📋 ملخص النتائج:');
  console.log(JSON.stringify(results, null, 2));
}).catch(error => {
  console.error('❌ فشل الاختبار:', error);
});
