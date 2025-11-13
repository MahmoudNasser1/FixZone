const NodeCache = require('node-cache');

// إنشاء cache instance مع إعدادات محسنة
const cache = new NodeCache({
  stdTTL: 300, // 5 دقائق default TTL
  checkperiod: 60, // فحص كل دقيقة
  useClones: false, // تحسين الأداء
  maxKeys: 1000 // حد أقصى 1000 مفتاح
});

// إحصائيات الـ cache
let cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0
};

// Middleware للـ caching
const cacheMiddleware = (ttl = 300) => {
  return (req, res, next) => {
    // إنشاء مفتاح cache فريد
    const cacheKey = `${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;
    
    // محاولة جلب البيانات من الـ cache
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      cacheStats.hits++;
      console.log(`Cache HIT: ${cacheKey}`);
      return res.json(cachedData);
    }
    
    cacheStats.misses++;
    console.log(`Cache MISS: ${cacheKey}`);
    
    // حفظ الـ response الأصلي
    const originalJson = res.json;
    
    // Override الـ json method
    res.json = function(data) {
      // حفظ البيانات في الـ cache فقط إذا كانت النتيجة ناجحة
      if (res.statusCode === 200 && data) {
        cache.set(cacheKey, data, ttl);
        cacheStats.sets++;
        console.log(`Cache SET: ${cacheKey} (TTL: ${ttl}s)`);
      }
      
      // استدعاء الـ original method
      originalJson.call(this, data);
    };
    
    next();
  };
};

// دالة لمسح cache معين
const clearCache = (pattern = null) => {
  if (pattern) {
    const keys = cache.keys();
    const keysToDelete = keys.filter(key => key.includes(pattern));
    keysToDelete.forEach(key => cache.del(key));
    cacheStats.deletes += keysToDelete.length;
    console.log(`Cache CLEARED: ${keysToDelete.length} keys matching "${pattern}"`);
  } else {
    cache.flushAll();
    cacheStats.deletes += cache.keys().length;
    console.log('Cache CLEARED: All keys');
  }
};

// دالة لجلب إحصائيات الـ cache
const getCacheStats = () => {
  const totalRequests = cacheStats.hits + cacheStats.misses;
  const hitRate = totalRequests > 0 ? (cacheStats.hits / totalRequests * 100).toFixed(2) : 0;
  
  return {
    ...cacheStats,
    totalRequests,
    hitRate: `${hitRate}%`,
    cacheSize: cache.keys().length,
    memoryUsage: process.memoryUsage()
  };
};

// دالة لمسح cache عند تحديث البيانات
const invalidateCache = (pattern) => {
  clearCache(pattern);
};

module.exports = {
  cacheMiddleware,
  clearCache,
  getCacheStats,
  invalidateCache,
  cache // للاستخدام المباشر إذا لزم الأمر
};

