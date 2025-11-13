const rateLimit = require('express-rate-limit');

// Rate limiting configurations
const createRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs: windowMs,
    max: max,
    message: {
      error: 'Too many requests',
      message: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: skipSuccessfulRequests,
    handler: (req, res) => {
      console.log(`Rate limit exceeded for ${req.ip} on ${req.path}`);
      res.status(429).json({
        error: 'Too many requests',
        message: message,
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    }
  });
};

// General API rate limiting
const generalApiLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'Too many API requests from this IP, please try again later.',
  true
);

// Strict rate limiting for auth endpoints
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 login attempts per window
  'Too many authentication attempts, please try again later.',
  false
);

// Rate limiting for repair operations
const repairLimiter = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  20, // 20 repair operations per window
  'Too many repair operations, please slow down.',
  true
);

// Rate limiting for search operations
const searchLimiter = createRateLimit(
  1 * 60 * 1000, // 1 minute
  30, // 30 searches per minute
  'Too many search requests, please slow down.',
  true
);

// Rate limiting for file uploads
const uploadLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hour
  10, // 10 uploads per hour
  'Too many file uploads, please try again later.',
  false
);

// Dynamic rate limiting based on system load
const dynamicRateLimit = (req, res, next) => {
  const memoryUsage = process.memoryUsage();
  const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  
  // If memory usage is high, apply stricter rate limiting
  if (memoryUsagePercent > 80) {
    console.log(`High memory usage detected: ${memoryUsagePercent.toFixed(2)}%`);
    return createRateLimit(
      5 * 60 * 1000, // 5 minutes
      10, // 10 requests per window
      'Server is under high load, please try again later.',
      true
    )(req, res, next);
  }
  
  // Normal rate limiting
  next();
};

// IP-based rate limiting with whitelist
const ipBasedRateLimit = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Whitelist for admin IPs (you can add specific IPs here)
  const whitelistIPs = [
    '127.0.0.1',
    '::1',
    'localhost'
  ];
  
  if (whitelistIPs.includes(clientIP)) {
    return next(); // Skip rate limiting for whitelisted IPs
  }
  
  // Apply normal rate limiting for other IPs
  return generalApiLimiter(req, res, next);
};

// User-based rate limiting (if user is authenticated)
const userBasedRateLimit = (req, res, next) => {
  if (req.user && req.user.id) {
    // Authenticated users get higher limits
    return createRateLimit(
      15 * 60 * 1000, // 15 minutes
      200, // 200 requests per window
      'Too many requests from this user account.',
      true
    )(req, res, next);
  }
  
  // Unauthenticated users get normal limits
  return generalApiLimiter(req, res, next);
};

// Rate limiting for specific endpoints
const endpointRateLimits = {
  '/api/auth/login': authLimiter,
  '/api/auth/register': authLimiter,
  '/api/repairs': repairLimiter,
  '/api/customers': createRateLimit(
    5 * 60 * 1000, // 5 minutes
    30, // 30 customer operations per window
    'Too many customer operations, please slow down.',
    true
  ),
  '/api/search': searchLimiter,
  '/api/upload': uploadLimiter
};

// Apply rate limiting to specific endpoints
const applyEndpointRateLimit = (req, res, next) => {
  const path = req.path;
  
  // Check if there's a specific rate limit for this endpoint
  for (const [endpoint, limiter] of Object.entries(endpointRateLimits)) {
    if (path.startsWith(endpoint)) {
      return limiter(req, res, next);
    }
  }
  
  // Apply general rate limiting for other endpoints
  return generalApiLimiter(req, res, next);
};

// Rate limiting for WebSocket connections
const websocketRateLimit = {
  connections: new Map(),
  maxConnectionsPerIP: 5,
  windowMs: 60 * 1000, // 1 minute
  
  check(ip) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.connections.has(ip)) {
      this.connections.set(ip, []);
    }
    
    const connections = this.connections.get(ip);
    
    // Remove old connections
    const recentConnections = connections.filter(time => time > windowStart);
    this.connections.set(ip, recentConnections);
    
    // Check if limit exceeded
    if (recentConnections.length >= this.maxConnectionsPerIP) {
      return false;
    }
    
    // Add current connection
    recentConnections.push(now);
    return true;
  }
};

// Cleanup old connection records periodically
setInterval(() => {
  const now = Date.now();
  websocketRateLimit.connections.forEach((connections, ip) => {
    const recentConnections = connections.filter(time => time > now - websocketRateLimit.windowMs);
    if (recentConnections.length === 0) {
      websocketRateLimit.connections.delete(ip);
    } else {
      websocketRateLimit.connections.set(ip, recentConnections);
    }
  });
}, 60000); // Cleanup every minute

module.exports = {
  generalApiLimiter,
  authLimiter,
  repairLimiter,
  searchLimiter,
  uploadLimiter,
  dynamicRateLimit,
  ipBasedRateLimit,
  userBasedRateLimit,
  applyEndpointRateLimit,
  websocketRateLimit
};
