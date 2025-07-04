import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id?: string;
                tier?: 'free' | 'premium' | 'pro' | 'enterprise';
            };
        }
    }
}
declare const rateLimiters: {
    general: RateLimiterMemory;
    strict: RateLimiterMemory;
    chat: RateLimiterMemory;
    streaming: RateLimiterMemory;
    upload: RateLimiterMemory;
    processing: RateLimiterMemory;
    burst: RateLimiterMemory;
    heavy: RateLimiterMemory;
};
declare const tieredRateLimiters: {
    free: RateLimiterMemory;
    premium: RateLimiterMemory;
    pro: RateLimiterMemory;
    enterprise: RateLimiterMemory;
};
export declare const generalRateLimit: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const strictRateLimit: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const chatRateLimit: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const streamingRateLimit: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const uploadRateLimit: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const processingRateLimit: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const burstProtectionRateLimit: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const heavyOperationRateLimit: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const tieredUserRateLimit: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const userBasedRateLimit: (maxRequests: number, windowSeconds: number, errorMessage?: string) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const dynamicRateLimit: (req: Request, res: Response, next: NextFunction) => void;
export declare const getRateLimitStatus: (req: Request, res: Response) => Promise<void>;
export declare const clearUserRateLimit: (userId: string) => Promise<boolean>;
export declare const clearAllRateLimits: () => void;
export { rateLimiters, tieredRateLimiters };
//# sourceMappingURL=rate-limiter.d.ts.map