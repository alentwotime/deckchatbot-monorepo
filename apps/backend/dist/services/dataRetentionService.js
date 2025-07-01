import dbService from '../utils/db.js';
import dataProtectionService from '../utils/dataProtection.js';
import cacheService from '../utils/cache.js';
import fs from 'fs/promises';
import path from 'path';
/**
 * Data Retention Service for DeckChatbot
 * Handles automatic cleanup of expired data according to retention policies
 */
class DataRetentionService {
    constructor() {
        this.isRunning = false;
        this.lastCleanup = null;
        this.cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours
        this.stats = {
            totalCleaned: 0,
            lastRun: null,
            errors: []
        };
    }
    /**
     * Start the automatic data retention cleanup process
     */
    start() {
        if (this.isRunning) {
            console.log('📋 Data retention service already running');
            return;
        }
        this.isRunning = true;
        console.log('🚀 Starting data retention service...');
        // Run initial cleanup
        this.runCleanup();
        // Schedule periodic cleanup
        this.intervalId = setInterval(() => {
            this.runCleanup();
        }, this.cleanupInterval);
        console.log('✅ Data retention service started');
    }
    /**
     * Stop the automatic data retention cleanup process
     */
    stop() {
        if (!this.isRunning) {
            return;
        }
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('🛑 Data retention service stopped');
    }
    /**
     * Run the data retention cleanup process
     */
    async runCleanup() {
        if (!this.isRunning) {
            return;
        }
        console.log('🧹 Starting data retention cleanup...');
        const startTime = Date.now();
        let totalCleaned = 0;
        try {
            // Clean up expired sessions
            const sessionsDeleted = await this.cleanupExpiredSessions();
            totalCleaned += sessionsDeleted;
            // Clean up expired files
            const filesDeleted = await this.cleanupExpiredFiles();
            totalCleaned += filesDeleted;
            // Clean up expired analyses
            const analysesDeleted = await this.cleanupExpiredAnalyses();
            totalCleaned += analysesDeleted;
            // Clean up expired cache entries
            const cacheDeleted = await this.cleanupExpiredCache();
            totalCleaned += cacheDeleted;
            // Clean up expired logs
            const logsDeleted = await this.cleanupExpiredLogs();
            totalCleaned += logsDeleted;
            // Clean up temporary files
            const tempFilesDeleted = await this.cleanupTempFiles();
            totalCleaned += tempFilesDeleted;
            // Update statistics
            this.stats.totalCleaned += totalCleaned;
            this.stats.lastRun = new Date();
            this.lastCleanup = new Date();
            const duration = Date.now() - startTime;
            console.log(`✅ Data retention cleanup completed in ${duration}ms`);
            console.log(`📊 Cleaned up ${totalCleaned} records`);
        }
        catch (error) {
            console.error('❌ Data retention cleanup failed:', error);
            this.stats.errors.push({
                timestamp: new Date(),
                error: error.message
            });
        }
    }
    /**
     * Clean up expired user sessions
     */
    async cleanupExpiredSessions() {
        const retentionDays = dataProtectionService.getRetentionPeriod('session');
        const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));
        try {
            const result = await dbService.query(`DELETE FROM sessions WHERE started_at < $1`, [cutoffDate]);
            const deletedCount = result.rowCount || 0;
            if (deletedCount > 0) {
                console.log(`🗑️ Deleted ${deletedCount} expired sessions`);
            }
            return deletedCount;
        }
        catch (error) {
            console.error('Error cleaning up sessions:', error);
            return 0;
        }
    }
    /**
     * Clean up expired file uploads
     */
    async cleanupExpiredFiles() {
        const retentionDays = dataProtectionService.getRetentionPeriod('file');
        const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));
        try {
            // Get files to delete (with file paths)
            const filesToDelete = await dbService.query(`SELECT id, file_path, file_url FROM uploads WHERE uploaded_at < $1`, [cutoffDate]);
            let deletedCount = 0;
            // Delete physical files first
            for (const file of filesToDelete.rows) {
                try {
                    if (file.file_path) {
                        await this.secureDeleteFile(file.file_path);
                    }
                }
                catch (fileError) {
                    console.warn(`Warning: Could not delete file ${file.file_path}:`, fileError.message);
                }
            }
            // Delete database records
            if (filesToDelete.rows.length > 0) {
                const result = await dbService.query(`DELETE FROM uploads WHERE uploaded_at < $1`, [cutoffDate]);
                deletedCount = result.rowCount || 0;
                if (deletedCount > 0) {
                    console.log(`🗑️ Deleted ${deletedCount} expired files`);
                }
            }
            return deletedCount;
        }
        catch (error) {
            console.error('Error cleaning up files:', error);
            return 0;
        }
    }
    /**
     * Clean up expired analysis results
     */
    async cleanupExpiredAnalyses() {
        const retentionDays = dataProtectionService.getRetentionPeriod('analysis');
        const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));
        try {
            const result = await dbService.query(`DELETE FROM analyses WHERE created_at < $1`, [cutoffDate]);
            const deletedCount = result.rowCount || 0;
            if (deletedCount > 0) {
                console.log(`🗑️ Deleted ${deletedCount} expired analyses`);
            }
            return deletedCount;
        }
        catch (error) {
            console.error('Error cleaning up analyses:', error);
            return 0;
        }
    }
    /**
     * Clean up expired cache entries
     */
    async cleanupExpiredCache() {
        try {
            // Clear expired cache entries
            // Note: Redis and NodeCache handle TTL automatically, 
            // but we can force cleanup of old entries
            await cacheService.clear();
            console.log('🗑️ Cleared expired cache entries');
            return 1; // Symbolic count
        }
        catch (error) {
            console.error('Error cleaning up cache:', error);
            return 0;
        }
    }
    /**
     * Clean up expired log entries
     */
    async cleanupExpiredLogs() {
        const retentionDays = dataProtectionService.getRetentionPeriod('logs');
        const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));
        try {
            // Clean up application logs if they exist in database
            const result = await dbService.query(`DELETE FROM logs WHERE created_at < $1`, [cutoffDate]).catch(() => ({ rowCount: 0 })); // Table might not exist
            const deletedCount = result.rowCount || 0;
            if (deletedCount > 0) {
                console.log(`🗑️ Deleted ${deletedCount} expired log entries`);
            }
            return deletedCount;
        }
        catch (error) {
            console.error('Error cleaning up logs:', error);
            return 0;
        }
    }
    /**
     * Clean up temporary files
     */
    async cleanupTempFiles() {
        const retentionDays = dataProtectionService.getRetentionPeriod('temp');
        const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
        try {
            const uploadsDir = path.join(process.cwd(), 'uploads');
            let deletedCount = 0;
            try {
                const files = await fs.readdir(uploadsDir);
                for (const file of files) {
                    const filePath = path.join(uploadsDir, file);
                    const stats = await fs.stat(filePath);
                    if (stats.mtime.getTime() < cutoffTime) {
                        await this.secureDeleteFile(filePath);
                        deletedCount++;
                    }
                }
            }
            catch (dirError) {
                // Uploads directory might not exist
                console.log('Uploads directory not found, skipping temp file cleanup');
            }
            if (deletedCount > 0) {
                console.log(`🗑️ Deleted ${deletedCount} temporary files`);
            }
            return deletedCount;
        }
        catch (error) {
            console.error('Error cleaning up temp files:', error);
            return 0;
        }
    }
    /**
     * Securely delete a file by overwriting it before deletion
     */
    async secureDeleteFile(filePath) {
        try {
            // Check if file exists
            await fs.access(filePath);
            // Get file size
            const stats = await fs.stat(filePath);
            const fileSize = stats.size;
            // Overwrite file with random data multiple times
            for (let i = 0; i < 3; i++) {
                const randomData = Buffer.alloc(fileSize);
                for (let j = 0; j < fileSize; j++) {
                    randomData[j] = Math.floor(Math.random() * 256);
                }
                await fs.writeFile(filePath, randomData);
            }
            // Finally delete the file
            await fs.unlink(filePath);
        }
        catch (error) {
            // File might not exist or be accessible
            throw new Error(`Failed to securely delete file: ${error.message}`);
        }
    }
    /**
     * Clean up data for a specific user (GDPR right to be forgotten)
     */
    async cleanupUserData(userId) {
        console.log(`🧹 Cleaning up all data for user ${userId}...`);
        try {
            await dbService.transaction(async (client) => {
                // Get user's sessions
                const sessions = await client.query('SELECT id FROM sessions WHERE user_id = $1', [userId]);
                // Delete user's files
                const files = await client.query(`SELECT file_path FROM uploads u 
           JOIN sessions s ON u.session_id = s.id 
           WHERE s.user_id = $1`, [userId]);
                // Securely delete physical files
                for (const file of files.rows) {
                    if (file.file_path) {
                        try {
                            await this.secureDeleteFile(file.file_path);
                        }
                        catch (fileError) {
                            console.warn(`Warning: Could not delete file ${file.file_path}:`, fileError.message);
                        }
                    }
                }
                // Delete database records in correct order (respecting foreign keys)
                await client.query(`DELETE FROM skirting_options 
           WHERE deck_shape_id IN (
             SELECT ds.id FROM deck_shapes ds 
             JOIN sessions s ON ds.session_id = s.id 
             WHERE s.user_id = $1
           )`, [userId]);
                await client.query(`DELETE FROM uploads 
           WHERE session_id IN (
             SELECT id FROM sessions WHERE user_id = $1
           )`, [userId]);
                await client.query(`DELETE FROM deck_shapes 
           WHERE session_id IN (
             SELECT id FROM sessions WHERE user_id = $1
           )`, [userId]);
                await client.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
                await client.query('DELETE FROM users WHERE id = $1', [userId]);
            });
            console.log(`✅ Successfully cleaned up all data for user ${userId}`);
            return true;
        }
        catch (error) {
            console.error(`❌ Failed to cleanup user data for ${userId}:`, error);
            throw error;
        }
    }
    /**
     * Get data retention statistics
     */
    getStats() {
        return {
            ...this.stats,
            isRunning: this.isRunning,
            lastCleanup: this.lastCleanup,
            nextCleanup: this.isRunning ? new Date(Date.now() + this.cleanupInterval) : null,
            retentionPolicies: {
                user: dataProtectionService.getRetentionPeriod('user') + ' days',
                session: dataProtectionService.getRetentionPeriod('session') + ' days',
                file: dataProtectionService.getRetentionPeriod('file') + ' days',
                analysis: dataProtectionService.getRetentionPeriod('analysis') + ' days',
                logs: dataProtectionService.getRetentionPeriod('logs') + ' days',
                cache: dataProtectionService.getRetentionPeriod('cache') + ' days',
                temp: dataProtectionService.getRetentionPeriod('temp') + ' days'
            }
        };
    }
    /**
     * Force run cleanup for a specific data type
     */
    async forceCleanup(dataType) {
        console.log(`🧹 Force cleaning up ${dataType} data...`);
        switch (dataType) {
            case 'sessions':
                return await this.cleanupExpiredSessions();
            case 'files':
                return await this.cleanupExpiredFiles();
            case 'analyses':
                return await this.cleanupExpiredAnalyses();
            case 'cache':
                return await this.cleanupExpiredCache();
            case 'logs':
                return await this.cleanupExpiredLogs();
            case 'temp':
                return await this.cleanupTempFiles();
            default:
                throw new Error(`Unknown data type: ${dataType}`);
        }
    }
}
// Export singleton instance
const dataRetentionService = new DataRetentionService();
export default dataRetentionService;
//# sourceMappingURL=dataRetentionService.js.map