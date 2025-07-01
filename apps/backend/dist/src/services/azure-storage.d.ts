/**
 * Azure Blob Storage Service
 * Provides file upload/download, deck import/export, signed URL generation
 */
export interface UploadOptions {
    contentType?: string;
    metadata?: Record<string, string>;
    tags?: Record<string, string>;
    overwrite?: boolean;
}
export interface UploadResult {
    url: string;
    blobName: string;
    containerName: string;
    etag: string;
    lastModified: Date;
    contentLength: number;
}
export interface DownloadResult {
    content: Buffer;
    contentType: string;
    metadata: Record<string, string>;
    lastModified: Date;
    etag: string;
}
export interface SignedUrlOptions {
    permissions: 'r' | 'w' | 'rw' | 'd';
    expiresInMinutes?: number;
    contentType?: string;
    contentDisposition?: string;
}
export interface DeckExportData {
    deckId: string;
    name: string;
    format: string;
    deckList: string;
    description?: string;
    exportedAt: Date;
    exportedBy: string;
}
export interface FileMetadata {
    fileName: string;
    fileSize: number;
    contentType: string;
    uploadedAt: Date;
    uploadedBy: string;
    tags?: Record<string, string>;
}
declare class AzureStorageService {
    private static instance;
    private blobServiceClient;
    private containers;
    private config;
    private credential;
    private initialized;
    private constructor();
    static getInstance(): AzureStorageService;
    /**
     * Initialize Azure Storage client and containers
     */
    private initializeClient;
    /**
     * Initialize all required containers
     */
    private initializeContainers;
    /**
     * Ensure the service is initialized
     */
    private ensureInitialized;
    /**
     * Generate a unique blob name
     */
    private generateBlobName;
    /**
     * Upload a file to blob storage
     */
    uploadFile(containerName: keyof typeof this.containers, file: Buffer, fileName: string, userId: string, options?: UploadOptions): Promise<UploadResult>;
    /**
     * Download a file from blob storage
     */
    downloadFile(containerName: keyof typeof this.containers, blobName: string): Promise<DownloadResult>;
    /**
     * Delete a file from blob storage
     */
    deleteFile(containerName: keyof typeof this.containers, blobName: string): Promise<void>;
    /**
     * List files in a container
     */
    listFiles(containerName: keyof typeof this.containers, prefix?: string, maxResults?: number): Promise<FileMetadata[]>;
    /**
     * Generate a signed URL for blob access
     */
    generateSignedUrl(containerName: keyof typeof this.containers, blobName: string, options: SignedUrlOptions): Promise<string>;
    /**
     * Export a deck to storage
     */
    exportDeck(deckData: DeckExportData, format?: 'json' | 'txt' | 'mtgo'): Promise<UploadResult>;
    /**
     * Import a deck from storage
     */
    importDeck(containerName: keyof typeof this.containers, blobName: string): Promise<DeckExportData>;
    /**
     * Format deck as plain text
     */
    private formatDeckAsText;
    /**
     * Format deck as MTGO format
     */
    private formatDeckAsMTGO;
    /**
     * Parse deck from text content
     */
    private parseDeckFromText;
    /**
     * Convert stream to buffer
     */
    private streamToBuffer;
    /**
     * Get container usage statistics
     */
    getContainerStats(containerName: keyof typeof this.containers): Promise<{
        fileCount: number;
        totalSize: number;
        lastModified: Date | null;
    }>;
    /**
     * Clean up old files (older than specified days)
     */
    cleanupOldFiles(containerName: keyof typeof this.containers, olderThanDays: number): Promise<number>;
    /**
     * Health check for the service
     */
    healthCheck(): Promise<{
        status: string;
        configured: boolean;
        error?: string;
    }>;
    /**
     * Get storage statistics for all containers
     */
    getStorageStats(): Promise<{
        containers: {
            [key: string]: {
                fileCount: number;
                totalSize: number;
                lastModified: Date | null;
            };
        };
        totalFiles: number;
        totalSize: number;
    }>;
}
export declare const azureStorage: AzureStorageService;
export default azureStorage;
//# sourceMappingURL=azure-storage.d.ts.map