import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { createRateLimitError } from './error-handler';
// Helper function to get user identifier
const getUserId = (req) => {
    // Try to get user ID from various sources
    return req.user?.id || req.ip || 'anonymous';
};
// Rate limiter configurations
const rateLimiters = {
    // General API rate limiting - 100 requests per 15 minutes
    general: new RateLimiterMemory({
        points: 100, // Number of requests
        duration: 15 * 60, // Per 15 minutes
        blockDuration: 15 * 60, // Block for 15 minutes if limit exceeded
    }),
    // Strict rate limiting for sensitive endpoints - 10 requests per 15 minutes
    strict: new RateLimiterMemory({
        points: 10,
        duration: 15 * 60,
        blockDuration: 15 * 60,
    }),
    // Chat-specific rate limiting - 20 requests per minute
    chat: new RateLimiterMemory({
        points: 20,
        duration: 60, // Per 1 minute
        blockDuration: 60,
    }),
    // Streaming-specific rate limiting - 10 requests per 5 minutes
    streaming: new RateLimiterMemory({
        points: 10,
        duration: 5 * 60, // Per 5 minutes
        blockDuration: 5 * 60,
    }),
    // Upload rate limiting - NEW - 5 uploads per 10 minutes
    upload: new RateLimiterMemory({
        points: 5,
        duration: 10 * 60, // Per 10 minutes
        blockDuration: 10 * 60,
    }),
    // Processing rate limiting - NEW - 3 requests per 2 minutes
    processing: new RateLimiterMemory({
        points: 3,
        duration: 2 * 60, // Per 2 minutes
        blockDuration: 2 * 60,
    }),
    // Burst protection - 30 requests per minute
    burst: new RateLimiterMemory({
        points: 30,
        duration: 60, // Per 1 minute
        blockDuration: 60,
    }),
    // Heavy operation rate limiting - 2 requests per 30 minutes
    heavy: new RateLimiterMemory({
        points: 2,
        duration: 30 * 60, // Per 30 minutes
        blockDuration: 30 * 60,
    }),
};
// Tiered rate limiters for different user types
const tieredRateLimiters = {
    free: new RateLimiterMemory({
        points: 50,
        duration: 15 * 60,
        blockDuration: 15 * 60,
    }),
    premium: new RateLimiterMemory({
        points: 200,
        duration: 15 * 60,
        blockDuration: 15 * 60,
    }),
    pro: new RateLimiterMemory({
        points: 500,
        duration: 15 * 60,
        blockDuration: 15 * 60,
    }),
    enterprise: new RateLimiterMemory({
        points: 1000,
        duration: 15 * 60,
        blockDuration: 15 * 60,
    }),
};
// Generic rate limiting middleware factory
const createRateLimitMiddleware = (rateLimiter, errorMessage, errorCode) => {
    return async (req, res, next) => {
        try {
            const key = getUserId(req);
            await rateLimiter.consume(key);
            next();
        }
        catch (rateLimiterRes) {
            if (rateLimiterRes instanceof RateLimiterRes) {
                // Add rate limit headers
                res.set({
                    'Retry-After': String(Math.round(rateLimiterRes.msBeforeNext / 1000) || 1),
                    'X-RateLimit-Limit': String(rateLimiter.points),
                    'X-RateLimit-Remaining': String(rateLimiterRes.remainingPoints || 0),
                    'X-RateLimit-Reset': String(new Date(Date.now() + rateLimiterRes.msBeforeNext)),
                });
                const error = createRateLimitError(errorMessage);
                error.code = errorCode;
                next(error);
            }
            else {
                next(rateLimiterRes);
            }
        }
    };
};
// General API rate limiting
export const generalRateLimit = createRateLimitMiddleware(rateLimiters.general, 'Too many requests from this IP, please try again later.', 'RATE_LIMIT_EXCEEDED');
// Strict rate limiting for sensitive endpoints
export const strictRateLimit = createRateLimitMiddleware(rateLimiters.strict, 'Too many requests for this endpoint, please try again later.', 'STRICT_RATE_LIMIT_EXCEEDED');
// Chat-specific rate limiting
export const chatRateLimit = createRateLimitMiddleware(rateLimiters.chat, 'Too many chat requests, please slow down.', 'CHAT_RATE_LIMIT_EXCEEDED');
// Streaming-specific rate limiting
export const streamingRateLimit = createRateLimitMiddleware(rateLimiters.streaming, 'Too many streaming requests, please wait before starting a new stream.', 'STREAMING_RATE_LIMIT_EXCEEDED');
// Upload rate limiting - NEW
export const uploadRateLimit = createRateLimitMiddleware(rateLimiters.upload, 'Too many file uploads, please wait before uploading again.', 'UPLOAD_RATE_LIMIT_EXCEEDED');
// Processing rate limiting - NEW
export const processingRateLimit = createRateLimitMiddleware(rateLimiters.processing, 'Too many processing requests, please wait for current operations to complete.', 'PROCESSING_RATE_LIMIT_EXCEEDED');
// Burst protection rate limiting
export const burstProtectionRateLimit = createRateLimitMiddleware(rateLimiters.burst, 'Request burst limit exceeded, please slow down.', 'BURST_RATE_LIMIT_EXCEEDED');
// Heavy operation rate limiting
export const heavyOperationRateLimit = createRateLimitMiddleware(rateLimiters.heavy, 'Heavy operation limit exceeded. Please wait before performing another resource-intensive operation.', 'HEAVY_OPERATION_RATE_LIMIT_EXCEEDED');
// Advanced user-based rate limiting with different tiers
export const tieredUserRateLimit = async (req, res, next) => {
    try {
        const userTier = req.user?.tier || 'free';
        const rateLimiter = tieredRateLimiters[userTier] || tieredRateLimiters.free;
        const key = getUserId(req);
        await rateLimiter.consume(key);
        next();
    }
    catch (rateLimiterRes) {
        if (rateLimiterRes instanceof RateLimiterRes) {
            const userTier = req.user?.tier || 'free';
            const rateLimiter = tieredRateLimiters[userTier] || tieredRateLimiters.free;
            res.set({
                'Retry-After': String(Math.round(rateLimiterRes.msBeforeNext / 1000) || 1),
                'X-RateLimit-Limit': String(rateLimiter.points),
                'X-RateLimit-Remaining': String(rateLimiterRes.remainingPoints || 0),
                'X-RateLimit-Reset': String(new Date(Date.now() + rateLimiterRes.msBeforeNext)),
            });
            const error = createRateLimitError(`Rate limit exceeded for ${userTier} tier. Limit: ${rateLimiter.points} requests per 15 minutes.`);
            error.code = 'TIERED_RATE_LIMIT_EXCEEDED';
            next(error);
        }
        else {
            next(rateLimiterRes);
        }
    }
};
// User-based rate limiting middleware factory
export const userBasedRateLimit = (maxRequests, windowSeconds, errorMessage) => {
    const rateLimiter = new RateLimiterMemory({
        points: maxRequests,
        duration: windowSeconds,
        blockDuration: windowSeconds,
    });
    return createRateLimitMiddleware(rateLimiter, errorMessage || `Too many requests. Limit: ${maxRequests} per ${windowSeconds} seconds.`, 'USER_RATE_LIMIT_EXCEEDED');
};
// Middleware to apply different rate limits based on endpoint
export const dynamicRateLimit = (req, res, next) => {
    const path = req.path;
    if (path.includes('/chat')) {
        chatRateLimit(req, res, next);
    }
    else if (path.includes('/stream')) {
        streamingRateLimit(req, res, next);
    }
    else if (path.includes('/upload')) {
        uploadRateLimit(req, res, next);
    }
    else if (path.includes('/process')) {
        processingRateLimit(req, res, next);
    }
    else if (path.includes('/heavy') || path.includes('/analyze')) {
        heavyOperationRateLimit(req, res, next);
    }
    else {
        generalRateLimit(req, res, next);
    }
};
// Rate limit status endpoint
export const getRateLimitStatus = async (req, res) => {
    try {
        const userId = getUserId(req);
        const rateLimiter = rateLimiters.general;
        // Get current status without consuming a point
        const resRateLimiter = await rateLimiter.get(userId);
        res.json({
            success: true,
            data: {
                userId,
                limit: rateLimiter.points,
                remaining: resRateLimiter ? resRateLimiter.remainingPoints : rateLimiter.points,
                resetTime: resRateLimiter ? new Date(Date.now() + resRateLimiter.msBeforeNext) : null,
                timeUntilReset: resRateLimiter ? resRateLimiter.msBeforeNext : 0
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get rate limit status',
                statusCode: 500
            }
        });
    }
};
// Clear rate limit for specific user (admin function)
export const clearUserRateLimit = async (userId) => {
    try {
        await Promise.all([
            rateLimiters.general.delete(userId),
            rateLimiters.strict.delete(userId),
            rateLimiters.chat.delete(userId),
            rateLimiters.streaming.delete(userId),
            rateLimiters.upload.delete(userId),
            rateLimiters.processing.delete(userId),
            rateLimiters.burst.delete(userId),
            rateLimiters.heavy.delete(userId),
            ...Object.values(tieredRateLimiters).map(limiter => limiter.delete(userId))
        ]);
        return true;
    }
    catch (error) {
        console.error('Failed to clear rate limits for user:', userId, error);
        return false;
    }
};
// Clear all rate limits (admin function)
// Note: RateLimiterMemory doesn't support clearing all entries at once
// This function recreates the rate limiters to effectively clear all limits
export const clearAllRateLimits = () => {
    try {
        // Recreate all rate limiters to clear their state
        Object.assign(rateLimiters, {
            general: new RateLimiterMemory({ points: 100, duration: 15 * 60, blockDuration: 15 * 60 }),
            strict: new RateLimiterMemory({ points: 10, duration: 15 * 60, blockDuration: 15 * 60 }),
            chat: new RateLimiterMemory({ points: 20, duration: 60, blockDuration: 60 }),
            streaming: new RateLimiterMemory({ points: 10, duration: 5 * 60, blockDuration: 5 * 60 }),
            upload: new RateLimiterMemory({ points: 5, duration: 10 * 60, blockDuration: 10 * 60 }),
            processing: new RateLimiterMemory({ points: 3, duration: 2 * 60, blockDuration: 2 * 60 }),
            burst: new RateLimiterMemory({ points: 30, duration: 60, blockDuration: 60 }),
            heavy: new RateLimiterMemory({ points: 2, duration: 30 * 60, blockDuration: 30 * 60 }),
        });
        Object.assign(tieredRateLimiters, {
            free: new RateLimiterMemory({ points: 50, duration: 15 * 60, blockDuration: 15 * 60 }),
            premium: new RateLimiterMemory({ points: 200, duration: 15 * 60, blockDuration: 15 * 60 }),
            pro: new RateLimiterMemory({ points: 500, duration: 15 * 60, blockDuration: 15 * 60 }),
            enterprise: new RateLimiterMemory({ points: 1000, duration: 15 * 60, blockDuration: 15 * 60 }),
        });
        console.log('All rate limits cleared successfully');
    }
    catch (error) {
        console.error('Failed to clear all rate limits:', error);
    }
};
// Export rate limiters for external access if needed
export { rateLimiters, tieredRateLimiters };
//# sourceMappingURL=rate-limiter.js.map