/**
 * Azure Blob Storage Service
 * Provides file upload/download, deck import/export, signed URL generation
 */

import { BlobServiceClient, ContainerClient, BlockBlobClient, BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } from '@azure/storage-blob';
import { azureConfig } from './azure-config.js';
import * as path from 'path';
import * as crypto from 'crypto';

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

class AzureStorageService {
  private static instance: AzureStorageService;
  private blobServiceClient: BlobServiceClient;
  private containers: {
    decks: ContainerClient;
    uploads: ContainerClient;
    exports: ContainerClient;
  };
  private config: any;
  private credential: StorageSharedKeyCredential;
  private initialized: boolean = false;

  private constructor() {
    this.config = azureConfig.getStorageConfig();
    this.initializeClient();
  }

  public static getInstance(): AzureStorageService {
    if (!AzureStorageService.instance) {
      AzureStorageService.instance = new AzureStorageService();
    }
    return AzureStorageService.instance;
  }

  /**
   * Initialize Azure Storage client and containers
   */
  private async initializeClient(): Promise<void> {
    if (!this.config.accountName || !this.config.accountKey) {
      console.warn('⚠️  Azure Storage not configured. File storage features will be unavailable.');
      return;
    }

    try {
      this.credential = new StorageSharedKeyCredential(
        this.config.accountName,
        this.config.accountKey
      );

      this.blobServiceClient = new BlobServiceClient(
        `https://${this.config.accountName}.blob.core.windows.net`,
        this.credential
      );

      // Initialize containers
      await this.initializeContainers();
      this.initialized = true;

      console.log('✅ Azure Storage initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Azure Storage:', error);
      throw error;
    }
  }

  /**
   * Initialize all required containers
   */
  private async initializeContainers(): Promise<void> {
    const containerConfigs = [
      { name: this.config.containers.decks, access: 'private' },
      { name: this.config.containers.uploads, access: 'private' },
      { name: this.config.containers.exports, access: 'private' },
    ];

    const containers: any = {};

    for (const containerConfig of containerConfigs) {
      const containerClient = this.blobServiceClient.getContainerClient(containerConfig.name);
      
      // Create container if it doesn't exist
      await containerClient.createIfNotExists({
        access: containerConfig.access as any,
      });

      containers[containerConfig.name] = containerClient;
    }

    this.containers = {
      decks: containers[this.config.containers.decks],
      uploads: containers[this.config.containers.uploads],
      exports: containers[this.config.containers.exports],
    };
  }

  /**
   * Ensure the service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeClient();
    }
  }

  /**
   * Generate a unique blob name
   */
  private generateBlobName(originalName: string, userId: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    
    return `${userId}/${timestamp}_${random}_${baseName}${extension}`;
  }

  // ==================== FILE UPLOAD/DOWNLOAD ====================

  /**
   * Upload a file to blob storage
   */
  public async uploadFile(
    containerName: keyof typeof this.containers,
    file: Buffer,
    fileName: string,
    userId: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    await this.ensureInitialized();

    const blobName = this.generateBlobName(fileName, userId);
    const containerClient = this.containers[containerName];
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const uploadOptions = {
      blobHTTPHeaders: {
        blobContentType: options.contentType || 'application/octet-stream',
      },
      metadata: {
        originalName: fileName,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
        ...options.metadata,
      },
      tags: options.tags,
    };

    try {
      const uploadResponse = await blockBlobClient.upload(
        file,
        file.length,
        uploadOptions
      );

      return {
        url: blockBlobClient.url,
        blobName,
        containerName,
        etag: uploadResponse.etag!,
        lastModified: uploadResponse.lastModified!,
        contentLength: file.length,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Download a file from blob storage
   */
  public async downloadFile(
    containerName: keyof typeof this.containers,
    blobName: string
  ): Promise<DownloadResult> {
    await this.ensureInitialized();

    const containerClient = this.containers[containerName];
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    try {
      const downloadResponse = await blockBlobClient.download();
      
      if (!downloadResponse.readableStreamBody) {
        throw new Error('No content available for download');
      }

      const content = await this.streamToBuffer(downloadResponse.readableStreamBody);

      return {
        content,
        contentType: downloadResponse.contentType || 'application/octet-stream',
        metadata: downloadResponse.metadata || {},
        lastModified: downloadResponse.lastModified!,
        etag: downloadResponse.etag!,
      };
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * Delete a file from blob storage
   */
  public async deleteFile(
    containerName: keyof typeof this.containers,
    blobName: string
  ): Promise<void> {
    await this.ensureInitialized();

    const containerClient = this.containers[containerName];
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    try {
      await blockBlobClient.delete();
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * List files in a container
   */
  public async listFiles(
    containerName: keyof typeof this.containers,
    prefix?: string,
    maxResults?: number
  ): Promise<FileMetadata[]> {
    await this.ensureInitialized();

    const containerClient = this.containers[containerName];
    const files: FileMetadata[] = [];

    try {
      const listOptions = {
        prefix,
        includeMetadata: true,
        includeTags: true,
      };

      let count = 0;
      for await (const blob of containerClient.listBlobsFlat(listOptions)) {
        if (maxResults && count >= maxResults) break;

        files.push({
          fileName: blob.metadata?.originalName || blob.name,
          fileSize: blob.properties.contentLength || 0,
          contentType: blob.properties.contentType || 'application/octet-stream',
          uploadedAt: new Date(blob.metadata?.uploadedAt || blob.properties.lastModified!),
          uploadedBy: blob.metadata?.uploadedBy || 'unknown',
          tags: blob.tags,
        });

        count++;
      }

      return files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  // ==================== SIGNED URLS ====================

  /**
   * Generate a signed URL for blob access
   */
  public async generateSignedUrl(
    containerName: keyof typeof this.containers,
    blobName: string,
    options: SignedUrlOptions
  ): Promise<string> {
    await this.ensureInitialized();

    const containerClient = this.containers[containerName];
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const permissions = new BlobSASPermissions();
    if (options.permissions.includes('r')) permissions.read = true;
    if (options.permissions.includes('w')) permissions.write = true;
    if (options.permissions.includes('d')) permissions.delete = true;

    const expiresOn = new Date();
    expiresOn.setMinutes(expiresOn.getMinutes() + (options.expiresInMinutes || 60));

    try {
      const sasToken = generateBlobSASQueryParameters(
        {
          containerName,
          blobName,
          permissions,
          expiresOn,
          contentType: options.contentType,
          contentDisposition: options.contentDisposition,
        },
        this.credential
      ).toString();

      return `${blockBlobClient.url}?${sasToken}`;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  // ==================== DECK IMPORT/EXPORT ====================

  /**
   * Export a deck to storage
   */
  public async exportDeck(
    deckData: DeckExportData,
    format: 'json' | 'txt' | 'mtgo' = 'json'
  ): Promise<UploadResult> {
    await this.ensureInitialized();

    let content: string;
    let contentType: string;
    let fileName: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(deckData, null, 2);
        contentType = 'application/json';
        fileName = `${deckData.name}_${deckData.deckId}.json`;
        break;
      
      case 'txt':
        content = this.formatDeckAsText(deckData);
        contentType = 'text/plain';
        fileName = `${deckData.name}_${deckData.deckId}.txt`;
        break;
      
      case 'mtgo':
        content = this.formatDeckAsMTGO(deckData);
        contentType = 'text/plain';
        fileName = `${deckData.name}_${deckData.deckId}.dec`;
        break;
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    const buffer = Buffer.from(content, 'utf-8');

    return this.uploadFile(
      'exports',
      buffer,
      fileName,
      deckData.exportedBy,
      {
        contentType,
        metadata: {
          deckId: deckData.deckId,
          deckName: deckData.name,
          format: deckData.format,
          exportFormat: format,
          exportedAt: deckData.exportedAt.toISOString(),
        },
        tags: {
          type: 'deck-export',
          format: deckData.format,
          exportFormat: format,
        },
      }
    );
  }

  /**
   * Import a deck from storage
   */
  public async importDeck(
    containerName: keyof typeof this.containers,
    blobName: string
  ): Promise<DeckExportData> {
    await this.ensureInitialized();

    const downloadResult = await this.downloadFile(containerName, blobName);
    const content = downloadResult.content.toString('utf-8');

    try {
      // Try to parse as JSON first
      const deckData = JSON.parse(content) as DeckExportData;
      return deckData;
    } catch (jsonError) {
      // If JSON parsing fails, try to parse as text format
      return this.parseDeckFromText(content, downloadResult.metadata);
    }
  }

  /**
   * Format deck as plain text
   */
  private formatDeckAsText(deckData: DeckExportData): string {
    let content = `// ${deckData.name}\n`;
    content += `// Format: ${deckData.format}\n`;
    if (deckData.description) {
      content += `// Description: ${deckData.description}\n`;
    }
    content += `// Exported: ${deckData.exportedAt.toISOString()}\n\n`;
    content += deckData.deckList;
    
    return content;
  }

  /**
   * Format deck as MTGO format
   */
  private formatDeckAsMTGO(deckData: DeckExportData): string {
    // MTGO format is similar to text but with specific formatting
    let content = '';
    const lines = deckData.deckList.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('//')) {
        content += trimmed + '\n';
      }
    }
    
    return content;
  }

  /**
   * Parse deck from text content
   */
  private parseDeckFromText(content: string, metadata: Record<string, string>): DeckExportData {
    const lines = content.split('\n');
    let deckList = '';
    let name = metadata.deckName || 'Imported Deck';
    let format = metadata.format || 'Unknown';
    let description = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('// ')) {
        const comment = trimmed.substring(3);
        if (comment.startsWith('Format:')) {
          format = comment.substring(7).trim();
        } else if (comment.startsWith('Description:')) {
          description = comment.substring(12).trim();
        }
      } else if (trimmed && !trimmed.startsWith('//')) {
        deckList += trimmed + '\n';
      }
    }

    return {
      deckId: metadata.deckId || `imported_${Date.now()}`,
      name,
      format,
      deckList: deckList.trim(),
      description,
      exportedAt: new Date(),
      exportedBy: 'import',
    };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Convert stream to buffer
   */
  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on('data', (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }

  /**
   * Get container usage statistics
   */
  public async getContainerStats(containerName: keyof typeof this.containers): Promise<{
    fileCount: number;
    totalSize: number;
    lastModified: Date | null;
  }> {
    await this.ensureInitialized();

    const containerClient = this.containers[containerName];
    let fileCount = 0;
    let totalSize = 0;
    let lastModified: Date | null = null;

    try {
      for await (const blob of containerClient.listBlobsFlat({ includeMetadata: true })) {
        fileCount++;
        totalSize += blob.properties.contentLength || 0;
        
        if (blob.properties.lastModified) {
          if (!lastModified || blob.properties.lastModified > lastModified) {
            lastModified = blob.properties.lastModified;
          }
        }
      }

      return { fileCount, totalSize, lastModified };
    } catch (error) {
      console.error('Error getting container stats:', error);
      throw new Error(`Failed to get container stats: ${error.message}`);
    }
  }

  /**
   * Clean up old files (older than specified days)
   */
  public async cleanupOldFiles(
    containerName: keyof typeof this.containers,
    olderThanDays: number
  ): Promise<number> {
    await this.ensureInitialized();

    const containerClient = this.containers[containerName];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let deletedCount = 0;

    try {
      for await (const blob of containerClient.listBlobsFlat()) {
        if (blob.properties.lastModified && blob.properties.lastModified < cutoffDate) {
          await containerClient.deleteBlob(blob.name);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old files:', error);
      throw new Error(`Failed to cleanup old files: ${error.message}`);
    }
  }

  // ==================== HEALTH CHECK ====================

  /**
   * Health check for the service
   */
  public async healthCheck(): Promise<{ status: string; configured: boolean; error?: string }> {
    try {
      if (!this.config.accountName || !this.config.accountKey) {
        return {
          status: 'unhealthy',
          configured: false,
          error: 'Azure Storage not configured'
        };
      }

      await this.ensureInitialized();

      // Test connectivity by listing containers
      const containerIter = this.blobServiceClient.listContainers();
      await containerIter.next();

      return {
        status: 'healthy',
        configured: true
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        configured: true,
        error: error.message
      };
    }
  }

  /**
   * Get storage statistics for all containers
   */
  public async getStorageStats(): Promise<{
    containers: {
      [key: string]: {
        fileCount: number;
        totalSize: number;
        lastModified: Date | null;
      };
    };
    totalFiles: number;
    totalSize: number;
  }> {
    await this.ensureInitialized();

    const containerNames = Object.keys(this.containers) as (keyof typeof this.containers)[];
    const containerStats: any = {};
    let totalFiles = 0;
    let totalSize = 0;

    for (const containerName of containerNames) {
      const stats = await this.getContainerStats(containerName);
      containerStats[containerName] = stats;
      totalFiles += stats.fileCount;
      totalSize += stats.totalSize;
    }

    return {
      containers: containerStats,
      totalFiles,
      totalSize,
    };
  }
}

// Export singleton instance
export const azureStorage = AzureStorageService.getInstance();
export default azureStorage;
