import pkg from 'pg';
import cacheService from './cache.js';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;
const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false,
    // Connection pool optimization
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});
pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client:', err);
    process.exit(1); // Exit if database connection fails
});
class DatabaseService {
    constructor() {
        this.pool = pool;
    }
    // Basic query method
    async query(text, params = []) {
        const start = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            // Log slow queries (>1000ms)
            if (duration > 1000) {
                console.warn(`🐌 Slow query detected (${duration}ms):`, text.substring(0, 100));
            }
            return result;
        }
        catch (error) {
            console.error('❌ Database query error:', error.message);
            throw error;
        }
    }
    // Cached query method
    async cachedQuery(text, params = [], ttl = 300) {
        const cacheKey = cacheService.generateDBKey(text, params);
        return await cacheService.cached(cacheKey, async () => {
            const result = await this.query(text, params);
            return result.rows;
        }, ttl);
    }
    // Transaction wrapper
    async transaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    // Batch insert with optimization
    async batchInsert(table, columns, values) {
        if (!values.length)
            return;
        const placeholders = values.map((_, i) => `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`).join(', ');
        const flatValues = values.flat();
        const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders}`;
        return await this.query(query, flatValues);
    }
    // Get table statistics for optimization
    async getTableStats(tableName) {
        const query = `
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE tablename = $1
    `;
        return await this.query(query, [tableName]);
    }
    // Create index if not exists
    async createIndexIfNotExists(indexName, tableName, columns, options = {}) {
        const { unique = false, method = 'btree' } = options;
        const uniqueStr = unique ? 'UNIQUE' : '';
        const columnsStr = Array.isArray(columns) ? columns.join(', ') : columns;
        const query = `
      CREATE ${uniqueStr} INDEX IF NOT EXISTS ${indexName} 
      ON ${tableName} USING ${method} (${columnsStr})
    `;
        try {
            await this.query(query);
            console.log(`✅ Index ${indexName} created or already exists`);
        }
        catch (error) {
            console.warn(`⚠️ Could not create index ${indexName}:`, error.message);
        }
    }
    // Initialize common indexes for performance
    async initializeIndexes() {
        // Add common indexes that would be useful for a deck chatbot application
        await this.createIndexIfNotExists('idx_users_email', 'users', 'email', { unique: true });
        await this.createIndexIfNotExists('idx_projects_user_id', 'projects', 'user_id');
        await this.createIndexIfNotExists('idx_projects_created_at', 'projects', 'created_at');
        await this.createIndexIfNotExists('idx_analyses_project_id', 'analyses', 'project_id');
        await this.createIndexIfNotExists('idx_analyses_created_at', 'analyses', 'created_at');
        await this.createIndexIfNotExists('idx_files_project_id', 'files', 'project_id');
        await this.createIndexIfNotExists('idx_cache_key', 'cache_entries', 'cache_key', { unique: true });
    }
    async disconnect() {
        await this.pool.end();
    }
}
// Export singleton instance
const dbService = new DatabaseService();
export default dbService;
//# sourceMappingURL=db.js.map