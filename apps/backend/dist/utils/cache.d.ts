export default cacheService;
declare const cacheService: CacheService;
declare class CacheService {
    redisClient: any;
    nodeCache: any;
    isRedisConnected: boolean;
    initializeRedis(): Promise<void>;
    get(key: any): Promise<any>;
    set(key: any, value: any, ttl?: number): Promise<void>;
    del(key: any): Promise<void>;
    clear(): Promise<void>;
    cached(key: any, fn: any, ttl?: number): Promise<any>;
    generateAIKey(prompt: any, imageHash: any): string;
    generateDBKey(query: any, params?: any[]): string;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=cache.d.ts.map