export default dataRetentionService;
declare const dataRetentionService: DataRetentionService;
/**
 * Data Retention Service for DeckChatbot
 * Handles automatic cleanup of expired data according to retention policies
 */
declare class DataRetentionService {
    isRunning: boolean;
    lastCleanup: Date | null;
    cleanupInterval: number;
    stats: {
        totalCleaned: number;
        lastRun: null;
        errors: never[];
    };
    /**
     * Start the automatic data retention cleanup process
     */
    start(): void;
    intervalId: NodeJS.Timeout | null | undefined;
    /**
     * Stop the automatic data retention cleanup process
     */
    stop(): void;
    /**
     * Run the data retention cleanup process
     */
    runCleanup(): Promise<void>;
    /**
     * Clean up expired user sessions
     */
    cleanupExpiredSessions(): Promise<any>;
    /**
     * Clean up expired file uploads
     */
    cleanupExpiredFiles(): Promise<number>;
    /**
     * Clean up expired analysis results
     */
    cleanupExpiredAnalyses(): Promise<any>;
    /**
     * Clean up expired cache entries
     */
    cleanupExpiredCache(): Promise<1 | 0>;
    /**
     * Clean up expired log entries
     */
    cleanupExpiredLogs(): Promise<any>;
    /**
     * Clean up temporary files
     */
    cleanupTempFiles(): Promise<number>;
    /**
     * Securely delete a file by overwriting it before deletion
     */
    secureDeleteFile(filePath: any): Promise<void>;
    /**
     * Clean up data for a specific user (GDPR right to be forgotten)
     */
    cleanupUserData(userId: any): Promise<boolean>;
    /**
     * Get data retention statistics
     */
    getStats(): {
        isRunning: boolean;
        lastCleanup: Date | null;
        nextCleanup: Date | null;
        retentionPolicies: {
            user: string;
            session: string;
            file: string;
            analysis: string;
            logs: string;
            cache: string;
            temp: string;
        };
        totalCleaned: number;
        lastRun: null;
        errors: never[];
    };
    /**
     * Force run cleanup for a specific data type
     */
    forceCleanup(dataType: any): Promise<any>;
}
//# sourceMappingURL=dataRetentionService.d.ts.map