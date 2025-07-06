import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import cacheService from '../utils/cache.js';

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for AI/analysis endpoints
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 AI requests per windowMs
  message: {
    error: 'Too many AI analysis requests from this IP, please try again later.',
    retryAfter: '15 minutes',
    tip: 'AI analysis is resource-intensive. Please wait before making more requests.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit each IP to 100 uploads per hour
  message: {
    error: 'Too many file uploads from this IP, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Database query rate limiter
export const dbLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // Limit each IP to 200 database queries per minute
  message: {
    error: 'Too many database requests from this IP, please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Speed limiter for heavy operations (slows down instead of blocking)
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 10, // Allow 10 requests per windowMs without delay
  delayMs: () => 500, // Add 500ms delay per request after delayAfter (using function syntax)
  maxDelayMs: 5000, // Maximum delay of 5 seconds
});

// Custom rate limiter with Redis backend for distributed systems
export const createCustomLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    keyGenerator = (req) => req.ip,
    message = 'Too many requests',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return async (req, res, next) => {
    const key = `rate_limit:${keyGenerator(req)}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Get current request count from cache
      const requests = await cacheService.get(key) || [];

      // Filter out old requests outside the window
      const validRequests = requests.filter(timestamp => timestamp > windowStart);

      // Check if limit exceeded
      if (validRequests.length >= max) {
        const oldestRequest = Math.min(...validRequests);
        const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);

        res.set({
          'RateLimit-Limit': max,
          'RateLimit-Remaining': 0,
          'RateLimit-Reset': new Date(oldestRequest + windowMs).toISOString(),
          'Retry-After': retryAfter
        });

        return res.status(429).json({
          error: message,
          retryAfter: `${retryAfter} seconds`
        });
      }

      // Add current request timestamp
      validRequests.push(now);

      // Store updated request list
      await cacheService.set(key, validRequests, Math.ceil(windowMs / 1000));

      // Set rate limit headers
      res.set({
        'RateLimit-Limit': max,
        'RateLimit-Remaining': Math.max(0, max - validRequests.length),
        'RateLimit-Reset': new Date(now + windowMs).toISOString()
      });

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // If rate limiting fails, allow the request to proceed
      next();
    }
  };
};

// Adaptive rate limiter that adjusts based on server load
export const adaptiveLimiter = (baseOptions = {}) => {
  const {
    baseMax = 100,
    windowMs = 15 * 60 * 1000,
    loadThresholds = { low: 0.5, medium: 0.7, high: 0.9 }
  } = baseOptions;

  return async (req, res, next) => {
    try {
      // Get current server load (simplified - in production, use actual metrics)
      const memUsage = process.memoryUsage();
      const loadFactor = memUsage.heapUsed / memUsage.heapTotal;

      let adjustedMax = baseMax;

      if (loadFactor > loadThresholds.high) {
        adjustedMax = Math.floor(baseMax * 0.3); // Reduce to 30% under high load
      } else if (loadFactor > loadThresholds.medium) {
        adjustedMax = Math.floor(baseMax * 0.6); // Reduce to 60% under medium load
      } else if (loadFactor > loadThresholds.low) {
        adjustedMax = Math.floor(baseMax * 0.8); // Reduce to 80% under low-medium load
      }

      // Create dynamic rate limiter
      const dynamicLimiter = createCustomLimiter({
        windowMs,
        max: adjustedMax,
        message: `Server under load. Reduced rate limit to ${adjustedMax} requests per window.`
      });

      return dynamicLimiter(req, res, next);
    } catch (error) {
      console.error('Adaptive rate limiting error:', error);
      next();
    }
  };
};

// Rate limiter for specific user roles or API keys
export const createUserBasedLimiter = (getUserLimits) => {
  return async (req, res, next) => {
    try {
      const userLimits = await getUserLimits(req);
      const limiter = createCustomLimiter({
        ...userLimits,
        keyGenerator: (req) => `user:${req.user?.id || req.ip}`
      });

      return limiter(req, res, next);
    } catch (error) {
      console.error('User-based rate limiting error:', error);
      next();
    }
  };
};

// Export all limiters
export default {
  general: generalLimiter,
  ai: aiLimiter,
  upload: uploadLimiter,
  db: dbLimiter,
  speed: speedLimiter,
  custom: createCustomLimiter,
  adaptive: adaptiveLimiter,
  userBased: createUserBasedLimiter
};
