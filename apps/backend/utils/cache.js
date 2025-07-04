import { createClient } from 'redis';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';

dotenv.config();

class CacheService {
  constructor() {
    this.redisClient = null;
    this.nodeCache = new NodeCache({ stdTTL: 600 }); // 10 minutes default TTL
    this.isRedisConnected = false;
    this.initializeRedis();
  }

  async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redisClient = createClient({ url: redisUrl });
      
      this.redisClient.on('error', (err) => {
        console.warn('⚠️ Redis connection error, falling back to in-memory cache:', err.message);
        this.isRedisConnected = false;
      });

      this.redisClient.on('connect', () => {
        console.log('✅ Connected to Redis cache');
        this.isRedisConnected = true;
      });

      await this.redisClient.connect();
    } catch (error) {
      console.warn('⚠️ Redis not available, using in-memory cache only:', error.message);
      this.isRedisConnected = false;
    }
  }

  async get(key) {
    try {
      if (this.isRedisConnected && this.redisClient) {
        const value = await this.redisClient.get(key);
        return value ? JSON.parse(value) : null;
      }
    } catch (error) {
      console.warn('Redis get error, falling back to memory cache:', error.message);
    }
    
    // Fallback to in-memory cache
    return this.nodeCache.get(key) || null;
  }

  async set(key, value, ttl = 600) {
    try {
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.setEx(key, ttl, JSON.stringify(value));
      }
    } catch (error) {
      console.warn('Redis set error, falling back to memory cache:', error.message);
    }
    
    // Always set in memory cache as backup
    this.nodeCache.set(key, value, ttl);
  }

  async del(key) {
    try {
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.del(key);
      }
    } catch (error) {
      console.warn('Redis delete error:', error.message);
    }
    
    this.nodeCache.del(key);
  }

  async clear() {
    try {
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.flushAll();
      }
    } catch (error) {
      console.warn('Redis clear error:', error.message);
    }
    
    this.nodeCache.flushAll();
  }

  // Cache wrapper for functions
  async cached(key, fn, ttl = 600) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }

  // Generate cache key for AI analysis
  generateAIKey(prompt, imageHash) {
    return `ai:${imageHash}:${Buffer.from(prompt).toString('base64').slice(0, 20)}`;
  }

  // Generate cache key for database queries
  generateDBKey(query, params = []) {
    const paramStr = params.length > 0 ? JSON.stringify(params) : '';
    return `db:${Buffer.from(query + paramStr).toString('base64').slice(0, 30)}`;
  }

  async disconnect() {
    try {
      if (this.redisClient) {
        await this.redisClient.disconnect();
      }
    } catch (error) {
      console.warn('Error disconnecting from Redis:', error.message);
    }
  }
}

// Export singleton instance
const cacheService = new CacheService();
export default cacheService;
