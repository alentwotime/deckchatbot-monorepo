/**
 * Azure-Specific Types for DeckChatBot
 * Comprehensive TypeScript type definitions for Azure services integration
 */

// ==================== AZURE CONFIGURATION ====================

export interface AzureConfig {
  // Azure OpenAI Configuration
  openai: {
    endpoint: string;
    apiKey: string;
    apiVersion: string;
    deploymentName: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };

  // Azure Cosmos DB Configuration
  cosmosDb: {
    endpoint: string;
    key: string;
    databaseId: string;
    containers: {
      chats: string;
      sessions: string;
      decks: string;
    };
  };

  // Azure Storage Configuration
  storage: {
    accountName: string;
    accountKey: string;
    connectionString: string;
    containers: {
      decks: string;
      uploads: string;
      exports: string;
    };
  };

  // Azure Identity Configuration
  identity: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
  };

  // Azure Service Bus Configuration
  serviceBus: {
    connectionString: string;
    namespace: string;
    queues: {
      deckAnalysis: string;
      notifications: string;
      exports: string;
      imports: string;
    };
    topics: {
      userActivity: string;
      systemEvents: string;
    };
  };

  // Azure Key Vault Configuration
  keyVault: {
    vaultUrl: string;
    secrets: {
      openaiApiKey: string;
      cosmosDbKey: string;
      storageAccountKey: string;
      jwtSecret: string;
    };
  };

  // General Azure Configuration
  subscriptionId: string;
  resourceGroupName: string;
  region: string;
}

// ==================== AZURE STORAGE TYPES ====================

export interface StorageOptions {
  containerName: string;
  blobName?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  overwrite?: boolean;
  tier?: 'Hot' | 'Cool' | 'Archive';
  encryption?: {
    enabled: boolean;
    keyVaultKeyId?: string;
  };
}

export interface UploadOptions extends StorageOptions {
  progressCallback?: (progress: UploadProgress) => void;
  chunkSize?: number;
  maxConcurrency?: number;
}

export interface UploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
  speed: number; // bytes per second
  estimatedTimeRemaining: number; // seconds
}

export interface UploadResult {
  url: string;
  blobName: string;
  containerName: string;
  etag: string;
  lastModified: Date;
  contentLength: number;
  contentMD5?: string;
  serverEncrypted?: boolean;
}

export interface DownloadResult {
  content: Buffer;
  contentType: string;
  metadata: Record<string, string>;
  lastModified: Date;
  etag: string;
  contentLength: number;
  tags?: Record<string, string>;
}

export interface SignedUrlOptions {
  permissions: 'r' | 'w' | 'rw' | 'd' | 'l';
  expiresInMinutes?: number;
  contentType?: string;
  contentDisposition?: string;
  ipRange?: string;
  protocol?: 'https' | 'http,https';
}

export interface BlobMetadata {
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedAt: Date;
  uploadedBy: string;
  tags?: Record<string, string>;
  checksum?: string;
  isEncrypted?: boolean;
}

export interface ContainerStats {
  fileCount: number;
  totalSize: number;
  lastModified: Date | null;
  averageFileSize: number;
  containerName: string;
}

// ==================== AZURE SERVICE BUS TYPES ====================

export interface ServiceBusMessage {
  messageId: string;
  body: any;
  label?: string;
  contentType?: string;
  correlationId?: string;
  sessionId?: string;
  replyTo?: string;
  timeToLive?: number;
  scheduledEnqueueTime?: Date;
  userProperties?: Record<string, any>;
  applicationProperties?: Record<string, any>;
}

export interface DeckAnalysisMessage extends ServiceBusMessage {
  body: {
    deckId: string;
    userId: string;
    deckList: string;
    format: string;
    analysisType: 'competitive' | 'casual' | 'budget' | 'meta';
    priority: 'low' | 'normal' | 'high';
    requestedAt: Date;
  };
}

export interface NotificationMessage extends ServiceBusMessage {
  body: {
    userId: string;
    type: 'deck_analysis_complete' | 'deck_shared' | 'system_maintenance' | 'new_feature';
    title: string;
    message: string;
    data?: any;
    channels: ('email' | 'push' | 'in_app')[];
    priority: 'low' | 'normal' | 'high' | 'urgent';
  };
}

export interface ExportMessage extends ServiceBusMessage {
  body: {
    deckId: string;
    userId: string;
    format: 'json' | 'txt' | 'mtgo' | 'arena';
    destination: 'storage' | 'email' | 'download';
    options?: {
      includeAnalysis?: boolean;
      includePricing?: boolean;
      includeImages?: boolean;
    };
  };
}

export interface ImportMessage extends ServiceBusMessage {
  body: {
    userId: string;
    source: 'file' | 'url' | 'camera' | 'manual';
    data: string | Buffer;
    format?: string;
    metadata?: {
      fileName?: string;
      originalUrl?: string;
      confidence?: number;
    };
  };
}

export interface UserActivityMessage extends ServiceBusMessage {
  body: {
    userId: string;
    action: 'login' | 'logout' | 'deck_create' | 'deck_update' | 'deck_delete' | 'chat_start' | 'analysis_request';
    timestamp: Date;
    metadata?: {
      sessionId?: string;
      deckId?: string;
      ipAddress?: string;
      userAgent?: string;
    };
  };
}

export interface SystemEventMessage extends ServiceBusMessage {
  body: {
    eventType: 'service_start' | 'service_stop' | 'error' | 'warning' | 'maintenance';
    service: 'api' | 'openai' | 'cosmos' | 'storage' | 'servicebus';
    message: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    timestamp: Date;
    metadata?: any;
  };
}

export interface ServiceBusOptions {
  maxConcurrentCalls?: number;
  maxAutoRenewDuration?: number;
  receiveMode?: 'peekLock' | 'receiveAndDelete';
  sessionEnabled?: boolean;
  deadLetterOnMessageExpiration?: boolean;
  enableBatchedOperations?: boolean;
}

export interface MessageHandler<T extends ServiceBusMessage = ServiceBusMessage> {
  processMessage: (message: T) => Promise<void>;
  processError: (error: Error, context: any) => Promise<void>;
}

// ==================== AZURE KEY VAULT TYPES ====================

export interface KeyVaultSecret {
  name: string;
  value: string;
  version?: string;
  contentType?: string;
  tags?: Record<string, string>;
  enabled?: boolean;
  notBefore?: Date;
  expiresOn?: Date;
  createdOn?: Date;
  updatedOn?: Date;
}

export interface KeyVaultKey {
  name: string;
  keyType: 'RSA' | 'EC' | 'oct';
  keySize?: number;
  keyOps?: ('encrypt' | 'decrypt' | 'sign' | 'verify' | 'wrapKey' | 'unwrapKey')[];
  enabled?: boolean;
  notBefore?: Date;
  expiresOn?: Date;
  tags?: Record<string, string>;
}

export interface KeyVaultCertificate {
  name: string;
  certificatePolicy?: {
    issuerName: string;
    subject: string;
    subjectAlternativeNames?: {
      dnsNames?: string[];
      emails?: string[];
      upns?: string[];
    };
    keyType: 'RSA' | 'EC';
    keySize?: number;
    reuseKey?: boolean;
    exportable?: boolean;
    validityInMonths?: number;
  };
  enabled?: boolean;
  tags?: Record<string, string>;
}

export interface KeyVaultOptions {
  vaultUrl: string;
  credential?: any; // Azure credential
  apiVersion?: string;
  disableChallengeResourceVerification?: boolean;
}

export interface SecretBundle {
  secret: KeyVaultSecret;
  metadata: {
    recoveryLevel: string;
    attributes: {
      enabled: boolean;
      created: Date;
      updated: Date;
      recoveryLevel: string;
    };
  };
}

// ==================== AZURE COSMOS DB TYPES ====================

export interface CosmosDbOptions {
  endpoint: string;
  key: string;
  databaseId: string;
  consistencyLevel?: 'Strong' | 'BoundedStaleness' | 'Session' | 'ConsistentPrefix' | 'Eventual';
  connectionPolicy?: {
    requestTimeout?: number;
    mediaRequestTimeout?: number;
    enableEndpointDiscovery?: boolean;
    preferredLocations?: string[];
  };
}

export interface CosmosDbContainer {
  id: string;
  partitionKey: {
    paths: string[];
    kind?: 'Hash' | 'Range';
  };
  indexingPolicy?: {
    indexingMode: 'consistent' | 'lazy' | 'none';
    automatic: boolean;
    includedPaths?: { path: string }[];
    excludedPaths?: { path: string }[];
  };
  uniqueKeyPolicy?: {
    uniqueKeys: { paths: string[] }[];
  };
  conflictResolutionPolicy?: {
    mode: 'LastWriterWins' | 'Custom';
    conflictResolutionPath?: string;
    conflictResolutionProcedure?: string;
  };
  throughput?: number;
  maxThroughput?: number;
}

export interface CosmosDbQuery {
  query: string;
  parameters?: { name: string; value: any }[];
  options?: {
    enableCrossPartitionQuery?: boolean;
    maxItemCount?: number;
    continuationToken?: string;
    sessionToken?: string;
  };
}

export interface CosmosDbResponse<T = any> {
  resources: T[];
  requestCharge: number;
  activityId: string;
  statusCode: number;
  continuationToken?: string;
  sessionToken?: string;
}

// ==================== AZURE OPENAI TYPES ====================

export interface AzureOpenAIConfig {
  endpoint: string;
  apiKey: string;
  apiVersion: string;
  deploymentName: string;
  model: string;
  maxTokens: number;
  temperature: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

export interface AzureOpenAIDeployment {
  id: string;
  model: string;
  status: 'Creating' | 'Succeeded' | 'Failed';
  createdAt: Date;
  updatedAt: Date;
  scaleSettings: {
    scaleType: 'Standard' | 'Manual';
    capacity?: number;
  };
}

export interface AzureOpenAIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: {
    promptCost: number;
    completionCost: number;
    totalCost: number;
    currency: string;
  };
}

// ==================== AZURE MONITORING TYPES ====================

export interface AzureHealthCheck {
  service: 'openai' | 'cosmos' | 'storage' | 'servicebus' | 'keyvault';
  status: 'healthy' | 'unhealthy' | 'degraded';
  configured: boolean;
  lastChecked: Date;
  responseTime?: number;
  error?: string;
  details?: any;
}

export interface AzureMetrics {
  service: string;
  metrics: {
    requestCount: number;
    errorCount: number;
    averageResponseTime: number;
    throughput: number;
    availability: number;
  };
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface AzureAlert {
  id: string;
  name: string;
  description: string;
  severity: 'Critical' | 'Error' | 'Warning' | 'Informational';
  status: 'New' | 'Acknowledged' | 'Closed';
  firedDateTime: Date;
  resolvedDateTime?: Date;
  essentials: {
    alertRule: string;
    severity: string;
    signalType: string;
    monitorCondition: string;
    targetResource: string;
  };
}

// ==================== AZURE DEPLOYMENT TYPES ====================

export interface AzureDeploymentConfig {
  subscriptionId: string;
  resourceGroupName: string;
  location: string;
  environment: 'development' | 'staging' | 'production';
  tags: Record<string, string>;
  services: {
    appService?: {
      name: string;
      sku: string;
      runtime: string;
    };
    cosmosDb?: {
      accountName: string;
      databaseName: string;
      consistencyLevel: string;
    };
    storage?: {
      accountName: string;
      sku: string;
      kind: string;
    };
    openai?: {
      accountName: string;
      deployments: AzureOpenAIDeployment[];
    };
  };
}

export interface AzureResourceStatus {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  status: 'Running' | 'Stopped' | 'Starting' | 'Stopping' | 'Failed';
  location: string;
  tags: Record<string, string>;
  lastModified: Date;
  properties?: any;
}

// ==================== EXPORT TYPES ====================

export type AzureRegion = 'East US' | 'West US' | 'Central US' | 'North Europe' | 'West Europe' | 'Southeast Asia' | 'East Asia';
export type AzureServiceTier = 'Free' | 'Basic' | 'Standard' | 'Premium';
export type AzureEnvironment = 'development' | 'staging' | 'production';
export type AzureAuthMethod = 'key' | 'connectionString' | 'managedIdentity' | 'servicePrincipal';
